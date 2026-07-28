import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'isomorphic-ws',
    'ws',
  ],
};

export default nextConfig;
