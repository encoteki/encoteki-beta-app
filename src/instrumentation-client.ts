const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn && process.env.NODE_ENV === 'production') {
  import('@sentry/nextjs').then(({ init }) => {
    init({
      dsn,
      environment: process.env.NEXT_PUBLIC_APP_ENV,
      tracesSampleRate: Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
      ),
      enabled: true,
    })
  })
}

export async function onRouterTransitionStart(
  ...args: unknown[]
): Promise<void> {
  if (process.env.NODE_ENV !== 'production' || !dsn) return
  const { captureRouterTransitionStart } = await import('@sentry/nextjs')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (captureRouterTransitionStart as any)(...args)
}
