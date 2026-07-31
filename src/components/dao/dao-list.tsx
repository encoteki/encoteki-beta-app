'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProposalType } from '../../enums/dao-types.enum'
import Badge from '../../ui/badge'
import EmptyDao from './empty-list'
import { Skeleton } from '@/ui/skeleton'
import URL_ROUTES from '@/constants/url-route'
import { getProposals } from '@/lib/proposals-client'
import { reportError } from '@/lib/telemetry'
import { formatVotingEndsLabel } from '@/utils/dao-time.util'
import type { ProposalListItem, ProposalsPagination } from '@/types/dao.types'

const PAGE_SIZE = 10

export function DAOList() {
  const router = useRouter()
  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<
    ProposalsPagination | undefined
  >()

  const loadProposals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getProposals(page, PAGE_SIZE)

      if (
        result.reason === 'unauthenticated' ||
        result.reason === 'unregistered'
      ) {
        router.replace('/login')
        return
      }
      if (result.reason === 'error') {
        throw new Error('Failed to load proposals')
      }

      setProposals(result.proposals)
      setPagination(
        (result.pagination as ProposalsPagination | null) ?? undefined,
      )
    } catch (err) {
      reportError(err, { source: 'DAOList.loadProposals', page })
      setError('Failed to load proposals. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, router])

  useEffect(() => {
    loadProposals()
  }, [loadProposals])

  return (
    <>
      <section className="min-h-[calc(145px*3+32px*3)] overflow-hidden">
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="proposal-card mb-8 cursor-default bg-white p-4"
              >
                <Skeleton className="mb-3 h-6 w-24 rounded-full" />
                <Skeleton className="mb-2 h-5 w-3/5" />
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </>
        )}

        {!loading && error && (
          <div className="flex h-48 flex-col items-center justify-center gap-4">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadProposals}
              className="rounded-lg bg-primary-green px-4 py-2 text-white hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && proposals.length === 0 ? (
          <EmptyDao />
        ) : (
          <>
            {!loading &&
              !error &&
              proposals.map((proposal) => (
                <div
                  key={proposal.proposalId}
                  className="proposal-card mb-8 transition-shadow duration-500 hover:shadow-lg"
                  onClick={() =>
                    router.push(`${URL_ROUTES.DAO}/${proposal.proposalId}`)
                  }
                >
                  {/* proposalType is currently always 0 ("DAO") — collapse to
                      a single badge until the backend sends more values
                      (see BACKLOG.md). */}
                  <Badge type={ProposalType.PROPOSAL} />
                  <h3 className="font-medium">{proposal.proposalName}</h3>
                  <div className="flex justify-between">
                    <p className="text-neutral-30">
                      {formatVotingEndsLabel(proposal.votingEnds)}
                    </p>
                  </div>
                </div>
              ))}
          </>
        )}
      </section>

      {!loading && !error && pagination && pagination.totalPages > 1 && (
        <div className="flex w-full items-center justify-between px-2 pt-2">
          <span className="text-sm text-neutral-30">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
              className="inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-medium text-neutral-40 transition-colors hover:text-neutral-10 focus-visible:ring-2 focus-visible:ring-primary-green/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={pagination.page === pagination.totalPages}
              aria-label="Next page"
              className="inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-medium text-neutral-40 transition-colors hover:text-neutral-10 focus-visible:ring-2 focus-visible:ring-primary-green/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </>
  )
}
