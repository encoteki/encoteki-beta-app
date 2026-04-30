'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import Logo from '@/assets/logos/logo.webp'
import URL_ROUTES from '../constants/url-route'
import { AppNav } from '../ui/navs/app-nav'
import { SignInButton } from '../ui/buttons/sign-in-btn'

const hubNavs = [
  { label: 'Home', id: URL_ROUTES.HOME },
  { label: 'Mint', id: URL_ROUTES.MINT },
  { label: 'DAO', id: URL_ROUTES.DAO },
  { label: 'Leaderboard', id: URL_ROUTES.LEADERBOARD },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <nav className="absolute top-0 right-0 left-0 z-50">
      <div className="relative mx-auto flex w-full items-center justify-between px-4 pt-4 tablet:px-8 tablet:pt-6 desktop:px-12">
        {/* Brand / Logo */}
        <section className="relative z-10 flex w-auto items-center gap-4 tablet:w-48 desktop:w-56">
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
        </section>

        {/* Desktop Nav (Centered) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 transform tablet:block">
          <AppNav items={hubNavs.filter((nav) => nav.label !== 'Home')} />
        </div>

        {/* Desktop Actions */}
        <section className="relative z-10 hidden w-auto items-center justify-end text-right tablet:flex tablet:w-48 desktop:w-56">
          <SignInButton />
        </section>

        {/* Mobile Hamburger Toggle */}
        <section className="relative z-10 block tablet:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="group relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary-green shadow-sm ring-1 ring-neutral-60/20 transition-all duration-300 ease-out outline-none hover:shadow-md hover:ring-primary-green/30 focus-visible:ring-2 focus-visible:ring-primary-green active:scale-95"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={20} strokeWidth={2.5} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu size={20} strokeWidth={2.5} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </section>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full left-0 mt-3 w-full px-4 tablet:hidden"
          >
            <div className="flex flex-col gap-2 overflow-hidden rounded-3xl border border-neutral-60/10 bg-white/95 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl">
              <ul className="flex flex-col gap-1">
                {hubNavs
                  .filter((nav) => nav.label !== 'Home')
                  .map((nav) => {
                    const isActive = pathname.startsWith(nav.id)

                    return (
                      <li key={nav.label}>
                        <Link
                          href={nav.id}
                          className={`block rounded-2xl px-5 py-3.5 text-base font-medium tracking-wide transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-green active:scale-[0.98] ${
                            isActive
                              ? 'bg-green-90 text-primary-green'
                              : 'text-neutral-40 hover:bg-neutral-60/10 hover:text-neutral-10'
                          }`}
                        >
                          {nav.label}
                        </Link>
                      </li>
                    )
                  })}
              </ul>

              <div className="mt-3 border-t border-neutral-60/10 pt-5">
                <SignInButton />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
