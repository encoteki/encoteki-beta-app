'use client'

import { useState, useCallback, useEffect } from 'react'
import { useConnection, useReadContract, useWriteContract } from 'wagmi'
import { Address } from 'viem'
import { getChainId } from '@/constants/contracts/tsb'
import { VotePower, ProposalOption, VotesByChain } from '@/types/dao.types'
import { DaoRow } from '@/lib/supabase/database.types'
import { proposalImplABI } from '@/constants/abis/proposalImplementation.abi'

// ============================================
// CHAIN CONFIGURATION
// ============================================

export const DAO_SUPPORTED_CHAINS = [
  'BASE',
  'ARBITRUM',
  'LISK',
  'MANTA',
] as const
export type DaoChainKey = (typeof DAO_SUPPORTED_CHAINS)[number]

/**
 * Get the contract address for a chain from DAO data
 */
function getContractAddress(dao: DaoRow, chain: DaoChainKey): Address | null {
  switch (chain) {
    case 'BASE':
      return dao.ca_base as Address | null
    case 'ARBITRUM':
      return dao.ca_arb as Address | null
    case 'LISK':
      return dao.ca_lisk as Address | null
    case 'MANTA':
      return dao.ca_manta as Address | null
    default:
      return null
  }
}

/**
 * Get chain label for display
 */
export function getChainLabel(chain: DaoChainKey): string {
  const labels: Record<DaoChainKey, string> = {
    BASE: 'Base',
    ARBITRUM: 'Arbitrum',
    LISK: 'Lisk',
    MANTA: 'Manta',
  }
  return labels[chain]
}

/**
 * Get supported chains for a DAO (chains with contract addresses)
 */
export function getDaoSupportedChains(dao: DaoRow): DaoChainKey[] {
  return DAO_SUPPORTED_CHAINS.filter(
    (chain) => getContractAddress(dao, chain) !== null,
  )
}

// ============================================
// PROPOSAL STATE INTERFACE
// ============================================

export interface ProposalState {
  name: string
  description: string
  options: ProposalOption[]
  totalVotes: number
  startDate: Date
  endDate: Date | null
  createdAt: Date
  isActive: boolean
}

/**
 * Convert DAO data to a ProposalState for UI rendering
 */
function daoToProposalState(dao: DaoRow): ProposalState {
  // Parse scoring JSON if available (contains options and vote counts)
  let options: ProposalOption[] = []
  let totalVotes = 0

  if (dao.scoring) {
    try {
      const scoringData = JSON.parse(dao.scoring)
      if (Array.isArray(scoringData.options)) {
        options = scoringData.options.map(
          (opt: {
            label: string
            votes?: number
            votesByChain?: VotesByChain
          }) => ({
            label: opt.label,
            votes: opt.votes || 0,
            votesByChain: opt.votesByChain || {},
          }),
        )
        totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0)
      }
    } catch (e) {
      console.error('[useVoting] Failed to parse scoring:', e)
    }
  }

  // Default options if none found
  if (options.length === 0) {
    options = [
      { label: 'Yes', votes: 0, votesByChain: {} },
      { label: 'No', votes: 0, votesByChain: {} },
    ]
  }

  return {
    name: dao.dao_name,
    description: dao.dao_content || '',
    options,
    totalVotes,
    startDate: dao.start_date
      ? new Date(dao.start_date)
      : new Date(dao.created_at),
    endDate: dao.end_date ? new Date(dao.end_date) : null,
    createdAt: new Date(dao.created_at),
    isActive: dao.end_date ? new Date(dao.end_date) > new Date() : true,
  }
}

/**
 * useVotingWithDao — Manages voting state and logic for a DAO proposal from Supabase.
 *
 * Features:
 * 1. Reads on-chain proposal data from contract addresses (ca_base, ca_arb, ca_lisk, ca_manta)
 * 2. Supports voting across multiple chains using proposalImplementation.abi
 * 3. Falls back to Supabase data when contract is unavailable
 */
