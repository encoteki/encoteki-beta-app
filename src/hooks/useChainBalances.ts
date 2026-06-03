'use client'

import { useCallback } from 'react'
import { useBalance, useReadContracts } from 'wagmi'
import { formatUnits } from 'viem'
import { getPaymentMethods, Token } from '@/constants/contracts/tsb'

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

export type TokenWithBalance = Token & {
  balance: string
  rawBalance: bigint
  isLoading: boolean
}

export function useChainBalances(
  address: `0x${string}` | undefined,
  chainId: number,
): {
  tokens: TokenWithBalance[]
  isLoading: boolean
  isError: boolean
  refetch: () => void
} {
  const tokens = getPaymentMethods(chainId)
  const nativeToken = tokens.find((t) => t.isNative)
  const erc20Tokens = tokens.filter(
    (t) => !t.isNative && t.address !== ZERO_ADDRESS,
  )

  const {
    data: nativeData,
    isLoading: isNativeLoading,
    isError: isNativeError,
    refetch: refetchNative,
  } = useBalance({
    address,
    chainId,
    query: { enabled: !!address && !!nativeToken },
  })

  const erc20Contracts = erc20Tokens.map((token) => ({
    address: token.address as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: [address ?? ZERO_ADDRESS] as [`0x${string}`],
    chainId,
  }))

  const {
    data: erc20Data,
    isLoading: isERC20Loading,
    isError: isERC20Error,
    refetch: refetchERC20,
  } = useReadContracts({
    contracts: erc20Contracts,
    query: { enabled: !!address && erc20Contracts.length > 0 },
  })

  const refetch = useCallback(() => {
    refetchNative()
    refetchERC20()
  }, [refetchNative, refetchERC20])

  const result: TokenWithBalance[] = []

  if (nativeToken) {
    const raw = nativeData?.value ?? BigInt(0)
    result.push({
      ...nativeToken,
      balance: nativeData ? formatUnits(raw, nativeData.decimals) : '0',
      rawBalance: raw,
      isLoading: isNativeLoading,
    })
  }

  erc20Tokens.forEach((token, i) => {
    const entry = erc20Data?.[i]
    const raw =
      entry?.status === 'success' ? (entry.result as bigint) : BigInt(0)
    result.push({
      ...token,
      balance: formatUnits(raw, token.decimals),
      rawBalance: raw,
      isLoading: isERC20Loading,
    })
  })

  return {
    tokens: result,
    isLoading: isNativeLoading || isERC20Loading,
    isError: isNativeError || isERC20Error,
    refetch,
  }
}
