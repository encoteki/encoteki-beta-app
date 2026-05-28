'use client'

import DefaultButton from '@/ui/buttons/default-btn'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useMintCtx } from '../../contexts/mint.context'
import { Checkmark } from '../../ui/svg/checkmark'
import { Crossmark } from '../../ui/svg/crossmark'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Hidden from '@/assets/mint/hidden.png'
import { MintStatus } from '../../enums/mint.enum'
import { useSatelliteRecovery } from '@/hooks/useSatelliteRecovery'
import { Hex } from 'viem'
import Image from 'next/image'
import { getChain, getChainByKey } from '@/constants/contracts/tsb'
import { humanizeError } from '@/utils/humanize-error.util'
import BaseIcon from '@/assets/chains/base.jpeg'
import ArbitrumIcon from '@/assets/chains/arbitrum.svg'
import LiskIcon from '@/assets/chains/lisk.webp'
import MantaIcon from '@/assets/chains/manta.png'
import { useReadContract, useAccount } from 'wagmi'
import { tsbhub_abi } from '@/constants/contracts/abi'

// ─────────── Success Particle Scatter ───────────

const SUCCESS_PARTICLES = Array.from({ length: 8 }).map((_, i) => {
  const rad = ((i * 360) / 8) * (Math.PI / 180)
  const dist = 50 + (i % 3) * 9
  return {
    x: Math.round(Math.cos(rad) * dist),
    y: Math.round(Math.sin(rad) * dist),
    size: 3 + (i % 3),
    delay: 0.15 + i * 0.04,
    duration: 0.6 + i * 0.03,
  }
})

function SuccessParticles() {
  return (
    <>
      {SUCCESS_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute top-1/2 left-1/2 rounded-full bg-primary-green"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
          }}
          initial={{ x: 0, y: 0, opacity: 0.85, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}
    </>
  )
}

// ─────────── Step Progress Tracker ───────────

const EXPO_OUT = [0.16, 1, 0.3, 1] as const
const KNOT_PX = 10

interface StepInfo {
  label: string
  status: 'done' | 'active' | 'pending' | 'failed'
}

function KnotNode({
  step,
  prefersReducedMotion,
}: {
  step: StepInfo
  prefersReducedMotion: boolean | null
}) {
  if (step.status === 'done') {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full bg-primary-green"
        style={{ width: KNOT_PX, height: KNOT_PX }}
        initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EXPO_OUT }}
      >
        <svg
          width="6"
          height="5"
          viewBox="0 0 6 5"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M1 2.5l1.5 1.5L5 1"
            stroke="white"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    )
  }

  if (step.status === 'active') {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{ width: KNOT_PX, height: KNOT_PX }}
      >
        {!prefersReducedMotion && (
          <motion.div
            className="absolute rounded-full bg-primary-green/20"
            style={{ width: KNOT_PX, height: KNOT_PX }}
            animate={{ scale: [1, 2.6], opacity: [0.9, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
              repeatDelay: 0.5,
            }}
          />
        )}
        <motion.div
          className="rounded-full bg-primary-green"
          style={{ width: 5, height: 5 }}
          animate={prefersReducedMotion ? {} : { scale: [1, 1.25, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    )
  }

  if (step.status === 'failed') {
    return (
      <motion.div
        className="flex items-center justify-center rounded-full bg-destructive"
        style={{ width: KNOT_PX, height: KNOT_PX }}
        initial={prefersReducedMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: EXPO_OUT }}
      >
        <svg
          width="6"
          height="6"
          viewBox="0 0 6 6"
          fill="none"
          aria-hidden="true"
          style={{ display: 'block' }}
        >
          <path
            d="M1.5 1.5l3 3M4.5 1.5l-3 3"
            stroke="white"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    )
  }

  // Pending
  return (
    <div
      className="rounded-full"
      style={{ width: KNOT_PX, height: KNOT_PX, border: '2px solid #DADA9F' }}
    />
  )
}

