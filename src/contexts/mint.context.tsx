import React, { createContext, useState, useContext, useCallback } from 'react'
import { MintStatus } from '../enums/mint.enum'
import { Token } from '@/constants/contracts/tsb'
import { Address, Hex } from 'viem'
import { useAppCtx, BackgroundMint } from './app.context'

type MintContextType = {
  // Payment
  paymentMethod: Token | null
  setPaymentMethod: (t: Token | null) => void

  // Chain selection
  selectedChainId: number | null
  setSelectedChainId: (id: number | null) => void

  // Contract
  targetContract: Address | null
  setTargetContract: (a: Address | null) => void

  // Flow status
  status: MintStatus
  setStatus: (s: MintStatus) => void

  // Referral (kept for tx data, but no longer user-input)
  referralCode: string
  setReferralCode: (c: string) => void

  // Transaction hashes
  sourceHash: Hex | null
  setSourceHash: (h: Hex | null) => void
  explorerUrl: string | null
  setExplorerUrl: (u: string | null) => void

  // Cross-chain (Satellite only)
  reqId: Hex | null
  setReqId: (id: Hex | null) => void
  isCrossChain: boolean
  setIsCrossChain: (v: boolean) => void
  dstTxHash: string | null
  setDstTxHash: (h: string | null) => void

  // Error
  errorMessage: string | null
  setErrorMessage: (m: string | null) => void

  // Deprecated alias for backward compat
  hash: string | null
  setHash: (h: string | null) => void

  // Background mint (delegates to AppContext)
  backgroundMint: BackgroundMint
  moveToBackground: () => void
  restoreFromBackground: () => void

  // Reset
  reset: () => void
}

const MintContext = createContext<MintContextType | undefined>(undefined)

export const MintProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<Token | null>(null)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)
  const [targetContract, setTargetContract] = useState<Address | null>(null)
  const [status, setStatus] = useState<MintStatus>(MintStatus.HOME)
  const [referralCode, setReferralCode] = useState<string>('')
  const [sourceHash, setSourceHash] = useState<Hex | null>(null)
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null)
  const [reqId, setReqId] = useState<Hex | null>(null)
  const [isCrossChain, setIsCrossChain] = useState(false)
  const [dstTxHash, setDstTxHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Background mint lives in AppContext (survives page navigation)
  const { backgroundMint, setBackgroundMint, clearBackgroundMint } = useAppCtx()

  const moveToBackground = useCallback(() => {
    setBackgroundMint({
      status,
      sourceHash,
      explorerUrl,
      dstTxHash,
      reqId,
      isCrossChain,
      errorMessage,
    })
    // Reset local state back to home
    setStatus(MintStatus.HOME)
    setSourceHash(null)
    setExplorerUrl(null)
    setDstTxHash(null)
    setReqId(null)
    setIsCrossChain(false)
    setErrorMessage(null)
  }, [
    status,
    sourceHash,
    explorerUrl,
    dstTxHash,
    reqId,
    isCrossChain,
    errorMessage,
    setBackgroundMint,
  ])

  const restoreFromBackground = useCallback(() => {
    if (!backgroundMint) return
    setStatus(backgroundMint.status)
    setSourceHash(backgroundMint.sourceHash)
    setExplorerUrl(backgroundMint.explorerUrl)
    setDstTxHash(backgroundMint.dstTxHash)
    setReqId(backgroundMint.reqId)
    setIsCrossChain(backgroundMint.isCrossChain)
    setErrorMessage(backgroundMint.errorMessage)
    clearBackgroundMint()
  }, [backgroundMint, clearBackgroundMint])

  const reset = useCallback(() => {
    setPaymentMethod(null)
    setTargetContract(null)
    setStatus(MintStatus.HOME)
    setReferralCode('')
    setSourceHash(null)
    setExplorerUrl(null)
    setReqId(null)
    setIsCrossChain(false)
    setDstTxHash(null)
    setErrorMessage(null)
  }, [])

  return (
    <MintContext.Provider
      value={{
        paymentMethod,
        setPaymentMethod,
        selectedChainId,
        setSelectedChainId,
        targetContract,
        setTargetContract,
        status,
        setStatus,
        referralCode,
        setReferralCode,
        sourceHash,
        setSourceHash,
        explorerUrl,
        setExplorerUrl,
        reqId,
        setReqId,
        isCrossChain,
        setIsCrossChain,
        dstTxHash,
        setDstTxHash,
        errorMessage,
        setErrorMessage,
        // Backward compat
        hash: explorerUrl,
        setHash: setExplorerUrl,
        // Background mint (from AppContext)
        backgroundMint,
        moveToBackground,
        restoreFromBackground,
        reset,
      }}
    >
      {children}
    </MintContext.Provider>
  )
}

export const useMintCtx = () => {
  const context = useContext(MintContext)
  if (!context) {
    throw new Error('useMint must be used within a MintProvider')
  }
  return context
}
