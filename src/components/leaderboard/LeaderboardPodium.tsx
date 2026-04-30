'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { LeaderboardUser } from './types'

const GREEN = '#246234'

// Paper grain — matches brand sticker-album tactile feel
const GRAIN =
  'repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(0,0,0,0.032) 3px, rgba(0,0,0,0.032) 4px)'

// Warm palette: amber is the ONE accent on screen (1st only)
const AMBER = { bg: '#F0C040', fg: '#3D2200' }
const MINT = { bg: '#7EC28C', fg: '#0F2915' }
const OLIVE = { bg: '#C4C468', fg: '#272700' }

// Visual order: left = 2nd, center = 1st, right = 3rd
const PODIUM = [
  { rank: 2, h: 'h-28 tablet:h-32', ...MINT, delay: 0.1 },
  { rank: 1, h: 'h-44 tablet:h-48', ...AMBER, delay: 0.22 },
  { rank: 3, h: 'h-20 tablet:h-24', ...OLIVE, delay: 0.34 },
] as const

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function fmtPts(pts: number) {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}k`
  return pts.toLocaleString()
}

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

function Crown({ color }: { color: string }) {
  return (
    <svg width="22" height="16" viewBox="0 0 18 13" fill="none" aria-hidden>
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

function CountUp({
  target,
  delay,
  reduced,
}: {
  target: number
  delay: number
  reduced: boolean
}) {
  const [count, setCount] = useState(reduced ? target : 0)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (reduced) {
      setCount(target)
      return
    }
    setCount(0)
    const timeout = setTimeout(() => {
      const start = performance.now()
      function tick(now: number) {
        const t = Math.min((now - start) / 1000, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setCount(Math.round(eased * target))
        if (t < 1) frameRef.current = requestAnimationFrame(tick)
      }
      frameRef.current = requestAnimationFrame(tick)
    }, delay * 1000)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, delay, reduced])

  return <>{fmtPts(count)}</>
}

interface LeaderboardPodiumProps {
  top3: (LeaderboardUser | null)[]
}

export function LeaderboardPodium({ top3 }: LeaderboardPodiumProps) {
  const reduced = useReducedMotion() ?? false
  const ordered = [top3[1], top3[0], top3[2]]

  return (
    <div className="relative flex items-end justify-center gap-2 pt-12 pb-0">
      {PODIUM.map((cfg, i) => {
        const entry = ordered[i]
        const isCenter = cfg.rank === 1

        return (
          <motion.div
            key={cfg.rank}
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.16, 1, 0.3, 1],
              delay: reduced ? 0 : cfg.delay,
            }}
            className="flex flex-1 flex-col items-center"
          >
            <div
              className={`mb-2 flex flex-col items-center gap-1 ${isCenter ? '-translate-y-4' : ''}`}
            >
              {isCenter && entry && <Crown color={cfg.fg} />}

              {entry ? (
                <>
                  <span
                    className={`max-w-24 truncate text-center font-mono font-bold ${
                      isCenter
                        ? 'text-sm text-primary-green'
                        : 'text-xs text-neutral-30'
                    }`}
                    title={entry.walletAddress}
                  >
                    {truncate(entry.walletAddress)}
                  </span>
                  <div
                    className={`flex items-center ${isCenter ? 'gap-1.5' : 'gap-1'}`}
                  >
                    <Gem size={isCenter ? 14 : 10} />
                    <span
                      className={`font-mono font-black tracking-tight tabular-nums ${
                        isCenter ? 'text-[22px]' : 'text-base'
                      }`}
                      style={{ color: cfg.fg }}
                    >
                      <CountUp
                        target={entry.points}
                        delay={cfg.delay}
                        reduced={reduced}
                      />
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`shrink-0 rounded-full ${isCenter ? 'h-14 w-14' : 'h-10 w-10'}`}
                    style={{ backgroundColor: cfg.bg, opacity: 0.4 }}
                  />
                  <span className="text-[11px] text-neutral-40">—</span>
                </>
              )}
            </div>

            {/* Podium bar with paper grain */}
            <div
              className={`${cfg.h} relative w-full overflow-hidden rounded-t-2xl ${!entry ? 'opacity-30' : ''}`}
              style={{ backgroundColor: cfg.bg, backgroundImage: GRAIN }}
            >
              <span
                className="absolute right-2 bottom-1 font-mono text-7xl leading-none font-black select-none"
                style={{ color: cfg.fg, opacity: 0.22 }}
                aria-hidden
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
