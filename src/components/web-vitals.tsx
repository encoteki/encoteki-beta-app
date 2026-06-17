'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals(async (metric) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(
        `[web-vitals] ${metric.name}`,
        Math.round(metric.value),
        metric.rating,
      )
      return
    }

    const Sentry = await import('@sentry/nextjs')

    Sentry.addBreadcrumb({
      category: 'web-vitals',
      message: metric.name,
      level: metric.rating === 'poor' ? 'warning' : 'info',
      data: {
        value: metric.value,
        rating: metric.rating,
        navigationType: metric.navigationType,
        id: metric.id,
      },
    })

    if (metric.rating === 'poor') {
      Sentry.captureMessage(`Poor web vital: ${metric.name}`, {
        level: 'warning',
        tags: { webVital: metric.name },
        extra: { value: metric.value, id: metric.id },
      })
    }
  })

  return null
}
