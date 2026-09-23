'use client';

import type { Configuration, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { KreditPrivateState } from 'kredit-contract';
import { loadPrivateState, savePrivateState } from './prover';

export type KreditCircuitName =
  | 'rotateAdmin'
  | 'registerIssuer'
  | 'unregisterIssuer'
  | 'issueCredential'
  | 'revokeCredential'
  | 'proveEligibility'
  | 'proveNotRevoked';

let _modules: any = null;

// Serializes anything (plain objects from the wallet, BigInts, byte arrays)
// so errors are readable instead of "[object Object]".
export function stringifyError(value: unknown): string {
  if (value instanceof Error) {
    const extra = Object.fromEntries(Object.entries(value));
    const base = `${value.name}: ${value.message}`;
    const rest = Object.keys(extra).length ? ` ${stringifyError(extra)}` : '';
    const cause = (value as any).cause ? ` (cause: ${stringifyError((value as any).cause)})` : '';
    return base + rest + cause;
  }
  try {
    return JSON.stringify(value, (_k, v) =>
      typeof v === 'bigint' ? v.toString() : v instanceof Uint8Array ? `0x${toHex(v)}` : v);
  } catch {
    return String(value);
  }
}

async function stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
  console.log(`[Kredit] ${name}...`);
  try {
    return await fn();
  } catch (err) {
    console.error(`[Kredit] ${name} failed:`, err);
    const details = stringifyError(err);
    if (details.includes('could not balance dust')) {
      throw new Error(
        'Your wallet has no DUST to pay transaction fees. In Lace, get tNIGHT from the ' +
        'Preview faucet, designate it for DUST generation, wait for DUST to accrue, then retry.',
        { cause: err },
      );
    }
    throw new Error(`${name} failed: ${details}`, { cause: err });
  }
}

const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string) =>
  Uint8Array.from(hex.replace(/^0x/, '').match(/.{2}/g) ?? [], (b) => parseInt(b, 16));

async function loadModules() {
  if (_modules) return _modules;
  const [contracts, networkId, zkConfigMod, proofMod, indexerMod, typesMod, ledger] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/midnight-js-network-id'),
    import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/midnight-js-types'),
    import('@midnight-ntwrk/ledger-v8'),
  ]);
  _modules = {
    deployContract: contracts.deployContract,
    findDeployedContract: contracts.findDeployedContract,
    setNetworkId: networkId.setNetworkId,
    FetchZkConfigProvider: zkConfigMod.FetchZkConfigProvider,
    httpClientProofProvider: proofMod.httpClientProofProvider,
    indexerPublicDataProvider: indexerMod.indexerPublicDataProvider,
    createProofProvider: typesMod.createProofProvider,
    Transaction: ledger.Transaction,
  };
  return _modules;
}

const ZK_ARTIFACTS_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ZK_ARTIFACTS_URL ?? '')
    : '';
const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

const _privateStateStorage = new Map<string, any>();
const _signingKeyStorage = new Map<string, any>();

