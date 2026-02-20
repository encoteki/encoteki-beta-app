'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function getAuthSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )

  const address = session.siwe?.address

  if (!address) {
    return {
      success: false,
      error: 'Unauthorized',
      address: null,
    }
  }

  return {
    success: true,
    error: null,
    address,
  }
}
