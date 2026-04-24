import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://api.encoteki.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ leaderboards(limit: 999999) { items { userAddress points } } }`,
      }),
      next: { revalidate: 60 },
    })

    const json = await res.json()
    const items: { userAddress: string; points: number }[] =
      json?.data?.leaderboards?.items ?? []

    const entries = items
      .sort((a, b) => b.points - a.points)
      .map((item, i) => ({
        rank: i + 1,
        address: item.userAddress,
        points: item.points,
      }))

    return NextResponse.json(entries)
  } catch (err) {
    console.error('[leaderboard]', err)
    return NextResponse.json([], { status: 500 })
  }
}
