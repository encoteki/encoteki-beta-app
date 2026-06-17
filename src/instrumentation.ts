export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn || process.env.NODE_ENV !== 'production') return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export async function onRequestError(
  error: unknown,
  request: unknown,
  context: unknown,
): Promise<void> {
  if (process.env.NODE_ENV !== 'production') return
  const { captureRequestError } = await import('@sentry/nextjs')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await captureRequestError(error as any, request as any, context as any)
}
