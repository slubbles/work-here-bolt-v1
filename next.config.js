/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['algosdk', '@perawallet/connect'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Explicitly define page extensions for App Router only
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Webpack configuration to handle module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // CRITICAL FIX: Ensure only one instance of algosdk is loaded
    // This prevents the "TypeError: t.map is not a function" error in Pera Wallet
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force all algosdk imports to resolve to the same instance
      'algosdk': require.resolve('algosdk'),
    };

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
    };

    // Make Buffer globally available
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Handle .mjs files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Additional optimization for algosdk compatibility
    config.module.rules.push({
      test: /node_modules\/algosdk\/.*\.js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

module.exports = nextConfig;