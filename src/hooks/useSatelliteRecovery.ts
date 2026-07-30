import { useCallback, useMemo } from 'react'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConnection,
  useChainId,
} from 'wagmi'
import { Address, Hex, decodeEventLog } from 'viem'
import { tsbSatelliteABI } from '@/constants/abis/tsbSatellite.abi'
import { getContract } from '@/constants/contracts/tsb'
import { useLayerZeroFeeQuote } from './useLayerZeroFeeQuote'

const ZERO_BYTES32: Hex = `0x${'0'.repeat(64)}`

/**
 * @param explicitReqId  When known (e.g. a recovery panel for one specific
 *   mint), pass it so all reads/actions target that exact request. Without
 *   it, falls back to the wallet's current pendingMintRequest pointer — used
 *   by the "you have a pending mint" banner, which doesn't know a reqId yet.
 *   The pointer only ever tracks whichever request is PENDING, so it's the
 *   wrong source once a request has already moved to FAILED — always prefer
 *   the explicit form once a reqId is known.
 */
export function useSatelliteRecovery(explicitReqId?: Hex) {
  const { address } = useConnection()
  const chainId = useChainId()
  const contract = getContract(chainId)

  // Check if the wallet has a pending mint on this chain
  const { data: pendingReqId, refetch: refetchPending } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'pendingMintRequest',
    args: [address as Address],
    query: { enabled: !explicitReqId && !!address && !!contract },
  })

  // Read MINT_TIMEOUT for UX display
  const { data: mintTimeout } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'MINT_TIMEOUT',
    query: { enabled: !!contract },
  })

  const hasPending = !!pendingReqId && pendingReqId !== ZERO_BYTES32

  const targetReqId =
    explicitReqId ?? (hasPending ? (pendingReqId as Hex) : undefined)

  const { data: mintRequestData, refetch: refetchRequest } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'mintRequests',
    args: [targetReqId as Hex],
    query: { enabled: !!targetReqId && !!contract },
  })

  // MintRequest struct order (TSBEnums.sol / ITSBSatellite.sol):
  // [minter, status, timestamp, paymentToken, mintPrice, referralCode]
  const status = mintRequestData
    ? Number((mintRequestData as any)[1])
    : undefined

  // retryPendingMint() carries over the ORIGINAL request's referral code (the
  // caller doesn't submit a new one) — quote using that exact string, read
  // straight off the request being retried, so the LZ payload size matches
  // what will actually be re-sent.
  const originalReferralCode = mintRequestData
    ? ((mintRequestData as any)[5] as string)
    : undefined

  const { bufferedFee: retryFee, isLoaded: isRetryFeeLoaded } =
    useLayerZeroFeeQuote({
      isHub: false,
      targetContract: contract,
      chainId,
      userAddress: address,
      referralCode: originalReferralCode,
    })

  const {
    mutate: writeContract,
    data: txHash,
    isPending: isSigning,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  // retryPendingMint() succeeding mints nothing by itself — it just opens a
  // brand-new PENDING request. Decode its reqId from MintRequestSent so the
  // caller can resume tracking the new request instead of the old FAILED one.
  const newReqId = useMemo((): Hex | null => {
    if (!receipt.data) return null
    for (const log of receipt.data.logs) {
      try {
        const decoded: any = decodeEventLog({
          abi: tsbSatelliteABI as any,
          data: log.data,
          topics: log.topics,
        })
        if (decoded.eventName === 'MintRequestSent') return decoded.args.reqId
      } catch {
        // Not every log matches this ABI
      }
    }
    return null
  }, [receipt.data])

  const expirePendingMint = useCallback(
    (reqId: Hex) => {
      if (!contract) return
      writeContract({
        address: contract,
        abi: tsbSatelliteABI as any,
        functionName: 'expirePendingMint',
        args: [reqId],
      })
    },
    [contract, writeContract],
  )

  const claimRefund = useCallback(
    (reqId: Hex) => {
      if (!contract) return
      writeContract({
        address: contract,
        abi: tsbSatelliteABI as any,
        functionName: 'claimRefund',
        args: [reqId],
      })
    },
    [contract, writeContract],
  )

  const retryPendingMint = useCallback(
    (reqId: Hex) => {
      // Guard against firing before the fee quote lands — that would send
      // value: 0n and revert with TSBShared__InsufficientMsgValue.
      if (!contract || !isRetryFeeLoaded) return
      writeContract({
        address: contract,
        abi: tsbSatelliteABI as any,
        functionName: 'retryPendingMint',
        args: [reqId],
        value: retryFee,
      })
    },
    [contract, writeContract, retryFee, isRetryFeeLoaded],
  )

  return {
    // Pending state
    pendingReqId: hasPending ? (pendingReqId as Hex) : null,
    mintRequestData: mintRequestData as any,
    status,
    mintTimeout: mintTimeout ? Number(mintTimeout) : 1800, // default 30 min

    // Actions
    expirePendingMint,
    claimRefund,
    retryPendingMint,
    retryFee,
    isRetryFeeLoaded,
    newReqId,

    // TX state
    isSigning,
    isProcessing: receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: writeError || receipt.error,
    txHash,

    // Refresh
    refetchPending,
    refetchRequest,
    reset: resetWrite,
  }
}
