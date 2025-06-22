/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['algosdk', '@perawallet/connect'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly define page extensions for App Router only
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Webpack configuration to handle module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
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

    return config;
  },
};

module.exports = nextConfig;