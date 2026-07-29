import { useCallback } from 'react'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConnection,
  useChainId,
} from 'wagmi'
import { Address, Hex } from 'viem'
import { tsbSatelliteABI } from '@/constants/abis/tsbSatellite.abi'
import { getContract } from '@/constants/contracts/tsb'
import { useLayerZeroFeeQuote } from './useLayerZeroFeeQuote'

export function useSatelliteRecovery() {
  const { address } = useConnection()
  const chainId = useChainId()
  const contract = getContract(chainId)

  // Check if user has a pending mint
  const { data: pendingReqId, refetch: refetchPending } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'pendingMintRequest',
    args: [address as Address],
    query: { enabled: !!address && !!contract },
  })

  // Read MINT_TIMEOUT for UX display
  const { data: mintTimeout } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'MINT_TIMEOUT',
    query: { enabled: !!contract },
  })

  // Read mint request details if pending
  const hasPending =
    !!pendingReqId &&
    pendingReqId !==
      '0x0000000000000000000000000000000000000000000000000000000000000000'

  const { data: mintRequestData, refetch: refetchRequest } = useReadContract({
    address: contract,
    abi: tsbSatelliteABI as any,
    functionName: 'mintRequests',
    args: [pendingReqId as Hex],
    query: { enabled: hasPending },
  })

  // retryPendingMint() carries over the ORIGINAL request's referral code (the
  // caller doesn't submit a new one) — quote using that exact string, read
  // straight off the request being retried, so the LZ payload size matches
  // what will actually be re-sent.
  const originalReferralCode =
    hasPending && mintRequestData
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
    mintTimeout: mintTimeout ? Number(mintTimeout) : 1800, // default 30 min

    // Actions
    expirePendingMint,
    claimRefund,
    retryPendingMint,
    retryFee,
    isRetryFeeLoaded,

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
