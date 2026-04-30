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
  title: string
  users: LeaderboardUser[]
  currentUserAddress?: string
  updatedAt?: string
  loading?: boolean
  pagination?: PaginationInfo
  onPageChange?: (page: number) => void
}
