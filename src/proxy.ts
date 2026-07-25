import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { API_BASE_URL } from '@/constants/api'

const PUBLIC_ROUTES = ['/login']

async function getAuthStatus(
  cookieHeader: string,
): Promise<{ isLoggedIn: boolean; hasReferral: boolean }> {
  try {
    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { cookie: cookieHeader },
    })

    if (!meRes.ok) {
      return { isLoggedIn: false, hasReferral: false }
    }

    const registerRes = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { cookie: cookieHeader, 'Content-Type': 'application/json' },
      body: '{}',
    })

    if (!registerRes.ok) {
      return { isLoggedIn: true, hasReferral: false }
    }

    const { hasReferral } = await registerRes.json()
    return { isLoggedIn: true, hasReferral: !!hasReferral }
  } catch {
    // Backend unreachable — fail closed, same as the old local-verification
    // path did when Supabase was unreachable.
    return { isLoggedIn: false, hasReferral: false }
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const cookieHeader = request.headers.get('cookie') ?? ''
  const { isLoggedIn, hasReferral } = await getAuthStatus(cookieHeader)

  if (pathname === '/login') {
    if (isLoggedIn && hasReferral) {
      return NextResponse.redirect(new URL('/mint', request.url))
    }
    return NextResponse.next()
  }

  // Not yet logged in
  if (!isLoggedIn) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Not yet applied referral
  if (!hasReferral) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|be|monitoring|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}
