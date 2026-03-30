import Image from 'next/image'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintCtx } from '../../contexts/mint.context'
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import Hidden from '@/assets/mint/hidden.png'
import { Token } from '@/constants/contracts/tsb'
import { formatIDR } from '../../utils/format-balance.util'
import { MintStatus } from '../../enums/mint.enum'
import { MintButton } from '../../ui/buttons/mint-btn'
import { Address } from 'viem'

export default function ReviewTransaction() {
  const {
    paymentMethod,
    setStatus,
    targetContract,
    isCrossChain,
    referralCode,
  } = useMintCtx()

  return (
    <>
      <div className="text-left">
        <h3 className="font-medium">Review Transaction</h3>
        <p className="text-sm text-neutral-400">
          Please review your transaction details.
        </p>
      </div>

      <TransactionCard
        item={paymentMethod!}
        isCrossChain={isCrossChain}
        referralCode={referralCode}
      />

      <div className="flex w-full flex-col gap-1">
        {/* Total */}
        <div className="flex w-full justify-between">
          <p className="font-medium">Total</p>
          <p className="font-medium">
            {paymentMethod?.symbol === 'IDRX'
              ? formatIDR(Number(paymentMethod?.cost))
              : paymentMethod?.cost}{' '}
            {paymentMethod?.symbol}
          </p>
        </div>

        {isCrossChain && (
          <div className="flex w-full items-center justify-between text-xs text-neutral-40">
            <span className="flex items-center gap-1">
              <Zap size={12} />
              LayerZero gas fee
            </span>
            <span>+ auto-quoted in ETH</span>
          </div>
        )}
      </div>

      <div className="grid gap-3">
        <MintButton
          tokenAddress={paymentMethod?.address as Address}
          price={paymentMethod?.cost?.toString() || '0'}
          referralCode={referralCode}
          targetContract={targetContract as Address}
        />
        <DefaultButton
          variant="secondary"
          onClick={() => setStatus(MintStatus.HOME)}
        >
          Cancel
        </DefaultButton>
      </div>
    </>
  )
}

const TransactionCard = ({
  item,
  isCrossChain,
  referralCode,
}: {
  item: Token | null
  isCrossChain: boolean
  referralCode?: string
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 rounded-2xl bg-gray-100 p-4 shadow-lg tablet:space-y-6">
        {/* SEND */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full">
                <Image
                  src={item?.logo || ''}
                  alt={item?.symbol || ''}
                  width={100}
                  height={100}
                />
              </div>
              <div className="absolute -right-1 -bottom-1 rounded-full border border-[#18191f] bg-white p-0.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-green">
                  <ArrowRight size={10} className="text-white" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-tight font-medium">Send</span>
              <span className="text-sm font-medium text-gray-500">
                {item?.symbol}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium">
              -{' '}
              {item?.symbol === 'IDRX'
                ? formatIDR(Number(item.cost))
                : item?.cost}{' '}
              {item?.symbol}
            </span>
          </div>
        </div>

        {/* RECEIVE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 overflow-hidden rounded-xl">
                <Image src={Hidden} alt="hidden" width={999} height={999} />
              </div>
              <div className="absolute -right-1 -bottom-1 rounded-full border border-[#18191f] bg-white p-0.5">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-green">
                  <ArrowLeft size={10} className="text-white" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg leading-tight font-medium">Receive</span>
              <span className="text-sm font-medium text-gray-500">NFT</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium">1 NFT TSB</span>
            {isCrossChain && (
              <span className="text-xs text-neutral-40">via LayerZero</span>
            )}
          </div>
        </div>

        {/* Cross-chain info banner */}
        {isCrossChain && (
          <div className="rounded-lg bg-blue-10/50 px-3 py-2">
            <p className="text-xs text-blue-90">
              This is a cross-chain mint. After your transaction confirms,
              LayerZero will deliver it to the hub chain. You can safely close
              this page — your mint will complete in the background.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
