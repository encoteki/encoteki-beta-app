import useSWR from 'swr'
import { getSessionData } from '@/actions/auth'

type SessionResult = Awaited<ReturnType<typeof getSessionData>>

const fetcher = () => getSessionData()

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<SessionResult>(
    'session',
    fetcher,
    {
      revalidateOnFocus: true,
      shouldRetryOnError: false,
    },
  )

  return {
    user: data?.isLoggedIn ? data : null,
    isLoggedIn: data?.isLoggedIn ?? false,
    hasReferral: (data?.isLoggedIn && data.hasReferral) ?? false,
    expiresAt: (data?.isLoggedIn && data.expiresAt) ?? null,
    isLoading,
    isError: error,
    mutate,
  }
}
