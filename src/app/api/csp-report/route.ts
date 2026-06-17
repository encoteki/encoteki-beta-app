import { NextResponse } from 'next/server'
import { reportMessage } from '@/lib/telemetry'

/**
 * Sink for CSP violation reports (both legacy `report-uri` and modern
 * `report-to`). Forwards to telemetry so the report-only policy can be tuned
 * from real traffic before it's enforced.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    if (body) {
      reportMessage('CSP violation', 'warning', { report: body })
    }
  } catch {
    // Swallow malformed reports — never let reporting break a request.
  }
  return new NextResponse(null, { status: 204 })
}
