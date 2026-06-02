'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useConnection, useSignMessage } from 'wagmi'
import DefaultButton from '@/ui/buttons/default-btn'
import { submitReferralCode, getUserReferralCode } from '@/actions/referral'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { fmtPts, Gem } from '@/components/leaderboard/utils'
import type { LeaderboardUser, PaginationInfo } from '@/types/leaderboard.types'

const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
const modalVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
}

export default function PointsPage() {
  const { address } = useConnection()
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(
    [],
  )
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState(false)
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const [leaderboardRetry, setLeaderboardRetry] = useState(0)
  const [leaderboardPagination, setLeaderboardPagination] = useState<
    PaginationInfo | undefined
  >()

  const [stickyUser, setStickyUser] = useState<LeaderboardUser | null>(null)

  // Update stickyUser whenever leaderboard data or wallet changes.
  // Only set when found; never clear on a page where the user isn't present.
  // Clear entirely when the wallet disconnects.
  useEffect(() => {
    if (!address) {
      setStickyUser(null)
      return
    }
    const found = leaderboardUsers.find(
      (u) =>
        u.isCurrentUser ||
        u.walletAddress.toLowerCase() === address.toLowerCase(),
    )
    if (found) setStickyUser(found)
  }, [leaderboardUsers, address])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLeaderboardLoading(true)
      setLeaderboardError(false)
      try {
        const r = await fetch(
          `/api/leaderboard?page=${leaderboardPage}&limit=10`,
          { signal: controller.signal },
        )
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const json = (await r.json()) as {
          entries: { rank: number; address: string; points: number }[]
          pagination: PaginationInfo | null
        }
        setLeaderboardUsers(
          (json.entries ?? []).map((e) => ({
            rank: e.rank,
            walletAddress: e.address,
            points: e.points,
          })),
        )
        setLeaderboardPagination(json.pagination ?? undefined)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        console.error(err)
        setLeaderboardError(true)
      } finally {
        setLeaderboardLoading(false)
      }
    }
    load()
    return () => controller.abort()
  }, [leaderboardPage, leaderboardRetry])

  return (
    <main className="points-container">
      <div className="flex w-full flex-col desktop:flex-row desktop:items-start desktop:gap-12">
        {/* Main content */}
        <div className="flex flex-col gap-14 tablet:gap-16 desktop:flex-1">
          {/* Intro zone */}
          <div className="flex flex-col gap-6 tablet:gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="text-h1 font-semibold tracking-tight text-primary-green">
                Leaderboard
              </h1>
              <p className="text-body text-neutral-30">
                Your rank reflects your network's reach. When your referrals
                mint, vote, or spend with our partners, you earn.
              </p>
            </div>

            <ReferralModal />

            {/* Your position — mobile/tablet only */}
            {address && (
              <div className="border-t border-khaki-70/60 pt-6 tablet:pt-8 desktop:hidden">
                {leaderboardLoading && !stickyUser ? (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-12 rounded bg-khaki-70 motion-safe:animate-pulse" />
                    <div className="h-4 w-20 rounded bg-khaki-70 motion-safe:animate-pulse" />
                  </div>
                ) : stickyUser ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-h2 leading-none font-black text-primary-green tabular-nums">
                      #{stickyUser.rank}
                    </span>
                    <div className="flex items-center gap-1">
                      <Gem size={11} />
                      <span className="font-mono text-small font-bold text-primary-green tabular-nums">
                        {fmtPts(stickyUser.points)} pts
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-small text-neutral-30">
                    Share your referral code to start earning points.
                  </p>
                )}
              </div>
            )}

            {/* How to earn — mobile/tablet only; sidebar covers desktop */}
            <div className="flex flex-col gap-3 border-t border-khaki-70/60 pt-6 tablet:pt-8 desktop:hidden">
              <span className="text-caption font-medium tracking-widest text-neutral-30 uppercase">
                When your referrals
              </span>
              <ul className="grid grid-cols-3 gap-x-4">
                <li className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Gem size={10} />
                    <span className="text-small font-semibold text-neutral-30">
                      First mint
                    </span>
                  </span>
                  <span className="text-caption text-neutral-30">
                    mint their first NFT
                  </span>
                </li>
                <li className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Gem size={10} />
                    <span className="text-small font-semibold text-neutral-30">
                      DAO vote
                    </span>
                  </span>
                  <span className="text-caption text-neutral-30">
                    vote on proposals
                  </span>
                </li>
                <li className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Gem size={10} />
                    <span className="text-small font-semibold text-neutral-30">
                      Partner spend
                    </span>
                  </span>
                  <span className="text-caption text-neutral-30">
                    spend with partners
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Leaderboard — main event, clear separation from intro zone */}
          <Leaderboard
            users={leaderboardUsers}
            currentUserAddress={address}
            loading={leaderboardLoading}
            error={leaderboardError}
            pagination={leaderboardPagination}
            onPageChange={setLeaderboardPage}
            onRetry={() => setLeaderboardRetry((c) => c + 1)}
          />
        </div>

        {/* Desktop sidebar */}
        <LeaderboardSidebar
          currentUserEntry={stickyUser}
          loading={leaderboardLoading}
          address={address}
        />
      </div>
    </main>
  )
}

