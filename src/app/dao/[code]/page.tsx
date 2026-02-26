'use client'

import { ProposalType } from '@/enums/dao-types.enum'
import Badge from '@/ui/badge'
import Breadcrumbs from '@/ui/navs/breadcrumbs'
import DefaultButton from '@/ui/buttons/default-btn'
import { use, useMemo } from 'react'
import URL_ROUTES from '@/constants/url-route'
import {
  getProposalByCode,
  getVotePercentage,
  CHAIN_LABELS,
  SUPPORTED_VOTE_CHAINS,
} from '@/constants/dao/mock-proposals'
import { useVoting } from '@/hooks/useVoting'
import VoteProgressBar from '@/components/dao/vote-progress-bar'
import VoteBreakdown from '@/components/dao/vote-breakdown'
import { motion, AnimatePresence } from 'motion/react'

interface DaoDetailPageProps {
  params: Promise<{ code: string }>
}

/**
 * Compute time remaining from endTime string.
 */
function getTimeRemaining(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const diffMs = end.getTime() - now.getTime()

  if (diffMs <= 0) return 'Voting ended'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return `Voting ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getCreatedLabel(createdAt: string): string {
  const now = new Date()
  const created = new Date(createdAt)
  const diffDays = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) return 'Created today'
  if (diffDays === 1) return 'Created 1 day ago'
  return `Created ${diffDays} days ago`
}

export default function DaoDetailPage({ params }: DaoDetailPageProps) {
  const { code } = use<{ code: string }>(params)

  const initialProposal = getProposalByCode(code)

  // If proposal not found, show 404-like state
  if (!initialProposal) {
    return (
      <main className="dao-container">
        <div className="dao-section">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <h2 className="font-medium">Proposal not found</h2>
            <p className="text-neutral-30">
              No proposal with code &ldquo;{code}&rdquo; exists.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return <DaoDetailContent code={code} initialProposal={initialProposal} />
}

/**
 * Inner component that uses the useVoting hook (requires initialProposal to exist).
 */
function DaoDetailContent({
  code,
  initialProposal,
}: {
  code: string
  initialProposal: NonNullable<ReturnType<typeof getProposalByCode>>
}) {
  const {
    proposal,
    selectedOption,
    setSelectedOption,
    hasVoted,
    isVoting,
    votePower,
    vote,
    isConnected,
  } = useVoting(initialProposal)

  const links = useMemo(
    () => [
      { index: 1, page: 'Home', link: URL_ROUTES.HOME },
      { index: 2, page: 'DAO', link: URL_ROUTES.DAO },
      { index: 3, page: proposal.name, link: `${URL_ROUTES.DAO}/${code}` },
    ],
    [code, proposal.name],
  )

  const handleVote = async () => {
    await vote()
  }

  return (
    <main className="dao-container">
      <div className="dao-section">
        {/* Header */}
        <header className="space-y-2 tablet:space-y-4 desktop:space-y-8">
          <Breadcrumbs items={links} />
          <div className="flex flex-col gap-3">
            <Badge type={proposal.type} />
            <h1 className="text-48">{proposal.name}</h1>
            <div className="flex justify-between text-neutral-30">
              <p>{getTimeRemaining(proposal.endTime)}</p>
              <p>{getCreatedLabel(proposal.createdAt)}</p>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex flex-col gap-8 desktop:flex-row desktop:gap-12">
          {/* Left: Voting Panel */}
          <section className="flex-2/5 space-y-6 rounded-4xl bg-white p-6 tablet:p-8">
            {/* Vote Power Info */}
            {isConnected && (
              <motion.div
                className="bg-neutral-90 rounded-2xl p-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="text-neutral-20 mb-2 text-sm font-medium">
                  Your Voting Power
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm">
                      Base: {votePower.base} NFT{votePower.base !== 1 && 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-sm">
                      Arbitrum: {votePower.arbitrum} NFT
                      {votePower.arbitrum !== 1 && 's'}
                    </span>
                  </div>
                  <div className="ml-auto text-sm font-semibold">
                    Total: {votePower.total} vote
                    {votePower.total !== 1 && 's'}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Options */}
            <div className="space-y-6">
              <h2 className="font-medium">Options:</h2>

              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {hasVoted ? (
                    /* After voting: Show progress bars */
                    <motion.div
                      key="results"
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {proposal.options.map((opt, index) => (
                        <VoteProgressBar
                          key={index}
                          label={opt.label}
                          votes={opt.votes}
                          totalVotes={proposal.totalVotes}
                          percentage={getVotePercentage(
                            opt.votes,
                            proposal.totalVotes,
                          )}
                          type={proposal.type}
                          isSelected={selectedOption === index}
                          isVoted={hasVoted}
                          index={index}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    /* Before voting: Selection buttons */
                    <motion.div
                      key="options"
                      className="space-y-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {proposal.options.map((opt, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedOption(index)}
                          className={`w-full rounded-full border py-3 text-center transition-colors duration-300 hover:border-primary-green ${
                            selectedOption === index
                              ? 'border-primary-green bg-green-90'
                              : 'border-neutral-60 bg-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Vote count info */}
              {!hasVoted && isConnected && (
                <p className="text-neutral-10">
                  You have{' '}
                  <span className="font-semibold">{votePower.total}</span> vote
                  {votePower.total !== 1 && 's'} available
                </p>
              )}

              {hasVoted && (
                <motion.p
                  className="text-sm text-primary-green"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  ✓ You voted with {votePower.total} NFT
                  {votePower.total !== 1 && 's'} across{' '}
                  {SUPPORTED_VOTE_CHAINS.length} chains
                </motion.p>
              )}
            </div>

            {/* Action Buttons */}
            {!hasVoted && (
              <div className="flex flex-col gap-4">
                <DefaultButton
                  variant="primary"
                  onClick={handleVote}
                  disabled={
                    selectedOption === undefined ||
                    isVoting ||
                    !isConnected ||
                    votePower.total === 0
                  }
                >
                  {isVoting
                    ? 'Voting...'
                    : !isConnected
                      ? 'Connect Wallet to Vote'
                      : votePower.total === 0
                        ? 'No NFTs to Vote'
                        : 'Vote'}
                </DefaultButton>
                <DefaultButton variant="secondary">
                  Remain neutral
                </DefaultButton>
              </div>
            )}
          </section>

          {/* Right: Description + Breakdown */}
          <article className="flex-3/5 space-y-8">
            {/* Description */}
            <div className="space-y-4">
              <p className="text-neutral-20 leading-relaxed font-normal">
                {proposal.description}
              </p>
            </div>

            {/* Vote Breakdown Table */}
            <VoteBreakdown
              options={proposal.options}
              totalVotes={proposal.totalVotes}
              isVisible={hasVoted}
            />

            {/* Always-visible summary stats */}
            <div className="space-y-3">
              <h2 className="font-medium">Voting Stats</h2>
              <div className="grid grid-cols-2 gap-4 tablet:grid-cols-3">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-neutral-30">Total Votes</p>
                  <p className="text-2xl font-semibold">
                    {proposal.totalVotes}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-neutral-30">Options</p>
                  <p className="text-2xl font-semibold">
                    {proposal.options.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm text-neutral-30">Chains</p>
                  <p className="text-2xl font-semibold">
                    {SUPPORTED_VOTE_CHAINS.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Chain Contribution Summary (always visible) */}
            <div className="space-y-3">
              <h2 className="font-medium">Votes by Chain</h2>
              <div className="grid grid-cols-2 gap-4">
                {SUPPORTED_VOTE_CHAINS.map((chainId) => {
                  const chainVotes = proposal.options.reduce(
                    (sum, opt) => sum + (opt.votesByChain[chainId] || 0),
                    0,
                  )
                  const pct =
                    proposal.totalVotes > 0
                      ? Math.round((chainVotes / proposal.totalVotes) * 100)
                      : 0

                  return (
                    <div key={chainId} className="rounded-2xl bg-white p-4">
                      <p className="text-sm text-neutral-30">
                        {CHAIN_LABELS[chainId]}
                      </p>
                      <p className="text-2xl font-semibold">{chainVotes}</p>
                      <p className="text-xs text-neutral-40">{pct}% of total</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}
