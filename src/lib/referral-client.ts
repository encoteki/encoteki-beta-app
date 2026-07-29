import { API_BASE_URL } from '@/constants/api'
import { RefCodeResponseSchema } from '@/lib/schemas'
import { reportError } from '@/lib/telemetry'

// Idempotent — safe to call on every login, with or without a refCode. Backend
// resolves identity from the session cookie, not from any address/signature here.
//
// `refCode` is always the code currently applied to this wallet (the first
// one ever applied "wins" — repeat calls, with or without a refCode, keep
// returning it) — `null` only if this wallet has never applied a code.
export async function registerUser(refCode?: string): Promise<{
  ok: boolean
  hasReferral: boolean
  refCode: string | null
  error?: string
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refCode ? { refCode } : {}),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        hasReferral: false,
        refCode: null,
        error: json?.error ?? json?.message ?? 'Failed to register',
      }
    }

    return {
      ok: true,
      hasReferral: !!json.hasReferral,
      refCode: json.refCode ?? null,
    }
  } catch (error) {
    reportError(error, { action: 'registerUser' })
    return {
      ok: false,
      hasReferral: false,
      refCode: null,
      error: 'Internal Server Error',
    }
  }
}

// User's OWN referral code (users table, ref_code column) — no signature
// required anymore, the session cookie authenticates the request.
export async function submitReferralCode(
  code: string,
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return {
      success: false,
      error:
        'Invalid code format. Code must be 6 characters letters and numbers only.',
    }
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/referralcode`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refCode: code }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        success: false,
        error: json?.error ?? json?.message ?? 'Failed to create referral code',
      }
    }

    return { success: true, message: 'Successfully claimed referral code' }
  } catch (error) {
    reportError(error, { action: 'submitReferralCode' })
    return { success: false, error: 'Internal Server Error' }
  }
}

// Requires a session cookie for a wallet that has already called
// `registerUser()` — a bare `401` means the session is missing/expired
// (re-login), a `403` means the session is valid but this wallet hasn't
// registered yet (send it through the register flow, not login again).
export async function getUserReferralCode(address: string): Promise<{
  success: boolean
  data: string | null
  reason?: 'unauthenticated' | 'unregistered'
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${address}/referralcode`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })

    if (res.status === 401) {
      return { success: false, data: null, reason: 'unauthenticated' }
    }
    if (res.status === 403) {
      return { success: false, data: null, reason: 'unregistered' }
    }
    if (!res.ok) {
      return { success: false, data: null }
    }

    const parsed = RefCodeResponseSchema.safeParse(await res.json())
    return {
      success: true,
      data: parsed.success ? (parsed.data.ref_code ?? null) : null,
    }
  } catch (error) {
    reportError(error, { action: 'getUserReferralCode' })
    return { success: false, data: null }
  }
}
