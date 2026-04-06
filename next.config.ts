import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  
  // Disable typed routes for faster compilation
  typedRoutes: false,
  
  // Optimize compilation performance
  experimental: {
    // Speed up Fast Refresh and reduce bundle size
    optimizePackageImports: [
      '@heroicons/react',
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-slot',
      'viem',
      'wagmi',
    ],
    // Turbo mode already enabled via CLI flag
    
    // Optimize server component loading
    optimizeCss: true,
  },
  
  // Optimize webpack for faster builds
  webpack: (config, { isServer, dev }) => {
    // In development, skip heavy optimizations for faster compilation
    if (dev) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      }
      
      // Faster module resolution
      config.resolve.symlinks = false
    }
    
    // Exclude large ABI files from eager compilation
    if (!isServer && dev) {
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.abi\.ts$/,
            sideEffects: false, // Enable better tree-shaking for ABI files
          },
        ],
      }
    }
    
    // Skip type checking in development (use editor/CI for this)
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
  
  // Note: SWC minifier is the default in Next.js 16+
  
  // Disable source maps in development for faster compilation
  productionBrowserSourceMaps: false,
  
  // Reduce logging in development
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [100, 75], // Support quality 100 for specific images
  },
}

export default nextConfig
