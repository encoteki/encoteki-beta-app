import { StaticImageData } from 'next/image'
import { Abi, Address, Hex } from 'viem'
import { tsbhub_abi, tsbsatellite_abi } from './abi'

import ETHIcon from '@/assets/icons/tokens/eth.webp'
import IDRXIcon from '@/assets/icons/tokens/idrx.webp'
import LSKIcon from '@/assets/icons/tokens/lisk.webp'
import USDCIcon from '@/assets/icons/tokens/usdc.png'
import USDTIcon from '@/assets/icons/tokens/tether.svg'
import ARBIcon from '@/assets/icons/tokens/arb.svg'
import MANTAIcon from '@/assets/icons/tokens/manta.png'

// ============================================
// ENVIRONMENT
// ============================================

const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || 'development'
export const IS_PRODUCTION = APP_ENV === 'production'

// ============================================
// TOKEN TYPES
// ============================================

export type TokenSymbol =
  | 'ETH'
  | 'USDC'
  | 'USDT'
  | 'IDRX'
  | 'LSK'
  | 'ARB'
  | 'MANTA'

// Static data (Name, Logo, Decimals)
export interface TokenMetadata {
  symbol: TokenSymbol
  name: string
  decimals: number
  logo: StaticImageData
  isNative?: boolean
}

// Full object used by UI (includes Cost + Chain Data)
export interface Token extends TokenMetadata {
  cost: number
  address: Hex
  chainId: number
}

// ============================================
// MINT PRICING
// ============================================
export const MINT_PRICES: Record<TokenSymbol, number> = {
  ETH: process.env.NEXT_PUBLIC_MINT_PRICE_ETH
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_ETH)
    : 0.0001,
  LSK: process.env.NEXT_PUBLIC_MINT_PRICE_LSK
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_LSK)
    : 40,
  ARB: process.env.NEXT_PUBLIC_MINT_PRICE_ARB
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_ARB)
    : 5,
  MANTA: process.env.NEXT_PUBLIC_MINT_PRICE_MANTA
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_MANTA)
    : 300,
  USDC: process.env.NEXT_PUBLIC_MINT_PRICE_USDC
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_USDC)
    : 0.2,
  USDT: process.env.NEXT_PUBLIC_MINT_PRICE_USDT
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_USDT)
    : 0.2,
  IDRX: process.env.NEXT_PUBLIC_MINT_PRICE_IDRX
    ? parseFloat(process.env.NEXT_PUBLIC_MINT_PRICE_IDRX)
    : 300000,
}

// ============================================
// TOKEN METADATA
// ============================================

const TOKEN_META: Record<TokenSymbol, TokenMetadata> = {
  ETH: {
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    logo: ETHIcon,
    isNative: true,
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: USDCIcon,
    isNative: false,
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: USDTIcon,
    isNative: false,
  },
  IDRX: {
    symbol: 'IDRX',
    name: 'IDR Token',
    decimals: 2,
    logo: IDRXIcon,
    isNative: false,
  },
  LSK: {
    symbol: 'LSK',
    name: 'Lisk',
    decimals: 18,
    logo: LSKIcon,
    isNative: false,
  },
  ARB: {
    symbol: 'ARB',
    name: 'Arbitrum',
    decimals: 18,
    logo: ARBIcon,
    isNative: false,
  },
  MANTA: {
    symbol: 'MANTA',
    name: 'Manta Token',
    decimals: 18,
    logo: MANTAIcon,
    isNative: false,
  },
}

// ============================================
// CHAIN CONFIGURATION — SINGLE SOURCE OF TRUTH
// ============================================
//
// To add a new chain:
//   1. Add ONE entry to the CHAINS array below.
//   2. Done — contracts, ABIs, explorers, tokens, and UI are all derived.
//
// ABI is auto-resolved: hub → tsbhub_abi, satellite → tsbsatellite_abi.
// Accepted tokens are dynamically determined based on provided env addresses.
//

