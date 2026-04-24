export interface LeaderboardUser {
  rank: number
  walletAddress: string
  points: number
  isCurrentUser?: boolean
}

export interface LeaderboardProps {
  title: string
  users: LeaderboardUser[]
  currentUserAddress?: string
  updatedAt?: string
  pageSize?: number
  loading?: boolean
}
