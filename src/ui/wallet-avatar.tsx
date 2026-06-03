// Deterministic OKLCH identicon. Golden-angle hue offset (137°) distributes
// colors perceptually across addresses with no external dependency.
export function WalletAvatar({
  address,
  size = 40,
}: {
  address: string
  size?: number
}) {
  const hue = parseInt(address.slice(2, 8), 16) % 360
  const hue2 = (hue + 137) % 360
  const hue3 = (hue + 80) % 360
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      style={{ borderRadius: '50%', display: 'block', flexShrink: 0 }}
      aria-hidden="true"
    >
      <rect width="40" height="40" fill={`oklch(0.58 0.11 ${hue})`} />
      <circle
        cx="13"
        cy="15"
        r="13"
        fill={`oklch(0.72 0.09 ${hue2})`}
        opacity="0.65"
      />
      <circle
        cx="30"
        cy="28"
        r="11"
        fill={`oklch(0.42 0.13 ${hue3})`}
        opacity="0.6"
      />
    </svg>
  )
}
