/**
 * Countdown string to `votingEnds` as of `now`. `now` is passed in (rather
 * than read internally via `Date.now()`) so callers can drive a live tick
 * via `useCountdown` without this function itself causing re-renders.
 */
export function getTimeRemaining(votingEnds: string, now: number): string {
  const diffMs = new Date(votingEnds).getTime() - now

  if (diffMs <= 0) return 'Voting ended'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return `Voting ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Absolute, human-readable voting deadline, e.g. "Jul 16, 2026, 6:55 PM".
 */
export function formatVotingEndsAbsolute(votingEnds: string): string {
  const d = new Date(votingEnds)
  if (isNaN(d.getTime())) return ''

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
