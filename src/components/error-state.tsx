'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { reportError } from '@/lib/telemetry'

interface ErrorStateProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  description?: string
  /** Show a "Back to home" link alongside the retry action. Default true. */
  showHome?: boolean
}

/**
 * Recoverable fallback UI for App Router `error.tsx` boundaries. Reports the
 * error to telemetry once on mount, then offers the user a way out (retry the
 * segment, or navigate home) instead of a blank screen.
 */
export default function ErrorState({
  error,
  reset,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. You can try again — if it keeps happening, please come back in a little while.',
  showHome = true,
}: ErrorStateProps) {
  useEffect(() => {
    reportError(error, { digest: error.digest })
  }, [error])

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-6 text-center"
    >
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-h2 font-semibold text-neutral-10">{title}</h1>
        <p className="max-w-md text-small leading-relaxed text-neutral-40">
          {description}
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-caption text-neutral-40/70">
            Ref: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-primary-green px-5 py-3 text-small font-medium text-white shadow-sm transition-all hover:bg-primary-green/90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98]"
        >
          Try again
        </button>
        {showHome && (
          <Link
            href="/"
            className="rounded-full border border-primary-green/30 px-5 py-3 text-small font-medium text-primary-green transition-all hover:bg-green-90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
          >
            Back to home
          </Link>
        )}
      </div>
    </div>
  )
}
