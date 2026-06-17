import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { useUser } from '@/hooks/useUser'
import { getAppliedReferralCode } from '@/actions/referral'
import { useLayerZeroScan } from '@/hooks/useLayerZeroScan'
import { MintStatus } from '@/enums/mint.enum'
import { Hex } from 'viem'

// ── Background Mint (persists across page navigations) ──

export type BackgroundMint = {
  status: MintStatus
  sourceHash: Hex | null
  explorerUrl: string | null
  dstTxHash: string | null
  reqId: Hex | null
  isCrossChain: boolean
  errorMessage: string | null
} | null

type AppContextType = {
  activeIdx: number | undefined
  setActiveIdx: Dispatch<SetStateAction<number | undefined>>
  referralCode: string | null
  isReferralLoading: boolean
  // Background mint (lives here so it survives mint page unmount)
  backgroundMint: BackgroundMint
  setBackgroundMint: (bg: BackgroundMint) => void
  clearBackgroundMint: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | undefined>(undefined)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralFetchDone, setReferralFetchDone] = useState(false)
  const [backgroundMint, setBackgroundMint] = useState<BackgroundMint>(null)

  const { isLoggedIn, hasReferral } = useUser()

  const shouldFetch = isLoggedIn && hasReferral
  const [prevShouldFetch, setPrevShouldFetch] = useState(shouldFetch)

  // Reset the fetch-done flag when the user logs out so loading shows again on re-login.
  // React "derived state during render" — batched into the same commit, no extra renders.
  if (prevShouldFetch !== shouldFetch) {
    setPrevShouldFetch(shouldFetch)
    if (!shouldFetch) setReferralFetchDone(false)
  }

  const isReferralLoading = shouldFetch && !referralFetchDone

  // ── Background LZ polling (persists even when /mint is unmounted) ──
  const bgSourceHash = backgroundMint?.isCrossChain
    ? backgroundMint.sourceHash
    : null
  const { lzStatus: bgLzStatus, dstTxHash: bgDstTxHash } = useLayerZeroScan(
    bgSourceHash ?? undefined,
  )

  // Derive final status from LZ scan — no state write needed; useMemo is pure
  const effectiveBackgroundMint = useMemo<BackgroundMint>(() => {
    if (!backgroundMint || !bgSourceHash) return backgroundMint
    if (bgLzStatus === 'DELIVERED') {
      return {
        ...backgroundMint,
        status: MintStatus.SUCCESS,
        dstTxHash: bgDstTxHash,
      }
    }
    if (bgLzStatus === 'FAILED' || bgLzStatus === 'PAYLOAD_STORED') {
      return {
        ...backgroundMint,
        status: MintStatus.FAILED,
        errorMessage:
          'Cross-chain delivery failed. You can retry or claim a refund.',
      }
    }
    return backgroundMint
  }, [backgroundMint, bgLzStatus, bgDstTxHash, bgSourceHash])

  const clearBackgroundMint = useCallback(() => {
    setBackgroundMint(null)
  }, [])

  // ── Referral fetch ──
  useEffect(() => {
    if (!shouldFetch) return

    let cancelled = false

    getAppliedReferralCode()
      .then((result) => {
        if (!cancelled && result.success && result.code) {
          setReferralCode(result.code)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReferralFetchDone(true)
      })

    return () => {
      cancelled = true
    }
  }, [shouldFetch])

  // Referral code is only valid while the user is logged in with a referral.
  // Derive null instead of syncing setReferralCode(null) through an effect.
  const effectiveReferralCode = isLoggedIn && hasReferral ? referralCode : null

  return (
    <AppContext.Provider
      value={{
        activeIdx,
        setActiveIdx,
        referralCode: effectiveReferralCode,
        isReferralLoading,
        backgroundMint: effectiveBackgroundMint,
        setBackgroundMint,
        clearBackgroundMint,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useAppCtx = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppCtx must be used within an AppProvider')
  }
  return context
}
