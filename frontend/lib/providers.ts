'use client';

import type { Configuration, ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

export type KreditCircuitName =
  | 'rotateAdmin'
  | 'registerIssuer'
  | 'unregisterIssuer'
  | 'issueCredential'
  | 'revokeCredential'
  | 'proveEligibility'
  | 'proveNotRevoked';

let _modules: any = null;

async function loadModules() {
  if (_modules) return _modules;
  const [contracts, networkId, zkConfigMod, proofMod, indexerMod, typesMod] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/midnight-js-network-id'),
    import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
    import('@midnight-ntwrk/midnight-js-types'),
  ]);
  _modules = {
    deployContract: contracts.deployContract,
    findDeployedContract: contracts.findDeployedContract,
    setNetworkId: networkId.setNetworkId,
    FetchZkConfigProvider: zkConfigMod.FetchZkConfigProvider,
    httpClientProofProvider: proofMod.httpClientProofProvider,
    indexerPublicDataProvider: indexerMod.indexerPublicDataProvider,
    createProofProvider: typesMod.createProofProvider,
  };
  return _modules;
}

const ZK_ARTIFACTS_BASE_URL =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ZK_ARTIFACTS_URL ?? '')
    : '';
const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

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
    balanceTx: (tx: any) => {
      const bytes = tx.serialize();
      return connectedApi.balanceUnsealedTransaction(bytes as any, { payFees: true });
    },
    getCoinPublicKey: () => coinKey,
    getEncryptionPublicKey: () => encKey,
  };

  const midnightProvider = {
    submitTx: (tx: any) => connectedApi.submitTransaction(tx),
  };

  const storage = new Map<string, any>();
  const privateStateProvider = {
    setContractAddress: async () => {},
    set: async (id: string, state: any) => { storage.set(id, state); },
    get: async (id: string) => storage.get(id) ?? null,
    remove: async (id: string) => { storage.delete(id); },
    clear: async () => { storage.clear(); },
    setSigningKey: async () => {},
    getSigningKey: async () => null,
    removeSigningKey: async () => {},
    clearSigningKeys: async () => {},
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

  const compiledContract = new KreditContract(witnesses);

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
    contractAddress: (deployed as any).contractAddress ?? 'unknown',
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

  const compiledContract = new KreditContract(witnesses);

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
