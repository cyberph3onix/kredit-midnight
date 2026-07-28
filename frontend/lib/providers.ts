'use client';

import type { Configuration, ConnectedAPI, KeyMaterialProvider } from '@midnight-ntwrk/dapp-connector-api';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';

const ZK_ARTIFACTS_BASE_URL =
  process.env.NEXT_PUBLIC_ZK_ARTIFACTS_URL ?? 'http://localhost:3100';
const PRIVATE_STATE_ID = 'kredit-main';

let FetchZkConfigProviderClass: any = null;
let httpClientProofProviderFn: any = null;
let indexerPublicDataProviderFn: any = null;
let deployContractFn: any = null;
let findDeployedContractFn: any = null;
let setNetworkIdFn: any = null;

async function loadModules() {
  if (FetchZkConfigProviderClass) return;
  [
    { FetchZkConfigProvider: FetchZkConfigProviderClass },
    { httpClientProofProvider: httpClientProofProviderFn },
    { indexerPublicDataProvider: indexerPublicDataProviderFn },
  ] = await Promise.all([
    import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider'),
    import('@midnight-ntwrk/midnight-js-http-client-proof-provider'),
    import('@midnight-ntwrk/midnight-js-indexer-public-data-provider'),
  ]);
  const contracts = await import('@midnight-ntwrk/midnight-js-contracts');
  deployContractFn = contracts.deployContract;
  findDeployedContractFn = contracts.findDeployedContract;
  const networkId = await import('@midnight-ntwrk/midnight-js-network-id');
  setNetworkIdFn = networkId.setNetworkId;
}

export type KreditCircuitName =
  | 'rotateAdmin'
  | 'registerIssuer'
  | 'unregisterIssuer'
  | 'issueCredential'
  | 'revokeCredential'
  | 'proveEligibility'
  | 'proveNotRevoked';

export async function createProviders(connectedApi: ConnectedAPI): Promise<MidnightProviders> {
  await loadModules();

  const config: Configuration = await connectedApi.getConfiguration();

  if (setNetworkIdFn) {
    setNetworkIdFn(config.networkId);
  }

  const zkConfigProvider = new FetchZkConfigProviderClass(ZK_ARTIFACTS_BASE_URL);

  const keyMaterialProvider: KeyMaterialProvider = {
    getZKIR: (circuitId: string) => zkConfigProvider.getZKIR(circuitId),
    getProverKey: (circuitId: string) => zkConfigProvider.getProverKey(circuitId),
    getVerifierKey: (circuitId: string) => zkConfigProvider.getVerifierKey(circuitId),
  };

  const provingProvider = await connectedApi.getProvingProvider(keyMaterialProvider);

  const proofProvider = httpClientProofProviderFn(
    config.proverServerUri ?? 'http://localhost:6300',
    zkConfigProvider,
  );

  const publicDataProvider = indexerPublicDataProviderFn(
    config.indexerUri,
    config.indexerWsUri,
  );

  const { shieldedCoinPublicKey, shieldedEncryptionPublicKey } =
    await connectedApi.getShieldedAddresses();

  const walletProvider = {
    balanceTx: (tx: any, ttl?: number) =>
      connectedApi.balanceUnsealedTransaction(tx, { payFees: true }),
    getCoinPublicKey: async () => shieldedCoinPublicKey,
    getEncryptionPublicKey: async () => shieldedEncryptionPublicKey,
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
  initialPrivateState: any,
) {
  await loadModules();
  const providers = await createProviders(connectedApi);
  const { Contract: KreditContract, witnesses } = await import('kredit-contract');

  const compiledContract = new KreditContract(witnesses);

  return deployContractFn(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState,
    args: [adminId],
  });
}

export async function findKreditContract(
  connectedApi: ConnectedAPI,
  contractAddress: string,
) {
  await loadModules();
  const providers = await createProviders(connectedApi);
  const { Contract: KreditContract, witnesses } = await import('kredit-contract');

  const compiledContract = new KreditContract(witnesses);

  return findDeployedContractFn(providers, {
    compiledContract,
    contractAddress,
    privateStateId: PRIVATE_STATE_ID,
  });
}

export async function getConfig(connectedApi: ConnectedAPI): Promise<Configuration> {
  return connectedApi.getConfiguration();
}
