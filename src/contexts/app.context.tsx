import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useMemo,
  Dispatch,
  SetStateAction,
} from 'react'
import { useUser } from '@/hooks/useUser'
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
  const [backgroundMint, setBackgroundMint] = useState<BackgroundMint>(null)

  // refCode is fetched together with hasReferral as part of the same
  // POST /users/register call (see useUser) — no separate fetch/loading
  // state needed, it's already sitting in the SWR cache by the time
  // isLoggedIn && hasReferral is true.
  const { isLoggedIn, hasReferral, user } = useUser()
  const referralCode =
    isLoggedIn && hasReferral ? (user?.refCode ?? null) : null

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

  return (
    <AppContext.Provider
      value={{
        activeIdx,
        setActiveIdx,
        referralCode,
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
