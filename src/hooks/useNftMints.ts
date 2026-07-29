'use client'

import { useQuery } from '@tanstack/react-query'
import { API_BASE_URL } from '@/constants/api'
import { MintsResponseSchema } from '@/lib/schemas'

const GRAPHQL_URL = `${API_BASE_URL}/graphql`

// tsb_tokens.owner is only ever set by a Transfer event (i.e. the token was
// actually minted on-chain), so filtering on owner already excludes
// pending/failed/canceled mint attempts without needing a status filter --
// same assumption src/api/routes/tokens.ts in encoteki-be relies on.
const MINTS_QUERY = `
  query GetTokensByOwnerAndChain($owner: String!, $originChainId: BigInt!) {
    tsbTokenss(where: { owner: $owner, originChainId: $originChainId }) {
      items {
        tokenId
        mintedAt
      }
    }
  }
`

export type MintItem = {
  tokenId: bigint
  mintDate: string | null
}

export type NftMintsResult = {
  mints: MintItem[]
  isLoading: boolean
  isError: boolean
  isFetching: boolean
  refetch: () => void
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
      variables: { owner: address.toLowerCase(), originChainId: chainId },
    }),
  })

  if (!res.ok) throw new Error(`Mints request failed: HTTP ${res.status}`)

  // Validate the untrusted GraphQL payload at the boundary so a renamed/missing
  // field fails here instead of throwing deep inside the wallet UI.
  const parsed = MintsResponseSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Malformed mints response')

  const items = parsed.data.data?.tsbTokenss?.items ?? []
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
      mintDate: item.mintedAt != null ? String(item.mintedAt) : null,
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
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['nft-mints', chainId, address?.toLowerCase() ?? null],
    queryFn: () => fetchMints(address as string, chainId),
    enabled: !!address,
    staleTime: 60 * 1000,
    retry: 1,
  })

  return {
    mints: data ?? [],
    isLoading,
    isFetching,
    isError,
    refetch,
  }
}
