'use client'

import { useEffect, useState } from 'react'
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

export default function SelectPaymentMethod() {
  const [localLoading, setLocalLoading] = useState<boolean>(true)
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const [paymentMethods, setPaymentMethods] = useState<Token[]>([])
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [switchChainError, setSwitchChainError] = useState<string | null>(null)
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

  const isLoadingState = isUserLoading || localLoading
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

  // Update payment methods when chain changes
  useEffect(() => {
    if (!isLoggedIn) {
      setLocalLoading(false)
      setPaymentMethods([])
      return
    }
    setLocalLoading(true)

    const methods = getPaymentMethods(activeChainId)
    setPaymentMethods(methods)
    setActiveIdx(0)

    const timer = setTimeout(() => {
      setLocalLoading(false)
    }, 300)

    return () => clearTimeout(timer)
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

  const onClickReview = () => {
    if (!isLoggedIn) return
    setReferralCode(globalReferralCode || '')
    setPaymentMethod(paymentMethods[activeIdx])
    setTargetContract(getContract(activeChainId)!)
    setIsCrossChain(!isHub)
    setStatus(MintStatus.REVIEW)
  }

  const skeletonCount = paymentMethods.length > 0 ? paymentMethods.length : 2

  const needsChainSwitch =
    selectedChainId !== null && selectedChainId !== walletChainId

  return (
    <>
      {/* Background mint toast */}
      {backgroundMint && (
        <button
          onClick={restoreFromBackground}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left transition-colors hover:bg-blue-100"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
            {backgroundMint.status === MintStatus.SUCCESS ? (
              <div className="h-3 w-3 rounded-full bg-green-500" />
            ) : backgroundMint.status === MintStatus.FAILED ? (
              <div className="h-3 w-3 rounded-full bg-red-500" />
            ) : (
              <div className="h-3 w-3 animate-pulse rounded-full bg-blue-500" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              {backgroundMint.status === MintStatus.SUCCESS
                ? 'Mint completed!'
                : backgroundMint.status === MintStatus.FAILED
                  ? 'Mint failed'
                  : 'Mint in progress'}
            </p>
            <p className="text-xs text-blue-700">
              Tap to view transaction status
            </p>
          </div>
          <svg
            className="h-4 w-4 text-blue-400"
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
        </button>
      )}

      {/* Pending cross-chain recovery notice */}
      {!isHub && pendingReqId && mintRequestData && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">
            You have a pending cross-chain mint
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Your previous mint is still being processed via LayerZero. You can
            wait for it to complete or expire it to get a refund.
          </p>
          <button
            onClick={() => setStatus(MintStatus.INFLIGHT)}
            className="mt-2 text-xs font-medium text-amber-900 underline"
          >
            View status
          </button>
        </div>
      )}

      {/* Chain Selection Dropdown */}
      <div className="mb-4 text-left">
        <h3 className="font-medium">Select Chain</h3>
        <p className="text-sm text-neutral-400">
          Choose which chain to mint on
        </p>
      </div>

      <div className="relative mb-4">
        <button
          onClick={() => setChainDropdownOpen(!chainDropdownOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 transition-all hover:border-gray-300"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {activeConfig?.label ?? 'Select chain'}
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${chainDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {chainDropdownOpen && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
            {enabledChains.map((chain) => {
              const isActive = chain.chainId === activeChainId

              return (
                <button
                  key={chain.key}
                  onClick={() => handleChainSelect(chain.chainId)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    isActive ? 'bg-primary-green/7' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {chain.label}
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary-green" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Chain switch error message */}
      {switchChainError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">
            Failed to switch chain
          </p>
          <p className="mt-1 text-xs text-red-600">
            Please switch to {activeConfig?.label} manually in your wallet, or
            try selecting again.
          </p>
        </div>
      )}

      {/* Payment Methods */}
      <div className="mb-4 text-left">
        <h3 className="font-medium">Payment methods</h3>
        <p className="text-sm text-neutral-400">
          Please select a payment method
        </p>
        {!isHub && (
          <p className="mt-1 text-xs text-neutral-400">
            Cross-chain mint via LayerZero (includes gas fee)
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-col gap-2 tablet:gap-4">
        {isLoadingState ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-2 tablet:p-3"
            >
              <div className="flex flex-1 flex-col items-start gap-1">
                <div className="flex items-center gap-2 tablet:gap-3">
                  <Skeleton className="size-6.25 shrink-0 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded" />
                </div>
              </div>
              <div className="flex flex-1 items-end justify-end gap-2">
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            </div>
          ))
        ) : paymentMethods.length > 0 ? (
          paymentMethods.map((item: Token, idx) => (
            <PaymentCard
              key={`${item.address}-${idx}`}
              item={item}
              isActive={activeIdx === idx}
              onClick={() => setActiveIdx(idx)}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed bg-gray-50 p-4 text-center text-sm text-gray-500">
            Not available on Chain ID: {activeChainId}
          </div>
        )}
      </div>

      {/* Referral indicator (auto-applied from login) */}
      {globalReferralCode && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5">
          <svg
            className="h-4 w-4 text-green-600"
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
          <span className="text-sm text-green-800">
            Referral{' '}
            <span className="font-mono font-medium tracking-wider">
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
          ? 'Loading...'
          : !isLoggedIn
            ? 'Connect Wallet'
            : hasBackgroundMint
              ? 'Mint in progress...'
              : needsChainSwitch
                ? 'Switching chain...'
                : !isHub && !!pendingReqId
                  ? 'Pending Mint Active'
                  : 'Mint'}
      </DefaultButton>
    </>
  )
}
