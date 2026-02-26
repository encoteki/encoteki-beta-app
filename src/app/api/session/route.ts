import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData, SESSION_TTL } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )

  if (session.siwe) {
    const createdAt = session.createdAt ?? Date.now()
    const expiresAt = createdAt + SESSION_TTL * 1000

    // Server-side expiry check (belt-and-suspenders with iron-session ttl)
    if (Date.now() > expiresAt) {
      session.destroy()
      return Response.json({ isLoggedIn: false })
    }

    return Response.json({
      isLoggedIn: true,
      address: session.siwe.address,
      hasReferral: session.hasReferral,
      expiresAt,
    })
  }

  return Response.json({
    isLoggedIn: false,
  })
}

export async function DELETE() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  session.destroy()
  return Response.json({ ok: true })
}
