'use client'

import { useEffect, useMemo, useState } from 'react'
import { DaoType, ProposalType } from '../../enums/dao-types.enum'
import Badge from '../../ui/badge'
import { useDaoCtx } from '../../contexts/dao.context'
import EmptyDao from './empty-list'
import { Skeleton } from '@/ui/skeleton'
import URL_ROUTES from '@/constants/url-route'
import { mockProposals } from '@/constants/dao/mock-proposals'
import { MockProposal } from '@/types/dao.types'

/**
 * Compute a human-readable "time remaining" or "X days ago" string.
 */
function getTimeLabel(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diffMs = end.getTime() - now.getTime()

  if (diffMs <= 0) return 'Voting ended'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return `Voting ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getCreatedLabel(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffDays = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

/**
 * Map DaoType tabs to which ProposalTypes to show.
 */
const TAB_FILTER: Record<DaoType, ProposalType[]> = {
  [DaoType.GOVERNANCE]: [ProposalType.DONATION, ProposalType.PROPOSAL],
  [DaoType.BUSINESS_PROPOSAL]: [ProposalType.BUSINESS],
}

export function DAOList() {
  const [proposals, setProposals] = useState<MockProposal[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const { daoType } = useDaoCtx()

  const filtered = useMemo(() => {
    const allowedTypes = TAB_FILTER[daoType] || []
    return mockProposals.filter((p) => allowedTypes.includes(p.type))
  }, [daoType])

  useEffect(() => {
    setLoading(true)
    // Simulate async fetch
    const timer = setTimeout(() => {
      setProposals(filtered)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [filtered])

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

        {!loading && proposals.length === 0 ? (
          <EmptyDao />
        ) : (
          <>
            {proposals.map((item, index) => (
              <div
                key={`${item.code}-${index}`}
                className="proposal-card mb-8 transition-shadow duration-500 hover:shadow-lg"
                onClick={() =>
                  (window.location.href = `${URL_ROUTES.DAO}/${item.code}`)
                }
              >
                <Badge type={item.type} />
                <h3 className="font-medium">{item.name}</h3>
                <div className="flex justify-between">
                  <p className="text-neutral-30">
                    {getTimeLabel(item.endTime)}
                  </p>
                  <p className="text-neutral-30">
                    {getCreatedLabel(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      <div className="hidden w-full justify-center">pagination</div>
    </>
  )
}
