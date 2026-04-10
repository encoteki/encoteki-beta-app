import Image from 'next/image'
import { Token } from '@/constants/contracts/tsb'
import { formatIDR } from '../../utils/format-balance.util'

interface PaymentCardProps {
  item: Token
  isActive: boolean
  onClick: () => void
}

export const PaymentCard = ({ item, isActive, onClick }: PaymentCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center justify-between rounded-xl border p-3 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 tablet:p-4 ${
        isActive
          ? 'border-primary bg-primary/5 ring-1 ring-primary/50'
          : 'border-border bg-background hover:border-ring hover:bg-muted/50'
      }`}
    >
      <div className="flex flex-1 flex-col items-start gap-1">
        <div className="flex items-center gap-3">
          <figure
            className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 transition-colors ${isActive ? 'ring-primary/50' : 'ring-border group-hover:ring-ring/50'}`}
          >
            <Image
              src={item.logo}
              alt={item.name}
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </figure>
          <div className="flex flex-col text-left">
            <span
              className={`text-base font-semibold transition-colors ${isActive ? 'text-primary' : 'text-foreground'}`}
            >
              {item.symbol}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {item.name}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-end justify-center gap-0.5 text-right">
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-bold tracking-tight text-foreground">
            {item.symbol === 'IDRX' ? formatIDR(Number(item.cost)) : item.cost}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {item.symbol}
          </span>
        </div>
      </div>
    </button>
  )
}
