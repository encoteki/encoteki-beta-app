import type { Metadata } from 'next'
import { Outfit, Young_Serif } from 'next/font/google'
import './globals.css'
import Providers from '@/providers/providers'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

const youngSerif = Young_Serif({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Beta App',
  description: 'Encoteki Beta App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} ${youngSerif.variable}`} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col justify-between">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
