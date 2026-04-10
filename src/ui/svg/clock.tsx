'use client'

import { motion } from 'framer-motion'

interface ClockProps {
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
}

export default function Clock({
  size = 50,
  color = 'currentColor',
  className = '',
}: ClockProps) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      fill={color}
      className={className}
      viewBox="0 0 256 256"
      initial={{ rotate: 0, scale: 0.8, opacity: 0 }}
      animate={{ rotate: 360, scale: 1, opacity: 1 }}
      transition={{
        scale: { type: 'spring', stiffness: 150, damping: 10, delay: 0.2 },
        opacity: { duration: 0.5 },
      }}
    >
      <motion.path
        d="M232,136.66A104.12,104.12,0,1,1,119.34,24,8,8,0,0,1,120.66,40,88.12,88.12,0,1,0,216,135.34,8,8,0,0,1,232,136.66ZM120,72v56a8,8,0,0,0,8,8h56a8,8,0,0,0,0-16H136V72a8,8,0,0,0-16,0Zm40-24a12,12,0,1,0-12-12A12,12,0,0,0,160,48Zm36,24a12,12,0,1,0-12-12A12,12,0,0,0,196,72Zm24,36a12,12,0,1,0-12-12A12,12,0,0,0,220,108Z"
        fill={color}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />
    </motion.svg>
  )
}
