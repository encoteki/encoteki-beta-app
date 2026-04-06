import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import Providers from '@/providers/providers'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  preload: true, // Preload for faster initial load
  fallback: ['system-ui', 'arial'], // Fallback fonts
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
      <body className={outfit.className} suppressHydrationWarning>
        <div className="flex min-h-screen flex-col justify-between">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  )
}
