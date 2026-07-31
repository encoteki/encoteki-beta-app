import { NextResponse } from 'next/server'
import { reportMessage } from '@/lib/telemetry'

// Real CSP reports are small JSON blobs (typically a few hundred bytes) — this
// endpoint is unauthenticated by necessity (browsers report violations
// anonymously), so a generous-but-real cap keeps a malicious/broken sender
// from forcing a large parse. Checked against the declared Content-Length
// before request.json() ever runs; Vercel's own platform-level function
// payload limit is the hard backstop behind this.
const MAX_BODY_BYTES = 8 * 1024

// Best-effort per-IP throttle. Deliberately lightweight: this Map lives in a
// single serverless instance's memory, so it resets on cold start and isn't
// shared across concurrent instances/regions — it blunts casual/bursty abuse,
// it does not stop a distributed attacker. Proportionate to what this endpoint
// is worth protecting (anonymous CSP-violation sink, no sensitive data, no
// user-visible impact if a report is dropped).
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const MAP_SWEEP_THRESHOLD = 5000
const hits = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  const timestamps = (hits.get(key) ?? []).filter((t) => t > cutoff)

  if (timestamps.length >= RATE_LIMIT_MAX) {
    hits.set(key, timestamps)
    return true
  }

  timestamps.push(now)
  hits.set(key, timestamps)

  // Opportunistic cleanup so the map doesn't grow unbounded on a long-lived
  // warm instance — sweep stale entries only once the map gets large, rather
  // than on every call.
  if (hits.size > MAP_SWEEP_THRESHOLD) {
    for (const [k, ts] of hits) {
      if (ts.every((t) => t <= cutoff)) hits.delete(k)
    }
  }

  return false
}

// x-forwarded-for can be spoofed by the client in principle, but that's fine
// here — this is a best-effort throttle, not an auth boundary (see comment
// above). Vercel's edge appends the real connecting IP to this header.
function clientKey(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

/**
 * Sink for CSP violation reports (both legacy `report-uri` and modern
 * `report-to`). Forwards to telemetry so the report-only policy can be tuned
 * from real traffic before it's enforced.
 */
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 })
  }

  if (isRateLimited(clientKey(request))) {
    return new NextResponse(null, { status: 429 })
  }

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
