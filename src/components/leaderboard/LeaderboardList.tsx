'use client'

import { useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { LeaderboardUser, PaginationInfo } from '@/types/leaderboard.types'
import { fmtPts, truncate, Gem } from './utils'

// Terrain-zone coloring for proportional fill bars.
// Maps fill percentage to elevation palette: alpine green → meadow straw → lowland dried-grass.
// "You" always reads green regardless of standing.
function fillBarColor(pct: number, highlighted: boolean): string {
  if (highlighted || pct >= 0.70) return 'rgba(36,98,52,0.13)'    // canopy green — alpine
  if (pct >= 0.35)               return 'rgba(218,218,159,0.55)'  // straw — meadow
  return                                'rgba(231,231,192,0.48)'  // dried-grass — lowland
}

function isMe(entry: LeaderboardUser, currentAddress?: string) {
  if (entry.isCurrentUser) return true
  if (!currentAddress) return false
  return entry.walletAddress.toLowerCase() === currentAddress.toLowerCase()
}

interface LeaderboardListProps {
  users: LeaderboardUser[]
  currentUserAddress?: string
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  userRowRef?: (el: HTMLElement | null) => void
}

export function LeaderboardList({
  users,
  currentUserAddress,
  pagination,
  onPageChange,
  userRowRef,
}: LeaderboardListProps) {
  const reduced = useReducedMotion() ?? false
  const { page, totalPages } = pagination
  const maxPoints = useMemo(
    () => Math.max(...users.map((u) => u.points), 1),
    [users],
  )

  return (
    <div>
      {/* Column hints */}
      <div className="flex items-center gap-3 px-5 pt-3 pb-1" aria-hidden>
        <span className="w-7 shrink-0" />
        <span className="flex-1 text-caption font-medium tracking-widest text-neutral-40 uppercase">
          Wallet
        </span>
        <span className="text-caption font-medium tracking-widest text-neutral-40 uppercase">
          points
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={page}
          initial={reduced ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? {} : { opacity: 0, x: -10 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="px-2 pt-1 pb-3"
          aria-label="Leaderboard entries"
        >
          {users.map((entry, i) => {
            const highlighted = isMe(entry, currentUserAddress)
            return (
              <motion.li
                key={entry.walletAddress + entry.rank}
                ref={highlighted ? userRowRef : undefined}
                initial={reduced ? false : { opacity: 0, x: -4, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: reduced ? 0 : Math.min(i * 0.04, 0.28),
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-3.5 transition-colors ${
                  highlighted
                    ? 'bg-green-90 ring-1 ring-primary-green/20'
                    : 'hover:bg-khaki-80/60'
                }`}
              >
                {/* Proportional fill bar — width = entry.points / maxPoints */}
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: Math.round((entry.points / maxPoints) * 100) / 100 }}
                  transition={{
                    duration: 0.65,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduced ? 0 : Math.min(i * 0.04, 0.28) + 0.4,
                  }}
                  className="absolute inset-y-1 left-1 right-1 rounded-lg"
                  style={{
                    backgroundColor: fillBarColor(entry.points / maxPoints, highlighted),
                    transformOrigin: 'left',
                  }}
                />
                {/* Rank */}
                <span className="w-7 shrink-0 text-right font-mono text-small font-bold text-neutral-40 tabular-nums">
                  {entry.rank}
                </span>

                {/* Address */}
                <p
                  className={`min-w-0 flex-1 truncate font-mono text-small font-medium ${
                    highlighted ? 'text-primary-green' : 'text-neutral-30'
                  }`}
                  title={entry.walletAddress}
                >
                  {truncate(entry.walletAddress)}
                  {highlighted && (
                    <motion.span
                      initial={reduced ? false : { opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                      className="ml-2 inline-block text-caption font-bold tracking-[0.2em] text-primary-green uppercase"
                    >
                      you
                    </motion.span>
                  )}
                </p>

                {/* Points */}
                <div className="flex shrink-0 items-center gap-1">
                  <Gem size={10} />
                  <span className="font-mono text-small font-bold text-primary-green tabular-nums">
                    {fmtPts(entry.points)}
                  </span>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </AnimatePresence>

      {/* Pagination — text-link style */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-khaki-70/60 px-4 pt-3 pb-4">
          <span className="text-caption text-neutral-30">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="inline-flex min-h-11 items-center rounded-sm px-2 text-small font-medium text-neutral-40 transition-colors hover:text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-green/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
              className="inline-flex min-h-11 items-center rounded-sm px-2 text-small font-medium text-neutral-40 transition-colors hover:text-neutral-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-green/50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
