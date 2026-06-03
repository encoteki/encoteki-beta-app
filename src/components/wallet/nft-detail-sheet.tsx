'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Copy, Check } from 'lucide-react'
import { useReadContracts } from 'wagmi'
import { getPaymentMethods } from '@/constants/contracts/tsb'
import { type MintItem } from '@/hooks/useNftMints'
import HiddenNFT from '@/assets/mint/hidden.png'

// ── ABIs (minimal) ─────────────────────────────────────────────────────────

const TOKEN_ABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

// ── Helpers ─────────────────────────────────────────────────────────────────

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? `https://${process.env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/`
  : 'https://ipfs.io/ipfs/'

function resolveUri(uri: string): string {
  if (uri.startsWith('ipfs://')) return uri.replace('ipfs://', GATEWAY)
  return uri
}

function resolvePaymentSymbol(paymentToken: string, chainId: number): string {
  const tokens = getPaymentMethods(chainId)
  const match = tokens.find(
    (t) => t.address.toLowerCase() === paymentToken.toLowerCase(),
  )
  return (
    match?.symbol ?? `${paymentToken.slice(0, 6)}…${paymentToken.slice(-4)}`
  )
}

function formatMintDate(mintDate: string | null): string | null {
  if (!mintDate) return null
  const asNum = Number(mintDate)
  const d =
    !isNaN(asNum) && mintDate.trim() !== ''
      ? new Date(asNum < 1e10 ? asNum * 1000 : asNum)
      : new Date(mintDate)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function explorerUrl(
  chainId: number,
  contract: string,
  tokenId: bigint,
): string {
  const id = tokenId.toString()
  switch (chainId) {
    case 8453:
      return `https://basescan.org/nft/${contract}/${id}`
    case 42161:
      return `https://arbiscan.io/nft/${contract}/${id}`
    case 1135:
      return `https://blockscout.lisk.com/token/${contract}/instance/${id}`
    case 169:
      return `https://pacific-explorer.manta.network/token/${contract}/instance/${id}`
    default:
      return ''
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface NftMeta {
  name?: string
  description?: string
  image?: string
  attributes?: { trait_type: string; value: string | number }[]
}

interface NftDetailSheetProps {
  tokenId: bigint
  chainId: number
  chainLabel: string
  contractAddress: `0x${string}`
  mintInfo?: MintItem
  onBack: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NftDetailSheet({
  tokenId,
  chainId,
  chainLabel,
  contractAddress,
  mintInfo,
  onBack,
}: NftDetailSheetProps) {
  const shouldReduceMotion = useReducedMotion()

  const [meta, setMeta] = useState<NftMeta | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [metaError, setMetaError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [copiedContract, setCopiedContract] = useState(false)

  const copyContract = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setCopiedContract(true)
      setTimeout(() => setCopiedContract(false), 2000)
    } catch {}
  }, [contractAddress])

  const { data, isLoading: isContractLoading } = useReadContracts({
    contracts: [
      {
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
        chainId,
      },
      {
        address: contractAddress,
        abi: TOKEN_ABI,
        functionName: 'name',
        chainId,
      },
    ],
  })

  const tokenUri =
    data?.[0]?.status === 'success' ? (data[0].result as string) : undefined
  const collName =
    data?.[1]?.status === 'success'
      ? (data[1].result as string)
      : 'Tree Stewards'

  useEffect(() => {
    if (!tokenUri) return
    const controller = new AbortController()
    let active = true
    setFetchingMeta(true)
    setMeta(null)
    setMetaError(false)

    fetch(resolveUri(tokenUri), { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('response-not-ok')
        return r.json()
      })
      .then((json: NftMeta) => {
        if (active) setMeta(json)
      })
      .catch((err: unknown) => {
        if (active && (err as Error).name !== 'AbortError') setMetaError(true)
      })
      .finally(() => {
        if (active) setFetchingMeta(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [tokenUri, retryCount])

  const contractError = useMemo(
    () => !isContractLoading && !!data && data[0]?.status !== 'success',
    [isContractLoading, data],
  )
  const isLoading = isContractLoading || fetchingMeta
  const imageUrl = useMemo(
    () => (meta?.image ? resolveUri(meta.image) : null),
    [meta],
  )
  const displayName = useMemo(
    () => `${collName} #${tokenId.toString()}`,
    [collName, tokenId],
  )
  const mintDate = useMemo(
    () => formatMintDate(mintInfo?.mintDate ?? null),
    [mintInfo?.mintDate],
  )
  const paymentVia = useMemo(
    () =>
      mintInfo?.paymentToken
        ? resolvePaymentSymbol(mintInfo.paymentToken, chainId)
        : null,
    [mintInfo?.paymentToken, chainId],
  )
  const link = useMemo(
    () => explorerUrl(chainId, contractAddress, tokenId),
    [chainId, contractAddress, tokenId],
  )

  // Cascade entrance helpers — short delays so content arrives as the sheet settles
  const cascade = useCallback(
    (delay: number) => ({
      initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.3,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    }),
    [shouldReduceMotion],
  )

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 z-10 flex flex-col bg-khaki-99"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-khaki-70 px-6 py-5">
        <button
          onClick={onBack}
          aria-label="Back to collection"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-40 transition-colors hover:bg-khaki-80 hover:text-neutral-10 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </button>
        <div className="min-w-0">
          <p className="truncate text-small font-semibold text-neutral-10">
            {isContractLoading ? 'Loading…' : displayName}
          </p>
          <p className="text-caption text-neutral-40">{chainLabel}</p>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Image */}
        <motion.div
          {...cascade(0.1)}
          className="relative mx-6 mt-5 aspect-square overflow-hidden rounded-3xl ring-1 ring-khaki-70"
        >
          {isLoading ? (
            <div className="absolute inset-0 animate-pulse bg-khaki-70" />
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 640px) calc(100vw - 48px), 332px"
            />
          ) : (
            <Image
              src={HiddenNFT}
              alt={displayName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) calc(100vw - 48px), 332px"
            />
          )}
          <AnimatePresence>
            {(metaError || contractError) && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-neutral-10/60 py-3 backdrop-blur-sm"
              >
                <p className="text-caption text-white">
                  {contractError
                    ? "Couldn't reach the contract"
                    : "Couldn't load metadata"}
                </p>
                {!contractError && (
                  <button
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="inline-flex min-h-11 items-center px-4 text-caption font-medium text-white underline focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    Tap to retry
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Description — only when available */}
        {meta?.description && (
          <motion.p
            {...cascade(0.16)}
            className="px-6 pt-5 text-small leading-relaxed text-pretty text-neutral-40"
          >
            {meta.description}
          </motion.p>
        )}

        {/* Info table */}
        <motion.dl
          {...cascade(0.22)}
          className="mx-6 mt-5 divide-y divide-khaki-70 border-y border-khaki-70"
        >
          <Row label="Token ID">
            <span className="font-semibold tabular-nums">{`#${tokenId.toString()}`}</span>
          </Row>
          {mintDate && <Row label="Minted">{mintDate}</Row>}
          {paymentVia && <Row label="Paid with">{paymentVia}</Row>}
          <Row label="Contract">
            <button
              onClick={copyContract}
              aria-label="Copy contract address"
              className="flex items-center gap-1.5 font-mono text-caption transition-colors hover:text-primary-green focus-visible:underline focus-visible:outline-none"
            >
              {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}
              <AnimatePresence mode="wait" initial={false}>
                {copiedContract ? (
                  <motion.span
                    key="check"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Check
                      size={11}
                      strokeWidth={2.5}
                      className="text-primary-green"
                    />
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1 }}
                  >
                    <Copy size={11} strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </Row>
        </motion.dl>

        {/* Attributes */}
        {meta?.attributes && meta.attributes.length > 0 && (
          <motion.div {...cascade(0.28)} className="px-6 py-5">
            <p className="mb-2 text-small font-semibold text-neutral-40">
              Attributes
            </p>
            <div className="grid grid-cols-2 gap-3" role="list">
              {meta.attributes.map((attr, i) => (
                <div
                  key={i}
                  role="listitem"
                  className="rounded-2xl bg-khaki-90 px-3 py-2.5"
                >
                  <p className="text-caption text-neutral-40">
                    {attr.trait_type}
                  </p>
                  <p className="truncate text-small font-medium text-neutral-10">
                    {String(attr.value)}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer: explorer link */}
      {link && (
        <div className="border-t border-khaki-70 px-6 py-4">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on explorer (opens in new tab)"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary-green/50 py-3 text-small font-medium text-primary-green transition-all hover:bg-green-90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
          >
            View on explorer
            <ExternalLink size={14} strokeWidth={2} />
          </a>
        </div>
      )}
    </motion.div>
  )
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="text-caption text-neutral-40">{label}</dt>
      <dd className="text-small font-medium text-neutral-10">{children}</dd>
    </div>
  )
}
