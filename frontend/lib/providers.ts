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
  indexerPublicDataProvider: typeof import('@midnight-ntwrk/midnight-js-indexer-public-data-provider').indexerPublicDataProvider;
  createProofProvider: typeof import('@midnight-ntwrk/midnight-js-types').createProofProvider;
};

let _modules: LoadedModules | null = null;

async function loadModules(): Promise<LoadedModules> {
  if (_modules) return _modules;
  const [contracts, networkId, zkConfigMod, indexerMod, typesMod] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/midnight-js-network-id'),
    import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/midnight-js-types'),
  ]);
  _modules = {
    deployContract: contracts.deployContract,
    findDeployedContract: contracts.findDeployedContract,
    setNetworkId: networkId.setNetworkId,
    FetchZkConfigProvider: zkConfigMod.FetchZkConfigProvider,
    indexerPublicDataProvider: indexerMod.indexerPublicDataProvider,
    createProofProvider: typesMod.createProofProvider,
  };
  return _modules;
}

const ZK_ARTIFACTS_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ZK_ARTIFACTS_URL ?? '')
    : '';

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

  const walletProvingProvider = await connectedApi.getProvingProvider(keyMaterialProvider);
  const proofProvider = mods.createProofProvider(walletProvingProvider);
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

  const walletProvider = {
    balanceTx: (tx: UnboundTransaction) => {
      const serialized = tx.serialize();
      return connectedApi.balanceUnsealedTransaction(serialized as unknown as string, { payFees: true });
    },
    getCoinPublicKey: () => coinKey,
    getEncryptionPublicKey: () => encKey,
  };

  const midnightProvider = {
    submitTx: (tx: unknown) => connectedApi.submitTransaction(tx as unknown as string),
  };

  const privateStateProvider = {
    setContractAddress: async () => {},
    set: async (id: string, state: KreditPrivateState) => { _privateStateStorage.set(id, state); },
    get: async (id: string) => _privateStateStorage.get(id) ?? null,
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