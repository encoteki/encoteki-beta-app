'use client'

import ErrorState from '@/components/error-state'

export default function MintError({
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
      title="Mint couldn't load"
      description="We hit a problem loading the mint experience. No transaction was sent — you can safely try again."
    />
  )
}
