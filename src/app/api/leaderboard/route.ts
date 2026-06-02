import { NextResponse } from 'next/server'

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

    const json = await res.json()
    const items: { userAddress: string; points: number }[] = json?.data ?? []

    const entries = items.map((item, i) => ({
      rank: (page - 1) * limit + i + 1,
      address: item.userAddress,
      points: item.points,
    }))

    return NextResponse.json({ entries, pagination: json.pagination ?? null })
  } catch (err) {
    console.error('[leaderboard]', err)
    return NextResponse.json({ entries: [], pagination: null }, { status: 500 })
  }
}