function MintSteps({
  steps,
  compact,
}: {
  steps: StepInfo[]
  compact?: boolean
}) {
  const n = steps.length
  const prefersReducedMotion = useReducedMotion()

  const currentStepIdx = steps.findIndex(
    (s) => s.status === 'active' || s.status === 'failed',
  )
  const valuenow =
    currentStepIdx === -1
      ? steps.every((s) => s.status === 'done')
        ? steps.length
        : 0
      : currentStepIdx

  // Each column is (100/n)% wide; knot center is at (i + 0.5) × (100/n)%
  const segW = 100 / n

  return (
    <div
      role="progressbar"
      aria-valuenow={valuenow}
      aria-valuemin={0}
      aria-valuemax={n}
      aria-valuetext={
        valuenow === n
          ? 'All steps complete'
          : steps[currentStepIdx]
            ? `${steps[currentStepIdx].label} — step ${currentStepIdx + 1} of ${n}`
            : undefined
      }
      className="w-full"
    >
      <div className="relative w-full">
        {/* Thread segments connect knot centers */}
        <div
          className="pointer-events-none absolute w-full"
          aria-hidden="true"
          style={{ top: KNOT_PX / 2 - 1, height: 2 }}
        >
          {steps.slice(0, -1).map((step, i) => {
            const nextStep = steps[i + 1]
            const done = step.status === 'done'
            const toFailed = nextStep.status === 'failed'

            return (
              <div
                key={i}
                className="absolute h-full"
                style={{
                  left: `calc(${(i + 0.5) * segW}% + ${KNOT_PX / 2}px)`,
                  width: `calc(${segW}% - ${KNOT_PX}px)`,
                }}
              >
                {done && !toFailed ? (
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-primary-green"
                    initial={prefersReducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.5, ease: EXPO_OUT }}
                  />
                ) : toFailed ? (
                  <motion.div
                    className="h-full w-full origin-left rounded-full bg-destructive/30"
                    initial={prefersReducedMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.4, ease: EXPO_OUT }}
                  />
                ) : (
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg,#DADA9F 0,#DADA9F 3px,transparent 3px,transparent 7px)',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Knots row — sits above thread in paint order */}
        <div className="relative flex w-full">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-1 justify-center">
              <KnotNode
                step={step}
                prefersReducedMotion={prefersReducedMotion}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className="mt-3 flex w-full">
        {steps.map((step, i) => (
          <motion.span
            key={i}
            aria-label={`Step ${i + 1} of ${n}: ${step.label}, ${step.status}`}
            animate={{
              color:
                step.status === 'done'
                  ? '#246234'
                  : step.status === 'failed'
                    ? '#D63B29'
                    : step.status === 'active'
                      ? '#515351'
                      : '#7D817D',
              opacity: step.status === 'pending' ? 0.5 : 1,
            }}
            transition={{ duration: 0.3 }}
            className={`flex flex-1 justify-center tracking-wide ${
              compact ? 'text-[10px]' : 'text-xs'
            } ${
              step.status === 'active' || step.status === 'failed'
                ? 'font-semibold'
                : 'font-medium'
            }`}
          >
            {step.label}
          </motion.span>
        ))}
      </div>
    </div>
  )
}

// ─────────── State Definitions ───────────

const STATE_MAP: Record<
  string,
  { textColor: string; message: string; desc: string }
> = {
  [MintStatus.APPROVING]: {
    textColor: 'text-neutral-10',
    message: 'Check your wallet',
    desc: 'Open your wallet and sign to allow the token transfer.',
  },
  [MintStatus.PENDING]: {
    textColor: 'text-neutral-10',
    message: 'Confirming',
    desc: 'Your transaction is being confirmed. This usually takes under a minute.',
  },
  [MintStatus.INFLIGHT]: {
    textColor: 'text-neutral-10',
    message: 'Joining the collection',
    desc: 'Your payment is confirmed. Syncing your spot in the collection. This usually takes 1–5 minutes.',
  },
  [MintStatus.MINTING]: {
    textColor: 'text-neutral-10',
    message: 'Creating your NFT',
    desc: 'Your spot is confirmed. Your conservation NFT is being minted on your chain now.',
  },
  [MintStatus.SUCCESS]: {
    textColor: 'text-primary-green',
    message: 'Welcome to the community',
    desc: 'Your conservation NFT is in your wallet. You now have a vote in upcoming Encoteki DAO proposals.',
  },
  [MintStatus.FAILED]: {
    textColor: 'text-destructive',
    message: 'Transaction failed',
    desc: 'The transaction did not go through. Your funds are safe. Try again below.',
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
    selectedChainId,
  } = useMintCtx()

  const { address } = useAccount()
  const hubContract = getChainByKey('BASE')

  const { data: nftBalance } = useReadContract({
    address: hubContract?.contract,
    abi: tsbhub_abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: 8453,
    query: {
      enabled:
        status === MintStatus.SUCCESS && !!address && !!hubContract?.contract,
    },
  })

  const isRepeatMint =
    status === MintStatus.SUCCESS &&
    nftBalance !== undefined &&
    Number(nftBalance) > 1

  const prefersReducedMotion = useReducedMotion()

  const stateData = STATE_MAP[status] || STATE_MAP[MintStatus.PENDING]
  const data =
    status === MintStatus.SUCCESS && isRepeatMint
      ? {
          ...stateData,
          message: 'Minted',
          desc: 'Your conservation NFT is in your wallet.',
        }
      : stateData
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
          status: isDone ? 'done' : isFailed ? 'failed' : 'pending',
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
        label: 'Syncing',
        status:
          isDone || isMinting ? 'done' : isInflight ? 'active' : 'pending',
      },
      {
        label: 'Minting',
        status: isDone ? 'done' : isMinting ? 'active' : 'pending',
      },
      {
        label: isFailed ? 'Failed' : 'Complete',
        status: isDone ? 'done' : isFailed ? 'failed' : 'pending',
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
      <div className="flex flex-col gap-0">
        {/* Icon */}
        <div className="mx-auto w-fit pt-4 pb-8">
          <div
            className={`relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl transition-all duration-700 tablet:h-28 tablet:w-28 ${data.textColor} ${
              status === MintStatus.SUCCESS
                ? 'bg-green-90 shadow-[0_4px_24px_rgba(36,98,52,0.2)] ring-1 ring-primary-green/40'
                : status === MintStatus.FAILED
                  ? 'bg-red-90 shadow-[0_4px_24px_rgba(214,59,41,0.15)] ring-1 ring-primary-red/30'
                  : 'bg-khaki-90 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ring-1 ring-neutral-60/40'
            }`}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  {/* NFT image — breathes slowly to signal life while the tx processes */}
                  <motion.div
                    className="absolute inset-0"
                    animate={
                      prefersReducedMotion ? {} : { scale: [1, 1.07, 1] }
                    }
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Image
                      src={Hidden}
                      alt="Your NFT is forming"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </motion.div>
                  {/* Glow ring — pulses at half the breath tempo */}
                  {!prefersReducedMotion && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{
                        duration: 5.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{ boxShadow: '0 0 0 5px rgba(36,98,52,0.28)' }}
                    />
                  )}
                </motion.div>
              ) : status === MintStatus.SUCCESS ? (
                <motion.div
                  key="success"
                  className="absolute"
                  style={{ top: 'calc(50% - 24px)', left: 'calc(50% - 24px)' }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Checkmark size={48} strokeWidth={3} className="block" />
                </motion.div>
              ) : status === MintStatus.FAILED ? (
                <motion.div
                  key="failed"
                  className="absolute"
                  style={{ top: 'calc(50% - 24px)', left: 'calc(50% - 24px)' }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Crossmark size={48} strokeWidth={3} className="block" />
                </motion.div>
              ) : null}
            </AnimatePresence>
            {status === MintStatus.SUCCESS && !prefersReducedMotion && (
              <SuccessParticles />
            )}
          </div>
        </div>

        {/* Step Progress */}
        <MintSteps steps={steps} compact={isCrossChain} />

        {/* Status Text */}
        <div className="relative pt-7">
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {data.message}. {errorMessage || data.desc}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              className="space-y-1.5 text-center"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3
                ref={headingRef}
                tabIndex={-1}
                className="text-2xl leading-tight font-semibold text-balance text-neutral-10 focus:outline-none"
              >
                {data.message}
              </h3>
              <p className="mx-auto max-w-[30ch] text-sm wrap-break-word text-neutral-40 sm:max-w-none tablet:text-base">
                {errorMessage || data.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {/* Cross-chain inflight: bridge route visualization */}
        {status === MintStatus.INFLIGHT && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <BridgeRoute sourceChainId={selectedChainId} />
          </motion.div>
        )}

        {/* Minting on origin chain, collection sync complete */}
        {status === MintStatus.MINTING && (
          <motion.div
            className="mt-8 rounded-2xl bg-khaki-90 p-5 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="text-sm font-medium text-neutral-10">
              Collection sync complete!
            </p>
            <p className="text-sm text-neutral-40">
              Your NFT is being minted on your chain now.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          className="mt-8 flex flex-col gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {status === MintStatus.SUCCESS && explorerUrl && (
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-primary-green px-4 text-center text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-green-10 active:scale-95 tablet:px-6"
            >
              View transaction
            </a>
          )}

          {status === MintStatus.FAILED && (
            <DefaultButton classname="w-full" onClick={() => resetMintCtx()}>
              Try again
            </DefaultButton>
          )}

          {/* Cross-chain recovery options */}
          {/*{status === MintStatus.FAILED && isCrossChain && reqId && (
            <CrossChainRecovery reqId={reqId} />
          )}*/}

          {/* Return/Close */}
          {status === MintStatus.INFLIGHT ? (
            <DefaultButton
              variant="secondary"
              classname="w-full"
              onClick={moveToBackground}
            >
              I'll check back later
            </DefaultButton>
          ) : status === MintStatus.MINTING ? (
            <DefaultButton variant="secondary" classname="w-full" disabled>
              Finalizing...
            </DefaultButton>
          ) : (
            !isProcessing && (
              <DefaultButton
                variant="secondary"
                classname="w-full"
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
                : 'Confirming...'}
            </DefaultButton>
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

// ─────────── Chain Icon Lookup ───────────

function getChainIcon(key: string) {
  switch (key) {
    case 'BASE':
      return BaseIcon
    case 'ARBITRUM':
      return ArbitrumIcon
    case 'LISK':
      return LiskIcon
    case 'MANTA':
      return MantaIcon
    default:
      return null
  }
}

// ─────────── Bridge Route Visualizer ───────────

function BridgeRoute({ sourceChainId }: { sourceChainId: number | null }) {
  const prefersReducedMotion = useReducedMotion()
  const sourceChain = sourceChainId ? getChain(sourceChainId) : null
  const hubChain = getChainByKey('BASE')

  if (!hubChain) return null

  const sourceIcon = sourceChain ? getChainIcon(sourceChain.key) : null
  const hubIcon = getChainIcon(hubChain.key)

  return (
    <div className="mt-8 overflow-hidden rounded-2xl bg-khaki-90 p-4 sm:p-5">
      {/* Chain logos + animated transit dots */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex flex-1 flex-col items-center gap-1">
          <figure className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-60 sm:h-10 sm:w-10">
            {sourceIcon ? (
              <Image
                src={sourceIcon}
                alt={sourceChain?.label ?? 'Source chain'}
                width={40}
                height={40}
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full rounded-full bg-khaki-70" />
            )}
          </figure>
          <span className="w-full truncate text-center text-[10px] font-medium text-neutral-10 sm:text-xs">
            {sourceChain?.label ?? 'Network'}
          </span>
          <span className="text-center text-[10px] text-neutral-40 sm:text-xs">
            paying
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center gap-1 sm:gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-primary-green sm:h-2 sm:w-2"
              animate={
                prefersReducedMotion
                  ? { opacity: 0.6 }
                  : { opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }
              }
              transition={
                prefersReducedMotion
                  ? {}
                  : {
                      duration: 1.4,
                      delay: i * 0.25,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }
              }
            />
          ))}
        </div>

        <div className="flex flex-1 flex-col items-center gap-1">
          <figure className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-60 sm:h-10 sm:w-10">
            {hubIcon && (
              <Image
                src={hubIcon}
                alt={hubChain.label}
                width={40}
                height={40}
                className="object-cover"
              />
            )}
          </figure>
          <span className="w-full truncate text-center text-[10px] font-medium text-neutral-10 sm:text-xs">
            {hubChain.label}
          </span>
          <span className="text-center text-[10px] text-neutral-40 sm:text-xs">
            minting
          </span>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-neutral-40 sm:mt-4 sm:text-sm">
        Syncing your spot in the collection. Usually takes 1–5 minutes.
      </p>
      <p className="mt-1 text-center text-xs text-neutral-10 sm:mt-1.5 sm:text-sm">
        You can safely close this page. The mint will complete automatically.
      </p>
    </div>
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
    <div className="mt-4 flex flex-col items-center gap-4 border-t border-neutral-60 pt-4">
      <div className="space-y-1 text-center">
        <p className="text-sm font-semibold text-neutral-10">
          Recovery Options
        </p>
        <p className="mx-auto max-w-70 text-xs leading-relaxed text-neutral-40">
          {canExpire
            ? 'The timeout has passed. You can expire this mint and claim a refund.'
            : `You can retry the mint or wait for the timeout (${Math.ceil(recovery.mintTimeout / 60)} min) to expire it.`}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row">
        {canExpire && (
          <button
            onClick={() => {
              setAction('expire')
              recovery.expirePendingMint(reqId)
            }}
            disabled={isRecoveryProcessing}
            className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-neutral-60 bg-white px-4 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
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
          className="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-neutral-60 bg-white px-4 text-sm font-medium text-neutral-10 shadow-sm transition-colors hover:bg-khaki-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action === 'retry' && isRecoveryProcessing
            ? 'Retrying...'
            : 'Retry mint'}
        </button>
      </div>
      {recovery.error && (
        <p className="text-center text-xs font-medium wrap-break-word text-destructive">
          {humanizeError(recovery.error)}
        </p>
      )}
    </div>
  )
}
