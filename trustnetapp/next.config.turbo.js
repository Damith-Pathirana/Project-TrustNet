/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ichef.bbci.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.bbci.co.uk',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.newswire.lk',
        pathname: '/**',
      }
    ],
    domains: ['media.giphy.com', 'www.newswire.lk'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Enable page-level code splitting
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
};

module.exports = nextConfig; 