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

type MintPhase =
  | 'idle'
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

  // ───────────── Compute msg.value ─────────────
  // LZ fee is covered by the contract.
  // Only send the price when paying with native ETH; send 0 for ERC20.
  const msgValue = useMemo(() => {
    if (!isNative) return ZERO
    return priceBigInt
  }, [isNative, priceBigInt])

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

  // ───────────── Derive Phase ─────────────
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
  ])

  // ───────────── Watchdog: catch stuck INFLIGHT → MINTING transition ─────────────
  useEffect(() => {
    if (phase === 'inflight' && lzStatus === 'DELIVERED') {
      setPhase('minting')
    }
  }, [phase, lzStatus])

  // ───────────── Auto-advance MINTING → SUCCESS ─────────────
  useEffect(() => {
    if (phase !== 'minting') return

    const timer = setTimeout(() => {
      setPhase('success')
    }, 4_000)

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
    writeMint({
      chainId,
      address: targetContract,
      abi: abi as any,
      functionName: 'mint',
      args: [tokenAddress, referralCode || ''],
      value: msgValue,
    })
  }, [
    userAddress,
    targetContract,
    priceBigInt,
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

  // Auto-mint after approval succeeds
  useEffect(() => {
    if (approveIsSuccess && !mintHash && !abortRef.current) {
      writeMint({
        chainId,
        address: targetContract,
        abi: abi as any,
        functionName: 'mint',
        args: [tokenAddress, referralCode || ''],
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
    (isNative || tokenDecimals !== undefined)

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

    // Flags
    needsApproval,
    isNative,
    tokenDecimals,
    priceBigInt,
    msgValue,
  }
}
