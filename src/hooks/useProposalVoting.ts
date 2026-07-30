'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  useConnection,
  useSwitchChain,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from 'wagmi'
import { Address } from 'viem'
import { getChain, getChainId, getExplorerUrl } from '@/constants/contracts/tsb'
import { proposalImplABI } from '@/constants/abis/proposalImplementation.abi'
import { useNftMints } from '@/hooks/useNftMints'
import { encodeRefCode } from '@/utils/dao-vote.util'
import { humanizeError } from '@/utils/humanize-error.util'
import { reportUnexpected } from '@/lib/telemetry'
import type { ProposalDetail } from '@/types/dao.types'

// Fixed, ordered chain set — matches the four chains proposals can deploy to
// (src/constants/contracts/tsb.ts). Calling useNftMints once per chain here,
// unconditionally, keeps hook order stable regardless of how many chains a
// given proposal has actually deployed to (rules-of-hooks).
const DAO_CHAIN_IDS = [
  getChainId('BASE'),
  getChainId('ARBITRUM'),
  getChainId('LISK'),
  getChainId('MANTA'),
] as const

export type VotePhase =
  | 'idle'
  | 'switching-chain'
  | 'signing'
  | 'mining'
  | 'success'
  | 'error'

export interface ChainVotingInfo {
  chainId: number
  label: string
  contractAddress: Address
  unvotedCount: number
  isActive: boolean
}

interface UseProposalVotingParams {
  proposal: ProposalDetail
  /** The wallet's own applied referral code, if any — same source as mint's referralCode. */
  refCode?: string | null
}

/**
 * Real on-chain voting for a single DAO proposal. Voting power is per-NFT
 * (the contract's AlreadyVoted guard is keyed by tokenId, not by wallet) —
 * each owned, not-yet-voted TSB token on a deployed chain is one vote.
 */
