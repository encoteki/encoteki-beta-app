'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useReducedMotion, motion } from 'motion/react'
import type { LeaderboardEntry } from '@/actions/leaderboard'

const GREEN = '#246234'
const PAGE_SIZE = 10

// Podium palette — saturated enough to read as distinct tiers
const PODIUM_AMBER = { bg: '#F0C040', fg: '#3D2200' } // 1st: honey reward
const PODIUM_MINT = { bg: '#7EC28C', fg: '#0F2915' } // 2nd: forest mint
const PODIUM_OLIVE = { bg: '#C4C468', fg: '#272700' } // 3rd: warm olive

// Visual order: [2nd, 1st, 3rd]
const PODIUM = [
  { heightClass: 'h-32', ...PODIUM_MINT, rank: '2' },
  { heightClass: 'h-44', ...PODIUM_AMBER, rank: '1' },
  { heightClass: 'h-24', ...PODIUM_OLIVE, rank: '3' },
] as const

// Paper grain texture for podium bars (catalog sticker-album feel)
const GRAIN_BG =
  'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.035) 3px, rgba(0,0,0,0.035) 4px)'

// Address-derived avatar palette — warm earth tones
const AVATAR_PALETTE = [
  { bg: '#FDE9B0', fg: '#7A4E0E' },
  { bg: '#D0E8D4', fg: '#163C20' },
  { bg: '#CEEEFD', fg: '#044462' },
  { bg: '#E7E7C0', fg: '#515351' },
  { bg: '#FBE8E2', fg: '#A0281A' },
  { bg: '#F0FAF3', fg: '#246234' },
]

