import Image from 'next/image'
import { useEffect, useRef } from 'react'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintCtx } from '../../contexts/mint.context'
import { ArrowRight, ArrowLeft, Zap } from 'lucide-react'
import Hidden from '@/assets/mint/hidden.png'
import { Token, getChain } from '@/constants/contracts/tsb'
import { formatIDR } from '../../utils/format-balance.util'
import { MintStatus } from '../../enums/mint.enum'
import { MintButton } from '../../ui/buttons/mint-btn'
import { Address } from 'viem'
import { useConnection } from 'wagmi'

export default function ReviewTransaction() {
  const {
    paymentMethod,
    setStatus,
    targetContract,
    isCrossChain,
    referralCode,
    selectedChainId,
  } = useMintCtx()

  const { address: recipientAddress } = useConnection()
  const chainConfig = selectedChainId ? getChain(selectedChainId) : null
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="space-y-1 text-left">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-semibold tracking-tight text-foreground focus:outline-none"
        >
          Review Transaction
        </h2>
      </div>

      <TransactionCard
        item={paymentMethod!}
        isCrossChain={isCrossChain}
        referralCode={referralCode}
        chainConfig={chainConfig}
        recipientAddress={recipientAddress}
      />

      <div className="flex w-full flex-col gap-4">
        {/* Total */}
        <div className="flex w-full items-center justify-between border-t border-border pt-4">
          <span className="font-medium text-muted-foreground">Total</span>
          <span className="text-lg font-semibold text-foreground">
            {paymentMethod?.symbol === 'IDRX'
              ? formatIDR(Number(paymentMethod?.cost))
              : paymentMethod?.cost}{' '}
            {paymentMethod?.symbol}
          </span>
        </div>
      </div>

      <div className="grid gap-3 pt-4">
        <MintButton
          tokenAddress={paymentMethod?.address as Address}
          price={paymentMethod?.cost?.toString() || '0'}
          referralCode={referralCode}
          targetContract={targetContract as Address}
        />
        <DefaultButton
          variant="secondary"
          onClick={() => setStatus(MintStatus.HOME)}
          classname="w-full"
        >
          Cancel
        </DefaultButton>
      </div>
    </main>
  )
}

const TransactionCard = ({
  item,
  isCrossChain,
  chainConfig,
  recipientAddress,
}: {
  item: Token | null
  isCrossChain: boolean
  referralCode?: string
  chainConfig: any
  recipientAddress?: Address
}) => {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full space-y-5 sm:p-2">
        {/* SEND */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <figure className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                <Image
                  src={item?.logo || ''}
                  alt={item?.symbol || ''}
                  fill
                  className="object-cover"
                />
              </figure>
              <div className="absolute -right-1 -bottom-1 rounded-full border border-background bg-background p-0.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive shadow-sm">
                  <ArrowRight
                    strokeWidth={3}
                    size={12}
                    className="text-destructive-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Send
              </span>
              <span className="text-base font-medium text-foreground">
                {item?.symbol}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-lg font-semibold text-foreground">
              -{' '}
              {item?.symbol === 'IDRX'
                ? formatIDR(Number(item.cost))
                : item?.cost}{' '}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {item?.symbol}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="w-full border-t border-dashed border-border"></div>
        </div>

        {/* RECEIVE */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <figure className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted ring-1 ring-border">
                <Image
                  src={Hidden}
                  alt="Target NFT Collection Placeholder"
                  fill
                  className="object-cover"
                />
              </figure>
              <div className="absolute -right-1 -bottom-1 rounded-full border border-background bg-background p-0.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-chart-2 shadow-sm">
                  <ArrowLeft
                    strokeWidth={3}
                    size={12}
                    className="text-primary-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                Receive
              </span>
              <span className="text-base font-medium text-foreground">NFT</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-lg font-semibold text-chart-2">+ 1 NFT</span>
            <span className="text-sm font-medium text-muted-foreground">
              TSB Collection
            </span>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 border-t border-border pt-4">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Transaction Details
          </h4>

          {/* Recipient Address */}
          {recipientAddress && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Recipient</span>
              <span className="rounded border border-border bg-muted/50 px-2 py-0.5 font-mono font-medium text-foreground">
                {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
              </span>
            </div>
          )}

          {/* Fee Estimate */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium text-foreground">
              {chainConfig ? chainConfig.label : ''}
            </span>
          </div>

          {/* Cross-chain note */}
          {isCrossChain && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="flex items-center gap-1.5 font-medium text-chart-3">
                <Zap size={14} className="fill-chart-3 text-chart-3" />{' '}
                LayerZero
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
