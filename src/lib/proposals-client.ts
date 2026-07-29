import { API_BASE_URL } from '@/constants/api'
import { ProposalsUpstreamSchema, ProposalDetailSchema } from '@/lib/schemas'
import { reportError } from '@/lib/telemetry'
import type { ProposalListItem, ProposalDetail } from '@/types/dao.types'

// Requires a session cookie for a wallet that has already called
// `registerUser()` — same auth semantics as `getLeaderboard()`.
export async function getProposals(
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<{
  proposals: ProposalListItem[]
  pagination: unknown | null
  reason?: 'unauthenticated' | 'unregistered' | 'error'
}> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/proposals?page=${page}&limit=${limit}`,
      { credentials: 'include', signal },
    )

    if (res.status === 401) {
      return { proposals: [], pagination: null, reason: 'unauthenticated' }
    }
    if (res.status === 403) {
      return { proposals: [], pagination: null, reason: 'unregistered' }
    }

    const parsed = ProposalsUpstreamSchema.safeParse(await res.json())
    if (!res.ok || !parsed.success) {
      throw new Error('Malformed proposals response')
    }

    return {
      proposals: parsed.data.data ?? [],
      pagination: parsed.data.pagination ?? null,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    reportError(error, { action: 'getProposals', page, limit })
    return { proposals: [], pagination: null, reason: 'error' }
  }
}

// `id` is the decimal-string `proposalId` (uint256) — never parse it to a
// number, precision loss is possible for large ids.
export async function getProposal(
  id: string,
  signal?: AbortSignal,
): Promise<{
  proposal: ProposalDetail | null
  reason?: 'unauthenticated' | 'unregistered' | 'notFound' | 'error'
}> {
  try {
    const res = await fetch(`${API_BASE_URL}/proposals/${id}`, {
      credentials: 'include',
      signal,
    })

    if (res.status === 401) {
      return { proposal: null, reason: 'unauthenticated' }
    }
    if (res.status === 403) {
      return { proposal: null, reason: 'unregistered' }
    }
    if (res.status === 404) {
      return { proposal: null, reason: 'notFound' }
    }

    const parsed = ProposalDetailSchema.safeParse(await res.json())
    if (!res.ok || !parsed.success) {
      throw new Error('Malformed proposal response')
    }

    return { proposal: parsed.data }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error
    reportError(error, { action: 'getProposal', id })
    return { proposal: null, reason: 'error' }
  }
}
