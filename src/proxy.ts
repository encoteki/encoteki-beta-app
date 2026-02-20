import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

const PUBLIC_ROUTES = ['/login', '/']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  )

  const { pathname } = request.nextUrl

  if (pathname === '/login') {
    if (session.siwe?.address && session.hasReferral) {
      return NextResponse.redirect(new URL('/mint', request.url))
    }
    return response
  }

  // Not yet login
  if (!session.siwe?.address) {
    if (!PUBLIC_ROUTES.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  // Not yet applied referral
  if (!session.hasReferral) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets).*)'],
}
