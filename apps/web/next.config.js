/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@shieldnest/shared'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    // Supabase public keys can be exposed
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Coreum chain config
    NEXT_PUBLIC_COREUM_CHAIN_ID: process.env.NEXT_PUBLIC_COREUM_CHAIN_ID || 'coreum-mainnet-1',
    NEXT_PUBLIC_COREUM_RPC: process.env.NEXT_PUBLIC_COREUM_RPC || 'https://full-node.mainnet-1.coreum.dev:26657',
    NEXT_PUBLIC_COREUM_REST: process.env.NEXT_PUBLIC_COREUM_REST || 'https://full-node.mainnet-1.coreum.dev:1317',
    // Sentry
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
