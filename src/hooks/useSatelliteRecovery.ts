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
      if (!contract) return
      writeContract({
        address: contract,
        abi: tsbSatelliteABI as any,
        functionName: 'retryPendingMint',
        args: [reqId],
      })
    },
    [contract, writeContract],
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
