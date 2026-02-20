import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/assets/logos/logo.webp'
import URL_ROUTES from '../constants/url-route'
import { AppNav } from '../ui/navs/app-nav'
import { SignInButton } from '../ui/buttons/sign-in-btn'

const hubNavs = [
  { label: 'Home', id: URL_ROUTES.HOME },
  { label: 'Mint', id: URL_ROUTES.MINT },
  { label: 'DAO', id: URL_ROUTES.DAO },
  { label: 'Points', id: URL_ROUTES.POINTS },
]

export default function Header() {
  return (
    <nav className={`absolute top-0 right-0 left-0 z-50 bg-transparent`}>
      <div className="relative flex w-full items-center justify-between px-4 pt-4 tablet:pt-6 desktop:px-8">
        <section className="relative z-10 flex items-center gap-4 md:w-50">
          <Link href="/">
            <Image
              src={Logo}
              alt="Home"
              className="hidden md:block md:h-13.5 md:w-19.75"
              priority
            />
          </Link>
        </section>

        <div className="absolute left-1/2 -translate-x-1/2 transform">
          <AppNav items={hubNavs.filter((nav) => nav.label !== 'Home')} />
        </div>

        <section className="relative z-10 text-right">
          <SignInButton />
        </section>
      </div>
    </nav>
  )
}
