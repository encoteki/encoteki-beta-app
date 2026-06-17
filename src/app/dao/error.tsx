'use client'

import ErrorState from '@/components/error-state'

export default function DaoError({
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
      title="Couldn't load this DAO"
      description="Something went wrong while loading governance data. Try again, or head back home."
    />
  )
}
