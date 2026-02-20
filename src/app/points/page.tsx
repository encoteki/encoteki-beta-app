'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import DefaultButton from '@/ui/buttons/default-btn'
import { submitReferralCode, getUserReferralCode } from '@/actions/referral'

export default function PointsPage() {
  return (
    <main className="points-container gap-6">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <h1>Your Referral</h1>
          <p>
            Share your referral link with friends and family to earn points!
          </p>
        </div>

        <ReferralModal />
      </div>

      <div className=""></div>
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

  const openModal = () => setIsOpen(true)

  const closeModal = () => {
    setIsOpen(false)
    setTimeout(() => {
      setReferralCode('')
      setMessage({ type: '', text: '' })
    }, 300)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 6)
    setReferralCode(value)
    if (message.type === 'error') setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
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

  const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
  const modalVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
    },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } },
  }

  if (isInitializing) {
    return <div className="h-12 w-48 animate-pulse rounded-full bg-gray-200" />
  }

  return (
    <div className="">
      {existingCode ? (
        <div className="inline-block rounded-2xl border-2 border-dashed border-primary-green/30 bg-primary-green/5 px-6 py-4 text-center">
          <p className="mb-1 text-sm font-medium text-gray-500">
            Your Active Referral Code
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
                  key="modal-content"
                  variants={modalVariants}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
                >
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">
                    Claim Your Referral Code
                  </h2>
                  <p className="mb-4 text-sm text-gray-600">
                    Create a unique 6-character alphanumeric code. Share it with
                    your network to earn rewards.
                  </p>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                      <input
                        type="text"
                        value={referralCode}
                        onChange={handleInputChange}
                        placeholder="e.g., ALPHA1"
                        disabled={isLoading}
                        className="w-full rounded-xl border-2 border-gray-200 px-4 py-4 text-center font-mono text-xl font-bold tracking-[0.2em] text-gray-700 uppercase transition-all focus:border-primary-green focus:ring-4 focus:ring-primary-green/20 focus:outline-none disabled:opacity-50"
                        autoFocus
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
                          className={`text-xs font-medium transition-colors ${referralCode.length === 6 ? 'text-primary-green' : 'text-gray-400'}`}
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
                        className="rounded-xl px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
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
