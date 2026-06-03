'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useConnection } from 'wagmi'

import Logo from '@/assets/logos/logo.webp'
import URL_ROUTES from '../constants/url-route'
import { AppNav } from '../ui/navs/app-nav'
import { SignInButton } from '../ui/buttons/sign-in-btn'
import { WalletSidebar } from './wallet/wallet-sidebar'
import { WalletAvatar } from '@/ui/wallet-avatar'
import { useUser } from '@/hooks/useUser'

const hubNavs = [
  { label: 'Home', id: URL_ROUTES.HOME },
  { label: 'Mint', id: URL_ROUTES.MINT },
  { label: 'DAO', id: URL_ROUTES.DAO },
  { label: 'Leaderboard', id: URL_ROUTES.LEADERBOARD },
]

// Filtered once at module level — used in both desktop and mobile nav
const navItems = hubNavs.filter((nav) => nav.label !== 'Home')

export default function Header() {
  const shouldReduceMotion = useReducedMotion()
  const [isOpen, setIsOpen] = useState(false)
  const [isWalletOpen, setIsWalletOpen] = useState(false)
  const pathname = usePathname()
  const { isLoggedIn } = useUser()
  const { address } = useConnection()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close mobile menu on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen])

  return (
    <nav
      aria-label="Main navigation"
      className="absolute top-0 right-0 left-0 z-50"
    >
      {/* Skip to content — visible on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-khaki-99 focus:px-4 focus:py-2 focus:text-small focus:font-medium focus:text-primary-green focus:shadow-md focus:ring-2 focus:ring-primary-green focus:outline-none"
      >
        Skip to content
      </a>

      <div className="relative mx-auto flex w-full items-center justify-between px-4 pt-4 tablet:px-8 tablet:pt-6 desktop:px-12">
        {/* Brand / Logo */}
        <div className="relative z-10 flex w-auto items-center gap-4 tablet:w-48 desktop:w-56">
          <Link
            href="/"
            className="group rounded-xl ring-primary-green outline-none focus-visible:ring-2"
          >
            <Image
              src={Logo}
              alt="Encoteki Home"
              className="h-9 w-auto transition-transform duration-300 ease-out group-hover:scale-105 group-active:scale-95 tablet:h-12"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav (Centered) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 tablet:block">
          <AppNav items={navItems} />
        </div>

        {/* Desktop Actions */}
        <div className="relative z-10 hidden w-auto items-center justify-end text-right tablet:flex tablet:w-48 desktop:w-56">
          {isLoggedIn && address ? (
            <button
              onClick={() => setIsWalletOpen(true)}
              aria-label="Open wallet panel"
              className="flex items-center gap-2 rounded-full bg-khaki-99 px-3 py-2 text-caption font-semibold text-neutral-10 shadow-sm ring-1 ring-primary-green/25 transition-all duration-200 hover:shadow-md hover:ring-primary-green/50 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none active:scale-[0.97]"
            >
              <WalletAvatar address={address} />
              <span className="font-mono">
                {address.slice(0, 6)}…{address.slice(-4)}
              </span>
            </button>
          ) : (
            <SignInButton />
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="relative z-10 block tablet:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-khaki-99 text-primary-green shadow-sm ring-1 ring-primary-green/20 transition-all duration-300 ease-out outline-none hover:shadow-md hover:ring-primary-green/40 focus-visible:ring-2 focus-visible:ring-primary-green active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: -90, scale: 0.8 }
                  }
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: 90, scale: 0.8 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
                >
                  <X size={20} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: 90, scale: 0.8 }
                  }
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: -90, scale: 0.8 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
                >
                  <Menu size={20} strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile backdrop blur — same treatment as wallet sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="nav-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-neutral-10/25 backdrop-blur-sm tablet:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -20, scale: 0.96 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -16, scale: 0.96 }
            }
            transition={{
              duration: shouldReduceMotion ? 0.15 : 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute top-full left-0 mt-3 w-full px-4 tablet:hidden"
          >
            <div className="flex flex-col gap-2 overflow-hidden rounded-3xl border border-primary-green/10 bg-khaki-99/90 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl">
              <ul className="flex flex-col gap-1">
                {navItems.map((nav, i) => {
                  const isActive = pathname.startsWith(nav.id)
                  return (
                    <motion.li
                      key={nav.label}
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, x: -8 }
                      }
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: shouldReduceMotion ? 0.1 : 0.25,
                        delay: shouldReduceMotion ? 0 : 0.06 + i * 0.04,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link
                        href={nav.id}
                        aria-current={isActive ? 'page' : undefined}
                        className={`block rounded-2xl px-5 py-3.5 text-base font-medium tracking-wide transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-green active:scale-[0.98] ${
                          isActive
                            ? 'bg-green-90 text-primary-green'
                            : 'text-neutral-40 hover:bg-primary-green/5 hover:text-neutral-10'
                        }`}
                      >
                        {nav.label}
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>

              <motion.div
                className="mt-3 border-t border-primary-green/10 pt-5"
                initial={
                  shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }
                }
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.1 : 0.25,
                  delay: shouldReduceMotion
                    ? 0
                    : 0.06 + navItems.length * 0.04 + 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {isLoggedIn && address ? (
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      setIsWalletOpen(true)
                    }}
                    aria-label="Open wallet panel"
                    className="flex w-full items-center gap-2.5 rounded-full bg-khaki-99 px-4 py-2.5 text-caption font-semibold text-neutral-10 shadow-sm ring-1 ring-primary-green/25 transition-all hover:shadow-md hover:ring-primary-green/50 focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:outline-none active:scale-[0.97]"
                  >
                    <WalletAvatar address={address} size={24} />
                    <span className="font-mono leading-none">
                      {address.slice(0, 6)}…{address.slice(-4)}
                    </span>
                  </button>
                ) : (
                  <SignInButton />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Sidebar */}
      <WalletSidebar
        isOpen={isWalletOpen}
        onClose={() => setIsWalletOpen(false)}
      />
    </nav>
  )
}
