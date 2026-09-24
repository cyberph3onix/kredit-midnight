import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Lets the dev server accept requests when opened via a LAN address
  // (e.g. `next dev --hostname 0.0.0.0` then browsing to http://192.168.x.x:3000)
  // instead of localhost. Without this, Next.js blocks cross-origin requests to
  // dev-only assets/HMR, the page never finishes hydrating, and no click handlers
  // (including "Connect wallet") work at all.
  allowedDevOrigins: ['192.168.0.*', '192.168.1.*', '10.0.0.*'],
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
    root: path.resolve(process.cwd(), '..'),
    resolveAlias: {
      'isomorphic-ws': './isomorphic-ws-shim.js',
    },
  },
};

export default nextConfig;