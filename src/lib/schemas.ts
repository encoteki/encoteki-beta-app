import { z } from 'zod'

/**
 * Runtime schemas for data crossing a trust boundary (third-party APIs, GraphQL,
 * IPFS metadata). TypeScript types alone don't protect against malformed runtime
 * payloads — parse here so a missing/renamed field fails loudly at the edge
 * instead of throwing deep inside render.
 *
 * Schemas are intentionally lenient: per-field `.catch()`/`.nullish()` keep one
 * bad field from discarding an otherwise-usable record.
 */

// ── NFT mints (GraphQL: api.encoteki.com/graphql) ───────────────────────────

const RawMintItemSchema = z.object({
  tokenId: z.union([z.string(), z.number(), z.bigint()]),
  paymentToken: z.string().nullish(),
  status: z.union([z.string(), z.number()]).nullish(),
  statusDesc: z.string().nullish(),
  mintDate: z.string().nullish(),
})

export const MintsResponseSchema = z.object({
  data: z
    .object({
      mints: z
        .object({ items: z.array(RawMintItemSchema).nullish() })
        .nullish(),
    })
    .nullish(),
})

export type RawMintItem = z.infer<typeof RawMintItemSchema>

// ── Leaderboard (api.encoteki.com/leaderboard) ──────────────────────────────

export const LeaderboardUpstreamSchema = z.object({
  data: z
    .array(
      z.object({
        userAddress: z.string(),
        points: z.coerce.number().catch(0),
      }),
    )
    .nullish(),
  // Pagination shape is owned by the upstream; pass it through opaquely.
  pagination: z.unknown().nullish(),
})

// ── NFT metadata (tokenURI JSON, usually IPFS) ──────────────────────────────

export const NftMetadataSchema = z.object({
  name: z.string().nullish(),
  description: z.string().nullish(),
  image: z.string().nullish(),
  attributes: z
    .array(
      z.object({
        trait_type: z.string().catch(''),
        value: z.union([z.string(), z.number()]).catch(''),
      }),
    )
    .nullish(),
})

export type NftMetadata = z.infer<typeof NftMetadataSchema>

// ── Referral code (api.encoteki.com/users/:address/referralcode) ────────────

export const RefCodeResponseSchema = z.object({
  ref_code: z.string().nullish(),
})
