import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@edu-platform/shared'],
  reactStrictMode: true,
  output: 'standalone',
};

export default nextConfig;
