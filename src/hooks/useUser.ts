import useSWR from 'swr'
import { getMe } from '@/lib/auth-client'
import { registerUser } from '@/lib/referral-client'

type SessionResult =
  | { isLoggedIn: false }
  | {
      isLoggedIn: true
      address: string
      hasReferral: boolean
      refCode: string | null
    }

// register is idempotent and safe to call without a refCode — it's the only
// way to read the current hasReferral/applied-refCode status now that sessions
// live server-side. Fetched together so consumers (e.g. the mint flow) can read
// refCode straight off the cached SWR data with no extra round trip.
async function fetchSession(): Promise<SessionResult> {
  const me = await getMe()
  if (!me) return { isLoggedIn: false }

  const registration = await registerUser()
  return {
    isLoggedIn: true,
    address: me.address,
    hasReferral: registration.hasReferral,
    refCode: registration.refCode,
  }
}

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<SessionResult>(
    'session',
    fetchSession,
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  )

  return {
    user: data?.isLoggedIn ? data : null,
    isLoggedIn: data?.isLoggedIn ?? false,
    hasReferral: (data?.isLoggedIn && data.hasReferral) ?? false,
    isLoading,
    isError: error,
    mutate,
  }
}
