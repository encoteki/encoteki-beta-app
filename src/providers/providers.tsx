'use client'

import { AppProvider } from '@/contexts/app.context'
import { Web3Provider } from './web3.providers'
import { SessionGuard } from '@/components/session-guard'

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Web3Provider>
      <AppProvider>
        <SessionGuard />
        {children}
      </AppProvider>
    </Web3Provider>
  )
}
