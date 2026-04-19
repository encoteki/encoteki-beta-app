'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useChainId, useSwitchChain } from 'wagmi'
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
  const walletChainId = useChainId()
  const { switchChain } = useSwitchChain()
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

  // Initialize selectedChainId from wallet chain on first load
  useEffect(() => {
    if (selectedChainId === null && walletChainId) {
      setSelectedChainId(walletChainId)
    }
  }, []) // Only run once on mount

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

  const needsChainSwitch =
    selectedChainId !== null && selectedChainId !== walletChainId

  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      {/* Background mint toast */}
      <AnimatePresence>
        {backgroundMint && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            onClick={restoreFromBackground}
            className="mb-4 flex w-full items-center gap-3 rounded-xl border border-border bg-muted/20 p-3 text-left transition-all hover:bg-muted/40 active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-chart-3/10">
              {backgroundMint.status === MintStatus.SUCCESS ? (
                <div className="h-3 w-3 rounded-full bg-chart-2" />
              ) : backgroundMint.status === MintStatus.FAILED ? (
                <div className="h-3 w-3 rounded-full bg-destructive" />
              ) : (
                <div className="h-3 w-3 animate-pulse rounded-full bg-chart-3" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {backgroundMint.status === MintStatus.SUCCESS
                  ? 'Mint completed!'
                  : backgroundMint.status === MintStatus.FAILED
                    ? 'Mint failed'
                    : 'Mint in progress'}
              </p>
              <p className="text-xs text-muted-foreground">
                Tap to view transaction status
              </p>
            </div>
            <svg
              className="h-4 w-4 text-muted-foreground"
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
        )}
      </AnimatePresence>

      {/* Pending cross-chain recovery notice */}
      {!isHub && pendingReqId && mintRequestData && (
        <div className="mb-6 rounded-xl border border-chart-4/30 bg-chart-4/5 p-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-chart-4"></div>
            <p className="text-sm font-semibold text-foreground">
              Finish your pending mint
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            A previous LayerZero transfer is still processing. Complete or
            cancel it before starting a new one.
          </p>
          <button
            onClick={() => setStatus(MintStatus.INFLIGHT)}
            className="mt-3 text-xs font-semibold text-chart-4 transition-colors hover:text-chart-4/80"
          >
            Check status
          </button>
        </div>
      )}

      {/* Chain Selection Dropdown */}
      <div className="mb-3 text-left">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold tracking-tight text-foreground focus:outline-none"
        >
          Network
        </h2>
      </div>

      <div className="relative mb-6">
        <button
          aria-haspopup="listbox"
          aria-expanded={chainDropdownOpen}
          aria-controls="chain-dropdown"
          role="combobox"
          onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 shadow-sm transition-all hover:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:scale-[0.98] sm:py-4"
        >
          <div className="flex items-center gap-3">
            {activeConfig && getChainIcon(activeConfig.key) && (
              <figure className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src={getChainIcon(activeConfig.key)!}
                  alt={activeConfig.label}
                  width={24}
                  height={24}
                  className="object-cover"
                />
              </figure>
            )}
            <span className="truncate text-base font-medium text-foreground">
              {activeConfig?.label ?? 'Select chain'}
            </span>
          </div>
          <ChevronDown
            size={18}
            className={`text-muted-foreground transition-transform duration-200 ${chainDropdownOpen ? 'rotate-180' : ''}`}
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
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg"
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
                    className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors focus:bg-muted/30 focus:outline-none ${
                      isActive ? 'bg-muted/50' : 'hover:bg-muted/30'
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
                      <span
                        className={`truncate text-base font-medium ${isActive ? 'font-semibold text-primary' : 'text-foreground'}`}
                      >
                        {chain.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary shadow-sm" />
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
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-left">
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
              <p className="text-sm font-medium text-foreground">
                Network switch failed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Switch to{' '}
                <span className="font-semibold text-foreground">
                  {activeConfig?.label}
                </span>{' '}
                in your wallet or try again.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Methods */}
      <div className="mb-3 text-left">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Token
        </h3>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {isLoadingState ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-background p-3 sm:p-4"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-muted sm:h-10 sm:w-10" />
                <div className="flex flex-col gap-2 text-left">
                  <Skeleton className="h-4 w-16 rounded bg-muted sm:w-20" />
                  <Skeleton className="h-3 w-12 rounded bg-muted sm:w-16" />
                </div>
              </div>
              <div className="text-right">
                <Skeleton className="h-5 w-20 rounded bg-muted sm:w-24" />
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
          <div className="py-6 text-center text-sm font-medium text-muted-foreground">
            Tokens not available on{' '}
            {activeConfig?.label ?? `Chain ID: ${activeChainId}`}
          </div>
        )}
      </div>

      {/* Referral indicator (auto-applied from login) */}
      {globalReferralCode && (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <svg
            className="h-4 w-4 text-chart-2"
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
            <span className="max-w-50 truncate font-mono font-medium text-foreground">
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
