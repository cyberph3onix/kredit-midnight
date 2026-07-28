import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'isomorphic-ws',
    'ws',
    '@midnight-ntwrk/compact-runtime',
    '@midnight-ntwrk/compact-js',
    '@midnight-ntwrk/onchain-runtime',
    '@midnight-ntwrk/midnight-js-contracts',
    '@midnight-ntwrk/midnight-js-fetch-zk-config-provider',
    '@midnight-ntwrk/midnight-js-http-client-proof-provider',
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider',
    '@midnight-ntwrk/midnight-js-network-id',
    '@midnight-ntwrk/midnight-js-types',
    '@midnight-ntwrk/midnight-js-utils',
    '@midnight-ntwrk/dapp-connector-api',
    '@midnight-ntwrk/ledger-v8',
  ],
  turbopack: {
    resolveAlias: {
      'isomorphic-ws': './isomorphic-ws-shim.js',
    },
  },
};

export default nextConfig;
