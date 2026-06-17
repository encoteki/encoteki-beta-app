import type { SeverityLevel } from '@sentry/nextjs'
import { isUserRejection } from '@/utils/humanize-error.util'

type TelemetryContext = Record<string, unknown>

export function reportError(error: unknown, context?: TelemetryContext) {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[telemetry]', error, context ?? '')
    return
  }
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.captureException(error, context ? { extra: context } : undefined)
  })
}

export function reportUnexpected(error: unknown, context?: TelemetryContext) {
  if (isUserRejection(error)) return
  reportError(error, context)
}

export function reportMessage(
  message: string,
  level: SeverityLevel = 'warning',
  context?: TelemetryContext,
) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[telemetry]', message, context ?? '')
    return
  }
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.captureMessage(message, {
      level,
      ...(context ? { extra: context } : {}),
    })
  })
}
