import Image from 'next/image'
import { memo, useCallback } from 'react'
import { Token } from '@/constants/contracts/tsb'
import { formatIDR } from '../../utils/format-balance.util'

interface PaymentCardProps {
  item: Token
  isActive: boolean
  idx: number
  onSelect: (idx: number) => void
}

export const PaymentCard = memo(function PaymentCard({
  item,
  isActive,
  idx,
  onSelect,
}: PaymentCardProps) {
  const handleClick = useCallback(() => {
    onSelect(idx)
  }, [idx, onSelect])

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background active:scale-[0.98] sm:p-4 ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <figure className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
          <Image
            src={item.logo}
            alt={item.name}
            width={40}
            height={40}
            className="object-cover"
          />
        </figure>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground sm:text-base">
            {item.symbol}
          </span>
          <span className="truncate text-[11px] text-muted-foreground sm:text-xs">
            {item.name}
          </span>
        </div>
      </div>

      <div className="shrink-0 pl-2 text-right">
        <span className="text-base font-semibold text-foreground sm:text-lg">
          {item.symbol === 'IDRX'
            ? new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(item.cost))
            : item.cost}
        </span>
      </div>
    </button>
  )
})
