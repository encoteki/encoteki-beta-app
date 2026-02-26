import { ProposalType } from '@/enums/dao-types.enum'
import { MockProposal } from '@/types/dao.types'
import { CHAIN_IDS } from '@/constants/contracts/payments'

/**
 * Chain label mapping for display purposes.
 */
export const CHAIN_LABELS: Record<number, string> = {
  [CHAIN_IDS.BASE.SEPOLIA]: 'Base',
  [CHAIN_IDS.ARBITRUM.SEPOLIA]: 'Arbitrum',
}

/**
 * Supported chain IDs for vote counting.
 */
export const SUPPORTED_VOTE_CHAINS = [
  CHAIN_IDS.BASE.SEPOLIA,
  CHAIN_IDS.ARBITRUM.SEPOLIA,
]

// ============================================
// MOCK PROPOSALS — 3 types with vote simulation
// ============================================

/**
 * D001 — Proof of Donation
 * Total 47 votes across Base (27) and Arbitrum (20)
 */
const donationProposal: MockProposal = {
  id: 0,
  code: 'D001',
  type: ProposalType.DONATION,
  name: 'Which endangered species should receive our next donation?',
  description:
    "As part of Encoteki's commitment to wildlife conservation, we allocate a portion of mint proceeds to animal conservation projects. This proposal determines which endangered species will receive the next round of funding. Each NFT holder can vote with their token(s) — your vote matters in directing real-world impact.",
  options: [
    {
      label: 'Sumatran Tiger',
      votes: 15,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 9,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 6,
      },
    },
    {
      label: 'Javan Rhino',
      votes: 12,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 7,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 5,
      },
    },
    {
      label: 'Komodo Dragon',
      votes: 8,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 3,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 5,
      },
    },
    {
      label: 'Bornean Orangutan',
      votes: 12,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 8,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 4,
      },
    },
  ],
  totalVotes: 47,
  endTime: '2026-03-05T23:59:59Z',
  createdAt: '2026-02-24T10:00:00Z',
}

/**
 * P001 — Proposal (Governance)
 * Total 35 votes across Base (18) and Arbitrum (17)
 */
const governanceProposal: MockProposal = {
  id: 1,
  code: 'P001',
  type: ProposalType.PROPOSAL,
  name: 'Sustainable Business for Encoteki’s Subsidiaries',
  description:
    'The Sustainable Business for Encoteki’s Subsidiaries initiative presents three impactful options for environmental and social good. The Sustainable Café repurposes buses and containers, serving eco-friendly dishes while supporting local economies. The Slow Fashion brand focuses on producing timeless clothing from upcycled materials, creating jobs for local artisans and promoting ethical fashion. The Thrift Store sells high-quality second-hand items, reducing textile waste and promoting sustainable consumption. Each option prioritizes environmental responsibility and community development, creating a positive impact on both society and the planet.',
  options: [
    {
      label: 'Sustainable Cafe',
      votes: 20,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 12,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 8,
      },
    },
    {
      label: 'Slow Fashion',
      votes: 10,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 4,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 6,
      },
    },
    {
      label: 'Refurbished Goods',
      votes: 5,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 2,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 3,
      },
    },
  ],
  totalVotes: 35,
  endTime: '2026-03-10T23:59:59Z',
  createdAt: '2026-02-22T14:30:00Z',
}

/**
 * BP001 — Business Proposal
 * Total 28 votes across Base (16) and Arbitrum (12)
 */
const businessProposal: MockProposal = {
  id: 2,
  code: 'BP001',
  type: ProposalType.BUSINESS,
  name: 'Partnership with World Wildlife Foundation for NFT royalties',
  description:
    'World Wildlife Foundation (WWF) has proposed a partnership where a percentage of secondary market NFT royalties would be directed to their global conservation fund. This business proposal evaluates three options for structuring the deal. The partnership would bring credibility and mainstream exposure to Encoteki.',
  options: [
    {
      label: 'Accept partnership (10% royalty share)',
      votes: 8,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 5,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 3,
      },
    },
    {
      label: 'Counter-offer (5% royalty share)',
      votes: 14,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 9,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 5,
      },
    },
    {
      label: 'Decline partnership',
      votes: 6,
      votesByChain: {
        [CHAIN_IDS.BASE.SEPOLIA]: 2,
        [CHAIN_IDS.ARBITRUM.SEPOLIA]: 4,
      },
    },
  ],
  totalVotes: 28,
  endTime: '2026-03-15T23:59:59Z',
  createdAt: '2026-02-20T09:00:00Z',
}

// ============================================
// EXPORTS
// ============================================

export const mockProposals: MockProposal[] = [
  donationProposal,
  governanceProposal,
  businessProposal,
]

/**
 * Find a proposal by its code (e.g. "D001").
 */
export function getProposalByCode(code: string): MockProposal | undefined {
  return mockProposals.find((p) => p.code.toLowerCase() === code.toLowerCase())
}

/**
 * Calculate vote percentage for a specific option.
 */
export function getVotePercentage(
  optionVotes: number,
  totalVotes: number,
): number {
  if (totalVotes === 0) return 0
  return Math.round((optionVotes / totalVotes) * 100)
}

/**
 * Simulate adding votes and recalculating totals.
 * @param proposal  The proposal to update
 * @param optionIdx The option index being voted for
 * @param count     Number of new votes (= NFTs owned)
 * @param chainId   The chain the votes come from
 * @returns A new proposal object with updated vote counts
 */
export function simulateVote(
  proposal: MockProposal,
  optionIdx: number,
  count: number,
  chainId: number,
): MockProposal {
  const updatedOptions = proposal.options.map((opt, idx) => {
    if (idx !== optionIdx) return { ...opt }
    return {
      ...opt,
      votes: opt.votes + count,
      votesByChain: {
        ...opt.votesByChain,
        [chainId]: (opt.votesByChain[chainId] || 0) + count,
      },
    }
  })

  return {
    ...proposal,
    options: updatedOptions,
    totalVotes: proposal.totalVotes + count,
  }
}
