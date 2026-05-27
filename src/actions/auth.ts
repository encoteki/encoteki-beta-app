'use server'

import { getIronSession } from 'iron-session'
import { cookies, headers } from 'next/headers'
import { generateNonce, SiweMessage } from 'siwe'
import { sessionOptions, SessionData, SESSION_TTL } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Returns the canonical app host for SIWE domain binding.
// NEXT_PUBLIC_APP_URL is the authoritative source in production — it eliminates
// header-injection attacks and ensures client/server domain consistency.
// Falls back to the HTTP Host header (which always matches window.location.host
// in standard deployments and cannot be forged past the load balancer).
async function getRequestHost(): Promise<string | undefined> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      return new URL(process.env.NEXT_PUBLIC_APP_URL).host
    } catch {}
  }
  const h = await headers()
  return h.get('host') ?? undefined
}

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

  if (!session.nonce) {
    return { success: false, error: 'No active nonce' }
  }

  // Consume the nonce before verifying so concurrent requests cannot both
  // pass this check and replay the same nonce.
  const consumedNonce = session.nonce
  session.nonce = undefined
  await session.save()

  const expectedDomain = await getRequestHost()
  if (!expectedDomain) {
    return { success: false, error: 'Unable to determine request domain' }
  }

  try {
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({
      signature,
      // Binds the signature to this origin, the session-issued nonce, and
      // the current time. siwe throws on any mismatch (including expired
      // `expirationTime` or not-yet-valid `notBefore`); the catch below
      // covers it.
      domain: expectedDomain,
      nonce: consumedNonce,
      time: new Date().toISOString(),
    })

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
    await session.save()

    return { success: true, hasReferral: !!referralData }
  } catch (error) {
    // Nonce is already consumed — no session data to clean up.
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