const ZERO_ADDRESS: Hex = '0x0000000000000000000000000000000000000000'

interface ChainDef {
  key: string
  label: string
  type: 'hub' | 'satellite'
  enabled: boolean
  chainId: number
  contract: Address
  explorer: string
  tokenAddresses: Partial<Record<TokenSymbol, Address>>
}

// Helper to filter accepted tokens based on available addresses
function getAcceptedTokens(
  tokenAddresses: Partial<Record<TokenSymbol, Address>>,
): TokenSymbol[] {
  return Object.entries(tokenAddresses)
    .filter(([_, address]) => address && address !== '0x')
    .map(([symbol]) => symbol as TokenSymbol)
}

// DEFINE HERE - Using mainnet configs (currently in production)
const CHAINS: ChainDef[] = [
  {
    key: 'BASE',
    label: 'Base',
    type: 'hub',
    enabled: !!process.env.NEXT_PUBLIC_TSB_BASE_CONTRACT,
    chainId: 8453,
    contract: process.env.NEXT_PUBLIC_TSB_BASE_CONTRACT as Address,
    explorer: 'https://basescan.org/tx/',
    tokenAddresses: {
      ETH: ZERO_ADDRESS,
      USDC: process.env.NEXT_PUBLIC_BASE_USDC_ADDRESS as Address,
      IDRX: process.env.NEXT_PUBLIC_BASE_IDRX_ADDRESS as Address,
    },
  },
  {
    key: 'ARBITRUM',
    label: 'Arbitrum',
    type: 'satellite',
    enabled: !!process.env.NEXT_PUBLIC_TSB_ARBITRUM_CONTRACT,
    chainId: 42161,
    contract: process.env.NEXT_PUBLIC_TSB_ARBITRUM_CONTRACT as Address,
    explorer: 'https://arbiscan.io/tx/',
    tokenAddresses: {
      ETH: ZERO_ADDRESS,
      ARB: process.env.NEXT_PUBLIC_ARBITRUM_NATIVE_ADDRESS as Address,
      USDC: process.env.NEXT_PUBLIC_ARBITRUM_USDC_ADDRESS as Address,
      USDT: process.env.NEXT_PUBLIC_ARBITRUM_USDT_ADDRESS as Address,
    },
  },
  {
    key: 'LISK',
    label: 'Lisk',
    type: 'satellite',
    enabled: !!process.env.NEXT_PUBLIC_TSB_LISK_CONTRACT,
    chainId: 1135,
    contract: process.env.NEXT_PUBLIC_TSB_LISK_CONTRACT as Address,
    explorer: 'https://blockscout.lisk.com/tx/',
    tokenAddresses: {
      ETH: ZERO_ADDRESS,
      LSK: process.env.NEXT_PUBLIC_LISK_NATIVE_ADDRESS as Address,
      USDT: process.env.NEXT_PUBLIC_LISK_USDT_ADDRESS as Address,
      IDRX: process.env.NEXT_PUBLIC_LISK_IDRX_ADDRESS as Address,
    },
  },
  {
    key: 'MANTA',
    label: 'Manta',
    type: 'satellite',
    enabled: !!process.env.NEXT_PUBLIC_TSB_MANTA_CONTRACT,
    chainId: 169,
    contract: process.env.NEXT_PUBLIC_TSB_MANTA_CONTRACT as Address,
    explorer: 'https://pacific-explorer.manta.network/tx/',
    tokenAddresses: {
      ETH: ZERO_ADDRESS,
      MANTA: process.env.NEXT_PUBLIC_MANTA_NATIVE_ADDRESS as Address,
      USDT: process.env.NEXT_PUBLIC_MANTA_USDT_ADDRESS as Address,
      USDC: process.env.NEXT_PUBLIC_MANTA_USDC_ADDRESS as Address,
    },
  },
]

// ============================================
// RESOLVED CHAIN — Flattened for the active environment
// ============================================

