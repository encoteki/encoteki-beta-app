'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export type LeaderboardEntry = {
  rank: number
  address: string
  points: number
}

// Points formula (replace with real points column when available):
// Each referral usage = 100 pts
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('address, ref_code')
      .not('address', 'is', null)
      .not('ref_code', 'is', null)

    if (usersError || !users?.length) return []

    const { data: referrals } = await supabaseAdmin
      .from('referral')
      .select('code')
      .not('code', 'is', null)

    const codeUsage: Record<string, number> = {}
    for (const r of referrals ?? []) {
      if (r.code) codeUsage[r.code] = (codeUsage[r.code] ?? 0) + 1
    }

    return users
      .map((u) => ({
        address: u.address as string,
        points: (codeUsage[u.ref_code!] ?? 0) * 100,
      }))
      .sort((a, b) => b.points - a.points)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))
  } catch {
    return []
  }
}
