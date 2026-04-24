'use server'

import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sessionOptions, SessionData } from '@/lib/session'
import { getAuthSession } from './auth'

// ─── User's OWN referral code (users table, ref_code column) ───

export async function submitReferralCode(code: string) {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error }
  }

  if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return {
      success: false,
      error:
        'Invalid code format. Code must be 6 characters letters and numbers only.',
    }
  }

  try {
    const res = await fetch('https://api.encoteki.com/users/referralcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAddress: auth.address, refCode: code }),
    })

    const json = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: json?.error ?? json?.message ?? 'Failed to create referral code',
      }
    }

    return { success: true, message: 'Successfully claimed referral code' }
  } catch (error) {
    return { success: false, error: 'Internal Server Error' }
  }
}

export async function getUserReferralCode() {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error }
  }

  try {
    const res = await fetch(
      `https://api.encoteki.com/users/${auth.address}/referralcode`,
      { headers: { 'Content-Type': 'application/json' } },
    )

    if (!res.ok) {
      return { success: false, error: 'Failed to fetch referral code' }
    }

    const json = await res.json()
    return { success: true, data: (json?.ref_code as string | null) ?? null }
  } catch {
    return { success: false, error: 'Internal Server Error' }
  }
}

// ─── Applied referral code (referral table, code column) ───
// This is the referral code a user entered at sign-in (someone else's ref_code)

export async function getAppliedReferralCode() {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error, code: null }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('referral')
      .select('code_applied')
      .eq('address', auth.address)
      .single()

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: 'Failed to fetch referral code',
        code: null,
      }
    }

    return { success: true, code: data?.code_applied || null }
  } catch (error) {
    return { success: false, error: 'Internal Server Error', code: null }
  }
}

export async function applyReferralCode(code: string | null) {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error }
  }

  try {
    let requestedCode = code ? code.toUpperCase().trim() : null

    if (requestedCode) {
      if (!/^[A-Z0-9]{6}$/.test(requestedCode)) {
        return {
          success: false,
          error:
            'Invalid format. Code must be exactly 6 alphanumeric characters.',
        }
      }

      // Verify the code exists
      const verifyRes = await fetch(
        `https://api.encoteki.com/referralcode/${requestedCode}/validate`,
        { headers: { 'Content-Type': 'application/json' } },
      )

      if (!verifyRes.ok) {
        return { success: false, error: 'Referral code does not exist' }
      }
    }

    const { error } = await supabaseAdmin
      .from('referral')
      .upsert(
        {
          address: auth.address,
          code_applied: requestedCode,
          skip: true,
        },
        { onConflict: 'address' },
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update session hasReferral gate
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions,
    )
    session.hasReferral = true
    await session.save()

    return { success: true, message: 'Referral code applied' }
  } catch (error) {
    console.error('Apply Referral Error:', error)
    return { success: false, error: 'Failed to apply referral code' }
  }
}
