/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include discord.js in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'discord.js': false,
        'zlib-sync': false,
        'bufferutil': false,
        'utf-8-validate': false,
      };
    } else {
      // On server side, mark native modules as external
      config.externals = [...(config.externals || []), 
        'zlib-sync',
        'bufferutil',
        'utf-8-validate'
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
};

export default nextConfig; 