export interface LeaderboardUser {
  rank: number
  walletAddress: string
  points: number
  isCurrentUser?: boolean
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface LeaderboardProps {
  users: LeaderboardUser[]
  currentUserAddress?: string
  loading?: boolean
  error?: boolean
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
  onRetry?: () => void
}
