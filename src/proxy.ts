import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_BASE_URL } from '@/constants/api'

const PUBLIC_ROUTES = ['/login']

type AuthStatus =
  | { isLoggedIn: false }
  // `hasReferral: null` means the register-check request itself failed
  // (network error / non-2xx / timeout) — distinct from a confirmed `false`.
  // Conflating the two used to bounce already-registered users into a
  // /login <-> /mint redirect loop: this middleware call and the client's own
  // POST /users/register (src/hooks/useUser.ts) run in different network
  // contexts, so a transient failure here can happen while the browser's own
  // check succeeds — the client then immediately redirects back to /mint,
  // this middleware fails the same way again, and it loops.
  | { isLoggedIn: true; hasReferral: boolean | null }

async function getAuthStatus(cookieHeader: string): Promise<AuthStatus> {
  let meRes: Response
  try {
    meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
    })
  } catch {
    return { isLoggedIn: false }
  }

  if (!meRes.ok) {
    return { isLoggedIn: false }
  }

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

  // Not yet logged in
  if (!status.isLoggedIn) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Confirmed not registered yet — send to /login (hosts the referral form).
  // `hasReferral === null` (check failed, status unknown) intentionally does
  // NOT redirect here — see the AuthStatus comment above.
  if (status.hasReferral === false) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|be|monitoring|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}
