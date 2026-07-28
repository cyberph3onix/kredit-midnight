import { NextRequest, NextResponse } from 'next/server';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { Contract as KreditContract, witnesses, type KreditPrivateState } from 'kredit-contract';

const ZK_ARTIFACTS_BASE_URL = process.env.ZK_ARTIFACTS_URL ?? '';
const PROOF_SERVER_URL = process.env.PROOF_SERVER_URL ?? 'http://localhost:6300';

export async function POST(req: NextRequest) {
  try {
    const {
      circuit,
      args,
      contractAddress,
      indexerUri,
      indexerWsUri,
      networkId,
      coinPublicKey,
      encryptionPublicKey,
      privateState,
    } = await req.json();

    setNetworkId(networkId);

    const zkConfigProvider = new FetchZkConfigProvider(ZK_ARTIFACTS_BASE_URL);
    const proofProvider = httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider);
    const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);

    const compiledContract = new KreditContract<KreditPrivateState>(witnesses);

    const ps: KreditPrivateState = {
      adminSecretKey: Uint8Array.from(privateState.adminSecretKey),
      issuerSecretKey: Uint8Array.from(privateState.issuerSecretKey),
      holderSecretKey: Uint8Array.from(privateState.holderSecretKey),
      score: BigInt(privateState.score),
      salt: Uint8Array.from(privateState.salt),
    };

    const found = await findDeployedContract(
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
          get: async () => ps,
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
        contractAddress,
        privateStateId: 'kredit-main',
      } as any,
    );

    let result;
    const callTx = found.callTx as any;

    switch (circuit) {
      case 'registerIssuer':
        result = await callTx.registerIssuer(Uint8Array.from(args.issuerId));
        break;
      case 'unregisterIssuer':
        result = await callTx.unregisterIssuer(Uint8Array.from(args.issuerId));
        break;
      case 'issueCredential':
        result = await callTx.issueCredential(Uint8Array.from(args.subject));
        break;
      case 'revokeCredential':
        result = await callTx.revokeCredential(Uint8Array.from(args.subject));
        break;
      case 'proveEligibility':
        result = await callTx.proveEligibility(BigInt(args.threshold));
        break;
      case 'proveNotRevoked':
        result = await callTx.proveNotRevoked();
        break;
      case 'rotateAdmin':
        result = await callTx.rotateAdmin(Uint8Array.from(args.newAdmin));
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Unknown circuit: ${circuit}` },
          { status: 400 },
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message ?? String(err) },
      { status: 500 },
    );
  }
}