function LeaderboardSidebar({
  currentUserEntry,
  loading,
  address,
}: {
  currentUserEntry: LeaderboardUser | null
  loading: boolean
  address: string | undefined
}) {
  return (
    <aside className="sticky top-24 hidden shrink-0 desktop:flex desktop:w-52 desktop:flex-col desktop:gap-6">
      {/* Your position */}
      <div className="flex flex-col gap-3">
        <span className="text-caption font-medium tracking-widest text-neutral-30 uppercase">
          Your position
        </span>
        {loading && !currentUserEntry ? (
          <div className="flex flex-col gap-2">
            <div className="h-10 w-16 rounded bg-khaki-70 motion-safe:animate-pulse" />
            <div className="h-3 w-20 rounded bg-khaki-70 motion-safe:animate-pulse" />
          </div>
        ) : currentUserEntry ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-h1 leading-none font-black text-primary-green tabular-nums">
              #{currentUserEntry.rank}
            </span>
            <div className="flex items-center gap-1">
              <Gem size={11} />
              <span className="font-mono text-small font-bold text-primary-green tabular-nums">
                {fmtPts(currentUserEntry.points)} pts
              </span>
            </div>
          </div>
        ) : address ? (
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-h1 leading-none font-black text-neutral-40 tabular-nums opacity-40">
              –
            </span>
            <span className="text-caption text-neutral-30">
              earn points to appear here
            </span>
          </div>
        ) : (
          <span className="text-caption text-neutral-30">
            connect wallet to see your rank
          </span>
        )}
      </div>

      <div className="border-t border-khaki-70/60" />

      {/* How to earn */}
      <div className="flex flex-col gap-4">
        <span className="text-caption font-medium tracking-widest text-neutral-30 uppercase">
          How to earn
        </span>

        <ul className="flex flex-col gap-3">
          <li className="flex items-start gap-2.5">
            <span className="mt-px shrink-0">
              <Gem size={10} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-caption font-medium text-neutral-30">
                First mint
              </span>
              <span className="text-caption leading-snug text-neutral-30">
                mint their first NFT
              </span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-px shrink-0">
              <Gem size={10} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-caption font-medium text-neutral-30">
                DAO vote
              </span>
              <span className="text-caption leading-snug text-neutral-30">
                vote on proposals
              </span>
            </div>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-px shrink-0">
              <Gem size={10} />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-caption font-medium text-neutral-30">
                Partner spend
              </span>
              <span className="text-caption leading-snug text-neutral-30">
                spend with partners
              </span>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  )
}

