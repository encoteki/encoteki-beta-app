'use client'

import { motion, type Variants } from 'framer-motion' // ← use framer-motion

interface CheckmarkProps {
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

export function Checkmark({
  size = 50,
  strokeWidth = 6,
  color = 'currentColor',
  className = '',
}: CheckmarkProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      // Parent drives the variant labels:
      initial="hidden"
      animate="visible"
      className={className}
    >
      <title>Animated Checkmark</title>

      {/* You can optionally add strokeDasharray to ensure pathLength draws nicely */}
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
          // strokeDasharray: '0 1', // optional, sometimes helps with pathLength visuals
        }}
      />

      <motion.path
        d="M30 50L45 65L70 35"
        stroke={color}
        variants={draw}
        custom={1}
        style={{
          strokeWidth,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          fill: 'transparent',
          // strokeDasharray: '0 1', // optional
        }}
      />
    </motion.svg>
  )
}
