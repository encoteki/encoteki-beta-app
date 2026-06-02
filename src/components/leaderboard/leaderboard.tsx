'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { LeaderboardPodium } from './leaderboard-podium'
import { LeaderboardList } from './leaderboard-list'
import type {
  LeaderboardProps,
  LeaderboardUser,
  PaginationInfo,
} from '@/types/leaderboard.types'
import { fmtPts, Gem } from './utils'

function SkeletonPodium() {
  const heights = [
    'h-28 tablet:h-32',
    'h-44 tablet:h-48',
    'h-20 tablet:h-24',
  ] as const
  return (
    <div className="flex items-end justify-center gap-3 pt-8 pb-0 tablet:gap-5">
      {heights.map((h, i) => (
        <div key={i} className="flex flex-1 flex-col items-center">
          <div className="mb-2 flex flex-col items-center gap-1.5">
            {i === 1 && (
              <div className="h-5 w-5 rounded bg-khaki-70 motion-safe:animate-pulse" />
            )}
            <div className="h-2.5 w-14 rounded bg-khaki-70 motion-safe:animate-pulse" />
            <div className="h-2.5 w-10 rounded bg-khaki-70 motion-safe:animate-pulse" />
          </div>
          <div
            className={`${h} w-full rounded-t-2xl bg-khaki-70 motion-safe:animate-pulse`}
          />
        </div>
      ))}
    </div>
  )
}

function SkeletonRow({ delay }: { delay: number }) {
  const s = { animationDelay: `${delay}ms` }
  return (
    <li className="flex items-center gap-3 px-3 py-3.5">
      <div
        className="h-4 w-7 rounded bg-khaki-70 motion-safe:animate-pulse"
        style={s}
      />
      <div
        className="h-3 w-32 flex-1 rounded bg-khaki-70 motion-safe:animate-pulse"
        style={s}
      />
      <div
        className="h-3.5 w-12 rounded bg-khaki-70 motion-safe:animate-pulse"
        style={s}
      />
    </li>
  )
}

export function Leaderboard({
  users,
  currentUserAddress,
  loading = false,
  error,
  pagination,
  onPageChange,
  onRetry,
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

  const showPodium = loading || (!error && isFirstPage && users.length >= 1)
  const isEmpty = !loading && !error && users.length === 0

  const fallbackPagination: PaginationInfo = pagination ?? {
    page: 1,
    limit: 10,
    total: users.length,
    totalPages: 1,
  }

  // Find current user entry in the visible data
  const currentUserEntry = useMemo<LeaderboardUser | null>(() => {
    if (!currentUserAddress) return null
    return (
      users.find(
        (u) =>
          u.isCurrentUser ||
          u.walletAddress.toLowerCase() === currentUserAddress.toLowerCase(),
      ) ?? null
    )
  }, [users, currentUserAddress])

  // Detect whether the user's row is in the podium (always visible)
  const isUserInPodium =
    isFirstPage &&
    top3.some(
      (u) =>
        u &&
        (u.isCurrentUser ||
          (currentUserAddress &&
            u.walletAddress.toLowerCase() ===
              currentUserAddress.toLowerCase())),
    )

  // IntersectionObserver for sticky rank bar
  const obsRef = useRef<IntersectionObserver | null>(null)
  const [isUserRowVisible, setIsUserRowVisible] = useState(true)

  const handleUserRef = useCallback((el: HTMLElement | null) => {
    if (obsRef.current) {
      obsRef.current.disconnect()
      obsRef.current = null
    }
    if (!el) {
      setIsUserRowVisible(false)
      return
    }
    const obs = new IntersectionObserver(
      ([entry]) => setIsUserRowVisible(entry.isIntersecting),
      { threshold: 0 },
    )
    obs.observe(el)
    obsRef.current = obs
  }, [])

  const showStickyBar =
    !loading && !!currentUserEntry && !isUserInPodium && !isUserRowVisible

  return (
    <section aria-label="Leaderboard">
      {/* Podium */}
      {showPodium && (
        <>
          {loading ? <SkeletonPodium /> : <LeaderboardPodium top3={top3} />}
          <div className="mt-6 border-t border-khaki-70/60" />
        </>
      )}

      {/* List */}
      {loading ? (
        <ul className="pt-1 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} delay={i * 60} />
          ))}
        </ul>
      ) : error ? (
        <div className="py-14 text-center">
          <p className="text-small font-medium text-neutral-40">
            Could not load the leaderboard.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 rounded-sm text-small font-semibold text-primary-green hover:underline focus-visible:ring-2 focus-visible:ring-primary-green/50 focus-visible:outline-none"
            >
              Try again
            </button>
          )}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <svg
            width="56"
            height="28"
            viewBox="0 0 56 28"
            fill="none"
            aria-hidden
          >
            <path
              d="M0 18 C7 13, 14 20, 21 16 C28 12, 35 19, 42 15 C49 11, 52 17, 56 14 L56 28 L0 28 Z"
              fill="#E7E7C0"
            />
            <path
              d="M0 22 C9 18, 18 24, 28 21 C38 18, 47 23, 56 20 L56 28 L0 28 Z"
              fill="#EFEFD6"
            />
          </svg>
          <p className="text-small font-medium text-neutral-40">
            The board is empty. Share your referral code to claim the first
            spot.
          </p>
        </div>
      ) : rest.length > 0 ? (
        <LeaderboardList
          users={rest}
          currentUserAddress={currentUserAddress}
          pagination={fallbackPagination}
          onPageChange={onPageChange ?? (() => {})}
          userRowRef={!isUserInPodium ? handleUserRef : undefined}
        />
      ) : null}

      {/* Sticky rank bar — slides up when user's row is off-screen */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            key="sticky-rank"
            initial={reduced ? { opacity: 1 } : { y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { y: 6, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="sticky bottom-0 z-10 flex items-center justify-between border-t border-primary-green/20 bg-green-90 px-4 py-3"
            aria-live="polite"
            aria-label={`Your rank: ${currentUserEntry!.rank}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-caption font-medium tracking-[0.08em] text-primary-green uppercase">
                You
              </span>
              <span className="font-mono text-body font-bold text-primary-green tabular-nums">
                #{currentUserEntry!.rank}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Gem size={9} />
              <span className="font-mono text-body font-bold text-primary-green tabular-nums">
                {fmtPts(currentUserEntry!.points)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
