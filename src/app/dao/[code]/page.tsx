'use client'

import Badge from '@/ui/badge'
import Breadcrumbs from '@/ui/navs/breadcrumbs'
import DefaultButton from '@/ui/buttons/default-btn'
import { use, useEffect, useState, useMemo } from 'react'
import URL_ROUTES from '@/constants/url-route'
import {
  useVotingWithDao,
  getDaoSupportedChains,
  getChainLabel,
  DaoChainKey,
} from '@/hooks/useVoting'
import VoteProgressBar from '@/components/dao/vote-progress-bar'
import VoteBreakdown from '@/components/dao/vote-breakdown'
import { motion, AnimatePresence } from 'motion/react'
import { fetchDaoById } from '@/services/dao.service'
import { DaoRow } from '@/lib/supabase/database.types'
import {
  getProposalTypeFromDaoType,
  isPodType,
  isHtmlContent,
} from '@/types/dao.types'
import { Skeleton } from '@/ui/skeleton'
import { getChainId } from '@/constants/contracts/tsb'
import SanitizedHTML from '@/components/common/sanitized-html'

interface DaoDetailPageProps {
  params: Promise<{ code: string }>
}

/**
 * Compute time remaining from endDate.
 */
function getTimeRemaining(endDate: Date | null): string {
  if (!endDate) return 'No deadline'

  const now = new Date()
  const diffMs = endDate.getTime() - now.getTime()

  if (diffMs <= 0) return 'Voting ended'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return `Voting ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getCreatedLabel(createdAt: Date): string {
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (diffDays === 0) return 'Created today'
  if (diffDays === 1) return 'Created 1 day ago'
  return `Created ${diffDays} days ago`
}

/**
 * Calculate vote percentage
 */
function getVotePercentage(optionVotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  return Math.round((optionVotes / totalVotes) * 100)
}

export default function DaoDetailPage({ params }: DaoDetailPageProps) {
  const { code } = use<{ code: string }>(params)
  const [dao, setDao] = useState<DaoRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch DAO from Supabase
  useEffect(() => {
    async function loadDao() {
      setLoading(true)
      setError(null)

      try {
        // Parse code as numeric ID
        const daoId = parseInt(code, 10)

        if (isNaN(daoId)) {
          setError('Invalid DAO ID')
          return
        }

        const data = await fetchDaoById(daoId)
        setDao(data)
      } catch (err) {
        console.error('[DaoDetailPage] Error loading DAO:', err)
        setError('Failed to load proposal')
      } finally {
        setLoading(false)
      }
    }

    loadDao()
  }, [code])

  // Loading state
  if (loading) {
    return (
      <main className="dao-container">
        <div className="dao-section">
          <header className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-96" />
            <Skeleton className="h-4 w-64" />
          </header>
          <div className="flex flex-col gap-8 desktop:flex-row desktop:gap-12">
            <div className="flex-2/5 space-y-6 rounded-4xl bg-white p-6 tablet:p-8">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="flex-3/5 space-y-8">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error) {
    return (
      <main className="dao-container">
        <div className="dao-section">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <h2 className="font-medium text-red-500">{error}</h2>
            <DefaultButton
              variant="secondary"
              onClick={() => (window.location.href = URL_ROUTES.DAO)}
            >
              Back to DAO List
            </DefaultButton>
          </div>
        </div>
      </main>
    )
  }

  // Not found state
  if (!dao) {
    return (
      <main className="dao-container">
        <div className="dao-section">
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <h2 className="font-medium">Proposal not found</h2>
            <p className="text-neutral-30">
              No proposal with ID &ldquo;{code}&rdquo; exists.
            </p>
            <DefaultButton
              variant="secondary"
              onClick={() => (window.location.href = URL_ROUTES.DAO)}
            >
              Back to DAO List
            </DefaultButton>
          </div>
        </div>
      </main>
    )
  }

  return <DaoDetailContent code={code} dao={dao} />
}

/**
 * Inner component that uses the useVotingWithDao hook.
 */
function DaoDetailContent({ code, dao }: { code: string; dao: DaoRow }) {
  const {
    proposal,
    selectedOption,
    setSelectedOption,
    hasVoted,
    isVoting,
    votePower,
    vote,
    isConnected,
    supportedChains,
    contractAddresses,
  } = useVotingWithDao(dao)

  const proposalType = getProposalTypeFromDaoType(dao.dao_type)
  const isPod = isPodType(dao.dao_type)
  const hasHtmlContent = isHtmlContent(proposal.description)

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

  // Chain labels for display
  const chainLabels: Record<number, string> = useMemo(() => {
    const labels: Record<number, string> = {}
    for (const chain of supportedChains) {
      labels[getChainId(chain)] = getChainLabel(chain)
    }
    return labels
  }, [supportedChains])

  return (
    <main className="dao-container">
      <div className="dao-section">
        {/* Header */}
        <header className="space-y-2 tablet:space-y-4 desktop:space-y-8">
          <Breadcrumbs items={links} />
          <div className="flex flex-col gap-3">
            <Badge type={proposalType} />
            <h1 className="text-48">{proposal.name}</h1>
            <div className="flex justify-between text-neutral-30">
              <p>{getTimeRemaining(proposal.endDate)}</p>
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
                <div className="flex flex-wrap items-center gap-4">
                  {supportedChains.includes('BASE') && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm">
                        Base: {votePower.base} NFT{votePower.base !== 1 && 's'}
                      </span>
                    </div>
                  )}
                  {supportedChains.includes('ARBITRUM') && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-sm">
                        Arbitrum: {votePower.arbitrum} NFT
                        {votePower.arbitrum !== 1 && 's'}
                      </span>
                    </div>
                  )}
                  {supportedChains.includes('LISK') && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500" />
                      <span className="text-sm">
                        Lisk: {votePower.lisk} NFT{votePower.lisk !== 1 && 's'}
                      </span>
                    </div>
                  )}
                  {supportedChains.includes('MANTA') && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span className="text-sm">
                        Manta: {votePower.manta} NFT
                        {votePower.manta !== 1 && 's'}
                      </span>
                    </div>
                  )}
                  <div className="ml-auto text-sm font-semibold">
                    Total: {votePower.total} vote
                    {votePower.total !== 1 && 's'}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Contract Addresses Info */}
            {supportedChains.length > 0 && (
              <div className="bg-neutral-90 rounded-xl p-3 text-xs">
                <p className="mb-2 font-medium text-neutral-30">
                  Deployed Contracts:
                </p>
                <div className="space-y-1">
                  {supportedChains.map((chain) => {
                    const address =
                      contractAddresses[
                        chain.toLowerCase() as keyof typeof contractAddresses
                      ]
                    return (
                      <div
                        key={chain}
                        className="flex items-center justify-between"
                      >
                        <span className="text-neutral-40">
                          {getChainLabel(chain)}:
                        </span>
                        <span className="text-neutral-20 font-mono">
                          {address
                            ? `${address.slice(0, 6)}...${address.slice(-4)}`
                            : 'N/A'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
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
                          type={proposalType}
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
                  You voted with {votePower.total} NFT
                  {votePower.total !== 1 && 's'} across {supportedChains.length}{' '}
                  chain
                  {supportedChains.length !== 1 && 's'}
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
              {isPod && hasHtmlContent ? (
                <SanitizedHTML
                  html={proposal.description}
                  className="text-neutral-20 leading-relaxed font-normal [&>a]:text-primary-green [&>a]:underline [&>em]:italic [&>h1]:mb-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:mb-3 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mb-2 [&>h3]:text-xl [&>h3]:font-semibold [&>img]:my-4 [&>img]:rounded-lg [&>ol]:mb-4 [&>ol]:ml-6 [&>ol]:list-decimal [&>p]:mb-4 [&>strong]:font-bold [&>ul]:mb-4 [&>ul]:ml-6 [&>ul]:list-disc"
                />
              ) : (
                <p className="text-neutral-20 leading-relaxed font-normal">
                  {proposal.description}
                </p>
              )}
            </div>

            {/* Vote Breakdown Table */}
            <VoteBreakdown
              options={proposal.options}
              totalVotes={proposal.totalVotes}
              isVisible={hasVoted}
              supportedChains={supportedChains}
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
                    {supportedChains.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Chain Contribution Summary */}
            {supportedChains.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-medium">Votes by Chain</h2>
                <div className="grid grid-cols-2 gap-4">
                  {supportedChains.map((chain) => {
                    const chainId = getChainId(chain)
                    const chainVotes = proposal.options.reduce(
                      (sum, opt) => sum + (opt.votesByChain[chainId] || 0),
                      0,
                    )
                    const pct =
                      proposal.totalVotes > 0
                        ? Math.round((chainVotes / proposal.totalVotes) * 100)
                        : 0

                    return (
                      <div key={chain} className="rounded-2xl bg-white p-4">
                        <p className="text-sm text-neutral-30">
                          {getChainLabel(chain)}
                        </p>
                        <p className="text-2xl font-semibold">{chainVotes}</p>
                        <p className="text-xs text-neutral-40">
                          {pct}% of total
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </main>
  )
}
