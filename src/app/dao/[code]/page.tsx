'use client'

import Badge from '@/ui/badge'
import Breadcrumbs from '@/ui/navs/breadcrumbs'
import DefaultButton from '@/ui/buttons/default-btn'
import { SignInButton } from '@/ui/buttons/sign-in-btn'
import { use, useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
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
import { useProposalDescription } from '@/hooks/useProposalDescription'
import { useCountdown } from '@/hooks/useCountdown'
import { formatVotingEndsAbsolute } from '@/utils/dao-time.util'
import { getChain } from '@/constants/contracts/tsb'
import { getChainIcon } from '@/utils/chain-icon.util'

interface DaoDetailPageProps {
  params: Promise<{ code: string }>
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
  const {
    description: resolvedDescription,
    isLoading: isDescriptionLoading,
    isError: isDescriptionError,
  } = useProposalDescription(proposal.description)
  const hasHtmlContent = isHtmlContent(resolvedDescription)
  const timeRemaining = useCountdown(proposal.votingEnds)
  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    undefined,
  )
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false)
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
            <div className="flex flex-col gap-1 text-neutral-30 tablet:flex-row tablet:items-center tablet:justify-between">
              <p>{timeRemaining}</p>
              <p className="text-sm">
                Ends {formatVotingEndsAbsolute(proposal.votingEnds)}
              </p>
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
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        isSelected
                          ? 'border-primary-green bg-green-90'
                          : 'border-neutral-60 bg-white hover:border-primary-green/40 hover:bg-khaki-90'
                      }`}
                    >
                      <span
                        className={
                          isSelected
                            ? 'font-medium text-primary-green'
                            : 'text-neutral-10'
                        }
                      >
                        {opt.label}
                      </span>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                          isSelected
                            ? 'bg-primary-green'
                            : 'border border-neutral-60 bg-transparent'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            viewBox="0 0 10 10"
                            fill="none"
                          >
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
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
                  <div className="relative">
                    <button
                      type="button"
                      aria-haspopup="listbox"
                      aria-expanded={chainDropdownOpen}
                      aria-controls="vote-chain-dropdown"
                      disabled={isVoteInFlight}
                      onClick={() => setChainDropdownOpen((open) => !open)}
                      className="flex w-full items-center justify-between rounded-xl border border-neutral-60 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {(() => {
                        const active = voting.deployments.find(
                          (d) => d.chainId === voting.selectedChainId,
                        )
                        const icon = active
                          ? getChainIcon(getChain(active.chainId)?.key ?? '')
                          : null
                        return (
                          <span className="flex min-w-0 items-center gap-3">
                            {icon && (
                              <figure className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-60">
                                <Image
                                  src={icon}
                                  alt={active?.label ?? ''}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              </figure>
                            )}
                            <span className="truncate text-sm font-medium text-neutral-10">
                              {active
                                ? `${active.label}${active.unvotedCount > 0 ? ` (${active.unvotedCount})` : ''}`
                                : 'Select network'}
                            </span>
                          </span>
                        )
                      })()}
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-neutral-40 transition-transform duration-200 ${chainDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {chainDropdownOpen && (
                      <ul
                        id="vote-chain-dropdown"
                        role="listbox"
                        className="absolute z-20 mt-2 max-h-56 w-full overflow-hidden overflow-y-auto rounded-xl border border-neutral-60 bg-white shadow-lg"
                      >
                        {voting.deployments.map((d) => {
                          const isActiveChoice =
                            d.chainId === voting.selectedChainId
                          const disabled = d.unvotedCount === 0
                          const icon = getChainIcon(
                            getChain(d.chainId)?.key ?? '',
                          )
                          return (
                            <li
                              key={d.chainId}
                              role="option"
                              aria-selected={isActiveChoice}
                              aria-disabled={disabled}
                              tabIndex={disabled ? -1 : 0}
                              title={
                                disabled
                                  ? 'No eligible NFTs on this chain'
                                  : undefined
                              }
                              onClick={() => {
                                if (disabled) return
                                voting.setSelectedChainId(d.chainId)
                                setChainDropdownOpen(false)
                              }}
                              onKeyDown={(e) => {
                                if (
                                  !disabled &&
                                  (e.key === 'Enter' || e.key === ' ')
                                ) {
                                  e.preventDefault()
                                  voting.setSelectedChainId(d.chainId)
                                  setChainDropdownOpen(false)
                                }
                              }}
                              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green/40 focus-visible:ring-inset ${
                                disabled
                                  ? 'cursor-not-allowed opacity-40'
                                  : 'cursor-pointer'
                              } ${isActiveChoice ? 'bg-khaki-80' : 'hover:bg-khaki-90'}`}
                            >
                              <span className="flex items-center gap-3">
                                {icon && (
                                  <figure className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                                    <Image
                                      src={icon}
                                      alt={d.label}
                                      width={24}
                                      height={24}
                                      className="object-cover"
                                    />
                                  </figure>
                                )}
                                <span
                                  className={`text-sm font-medium ${isActiveChoice ? 'text-primary-green' : 'text-neutral-10'}`}
                                >
                                  {d.label}
                                  {d.unvotedCount > 0 && ` (${d.unvotedCount})`}
                                </span>
                              </span>
                              {isActiveChoice && (
                                <div className="h-2 w-2 rounded-full bg-primary-green shadow-sm" />
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
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
                    classname="w-full"
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
              {isDescriptionLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : isDescriptionError ? (
                <p className="text-sm text-red-500">
                  Couldn&rsquo;t load the proposal description from IPFS. Please
                  try again later.
                </p>
              ) : hasHtmlContent ? (
                <SanitizedHTML
                  html={resolvedDescription}
                  className="text-neutral-20 leading-relaxed font-normal [&>a]:text-primary-green [&>a]:underline [&>em]:italic [&>h1]:mb-4 [&>h1]:text-3xl [&>h1]:font-bold [&>h2]:mb-3 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mb-2 [&>h3]:text-xl [&>h3]:font-semibold [&>img]:my-4 [&>img]:rounded-lg [&>ol]:mb-4 [&>ol]:ml-6 [&>ol]:list-decimal [&>p]:mb-4 [&>strong]:font-bold [&>ul]:mb-4 [&>ul]:ml-6 [&>ul]:list-disc"
                />
              ) : (
                <p className="text-neutral-20 leading-relaxed font-normal">
                  {resolvedDescription}
                </p>
              )}
            </div>
          </article>
        </div>
      </div>
    </main>
  )
}