function ReferralModal() {
  const [existingCode, setExistingCode] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [copied, setCopied] = useState(false)
  const { mutateAsync: signMessage } = useSignMessage()

  const lastFocusRef = useRef<HTMLElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchInitialCode = async () => {
      try {
        const result = await getUserReferralCode()
        if (result.success && result.data) {
          setExistingCode(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch initial referral code', error)
      } finally {
        setIsInitializing(false)
      }
    }

    fetchInitialCode()
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    lastFocusRef.current?.focus()
    setTimeout(() => {
      setReferralCode('')
      setMessage({ type: '', text: '' })
    }, 300)
  }, [])

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusable = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeModal()
        return
      }
      if (e.key !== 'Tab' || focusable.length === 0) return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeModal])

  const openModal = () => {
    lastFocusRef.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6)
    setReferralCode(value)
    if (message.type === 'error') setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const signature = await signMessage({
        message: `Set ref code: ${referralCode}`,
      })

      const result = await submitReferralCode(referralCode, signature)

      if (result.success) {
        setMessage({ type: 'success', text: result.message || '' })
        setTimeout(() => {
          closeModal()
          setExistingCode(referralCode)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || '' })
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'Signature rejected. Please try again.',
      })
    }

    setIsLoading(false)
  }

  const isButtonDisabled = referralCode.length !== 6 || isLoading

  if (isInitializing) {
    return (
      <div className="h-12 w-48 rounded-full bg-khaki-70 motion-safe:animate-pulse" />
    )
  }

  const handleCopy = async () => {
    if (!existingCode) return
    try {
      await navigator.clipboard.writeText(existingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // silently ignore — clipboard may be unavailable in some environments
    }
  }

  return (
    <div>
      {existingCode ? (
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy referral code'}
          className="group flex flex-col gap-1 rounded-sm text-left focus-visible:ring-2 focus-visible:ring-primary-green/40 focus-visible:outline-none"
        >
          <span className="text-caption font-medium tracking-widest text-neutral-40 uppercase">
            Your referral code
          </span>
          <span className="flex items-center gap-2 overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={copied ? 'copied' : 'code'}
                initial={{ opacity: 0, y: copied ? -10 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: copied ? 10 : -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={`font-mono text-h2 font-bold tracking-[0.2em] ${
                  copied ? 'text-neutral-40' : 'text-primary-green'
                }`}
              >
                {copied ? 'Copied' : existingCode}
              </motion.span>
            </AnimatePresence>
            {!copied && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
                className="mb-0.5 shrink-0 text-neutral-40 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <rect
                  x="5"
                  y="5"
                  width="8"
                  height="8"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.25"
                />
                <path
                  d="M3 11V3h8"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
        </button>
      ) : (
        <>
          <DefaultButton onClick={openModal}>
            Create Referral Code
          </DefaultButton>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                key="modal-overlay"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={overlayVariants}
                className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-10/60 p-4 backdrop-blur-sm"
                onClick={closeModal}
              >
                <motion.div
                  ref={modalRef}
                  key="modal-content"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="referral-modal-heading"
                  variants={modalVariants}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-100 overflow-hidden rounded-4xl bg-khaki-99 p-6 shadow-2xl"
                >
                  <h2
                    id="referral-modal-heading"
                    className="mb-2 text-h2 font-semibold text-neutral-10"
                  >
                    Claim Your Referral Code
                  </h2>
                  <p className="mb-4 text-small text-neutral-40">
                    Create a unique 6-character alphanumeric code. Share it with
                    your network to earn rewards.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <label htmlFor="referral-code-input" className="sr-only">
                        Referral code
                      </label>
                      <input
                        id="referral-code-input"
                        type="text"
                        value={referralCode}
                        onChange={handleInputChange}
                        placeholder="e.g., ALPHA1"
                        disabled={isLoading}
                        className="w-full rounded-xl border-2 border-khaki-70 bg-khaki-90 px-4 py-4 text-center font-mono text-h3 font-bold tracking-[0.2em] text-neutral-30 uppercase transition-all focus:border-primary-green focus:ring-4 focus:ring-primary-green/20 focus:outline-none disabled:opacity-50"
                      />

                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-small font-medium">
                          {message.text && (
                            <span
                              className={
                                message.type === 'error'
                                  ? 'text-destructive'
                                  : 'text-primary-green'
                              }
                            >
                              {message.text}
                            </span>
                          )}
                        </div>

                        <div
                          className={`text-caption font-medium transition-colors ${referralCode.length === 6 ? 'text-primary-green' : 'text-neutral-40'}`}
                        >
                          {referralCode.length} / 6 characters
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <DefaultButton
                        type="button"
                        variant="secondary"
                        onClick={closeModal}
                        disabled={isLoading}
                      >
                        Cancel
                      </DefaultButton>

                      <DefaultButton type="submit" disabled={isButtonDisabled}>
                        {isLoading ? 'Claiming...' : 'Claim Code'}
                      </DefaultButton>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
