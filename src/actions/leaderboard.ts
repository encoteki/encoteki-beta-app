'use server'

export type LeaderboardEntry = {
  rank: number
  address: string
  points: number
}

export async function getLeaderboard(
  page = 1,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(
      `https://api.encoteki.com/leaderboard?page=${page}&limit=${limit}&isAdmin=false`,
      { next: { revalidate: 60 } },
    )

    const json = await res.json()
    const items: { userAddress: string; points: number }[] = json?.data ?? []

    return items.map((item, i) => ({
      rank: (page - 1) * limit + i + 1,
      address: item.userAddress,
      points: item.points,
    }))
  } catch {
    return []
  }
}
