'use client'

import { useEffect } from 'react'
import { reportError } from '@/lib/telemetry'

/**
 * Last-resort boundary: catches errors thrown in the root layout itself, where
 * the normal `error.tsx` can't render. Must provide its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: 'global' })
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          role="alert"
          className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center"
        >
          <h1 className="text-h2 font-semibold text-neutral-10">
            Something went wrong
          </h1>
          <p className="max-w-md text-small leading-relaxed text-neutral-40">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-primary-green px-5 py-3 text-small font-medium text-white shadow-sm transition-all hover:bg-primary-green/90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
