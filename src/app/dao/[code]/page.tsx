'use client'

import Badge from '@/ui/badge'
import Breadcrumbs from '@/ui/navs/breadcrumbs'
import DefaultButton from '@/ui/buttons/default-btn'
import { SignInButton } from '@/ui/buttons/sign-in-btn'
import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import URL_ROUTES from '@/constants/url-route'
import { ProposalType } from '@/enums/dao-types.enum'
import { getProposal } from '@/lib/proposals-client'
import { reportError } from '@/lib/telemetry'
import { isHtmlContent } from '@/types/dao.types'
import type { ProposalDetail } from '@/types/dao.types'
import { Skeleton } from '@/ui/skeleton'
import SanitizedHTML from '@/components/common/sanitized-html'
import { useAppCtx } from '@/contexts/app.context'
import { useProposalVoting, VotePhase } from '@/hooks/useProposalVoting'

interface DaoDetailPageProps {
  params: Promise<{ code: string }>
}

/**
 * Live countdown to `votingEnds`, recomputed on every render — the API's
 * `timeRemaining` is only a snapshot at response time and goes stale
 * immediately.
 */
function getTimeRemaining(votingEnds: string): string {
  const diffMs = new Date(votingEnds).getTime() - Date.now()

  if (diffMs <= 0) return 'Voting ended'

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return `Voting ends in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getVoteButtonLabel(phase: VotePhase, isLoadingPower: boolean): string {
  if (isLoadingPower) return 'Checking…'
  switch (phase) {
    case 'switching-chain':
      return 'Switching network…'
    case 'signing':
      return 'Confirm in wallet…'
    case 'mining':
      return 'Casting vote…'
    case 'success':
      return 'Vote again'
    default:
      return 'Vote'
  }
}

export default function DaoDetailPage({ params }: DaoDetailPageProps) {
  const { code } = use<{ code: string }>(params)
  const router = useRouter()
  const [proposal, setProposal] = useState<ProposalDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProposal() {
      setLoading(true)
      setError(null)

      try {
        const result = await getProposal(code)

        if (
          result.reason === 'unauthenticated' ||
          result.reason === 'unregistered'
        ) {
          router.replace('/login')
          return
        }
        if (result.reason === 'notFound') {
          setProposal(null)
          return
        }
        if (result.reason === 'error' || !result.proposal) {
          throw new Error('Failed to load proposal')
        }

        setProposal(result.proposal)
      } catch (err) {
        reportError(err, { source: 'DaoDetailPage.loadProposal', code })
        setError('Failed to load proposal')
      } finally {
        setLoading(false)
      }
    }

    loadProposal()
  }, [code, router])

  // Loading state
  if (loading) {
    return (
      <main id="main-content" tabIndex={-1} className="dao-container">
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
      <main id="main-content" tabIndex={-1} className="dao-container">
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
  if (!proposal) {
    return (
      <main id="main-content" tabIndex={-1} className="dao-container">
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

  return <DaoDetailContent code={code} proposal={proposal} />
}

/**
 * Options are selectable and wired to a real on-chain `vote()` call via
 * `useProposalVoting` (per-NFT voting power, one deployment chain at a
 * time). Live tallies/breakdown are still out of scope — see BACKLOG.md.
 */
function DaoDetailContent({
  code,
  proposal,
}: {
  code: string
  proposal: ProposalDetail
}) {
  const hasHtmlContent = isHtmlContent(proposal.description)
  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    undefined,
  )
  const { referralCode } = useAppCtx()
  const voting = useProposalVoting({ proposal, refCode: referralCode })
  const isVoteInFlight =
    voting.phase === 'switching-chain' ||
    voting.phase === 'signing' ||
    voting.phase === 'mining'
  const canVote =
    voting.isConnected &&
    voting.deployments.length > 0 &&
    selectedOption !== undefined &&
    voting.powerForSelectedChain > 0 &&
    voting.isActiveOnSelectedChain &&
    !voting.isLoadingPower &&
    !isVoteInFlight

  const links = useMemo(
    () => [
      { index: 1, page: 'Home', link: URL_ROUTES.HOME },
      { index: 2, page: 'DAO', link: URL_ROUTES.DAO },
      {
        index: 3,
        page: proposal.proposalName,
        link: `${URL_ROUTES.DAO}/${code}`,
      },
    ],
    [code, proposal.proposalName],
  )

  return (
    <main id="main-content" tabIndex={-1} className="dao-container">
      <div className="dao-section">
        {/* Header */}
        <header className="space-y-2 tablet:space-y-4 desktop:space-y-8">
          <Breadcrumbs items={links} />
          <div className="flex flex-col gap-3">
            {/* proposalType is currently always 0 ("DAO") — collapse to a
                single badge until the backend sends more values (see
                BACKLOG.md). */}
            <Badge type={ProposalType.PROPOSAL} />
            <h1 className="text-48">{proposal.proposalName}</h1>
            <div className="flex justify-between text-neutral-30">
              <p>{getTimeRemaining(proposal.votingEnds)}</p>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex flex-col gap-8 desktop:flex-row desktop:gap-12">
          {/* Left: Options + cast-a-vote panel */}
          <section className="flex-2/5 space-y-6 rounded-4xl bg-white p-6 tablet:p-8">
            <div className="space-y-6">
              <h2 className="font-medium">Options:</h2>
              <div
                role="radiogroup"
                aria-label="Vote options"
                className="space-y-3"
              >
                {proposal.options.map((opt) => {
                  const isSelected = selectedOption === opt.index
                  return (
                    <button
                      key={opt.index}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={isVoteInFlight}
                      onClick={() => setSelectedOption(opt.index)}
                      className={`w-full rounded-full border py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'border-primary-green bg-primary-green/10 font-medium text-primary-green'
                          : 'border-neutral-60 bg-white hover:border-primary-green/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Cast-a-vote panel */}
            <div className="border-neutral-80 space-y-4 border-t pt-6">
              {!voting.isConnected ? (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-30">
                    Connect your wallet to vote.
                  </p>
                  <SignInButton />
                </div>
              ) : voting.deployments.length === 0 ? (
                <p className="text-sm text-neutral-30">
                  Voting isn&rsquo;t available on any chain for this proposal
                  yet.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {voting.deployments.map((d) => {
                      const isActiveChoice =
                        d.chainId === voting.selectedChainId
                      const disabled = d.unvotedCount === 0
                      return (
                        <button
                          key={d.chainId}
                          type="button"
                          disabled={disabled || isVoteInFlight}
                          onClick={() => voting.setSelectedChainId(d.chainId)}
                          title={
                            disabled
                              ? 'No eligible NFTs on this chain'
                              : undefined
                          }
                          className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            isActiveChoice
                              ? 'border-primary-green bg-primary-green text-white'
                              : 'text-neutral-20 border-neutral-60 bg-white hover:border-primary-green/40'
                          }`}
                        >
                          {d.label}
                          {d.unvotedCount > 0 && ` (${d.unvotedCount})`}
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-xs text-neutral-30">
                    {voting.isLoadingPower
                      ? 'Checking your voting power…'
                      : voting.totalPower === 0
                        ? "You don't have any eligible TSB NFTs to vote with on this proposal."
                        : voting.selectedChainId != null &&
                            !voting.isActiveOnSelectedChain
                          ? 'Voting is closed on this chain.'
                          : `${voting.powerForSelectedChain} vote${voting.powerForSelectedChain === 1 ? '' : 's'} available on this chain.`}
                  </p>

                  <DefaultButton
                    type="button"
                    disabled={!canVote}
                    onClick={() =>
                      selectedOption !== undefined &&
                      voting.vote(selectedOption)
                    }
                  >
                    {getVoteButtonLabel(voting.phase, voting.isLoadingPower)}
                  </DefaultButton>

                  {voting.errorMsg && (
                    <p role="alert" className="text-xs text-red-500">
                      {voting.errorMsg}
                    </p>
                  )}

                  {voting.phase === 'success' && (
                    <p className="text-xs text-primary-green">
                      Vote submitted.
                      {voting.explorerUrl && (
                        <>
                          {' '}
                          <a
                            href={voting.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            View transaction
                          </a>
                        </>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Right: Description */}
          <article className="flex-3/5 space-y-8">
            <div className="space-y-4">
              {hasHtmlContent ? (
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
          </article>
        </div>
      </div>
    </main>
  )
}
