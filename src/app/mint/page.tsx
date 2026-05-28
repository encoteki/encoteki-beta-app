'use client'

import dynamic from 'next/dynamic'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SelectPaymentMethod from '@/components/mint/select-payment-method'
import { MintStatus } from '@/enums/mint.enum'
import { useMintCtx } from '@/contexts/mint.context'

const ReviewTransaction = dynamic(
  () => import('@/components/mint/review-transaction'),
  { ssr: false },
)
const TransactionStatus = dynamic(
  () => import('@/components/mint/transaction-status'),
  { ssr: false },
)

export default function MintPage() {
  const { status, paymentMethod } = useMintCtx()
  const prefersReducedMotion = useReducedMotion()

  const showStatus =
    status === MintStatus.APPROVING ||
    status === MintStatus.PENDING ||
    status === MintStatus.INFLIGHT ||
    status === MintStatus.MINTING ||
    status === MintStatus.SUCCESS ||
    status === MintStatus.FAILED

  // ReviewTransaction must stay mounted during the tx so useMintTransaction
  // (inside MintButton) keeps its wagmi hooks alive for receipt watching.
  // Only mount when paymentMethod exists — restored-from-background flows
  // land directly on TransactionStatus without going through Review.
  const isMinting =
    (status === MintStatus.APPROVING ||
      status === MintStatus.PENDING ||
      status === MintStatus.INFLIGHT ||
      status === MintStatus.MINTING) &&
    !!paymentMethod

  const variants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.12,
        ease: [0.4, 0, 1, 1] as const,
      },
    },
  }

  return (
    <main className="mint-container">
      <motion.div
        layout
        className="mint-modal relative overflow-hidden"
        role="region"
        aria-label="Mint Transaction"
        transition={{
          layout: {
            duration: prefersReducedMotion ? 0 : 0.25,
            ease: [0.16, 1, 0.3, 1] as const,
          },
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {status === MintStatus.HOME && (
            <motion.div
              key="home"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full shrink-0"
            >
              <SelectPaymentMethod />
            </motion.div>
          )}

          {(status === MintStatus.REVIEW || isMinting) && (
            <motion.div
              key="review"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`w-full shrink-0 ${isMinting ? 'hidden' : ''}`}
            >
              <ReviewTransaction />
            </motion.div>
          )}

          {showStatus && (
            <motion.div
              key="status"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full shrink-0"
            >
              <TransactionStatus status={status} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  )
}
