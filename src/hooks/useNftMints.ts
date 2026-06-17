'use client'

import { useQuery } from '@tanstack/react-query'
import { MintsResponseSchema } from '@/lib/schemas'

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

async function fetchMints(
  address: string,
  chainId: number,
): Promise<MintItem[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: MINTS_QUERY,
      variables: { chainId, minter: address.toLowerCase() },
    }),
  })

  if (!res.ok) throw new Error(`Mints request failed: HTTP ${res.status}`)

  // Validate the untrusted GraphQL payload at the boundary so a renamed/missing
  // field fails here instead of throwing deep inside the wallet UI.
  const parsed = MintsResponseSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Malformed mints response')

  const items = parsed.data.data?.mints?.items ?? []
  const result: MintItem[] = []
  for (const item of items) {
    let tokenId: bigint
    try {
      tokenId = BigInt(item.tokenId)
    } catch {
      // Skip records whose tokenId can't be coerced rather than failing the set.
      continue
    }
    result.push({
      tokenId,
      paymentToken: item.paymentToken ?? '',
      status: Number(item.status ?? 0) || 0,
      statusDesc: item.statusDesc ?? '',
      mintDate: item.mintDate ?? null,
    })
  }
  return result
}

/**
 * NFT mints for a minter on a given chain. Backed by TanStack Query for
 * deduplication, caching, and retries (replaces a hand-rolled fetch effect).
 */
export function useNftMints(
  address: string | undefined,
  chainId: number,
): NftMintsResult {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['nft-mints', chainId, address?.toLowerCase() ?? null],
    queryFn: () => fetchMints(address as string, chainId),
    enabled: !!address,
    staleTime: 60 * 1000,
    retry: 1,
  })

  return {
    mints: data ?? [],
    isLoading,
    isError,
  }
}
