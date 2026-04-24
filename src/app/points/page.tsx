'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAccount } from 'wagmi'
import DefaultButton from '@/ui/buttons/default-btn'
import { submitReferralCode, getUserReferralCode } from '@/actions/referral'
import { Leaderboard } from '@/components/leaderboard'
import type { LeaderboardUser } from '@/components/leaderboard'

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
  const { address } = useAccount()
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>(
    [],
  )
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((entries: { rank: number; address: string; points: number }[]) => {
        setLeaderboardUsers(
          entries.map((e) => ({
            rank: e.rank,
            walletAddress: e.address,
            points: e.points,
          })),
        )
      })
      .catch(console.error)
      .finally(() => setLeaderboardLoading(false))
  }, [])

  return (
    <main className="points-container gap-10">
      <div className="flex max-w-xl flex-col gap-6">
        <div className="space-y-3">
          <h1>Your Referral</h1>
          <p>
            Share your referral link with friends and family to earn points!
          </p>
        </div>

        <ReferralModal />
      </div>

      <Leaderboard
        title="Leaderboard"
        users={leaderboardUsers}
        currentUserAddress={address}
        pageSize={10}
        loading={leaderboardLoading}
      />
    </main>
  )
}

function ReferralModal() {
  const [existingCode, setExistingCode] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [referralCode, setReferralCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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

    const result = await submitReferralCode(referralCode)

    if (result.success) {
      setMessage({ type: 'success', text: result.message || '' })
      setTimeout(() => {
        closeModal()
        setExistingCode(referralCode)
      }, 2000)
    } else {
      setMessage({ type: 'error', text: result.error || '' })
    }

    setIsLoading(false)
  }

  const isButtonDisabled = referralCode.length !== 6 || isLoading

  if (isInitializing) {
    return <div className="h-12 w-48 animate-pulse rounded-full bg-khaki-70" />
  }

  return (
    <div>
      {existingCode ? (
        <div className="inline-block rounded-2xl border-2 border-dashed border-primary-green/30 bg-primary-green/5 px-6 py-4 text-center">
          <p className="mb-1 text-sm font-medium text-neutral-40">
            Your Referral Code
          </p>
          <p className="font-mono text-3xl font-bold tracking-[0.2em] text-primary-green">
            {existingCode}
          </p>
        </div>
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
                  className="relative w-full max-w-md overflow-hidden rounded-2xl bg-khaki-99 p-6 shadow-2xl"
                >
                  <h2
                    id="referral-modal-heading"
                    className="mb-2 text-2xl font-bold text-neutral-10"
                  >
                    Claim Your Referral Code
                  </h2>
                  <p className="mb-4 text-sm text-neutral-40">
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
                        className="w-full rounded-xl border-2 border-khaki-70 bg-khaki-90 px-4 py-4 text-center font-mono text-xl font-bold tracking-[0.2em] text-neutral-30 uppercase transition-all focus:border-primary-green focus:ring-4 focus:ring-primary-green/20 focus:outline-none disabled:opacity-50"
                      />

                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {message.text && (
                            <span
                              className={
                                message.type === 'error'
                                  ? 'text-red-500'
                                  : 'text-primary-green'
                              }
                            >
                              {message.text}
                            </span>
                          )}
                        </div>

                        <div
                          className={`text-xs font-medium transition-colors ${referralCode.length === 6 ? 'text-primary-green' : 'text-neutral-40'}`}
                        >
                          {referralCode.length} / 6 characters
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={isLoading}
                        className="rounded-xl px-5 py-2.5 font-medium text-neutral-30 transition-colors hover:bg-khaki-80 disabled:opacity-50"
                      >
                        Cancel
                      </button>

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
