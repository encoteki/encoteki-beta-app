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
// VOTE TALLY DISPLAY TYPES (used by vote-breakdown.tsx / vote-progress-bar.tsx,
// currently unwired pending live tally data — see BACKLOG.md)
// ============================================

export interface VotesByChain {
  [chainId: number]: number
}

export interface ProposalOption {
  label: string
  votes: number
  votesByChain: VotesByChain
}

export interface VotePower {
  base: number
  arbitrum: number
  lisk: number
  manta: number
  total: number
}
