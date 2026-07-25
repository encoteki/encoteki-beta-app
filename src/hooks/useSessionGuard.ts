'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDisconnect, useConnection } from 'wagmi'
import { useUser } from './useUser'
import { logoutSession } from '@/lib/auth-client'
import { reportError } from '@/lib/telemetry'

/**
 * Session guard that automatically logs out the user when:
 * 1. The wallet disconnects but the session is still active
 * 2. The backend session expires/is revoked (detected via SWR revalidation
 *    returning isLoggedIn: false after previously being true)
 *
 * Should be mounted once near the top of the component tree.
 */
export function useSessionGuard() {
  const { isConnected, status } = useConnection()
  const disconnect = useDisconnect()
  const { isLoggedIn, mutate } = useUser()
  const isLoggingOutRef = useRef(false)
  const wasLoggedInRef = useRef(false)

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      // Clear server session
      await logoutSession()

      // Disconnect wallet if still connected
      if (isConnected) {
        await disconnect.mutateAsync()
      }

      // Revalidate SWR cache
      await mutate(undefined, false)

      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      reportError(error, { flow: 'session-guard-logout' })
    } finally {
      isLoggingOutRef.current = false
    }
  }, [isConnected, disconnect, mutate])

  // --- Wallet disconnect detection ---
  // If the user is logged in via session but wallet is definitively disconnected,
  // clear the session to keep them in sync.
  // We check `status === 'disconnected'` instead of `!isConnected` to avoid
  // false triggers during wagmi's 'reconnecting' state (e.g., after page reload
  // when wagmi is re-establishing the connection from persisted storage).
  useEffect(() => {
    if (isLoggedIn && status === 'disconnected') {
      performLogout()
    }
  }, [isLoggedIn, status, performLogout])

  // --- SWR focus-revalidation expiry path ---
  // When the user backgrounds the tab and refocuses, SWR's revalidateOnFocus
  // calls GET /auth/me again. If the backend session has expired or been
  // revoked, that call 401s and isLoggedIn flips to false. This effect catches
  // that transition and disconnects the wallet + redirects.
  useEffect(() => {
    if (wasLoggedInRef.current && !isLoggedIn && !isLoggingOutRef.current) {
      isLoggingOutRef.current = true
      const cleanup = async () => {
        try {
          if (isConnected) {
            await disconnect.mutateAsync()
          }
        } finally {
          isLoggingOutRef.current = false
          window.location.href = '/login'
        }
      }
      cleanup()
    }
    wasLoggedInRef.current = isLoggedIn
  }, [isLoggedIn, isConnected, disconnect])
}
