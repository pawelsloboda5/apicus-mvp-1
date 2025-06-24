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

    // Enable optimizePackageImports for better bundling
    optimizePackageImports: [
      '@xyflow/react',
      'lucide-react',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-sheet',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
    ],

    // Configure client router cache behavior
    staleTimes: {
      dynamic: 30,  // Cache dynamic pages for 30 seconds
      static: 180, // Cache static pages for 3 minutes
    },

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
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
  webpack: (config, { dev, isServer }) => {
    // Enable webpack optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Remove conflicting optimizations that cause issues with Next.js 15.4
    // The usedExports option conflicts with Next.js's cacheUnaffected feature
    
    // Only apply non-conflicting optimizations
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        // Remove usedExports as it conflicts with cacheUnaffected
        // usedExports: true, // REMOVED - causes error
        sideEffects: false,
        // Keep module concatenation for smaller bundles
        concatenateModules: true,
      };
    }

    return config
  },

  // Enable compression
  compress: true,

  // Enable modern JS for faster parsing
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
};

export default nextConfig;
