import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
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
  const [isReferralLoading, setIsReferralLoading] = useState(false)
  const [backgroundMint, setBackgroundMint] = useState<BackgroundMint>(null)

  const { isLoggedIn, hasReferral } = useUser()

  // ── Background LZ polling (persists even when /mint is unmounted) ──
  const bgSourceHash = backgroundMint?.isCrossChain
    ? backgroundMint.sourceHash
    : null
  const { lzStatus: bgLzStatus, dstTxHash: bgDstTxHash } = useLayerZeroScan(
    bgSourceHash ?? undefined,
  )

  useEffect(() => {
    if (!backgroundMint || !bgSourceHash) return

    if (bgLzStatus === 'DELIVERED') {
      setBackgroundMint((prev) =>
        prev
          ? { ...prev, status: MintStatus.SUCCESS, dstTxHash: bgDstTxHash }
          : null,
      )
    } else if (bgLzStatus === 'FAILED' || bgLzStatus === 'PAYLOAD_STORED') {
      setBackgroundMint((prev) =>
        prev
          ? {
              ...prev,
              status: MintStatus.FAILED,
              errorMessage:
                'Cross-chain delivery failed. You can retry or claim a refund.',
            }
          : null,
      )
    }
  }, [bgLzStatus, bgDstTxHash, bgSourceHash, backgroundMint])

  const clearBackgroundMint = useCallback(() => {
    setBackgroundMint(null)
  }, [])

  // ── Referral fetch ──
  useEffect(() => {
    if (!isLoggedIn || !hasReferral) {
      setReferralCode(null)
      return
    }

    let cancelled = false
    setIsReferralLoading(true)

    getAppliedReferralCode()
      .then((result) => {
        if (!cancelled && result.success && result.code) {
          setReferralCode(result.code)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsReferralLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, hasReferral])

  return (
    <AppContext.Provider
      value={{
        activeIdx,
        setActiveIdx,
        referralCode,
        isReferralLoading,
        backgroundMint,
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
