import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    agentFeedback: true,
    cachedNavigations: false,
    reactDebugChannel: false,
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
