'use client'

import { motion } from 'motion/react'
import {
  CHAIN_LABELS,
  SUPPORTED_VOTE_CHAINS,
} from '@/constants/dao/mock-proposals'
import { ProposalOption } from '@/types/dao.types'

interface VoteBreakdownProps {
  options: ProposalOption[]
  totalVotes: number
  isVisible: boolean
}

/**
 * Displays a breakdown of votes per chain for each option.
 * Shows after a user has voted, with staggered entry animation.
 */
export default function VoteBreakdown({
  options,
  totalVotes,
  isVisible,
}: VoteBreakdownProps) {
  if (!isVisible) return null

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="text-base font-medium tablet:text-lg">
        Vote Breakdown by Chain
      </h3>

      <div className="border-neutral-80 overflow-hidden rounded-2xl border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-neutral-80 bg-neutral-90 border-b">
              <th className="text-neutral-20 px-4 py-3 font-medium">Option</th>
              {SUPPORTED_VOTE_CHAINS.map((chainId) => (
                <th
                  key={chainId}
                  className="text-neutral-20 px-4 py-3 text-center font-medium"
                >
                  {CHAIN_LABELS[chainId]}
                </th>
              ))}
              <th className="text-neutral-20 px-4 py-3 text-center font-medium">
                Total
              </th>
              <th className="text-neutral-20 px-4 py-3 text-center font-medium">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt, idx) => {
              const pct =
                totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
              return (
                <motion.tr
                  key={idx}
                  className="border-neutral-80 border-b last:border-b-0"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.6 + idx * 0.1 }}
                >
                  <td className="px-4 py-3 font-medium">{opt.label}</td>
                  {SUPPORTED_VOTE_CHAINS.map((chainId) => (
                    <td key={chainId} className="px-4 py-3 text-center">
                      {opt.votesByChain[chainId] || 0}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-semibold">
                    {opt.votes}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {pct}%
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <motion.p
        className="text-xs text-neutral-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        Total votes: {totalVotes} across {SUPPORTED_VOTE_CHAINS.length} chains
        (Base Sepolia + Arbitrum Sepolia)
      </motion.p>
    </motion.div>
  )
}
