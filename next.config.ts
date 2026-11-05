import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['three'],
  eslint: {
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