async function createProviders(connectedApi: ConnectedAPI) {
  const mods = await loadModules();
  const config: Configuration = await connectedApi.getConfiguration();
  mods.setNetworkId(config.networkId);

  const zkConfigProvider = new mods.FetchZkConfigProvider(ZK_ARTIFACTS_BASE_URL, globalThis.fetch.bind(globalThis));

  const keyMaterialProvider = {
    getZKIR: (keyLocation: string) => zkConfigProvider.getZKIR(keyLocation),
    getProverKey: (keyLocation: string) => zkConfigProvider.getProverKey(keyLocation),
    getVerifierKey: (keyLocation: string) => zkConfigProvider.getVerifierKey(keyLocation),
  };

  // Prefer delegating proofs to the wallet; fall back to a proof server for
  // wallets whose connector doesn't expose getProvingProvider.
  let baseProofProvider;
  if (typeof (connectedApi as any).getProvingProvider === 'function') {
    const walletProvingProvider = await connectedApi.getProvingProvider(keyMaterialProvider);
    baseProofProvider = mods.createProofProvider(walletProvingProvider);
  } else {
    const proofServerUrl = config.proverServerUri ?? PROOF_SERVER_URL;
    console.warn(`[Kredit] Wallet has no getProvingProvider; using proof server at ${proofServerUrl}`);
    baseProofProvider = mods.httpClientProofProvider(proofServerUrl, zkConfigProvider);
  }
  const proofProvider = {
    proveTx: (tx: any) => stage('Proving transaction', () => baseProofProvider.proveTx(tx)),
  };
  const publicDataProvider = mods.indexerPublicDataProvider(config.indexerUri, config.indexerWsUri);

  let addrs;
  try {
    addrs = await connectedApi.getShieldedAddresses();
  } catch (err) {
    throw new Error('Failed to get shielded addresses: ' + String(err));
  }

  const coinKey = addrs?.shieldedCoinPublicKey;
  const encKey = addrs?.shieldedEncryptionPublicKey;

  if (!coinKey || typeof coinKey !== 'string' || coinKey.length < 10) {
    throw new Error(
      'Wallet shielded coin public key is not available. ' +
      'Make sure the Lace wallet has shielded keys initialized on the Preview network.'
    );
  }

  if (!encKey || typeof encKey !== 'string' || encKey.length < 10) {
    throw new Error(
      'Wallet encryption public key is not available. ' +
      'Make sure the Lace wallet has shielded keys initialized on the Preview network.'
    );
  }


  // The DApp connector exchanges transactions as hex strings, while midnight-js
  // expects ledger Transaction objects, so convert in both directions.
  const walletProvider = {
    balanceTx: async (tx: any) => {
      const { tx: balancedHex } = await stage('Balancing/signing in wallet', () =>
        connectedApi.balanceUnsealedTransaction(toHex(tx.serialize()), { payFees: true }),
      ).catch(async (err) => {
        if (!String(err?.message).includes('no DUST')) throw err;
        const dust = await connectedApi.getDustBalance().catch(() => null);
        const report = dust
          ? ` Wallet reports DUST balance ${dust.balance} (cap ${dust.cap}) on network "${config.networkId}".`
          : '';
        throw new Error(err.message + report, { cause: err.cause });
      });
      return stage('Deserializing balanced transaction', async () =>
        mods.Transaction.deserialize('signature', 'proof', 'binding', fromHex(balancedHex)),
      );
    },
    getCoinPublicKey: () => coinKey,
    getEncryptionPublicKey: () => encKey,
  };

  const midnightProvider = {
    submitTx: async (tx: any) => {
      await stage('Submitting transaction via wallet', () =>
        connectedApi.submitTransaction(toHex(tx.serialize())),
      );
      const txId = tx.identifiers()[0];
      console.log('[Kredit] Submitted, waiting for indexer confirmation of', txId);
      return txId;
    },
  };

  const storage = _privateStateStorage;
  const signingKeys = _signingKeyStorage;
  const privateStateProvider = {
    setContractAddress: async () => {},
    set: async (id: string, state: any) => { storage.set(id, state); },
    get: async (id: string) => storage.get(id) ?? (id === 'kredit-main' ? loadPrivateState() : null),
    remove: async (id: string) => { storage.delete(id); },
    clear: async () => { storage.clear(); },
    setSigningKey: async (addr: string, key: any) => { signingKeys.set(addr, key); },
    getSigningKey: async (addr: string) => signingKeys.get(addr) ?? null,
    removeSigningKey: async (addr: string) => { signingKeys.delete(addr); },
    clearSigningKeys: async () => { signingKeys.clear(); },
    exportPrivateStates: async () => ({}),
    importPrivateStates: async () => {},
    exportSigningKeys: async () => ({}),
    importSigningKeys: async () => {},
  };

  return {
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider: walletProvider as any,
    midnightProvider: midnightProvider as any,
    privateStateProvider: privateStateProvider as any,
  };
}

export async function deployKreditContract(
  connectedApi: ConnectedAPI,
  adminId: Uint8Array,
  _initialPrivateState: any,
) {
  const mods = await loadModules();
  const providers = await createProviders(connectedApi);
  const { Contract: KreditContract, witnesses } = await import('kredit-contract');
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');

  const compiledContract = CompiledContract.withWitnesses(
    CompiledContract.make('kredit', KreditContract),
    witnesses,
  );

  const initialPrivateState = {
    adminSecretKey: crypto.getRandomValues(new Uint8Array(32)),
    issuerSecretKey: crypto.getRandomValues(new Uint8Array(32)),
    holderSecretKey: crypto.getRandomValues(new Uint8Array(32)),
    score: BigInt(0),
    salt: crypto.getRandomValues(new Uint8Array(32)),
  };

  const deployed = await mods.deployContract(providers, {
    compiledContract,
    privateStateId: 'kredit-main',
    initialPrivateState,
    args: [adminId],
  });

  savePrivateState(initialPrivateState);

  return {
    contractAddress: deployed.deployTxData.public.contractAddress,
    privateState: {
      adminSecretKey: Array.from(initialPrivateState.adminSecretKey),
      issuerSecretKey: Array.from(initialPrivateState.issuerSecretKey),
      holderSecretKey: Array.from(initialPrivateState.holderSecretKey),
      score: initialPrivateState.score.toString(),
      salt: Array.from(initialPrivateState.salt),
    },
  };
}

export async function findKreditContract(
  connectedApi: ConnectedAPI,
  contractAddress: string,
) {
  const mods = await loadModules();
  const providers = await createProviders(connectedApi);
  const { Contract: KreditContract, witnesses } = await import('kredit-contract');
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');

  const compiledContract = CompiledContract.withWitnesses(
    CompiledContract.make('kredit', KreditContract),
    witnesses,
  );

  const found = await mods.findDeployedContract(providers, {
    compiledContract,
    contractAddress,
    privateStateId: 'kredit-main',
  });

  return found;
}

// Patches the private state used by circuit witnesses, in memory and in localStorage.
export function updatePrivateState(patch: Partial<KreditPrivateState>) {
  const current = _privateStateStorage.get('kredit-main') ?? loadPrivateState();
  if (!current) throw new Error('No private state in this browser. Deploy the contract from this browser first.');
  const next = { ...current, ...patch };
  _privateStateStorage.set('kredit-main', next);
  savePrivateState(next);
}

export async function getConfig(connectedApi: ConnectedAPI): Promise<Configuration> {
  return connectedApi.getConfiguration();
}
