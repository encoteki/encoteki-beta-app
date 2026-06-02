import Image from 'next/image'
import { memo, useCallback, useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
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

  const controls = useAnimation()

  useEffect(() => {
    if (isActive) {
      controls.start({
        scale: [1, 1.025, 1],
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
      })
    }
  }, [isActive, controls])

  return (
    <motion.button
      animate={controls}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleClick}
      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-1 focus-visible:ring-offset-white sm:p-4 ${
        isActive
          ? 'border-primary-green bg-green-90 shadow-sm'
          : 'border-neutral-60 bg-white hover:border-neutral-40/30 hover:bg-khaki-90'
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
          <span className="truncate text-small font-semibold text-neutral-10 sm:text-body">
            {item.symbol}
          </span>
          <span className="truncate text-caption text-neutral-40">
            {item.name}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 pl-2 text-right">
        <span className="text-body font-bold text-neutral-10 tabular-nums sm:text-h3">
          {item.symbol === 'IDRX'
            ? new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(Number(item.cost))
            : item.cost}
        </span>
        <div
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
            isActive
              ? 'bg-primary-green'
              : 'border border-neutral-60 bg-transparent'
          }`}
        >
          {isActive && (
            <svg
              className="h-2.5 w-2.5 text-white"
              viewBox="0 0 10 10"
              fill="none"
            >
              <path
                d="M2 5l2.5 2.5L8 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  )
})
