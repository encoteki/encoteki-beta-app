import { createClient } from '@/lib/supabase/client'
import { DaoRow } from '@/lib/supabase/database.types'
import { Address } from 'viem'

/**
 * Chain key to contract address field mapping
 */
export const CHAIN_CONTRACT_FIELDS = {
  BASE: 'ca_base',
  ARBITRUM: 'ca_arb',
  LISK: 'ca_lisk',
  MANTA: 'ca_manta',
} as const

export type ChainKey = keyof typeof CHAIN_CONTRACT_FIELDS

/**
 * Get the contract address for a specific chain from a DAO record
 */
export function getContractAddressForChain(
  dao: DaoRow,
  chainKey: ChainKey,
): Address | null {
  const field = CHAIN_CONTRACT_FIELDS[chainKey]
  const address = dao[field as keyof DaoRow] as string | null
  return address ? (address as Address) : null
}

/**
 * Get all contract addresses for a DAO keyed by chain
 */
export function getAllContractAddresses(
  dao: DaoRow,
): Record<ChainKey, Address | null> {
  return {
    BASE: dao.ca_base as Address | null,
    ARBITRUM: dao.ca_arb as Address | null,
    LISK: dao.ca_lisk as Address | null,
    MANTA: dao.ca_manta as Address | null,
  }
}

/**
 * Fetch all DAOs from Supabase
 */
export async function fetchAllDaos(): Promise<DaoRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dao')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAO Service] Error fetching DAOs:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch DAOs filtered by dao_type
 */
export async function fetchDaosByType(daoTypeId: number): Promise<DaoRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dao')
    .select('*')
    .eq('dao_type', daoTypeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAO Service] Error fetching DAOs by type:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch active DAOs (where end_date is in the future or null)
 */
export async function fetchActiveDaos(): Promise<DaoRow[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dao')
    .select('*')
    .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAO Service] Error fetching active DAOs:', error)
    throw error
  }

  return data || []
}

/**
 * Fetch a single DAO by dao_id
 */
export async function fetchDaoById(daoId: number): Promise<DaoRow | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('dao')
    .select('*')
    .eq('dao_id', daoId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('[DAO Service] Error fetching DAO by ID:', error)
    throw error
  }

  return data
}

/**
 * Fetch a single DAO by code (using proposal_id or id)
 */
export async function fetchDaoByCode(code: string): Promise<DaoRow | null> {
  const supabase = createClient()

  // Try to parse as numeric ID first
  const numericCode = parseInt(code, 10)

  let query = supabase.from('dao').select('*')

  if (!isNaN(numericCode)) {
    // Search by dao_id if code is numeric
    query = query.eq('dao_id', numericCode)
  } else {
    // Search by dao_name if code is a string (case insensitive)
    query = query.ilike('dao_name', code)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('[DAO Service] Error fetching DAO by code:', error)
    throw error
  }

  return data
}

/**
 * Get DAOs that have a contract address on a specific chain
 */
export async function fetchDaosByChain(chainKey: ChainKey): Promise<DaoRow[]> {
  const supabase = createClient()
  const field = CHAIN_CONTRACT_FIELDS[chainKey]

  const { data, error } = await supabase
    .from('dao')
    .select('*')
    .not(field, 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DAO Service] Error fetching DAOs by chain:', error)
    throw error
  }

  return data || []
}
