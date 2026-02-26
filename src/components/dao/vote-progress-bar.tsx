'use client'

import { motion } from 'motion/react'
import { ProposalType } from '@/enums/dao-types.enum'

interface VoteProgressBarProps {
  label: string
  votes: number
  totalVotes: number
  percentage: number
  type: ProposalType
  isSelected?: boolean
  isVoted?: boolean
  index: number
}

/**
 * Color schemes per proposal type for the progress bar.
 */
const BAR_COLORS: Record<
  ProposalType,
  { bg: string; fill: string; text: string }
> = {
  [ProposalType.DONATION]: {
    bg: '#E8F4FD',
    fill: '#044462',
    text: '#044462',
  },
  [ProposalType.PROPOSAL]: {
    bg: '#FEF3CD',
    fill: '#644E02',
    text: '#644E02',
  },
  [ProposalType.BUSINESS]: {
    bg: '#DEF2D9',
    fill: '#244C1A',
    text: '#244C1A',
  },
}

export default function VoteProgressBar({
  label,
  votes,
  totalVotes,
  percentage,
  type,
  isSelected = false,
  isVoted = false,
  index,
}: VoteProgressBarProps) {
  const colors = BAR_COLORS[type]

  return (
    <div className="space-y-2">
      {/* Label + vote count */}
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium tablet:text-base ${isSelected ? 'font-semibold' : ''}`}
        >
          {label}
          {isSelected && isVoted && (
            <span className="ml-2 text-xs text-primary-green">✓ Your vote</span>
          )}
        </span>
        <span className="text-xs text-neutral-30 tablet:text-sm">
          {votes} {votes === 1 ? 'vote' : 'votes'} ({percentage}%)
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-3 w-full overflow-hidden rounded-full tablet:h-4"
        style={{ backgroundColor: colors.bg }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: colors.fill }}
          initial={{ width: '0%' }}
          animate={{ width: isVoted ? `${percentage}%` : '0%' }}
          transition={{
            duration: 1,
            delay: index * 0.15,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />

        {/* Glow effect on animation */}
        {isVoted && percentage > 0 && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full opacity-40 blur-sm"
            style={{ backgroundColor: colors.fill }}
            initial={{ width: '0%' }}
            animate={{ width: `${percentage}%` }}
            transition={{
              duration: 1.2,
              delay: index * 0.15,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        )}
      </div>
    </div>
  )
}
