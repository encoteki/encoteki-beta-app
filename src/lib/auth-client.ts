import { API_BASE_URL } from '@/constants/api'
import { reportError } from '@/lib/telemetry'

export async function fetchNonce(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/nonce`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Failed to fetch nonce')
  }
  const { nonce } = await res.json()
  return nonce
}

export async function loginWithSiwe(
  message: string,
  signature: string,
): Promise<{ ok: boolean; address?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return {
        ok: false,
        error: json?.error ?? json?.message ?? 'Sign-in failed',
      }
    }

    return { ok: true, address: json?.address }
  } catch (error) {
    reportError(error, { action: 'loginWithSiwe' })
    return { ok: false, error: 'Sign-in failed. Please try again.' }
  }
}

// Returns null when the session is missing/expired (401) — not an error case,
// callers should treat it as "logged out" without surfacing a failure.
export async function getMe(): Promise<{ address: string } | null> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json()
}

export async function logoutSession(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    reportError(error, { action: 'logoutSession' })
  }
}
