const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['domains.facesome.com'],
    unoptimized: true,
  },
  output: 'export',
  distDir: 'out',
  experimental: {
    optimizeCss: true,
  },
};

module.exports = withPWA(nextConfig); 