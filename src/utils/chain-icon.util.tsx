import { StaticImageData } from 'next/image'
import BaseIcon from '@/assets/chains/base.jpeg'
import ArbitrumIcon from '@/assets/chains/arbitrum.svg'
import LiskIcon from '@/assets/chains/lisk.webp'
import MantaIcon from '@/assets/chains/manta.png'

const CHAIN_ICONS: Record<string, StaticImageData> = {
  BASE: BaseIcon,
  ARBITRUM: ArbitrumIcon,
  LISK: LiskIcon,
  MANTA: MantaIcon,
}

export function getChainIcon(chainKey: string): StaticImageData | null {
  return CHAIN_ICONS[chainKey] ?? null
}
