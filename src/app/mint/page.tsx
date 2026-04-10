'use client'

import ReviewTransaction from '@/components/mint/review-transaction'
import SelectPaymentMethod from '@/components/mint/select-payment-method'
import TransactionStatus from '@/components/mint/transaction-status'
import { MintStatus } from '@/enums/mint.enum'
import { useMintCtx } from '@/contexts/mint.context'

export default function MintPage() {
  const { status, paymentMethod } = useMintCtx()

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

  return (
    <main className="mint-container">
      <div className="mint-modal" role="region" aria-label="Mint Transaction">
        {status === MintStatus.HOME && <SelectPaymentMethod />}
        {(status === MintStatus.REVIEW || isMinting) && (
          <div className={isMinting ? 'hidden' : ''}>
            <ReviewTransaction />
          </div>
        )}
        {showStatus && <TransactionStatus status={status} />}
      </div>
    </main>
  )
}
