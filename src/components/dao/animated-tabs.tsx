'use client'

import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import React, { useState } from 'react'
import { DaoType } from '../../enums/dao-types.enum'
import { useDaoCtx } from '../../contexts/dao.context'

interface AnimatedTabsProps {
  items: {
    type: DaoType
    label: string
    primary: string
    secondary: string
  }[]
  classname?: string
}

export const AnimatedTabs = ({ items, classname }: AnimatedTabsProps) => {
  const { setDaoType } = useDaoCtx()

  const [index, setIndex] = useState<number>(0)

  const handleClick = (idx: number, type: DaoType) => {
    setIndex(idx)
    setDaoType(type)
  }

  return (
    <motion.div
      layout
      className={cn(
        'relative flex justify-between rounded-full bg-white p-1 shadow-lg',
        classname,
      )}
    >
      {items.map((item, idx) => {
        const isActive = index === idx
        return (
          <button
            key={`${item.type}-${idx}`}
            onClick={() => handleClick(idx, item.type)}
            style={
              {
                // @ts-ignore - CSS custom property keys
                '--tab-primary': item.primary,
                '--tab-secondary': item.secondary,
              } as React.CSSProperties
            }
            className={cn(
              'relative min-w-24 flex-1 rounded-full px-4 py-2 font-normal text-gray-400 tablet:min-w-32 tablet:px-6 tablet:py-3',
              isActive && 'text-(--tab-secondary)',
            )}
          >
            {isActive && (
              <motion.span
                layoutId="active-pill"
                className="pointer-events-none absolute inset-0 z-0 rounded-full bg-(--tab-primary)"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 40,
                  mass: 0.35,
                }}
              />
            )}
            <span className="relative z-10 font-medium">{item.label}</span>
          </button>
        )
      })}
    </motion.div>
  )
}