export function useProposalVoting({
  proposal,
  refCode,
}: UseProposalVotingParams) {
  const { address, chainId: walletChainId, isConnected } = useConnection()
  const { mutateAsync: switchChainAsync } = useSwitchChain()

  const refCodeHex = useMemo(() => encodeRefCode(refCode), [refCode])

  // ───────────── Owned tokenIds per chain (indexer-backed, no on-chain enumeration exists) ─────────────
  const baseMints = useNftMints(address, DAO_CHAIN_IDS[0])
  const arbitrumMints = useNftMints(address, DAO_CHAIN_IDS[1])
  const liskMints = useNftMints(address, DAO_CHAIN_IDS[2])
  const mantaMints = useNftMints(address, DAO_CHAIN_IDS[3])

  const ownedTokenIdsByChain = useMemo(() => {
    const map = new Map<number, bigint[]>()
    map.set(
      DAO_CHAIN_IDS[0],
      baseMints.mints.map((m) => m.tokenId),
    )
    map.set(
      DAO_CHAIN_IDS[1],
      arbitrumMints.mints.map((m) => m.tokenId),
    )
    map.set(
      DAO_CHAIN_IDS[2],
      liskMints.mints.map((m) => m.tokenId),
    )
    map.set(
      DAO_CHAIN_IDS[3],
      mantaMints.mints.map((m) => m.tokenId),
    )
    return map
  }, [baseMints.mints, arbitrumMints.mints, liskMints.mints, mantaMints.mints])

  const isLoadingOwnership =
    baseMints.isLoading ||
    arbitrumMints.isLoading ||
    liskMints.isLoading ||
    mantaMints.isLoading

  // ───────────── Deployment addresses for this proposal, keyed by chainId ─────────────
  const deploymentByChainId = useMemo(() => {
    const map = new Map<number, Address>()
    for (const d of proposal.deployments) {
      const chainId = Number(d.chainId)
      if (!Number.isFinite(chainId) || !getChain(chainId)) continue
      map.set(chainId, d.contractAddress as Address)
    }
    return map
  }, [proposal.deployments])

  // ───────────── Batch on-chain reads: isActive per deployed chain + hasVoted per owned tokenId ─────────────
  type ReadDescriptor =
    | { kind: 'isActive'; chainId: number }
    | { kind: 'hasVoted'; chainId: number; tokenId: bigint }

  const { contracts, descriptors } = useMemo(() => {
    const contracts: {
      address: Address
      abi: typeof proposalImplABI
      functionName: 'isActive' | 'hasVoted'
      args?: readonly [bigint]
      chainId: number
    }[] = []
    const descriptors: ReadDescriptor[] = []

    for (const chainId of DAO_CHAIN_IDS) {
      const contractAddress = deploymentByChainId.get(chainId)
      if (!contractAddress) continue

      contracts.push({
        address: contractAddress,
        abi: proposalImplABI,
        functionName: 'isActive',
        chainId,
      })
      descriptors.push({ kind: 'isActive', chainId })

      for (const tokenId of ownedTokenIdsByChain.get(chainId) ?? []) {
        contracts.push({
          address: contractAddress,
          abi: proposalImplABI,
          functionName: 'hasVoted',
          args: [tokenId],
          chainId,
        })
        descriptors.push({ kind: 'hasVoted', chainId, tokenId })
      }
    }

    return { contracts, descriptors }
  }, [deploymentByChainId, ownedTokenIdsByChain])

  const {
    data: readResults,
    refetch: refetchReads,
    isLoading: isLoadingReads,
  } = useReadContracts({
    contracts,
    query: { enabled: contracts.length > 0 },
  })

  const { unvotedByChain, isActiveByChain } = useMemo(() => {
    const unvoted = new Map<number, bigint[]>()
    const active = new Map<number, boolean>()

    descriptors.forEach((d, i) => {
      const res = readResults?.[i]
      if (d.kind === 'isActive') {
        active.set(
          d.chainId,
          res?.status === 'success' ? Boolean(res.result) : false,
        )
        return
      }
      // Fail-safe: treat an unknown read as "already voted" so a flaky RPC
      // call never lets the UI offer a token as vote-eligible twice.
      const hasVoted = res?.status === 'success' ? Boolean(res.result) : true
      if (!hasVoted) {
        unvoted.set(d.chainId, [...(unvoted.get(d.chainId) ?? []), d.tokenId])
      }
    })

    return { unvotedByChain: unvoted, isActiveByChain: active }
  }, [descriptors, readResults])

  const deployments: ChainVotingInfo[] = useMemo(
    () =>
      DAO_CHAIN_IDS.filter((id) => deploymentByChainId.has(id)).map((id) => {
        const chain = getChain(id)!
        return {
          chainId: id,
          label: chain.label,
          contractAddress: deploymentByChainId.get(id)!,
          unvotedCount: unvotedByChain.get(id)?.length ?? 0,
          isActive: isActiveByChain.get(id) ?? false,
        }
      }),
    [deploymentByChainId, unvotedByChain, isActiveByChain],
  )

  const totalPower = useMemo(
    () => deployments.reduce((sum, d) => sum + d.unvotedCount, 0),
    [deployments],
  )

  // ───────────── Chain selection ─────────────
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  const effectiveChainId = useMemo(() => {
    if (
      selectedChainId != null &&
      deployments.some(
        (d) => d.chainId === selectedChainId && d.unvotedCount > 0,
      )
    ) {
      return selectedChainId
    }
    const walletMatch = deployments.find(
      (d) => d.chainId === walletChainId && d.unvotedCount > 0,
    )
    const firstEligible = deployments.find((d) => d.unvotedCount > 0)
    return (walletMatch ?? firstEligible)?.chainId ?? null
  }, [selectedChainId, deployments, walletChainId])

  const selectedChainInfo =
    deployments.find((d) => d.chainId === effectiveChainId) ?? null

  // ───────────── Vote transaction ─────────────
  const {
    writeContractAsync,
    data: hash,
    error: writeError,
    isPending: isSigning,
    reset: resetWrite,
  } = useWriteContract()

  const receipt = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  })

  const [imperativePhase, setImperativePhase] = useState<
    'switching-chain' | 'error' | null
  >(null)
  const [manualError, setManualError] = useState<string | null>(null)

  const phase: VotePhase = useMemo(() => {
    if (imperativePhase === 'switching-chain') return 'switching-chain'
    if (imperativePhase === 'error') return 'error'
    if (writeError || receipt.error) return 'error'
    if (isSigning) return 'signing'
    if (receipt.isLoading) return 'mining'
    if (receipt.isSuccess) return 'success'
    return 'idle'
  }, [
    imperativePhase,
    writeError,
    receipt.error,
    isSigning,
    receipt.isLoading,
    receipt.isSuccess,
  ])

  const errorMsg = useMemo(() => {
    if (manualError) return manualError
    if (writeError || receipt.error)
      return humanizeError(writeError ?? receipt.error)
    return null
  }, [manualError, writeError, receipt.error])

  const vote = useCallback(
    async (optionIndex: number) => {
      if (!address || effectiveChainId == null) return
      const contractAddress = deploymentByChainId.get(effectiveChainId)
      const tokenId = unvotedByChain.get(effectiveChainId)?.[0]
      if (!contractAddress || tokenId === undefined) return

      setManualError(null)
      setImperativePhase(null)
      resetWrite()

      if (walletChainId !== effectiveChainId) {
        try {
          setImperativePhase('switching-chain')
          await switchChainAsync({ chainId: effectiveChainId })
          setImperativePhase(null)
        } catch (err) {
          reportUnexpected(err, {
            flow: 'dao-vote-switch-chain',
            chainId: effectiveChainId,
          })
          setManualError(humanizeError(err))
          setImperativePhase('error')
          return
        }
      }

      try {
        await writeContractAsync({
          chainId: effectiveChainId,
          address: contractAddress,
          abi: proposalImplABI,
          functionName: 'vote',
          args: [tokenId, BigInt(optionIndex), refCodeHex],
        })
      } catch (err) {
        reportUnexpected(err, {
          flow: 'dao-vote',
          proposalId: proposal.proposalId,
          chainId: effectiveChainId,
          optionIndex,
        })
        setManualError(humanizeError(err))
        setImperativePhase('error')
      }
    },
    [
      address,
      effectiveChainId,
      deploymentByChainId,
      unvotedByChain,
      walletChainId,
      switchChainAsync,
      writeContractAsync,
      refCodeHex,
      resetWrite,
      proposal.proposalId,
    ],
  )

  // Re-read hasVoted as soon as a vote confirms, so the spent token drops out
  // of unvotedByChain and displayed voting power decreases immediately.
  useEffect(() => {
    if (receipt.isSuccess) refetchReads()
  }, [receipt.isSuccess, refetchReads])

  const reset = useCallback(() => {
    setManualError(null)
    setImperativePhase(null)
    resetWrite()
  }, [resetWrite])

  const explorerUrl = useMemo(() => {
    if (!hash || effectiveChainId == null) return null
    const baseUrl = getExplorerUrl(effectiveChainId)
    return baseUrl ? `${baseUrl}${hash}` : null
  }, [hash, effectiveChainId])

  return {
    isConnected,
    walletChainId,
    deployments,
    isLoadingPower:
      isLoadingOwnership || (contracts.length > 0 && isLoadingReads),
    totalPower,
    selectedChainId: effectiveChainId,
    setSelectedChainId,
    powerForSelectedChain: selectedChainInfo?.unvotedCount ?? 0,
    isActiveOnSelectedChain: selectedChainInfo?.isActive ?? false,
    phase,
    errorMsg,
    vote,
    reset,
    txHash: hash ?? null,
    explorerUrl,
  }
}
