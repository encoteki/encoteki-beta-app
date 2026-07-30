// Ordered fallback list of public IPFS gateways. The project's own gateway
// (if configured) is tried first since it's usually fastest/most reliable;
// the rest are well-known public gateways used only as a backstop when it —
// or any one gateway — is slow, rate-limiting, or down.
const PUBLIC_GATEWAYS = [
  ...(process.env.NEXT_PUBLIC_GATEWAY_URL
    ? [`https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`]
    : []),
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
]

const GATEWAY_TIMEOUT_MS = 8000

export function isIpfsUri(value: string): boolean {
  return value.startsWith('ipfs://')
}

async function fetchWithTimeout(
  url: string,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort)
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS)

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Fetches JSON for an `ipfs://<cid>/...` URI, trying each gateway in
 * `PUBLIC_GATEWAYS` in order until one returns a valid response. A single
 * gateway being slow, rate-limited, or down shouldn't make otherwise-available
 * IPFS content unreachable.
 *
 * Returns `null` if every gateway fails. Throws only if `signal` itself was
 * aborted by the caller (e.g. component unmount) — that should stop the
 * fallback chain rather than keep trying the next gateway.
 */
export async function fetchIpfsJson(
  uri: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const path = uri.replace('ipfs://', '')

  for (const gateway of PUBLIC_GATEWAYS) {
    try {
      const res = await fetchWithTimeout(`${gateway}${path}`, signal)
      if (!res.ok) continue
      return await res.json()
    } catch (err) {
      if (signal?.aborted) throw err
      continue
    }
  }

  return null
}
