import { ProposalType } from '@/enums/dao-types.enum'

// ============================================
// TYPES
// ============================================

export interface VotesByChain {
  [chainId: number]: number
}

export interface ProposalOption {
  label: string
  votes: number
  votesByChain: VotesByChain
}

export interface MockProposal {
  id: number
  code: string
  type: ProposalType
  name: string
  description: string
  options: ProposalOption[]
  totalVotes: number
  endTime: string
  createdAt: string
}

export interface VotePower {
  base: number
  arbitrum: number
  total: number
}
