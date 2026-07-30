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

// ── NFT tokens (GraphQL: {API_BASE_URL}/graphql, tsb_tokens table) ──────────

const RawMintItemSchema = z.object({
  tokenId: z.union([z.string(), z.number(), z.bigint()]),
  mintedAt: z.union([z.string(), z.number()]).nullish(),
})

export const MintsResponseSchema = z.object({
  data: z
    .object({
      tsbTokenss: z
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

// ── Proposals (api.encoteki.com/proposals) ──────────────────────────────────

const TimeRemainingSchema = z.object({
  days: z.number().catch(0),
  hours: z.number().catch(0),
  minutes: z.number().catch(0),
  seconds: z.number().catch(0),
})

const ProposalListItemSchema = z.object({
  proposalId: z.string(),
  proposalType: z.number().catch(0),
  proposalName: z.string(),
  votingEnds: z.string(),
  timeRemaining: TimeRemainingSchema,
})

export const ProposalsUpstreamSchema = z.object({
  data: z.array(ProposalListItemSchema).nullish(),
  // Pagination shape is owned by the upstream; pass it through opaquely.
  pagination: z.unknown().nullish(),
})

const ProposalOptionSchema = z.object({
  index: z.number(),
  label: z.string(),
})

const ProposalDeploymentSchema = z.object({
  chainId: z.string(),
  contractAddress: z.string(),
})

export const ProposalDetailSchema = ProposalListItemSchema.extend({
  description: z.string().catch(''),
  options: z.array(ProposalOptionSchema).catch([]),
  deployments: z.array(ProposalDeploymentSchema).catch([]),
})

// ── Proposal description content (fetched from IPFS when `description` is an
// `ipfs://` URI rather than inline text) ────────────────────────────────────

export const ProposalIpfsContentSchema = z.object({
  description: z.string().nullish(),
})