export interface ResolvedChain {
  key: string
  label: string
  type: 'hub' | 'satellite'
  enabled: boolean
  chainId: number
  contract: Address
  explorer: string
  abi: Abi
  isHub: boolean
  acceptedTokens: TokenSymbol[]
}

function resolve(def: ChainDef): ResolvedChain {
  return {
    key: def.key,
    label: def.label,
    type: def.type,
    enabled: def.enabled,
    chainId: def.chainId,
    contract: def.contract,
    explorer: def.explorer,
    abi: def.type === 'hub' ? (tsbhub_abi as Abi) : (tsbsatellite_abi as Abi),
    isHub: def.type === 'hub',
    acceptedTokens: getAcceptedTokens(def.tokenAddresses),
  }
}

// Pre-computed lookup tables (built once at module load)
const ALL_RESOLVED: ResolvedChain[] = CHAINS.map(resolve)
const BY_CHAIN_ID = new Map<number, ResolvedChain>(
  ALL_RESOLVED.map((c) => [c.chainId, c]),
)
const BY_KEY = new Map<string, ResolvedChain>(
  ALL_RESOLVED.map((c) => [c.key, c]),
)
const TOKEN_ADDRS = new Map<number, Partial<Record<TokenSymbol, Address>>>(
  CHAINS.map((def) => [def.chainId, def.tokenAddresses]),
)

// ============================================
// PUBLIC API — Use these in your components and hooks
// ============================================

/** Look up a resolved chain by its active chain ID */
export const getChain = (chainId: number): ResolvedChain | undefined =>
  BY_CHAIN_ID.get(chainId)

/** Look up a resolved chain by key (e.g. 'BASE', 'ARBITRUM') */
export const getChainByKey = (key: string): ResolvedChain | undefined =>
  BY_KEY.get(key)

/**
 * Get the active chain ID for a chain key.
 *
 * Usage: getChainId('BASE') → 8453
 */
export const getChainId = (key: string): number => {
  const chain = BY_KEY.get(key)
  if (!chain) throw new Error(`[ChainConfig] Unknown chain key: ${key}`)
  return chain.chainId
}

/** Only enabled chains (for mint UI) */
export const getEnabledChains = (): ResolvedChain[] =>
  ALL_RESOLVED.filter((c) => c.enabled)

/** All chains including disabled (for dropdown "coming soon") */
export const getAllChains = (): ResolvedChain[] => ALL_RESOLVED

/** Is this chain ID a hub chain (direct mint)? */
export const isHubChain = (chainId: number): boolean =>
  getChain(chainId)?.isHub ?? false

/** Get the contract address for a chain */
export const getContract = (chainId: number): Address | undefined =>
  getChain(chainId)?.contract

/** Get the ABI for a chain (hub → tsbhub_abi, satellite → tsbsatellite_abi) */
export const getAbi = (chainId: number): Abi | undefined =>
  getChain(chainId)?.abi

/** Get the block explorer base URL for a chain */
export const getExplorerUrl = (chainId: number): string | undefined =>
  getChain(chainId)?.explorer

/** Get available payment tokens for a chain */
export const getPaymentMethods = (chainId: number): Token[] => {
  const chain = getChain(chainId)
  if (!chain) return []

  const addrs = TOKEN_ADDRS.get(chainId) || {}

  return chain.acceptedTokens.map((symbol) => ({
    ...TOKEN_META[symbol],
    cost: MINT_PRICES[symbol],
    chainId: chain.chainId,
    address: (addrs[symbol] || ZERO_ADDRESS) as Hex,
  }))
}

// ============================================
// LEGACY — Raw chain IDs (prefer getChainId() for env-safe usage)
// ============================================

export const CHAIN_IDS = {
  BASE: { MAINNET: 8453, SEPOLIA: 84532 },
  LISK: { MAINNET: 1135, SEPOLIA: 4202 },
  ARBITRUM: { ONE: 42161, SEPOLIA: 421614 },
  MANTA: { PACIFIC: 169, TESTNET: 3441006 },
} as const
