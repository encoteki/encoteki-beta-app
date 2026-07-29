import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_BASE_URL } from '@/constants/api'

const PUBLIC_ROUTES = ['/login']

type AuthStatus =
  // Confirmed logged out — /auth/me returned a real 401 (no/expired session).
  | { isLoggedIn: false }
  // The /auth/me check itself failed (network error / 429 / 5xx / timeout) —
  // distinct from a confirmed 401. Treating these the same used to bounce
  // already-registered users into a /login <-> /mint redirect loop: this
  // middleware call and the client's own GET /auth/me + POST /users/register
  // (src/hooks/useUser.ts) run in different network contexts (this one shares
  // an IP-based rate-limit bucket across all traffic through the Next.js
  // server, see encoteki-be's rateLimiter), so a transient failure here can
  // happen while the browser's own check succeeds — the client then
  // immediately redirects back to /mint, this middleware fails the same way
  // again, and it loops.
  | { isLoggedIn: null }
  // `hasReferral: null` means the register-check request itself failed
  // (network error / non-2xx / timeout) — distinct from a confirmed `false`.
  // Same class of ambiguity as `isLoggedIn: null` above, just one step later
  // in the check.
  | { isLoggedIn: true; hasReferral: boolean | null }

async function getAuthStatus(cookieHeader: string): Promise<AuthStatus> {
  let meRes: Response | null = null

  // One retry before giving up — mirrors the register retry below. A single
  // transient blip (rate limit, brief 5xx) shouldn't be enough to misreport
  // a valid session as logged out.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      meRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { cookie: cookieHeader },
      })
      break
    } catch {
      meRes = null
    }
  }

  if (!meRes) return { isLoggedIn: null }
  if (meRes.status === 401) return { isLoggedIn: false }
  if (!meRes.ok) return { isLoggedIn: null }

  // One retry before giving up — this runs on every navigation, so a single
  // transient blip shouldn't be enough to misreport referral status.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const registerRes = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { cookie: cookieHeader, 'Content-Type': 'application/json' },
        body: '{}',
      })

      if (registerRes.ok) {
        const { hasReferral } = await registerRes.json()
        return { isLoggedIn: true, hasReferral: !!hasReferral }
      }
    } catch {
      // fall through — retry, then report ambiguous below
    }
  }

  return { isLoggedIn: true, hasReferral: null }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieHeader = request.headers.get('cookie') ?? ''
  const status = await getAuthStatus(cookieHeader)

  if (pathname === '/login') {
    if (status.isLoggedIn && status.hasReferral) {
      return NextResponse.redirect(new URL('/mint', request.url))
    }
    return NextResponse.next()
  }

  // Confirmed logged out (real 401) — gate protected routes.
  // `isLoggedIn === null` (check itself failed, status unknown) intentionally
  // falls through WITHOUT redirecting — see the AuthStatus comment above.
  if (status.isLoggedIn === false) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Confirmed not registered yet — send to /login (hosts the referral form).
  // `hasReferral === null` (check failed, status unknown) intentionally does
  // NOT redirect here — see the AuthStatus comment above.
  if (status.isLoggedIn === true && status.hasReferral === false) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|be|monitoring|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}
