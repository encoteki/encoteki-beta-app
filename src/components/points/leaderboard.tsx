'use client'

import { useState, useEffect, useRef } from 'react'
import { useReducedMotion, motion } from 'motion/react'
import type { LeaderboardEntry } from '@/actions/leaderboard'

const AMBER = '#C4832A'
const AMBER_DEEP = '#7A4E0E'
const PAGE_SIZE = 10

function truncateAddress(addr: string) {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr
}

function formatPoints(pts: number) {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}k`
  return pts.toLocaleString()
}

const RANK_STYLES: Record<
  number,
  { color: string; size: string; rowBg: string; hoverBg: string }
> = {
  1: {
    color: AMBER,
    size: 'text-base font-bold',
    rowBg: 'bg-khaki-60/30',
    hoverBg: 'hover:bg-khaki-60/40',
  },
  2: {
    color: '#9B7030',
    size: 'text-sm font-semibold',
    rowBg: 'bg-khaki-60/18',
    hoverBg: 'hover:bg-khaki-60/26',
  },
  3: {
    color: '#8B6535',
    size: 'text-sm font-semibold',
    rowBg: 'bg-khaki-60/10',
    hoverBg: 'hover:bg-khaki-60/18',
  },
}

const COLS = '2.75rem 1fr auto'

function SkeletonRow({ delay }: { delay: number }) {
  return (
    <div
      role="row"
      aria-hidden="true"
      className="-mx-5 grid animate-pulse items-center gap-6 px-5 py-4"
      style={{ gridTemplateColumns: COLS, animationDelay: `${delay}ms` }}
    >
      <div className="h-4 w-7 rounded bg-khaki-70" />
      <div className="h-4 w-44 max-w-full rounded bg-khaki-70" />
      <div className="h-7 w-20 rounded-full bg-khaki-70" />
    </div>
  )
}

function EmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <div className="-mx-5 flex flex-col items-center gap-2 px-5 py-16 text-center">
      <p className="text-sm font-medium text-neutral-30">
        {isSearch ? 'No matching address found.' : 'No points recorded yet.'}
      </p>
      {!isSearch && (
        <p className="max-w-64 text-xs leading-relaxed text-neutral-40">
          Mint an NFT or share your referral code to earn your first points and
          appear here.
        </p>
      )}
    </div>
  )
}

function PointsPill({ pts, amber }: { pts: number; amber: boolean }) {
  if (amber) {
    return (
      <span
        role="cell"
        className="inline-flex items-center rounded-full px-3 py-1 font-mono text-sm font-semibold tabular-nums"
        style={{ background: `${AMBER}2E`, color: AMBER_DEEP }}
      >
        {formatPoints(pts)}
      </span>
    )
  }
  return (
    <span
      role="cell"
      className="font-mono text-sm font-semibold tabular-nums text-primary-green"
    >
      {formatPoints(pts)}
    </span>
  )
}

function Row({
  entry,
  index,
  reduced,
}: {
  entry: LeaderboardEntry
  index: number
  reduced: boolean
}) {
  const style = RANK_STYLES[entry.rank]
  const rankColor = style?.color ?? '#246234'
  const rankSize = style?.size ?? 'text-sm font-semibold'
  const rowBg = style?.rowBg ?? ''
  const hoverBg = style?.hoverBg ?? 'hover:bg-khaki-80/80'
  const isTop3 = entry.rank <= 3

  return (
    <motion.div
      role="row"
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
        delay: reduced ? 0 : Math.min(index * 0.05, 0.4),
      }}
      className={`-mx-5 grid cursor-default items-center gap-6 px-5 py-4 transition-colors duration-150 ${rowBg} ${hoverBg}`}
      style={{ gridTemplateColumns: COLS }}
    >
      <span
        role="cell"
        className={`font-mono tabular-nums ${rankSize}`}
        style={{ color: rankColor }}
      >
        {String(entry.rank).padStart(2, '0')}
      </span>

      <span
        role="cell"
        className="truncate font-mono text-sm text-neutral-30"
        title={entry.address}
      >
        {truncateAddress(entry.address)}
      </span>

      <PointsPill pts={entry.points} amber={isTop3} />
    </motion.div>
  )
}

export default function Leaderboard() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const reduced = useReducedMotion() ?? false
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((entries: LeaderboardEntry[]) => setAllEntries(entries))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? allEntries.filter((e) =>
        e.address.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : allEntries

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageEntries = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  function handleSearch(val: string) {
    setSearch(val)
    setPage(1)
  }

  return (
    <section aria-labelledby="leaderboard-heading" className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-neutral-40">
            Season 1
          </span>
          <h3
            id="leaderboard-heading"
            className="text-xl font-medium leading-snug text-primary-green tablet:text-2xl"
          >
            Leaderboard
          </h3>
        </div>

        {!loading && allEntries.length > 0 && (
          <motion.span
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-full bg-primary-green/10 px-3 py-1 text-xs font-medium text-primary-green"
          >
            {allEntries.length} participant{allEntries.length !== 1 ? 's' : ''}
          </motion.span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-neutral-40"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm-.818 3.596a4.5 4.5 0 1 1 .707-.707l2.761 2.76a.5.5 0 0 1-.707.708l-2.76-2.761Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by address…"
          className="w-full rounded-xl border border-khaki-70 bg-khaki-99 py-2.5 pr-4 pl-9 font-mono text-sm text-neutral-30 placeholder:text-neutral-40 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 focus:outline-none"
          aria-label="Search leaderboard by address"
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-40 hover:text-neutral-30"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M1 1l12 12M13 1 1 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div
        role="table"
        aria-label="Points leaderboard"
        aria-busy={loading}
        className="overflow-hidden rounded-2xl border border-khaki-70 bg-khaki-99"
      >
        {/* Column headers */}
        <div
          role="rowgroup"
          className="border-b border-khaki-70"
          style={{ backgroundColor: '#246234' }}
        >
          <div
            role="row"
            className="grid items-center gap-6 px-5 py-3"
            style={{ gridTemplateColumns: COLS }}
          >
            <span
              role="columnheader"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70"
            >
              #
            </span>
            <span
              role="columnheader"
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70"
            >
              Address
            </span>
            <span
              role="columnheader"
              aria-sort="descending"
              className="text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70"
            >
              Points
            </span>
          </div>
        </div>

        {/* Rows */}
        <div
          role="rowgroup"
          className="divide-y divide-khaki-70 px-5"
          aria-live="polite"
          aria-label={loading ? 'Loading leaderboard…' : undefined}
        >
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <SkeletonRow key={i} delay={i * 70} />
            ))
          ) : pageEntries.length === 0 ? (
            <EmptyState isSearch={!!search.trim()} />
          ) : (
            pageEntries.map((entry, i) => (
              <Row
                key={entry.address}
                entry={entry}
                index={i}
                reduced={reduced}
              />
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-neutral-40">
            {search.trim()
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
              : `Page ${safePage} of ${totalPages}`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-khaki-70 bg-khaki-99 px-3 py-1.5 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              Prev
            </button>

            <span className="min-w-[3rem] text-center text-xs font-medium text-neutral-30">
              {safePage} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-khaki-70 bg-khaki-99 px-3 py-1.5 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
