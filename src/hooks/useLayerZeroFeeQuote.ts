import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { Address } from 'viem'
import { tsbSatelliteABI } from '@/constants/abis/tsbSatellite.abi'

const ZERO = BigInt(0)

interface UseLayerZeroFeeQuoteProps {
  isHub: boolean
  targetContract?: Address | null
  chainId: number
  userAddress?: Address
  referralCode?: string
}

/**
 * Quotes the LayerZero native-currency fee for a Satellite mint (Hub mints
 * are local — no cross-chain round-trip, so the fee is always zero there).
 * Buffered 15% to absorb drift between quote and inclusion — overshoot is
 * refunded on-chain, undershoot reverts the whole tx with
 * TSBShared__InsufficientMsgValue. Shared by useMintTransaction (to build
 * msg.value) and the review screen (to display the fee) so both always agree.
 */
export function useLayerZeroFeeQuote({
  isHub,
  targetContract,
  chainId,
  userAddress,
  referralCode,
}: UseLayerZeroFeeQuoteProps) {
  const {
    data: rawFee,
    error: quoteError,
    isError: isQuoteError,
  } = useReadContract({
    chainId,
    address: !isHub ? (targetContract ?? undefined) : undefined,
    abi: tsbSatelliteABI,
    functionName: 'quoteLayerZeroFee',
    args: [userAddress as Address, referralCode || ''],
    query: {
      enabled: !isHub && !!userAddress && !!targetContract && !!chainId,
      staleTime: 15_000,
      refetchInterval: 15_000,
    },
  })

  const bufferedFee = useMemo(() => {
    if (isHub || rawFee === undefined) return ZERO
    return (rawFee * BigInt(115)) / BigInt(100)
  }, [isHub, rawFee])

  return {
    rawFee: rawFee as bigint | undefined,
    bufferedFee,
    // Hub never has a fee to wait on; Satellite is "loaded" once the quote lands.
    isLoaded: isHub || rawFee !== undefined,
    // Distinct from "still loading" — a reverting/failing quote (e.g. the
    // satellite contract isn't deployed or its GMC_EID isn't configured yet
    // on this chain) must not look identical to "still calculating" forever.
    isError: isQuoteError,
    error: quoteError,
  }
}
