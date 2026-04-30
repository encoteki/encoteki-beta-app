'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { LeaderboardPodium } from './LeaderboardPodium'
import { LeaderboardList } from './LeaderboardList'
import type { LeaderboardProps, LeaderboardUser, PaginationInfo } from './types'

function SkeletonPodium() {
  const heights = [
    'h-28 tablet:h-32',
    'h-44 tablet:h-48',
    'h-20 tablet:h-24',
  ] as const
  const avatarSizes = ['h-10 w-10', 'h-14 w-14', 'h-10 w-10'] as const
  return (
    <div className="flex items-end justify-center gap-2 pt-12 pb-0">
      {heights.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center">
          <div className="mb-2 flex flex-col items-center gap-1.5">
            <div
              className={`${avatarSizes[i]} animate-pulse rounded-full bg-khaki-70`}
            />
            <div className="h-2.5 w-14 animate-pulse rounded bg-khaki-70" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-khaki-70" />
          </div>
          <div
            className={`${h} w-full animate-pulse rounded-t-2xl bg-khaki-70`}
          />
        </div>
      ))}
    </div>
  )
}

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <li
      className="flex items-center gap-3 px-3 py-2.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-4 w-7 animate-pulse rounded bg-khaki-70" />
      <div className="h-3 w-32 flex-1 animate-pulse rounded bg-khaki-70" />
      <div className="h-3.5 w-12 animate-pulse rounded bg-khaki-70" />
    </li>
  )
}

export function Leaderboard({
  title,
  users,
  currentUserAddress,
  updatedAt,
  loading = false,
  pagination,
  onPageChange,
}: LeaderboardProps) {
  const reduced = useReducedMotion() ?? false
  const isFirstPage = !pagination || pagination.page === 1

  const top3: (LeaderboardUser | null)[] = isFirstPage
    ? [users[0] ?? null, users[1] ?? null, users[2] ?? null]
    : [null, null, null]

  const rest = useMemo(
    () => (isFirstPage ? users.slice(3) : users),
    [users, isFirstPage],
  )

  const participantCount = pagination?.total ?? users.length
  const showPodium = loading || (isFirstPage && users.length >= 1)
  const isEmpty = !loading && users.length === 0

  const fallbackPagination: PaginationInfo = pagination ?? {
    page: 1,
    limit: 10,
    total: users.length,
    totalPages: 1,
  }

  return (
    <section
      aria-labelledby="lb-heading"
      className="overflow-hidden rounded-2xl bg-transparent"
    >
      {/* Podium */}
      {showPodium && (
        <>
          {loading ? <SkeletonPodium /> : <LeaderboardPodium top3={top3} />}
          <div className="mt-4 border-t border-khaki-70" />
        </>
      )}

      {/* List */}
      {loading ? (
        <ul className="divide-y divide-khaki-70/50 pt-1 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} delay={i * 60} />
          ))}
        </ul>
      ) : isEmpty ? (
        <p className="py-14 text-center text-sm font-medium text-neutral-30">
          No points recorded yet.
        </p>
      ) : rest.length > 0 ? (
        <LeaderboardList
          users={rest}
          currentUserAddress={currentUserAddress}
          pagination={fallbackPagination}
          onPageChange={onPageChange ?? (() => {})}
        />
      ) : null}

      {updatedAt && (
        <p className="pb-3 text-center text-[11px] text-neutral-40">
          Updated {updatedAt}
        </p>
      )}
    </section>
  )
}
