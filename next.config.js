/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['algosdk', '@perawallet/connect'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly define page extensions for App Router only
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Experimental features for better Algorand integration
  experimental: {
    esmExternals: true,
  },
  // Webpack configuration to handle module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Don't externalize algosdk and pera wallet for client-side
    if (!isServer) {
      // Remove problematic externals that were causing issues
      config.externals = config.externals || [];
    }
    
    // Add polyfills for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
      fs: false,
      net: false,
      tls: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      // Additional fallbacks for Algorand SDK
      url: require.resolve('url'),
      querystring: require.resolve('querystring-es3'),
    };

    // Make Buffer globally available
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );
    
    // Optimize for Algorand SDK
    config.optimization = config.optimization || {};
    config.optimization.sideEffects = false;

    return config;
  },
};

module.exports = nextConfig;