'use client'

import DefaultButton from '@/ui/buttons/default-btn'
import { useEffect, useState, useMemo } from 'react'
import { useMintCtx } from '../../contexts/mint.context'
import { Checkmark } from '../../ui/svg/checkmark'
import { Crossmark } from '../../ui/svg/crossmark'
import Clock from '../../ui/svg/clock'
import { motion, AnimatePresence } from 'framer-motion'
import { MintStatus } from '../../enums/mint.enum'
import { useSatelliteRecovery } from '@/hooks/useSatelliteRecovery'
import { Hex } from 'viem'

// ─────────── Step Progress Tracker ───────────

interface StepInfo {
  label: string
  status: 'done' | 'active' | 'pending'
}

function MintSteps({ steps }: { steps: StepInfo[] }) {
  return (
    <div className="flex w-full items-center gap-1">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div
            className={`h-1.5 w-full rounded-full transition-all duration-500 ${
              step.status === 'done'
                ? 'bg-primary-green'
                : step.status === 'active'
                  ? 'animate-pulse bg-primary-blue'
                  : 'bg-gray-200'
            }`}
          />
          <span
            className={`text-[10px] leading-tight ${
              step.status === 'active'
                ? 'font-medium text-primary-blue'
                : step.status === 'done'
                  ? 'text-primary-green'
                  : 'text-gray-400'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─────────── State Definitions ───────────

const STATE_MAP: Record<
  string,
  { color: string; shadow: string; message: string; desc: string }
> = {
  [MintStatus.APPROVING]: {
    color: '#1346AC',
    shadow: 'bg-[#1346AC]/40',
    message: 'Approving token...',
    desc: 'Please confirm the approval in your wallet.',
  },
  [MintStatus.PENDING]: {
    color: '#1346AC',
    shadow: 'bg-[#1346AC]/40',
    message: 'Transaction pending',
    desc: "Please don't close or refresh this page.",
  },
  [MintStatus.INFLIGHT]: {
    color: '#1346AC',
    shadow: 'bg-[#1346AC]/40',
    message: 'Cross-chain in flight',
    desc: 'Your transaction is being delivered via LayerZero. You can safely close this page and come back later.',
  },
  [MintStatus.MINTING]: {
    color: '#1346AC',
    shadow: 'bg-[#1346AC]/40',
    message: 'Minting in progress',
    desc: 'Your transaction has been delivered. The NFT is being minted on the destination chain.',
  },
  [MintStatus.SUCCESS]: {
    color: '#246234',
    shadow: 'bg-[#246234]/40',
    message: 'Transaction completed',
    desc: 'Thank you for your payment, TSB is now yours!',
  },
  [MintStatus.FAILED]: {
    color: '#D63B29',
    shadow: 'bg-[#D63B29]/40',
    message: 'Transaction failed',
    desc: 'Something went wrong. You can try again.',
  },
}

// ─────────── Main Component ───────────

interface TransactionStatusProps {
  status: MintStatus
}

export default function TransactionStatus({ status }: TransactionStatusProps) {
  const {
    setStatus,
    explorerUrl,
    isCrossChain,
    reqId,
    errorMessage,
    moveToBackground,
    reset: resetMintCtx,
  } = useMintCtx()

  const data = STATE_MAP[status] || STATE_MAP[MintStatus.PENDING]

  // Build steps for progress indicator
  const steps = useMemo((): StepInfo[] => {
    if (!isCrossChain) {
      // Hub (direct) mint: Approve -> Confirm -> Complete
      const isApproving = status === MintStatus.APPROVING
      const isPending = status === MintStatus.PENDING
      const isDone = status === MintStatus.SUCCESS
      const isFailed = status === MintStatus.FAILED

      return [
        {
          label: 'Approve',
          status:
            isDone || isPending ? 'done' : isApproving ? 'active' : 'pending',
        },
        {
          label: 'Confirm',
          status: isDone ? 'done' : isPending ? 'active' : 'pending',
        },
        {
          label: isFailed ? 'Failed' : 'Complete',
          status: isDone ? 'done' : isFailed ? 'active' : 'pending',
        },
      ]
    }

    // Cross-chain (satellite) mint
    const isApproving = status === MintStatus.APPROVING
    const isPending = status === MintStatus.PENDING
    const isInflight = status === MintStatus.INFLIGHT
    const isMinting = status === MintStatus.MINTING
    const isDone = status === MintStatus.SUCCESS
    const isFailed = status === MintStatus.FAILED

    return [
      {
        label: 'Approve',
        status:
          isDone || isPending || isInflight || isMinting
            ? 'done'
            : isApproving
              ? 'active'
              : 'pending',
      },
      {
        label: 'Confirm',
        status:
          isDone || isInflight || isMinting
            ? 'done'
            : isPending
              ? 'active'
              : 'pending',
      },
      {
        label: 'Bridging',
        status:
          isDone || isMinting ? 'done' : isInflight ? 'active' : 'pending',
      },
      {
        label: 'Minting',
        status: isDone ? 'done' : isMinting ? 'active' : 'pending',
      },
      {
        label: isFailed ? 'Failed' : 'Complete',
        status: isDone ? 'done' : isFailed ? 'active' : 'pending',
      },
    ]
  }, [isCrossChain, status])

  const isProcessing =
    status === MintStatus.APPROVING ||
    status === MintStatus.PENDING ||
    status === MintStatus.INFLIGHT ||
    status === MintStatus.MINTING

  return (
    <>
      <div className="space-y-6">
        {/* Icon */}
        <div className="mx-auto w-fit py-4 tablet:py-6">
          <div
            key={status}
            className={`absolute h-16 w-24 tablet:h-20 ${data.shadow} animate-zoom-in blur-2xl`}
            style={{ transform: 'translate3d(0,0,0)', willChange: 'filter' }}
          />
          <div className="relative z-10 w-fit rounded-full bg-white p-3 shadow-xs tablet:p-4">
            {isProcessing && <Clock size={60} color={data.color} />}
            {status === MintStatus.SUCCESS && (
              <Checkmark size={60} color={data.color} />
            )}
            {status === MintStatus.FAILED && (
              <Crossmark size={60} color={data.color} />
            )}
          </div>
        </div>

        {/* Step Progress */}
        <MintSteps steps={steps} />

        {/* Status Text */}
        <motion.div
          key={status}
          className="space-y-2 text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <h3 className="font-medium">{data.message}</h3>
          <motion.p
            className="text-sm text-neutral-30"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {errorMessage || data.desc}
          </motion.p>
        </motion.div>
      </div>

      {/* Cross-chain inflight notice */}
      {status === MintStatus.INFLIGHT && (
        <motion.div
          className="rounded-xl border border-blue-200 bg-blue-50 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-blue-800">
            Your source transaction is confirmed. LayerZero is now delivering
            your mint to the hub chain. This typically takes 1-5 minutes but can
            take up to 30 minutes.
          </p>
          <p className="mt-1 text-xs font-medium text-blue-900">
            You can safely close this page. Your NFT will be minted
            automatically.
          </p>
        </motion.div>
      )}

      {/* Minting on destination chain */}
      {status === MintStatus.MINTING && (
        <motion.div
          className="rounded-xl border border-green-200 bg-green-50 p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs text-green-800">
            Cross-chain transfer complete. Your NFT is now being minted on the
            destination chain.
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          className="flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          {status === MintStatus.SUCCESS && explorerUrl && (
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <DefaultButton classname="w-full">View transaction</DefaultButton>
            </a>
          )}

          {status === MintStatus.FAILED && (
            <DefaultButton classname="w-full" onClick={() => resetMintCtx()}>
              Try again
            </DefaultButton>
          )}

          {/* Cross-chain recovery options */}
          {status === MintStatus.FAILED && isCrossChain && reqId && (
            <CrossChainRecovery reqId={reqId} />
          )}

          {/* Return/Close */}
          {status === MintStatus.INFLIGHT ? (
            <DefaultButton variant="secondary" onClick={moveToBackground}>
              Continue in background
            </DefaultButton>
          ) : status === MintStatus.MINTING ? (
            <DefaultButton variant="secondary" disabled>
              Finalizing...
            </DefaultButton>
          ) : (
            !isProcessing && (
              <DefaultButton
                variant={
                  status === MintStatus.SUCCESS ? 'secondary' : 'primary'
                }
                onClick={() => resetMintCtx()}
              >
                {status === MintStatus.SUCCESS ? 'Mint another' : 'Return home'}
              </DefaultButton>
            )
          )}

          {/* Disable close during signing/mining but show status */}
          {(status === MintStatus.APPROVING ||
            status === MintStatus.PENDING) && (
            <DefaultButton variant="secondary" disabled>
              {status === MintStatus.APPROVING
                ? 'Approving...'
                : 'Processing...'}
            </DefaultButton>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// ─────────── Cross-Chain Recovery Actions ───────────

function CrossChainRecovery({ reqId }: { reqId: Hex }) {
  const recovery = useSatelliteRecovery()
  const [action, setAction] = useState<'idle' | 'expire' | 'refund' | 'retry'>(
    'idle',
  )

  useEffect(() => {
    if (recovery.isSuccess) {
      recovery.refetchPending()
      recovery.refetchRequest()
      setAction('idle')
    }
  }, [recovery.isSuccess])

  const canExpire = useMemo(() => {
    if (!recovery.mintRequestData) return false
    const timestamp = Number(recovery.mintRequestData[5]) // timestamp field
    const elapsed = Date.now() / 1000 - timestamp
    return elapsed >= recovery.mintTimeout
  }, [recovery.mintRequestData, recovery.mintTimeout])

  const isRecoveryProcessing = recovery.isSigning || recovery.isProcessing

  return (
    <div className="mt-2 space-y-2 rounded-xl border border-red-200 bg-red-50 p-3">
      <p className="text-xs font-medium text-red-800">Recovery Options</p>
      <p className="text-xs text-red-600">
        {canExpire
          ? 'The timeout has passed. You can expire this mint and claim a refund.'
          : `You can retry the mint or wait for the timeout (${Math.ceil(recovery.mintTimeout / 60)} min) to expire it.`}
      </p>
      <div className="flex gap-2">
        {canExpire && (
          <button
            onClick={() => {
              setAction('expire')
              recovery.expirePendingMint(reqId)
            }}
            disabled={isRecoveryProcessing}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {action === 'expire' && isRecoveryProcessing
              ? 'Expiring...'
              : 'Expire & Refund'}
          </button>
        )}
        <button
          onClick={() => {
            setAction('retry')
            recovery.retryPendingMint(reqId)
          }}
          disabled={isRecoveryProcessing}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {action === 'retry' && isRecoveryProcessing
            ? 'Retrying...'
            : 'Retry Mint'}
        </button>
      </div>
      {recovery.error && (
        <p className="text-xs text-red-500">
          {(recovery.error as any)?.shortMessage ||
            (recovery.error as any)?.message?.slice(0, 80)}
        </p>
      )}
    </div>
  )
}
