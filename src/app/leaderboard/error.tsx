'use client'

import ErrorState from '@/components/error-state'

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorState
      error={error}
      reset={reset}
      title="Couldn't load the leaderboard"
      description="Something went wrong while loading rankings. Try again in a moment."
    />
  )
}
