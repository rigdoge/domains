const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/domains\.facesome\.com\/_next\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    }
  ],
  buildExcludes: [/app-build-manifest.json$/]
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
    // optimizeCss: true,
  },
};

module.exports = withPWA(nextConfig); 