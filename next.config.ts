import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React 19 Compiler for automatic optimizations
  experimental: {
    // React Compiler eliminates need for manual memoization
    reactCompiler: {
      compilationMode: 'all', // Enable for all components
    },

    // Partial Prerendering for hybrid static/dynamic rendering
    ppr: 'incremental',

    // Configure client router cache behavior
    staleTimes: {
      dynamic: 0,  // Don't cache dynamic pages by default
      static: 180, // Cache static pages for 3 minutes
    },


    // Enable Turbopack for development (can also use --turbo flag)
    // turbo: true,
  },

  // Optimize external package bundling
  bundlePagesRouterDependencies: true,
  serverExternalPackages: [
    // Add packages that should not be bundled server-side
    // Example: 'heavy-computation-package',
  ],

  // Image optimization configuration
  images: {
    // Use sharp for better performance (default in Next.js 15)
    formats: ['image/avif', 'image/webp'],
  },

  // TypeScript and ESLint for better DX
  typescript: {
    // Only for production builds, don't block during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Only for production builds, don't block during development
    ignoreDuringBuilds: false,
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
        ],
      },
    ]
  },

  // Webpack configuration for additional optimizations
  webpack: (config, { isServer }) => {
    // Enable webpack optimizations
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
            },
          },
        },
      }
    }
    return config
  },
};

export default nextConfig;
