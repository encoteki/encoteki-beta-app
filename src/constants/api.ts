const ABSOLUTE_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api.encoteki.com'

// In local dev the browser routes through the same-origin Next.js rewrite
// (/be/* → backend, see next.config.ts) so the SameSite=Lax session cookie is
// stored for localhost. Server-side code (the auth middleware in src/proxy.ts,
// RSC fetches) has no cookie-domain constraint and always calls the backend
// directly. In production FE and API are same-site, so the absolute URL is used
// everywhere.
const useDevProxy =
  process.env.NODE_ENV === 'development' && typeof window !== 'undefined'

export const API_BASE_URL = useDevProxy ? '/be' : ABSOLUTE_API_URL
