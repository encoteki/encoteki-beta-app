'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { CHAIN_IDS } from '@/constants/contracts/payments'
import { MockProposal, VotePower } from '@/types/dao.types'
import { simulateVote } from '@/constants/dao/mock-proposals'

/**
 * useVoting — Manages voting state and logic for a DAO proposal.
 *
 * In production, this hook would:
 * 1. Read NFT balanceOf from TSB contracts on Base & Arbitrum (via useReadContract)
 * 2. Call EncotekiVote.vote() on-chain (via useWriteContract)
 * 3. Read live vote counts from contract (via useReadContract)
 *
 * Currently uses simulated/mock data for development.
 */
export function useVoting(initialProposal: MockProposal) {
  const { address, isConnected } = useAccount()

  // ============================================
  // STATE
  // ============================================
  const [proposal, setProposal] = useState<MockProposal>(initialProposal)
  const [selectedOption, setSelectedOption] = useState<number | undefined>(
    undefined,
  )
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)

  // Simulated NFT ownership per chain
  const [votePower, setVotePower] = useState<VotePower>({
    base: 0,
    arbitrum: 0,
    total: 0,
  })

  // ============================================
  // SIMULATE NFT BALANCE CHECK
  // ============================================
  useEffect(() => {
    if (!isConnected || !address) {
      setVotePower({ base: 0, arbitrum: 0, total: 0 })
      return
    }

    /**
     * In production, replace this with actual contract reads:
     *
     * const baseBalance = useReadContract({
     *   address: TSB_CONTRACTS[CHAIN_IDS.BASE.SEPOLIA],
     *   abi: erc721BalanceOf_abi,
     *   functionName: 'balanceOf',
     *   args: [address],
     *   chainId: CHAIN_IDS.BASE.SEPOLIA,
     * })
     *
     * const arbBalance = useReadContract({
     *   address: TSB_CONTRACTS[CHAIN_IDS.ARBITRUM.SEPOLIA],
     *   abi: erc721BalanceOf_abi,
     *   functionName: 'balanceOf',
     *   args: [address],
     *   chainId: CHAIN_IDS.ARBITRUM.SEPOLIA,
     * })
     */

    // --- Mock: Simulate NFT balances ---
    const mockBase = 2 // User owns 2 NFTs on Base
    const mockArbitrum = 1 // User owns 1 NFT on Arbitrum

    setVotePower({
      base: mockBase,
      arbitrum: mockArbitrum,
      total: mockBase + mockArbitrum,
    })
  }, [address, isConnected])

  // ============================================
  // VOTE HANDLER
  // ============================================
  const vote = useCallback(async () => {
    if (selectedOption === undefined) return
    if (votePower.total === 0) return
    if (hasVoted) return

    setIsVoting(true)

    try {
      /**
       * In production, execute on-chain vote for each NFT:
       *
       * for (const chainId of SUPPORTED_VOTE_CHAINS) {
       *   const balance = chainId === CHAIN_IDS.BASE.SEPOLIA
       *     ? votePower.base
       *     : votePower.arbitrum
       *
       *   for (let i = 0; i < balance; i++) {
       *     const tokenId = await readContract({
       *       address: TSB_CONTRACTS[chainId],
       *       abi: erc721BalanceOf_abi,
       *       functionName: 'tokenOfOwnerByIndex',
       *       args: [address, BigInt(i)],
       *     })
       *
       *     await writeContract({
       *       address: VOTE_CONTRACTS[chainId],
       *       abi: encotekiVote_abi,
       *       functionName: 'vote',
       *       args: [
       *         BigInt(proposal.id),
       *         tokenId,
       *         BigInt(chainId),
       *         BigInt(selectedOption),
       *       ],
       *     })
       *   }
       * }
       */

      // --- Mock: Simulate vote delay ---
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate votes from Base
      let updated = simulateVote(
        proposal,
        selectedOption,
        votePower.base,
        CHAIN_IDS.BASE.SEPOLIA,
      )

      // Simulate votes from Arbitrum
      updated = simulateVote(
        updated,
        selectedOption,
        votePower.arbitrum,
        CHAIN_IDS.ARBITRUM.SEPOLIA,
      )

      setProposal(updated)
      setHasVoted(true)
    } catch (error) {
      console.error('Vote failed:', error)
    } finally {
      setIsVoting(false)
    }
  }, [selectedOption, votePower, hasVoted, proposal])

  // ============================================
  // RETURN
  // ============================================
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
