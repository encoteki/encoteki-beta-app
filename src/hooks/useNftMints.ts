'use client'

import { useState, useEffect } from 'react'

const GRAPHQL_URL = 'https://api.encoteki.com/graphql'

const MINTS_QUERY = `
  query GetMintsByMinterAndChain($chainId: BigInt!, $minter: String!) {
    mints(where: { chainId: $chainId, minter: $minter }) {
      items {
        tokenId
        paymentToken
        status
        statusDesc
        mintDate
      }
    }
  }
`

export type MintItem = {
  tokenId: bigint
  paymentToken: string
  status: number
  statusDesc: string
  mintDate: string | null
}

export type NftMintsResult = {
  mints: MintItem[]
  isLoading: boolean
  isError: boolean
}

export function useNftMints(
  address: string | undefined,
  chainId: number,
): NftMintsResult {
  const [mints, setMints] = useState<MintItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    if (!address) {
      setMints([])
      return
    }

    let cancelled = false
    setIsLoading(true)
    setIsError(false)

    fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: MINTS_QUERY,
        variables: { chainId, minter: address.toLowerCase() },
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const items: any[] = json?.data?.mints?.items ?? []
        setMints(
          items.map((item) => ({
            tokenId: BigInt(item.tokenId),
            paymentToken: (item.paymentToken as string) ?? '',
            status: Number(item.status),
            statusDesc: (item.statusDesc as string) ?? '',
            mintDate: (item.mintDate as string) ?? null,
          })),
        )
      })
      .catch(() => {
        if (!cancelled) setIsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [address, chainId])

  return { mints, isLoading, isError }
}
