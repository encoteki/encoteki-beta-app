'use client'

import { usePathname } from 'next/navigation'
import InstagramIcon from '@/assets/icons/instagram'
import ThreadsIcon from '@/assets/icons/threads'
import XIcon from '@/assets/icons/x'
import TiktokIcon from '@/assets/icons/tiktok'
import TelegramIcon from '@/assets/icons/telegram'

const socmed = [
  {
    name: 'Instagram',
    icon: <InstagramIcon />,
    url: 'https://www.instagram.com/encoteki/',
  },
  {
    name: 'Threads',
    icon: <ThreadsIcon />,
    url: 'https://www.threads.net/@encoteki',
  },
  {
    name: 'X',
    icon: <XIcon />,
    url: 'https://x.com/encoteki',
  },
  {
    name: 'TikTok',
    icon: <TiktokIcon />,
    url: 'https://www.tiktok.com/@encoteki',
  },
  {
    name: 'Telegram',
    icon: <TelegramIcon />,
    url: 'https://t.me/encoteki',
  },
]

export default function Footer() {
  const pathname = usePathname()
  const currentYear: number = new Date().getFullYear()

  const tagline = 'Join the community and save the world!'
  const copyright = `Encoteki © ${currentYear} All rights reserved`

  return (
    <footer className="mx-auto w-full rounded-t-3xl bg-primary-green px-16 py-16 tablet:rounded-t-[48px] tablet:px-32 desktop:px-32 desktop:py-48">
      <div className="flex h-auto flex-col tablet:flex-row tablet:justify-between">
        {/* Left: tagline + social links */}
        <div className="mb-14 flex flex-col gap-4 tablet:mb-0 tablet:w-1/2 tablet:justify-between tablet:gap-10">
          <p className="text-h3 font-semibold text-balance text-white desktop:text-h1">
            {tagline}
          </p>
          <ul
            className="-ml-2.5 flex items-center gap-1"
            role="list"
            aria-label="Social media"
          >
            {socmed.map((item) => (
              <li key={item.name}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit Encoteki on ${item.name}`}
                  className="flex items-center justify-center rounded-full p-2.5 text-white transition-transform duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-green focus-visible:outline-none"
                >
                  <span aria-hidden="true">{item.icon}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: copyright */}
        <div
          className={`flex flex-col justify-end ${pathname === '/' ? 'tablet:w-1/2' : ''}`}
        >
          <p
            className={`text-small text-white ${pathname === '/' ? 'tablet:text-right' : ''}`}
          >
            {copyright}
          </p>
        </div>
      </div>
    </footer>
  )
}