export function useVotingWithDao(dao: DaoRow) {
  const { address, isConnected } = useConnection()

  // ============================================
  // STATE
  // ============================================
  const [proposal, setProposal] = useState<ProposalState>(() =>
    daoToProposalState(dao),
  )
  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    undefined,
  )
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  // Voting power per chain
  const [votePower, setVotePower] = useState<VotePower>({
    base: 0,
    arbitrum: 0,
    lisk: 0,
    manta: 0,
    total: 0,
  })

  // Supported chains for this DAO
  const supportedChains = getDaoSupportedChains(dao)

  // Primary contract address (first available chain)
  const primaryChain = supportedChains[0] || null
  const primaryContractAddress = primaryChain
    ? getContractAddress(dao, primaryChain)
    : null

  // ============================================
  // ON-CHAIN DATA READS
  // ============================================

  // Read proposal options from contract
  const { data: onChainOptions } = useReadContract({
    address: primaryContractAddress as Address,
    abi: proposalImplABI,
    functionName: 'getOptions',
    chainId: primaryChain ? getChainId(primaryChain) : undefined,
    query: {
      enabled: !!primaryContractAddress,
    },
  })

  // Read vote tallies from contract
  const { data: onChainTallies } = useReadContract({
    address: primaryContractAddress as Address,
    abi: proposalImplABI,
    functionName: 'getAllTallies',
    chainId: primaryChain ? getChainId(primaryChain) : undefined,
    query: {
      enabled: !!primaryContractAddress,
    },
  })

  // Read if voting is active
  const { data: isActiveOnChain } = useReadContract({
    address: primaryContractAddress as Address,
    abi: proposalImplABI,
    functionName: 'isActive',
    chainId: primaryChain ? getChainId(primaryChain) : undefined,
    query: {
      enabled: !!primaryContractAddress,
    },
  })

  // Read proposal name from contract
  const { data: proposalName } = useReadContract({
    address: primaryContractAddress as Address,
    abi: proposalImplABI,
    functionName: 'proposalName',
    chainId: primaryChain ? getChainId(primaryChain) : undefined,
    query: {
      enabled: !!primaryContractAddress,
    },
  })

  // Read description from contract
  const { data: proposalDescription } = useReadContract({
    address: primaryContractAddress as Address,
    abi: proposalImplABI,
    functionName: 'description',
    chainId: primaryChain ? getChainId(primaryChain) : undefined,
    query: {
      enabled: !!primaryContractAddress,
    },
  })

  // ============================================
  // UPDATE PROPOSAL STATE FROM ON-CHAIN DATA
  // ============================================
  useEffect(() => {
    if (onChainOptions && onChainTallies) {
      const options: ProposalOption[] = (onChainOptions as string[]).map(
        (label, idx) => ({
          label,
          votes: Number((onChainTallies as bigint[])[idx] || BigInt(0)),
          votesByChain: {}, // Would need separate contract reads per chain
        }),
      )

      const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0)

      setProposal((prev) => ({
        ...prev,
        name: (proposalName as string) || prev.name,
        description: (proposalDescription as string) || prev.description,
        options,
        totalVotes,
        isActive:
          typeof isActiveOnChain === 'boolean'
            ? isActiveOnChain
            : prev.isActive,
      }))
    }
  }, [
    onChainOptions,
    onChainTallies,
    isActiveOnChain,
    proposalName,
    proposalDescription,
  ])

  // ============================================
  // SIMULATE NFT BALANCE CHECK
  // ============================================
  useEffect(() => {
    if (!isConnected || !address) {
      setVotePower({ base: 0, arbitrum: 0, lisk: 0, manta: 0, total: 0 })
      return
    }

    /**
     * In production, read NFT balanceOf from TSB contracts on each chain.
     * For now, simulate based on available chains.
     */

    // Mock balances for development
    const mockPower: VotePower = {
      base: supportedChains.includes('BASE') ? 2 : 0,
      arbitrum: supportedChains.includes('ARBITRUM') ? 1 : 0,
      lisk: supportedChains.includes('LISK') ? 0 : 0,
      manta: supportedChains.includes('MANTA') ? 0 : 0,
      total: 0,
    }
    mockPower.total =
      mockPower.base + mockPower.arbitrum + mockPower.lisk + mockPower.manta

    setVotePower(mockPower)
  }, [address, isConnected, supportedChains])

  // ============================================
  // WRITE CONTRACT HOOK
  // ============================================
  const { writeContractAsync } = useWriteContract()

  // ============================================
  // VOTE HANDLER
  // ============================================
  const vote = useCallback(async () => {
    if (selectedOption === undefined) return
    if (votePower.total === 0) return
    if (hasVoted) return

    setIsVoting(true)

    try {
      // Vote on each supported chain with contract address
      for (const chain of supportedChains) {
        const contractAddress = getContractAddress(dao, chain)
        if (!contractAddress) continue

        const chainId = getChainId(chain)
        const chainVotePower = votePower[
          chain.toLowerCase() as keyof VotePower
        ] as number

        if (chainVotePower > 0) {
          /**
           * In production, iterate through owned tokenIds and vote with each.
           * For now, simulate a single vote transaction per chain.
           */

          // Example vote call (would need actual tokenId)
          // await writeContractAsync({
          //   address: contractAddress,
          //   abi: proposalImplABI,
          //   functionName: 'vote',
          //   args: [BigInt(tokenId), BigInt(selectedOption), '0x0000000000000000000000000000000000000000000000000000000000000000'],
          //   chainId,
          // })

          console.log(
            `[Vote] Chain: ${chain}, Contract: ${contractAddress}, Option: ${selectedOption}, ChainId: ${chainId}`,
          )
        }
      }

      // Simulate vote delay for UX
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update local state to reflect the vote
      setProposal((prev) => {
        const updatedOptions = prev.options.map((opt, idx) => {
          if (idx === selectedOption) {
            return {
              ...opt,
              votes: opt.votes + votePower.total,
            }
          }
          return opt
        })

        return {
          ...prev,
          options: updatedOptions,
          totalVotes: prev.totalVotes + votePower.total,
        }
      })

      setHasVoted(true)
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }, [
    selectedOption,
    votePower,
    hasVoted,
    dao,
    supportedChains,
    writeContractAsync,
  ])

  // ============================================
  // RETURN
  // ============================================
  return {
    dao,
    proposal,
    selectedOption,
    setSelectedOption,
    hasVoted,
    isVoting,
    votePower,
    vote,
    isConnected,
    supportedChains,
    contractAddresses: {
      base: getContractAddress(dao, 'BASE'),
      arbitrum: getContractAddress(dao, 'ARBITRUM'),
      lisk: getContractAddress(dao, 'LISK'),
      manta: getContractAddress(dao, 'MANTA'),
    },
  }
}

