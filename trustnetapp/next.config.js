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
      },
      {
        protocol: 'https',
        hostname: 'cdn.newsfirst.lk',
        pathname: '/**',
      },
      // Temporary wildcard pattern to allow all domains
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      }
    ],
    domains: ['media.giphy.com', 'www.newswire.lk'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable page-level code splitting
  experimental: {
    optimizeCss: false,
    scrollRestoration: true,
  },
  // Fix module resolution issues
  webpack: (config, { isServer }) => {
    // Fix LRU Cache module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Optimize chunk size
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    };

    return config;
  },
};

module.exports = nextConfig; 