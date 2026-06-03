'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useChainId, useConnection, useSwitchChain } from 'wagmi'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintCtx } from '../../contexts/mint.context'
import {
  getPaymentMethods,
  getEnabledChains,
  getAllChains,
  getContract,
  isHubChain,
  Token,
} from '@/constants/contracts/tsb'
import { PaymentCard } from './payment-card'
import { Skeleton } from '@/ui/skeleton'
import { MintStatus } from '../../enums/mint.enum'
import { useUser } from '@/hooks/useUser'
import { useAppCtx } from '@/contexts/app.context'
import { useSatelliteRecovery } from '@/hooks/useSatelliteRecovery'
import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

// Chain icons
import BaseIcon from '@/assets/chains/base.jpeg'
import ArbitrumIcon from '@/assets/chains/arbitrum.svg'
import LiskIcon from '@/assets/chains/lisk.webp'
import MantaIcon from '@/assets/chains/manta.png'

// Helper to get chain icon
const getChainIcon = (chainKey: string) => {
  switch (chainKey) {
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

export default function SelectPaymentMethod() {
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [paymentMethods, setPaymentMethods] = useState<Token[]>([])
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [switchChainError, setSwitchChainError] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const {
    setPaymentMethod,
    setTargetContract,
    setStatus,
    setReferralCode,
    setIsCrossChain,
    selectedChainId,
    setSelectedChainId,
    restoreFromBackground,
  } = useMintCtx()
  // useChainId() clamps to the wagmi config chains, so it can't detect when
  // the wallet is on an unsupported chain. useConnection().chainId returns
  // the real wallet chain.
  const configChainId = useChainId()
  const { chainId: connectionChainId } = useConnection()
  const walletChainId = connectionChainId ?? configChainId
  const { mutateAsync: switchChain } = useSwitchChain()
  const { isLoggedIn, isLoading: isUserLoading } = useUser()
  const { referralCode: globalReferralCode, backgroundMint } = useAppCtx()

  const enabledChains = getEnabledChains()
  const allChains = getAllChains()

  // Use selectedChainId if set, otherwise use walletChainId
  // This ensures user's chain choice persists and doesn't revert to default
  const activeChainId = selectedChainId ?? walletChainId
  const activeConfig = allChains.find((c) => c.chainId === activeChainId)
  const isHub = isHubChain(activeChainId)

  // Check for pending cross-chain mint
  const { pendingReqId, mintRequestData } = useSatelliteRecovery()

  const isLoadingState = isUserLoading
  const hasBackgroundMint = !!backgroundMint

  // Don't auto-reset selectedChainId - let user's choice persist
  // The activeChainId will use selectedChainId when available, walletChainId as fallback
  // This prevents the chain from reverting back to default after successful switch

  // If the wallet boots on an unsupported chain, fall back to the first
  // enabled chain so the dropdown and payment list render a valid target.
  useEffect(() => {
    if (selectedChainId === null && walletChainId) {
      const isSupported = allChains.some((c) => c.chainId === walletChainId)
      setSelectedChainId(
        isSupported
          ? walletChainId
          : (enabledChains[0]?.chainId ?? walletChainId),
      )
    }
  }, [])

  // Clear switch error when wallet chain matches selected chain
  useEffect(() => {
    if (selectedChainId === walletChainId) {
      setSwitchChainError(null)
    }
  }, [walletChainId, selectedChainId])

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // Update payment methods when chain changes
  useEffect(() => {
    if (!isLoggedIn) {
      setPaymentMethods([])
      return
    }
    // Remove artificial loading delay since getPaymentMethods is synchronous
    const methods = getPaymentMethods(activeChainId)
    setPaymentMethods(methods)
    setActiveIdx(0)
  }, [activeChainId, isLoggedIn])

  const handleChainSelect = async (chainId: number) => {
    setChainDropdownOpen(false)
    setSelectedChainId(chainId)
    setSwitchChainError(null)

    // Only switch if different from current wallet chain
    if (chainId !== walletChainId) {
      setIsSwitchingChain(true)
      try {
        await switchChain({ chainId })
        // Clear error on success
        setSwitchChainError(null)
      } catch (error) {
        // If switch fails, keep the selectedChainId so user can retry
        console.error('Chain switch failed:', error)
        const errorMsg =
          error instanceof Error ? error.message : 'Failed to switch chain'
        setSwitchChainError(errorMsg)
        // Don't reset - let user try again or manually switch in wallet
      } finally {
        setIsSwitchingChain(false)
      }
    }
  }

  const onClickReview = useCallback(() => {
    if (!isLoggedIn) return
    setReferralCode(globalReferralCode || '')
    setPaymentMethod(paymentMethods[activeIdx])
    setTargetContract(getContract(activeChainId)!)
    setIsCrossChain(!isHub)
    setStatus(MintStatus.REVIEW)
  }, [
    isLoggedIn,
    globalReferralCode,
    paymentMethods,
    activeIdx,
    activeChainId,
    isHub,
    setReferralCode,
    setPaymentMethod,
    setTargetContract,
    setIsCrossChain,
    setStatus,
  ])

  const handlePaymentMethodSelect = useCallback((idx: number) => {
    setActiveIdx(idx)
  }, [])

  const skeletonCount = paymentMethods.length > 0 ? paymentMethods.length : 2

  const isWalletOnSupportedChain =
    walletChainId !== undefined &&
    allChains.some((c) => c.chainId === walletChainId)
  const needsChainSwitch =
    selectedChainId !== null &&
    (!isWalletOnSupportedChain || selectedChainId !== walletChainId)

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      {/* Priority notifications — only one visible at a time; recovery beats background toast */}
      <AnimatePresence mode="wait">
        {!isHub && pendingReqId && mintRequestData ? (
          <motion.div
            key="recovery-notice"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="mb-6 rounded-xl border border-khaki-60 bg-khaki-90 p-4"
          >
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-neutral-40" />
              <p className="text-small font-semibold text-neutral-10">
                Finish your pending mint
              </p>
            </div>
            <p className="mt-2 text-caption leading-relaxed text-neutral-40">
              A previous mint is still processing. Complete or cancel it before
              starting a new one.
            </p>
            <button
              onClick={() => setStatus(MintStatus.INFLIGHT)}
              className="mt-3 text-caption font-semibold text-primary-green transition-colors hover:text-green-10"
            >
              Check status
            </button>
          </motion.div>
        ) : backgroundMint ? (
          <motion.button
            key="background-mint"
            role="status"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={restoreFromBackground}
            className="mb-6 flex w-full items-center gap-3 rounded-xl border border-neutral-60 bg-khaki-90 p-3 text-left transition-all hover:bg-khaki-80 active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-khaki-80">
              {backgroundMint.status === MintStatus.SUCCESS ? (
                <div className="h-3 w-3 rounded-full bg-primary-green" />
              ) : backgroundMint.status === MintStatus.FAILED ? (
                <div className="h-3 w-3 rounded-full bg-destructive" />
              ) : (
                <div className="h-3 w-3 animate-pulse rounded-full bg-neutral-40" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-small font-medium text-neutral-10">
                {backgroundMint.status === MintStatus.SUCCESS
                  ? 'Mint completed!'
                  : backgroundMint.status === MintStatus.FAILED
                    ? 'Mint failed'
                    : 'Mint in progress'}
              </p>
              <p className="text-caption text-neutral-40">
                Tap to view transaction status
              </p>
            </div>
            <svg
              className="h-4 w-4 text-neutral-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.button>
        ) : null}
      </AnimatePresence>

      {/* Network Selection */}
      <div className="mb-2 text-left">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-h2 font-semibold tracking-tight text-neutral-10 focus:outline-none"
        >
          Network
        </h2>
      </div>

      <div className="relative mb-8">
        <button
          aria-haspopup="listbox"
          aria-expanded={chainDropdownOpen}
          aria-controls="chain-dropdown"
          onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-neutral-60 bg-white px-4 py-3 shadow-sm transition-colors hover:bg-khaki-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-3">
            {activeConfig && getChainIcon(activeConfig.key) && (
              <figure className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-neutral-60">
                <Image
                  src={getChainIcon(activeConfig.key)!}
                  alt={activeConfig.label}
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </figure>
            )}
            <span className="text-body font-medium text-neutral-10">
              {activeConfig?.label ?? 'Select network'}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`shrink-0 text-neutral-40 transition-transform duration-200 ${chainDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {chainDropdownOpen && (
            <motion.ul
              id="chain-dropdown"
              role="listbox"
              initial={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              className="absolute z-20 mt-2 max-h-56 w-full overflow-hidden overflow-y-auto rounded-xl border border-neutral-60 bg-white shadow-lg"
            >
              {enabledChains.map((chain) => {
                const isActive = chain.chainId === activeChainId
                const chainIcon = getChainIcon(chain.key)

                return (
                  <li
                    key={chain.key}
                    role="option"
                    aria-selected={isActive}
                    tabIndex={0}
                    onClick={() => handleChainSelect(chain.chainId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleChainSelect(chain.chainId)
                      }
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green/40 focus-visible:ring-inset ${
                      isActive ? 'bg-khaki-80' : 'hover:bg-khaki-90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {chainIcon && (
                        <figure className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                          <Image
                            src={chainIcon}
                            alt={chain.label}
                            width={24}
                            height={24}
                            className="object-cover"
                          />
                        </figure>
                      )}
                      <div className="flex flex-col">
                        <span
                          className={`text-small font-medium ${isActive ? 'font-semibold text-primary-green' : 'text-neutral-10'}`}
                        >
                          {chain.label}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary-green shadow-sm" />
                    )}
                  </li>
                )
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Chain switch error message */}
      {switchChainError && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 rounded-full bg-destructive/10 p-1">
              <svg
                className="h-4 w-4 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-small font-medium text-neutral-10">
                Network switch failed
              </p>
              <p className="mt-1 text-caption text-neutral-40">
                Switch to{' '}
                <span className="font-semibold text-neutral-10">
                  {activeConfig?.label}
                </span>{' '}
                in your wallet or try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="mb-2 text-left">
        <h3 className="text-caption font-semibold tracking-wider text-neutral-40 uppercase">
          Token
        </h3>
      </div>

      <div className="mb-8 flex flex-col gap-3">
        {isLoadingState ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="flex w-full items-center justify-between rounded-xl border border-neutral-60 bg-white p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-khaki-70 sm:h-10 sm:w-10" />
                <div className="flex flex-col gap-2 text-left">
                  <Skeleton className="h-4 w-16 rounded bg-khaki-70 sm:w-20" />
                  <Skeleton className="h-3 w-12 rounded bg-khaki-70 sm:w-16" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-20 rounded bg-khaki-70 sm:w-24" />
              </div>
            </div>
          ))
        ) : paymentMethods.length > 0 ? (
          <>
            {paymentMethods.map((item: Token, idx) => (
              <PaymentCard
                key={`${item.address}-${idx}`}
                item={item}
                idx={idx}
                isActive={activeIdx === idx}
                onSelect={handlePaymentMethodSelect}
              />
            ))}
          </>
        ) : (
          <div className="py-6 text-center text-small text-neutral-40">
            No tokens available on{' '}
            {activeConfig?.label ?? `Chain ID: ${activeChainId}`}. Try switching
            to Base or Arbitrum above.
          </div>
        )}
      </div>

      {/* Referral indicator (auto-applied from login) */}
      {globalReferralCode && (
        <div className="mb-6 flex items-center gap-2 text-small text-neutral-40">
          <svg
            className="h-4 w-4 text-primary-green"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>
            Referral code{' '}
            <span className="max-w-50 truncate font-mono font-medium text-neutral-10">
              {globalReferralCode}
            </span>{' '}
            applied
          </span>
        </div>
      )}

      <DefaultButton
        onClick={onClickReview}
        disabled={
          !isLoggedIn ||
          isLoadingState ||
          paymentMethods.length === 0 ||
          needsChainSwitch ||
          hasBackgroundMint ||
          (!isHub && !!pendingReqId)
        }
      >
        {isLoadingState
          ? 'Loading tokens...'
          : !isLoggedIn
            ? 'Connect wallet'
            : hasBackgroundMint
              ? 'Mint in progress...'
              : needsChainSwitch
                ? 'Switch network to continue'
                : !isHub && !!pendingReqId
                  ? 'Complete pending mint first'
                  : 'Review order'}
      </DefaultButton>
    </div>
  )
}
