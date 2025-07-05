/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  poweredByHeader: false,
  reactStrictMode: false,
  swcMinify: true,
  optimizeFonts: true,
  images: {
    domains: ['api.dicebear.com', 'images.unsplash.com'],
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },    
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    optimizeCss: false,
    scrollRestoration: false,
    forceSwcTransforms: true,
  },
  // Simplified webpack configuration
  webpack: (config, { webpack, isServer }) => {
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
      encoding: false,
      'pino-pretty': false,
    };

    // Make Buffer and process globally available
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    // Ignore problematic modules for client-side bundles
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        ws: false,
        'pino-pretty': false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;