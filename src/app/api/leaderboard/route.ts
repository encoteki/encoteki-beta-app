import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '10'))

  try {
    const res = await fetch(
      `https://api.encoteki.com/leaderboard?page=${page}&limit=${limit}&isAdmin=false`,
      { next: { revalidate: 60 } },
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
