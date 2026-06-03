'use client'

import React from 'react'
import {
  Config,
  cookieStorage,
  createStorage,
  WagmiProvider,
  http,
} from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { XellarKitProvider, defaultConfig, darkTheme } from '@xellar/kit'
import { base, arbitrum, lisk, manta } from 'viem/chains'

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''
const xellarAppId = process.env.NEXT_PUBLIC_XELLAR_APP_ID || ''

// Memoize config to prevent recreation on every render
const config = defaultConfig({
  appName: 'Encoteki',
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  walletConnectProjectId,
  xellarAppId,
  xellarEnv: 'production',
  chains: [base, arbitrum, lisk, manta],
  // Explicit HTTP transports so cross-chain reads (wallet sidebar balances)
  // work regardless of which chain the wallet is currently connected to.
  // Without these, wagmi falls back to the wallet connector's transport only,
  // which returns 0 for chains the wallet isn't actively on.
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http(),
    [lisk.id]: http(),
    [manta.id]: http(),
  },
}) as Config

// Create query client once to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce refetch frequency to improve performance
      staleTime: 60 * 1000, // 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    },
  },
})

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <XellarKitProvider theme={darkTheme}>{children}</XellarKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