// ============================================
// LEGACY EXPORT (for backwards compatibility with MockProposal)
// ============================================

import { MockProposal } from '@/types/dao.types'
import { simulateVote } from '@/constants/dao/mock-proposals'

/**
 * useVoting — Legacy hook for MockProposal data.
 * Use useVotingWithDao for Supabase DAO data.
 */
export function useVoting(initialProposal: MockProposal) {
  const { address, isConnected } = useConnection()

  const [proposal, setProposal] = useState<MockProposal>(initialProposal)
  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    undefined,
  )
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  const [votePower, setVotePower] = useState<VotePower>({
    base: 0,
    arbitrum: 0,
    lisk: 0,
    manta: 0,
    total: 0,
  })

  useEffect(() => {
    if (!isConnected || !address) {
      setVotePower({ base: 0, arbitrum: 0, lisk: 0, manta: 0, total: 0 })
      return
    }

    // Mock: Simulate NFT balances
    const mockBase = 2
    const mockArbitrum = 1

    setVotePower({
      base: mockBase,
      arbitrum: mockArbitrum,
      lisk: 0,
      manta: 0,
      total: mockBase + mockArbitrum,
    })
  }, [address, isConnected])

  const vote = useCallback(async () => {
    if (selectedOption === undefined) return
    if (votePower.total === 0) return
    if (hasVoted) return

    setIsVoting(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      let updated = simulateVote(
        proposal,
        selectedOption,
        votePower.base,
        getChainId('BASE'),
      )
      updated = simulateVote(
        updated,
        selectedOption,
        votePower.arbitrum,
        getChainId('ARBITRUM'),
      )

      setProposal(updated)
      setHasVoted(true)
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }, [selectedOption, votePower, hasVoted, proposal])

  return {
    proposal,
    selectedOption,
    setSelectedOption,
    hasVoted,
    isVoting,
    votePower,
    vote,
    isConnected,
  }
}