function avatarStyle(address: string) {
  const n = address.split('').reduce((s, c) => s + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length]
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function fmtPts(pts: number) {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}k`
  return pts.toLocaleString()
}

function Gem({ size = 10 }: { size?: number }) {
  const h = Math.round(size * 1.3)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 10 13"
      fill="none"
      aria-hidden="true"
    >
      <path d="M5 0L10 4.5H0L5 0Z" fill={GREEN} opacity="0.5" />
      <path d="M0 4.5L5 13L10 4.5H0Z" fill={GREEN} opacity="0.85" />
    </svg>
  )
}

function Crown({ color }: { color: string }) {
  return (
    <svg
      width="22"
      height="16"
      viewBox="0 0 18 13"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 12H16.5M2 12L4 5L7.5 8.5L9 1L10.5 8.5L14 5L16 12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Avatar({
  address,
  size,
  ringColor,
}: {
  address: string
  size: 'sm' | 'md' | 'lg'
  ringColor?: string
}) {
  const { bg, fg } = avatarStyle(address)
  const cls =
    size === 'lg'
      ? 'h-14 w-14 text-sm'
      : size === 'md'
        ? 'h-10 w-10 text-xs'
        : 'h-8 w-8 text-[10px]'
  return (
    <div
      className={`${cls} flex flex-shrink-0 items-center justify-center rounded-full font-mono font-bold`}
      style={{
        backgroundColor: bg,
        color: fg,
        outline: `2.5px solid ${ringColor ?? '#F9F9F6'}`,
        outlineOffset: '2px',
      }}
    >
      {address.slice(2, 4).toUpperCase()}
    </div>
  )
}

// ─── Podium ───────────────────────────────────────────────────────────────────

function PodiumSection({
  entries,
  reduced,
}: {
  entries: LeaderboardEntry[]
  reduced: boolean
}) {
  const top3: (LeaderboardEntry | null)[] = [
    entries[0] ?? null,
    entries[1] ?? null,
    entries[2] ?? null,
  ]
  // Visual order: [2nd, 1st, 3rd]
  const ordered = [top3[1], top3[0], top3[2]]

  return (
    <div
      className="relative flex items-end justify-center gap-2 px-4 pt-12 pb-0"
      style={{
        background: `radial-gradient(ellipse 100% 70% at 50% -5%, ${PODIUM_AMBER.bg}60 0%, transparent 65%)`,
      }}
    >
      {ordered.map((entry, i) => {
        const cfg = PODIUM[i]
        const isCenter = i === 1

        return (
          <motion.div
            key={entry?.address ?? `empty-${i}`}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
              delay: reduced ? 0 : 0.06 + i * 0.1,
            }}
            className="flex flex-1 flex-col items-center"
          >
            {/* Avatar + label above bar */}
            <div
              className={`mb-2 flex flex-col items-center gap-1 ${isCenter ? '-translate-y-4' : ''}`}
            >
              {isCenter && entry && <Crown color={cfg.fg} />}

              {entry ? (
                <>
                  <Avatar
                    address={entry.address}
                    size={isCenter ? 'lg' : 'md'}
                    ringColor={cfg.bg}
                  />
                  <span
                    className={`max-w-[96px] truncate text-center font-mono font-bold ${isCenter ? 'text-sm text-primary-green' : 'text-xs text-neutral-30'}`}
                    title={entry.address}
                  >
                    {truncate(entry.address)}
                  </span>
                  <div
                    className={`flex items-center ${isCenter ? 'gap-1.5' : 'gap-1'}`}
                  >
                    <Gem size={isCenter ? 14 : 10} />
                    <span
                      className={`font-mono font-black tracking-tight tabular-nums ${isCenter ? 'text-[22px]' : 'text-base'}`}
                      style={{ color: cfg.fg }}
                    >
                      {fmtPts(entry.points)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`flex flex-shrink-0 rounded-full ${isCenter ? 'h-14 w-14' : 'h-10 w-10'}`}
                    style={{ backgroundColor: cfg.bg, opacity: 0.45 }}
                  />
                  <span className="text-[11px] text-neutral-40">—</span>
                </>
              )}
            </div>

            {/* Bar */}
            <div
              className={`${cfg.heightClass} relative w-full overflow-hidden rounded-t-2xl ${!entry ? 'opacity-30' : ''}`}
              style={{ backgroundColor: cfg.bg, backgroundImage: GRAIN_BG }}
            >
              <span
                className="absolute right-2 bottom-1 font-mono text-7xl leading-none font-black select-none"
                style={{ color: cfg.fg, opacity: 0.22 }}
                aria-hidden="true"
              >
                {cfg.rank}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function SkeletonPodium() {
  const heights = ['h-32', 'h-44', 'h-24'] as const
  const avatarSizes = ['h-10 w-10', 'h-14 w-14', 'h-10 w-10'] as const
  return (
    <div className="flex items-end justify-center gap-2 px-4 pt-12 pb-0">
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

// ─── List rows ────────────────────────────────────────────────────────────────

function ListRow({
  entry,
  index,
  reduced,
}: {
  entry: LeaderboardEntry
  index: number
  reduced: boolean
}) {
  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay: reduced ? 0 : Math.min(index * 0.04, 0.28),
      }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-khaki-90"
    >
      {/* Rank */}
      <span className="w-7 flex-shrink-0 text-right font-mono text-sm font-bold text-neutral-40 tabular-nums">
        {entry.rank}
      </span>

      <Avatar address={entry.address} size="sm" />

      {/* Address — single line */}
      <p
        className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-neutral-30"
        title={entry.address}
      >
        {truncate(entry.address)}
      </p>

      {/* Points */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <Gem size={10} />
        <span className="font-mono text-sm font-bold text-primary-green tabular-nums">
          {fmtPts(entry.points)}
        </span>
      </div>
    </motion.li>
  )
}

function SkeletonListRow({ delay }: { delay: number }) {
  return (
    <li
      className="flex items-center gap-3 px-3 py-2.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="h-4 w-7 animate-pulse rounded bg-khaki-70" />
      <div className="h-8 w-8 animate-pulse rounded-full bg-khaki-70" />
      <div className="h-3 w-32 flex-1 animate-pulse rounded bg-khaki-70" />
      <div className="h-3.5 w-12 animate-pulse rounded bg-khaki-70" />
    </li>
  )
}

function EmptyState({ isSearch }: { isSearch: boolean }) {
  return (
    <li className="flex flex-col items-center gap-2 px-4 py-14 text-center">
      <p className="text-sm font-medium text-neutral-30">
        {isSearch ? 'No matching address found.' : 'No points recorded yet.'}
      </p>
      {!isSearch && (
        <p className="max-w-64 text-xs leading-relaxed text-neutral-40">
          Mint an NFT or share your referral code to earn your first points and
          appear here.
        </p>
      )}
    </li>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const reduced = useReducedMotion() ?? false

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((entries: LeaderboardEntry[]) => setAllEntries(entries))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allEntries
    return allEntries.filter((e) => e.address.toLowerCase().includes(q))
  }, [search, allEntries])

  const showPodium = !search.trim() && (loading || allEntries.length >= 1)

  const listEntries = useMemo(() => {
    if (search.trim()) return filtered
    return allEntries.slice(3)
  }, [search, filtered, allEntries])

  const totalPages = Math.max(1, Math.ceil(listEntries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)

  const pageEntries = useMemo(
    () => listEntries.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [listEntries, safePage],
  )

  const handleSearch = useCallback((val: string) => {
    setSearch(val)
    setPage(1)
  }, [])

  return (
    <section
      aria-labelledby="leaderboard-heading"
      className="flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-[0.3em] text-neutral-40 uppercase">
              Season I
            </span>
            <div
              className="h-px flex-1 bg-neutral-60/40"
              style={{ minWidth: '1.5rem' }}
            />
          </div>
          <h2
            id="leaderboard-heading"
            className="text-4xl leading-tight font-normal text-primary-green tablet:text-5xl"
            style={{ fontFamily: 'var(--font-display, serif)' }}
          >
            Leaderboard
          </h2>
        </div>

        {!loading && allEntries.length > 0 && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="flex flex-col items-end gap-0"
          >
            <span className="font-mono text-2xl leading-none font-bold text-primary-green tabular-nums">
              {allEntries.length}
            </span>
            <span className="text-[9.5px] font-semibold tracking-[0.2em] text-neutral-40 uppercase">
              participants
            </span>
          </motion.div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-neutral-40"
          width="14"
          height="14"
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
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by address…"
          className="w-full rounded-full border border-khaki-70 bg-khaki-99 py-2.5 pr-4 pl-10 font-mono text-sm text-neutral-30 placeholder:text-neutral-40 focus:border-primary-green focus:ring-2 focus:ring-primary-green/20 focus:outline-none"
          aria-label="Search leaderboard by address"
        />
        {search && (
          <button
            onClick={() => handleSearch('')}
            className="absolute top-1/2 right-3 flex min-h-[32px] min-w-[32px] -translate-y-1/2 items-center justify-center p-2 text-neutral-40 hover:text-neutral-30"
            aria-label="Clear search"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
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

      {/* Card */}
      <div className="overflow-hidden rounded-2xl border border-khaki-70 bg-khaki-99">
        {/* Podium */}
        {showPodium && (
          <>
            {loading ? (
              <SkeletonPodium />
            ) : (
              <PodiumSection
                entries={allEntries.slice(0, 3)}
                reduced={reduced}
              />
            )}
            <div className="mx-4 mt-4 border-t border-khaki-70" />
          </>
        )}

        {/* List */}
        <ul
          aria-live="polite"
          aria-busy={loading}
          aria-label={loading ? 'Loading leaderboard…' : 'Leaderboard entries'}
          className="divide-y divide-khaki-70/50 px-2 pt-1 pb-2"
        >
          {loading ? (
            Array.from({ length: showPodium ? 4 : 8 }).map((_, i) => (
              <SkeletonListRow key={i} delay={i * 60} />
            ))
          ) : pageEntries.length === 0 ? (
            <EmptyState isSearch={!!search.trim()} />
          ) : (
            pageEntries.map((entry, i) => (
              <ListRow
                key={entry.address}
                entry={entry}
                index={i}
                reduced={reduced}
              />
            ))
          )}
        </ul>
      </div>

      {/* Pagination */}
      {!loading && listEntries.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-neutral-40">
            {search.trim()
              ? `${listEntries.length} result${listEntries.length !== 1 ? 's' : ''}`
              : `Page ${safePage} of ${totalPages}`}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="min-h-[44px] rounded-full border border-khaki-70 bg-khaki-99 px-4 py-2.5 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="min-h-[44px] rounded-full border border-khaki-70 bg-khaki-99 px-4 py-2.5 text-xs font-medium text-neutral-30 transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-40"
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
