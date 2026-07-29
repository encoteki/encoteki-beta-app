import { ProposalType } from '@/enums/dao-types.enum'
import { DaoRow } from '@/lib/supabase/database.types'
import { Address } from 'viem'

// ============================================
// SUPABASE DAO TYPES
// ============================================

/**
 * Contract addresses for each supported chain
 */
export interface ChainContractAddresses {
  base: Address | null
  arbitrum: Address | null
  lisk: Address | null
  manta: Address | null
}

/**
 * Extended DAO type with computed properties for UI usage
 */
export interface Dao extends DaoRow {
  // Computed: contract addresses by chain key
  contractAddresses: ChainContractAddresses
}

/**
 * Convert a DaoRow from Supabase to the extended Dao type
 */
export function toDaoWithContracts(row: DaoRow): Dao {
  return {
    ...row,
    contractAddresses: {
      base: row.ca_base as Address | null,
      arbitrum: row.ca_arb as Address | null,
      lisk: row.ca_lisk as Address | null,
      manta: row.ca_manta as Address | null,
    },
  }
}

/**
 * Get supported chains for a DAO (chains with contract addresses)
 */
export function getDaoSupportedChains(dao: Dao | DaoRow): string[] {
  const chains: string[] = []
  if (dao.ca_base) chains.push('BASE')
  if (dao.ca_arb) chains.push('ARBITRUM')
  if (dao.ca_lisk) chains.push('LISK')
  if (dao.ca_manta) chains.push('MANTA')
  return chains
}

// ============================================
// DAO TYPE MAPPING
// ============================================

/**
 * Maps dao_type IDs from Supabase to ProposalType enum
 * Update these values based on your dao_type table in Supabase
 */
export const DAO_TYPE_MAP: Record<number, ProposalType> = {
  1: ProposalType.PROPOSAL,
  2: ProposalType.DONATION,
  3: ProposalType.BUSINESS,
}

/**
 * Get ProposalType from dao_type ID
 */
export function getProposalTypeFromDaoType(
  daoTypeId: number | null,
): ProposalType {
  if (daoTypeId === null) return ProposalType.PROPOSAL
  return DAO_TYPE_MAP[daoTypeId] || ProposalType.PROPOSAL
}

/**
 * Check if a DAO is a Proof of Donation (POD) type
 * POD types have dao_type == 2 and may contain HTML content
 */
export function isPodType(daoTypeId: number | null): boolean {
  return daoTypeId === 2
}

/**
 * Check if dao_content contains HTML tags
 */
export function isHtmlContent(content: string | null): boolean {
  if (!content) return false
  return /<[^>]+>/.test(content)
}

// ============================================
// PROPOSALS API TYPES (GET /proposals, GET /proposals/:id)
// ============================================

export interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * A single proposal as returned by `GET /proposals` (list view).
 */
export interface ProposalListItem {
  proposalId: string
  proposalType: number
  proposalName: string
  votingEnds: string
  timeRemaining: TimeRemaining
}

export interface ProposalOptionApi {
  index: number
  label: string
}

/**
 * Clone contract deployed for this proposal on one chain. `deployments` only
 * lists chains that have actually seen a deployment event, so a proposal not
 * yet propagated to every satellite has fewer than 4 entries.
 */
export interface ProposalDeployment {
  chainId: string
  contractAddress: string
}

/**
 * Full proposal detail as returned by `GET /proposals/:id` — list fields
 * plus `description`, `options`, and `deployments`.
 */
export interface ProposalDetail extends ProposalListItem {
  description: string
  options: ProposalOptionApi[]
  deployments: ProposalDeployment[]
}

export interface ProposalsPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ============================================
// LEGACY MOCK TYPES (for backwards compatibility)
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
  lisk: number
  manta: number
  total: number
}
