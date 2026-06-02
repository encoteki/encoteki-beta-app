'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { LeaderboardUser } from '@/types/leaderboard.types'
import { fmtPts, truncate, Gem } from './utils'

// Brand palette from DESIGN.md — single saturated accent at peak
// fg: color for text/icons ON the colored bar
// labelFg: color for text ABOVE the bar (against page bg khaki-90 #F6F6EC)
const FIRST  = { bg: '#246234', fg: '#F0FAF3', labelFg: '#246234' }  // canopy green — darkest elevation
const SECOND = { bg: '#5D9C72', fg: '#F0FAF3', labelFg: '#246234' }  // medium sage — mid elevation
const THIRD  = { bg: '#9ECFB0', fg: '#246234', labelFg: '#246234' }  // light mint — lowest elevation

// Topographic silhouettes — natural terrain, not trophy pedestals
const WAVES = [
  'polygon(0% 4%, 8% 2%, 18% 5%, 30% 1%, 42% 4%, 54% 2%, 66% 5%, 78% 2%, 88% 4%, 100% 2%, 100% 100%, 0% 100%)',
  'polygon(0% 2%, 10% 5%, 22% 1%, 34% 4%, 46% 2%, 58% 5%, 70% 1%, 82% 4%, 92% 2%, 100% 4%, 100% 100%, 0% 100%)',
  'polygon(0% 3%, 12% 1%, 24% 4%, 36% 2%, 48% 5%, 60% 1%, 72% 3%, 84% 5%, 94% 2%, 100% 4%, 100% 100%, 0% 100%)',
]

// Visual order: left=2nd, center=1st, right=3rd
const PODIUM = [
  { rank: 2, h: 'h-28 tablet:h-32', ...SECOND, wave: WAVES[0], delay: 0.1  },
  { rank: 1, h: 'h-44 tablet:h-48', ...FIRST,  wave: WAVES[1], delay: 0.22 },
  { rank: 3, h: 'h-20 tablet:h-24', ...THIRD,  wave: WAVES[2], delay: 0.34 },
] as const


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
  const [settled, setSettled] = useState(reduced)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    if (reduced) {
      setCount(target)
      setSettled(true)
      return
    }
    setCount(0)
    setSettled(false)
    const timeout = setTimeout(() => {
      const start = performance.now()
      function tick(now: number) {
        const t = Math.min((now - start) / 1000, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setCount(Math.round(eased * target))
        if (t < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          setSettled(true)
        }
      }
      frameRef.current = requestAnimationFrame(tick)
    }, delay * 1000)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(frameRef.current)
    }
  }, [target, delay, reduced])

  return (
    <motion.span
      animate={settled && !reduced ? { scale: [1, 1.08, 1] } : {}}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="inline-block"
    >
      {fmtPts(count)}
    </motion.span>
  )
}

// Sparse seed-mote particles drifting upward from the rank-1 bar surface.
// Spring-mist tinted (rgba 240,250,243), opacity driven by sine curve of y position.
// Pauses via IntersectionObserver when off-screen; never renders with reduced motion.
type Pt = { x: number; y: number; vx: number; vy: number; r: number }

function PodiumParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let visible = true

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    })
    ro.observe(canvas)
    canvas.width = canvas.offsetWidth || 1
    canvas.height = canvas.offsetHeight || 176

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(canvas)

    const mk = (): Pt => ({
      x: Math.random() * canvas.width,
      y: canvas.height + 4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -(0.22 + Math.random() * 0.28),
      r: 1 + Math.random() * 1.5,
    })

    const pts: Pt[] = Array.from({ length: 24 }, () => {
      const p = mk()
      p.y = Math.random() * (canvas.height || 176)
      return p
    })

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      if (!visible) return
      const { width: w, height: h } = canvas
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < -4) p.x = w + 4
        else if (p.x > w + 4) p.x = -4
        if (p.y < -4) Object.assign(p, mk())
        const t = Math.max(0, Math.min(1, 1 - p.y / h))
        const a = (Math.sin(Math.PI * t) * 0.28).toFixed(3)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,250,243,${a})`
        ctx.fill()
      }
    }

    tick()
    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  )
}

interface LeaderboardPodiumProps {
  top3: (LeaderboardUser | null)[]
}

export function LeaderboardPodium({ top3 }: LeaderboardPodiumProps) {
  const reduced = useReducedMotion() ?? false
  const ordered = [top3[1], top3[0], top3[2]]
  const [showParticles, setShowParticles] = useState(false)

  // Mount canvas only after rank-1 bar entrance animation completes (~1.5s)
  // so particles don't render while the bar is still doing its scaleY rise.
  useEffect(() => {
    if (reduced) return
    const t = setTimeout(() => setShowParticles(true), 1500)
    return () => clearTimeout(t)
  }, [reduced])

  return (
    <div className="relative flex items-end justify-center gap-3 tablet:gap-5 pt-8 pb-0">
      {PODIUM.map((cfg, i) => {
        const entry = ordered[i]
        const isCenter = cfg.rank === 1

        return (
          <motion.div
            key={cfg.rank}
            initial={reduced ? false : { opacity: 0, y: isCenter ? 22 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: isCenter ? 0.85 : 0.65,
              ease: [0.16, 1, 0.3, 1],
              delay: reduced ? 0 : cfg.delay,
            }}
            className="flex flex-1 flex-col items-center"
          >
            {/* Info above the bar */}
            <div
              className={`mb-2 flex flex-col items-center gap-1 ${isCenter ? '-translate-y-4' : ''}`}
            >
              {isCenter && entry && (
                <motion.div
                  aria-hidden
                  animate={reduced ? {} : { y: [0, -3, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Gem size={20} color={cfg.labelFg} />
                </motion.div>
              )}

              {entry ? (
                <>
                  <span
                    className={`w-full truncate text-center font-mono ${
                      isCenter ? 'text-small font-bold' : 'text-caption font-medium'
                    }`}
                    style={{ color: cfg.labelFg }}
                    title={entry.walletAddress}
                  >
                    {truncate(entry.walletAddress)}
                  </span>
                  <div className={`flex items-center ${isCenter ? 'gap-1.5' : 'gap-1'}`}>
                    <Gem size={isCenter ? 14 : 10} color={cfg.labelFg} />
                    <span
                      className={`font-mono font-black tracking-tight tabular-nums ${
                        isCenter ? 'text-h3 tablet:text-h2' : 'text-body'
                      }`}
                      style={{ color: cfg.labelFg }}
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
                <span style={{ color: cfg.labelFg, opacity: 0.35 }} className="text-caption">
                  —
                </span>
              )}
            </div>

            {/* Topographic elevation bar — rises from ground on entrance */}
            <motion.div
              className={`${cfg.h} relative w-full overflow-hidden ${!entry ? 'opacity-25' : ''}`}
              initial={reduced ? false : { scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{
                duration: isCenter ? 0.9 : 0.7,
                ease: [0.16, 1, 0.3, 1],
                delay: reduced ? 0 : cfg.delay + 0.25,
              }}
              style={{
                backgroundColor: cfg.bg,
                clipPath: cfg.wave,
                transformOrigin: 'bottom',
              }}
            >
              <span
                className="absolute right-2 bottom-1 select-none font-mono text-7xl font-black leading-none"
                style={{ color: cfg.fg, opacity: 0.15 }}
                aria-hidden
              >
                {cfg.rank}
              </span>
              {showParticles && isCenter && entry && <PodiumParticles />}
            </motion.div>
          </motion.div>
        )
      })}
    </div>
  )
}
