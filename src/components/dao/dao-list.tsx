'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { DaoType, ProposalType } from '../../enums/dao-types.enum'
import Badge from '../../ui/badge'
import { useDaoCtx } from '../../contexts/dao.context'
import EmptyDao from './empty-list'
import { Skeleton } from '@/ui/skeleton'
import URL_ROUTES from '@/constants/url-route'
import { fetchAllDaos } from '@/services/dao.service'
import { DaoRow } from '@/lib/supabase/database.types'
import { getProposalTypeFromDaoType } from '@/types/dao.types'

/**
 * Compute a human-readable "time remaining" or "Voting ended" string.
 */
function getTimeLabel(endDate: string | null): string {
  if (!endDate) return 'No deadline'

  const now = new Date()
  const end = new Date(endDate)
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
  const [daos, setDaos] = useState<DaoRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const { daoType } = useDaoCtx()

  // Fetch DAOs from Supabase
  const loadDaos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchAllDaos()
      setDaos(data)
    } catch (err) {
      console.error('[DAOList] Error loading DAOs:', err)
      setError('Failed to load proposals. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDaos()
  }, [loadDaos])

  // Filter DAOs based on selected tab
  const filtered = useMemo(() => {
    const allowedTypes = TAB_FILTER[daoType] || []
    return daos.filter((dao) => {
      const proposalType = getProposalTypeFromDaoType(dao.dao_type)
      return allowedTypes.includes(proposalType)
    })
  }, [daoType, daos])

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
              onClick={loadDaos}
              className="rounded-lg bg-primary-green px-4 py-2 text-white hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 ? (
          <EmptyDao />
        ) : (
          <>
            {!loading &&
              !error &&
              filtered.map((dao, index) => (
                <div
                  key={`${dao.dao_id}-${index}`}
                  className="proposal-card mb-8 transition-shadow duration-500 hover:shadow-lg"
                  onClick={() =>
                    (window.location.href = `${URL_ROUTES.DAO}/${dao.dao_id}`)
                  }
                >
                  <Badge type={getProposalTypeFromDaoType(dao.dao_type)} />
                  <h3 className="font-medium">{dao.dao_name}</h3>
                  <div className="flex justify-between">
                    <p className="text-neutral-30">
                      {getTimeLabel(dao.end_date)}
                    </p>
                    <p className="text-neutral-30">
                      {getCreatedLabel(dao.created_at)}
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
