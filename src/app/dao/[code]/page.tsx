'use client'

import Badge from '@/ui/badge'
import Breadcrumbs from '@/ui/navs/breadcrumbs'
import DefaultButton from '@/ui/buttons/default-btn'
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
 * Metadata-only rendering — options are read-only (no selection/voting UI)
 * and there is no vote-tally/breakdown/contract section yet. Those need
 * on-chain data (`proposal.deployments`) and come back in a later pass;
 * see BACKLOG.md.
 */
function DaoDetailContent({
  code,
  proposal,
}: {
  code: string
  proposal: ProposalDetail
}) {
  const hasHtmlContent = isHtmlContent(proposal.description)

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
          {/* Left: Options (read-only) */}
          <section className="flex-2/5 space-y-6 rounded-4xl bg-white p-6 tablet:p-8">
            <div className="space-y-6">
              <h2 className="font-medium">Options:</h2>
              <div className="space-y-3">
                {proposal.options.map((opt) => (
                  <div
                    key={opt.index}
                    className="w-full rounded-full border border-neutral-60 bg-white py-3 text-center"
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
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
