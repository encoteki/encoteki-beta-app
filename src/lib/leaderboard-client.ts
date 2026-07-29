import { API_BASE_URL } from '@/constants/api'
import { LeaderboardUpstreamSchema } from '@/lib/schemas'
import { reportError } from '@/lib/telemetry'

// Requires a session cookie for a wallet that has already called
// `registerUser()` — same auth semantics as `getUserReferralCode()`. No API
// key involved (backend confirmed session cookie alone gates this route).
export async function getLeaderboard(
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<{
  entries: { rank: number; address: string; points: number }[]
  pagination: unknown | null
  reason?: 'unauthenticated' | 'unregistered' | 'rate_limited' | 'error'
}> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/leaderboard?page=${page}&limit=${limit}`,
      { credentials: 'include', signal },
    )

    if (res.status === 401) {
      return { entries: [], pagination: null, reason: 'unauthenticated' }
    }
    if (res.status === 403) {
      return { entries: [], pagination: null, reason: 'unregistered' }
    }
    // Shared 60 req/min per-IP budget across all routes (see API.md) — worth
    // distinguishing from a generic fetch failure so the UI doesn't suggest
    // retrying immediately.
    if (res.status === 429) {
      return { entries: [], pagination: null, reason: 'rate_limited' }
    }

    const parsed = LeaderboardUpstreamSchema.safeParse(await res.json())
    if (!res.ok || !parsed.success) {
      throw new Error('Malformed leaderboard response')
    }

    const items = parsed.data.data ?? []
    return {
      entries: items.map((item, i) => ({
        rank: (page - 1) * limit + i + 1,
        address: item.userAddress,
        points: item.points,
      })),
      pagination: parsed.data.pagination ?? null,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    reportError(error, { action: 'getLeaderboard', page, limit })
    return { entries: [], pagination: null, reason: 'error' }
  }
}
