'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { generateNonce, SiweMessage } from 'siwe'
import { sessionOptions, SessionData, SESSION_TTL } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase/admin'

// ─── Helpers ───

async function getIronSessionInstance() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function getAuthSession() {
  const session = await getIronSessionInstance()

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

// ─── Nonce ───

export async function generateSiweNonce(): Promise<string> {
  const session = await getIronSessionInstance()
  const nonce = generateNonce()
  session.nonce = nonce
  await session.save()
  return nonce
}

// ─── Verify ───

export async function verifySiweMessage(message: string, signature: string) {
  const session = await getIronSessionInstance()

  try {
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })

    if (data.nonce !== session.nonce) {
      return { success: false, error: 'Invalid nonce' }
    }

    const userAddress = data.address.toLowerCase()

    // Check if user already applied a referral
    const { data: referralData, error } = await supabaseAdmin
      .from('referral')
      .select('id')
      .eq('address', userAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Referral Check Error:', error)
    }

    session.siwe = { address: userAddress }
    session.hasReferral = !!referralData
    session.createdAt = Date.now()
    session.nonce = undefined
    await session.save()

    return { success: true, hasReferral: !!referralData }
  } catch (error) {
    console.error(error)
    session.destroy()
    return { success: false, error: 'Invalid signature' }
  }
}

// ─── Session ───

export async function getSessionData() {
  const session = await getIronSessionInstance()

  if (session.siwe) {
    const createdAt = session.createdAt ?? Date.now()
    const expiresAt = createdAt + SESSION_TTL * 1000

    if (Date.now() > expiresAt) {
      session.destroy()
      return { isLoggedIn: false as const }
    }

    return {
      isLoggedIn: true as const,
      address: session.siwe.address,
      hasReferral: session.hasReferral,
      expiresAt,
    }
  }

  return { isLoggedIn: false as const }
}

export async function destroySession() {
  const session = await getIronSessionInstance()
  session.destroy()
  return { ok: true }
}
