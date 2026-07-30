'use client'

import { useEffect, useState } from 'react'
import { getTimeRemaining } from '@/utils/dao-time.util'

/**
 * Live "voting ends in HH:MM:SS" label, ticking every second off a single
 * mount-long interval. `votingEnds` is read fresh on every render, so a
 * refetch that changes it is reflected immediately (via the render it
 * already triggers) — no separate resync logic needed.
 */
export function useCountdown(votingEnds: string): string {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  return getTimeRemaining(votingEnds, now)
}
