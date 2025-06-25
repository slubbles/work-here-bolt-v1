/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  optimizeFonts: true,
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Fix for Solana wallet adapters
  transpilePackages: [
    'algosdk', 
    '@perawallet/connect',
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
    '@solana/wallet-adapter-phantom',
    '@solana/wallet-adapter-solflare',
    '@solana/wallet-adapter-backpack',
    '@solana/web3.js',
    '@solana/spl-token',
    '@coral-xyz/anchor'
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Explicitly define page extensions for App Router only
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: true,
    scrollRestoration: true,
    // Enable SWC for faster builds
    forceSwcTransforms: true,
  },
  // Enhanced webpack configuration to handle Solana modules
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Fix for import.meta usage in Solana wallet adapters
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    // Don't externalize wallet adapter modules on client side
    if (!isServer) {
      config.externals = config.externals.filter(
        (external) => typeof external !== 'string' || !external.includes('@solana')
      );
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

    // Make Buffer and process globally available
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Handle import.meta for wallet adapters
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta': {
          env: JSON.stringify(process.env),
          webpackHot: 'undefined',
        },
      })
    );
    
    // Optimize for better performance
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
    };

    // Ignore specific modules that cause issues
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fix for wallet adapter modules
      '@solana/wallet-adapter-base': require.resolve('@solana/wallet-adapter-base'),
      '@solana/wallet-adapter-react': require.resolve('@solana/wallet-adapter-react'),
      '@solana/wallet-adapter-react-ui': require.resolve('@solana/wallet-adapter-react-ui'),
    };
    
    // Add bundle analyzer in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
};

module.exports = nextConfig;