'use client';

import type { Configuration, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type {
  KeyMaterialProvider,
  MidnightProviders,
  PrivateStateId,
  UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import type { KreditCircuitName, KreditPrivateState } from 'kredit-api';
import type { CompiledContract } from '@midnight-ntwrk/compact-js';
import { loadPrivateState, savePrivateState } from './prover';

export type KreditContractHandle = {
  callTx: {
    registerIssuer(issuerId: Uint8Array): Promise<unknown>;
    unregisterIssuer(issuerId: Uint8Array): Promise<unknown>;
    issueCredential(subject: Uint8Array): Promise<unknown>;
    revokeCredential(subject: Uint8Array): Promise<unknown>;
    proveEligibility(threshold: bigint): Promise<unknown>;
    proveNotRevoked(): Promise<unknown>;
    rotateAdmin(newAdmin: Uint8Array): Promise<unknown>;
  };
};

type LoadedModules = {
  deployContract: typeof import('@midnight-ntwrk/midnight-js-contracts').deployContract;
  findDeployedContract: typeof import('@midnight-ntwrk/midnight-js-contracts').findDeployedContract;
  setNetworkId: typeof import('@midnight-ntwrk/midnight-js-network-id').setNetworkId;
  FetchZkConfigProvider: typeof import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider').FetchZkConfigProvider;
  httpClientProofProvider: typeof import('@midnight-ntwrk/midnight-js-http-client-proof-provider').httpClientProofProvider;
  indexerPublicDataProvider: typeof import('@midnight-ntwrk/midnight-js-indexer-public-data-provider').indexerPublicDataProvider;
  createProofProvider: typeof import('@midnight-ntwrk/midnight-js-types').createProofProvider;
  Transaction: typeof import('@midnight-ntwrk/ledger-v8').Transaction;
};

let _modules: LoadedModules | null = null;

// Serializes anything (plain objects from the wallet, BigInts, byte arrays)
// so errors are readable instead of "[object Object]".
export function stringifyError(value: unknown): string {
  if (value instanceof Error) {
    const extra = Object.fromEntries(Object.entries(value));
    const base = `${value.name}: ${value.message}`;
    const rest = Object.keys(extra).length ? ` ${stringifyError(extra)}` : '';
    const cause = (value as Error & { cause?: unknown }).cause
      ? ` (cause: ${stringifyError((value as Error & { cause?: unknown }).cause)})`
      : '';
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

async function loadModules(): Promise<LoadedModules> {
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

// FetchZkConfigProvider does `new URL(baseURL)` with no base argument, so an
// empty string throws "Failed to construct 'URL': Invalid URL" instead of
// resolving same-origin. Fall back to window.location.origin explicitly.
const ZK_ARTIFACTS_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ZK_ARTIFACTS_URL || window.location.origin)
    : '';

const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

const _privateStateStorage = new Map<string, KreditPrivateState>();
const _signingKeyStorage = new Map<string, Uint8Array>();

async function createProviders(connectedApi: ConnectedAPI) {
  const mods = await loadModules();
  const config: Configuration = await connectedApi.getConfiguration();
  mods.setNetworkId(config.networkId);

  const zkConfigProvider = new mods.FetchZkConfigProvider(ZK_ARTIFACTS_BASE_URL, globalThis.fetch.bind(globalThis));

  const keyMaterialProvider: KeyMaterialProvider = {
    getZKIR: (keyLocation: string) => zkConfigProvider.getZKIR(keyLocation),
    getProverKey: (keyLocation: string) => zkConfigProvider.getProverKey(keyLocation),
    getVerifierKey: (keyLocation: string) => zkConfigProvider.getVerifierKey(keyLocation),
  };

  // Prefer delegating proofs to the wallet; fall back to a proof server for
  // wallets whose connector doesn't expose getProvingProvider.
  let baseProofProvider;
  const connectedWithProving = connectedApi as ConnectedAPI & {
    getProvingProvider?: (km: KeyMaterialProvider) => Promise<unknown>;
  };
  if (typeof connectedWithProving.getProvingProvider === 'function') {
    const walletProvingProvider = await connectedWithProving.getProvingProvider(keyMaterialProvider) as never;
    baseProofProvider = mods.createProofProvider(walletProvingProvider);
  } else {
    const proofServerUrl = config.proverServerUri ?? PROOF_SERVER_URL;
    console.warn(`[Kredit] Wallet has no getProvingProvider; using proof server at ${proofServerUrl}`);
    baseProofProvider = mods.httpClientProofProvider(proofServerUrl, zkConfigProvider);
  }
  const proofProvider = {
    proveTx: (tx: Parameters<typeof baseProofProvider.proveTx>[0]) =>
      stage('Proving transaction', () => baseProofProvider.proveTx(tx)),
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
      'Make sure the Lace wallet has shielded keys initialized on the Preprod network.'
    );
  }

  if (!encKey || typeof encKey !== 'string' || encKey.length < 10) {
    throw new Error(
      'Wallet encryption public key is not available. ' +
      'Make sure the Lace wallet has shielded keys initialized on the Preprod network.'
    );
  }

  // The DApp connector exchanges transactions as hex strings, while midnight-js
  // expects ledger Transaction objects, so convert in both directions.
  const walletProvider = {
    balanceTx: async (tx: UnboundTransaction) => {
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
    submitTx: async (tx: UnboundTransaction) => {
      await stage('Submitting transaction via wallet', () =>
        connectedApi.submitTransaction(toHex(tx.serialize())),
      );
      const txId = tx.identifiers()[0];
      console.log('[Kredit] Submitted, waiting for indexer confirmation of', txId);
      return txId;
    },
  };

  const privateStateProvider = {
    setContractAddress: async () => {},
    set: async (id: string, state: KreditPrivateState) => { _privateStateStorage.set(id, state); },
    get: async (id: string) => _privateStateStorage.get(id) ?? (id === 'kredit-main' ? loadPrivateState() : null),
    remove: async (id: string) => { _privateStateStorage.delete(id); },
    clear: async () => { _privateStateStorage.clear(); },
    setSigningKey: async (addr: string, key: Uint8Array) => { _signingKeyStorage.set(addr, key); },
    getSigningKey: async (addr: string) => _signingKeyStorage.get(addr) ?? null,
    removeSigningKey: async (addr: string) => { _signingKeyStorage.delete(addr); },
    clearSigningKeys: async () => { _signingKeyStorage.clear(); },
    exportPrivateStates: async () => ({}),
    importPrivateStates: async () => ({}),
    exportSigningKeys: async () => ({}),
    importSigningKeys: async () => ({}),
  };

  return {
    zkConfigProvider,
    proofProvider,
    publicDataProvider,
    walletProvider,
    midnightProvider,
    privateStateProvider,
  } as unknown as MidnightProviders<KreditCircuitName, PrivateStateId, KreditPrivateState>;
}

export async function deployKreditContract(
  connectedApi: ConnectedAPI,
  adminId: Uint8Array,
) {
  const mods = await loadModules();
  const providers = await createProviders(connectedApi);
  const { Contract: KreditContract, witnesses } = await import('kredit-contract');
  const { CompiledContract } = await import('@midnight-ntwrk/compact-js');

  const compiledContract = makeKreditCompiledContract(KreditContract, witnesses, CompiledContract);

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
    contractAddress: deployed.deployTxData.public.contractAddress ?? 'unknown',
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

  const compiledContract = makeKreditCompiledContract(KreditContract, witnesses, CompiledContract);

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

function makeKreditCompiledContract(
  contract: typeof import('kredit-contract').Contract,
  witnesses: import('kredit-contract').Witnesses<KreditPrivateState>,
  compiledContractModule: typeof import('@midnight-ntwrk/compact-js')['CompiledContract'],
): CompiledContract.CompiledContract<import('kredit-contract').Contract, KreditPrivateState, never> {
  return compiledContractModule.withWitnesses(
    compiledContractModule.make('kredit', contract),
    witnesses,
  ) as unknown as CompiledContract.CompiledContract<import('kredit-contract').Contract, KreditPrivateState, never>;
}