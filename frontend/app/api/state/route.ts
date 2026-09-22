import { NextRequest, NextResponse } from 'next/server';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractAddress = searchParams.get('address');
    const indexerUri = searchParams.get('indexerUri');
    const indexerWsUri = searchParams.get('indexerWsUri');
    const networkId = searchParams.get('networkId');

    if (!contractAddress || !indexerUri || !indexerWsUri || !networkId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 },
      );
    }

    setNetworkId(networkId);

    const publicDataProvider = indexerPublicDataProvider(indexerUri, indexerWsUri);
    const state = await publicDataProvider.queryContractState(contractAddress);

    return NextResponse.json({ success: true, state });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}