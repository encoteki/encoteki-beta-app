import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConnection,
  useSwitchChain,
} from 'wagmi'
import { Hex } from 'viem'
import { getChainByKey } from '@/constants/contracts/tsb'
import { tsbHubABI } from '@/constants/abis/tsbHub.abi'
import { reportUnexpected } from '@/lib/telemetry'

const ZERO = BigInt(0)

// Hub MintRecord.status (TSBEnums.sol `enum Status`)
const HubStatus = {
  NONE: 0,
  PENDING: 1,
  ASSIGNED: 2,
  MINTED: 3,
  FAILED: 4,
  CANCELED: 5,
} as const

export type HubMintDiagnosis =
  | 'loading'
  | 'not-on-hub' // reqId never reached the Hub — quota was never touched
  | 'reclaimable' // ASSIGNED, past CANCEL_RECONCILE_DELAY — safe self-service
  | 'settling' // ASSIGNED, still within the delay window
  | 'needs-admin' // PENDING or FAILED on the Hub — no self-service path exists
  | 'minted' // MINTED — the mint actually succeeded on the Satellite
  | 'canceled' // CANCELED — already cleaned up, quota is free

/**
 * "Why can't I mint again" diagnostic (spec §9). maxMintPerWallet is enforced
 * only on the Hub, incremented the moment a tokenId is ASSIGNED for a
 * cross-chain request — a Satellite-side expire/refund never touches the Hub,
 * so a self-refunded user's wallet quota can stay consumed until someone
 * calls reclaimStuckMint() there. That function is permissionless (no role
 * gate) once CANCEL_RECONCILE_DELAY (1h) has passed since the Hub sent the
 * MintInstruction — safe for any wallet, including the affected user, to call
 * (TSBHub.sol: reclaimStuckMint/_cancelRecord).
 */
export function useHubMintDiagnostic(reqId: Hex | null) {
  const hub = getChainByKey('BASE')
  const { chainId: walletChainId } = useConnection()
  const { mutateAsync: switchChainAsync } = useSwitchChain()

  // Ticked rather than read live so the ASSIGNED settling→reclaimable flip
  // (and the caller's countdown display) update without an unrelated
  // re-render, and so diagnosis stays a pure function of state (React
  // Compiler flags a direct Date.now() call in render/useMemo as impure).
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000)
    return () => clearInterval(id)
  }, [])

  const { data: tokenId, refetch: refetchTokenId } = useReadContract({
    address: hub?.contract,
    abi: tsbHubABI,
    functionName: 'reqIdToTokenId',
    args: reqId ? [reqId] : undefined,
    chainId: hub?.chainId,
    query: { enabled: !!reqId && !!hub },
  })

  const hasTokenId = tokenId !== undefined && tokenId !== ZERO

  const { data: record, refetch: refetchRecord } = useReadContract({
    address: hub?.contract,
    abi: tsbHubABI,
    functionName: 'records',
    args: hasTokenId ? [tokenId as bigint] : undefined,
    chainId: hub?.chainId,
    query: { enabled: hasTokenId && !!hub },
  })

  const { data: delaySeconds } = useReadContract({
    address: hub?.contract,
    abi: tsbHubABI,
    functionName: 'CANCEL_RECONCILE_DELAY',
    chainId: hub?.chainId,
    query: { enabled: !!hub },
  })

  // MintRecord struct order: [owner, originEid, status, timestamp, reqId]
  const recordStatus = record ? Number(record[2]) : undefined
  const recordTimestamp = record ? Number(record[3]) : undefined

  const availableAt = useMemo(() => {
    if (recordTimestamp === undefined || delaySeconds === undefined)
      return undefined
    return recordTimestamp + Number(delaySeconds)
  }, [recordTimestamp, delaySeconds])

  const diagnosis = useMemo((): HubMintDiagnosis => {
    if (!reqId || tokenId === undefined) return 'loading'
    if (!hasTokenId) return 'not-on-hub'
    if (recordStatus === undefined || availableAt === undefined)
      return 'loading'
    if (recordStatus === HubStatus.MINTED) return 'minted'
    if (recordStatus === HubStatus.CANCELED) return 'canceled'
    if (recordStatus === HubStatus.ASSIGNED) {
      return now / 1000 >= availableAt ? 'reclaimable' : 'settling'
    }
    // PENDING or FAILED on the Hub — no self-service path exists (spec §9)
    return 'needs-admin'
  }, [reqId, tokenId, hasTokenId, recordStatus, availableAt, now])

  const {
    mutate: writeContract,
    data: txHash,
    isPending: isSigning,
    error: writeError,
  } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  })

  const refetch = useCallback(() => {
    refetchTokenId()
    refetchRecord()
  }, [refetchTokenId, refetchRecord])

  useEffect(() => {
    if (receipt.isSuccess) refetch()
  }, [receipt.isSuccess, refetch])

  const reclaim = useCallback(async () => {
    if (!hub || tokenId === undefined || diagnosis !== 'reclaimable') return
    if (walletChainId !== hub.chainId) {
      try {
        await switchChainAsync({ chainId: hub.chainId })
      } catch (err) {
        reportUnexpected(err, {
          flow: 'reclaim-stuck-mint-switch-chain',
          chainId: hub.chainId,
        })
        return
      }
    }
    writeContract({
      address: hub.contract,
      abi: tsbHubABI,
      functionName: 'reclaimStuckMint',
      args: [tokenId],
      chainId: hub.chainId,
    })
  }, [hub, tokenId, diagnosis, walletChainId, switchChainAsync, writeContract])

  return {
    diagnosis,
    availableAt,
    now,
    reclaim,
    isProcessing: isSigning || receipt.isLoading,
    isSuccess: receipt.isSuccess,
    error: writeError || receipt.error,
    refetch,
  }
}
