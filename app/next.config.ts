import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
  // Webpack fallback for WASM support (used when --webpack flag)
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    config.module?.rules?.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
  // COOP/COEP headers required for SharedArrayBuffer (PowerSync WASM)
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'credentialless',
        },
      ],
    },
  ],
};

export default nextConfig;
