import { NextRequest, NextResponse } from 'next/server';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract as KreditContract, witnesses, type KreditPrivateState } from 'kredit-contract';

const ZK_ARTIFACTS_BASE_URL = process.env.ZK_ARTIFACTS_URL ?? '';
const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

export async function POST(req: NextRequest) {
  try {
    const { indexerUri, indexerWsUri, networkId, coinPublicKey, encryptionPublicKey } = await req.json();

    setNetworkId(networkId);

    const zkConfigProvider = new FetchZkConfigProvider(ZK_ARTIFACTS_BASE_URL);
    const proofProvider = httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider);
    const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);

    const compiledContract = new KreditContract<KreditPrivateState>(witnesses);

    const initialPrivateState: KreditPrivateState = {
      adminSecretKey: crypto.getRandomValues(new Uint8Array(32)),
      issuerSecretKey: crypto.getRandomValues(new Uint8Array(32)),
      holderSecretKey: crypto.getRandomValues(new Uint8Array(32)),
      score: BigInt(0),
      salt: crypto.getRandomValues(new Uint8Array(32)),
    };

    const adminId = new TextEncoder().encode('kredit-admin-001');

    const deployed = await deployContract(
      {
        zkConfigProvider,
        proofProvider,
        publicDataProvider,
        walletProvider: {
          balanceTx: async (tx: any) => tx,
          getCoinPublicKey: async () => coinPublicKey,
          getEncryptionPublicKey: async () => encryptionPublicKey,
        },
        midnightProvider: {
          submitTx: async () => 'pending',
        },
        privateStateProvider: {
          setContractAddress: async () => {},
          set: async () => {},
          get: async () => initialPrivateState,
          remove: async () => {},
          clear: async () => {},
          setSigningKey: async () => {},
          getSigningKey: async () => null,
          removeSigningKey: async () => {},
          clearSigningKeys: async () => {},
          exportPrivateStates: async () => ({}),
          importPrivateStates: async () => {},
          exportSigningKeys: async () => ({}),
          importSigningKeys: async () => {},
        },
      } as any,
      {
        compiledContract,
        privateStateId: 'kredit-main',
        initialPrivateState,
        args: [adminId],
      } as any,
    );

    const contractAddress = (deployed as any).contractAddress ?? 'unknown';

    return NextResponse.json({
      success: true,
      contractAddress,
      privateState: {
        adminSecretKey: Array.from(initialPrivateState.adminSecretKey),
        issuerSecretKey: Array.from(initialPrivateState.issuerSecretKey),
        holderSecretKey: Array.from(initialPrivateState.holderSecretKey),
        score: initialPrivateState.score.toString(),
        salt: Array.from(initialPrivateState.salt),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? String(err) },
      { status: 500 },
    );
  }
}
