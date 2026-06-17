import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

// ─── Security headers ───────────────────────────────────────────────────────
// Derive the Supabase origin (+ its wss:// realtime counterpart) so the CSP
// connect-src allowlist tracks the configured project instead of being hardcoded.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin
  } catch {
    return ''
  }
})()
const supabaseWs = supabaseOrigin.replace(/^https:/, 'wss:')

// Endpoints the client actually talks to. Tune from CSP-report violations
// before promoting the report-only policy below to enforced.
const connectSrc = [
  "'self'",
  supabaseOrigin,
  supabaseWs,
  'https://api.encoteki.com',
  'https://scan.layerzero-api.com',
  // WalletConnect relay + Xellar
  'https://*.walletconnect.com',
  'https://*.walletconnect.org',
  'wss://*.walletconnect.com',
  'wss://*.walletconnect.org',
  'https://*.xellar.co',
  // Public RPCs used by the default viem http() transports (base/arb/lisk/manta)
  'https://mainnet.base.org',
  'https://arb1.arbitrum.io',
  'https://rpc.api.lisk.com',
  'https://pacific-rpc.manta.network',
]
  .filter(Boolean)
  .join(' ')

// Full XSS-backstop content policy. Violations are reported to /api/csp-report
// (see `report-uri`/`report-to` below) so the allowlist can be tuned from real
// traffic. Set CSP_ENFORCE=true to switch from report-only to enforced once the
// login/mint flow is verified clean in the browser — defaulting to report-only
// ensures a missing allowlist entry can't silently break the wallet SDKs.
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline': Next injects inline bootstrap scripts (drop this only if
  //   you move to nonce-based CSP via middleware).
  // 'unsafe-eval': required by the Xellar/WalletConnect/Reown stack, which
  //   bundles vm-browserify (Script.runInThisContext → eval). Not our code and
  //   not configurable away; the wallet/connect flow breaks without it.
  // 'wasm-unsafe-eval': WebAssembly used by the crypto libs.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'",
  // framer-motion + Tailwind inject inline styles.
  "style-src 'self' 'unsafe-inline'",
  // NFT/IPFS imagery + wallet avatars.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://*.xellar.co",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
  // Violation reporting — legacy and modern channels both point at our sink.
  'report-uri /api/csp-report',
  'report-to csp-endpoint',
].join('; ')

const enforceCsp = process.env.CSP_ENFORCE === 'true'

const securityHeaders = [
  // Clickjacking protection — enforced now (zero breakage risk; the app is
  // never meant to be framed). XFO covers browsers predating frame-ancestors.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // Reporting endpoint group referenced by the policy's `report-to` directive.
  { key: 'Reporting-Endpoints', value: 'csp-endpoint="/api/csp-report"' },
  // The full policy: enforced when CSP_ENFORCE=true, else report-only.
  enforceCsp
    ? { key: 'Content-Security-Policy', value: cspDirectives }
    : { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
  // When not yet enforcing the full policy, still enforce clickjacking on its own.
  ...(enforceCsp
    ? []
    : [{ key: 'Content-Security-Policy', value: "frame-ancestors 'none'" }]),
]

const nextConfig: NextConfig = {
  /* config options here */

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },

  // Disable typed routes for faster compilation
  typedRoutes: false,

  // Optimize compilation performance
  experimental: {
    // Speed up Fast Refresh and reduce bundle size
    optimizePackageImports: [
      'lucide-react',
      'motion',
      'viem',
      'wagmi',
      'ethers',
      '@xellar/kit',
      '@walletconnect/ethereum-provider',
    ],
    // NOTE: `optimizeCss` was removed — it requires the `beasties`/`critters`
    // peer dependency (not installed) and otherwise breaks `next build`.
  },

  // Turbopack configuration (used for builds in Next.js 16+)
  turbopack: {
    // Turbopack is used for builds, webpack config above is for legacy webpack builds only
  },

  // Optimize webpack for faster builds (when using --webpack flag)
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

// Skip Sentry instrumentation in dev — it adds 20-40s to initial compile and
// Sentry is disabled at runtime anyway (see instrumentation-client.ts).
export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      tunnelRoute: '/monitoring',
      silent: !process.env.CI,
    })
  : nextConfig
