import Image from 'next/image'
import { useEffect, useRef } from 'react'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintCtx } from '../../contexts/mint.context'
import Hidden from '@/assets/mint/hidden.png'
import { Token, getChain, ResolvedChain } from '@/constants/contracts/tsb'
import { formatIDR } from '../../utils/format-balance.util'
import { MintStatus } from '../../enums/mint.enum'
import { MintButton } from '../../ui/buttons/mint-btn'
import { MockMintButton } from '../../ui/buttons/mock-mint-btn'
import { Address } from 'viem'
import { useConnection } from 'wagmi'

const IS_DEV = process.env.NODE_ENV === 'development'

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
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="text-left">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl leading-tight font-semibold tracking-tight text-neutral-10 focus:outline-none"
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

      <div className="grid gap-3">
        {IS_DEV ? (
          <MockMintButton />
        ) : (
          <MintButton
            tokenAddress={paymentMethod?.address as Address}
            price={paymentMethod?.cost?.toString() || '0'}
            referralCode={referralCode}
            targetContract={targetContract as Address}
            chainId={selectedChainId!}
          />
        )}
        <DefaultButton
          variant="secondary"
          onClick={() => setStatus(MintStatus.HOME)}
          classname="w-full"
        >
          Cancel
        </DefaultButton>
      </div>
    </div>
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
  chainConfig: ResolvedChain | null | undefined
  recipientAddress?: Address
}) => {
  return (
    <div className="flex w-full flex-col gap-6">
      {/* SEND */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-wider text-neutral-40 uppercase">
          You pay
        </span>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <figure className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-60 sm:h-12 sm:w-12">
              <Image
                src={item?.logo || ''}
                alt={item?.symbol || ''}
                fill
                sizes="48px"
                className="object-cover"
              />
            </figure>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-medium text-neutral-10 sm:text-base">
                {item?.symbol}
              </span>
              <span className="truncate text-xs text-neutral-40 sm:text-sm">
                On {chainConfig?.label}
              </span>
            </div>
          </div>
          <div className="shrink-0 pl-2 text-right">
            <span className="text-xl font-bold text-neutral-10 tabular-nums sm:text-2xl">
              {item?.symbol === 'IDRX'
                ? formatIDR(Number(item?.cost || 0))
                : item?.cost}
            </span>
          </div>
        </div>
      </div>

      {/* RECEIVE */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-wider text-neutral-40 uppercase">
          You receive
        </span>
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <figure className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl ring-1 ring-neutral-60 sm:h-12 sm:w-12">
              <Image
                src={Hidden}
                alt="TSB Beta — revealed after mint"
                fill
                sizes="48px"
                className="object-cover"
              />
            </figure>
            <div className="flex min-w-0 flex-col text-left">
              <span className="truncate text-sm font-semibold text-neutral-10 sm:text-base">
                The Satwas Band Beta
              </span>
              <span className="truncate text-xs text-neutral-40 sm:text-sm">
                Minted on {chainConfig?.label}
              </span>
            </div>
          </div>
          <div className="shrink-0 pl-2 text-right">
            <span className="text-xl font-bold text-primary-green sm:text-2xl">
              + 1 NFT
            </span>
          </div>
        </div>
      </div>

      {/* Recipient Address */}
      {recipientAddress && (
        <div className="mt-2 flex items-center justify-between rounded-xl bg-khaki-90 p-3 text-sm">
          <span className="text-neutral-40">Delivering to</span>
          <span className="font-mono text-neutral-10">
            {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
          </span>
        </div>
      )}
    </div>
  )
}
