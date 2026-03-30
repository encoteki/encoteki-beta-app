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
      className={`flex items-center justify-between rounded-2xl border p-2 transition-all duration-200 tablet:p-3 ${
        isActive
          ? `border-primary-green bg-primary-green/7`
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex flex-1 flex-col items-start gap-1">
        <div className="flex items-center gap-2 font-medium tablet:gap-3">
          <Image
            src={item.logo}
            alt={item.name}
            width={25}
            height={25}
            className="size-6.25 rounded-full object-cover"
          />
          <p className="text-base text-gray-900 tablet:text-lg">
            {item.symbol}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-end justify-end gap-2 text-right">
        <p className="font-medium text-gray-900">
          {item.symbol === 'IDRX' ? formatIDR(Number(item.cost)) : item.cost}
        </p>
        <p className="text-sm text-gray-500">{item.symbol || item.name}</p>
      </div>
    </button>
  )
}
