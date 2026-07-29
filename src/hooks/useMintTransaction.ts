import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
  useSwitchChain,
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
import { humanizeError } from '@/utils/humanize-error.util'
import { reportUnexpected } from '@/lib/telemetry'
import { tsbSatelliteABI } from '@/constants/abis/tsbSatellite.abi'
import { useLayerZeroScan } from './useLayerZeroScan'
import { useLayerZeroFeeQuote } from './useLayerZeroFeeQuote'

const ZERO = BigInt(0)

type MintPhase =
  | 'idle'
  | 'switching-chain'
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
  // Pre-seed the tx hash when resuming after a remount (e.g. restore from
  // background). Lets receipt watching and LZ polling pick up where they
  // left off without requiring a new writeContract call.
  initialHash?: Hex | null
}

export function useMintTransaction({
  tokenAddress,
  price,
  referralCode,
  targetContract,
  chainId,
  initialHash,
}: UseMintTransactionProps) {
  const { address: userAddress, chainId: walletChainId } = useConnection()
  const { mutateAsync: switchChainAsync } = useSwitchChain()
  const isHub = isHubChain(chainId)
  const abi = getAbi(chainId)

  // Only holds phases that wagmi state can't represent on its own:
  // 'switching-chain', 'error' (chain-switch fail), 'success' (after 4 s timer), 'idle' (reset)
  // null = let wagmi state drive the derived phase below
  const [imperativePhase, setImperativePhase] = useState<MintPhase | null>(null)
  // Manual error string only for the chain-switch failure path
  const [manualError, setManualError] = useState<string | null>(null)

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

  // ───────────── LayerZero Fee Quote (Satellite only) ─────────────
  const { bufferedFee: bufferedLzFee, isLoaded: isLzFeeLoaded } =
    useLayerZeroFeeQuote({
      isHub,
      targetContract,
      chainId,
      userAddress,
      referralCode,
    })

  // ───────────── Compute msg.value ─────────────
  // Hub: native pays exactly the price (no LZ round-trip); ERC20 pays 0.
  // Satellite: the LZ fee is always paid in native currency, on top of the
  // price when paying native, or by itself when paying ERC20 (spec §5).
  const msgValue = useMemo(() => {
    if (isHub) return isNative ? priceBigInt : ZERO
    return isNative ? priceBigInt + bufferedLzFee : bufferedLzFee
  }, [isHub, isNative, priceBigInt, bufferedLzFee])

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

  // Prefer the live wagmi hash; fall back to initialHash when resuming after
  // a remount (e.g. restore-from-background). This re-enables receipt watching
  // and LZ polling without a new on-chain write.
  const effectiveMintHash = mintHash ?? initialHash ?? undefined

  const mintReceipt = useWaitForTransactionReceipt({
    hash: effectiveMintHash,
    query: { enabled: !!effectiveMintHash },
  })

  // ───────────── LZ Scan (Satellite cross-chain tracking) ─────────────
  const isSourceConfirmed = !isHub && mintReceipt.isSuccess
  const { lzStatus, dstTxHash } = useLayerZeroScan(
    isSourceConfirmed ? effectiveMintHash : undefined,
  )

  // ───────────── Extract events from mint receipt ─────────────
  // Hub: look for MintSuccess event as truth check
  // Satellite: look for MintRequestSent (for reqId tracking)
  // Purely derived from receipt data — no setState needed.
  const { mintConfirmedByEvent, reqId } = useMemo(() => {
    if (!mintReceipt.data)
      return { mintConfirmedByEvent: false, reqId: null as Hex | null }
    const currentAbi = isHub ? abi : tsbSatelliteABI
    let mintConfirmedByEvent = false
    let reqId: Hex | null = null
    try {
      for (const log of mintReceipt.data.logs) {
        try {
          const decoded: any = decodeEventLog({
            abi: currentAbi as any,
            data: log.data,
            topics: log.topics,
          })
          if (decoded.eventName === 'MintSuccess') mintConfirmedByEvent = true
          if (!isHub && decoded.eventName === 'MintRequestSent')
            reqId = decoded.args.reqId
        } catch {
          // Not every log matches our ABI
        }
      }
    } catch {
      // Ignore decode failures
    }
    return { mintConfirmedByEvent, reqId }
  }, [mintReceipt.data, isHub, abi])

  // ───────────── Derive Phase ─────────────
  const approveIsLoading = approveReceipt.isLoading
  const approveIsSuccess = approveReceipt.isSuccess
  const approveError = approveReceipt.error
  const mintIsLoading = mintReceipt.isLoading
  const mintIsSuccess = mintReceipt.isSuccess
  const mintError = mintReceipt.error

  // Replaces the old derive-phase effect + watchdog effect.
  // imperativePhase takes precedence for transitions wagmi state can't represent.
  const phase = useMemo((): MintPhase => {
    if (imperativePhase === 'idle') return 'idle'
    if (imperativePhase === 'switching-chain') return 'switching-chain'
    if (imperativePhase === 'error') return 'error'
    if (imperativePhase === 'success') return 'success'

    const anyError =
      approveWriteError || mintWriteError || approveError || mintError
    if (anyError) return 'error'
    if (isApproveSigning) return 'signing-approve'
    if (isMintSigning) return 'signing'
    if (approveIsLoading || (approveIsSuccess && !mintHash && !isMintSigning))
      return 'approving'
    if (mintIsLoading) return 'mining'
    if (isHub && (mintIsSuccess || mintConfirmedByEvent)) return 'success'
    if (!isHub && mintIsSuccess) {
      if (lzStatus === 'DELIVERED') return 'minting'
      if (lzStatus === 'FAILED' || lzStatus === 'PAYLOAD_STORED') return 'error'
      return 'inflight'
    }
    return 'idle'
  }, [
    imperativePhase,
    approveWriteError,
    mintWriteError,
    approveError,
    mintError,
    isApproveSigning,
    isMintSigning,
    approveIsLoading,
    approveIsSuccess,
    mintHash,
    mintIsLoading,
    mintIsSuccess,
    isHub,
    mintConfirmedByEvent,
    lzStatus,
  ])

  const errorMsg = useMemo((): string | null => {
    if (manualError) return manualError
    const anyError =
      approveWriteError || mintWriteError || approveError || mintError
    if (anyError) return humanizeError(anyError)
    if (
      !isHub &&
      mintIsSuccess &&
      (lzStatus === 'FAILED' || lzStatus === 'PAYLOAD_STORED')
    ) {
      return 'Cross-chain delivery failed. You can retry or claim a refund.'
    }
    return null
  }, [
    manualError,
    approveWriteError,
    mintWriteError,
    approveError,
    mintError,
    isHub,
    mintIsSuccess,
    lzStatus,
  ])

  // ───────────── Auto-advance MINTING → SUCCESS ─────────────
  useEffect(() => {
    if (phase !== 'minting') return

    const timer = setTimeout(() => {
      setImperativePhase('success')
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
  const execute = useCallback(async () => {
    if (!userAddress || !targetContract || priceBigInt < ZERO) return

    abortRef.current = false
    setManualError(null)
    setImperativePhase(null) // hand control back to wagmi-derived phase

    if (walletChainId !== chainId) {
      try {
        setImperativePhase('switching-chain')
        await switchChainAsync({ chainId })
        setImperativePhase(null) // chain switched — let derivation take over
      } catch (err: unknown) {
        reportUnexpected(err, { flow: 'mint-switch-chain', chainId })
        setImperativePhase('error')
        setManualError(humanizeError(err))
        return
      }
      if (abortRef.current) return

      // After switching, `needsApproval` in this closure reflects the allowance
      // fetched before the switch (possibly undefined if wallet was on the wrong
      // chain). Re-fetch immediately and use the fresh value to decide whether
      // to approve, so we don't skip the approve step on the new chain.
      if (!isNative) {
        const { data: freshAllowance } = await refetchAllowance()
        if (abortRef.current) return
        if (freshAllowance !== undefined && freshAllowance < priceBigInt) {
          writeApprove({
            chainId,
            address: tokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [targetContract, priceBigInt],
          })
          return
        }
        // Fresh allowance sufficient — skip straight to mint below.
      }
    }

    // Step 1: Approve if needed (wallet was already on the correct chain)
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
    walletChainId,
    chainId,
    switchChainAsync,
    refetchAllowance,
    needsApproval,
    isNative,
    tokenAddress,
    referralCode,
    abi,
    msgValue,
    writeApprove,
    writeMint,
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
    setImperativePhase('idle')
    setManualError(null)
    resetApprove()
    resetMint()
  }, [resetApprove, resetMint])

  const explorerUrl = useMemo(() => {
    const baseUrl = getExplorerUrl(chainId)
    if (!baseUrl) return null
    if (effectiveMintHash) return `${baseUrl}${effectiveMintHash}`
    return null
  }, [chainId, effectiveMintHash])

  const isReady =
    !!userAddress &&
    !!targetContract &&
    priceBigInt >= ZERO &&
    (isNative || tokenDecimals !== undefined) &&
    isLzFeeLoaded

  return {
    execute,
    reset,
    phase,
    errorMsg,
    isReady,

    // Hashes
    sourceHash: effectiveMintHash || null,
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
    lzFee: bufferedLzFee,
  }
}
