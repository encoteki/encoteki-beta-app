const GREEN = '#246234'

export function fmtPts(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(1)}k`
  return pts.toLocaleString()
}

export function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function Gem({
  size = 10,
  color = GREEN,
}: {
  size?: number
  color?: string
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.3)}
      viewBox="0 0 10 13"
      fill="none"
      aria-hidden
    >
      <path d="M5 0L10 4.5H0L5 0Z" fill={color} opacity="0.55" />
      <path d="M0 4.5L5 13L10 4.5H0Z" fill={color} opacity="0.9" />
    </svg>
  )
}
