import { StaticImageData } from 'next/image'
import BaseIcon from '@/assets/chains/base.jpeg'
import ArbitrumIcon from '@/assets/chains/arbitrum.svg'
import LiskIcon from '@/assets/chains/lisk.webp'
import MantaIcon from '@/assets/chains/manta.png'
import EthereumIcon from '@/assets/chains/ethereum.svg'
import RobinhoodIcon from '@/assets/chains/robinhood.svg'
import MonadIcon from '@/assets/chains/monad.svg'

const CHAIN_ICONS: Record<string, StaticImageData> = {
  BASE: BaseIcon,
  ARBITRUM: ArbitrumIcon,
  LISK: LiskIcon,
  MANTA: MantaIcon,
  ETHEREUM: EthereumIcon,
  ROBINHOOD: RobinhoodIcon,
  MONAD: MonadIcon,
}

export function getChainIcon(chainKey: string): StaticImageData | null {
  return CHAIN_ICONS[chainKey] ?? null
}
