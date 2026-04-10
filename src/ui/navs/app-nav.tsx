'use client'

import { useAppCtx } from '@/contexts/app.context'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

export interface NavProps {
  label: string
  id: string
}

export const AppNav = ({ items }: { items: NavProps[] }) => {
  const { activeIdx, setActiveIdx } = useAppCtx()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const foundIdx = items.findIndex((item) => pathname.startsWith(item.id))
    if (foundIdx !== -1 && foundIdx !== activeIdx) {
      setActiveIdx(foundIdx)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="hidden items-center rounded-full border border-neutral-60/40 bg-white/90 p-1.5 shadow-sm backdrop-blur-md transition-all duration-300 tablet:flex">
      {items.map((item, idx) => {
        const isActive = activeIdx === idx
        return (
          <button
            key={idx}
            onClick={() => {
              setActiveIdx(idx)
              router.push(item.id)
            }}
            className={cn(
              'group relative rounded-full text-sm font-medium tracking-wide transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-green tablet:min-w-27.5 tablet:px-3 tablet:py-2.5 desktop:min-w-27.5 desktop:px-5 desktop:py-2.5',
              isActive
                ? 'text-primary-green'
                : 'text-neutral-40 hover:text-neutral-10',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="app-nav-active-pill"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                  mass: 1,
                }}
                className="absolute inset-0 rounded-full bg-green-90"
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
