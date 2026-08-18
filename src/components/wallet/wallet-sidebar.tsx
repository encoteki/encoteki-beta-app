'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Image, { StaticImageData } from 'next/image'
import Link from 'next/link'
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useAnimation,
} from 'motion/react'
import { X, Copy, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { useDisconnect, useConnection, useChainId } from 'wagmi'

import { useUser } from '@/hooks/useUser'
import { useChainBalances } from '@/hooks/useChainBalances'
import { useNftMints, type MintItem } from '@/hooks/useNftMints'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { logoutSession } from '@/lib/auth-client'
import { reportError } from '@/lib/telemetry'
import { getContract } from '@/constants/contracts/tsb'
import { WalletAvatar } from '@/ui/wallet-avatar'
import { NftDetailSheet } from './nft-detail-sheet'

import BaseIcon from '@/assets/chains/base.jpeg'
import ArbitrumIcon from '@/assets/chains/arbitrum.svg'
import LiskIcon from '@/assets/chains/lisk.webp'
import MantaIcon from '@/assets/chains/manta.png'
import EthereumIcon from '@/assets/chains/ethereum.svg'
import RobinhoodIcon from '@/assets/chains/rh.png'
import MonadIcon from '@/assets/chains/monad.jpeg'
import HiddenNFT from '@/assets/mint/hidden.png'

// ── Constants ──────────────────────────────────────────────────────────────

const CHAIN_TABS = [
  {
    key: 'BASE',
    label: 'Base',
    fullLabel: 'Base',
    chainId: 8453,
    icon: BaseIcon as StaticImageData,
  },
  {
    key: 'ARBITRUM',
    label: 'Arb',
    fullLabel: 'Arbitrum',
    chainId: 42161,
    icon: ArbitrumIcon as StaticImageData,
  },
  {
    key: 'LISK',
    label: 'Lisk',
    fullLabel: 'Lisk',
    chainId: 1135,
    icon: LiskIcon as StaticImageData,
  },
  {
    key: 'MANTA',
    label: 'Manta',
    fullLabel: 'Manta',
    chainId: 169,
    icon: MantaIcon as StaticImageData,
  },
  {
    key: 'ETHEREUM',
    label: 'Ethereum',
    fullLabel: 'Ethereum',
    chainId: 1,
    icon: EthereumIcon as StaticImageData,
  },
  {
    key: 'ROBINHOOD',
    label: 'Robinhood',
    fullLabel: 'Robinhood',
    chainId: 4663,
    icon: RobinhoodIcon as StaticImageData,
  },
  {
    key: 'MONAD',
    label: 'Monad',
    fullLabel: 'Monad',
    chainId: 143,
    icon: MonadIcon as StaticImageData,
  },
]

const SIGN_OUT_CONFIRM_MS = 3000

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtBal(balance: string, symbol: string): string {
  const n = parseFloat(balance)
  if (!n || n === 0) return '0'
  if (symbol === 'IDRX') {
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(
      n,
    )
  }
  if (n < 0.0001) return '<0.0001'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  if (n >= 1) return n.toFixed(2)
  return n.toFixed(4)
}

function SkeletonRow() {
  return (
    <li className="flex items-center justify-between py-4">
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-khaki-70" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-14 animate-pulse rounded bg-khaki-70" />
          <div className="h-3 w-20 animate-pulse rounded bg-khaki-70" />
        </div>
      </div>
      <div className="h-5 w-16 animate-pulse rounded bg-khaki-70" />
    </li>
  )
}

// ── Component ──────────────────────────────────────────────────────────────

interface WalletSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function WalletSidebar({ isOpen, onClose }: WalletSidebarProps) {
  const shouldReduceMotion = useReducedMotion()
  const connectedChainId = useChainId()
  const signOutControls = useAnimation()

  // Default to user's connected chain; fall back to Base if unsupported.
  // Initialized lazily from wagmi so no sync-setState-in-effect is needed.
  const [activeChainId, setActiveChainId] = useState(() => {
    const isSupported = CHAIN_TABS.some((t) => t.chainId === connectedChainId)
    return isSupported ? connectedChainId : 8453
  })

  // Track previous tab index to compute slide direction on chain switch
  const prevChainIdxRef = useRef(
    Math.max(
      0,
      CHAIN_TABS.findIndex((t) => t.chainId === connectedChainId),
    ),
  )
  const [chainSwitchDir, setChainSwitchDir] = useState(0)
  const [chainDropdownOpen, setChainDropdownOpen] = useState(false)

  const [copied, setCopied] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // NFT detail view — null means main view is shown
  const [selectedTokenId, setSelectedTokenId] = useState<bigint | null>(null)
  const isDetailOpen = selectedTokenId !== null

  // Focus trap for the dialog. Escape backs out of the NFT detail sheet first,
  // then closes the whole panel — and focus is restored to the trigger on close.
  const panelRef = useRef<HTMLElement>(null)
  const handleEscape = useCallback(() => {
    if (chainDropdownOpen) setChainDropdownOpen(false)
    else if (selectedTokenId !== null) setSelectedTokenId(null)
    else onClose()
  }, [chainDropdownOpen, selectedTokenId, onClose])
  useFocusTrap(panelRef, isOpen, { onEscape: handleEscape })

  const { address } = useConnection()
  const { mutate: mutateUser } = useUser()
  const { mutateAsync: disconnectWallet } = useDisconnect()

  // Don't fan out 8 cross-chain reads (4 balance multicalls + 4 GraphQL queries)
  // for a panel the user may never open. Latch on first open, then keep the
  // hooks enabled so reopening is instant from cache.
  // React "update state during render" pattern: guarded setState with no-revert
  // condition prevents infinite loops while avoiding both effects and refs.
  const [hasOpened, setHasOpened] = useState(isOpen)
  if (isOpen && !hasOpened) setHasOpened(true)
  const dataAddress = hasOpened
    ? (address as `0x${string}` | undefined)
    : undefined

  // Balance hooks for all 7 chains — enabled only once the panel has opened.
  const baseBalances = useChainBalances(dataAddress, 8453)
  const arbitrumBalances = useChainBalances(dataAddress, 42161)
  const liskBalances = useChainBalances(dataAddress, 1135)
  const mantaBalances = useChainBalances(dataAddress, 169)
  const ethereumBalances = useChainBalances(dataAddress, 1)
  const robinhoodBalances = useChainBalances(dataAddress, 4663)
  const monadBalances = useChainBalances(dataAddress, 143)

  const balancesMap = useMemo(
    () =>
      ({
        8453: baseBalances,
        42161: arbitrumBalances,
        1135: liskBalances,
        169: mantaBalances,
        1: ethereumBalances,
        4663: robinhoodBalances,
        143: monadBalances,
      }) as Record<number, typeof baseBalances>,
    [
      baseBalances,
      arbitrumBalances,
      liskBalances,
      mantaBalances,
      ethereumBalances,
      robinhoodBalances,
      monadBalances,
    ],
  )

  // NFT mints for all 7 chains via GraphQL — enabled only once the panel opened.
  const baseMints = useNftMints(dataAddress, 8453)
  const arbitrumMints = useNftMints(dataAddress, 42161)
  const liskMints = useNftMints(dataAddress, 1135)
  const mantaMints = useNftMints(dataAddress, 169)
  const ethereumMints = useNftMints(dataAddress, 1)
  const robinhoodMints = useNftMints(dataAddress, 4663)
  const monadMints = useNftMints(dataAddress, 143)

  const mintsMap = useMemo(
    () =>
      ({
        8453: baseMints,
        42161: arbitrumMints,
        1135: liskMints,
        169: mantaMints,
        1: ethereumMints,
        4663: robinhoodMints,
        143: monadMints,
      }) as Record<number, typeof baseMints>,
    [
      baseMints,
      arbitrumMints,
      liskMints,
      mantaMints,
      ethereumMints,
      robinhoodMints,
      monadMints,
    ],
  )

  const { nftCountByChain, nftCount, totalNftCount, isNftLoading } =
    useMemo(() => {
      const nftCountByChain = Object.fromEntries(
        CHAIN_TABS.map((tab) => [
          tab.chainId,
          mintsMap[tab.chainId].mints.length,
        ]),
      ) as Record<number, number>
      return {
        nftCountByChain,
        nftCount: nftCountByChain[activeChainId] ?? 0,
        totalNftCount: Object.values(nftCountByChain).reduce(
          (a, b) => a + b,
          0,
        ),
        isNftLoading: CHAIN_TABS.some((tab) => mintsMap[tab.chainId].isLoading),
      }
    }, [mintsMap, activeChainId])

  const activeContractAddress = useMemo(
    () => getContract(activeChainId) as `0x${string}` | undefined,
    [activeChainId],
  )
  const activeMints = useMemo(
    () => mintsMap[activeChainId]?.mints ?? [],
    [mintsMap, activeChainId],
  )
  const activeTokenIds = useMemo(
    () => activeMints.map((m) => m.tokenId),
    [activeMints],
  )

  const activeMintsRefetch = mintsMap[activeChainId]?.refetch ?? (() => {})
  const isNftFetching = mintsMap[activeChainId]?.isFetching ?? false

  const handleRefreshNfts = useCallback(() => {
    if (isNftFetching) return
    activeMintsRefetch()
  }, [isNftFetching, activeMintsRefetch])

  const selectedMintInfo = useMemo<MintItem | undefined>(
    () =>
      selectedTokenId !== null
        ? activeMints.find((m) => m.tokenId === selectedTokenId)
        : undefined,
    [selectedTokenId, activeMints],
  )

  // Escape handling is owned by useFocusTrap (see handleEscape above).

  // Lock body scroll while panel is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Cleanup confirm timer on unmount
  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    }
  }, [])

  // Pulse the sign-out button when it enters the confirm state
  useEffect(() => {
    if (confirmingSignOut && !shouldReduceMotion) {
      signOutControls.start({
        scale: [1, 1.015, 1],
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      })
    }
  }, [confirmingSignOut, signOutControls, shouldReduceMotion])

  const copyAddress = useCallback(async () => {
    if (!address) return
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access blocked — no false confirmation shown
    }
  }, [address])

  const executeSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true)
      await logoutSession()
      await disconnectWallet()
      await mutateUser(undefined, false)
      onClose()
      window.location.href = '/login'
    } catch (e) {
      reportError(e, { flow: 'wallet-sign-out' })
      setIsSigningOut(false)
      setConfirmingSignOut(false)
    }
  }, [disconnectWallet, mutateUser, onClose])

  const handleSignOutClick = useCallback(() => {
    if (isSigningOut) return
    if (!confirmingSignOut) {
      setConfirmingSignOut(true)
      confirmTimerRef.current = setTimeout(
        () => setConfirmingSignOut(false),
        SIGN_OUT_CONFIRM_MS,
      )
      return
    }
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current)
    executeSignOut()
  }, [confirmingSignOut, isSigningOut, executeSignOut])

  // Chain switch with direction tracking for the directional slide
  const handleChainSwitch = useCallback((chainId: number) => {
    const newIdx = CHAIN_TABS.findIndex((t) => t.chainId === chainId)
    setChainSwitchDir(newIdx > prevChainIdxRef.current ? 1 : -1)
    prevChainIdxRef.current = newIdx
    setActiveChainId(chainId)
    setSelectedTokenId(null) // return to main view on chain change
    setChainDropdownOpen(false)
  }, [])

  const activeTab = useMemo(
    () => CHAIN_TABS.find((t) => t.chainId === activeChainId) ?? CHAIN_TABS[0],
    [activeChainId],
  )

  const { tokens, isLoading, isError, refetch } = useMemo(
    () =>
      balancesMap[activeChainId] ?? {
        tokens: [],
        isLoading: false,
        isError: false,
        refetch: () => {},
      },
    [balancesMap, activeChainId],
  )

  const shortAddress = useMemo(
    () => (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''),
    [address],
  )

  const activeChainFull = activeTab.fullLabel

  const tokenListVariants = useMemo(
    () => ({
      enter: (dir: number) => ({
        opacity: 0,
        x: shouldReduceMotion ? 0 : dir * 14,
      }),
      center: { opacity: 1, x: 0 },
      exit: (dir: number) => ({
        opacity: 0,
        x: shouldReduceMotion ? 0 : -(dir * 14),
      }),
    }),
    [shouldReduceMotion],
  )

  const sectionEntrance = useCallback(
    (delay: number, fromY: number) => ({
      initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: fromY },
      animate: { opacity: 1, y: 0 },
      transition: {
        duration: shouldReduceMotion ? 0.15 : 0.32,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      },
    }),
    [shouldReduceMotion],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="wallet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-neutral-10/25 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel shell — slides in from right */}
          <motion.aside
            key="wallet-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet"
            initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
            transition={{
              duration: shouldReduceMotion ? 0.15 : 0.38,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="fixed top-0 right-0 z-50 flex h-dvh w-full flex-col overflow-hidden bg-khaki-99 shadow-2xl sm:max-w-95"
          >
            {/* Scrollable body — inert while the NFT detail sheet overlays it */}
            <div
              inert={isDetailOpen}
              className="flex flex-1 flex-col overflow-y-auto overscroll-contain"
            >
              {/* ── Identity zone: cascades in from above ── */}
              <motion.div
                {...sectionEntrance(0.08, -6)}
                className="bg-khaki-90"
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                  <span className="text-small font-semibold text-neutral-30">
                    Wallet
                  </span>
                  <button
                    onClick={onClose}
                    aria-label="Close wallet panel"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-40 transition-colors hover:bg-khaki-80 hover:text-neutral-10 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>

                {/* Profile */}
                <section className="px-6 pb-6">
                  <div className="flex items-center gap-4">
                    {/* Avatar springs in after the identity zone lands */}
                    {address && (
                      <motion.div
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, scale: 0.8 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 28,
                          delay: shouldReduceMotion ? 0 : 0.18,
                        }}
                        className="rounded-full ring-2 ring-primary-green/10"
                      >
                        <WalletAvatar address={address} size={56} />
                      </motion.div>
                    )}
                    <div className="min-w-0 flex-1">
                      {/* Address + copy — single source of identity */}
                      <button
                        onClick={copyAddress}
                        aria-label="Copy wallet address to clipboard"
                        className="flex min-h-11 items-center gap-2 text-left transition-colors hover:text-neutral-10 focus-visible:outline-none"
                      >
                        <span className="font-mono text-small font-semibold tracking-wider text-neutral-10">
                          {shortAddress}
                        </span>
                        <span className="flex items-center text-neutral-40">
                          <AnimatePresence mode="wait" initial={false}>
                            {copied ? (
                              <motion.span
                                key="check"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                transition={{
                                  type: 'spring',
                                  stiffness: 500,
                                  damping: 25,
                                }}
                                className="text-primary-green"
                              >
                                <Check size={11} strokeWidth={2.5} />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                              >
                                <Copy size={11} strokeWidth={2} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                      </button>
                    </div>
                  </div>
                </section>
              </motion.div>

              {/* Full-width divider: identity zone → data zone */}
              <div className="border-t border-khaki-70" />

              {/* ── Balances: rises from below ── */}
              <motion.section
                {...sectionEntrance(0.15, 8)}
                className="px-6 py-5"
              >
                <p className="mb-3 text-caption font-semibold tracking-widest text-neutral-40 uppercase">
                  Balances
                </p>

                {/* Chain dropdown — too many chains now for a tab strip */}
                <div className="relative mb-4">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={chainDropdownOpen}
                    aria-controls="wallet-chain-dropdown"
                    onClick={() => setChainDropdownOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-full border border-khaki-70 bg-white px-3 py-2.5 transition-colors hover:bg-khaki-90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <figure className="h-5 w-5 shrink-0 overflow-hidden rounded-full">
                        <Image
                          src={activeTab.icon}
                          alt=""
                          width={20}
                          height={20}
                          className="h-full w-full object-cover"
                        />
                      </figure>
                      <span className="text-caption font-medium text-neutral-10">
                        {activeTab.fullLabel}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`shrink-0 text-neutral-40 transition-transform duration-200 ${chainDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {chainDropdownOpen && (
                      <motion.ul
                        id="wallet-chain-dropdown"
                        role="listbox"
                        aria-label="Select chain"
                        initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                        transition={{
                          duration: 0.2,
                          ease: [0.16, 1, 0.3, 1] as const,
                        }}
                        className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-khaki-70 bg-white shadow-lg"
                      >
                        {CHAIN_TABS.map((tab) => {
                          const isActive = tab.chainId === activeChainId
                          return (
                            <li
                              key={tab.chainId}
                              role="option"
                              aria-selected={isActive}
                              tabIndex={0}
                              onClick={() => handleChainSwitch(tab.chainId)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  handleChainSwitch(tab.chainId)
                                }
                              }}
                              className={`flex cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-green/40 focus-visible:ring-inset ${
                                isActive ? 'bg-khaki-80' : 'hover:bg-khaki-90'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <figure className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full">
                                  <Image
                                    src={tab.icon}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="h-full w-full object-cover"
                                  />
                                </figure>
                                <span
                                  className={`text-small font-medium ${isActive ? 'font-semibold text-primary-green' : 'text-neutral-10'}`}
                                >
                                  {tab.fullLabel}
                                </span>
                              </div>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-primary-green shadow-sm" />
                              )}
                            </li>
                          )
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* Token list — directional slide on chain switch */}
                <AnimatePresence mode="wait" custom={chainSwitchDir}>
                  <motion.ul
                    key={activeChainId}
                    custom={chainSwitchDir}
                    variants={tokenListVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    role="list"
                    aria-label={`${activeChainFull} token balances`}
                  >
                    {isLoading ? (
                      <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                      </>
                    ) : isError ? (
                      <li className="flex flex-col items-center gap-2 py-8">
                        <p className="text-center text-caption text-neutral-40">
                          Couldn&apos;t load balances.
                        </p>
                        <button
                          onClick={() => refetch()}
                          className="inline-flex min-h-10 items-center px-3 text-caption font-medium text-primary-green transition-colors hover:text-green-10 focus-visible:underline focus-visible:outline-none"
                        >
                          Tap to retry
                        </button>
                      </li>
                    ) : tokens.length === 0 ? (
                      <li className="py-8 text-center text-caption text-neutral-40">
                        No tokens on this chain.
                      </li>
                    ) : (
                      tokens.map((token, i) => (
                        <motion.li
                          key={token.symbol}
                          // Section cascade handles the spatial story; rows fade only
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: shouldReduceMotion ? 0 : i * 0.05,
                            ease: 'easeOut',
                          }}
                          className={`flex items-center justify-between py-4 ${
                            i < tokens.length - 1
                              ? 'border-b border-khaki-70'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <figure className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-khaki-70">
                              <Image
                                src={token.logo}
                                alt={token.name}
                                width={28}
                                height={28}
                                className="h-full w-full object-cover"
                              />
                            </figure>
                            <div className="flex flex-col">
                              <span className="text-small leading-snug font-semibold text-neutral-10">
                                {token.symbol}
                              </span>
                              <span className="text-caption text-neutral-40">
                                {token.name}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-h3 font-semibold tabular-nums ${
                              parseFloat(token.balance) > 0
                                ? 'text-neutral-10'
                                : 'text-neutral-40'
                            }`}
                          >
                            {fmtBal(token.balance, token.symbol)}
                          </span>
                        </motion.li>
                      ))
                    )}
                  </motion.ul>
                </AnimatePresence>
              </motion.section>

              {/* Inset divider: balances → NFT */}
              <div className="mx-6 border-t border-khaki-70" />

              {/* ── NFT Preview: rises from below, last in cascade ── */}
              {/* Chain tab controls which chain's collection is shown */}
              <motion.section
                {...sectionEntrance(0.22, 8)}
                className="px-6 py-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-caption font-semibold tracking-widest text-neutral-40 uppercase">
                    Your Mints
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshNfts}
                      aria-label="Refresh NFT collection"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-40 transition-colors hover:bg-khaki-80 hover:text-neutral-10 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
                    >
                      <motion.span
                        animate={
                          isNftFetching ? { rotate: 360 } : { rotate: 0 }
                        }
                        transition={
                          isNftFetching
                            ? {
                                duration: 0.8,
                                ease: 'linear',
                                repeat: Infinity,
                              }
                            : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                        }
                        style={{ display: 'flex' }}
                      >
                        <RefreshCw size={13} strokeWidth={2} />
                      </motion.span>
                    </button>
                    {nftCount > 0 && (
                      <Link
                        href="/mint"
                        onClick={onClose}
                        className="text-caption font-medium text-primary-green transition-colors hover:text-green-10 focus-visible:underline focus-visible:outline-none"
                      >
                        View collection
                      </Link>
                    )}
                  </div>
                </div>

                {/* Content fades when chain switches — key drives the AnimatePresence swap */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChainId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {isNftLoading ? (
                      <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="aspect-square animate-pulse rounded-3xl bg-khaki-70"
                          />
                        ))}
                      </div>
                    ) : nftCount === 0 ? (
                      <motion.div
                        className="py-6 text-center"
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: 8 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.3,
                          delay: shouldReduceMotion ? 0 : 0.05,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      >
                        <p className="text-caption text-neutral-40">
                          No Tree Stewards on {activeChainFull} yet.
                        </p>
                        <Link
                          href="/mint"
                          onClick={onClose}
                          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-primary-green/50 px-5 py-2.5 text-caption font-medium text-primary-green transition-all hover:bg-green-90 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none"
                        >
                          Claim your first
                        </Link>
                      </motion.div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-3">
                          {Array.from({ length: Math.min(nftCount, 6) }).map(
                            (_, i) => {
                              const tokenId = activeTokenIds[i]
                              return (
                                <motion.button
                                  key={i}
                                  onClick={() =>
                                    tokenId !== undefined &&
                                    setSelectedTokenId(tokenId)
                                  }
                                  initial={{
                                    opacity: 0,
                                    scale: shouldReduceMotion ? 1 : 0.88,
                                  }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  whileHover={
                                    !shouldReduceMotion && tokenId !== undefined
                                      ? { scale: 1.04 }
                                      : {}
                                  }
                                  whileTap={
                                    !shouldReduceMotion && tokenId !== undefined
                                      ? { scale: 0.96 }
                                      : {}
                                  }
                                  transition={{
                                    duration: 0.28,
                                    delay: shouldReduceMotion ? 0 : i * 0.06,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  aria-label={
                                    tokenId !== undefined
                                      ? `View Tree Steward #${tokenId.toString()}`
                                      : `Tree Steward ${i + 1}`
                                  }
                                  className="relative aspect-square overflow-hidden rounded-3xl ring-1 ring-khaki-70 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-1 focus-visible:ring-offset-khaki-99 focus-visible:outline-none"
                                >
                                  <Image
                                    src={HiddenNFT}
                                    alt={
                                      tokenId !== undefined
                                        ? `Tree Steward #${tokenId.toString()}`
                                        : `Tree Steward ${i + 1}`
                                    }
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) calc((100vw - 72px) / 3), 108px"
                                  />
                                  {tokenId !== undefined && (
                                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-neutral-10/60 px-1.5 py-px text-[10px] leading-tight font-semibold whitespace-nowrap text-white backdrop-blur-sm">
                                      #{tokenId.toString()}
                                    </span>
                                  )}
                                </motion.button>
                              )
                            },
                          )}
                        </div>
                        <motion.p
                          className="mt-4 text-caption text-neutral-40"
                          initial={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 4 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.25,
                            delay: shouldReduceMotion
                              ? 0
                              : Math.min(nftCount, 6) * 0.06 + 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          {activeChainFull}
                          <span className="mx-1 opacity-40">·</span>
                          <span className="text-small font-semibold text-neutral-10 tabular-nums">
                            {nftCount}
                          </span>{' '}
                          minted
                          {totalNftCount > nftCount && (
                            <span className="opacity-50">
                              {' '}
                              ({totalNftCount} total)
                            </span>
                          )}
                        </motion.p>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.section>
            </div>

            {/* ── NFT detail overlay — slides in from right within the panel ── */}
            <AnimatePresence>
              {selectedTokenId !== null && activeContractAddress && (
                <NftDetailSheet
                  key={`${activeChainId}-${selectedTokenId}`}
                  tokenId={selectedTokenId}
                  chainId={activeChainId}
                  chainLabel={activeChainFull}
                  contractAddress={activeContractAddress}
                  mintInfo={selectedMintInfo}
                  onBack={() => setSelectedTokenId(null)}
                />
              )}
            </AnimatePresence>

            {/* ── Footer (sticky) — sign-out pulses into confirm state ── */}
            <div
              inert={isDetailOpen}
              className="border-t border-khaki-70 px-6 py-4"
            >
              <motion.button
                animate={signOutControls}
                onClick={handleSignOutClick}
                disabled={isSigningOut}
                className={`w-full rounded-full border py-3 text-small font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary-red focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                  confirmingSignOut
                    ? 'border-primary-red/40 bg-red-90 text-primary-red'
                    : 'border-primary-red/20 bg-white text-primary-red hover:bg-red-90'
                }`}
              >
                {isSigningOut
                  ? 'Signing out…'
                  : confirmingSignOut
                    ? 'Tap again to confirm'
                    : 'Sign Out'}
              </motion.button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
