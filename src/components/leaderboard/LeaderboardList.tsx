'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { LeaderboardUser } from './types'

const GREEN = '#246234'

function Gem({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 10 13"
      fill="none"
      aria-hidden
    >
      <path d="M5 0L10 4.5H0L5 0Z" fill={GREEN} opacity="0.5" />
      <path d="M0 4.5L5 13L10 4.5H0Z" fill={GREEN} opacity="0.85" />
    </svg>
  )
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function fmtPts(pts: number) {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}k`
  return pts.toLocaleString()
}

function isMe(entry: LeaderboardUser, currentAddress?: string) {
  if (entry.isCurrentUser) return true
  if (!currentAddress) return false
  return entry.walletAddress.toLowerCase() === currentAddress.toLowerCase()
}

interface LeaderboardListProps {
  users: LeaderboardUser[]
  currentUserAddress?: string
  pageSize: number
}

export function LeaderboardList({
  users,
  currentUserAddress,
  pageSize,
}: LeaderboardListProps) {
  const [page, setPage] = useState(1)
  const reduced = useReducedMotion() ?? false

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const pageUsers = useMemo(
    () => users.slice((safePage - 1) * pageSize, safePage * pageSize),
    [users, safePage, pageSize],
  )

  return (
    <div>
      <AnimatePresence mode="wait">
        <motion.ul
          key={safePage}
          initial={reduced ? false : { opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? {} : { opacity: 0, x: -10 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="divide-y divide-khaki-70/50 px-2 pt-1 pb-2"
          aria-label="Leaderboard entries"
          aria-live="polite"
        >
          {pageUsers.map((entry, i) => {
            const highlighted = isMe(entry, currentUserAddress)
            return (
              <motion.li
                key={entry.walletAddress + entry.rank}
                initial={reduced ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: reduced ? 0 : Math.min(i * 0.04, 0.28),
                  duration: 0.4,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  highlighted ? '' : 'hover:bg-khaki-90'
                }`}
              >
                {highlighted && (
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      backgroundColor: '#24623408',
                      outline: '1.5px solid #24623430',
                      outlineOffset: '-1px',
                    }}
                    animate={reduced ? {} : { opacity: [0.6, 1, 0.6] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                )}

                {/* Rank */}
                <span className="w-7 shrink-0 text-right font-mono text-sm font-bold text-neutral-40 tabular-nums">
                  {entry.rank}
                </span>

                {/* Address */}
                <p
                  className={`min-w-0 flex-1 truncate font-mono text-sm font-medium ${
                    highlighted ? 'text-primary-green' : 'text-neutral-30'
                  }`}
                  title={entry.walletAddress}
                >
                  {truncate(entry.walletAddress)}
                  {highlighted && (
                    <span className="ml-2 text-[10px] font-semibold tracking-[0.2em] text-primary-green/50 uppercase">
                      you
                    </span>
                  )}
                </p>

                {/* Points */}
                <div className="flex shrink-0 items-center gap-1">
                  <Gem size={10} />
                  <span className="font-mono text-sm font-bold text-primary-green tabular-nums">
                    {fmtPts(entry.points)}
                  </span>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-khaki-70 px-3 py-3">
          <span className="text-xs text-neutral-40">
            Page {safePage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="min-h-10 rounded-full border border-khaki-70 bg-khaki-99 px-4 py-2 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="min-w-10 text-center text-xs font-medium text-neutral-30 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="min-h-10 rounded-full border border-khaki-70 bg-khaki-99 px-4 py-2 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
