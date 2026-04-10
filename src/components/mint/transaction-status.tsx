'use client'

import DefaultButton from '@/ui/buttons/default-btn'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useMintCtx } from '../../contexts/mint.context'
import { Checkmark } from '../../ui/svg/checkmark'
import { Crossmark } from '../../ui/svg/crossmark'
import Clock from '../../ui/svg/clock'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MintStatus } from '../../enums/mint.enum'
import { useSatelliteRecovery } from '@/hooks/useSatelliteRecovery'
import { Hex } from 'viem'

// ─────────── Step Progress Tracker ───────────

interface StepInfo {
  label: string
  status: 'done' | 'active' | 'pending'
}

function MintSteps({ steps }: { steps: StepInfo[] }) {
  const currentStepIdx = steps.findIndex((s) => s.status === 'active')
  const valuenow =
    currentStepIdx === -1
      ? steps.every((s) => s.status === 'done')
        ? steps.length
        : 0
      : currentStepIdx

  return (
    <div
      className="flex w-full items-center gap-1"
      role="progressbar"
      aria-valuenow={valuenow}
      aria-valuemin={0}
      aria-valuemax={steps.length}
    >
      {steps.map((step, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={false}
              animate={{
                scaleX:
                  step.status === 'done' || step.status === 'active' ? 1 : 0,
                backgroundColor:
                  step.status === 'done'
                    ? 'var(--color-chart-2)'
                    : 'var(--color-chart-3)',
              }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute top-0 left-0 h-full w-full rounded-full ${step.status === 'active' ? 'animate-pulse' : ''}`}
            />
          </div>
          <motion.span
            animate={{
              color:
                step.status === 'active'
                  ? 'var(--color-chart-3)'
                  : step.status === 'done'
                    ? 'var(--color-chart-2)'
                    : 'var(--color-muted-foreground)',
              fontWeight: step.status === 'active' ? 600 : 500,
            }}
            transition={{ duration: 0.4 }}
            className="text-xs leading-tight"
          >
            {step.label}
          </motion.span>
        </div>
      ))}
    </div>
  )
}

// ─────────── State Definitions ───────────

const STATE_MAP: Record<
  string,
  { textColor: string; message: string; desc: string }
> = {
  [MintStatus.APPROVING]: {
    textColor: 'text-chart-3',
    message: 'Approving token...',
    desc: 'Please confirm the approval in your wallet.',
  },
  [MintStatus.PENDING]: {
    textColor: 'text-chart-3',
    message: 'Transaction pending',
    desc: "Please don't close or refresh this page.",
  },
  [MintStatus.INFLIGHT]: {
    textColor: 'text-chart-3',
    message: 'Cross-chain in flight',
    desc: 'Your transaction is being delivered via LayerZero. You can safely close this page and come back later.',
  },
  [MintStatus.MINTING]: {
    textColor: 'text-chart-3',
    message: 'Minting in progress',
    desc: 'Your transaction has been delivered. The NFT is being minted on the destination chain.',
  },
  [MintStatus.SUCCESS]: {
    textColor: 'text-chart-2',
    message: 'Transaction completed',
    desc: 'Thank you for your payment, TSB is now yours!',
  },
  [MintStatus.FAILED]: {
    textColor: 'text-destructive',
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

  const prefersReducedMotion = useReducedMotion()
  const data = STATE_MAP[status] || STATE_MAP[MintStatus.PENDING]
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Focus the heading whenever the status changes
  useEffect(() => {
    // Small delay to allow framer-motion to render the new heading text
    const timeout = setTimeout(() => {
      headingRef.current?.focus()
    }, 50)
    return () => clearTimeout(timeout)
  }, [status])

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
        <div className="mx-auto w-fit py-6 tablet:py-8">
          <div
            className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border tablet:h-24 tablet:w-24 ${data.textColor} transition-colors duration-500`}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.8, rotate: -30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 30 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute"
                >
                  <Clock size={48} />
                </motion.div>
              ) : status === MintStatus.SUCCESS ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                  className="absolute"
                >
                  <Checkmark size={48} />
                </motion.div>
              ) : status === MintStatus.FAILED ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
                  className="absolute"
                >
                  <Crossmark size={48} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Step Progress */}
        <MintSteps steps={steps} />

        {/* Status Text */}
        <div className="relative">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {data.message}. {errorMessage || data.desc}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              className="space-y-2 text-center"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -5 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3
                ref={headingRef}
                tabIndex={-1}
                className="text-xl font-semibold tracking-tight text-foreground focus:outline-none"
              >
                {data.message}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {errorMessage || data.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {/* Cross-chain inflight notice */}
        {status === MintStatus.INFLIGHT && (
          <motion.div
            className="mt-6 overflow-hidden border-t border-border pt-6 text-center"
            initial={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              marginTop: 24,
              paddingTop: 24,
            }}
            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your source transaction is confirmed. LayerZero is now delivering
              your mint to the hub chain. This typically takes 1-5 minutes but
              can take up to 30 minutes.
            </p>
            <p className="mt-2 text-sm font-medium text-foreground">
              You can safely close this page. Your NFT will be minted
              automatically.
            </p>
          </motion.div>
        )}

        {/* Minting on destination chain */}
        {status === MintStatus.MINTING && (
          <motion.div
            className="mt-6 overflow-hidden border-t border-border pt-6 text-center"
            initial={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              marginTop: 24,
              paddingTop: 24,
            }}
            exit={{ opacity: 0, height: 0, marginTop: 0, paddingTop: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              Cross-chain transfer complete. Your NFT is now being minted on the
              destination chain.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
    <div className="mt-4 flex flex-col items-center gap-4 border-t border-border pt-4">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-foreground">
          Recovery Options
        </p>
        <p className="mx-auto max-w-[280px] text-xs leading-relaxed text-muted-foreground">
          {canExpire
            ? 'The timeout has passed. You can expire this mint and claim a refund.'
            : `You can retry the mint or wait for the timeout (${Math.ceil(recovery.mintTimeout / 60)} min) to expire it.`}
        </p>
      </div>
      <div className="flex w-full gap-2">
        {canExpire && (
          <button
            onClick={() => {
              setAction('expire')
              recovery.expirePendingMint(reqId)
            }}
            disabled={isRecoveryProcessing}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:opacity-50"
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
          className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50"
        >
          {action === 'retry' && isRecoveryProcessing
            ? 'Retrying...'
            : 'Retry Mint'}
        </button>
      </div>
      {recovery.error && (
        <p className="text-center text-xs font-medium text-destructive">
          {(recovery.error as any)?.shortMessage ||
            (recovery.error as any)?.message?.slice(0, 80)}
        </p>
      )}
    </div>
  )
}
