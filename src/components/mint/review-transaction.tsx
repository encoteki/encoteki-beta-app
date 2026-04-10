import Image from 'next/image'
import { useEffect, useRef } from 'react'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintCtx } from '../../contexts/mint.context'
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
      <div className="mb-2 text-left">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold tracking-tight text-foreground focus:outline-none"
        >
          Confirm mint
        </h2>
      </div>

      <TransactionCard
        item={paymentMethod!}
        isCrossChain={isCrossChain}
        referralCode={referralCode}
        chainConfig={chainConfig}
        recipientAddress={recipientAddress}
      />

      <div className="grid gap-3 pt-2">
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
    <div className="flex w-full flex-col gap-6">
      {/* SEND */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
          You pay
        </span>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <figure className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border sm:h-12 sm:w-12">
              <Image
                src={item?.logo || ''}
                alt={item?.symbol || ''}
                fill
                sizes="48px"
                className="object-cover"
              />
            </figure>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-medium text-foreground sm:text-base">
                {item?.symbol}
              </span>
              <span className="truncate text-xs text-muted-foreground sm:text-sm">
                On {chainConfig?.label}
              </span>
            </div>
          </div>
          <div className="shrink-0 pl-2 text-right">
            <span className="text-base font-semibold text-foreground sm:text-lg">
              {item?.symbol === 'IDRX'
                ? formatIDR(Number(item?.cost || 0))
                : item?.cost}
            </span>
          </div>
        </div>
      </div>

      {/* RECEIVE */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-wider text-muted-foreground/70 uppercase">
          You receive
        </span>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <figure className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-border sm:h-12 sm:w-12">
              <Image
                src={Hidden}
                alt="Target NFT Collection"
                fill
                sizes="48px"
                className="object-cover"
              />
            </figure>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-medium text-foreground sm:text-base">
                TSB Collection
              </span>
              <span className="truncate text-xs text-muted-foreground sm:text-sm">
                {isCrossChain ? 'Cross-chain delivery' : 'Direct mint'}
              </span>
            </div>
          </div>
          <div className="shrink-0 pl-2 text-right">
            <span className="text-base font-semibold text-chart-2 sm:text-lg">
              + 1 NFT
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Address */}
      {recipientAddress && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Delivering to</span>
          <span className="font-mono text-foreground">
            {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
          </span>
        </div>
      )}
    </div>
  )
}
