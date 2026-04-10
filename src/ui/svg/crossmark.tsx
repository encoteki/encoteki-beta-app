'use client'

import { motion, type Variants } from 'framer-motion'

interface CrossmarkProps {
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        delay: i * 0.2,
        type: 'spring',
        duration: 1.5,
        bounce: 0.2,
        ease: 'easeInOut',
      },
      opacity: { delay: i * 0.2, duration: 0.2 },
    },
  }),
}

export function Crossmark({
  size = 50,
  strokeWidth = 6,
  color = 'currentColor',
  className = '',
}: CrossmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Crossmark</title>

      {/* Outer circle */}
      <motion.circle
        cx="50"
        cy="50"
        r="40"
        stroke={color}
        variants={draw}
        custom={0}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          fill: 'transparent',
        }}
      />

      {/* X strokes */}
      <motion.path
        d="M35 35L65 65"
        stroke={color}
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'transparent',
        }}
      />
      <motion.path
        d="M65 35L35 65"
        stroke={color}
        variants={draw}
        custom={2}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'transparent',
        }}
      />
    </motion.svg>
  )
}
