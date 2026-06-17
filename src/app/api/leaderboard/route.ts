import { NextResponse } from 'next/server'
import { LeaderboardUpstreamSchema } from '@/lib/schemas'
import { reportError } from '@/lib/telemetry'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.min(
    1000,
    Math.max(1, Math.trunc(Number(searchParams.get('page') ?? '1')) || 1),
  )
  const limit = Math.min(
    100,
    Math.max(1, Math.trunc(Number(searchParams.get('limit') ?? '10')) || 10),
  )

  try {
    const res = await fetch(
      `https://api.encoteki.com/leaderboard?page=${page}&limit=${limit}`,
      {
        next: { revalidate: 60 },
        headers: {
          ...(process.env.ENCOTEKI_API_KEY && {
            Authorization: `Bearer ${process.env.ENCOTEKI_API_KEY}`,
          }),
        },
      },
    )

    // Validate the upstream payload at the boundary before reshaping it.
    const parsed = LeaderboardUpstreamSchema.safeParse(await res.json())
    if (!parsed.success) {
      throw new Error('Malformed leaderboard response')
    }

    const items = parsed.data.data ?? []
    const entries = items.map((item, i) => ({
      rank: (page - 1) * limit + i + 1,
      address: item.userAddress,
      points: item.points,
    }))

    return NextResponse.json({
      entries,
      pagination: parsed.data.pagination ?? null,
    })
  } catch (err) {
    reportError(err, { route: 'GET /api/leaderboard', page, limit })
    return NextResponse.json({ entries: [], pagination: null }, { status: 500 })
  }
}
