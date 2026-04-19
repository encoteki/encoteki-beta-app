import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
} from 'wagmi'
import {
  Address,
  erc20Abi,
  zeroAddress,
  parseUnits,
  isAddressEqual,
  Hex,
  decodeEventLog,
} from 'viem'
import { getAbi, getExplorerUrl, isHubChain } from '@/constants/contracts/tsb'
import { tsbSatelliteABI } from '@/constants/abis/tsbSatellite.abi'
import { useLayerZeroScan } from './useLayerZeroScan'

const ZERO = BigInt(0)
const TEN = BigInt(10)

type MintPhase =
  | 'idle'
  | 'quoting'
  | 'signing-approve'
  | 'approving'
  | 'signing'
  | 'mining'
  | 'inflight'
  | 'minting'
  | 'success'
  | 'error'

interface UseMintTransactionProps {
  tokenAddress: Address
  price: string
  referralCode?: string
  targetContract: Address
  chainId: number
}

export function useMintTransaction({
  tokenAddress,
  price,
  referralCode,
  targetContract,
  chainId,
}: UseMintTransactionProps) {
  const { address: userAddress } = useConnection()
  const isHub = isHubChain(chainId)
  const abi = getAbi(chainId)

  const [phase, setPhase] = useState<MintPhase>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reqId, setReqId] = useState<Hex | null>(null)
  const [mintConfirmedByEvent, setMintConfirmedByEvent] = useState(false)

  const abortRef = useRef(false)

  // ───────────── Token Decimals ─────────────
  const isNative = useMemo(
    () => isAddressEqual(tokenAddress, zeroAddress),
    [tokenAddress],
  )

  const { data: tokenDecimals } = useReadContract({
    chainId,
    address: isNative ? undefined : tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !isNative, staleTime: Infinity },
  })

  const priceBigInt = useMemo(() => {
    try {
      if (!price) return ZERO
      if (isNative) return parseUnits(price, 18)
      if (tokenDecimals === undefined) return ZERO
      return parseUnits(price, tokenDecimals)
    } catch {
      return ZERO
    }
  }, [price, isNative, tokenDecimals])

  // ───────────── LZ Fee Quote (Satellite only) ─────────────
  const {
    data: lzFeeQuote,
    isLoading: isQuotingLzFee,
    isFetching: isFetchingLzFee,
    error: quoteError,
  } = useReadContract({
    chainId,
    address: !isHub ? targetContract : undefined,
    abi: tsbSatelliteABI as any,
    functionName: 'quoteLayerZeroFee',
    args: [userAddress as Address, referralCode || ''],
    query: {
      enabled: !isHub && !!userAddress && !!targetContract,
      refetchInterval: 30_000,
    },
  })

  useEffect(() => {
    if (quoteError) {
      console.error('LZ Quote Error:', quoteError)
    }
  }, [quoteError])

  const lzFee = useMemo(() => {
    if (isHub || lzFeeQuote === undefined) return ZERO
    // Add 10% buffer for gas fluctuations
    const fee = lzFeeQuote as bigint
    return fee + fee / TEN
  }, [isHub, lzFeeQuote])

  // ───────────── Allowance Check (ERC20 only) ─────────────
  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      chainId,
      address: isNative ? undefined : tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [userAddress as Address, targetContract],
      query: { enabled: !isNative && !!userAddress && !!targetContract },
    },
  )

  const needsApproval = useMemo(() => {
    if (isNative || priceBigInt === ZERO || currentAllowance === undefined)
      return false
    return currentAllowance < priceBigInt
  }, [isNative, currentAllowance, priceBigInt])

  // ───────────── Approve TX ─────────────
  const {
    mutate: writeApprove,
    data: approveHash,
    isPending: isApproveSigning,
    error: approveWriteError,
    reset: resetApprove,
  } = useWriteContract()

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { enabled: !!approveHash },
  })

  // ───────────── Mint TX ─────────────
  const {
    mutate: writeMint,
    data: mintHash,
    isPending: isMintSigning,
    error: mintWriteError,
    reset: resetMint,
  } = useWriteContract()

  const mintReceipt = useWaitForTransactionReceipt({
    hash: mintHash,
    query: { enabled: !!mintHash },
  })

  // ───────────── LZ Scan (Satellite cross-chain tracking) ─────────────
  const isSourceConfirmed = !isHub && mintReceipt.isSuccess
  const { lzStatus, dstTxHash } = useLayerZeroScan(
    isSourceConfirmed ? mintHash : undefined,
  )

  // ───────────── Extract events from mint receipt ─────────────
  // Hub: look for MintSuccess event as truth check
  // Satellite: look for MintRequestSent (for reqId tracking)
  useEffect(() => {
    if (!mintReceipt.data) return

    const currentAbi = isHub ? abi : tsbSatelliteABI

    try {
      for (const log of mintReceipt.data.logs) {
        try {
          const decoded: any = decodeEventLog({
            abi: currentAbi as any,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === 'MintSuccess') {
            setMintConfirmedByEvent(true)
          }

          if (!isHub && decoded.eventName === 'MintRequestSent') {
            setReqId(decoded.args.reqId)
          }
        } catch {
          // Not every log matches our ABI
        }
      }
    } catch {
      // Ignore decode failures
    }
  }, [mintReceipt.data, isHub, abi])

  // ───────────── Compute msg.value ─────────────
  // Gas is covered by the contract; only send price when paying with native ETH
  const msgValue = useMemo(() => {
    let val = ZERO
    if (isNative) val += priceBigInt
    if (!isHub && lzFee > ZERO) val += lzFee
    return val
  }, [isNative, priceBigInt, isHub, lzFee])

  // ───────────── Derive Phase ─────────────
  // Use primitive values as deps to ensure proper re-renders
  const approveIsLoading = approveReceipt.isLoading
  const approveIsSuccess = approveReceipt.isSuccess
  const approveError = approveReceipt.error
  const mintIsLoading = mintReceipt.isLoading
  const mintIsSuccess = mintReceipt.isSuccess
  const mintError = mintReceipt.error

  useEffect(() => {
    if (abortRef.current) return

    const anyError =
      approveWriteError || mintWriteError || approveError || mintError

    if (anyError) {
      setPhase('error')
      const err = anyError as any
      setErrorMsg(
        err?.shortMessage ||
          err?.message?.slice(0, 120) ||
          'Transaction failed',
      )
      return
    }

    // Show quoting phase for cross-chain mints
    if (!isHub && (isQuotingLzFee || isFetchingLzFee) && phase === 'idle') {
      setPhase('quoting')
      return
    }

    if (isApproveSigning) {
      setPhase('signing-approve')
      return
    }
    if (isMintSigning) {
      setPhase('signing')
      return
    }
    if (approveIsLoading) {
      setPhase('approving')
      return
    }
    if (mintIsLoading) {
      setPhase('mining')
      return
    }

    // Hub success — no LayerZero needed
    // Use both receipt success AND MintSuccess event as truth checks
    if (isHub && (mintIsSuccess || mintConfirmedByEvent)) {
      setPhase('success')
      return
    }

    // Satellite: source confirmed → track LZ
    if (!isHub && mintIsSuccess) {
      if (lzStatus === 'DELIVERED') {
        setPhase('minting')
      } else if (lzStatus === 'FAILED' || lzStatus === 'PAYLOAD_STORED') {
        setPhase('error')
        setErrorMsg(
          'Cross-chain delivery failed. You can retry or claim a refund.',
        )
      } else {
        setPhase('inflight')
      }
      return
    }
  }, [
    approveWriteError,
    mintWriteError,
    approveError,
    mintError,
    approveIsLoading,
    approveIsSuccess,
    mintIsLoading,
    mintIsSuccess,
    isApproveSigning,
    isMintSigning,
    isHub,
    lzStatus,
    mintConfirmedByEvent,
    isQuotingLzFee,
    isFetchingLzFee,
    phase,
  ])

  // ───────────── Watchdog: catch stuck INFLIGHT → MINTING transition ─────────────
  // If the main effect above misses the lzStatus change, this dedicated
  // effect guarantees the phase advances when LZ reports DELIVERED.
  useEffect(() => {
    if (phase === 'inflight' && lzStatus === 'DELIVERED') {
      setPhase('minting')
    }
  }, [phase, lzStatus])

  // ───────────── Auto-advance MINTING → SUCCESS ─────────────
  // LZ "DELIVERED" already means the destination TX was executed and
  // confirmed on-chain.  Show the "Minting" step for a few seconds
  // so the user sees the progress, then transition to success.
  useEffect(() => {
    if (phase !== 'minting') return

    const timer = setTimeout(() => {
      setPhase('success')
    }, 4_000) // 4 seconds visual dwell

    return () => clearTimeout(timer)
  }, [phase])

  // ───────────── Auto-refetch allowance after approval ─────────────
  useEffect(() => {
    if (approveIsSuccess) {
      refetchAllowance()
    }
  }, [approveIsSuccess, refetchAllowance])

  // ───────────── Execute ─────────────
  const execute = useCallback(() => {
    if (!userAddress || !targetContract || priceBigInt < ZERO) return
    if (!isHub && lzFee < ZERO) return

    abortRef.current = false
    setErrorMsg(null)

    // Step 1: Approve if needed
    if (needsApproval && !isNative) {
      writeApprove({
        chainId,
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [targetContract, priceBigInt],
      })
      return
    }

    // Step 2: Mint
    const functionName = 'mint'
    const args = [tokenAddress, referralCode || '']

    writeMint({
      chainId,
      address: targetContract,
      abi: abi as any,
      functionName,
      args,
      value: msgValue,
    })
  }, [
    userAddress,
    targetContract,
    priceBigInt,
    isHub,
    lzFee,
    needsApproval,
    isNative,
    tokenAddress,
    referralCode,
    abi,
    msgValue,
    writeApprove,
    writeMint,
    chainId,
  ])

  // Auto-mint after approval succeeds — approval being mined is sufficient proof,
  // no need to wait for the allowance refetch to reflect the new balance.
  useEffect(() => {
    if (approveIsSuccess && !mintHash && !abortRef.current) {
      const functionName = 'mint'
      const args = [tokenAddress, referralCode || '']

      writeMint({
        chainId,
        address: targetContract,
        abi: abi as any,
        functionName,
        args,
        value: msgValue,
      })
    }
  }, [
    approveIsSuccess,
    mintHash,
    tokenAddress,
    referralCode,
    targetContract,
    abi,
    msgValue,
    writeMint,
    chainId,
  ])

  const reset = useCallback(() => {
    abortRef.current = true
    setPhase('idle')
    setErrorMsg(null)
    setReqId(null)
    setMintConfirmedByEvent(false)
    resetApprove()
    resetMint()
  }, [resetApprove, resetMint])

  const explorerUrl = useMemo(() => {
    const baseUrl = getExplorerUrl(chainId)
    if (!baseUrl) return null
    if (mintHash) return `${baseUrl}${mintHash}`
    return null
  }, [chainId, mintHash])

  const isReady =
    !!userAddress &&
    !!targetContract &&
    priceBigInt >= ZERO &&
    (isNative || tokenDecimals !== undefined) &&
    (isHub || (lzFee >= ZERO && !isQuotingLzFee && !isFetchingLzFee))

  return {
    execute,
    reset,
    phase,
    errorMsg,
    isReady,

    // Hashes
    sourceHash: mintHash || null,
    dstTxHash,
    explorerUrl,

    // Cross-chain
    isCrossChain: !isHub,
    reqId,
    lzStatus,
    lzFee,

    // Flags
    needsApproval,
    isNative,
    tokenDecimals,
    priceBigInt,
    msgValue,
    isQuotingLzFee: !isHub && (isQuotingLzFee || isFetchingLzFee),
  }
}
