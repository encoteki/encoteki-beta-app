'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useDisconnect, useConnection } from 'wagmi'
import { useUser } from './useUser'

/**
 * Session guard that automatically logs out the user when:
 * 1. The session expires (based on server-provided expiresAt)
 * 2. The wallet disconnects but the session is still active
 *
 * Should be mounted once near the top of the component tree.
 */
export function useSessionGuard() {
  const { isConnected } = useConnection()
  const disconnect = useDisconnect()
  const { isLoggedIn, expiresAt, mutate } = useUser()
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoggingOutRef = useRef(false)

  const performLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    try {
      // Clear server session
      await fetch('/api/session', { method: 'DELETE' })

      // Disconnect wallet if still connected
      if (isConnected) {
        await disconnect.mutateAsync()
      }

      // Revalidate SWR cache
      await mutate(undefined, false)

      // Redirect to login
      window.location.href = '/login'
    } catch (error) {
      console.error('Session guard logout failed:', error)
    } finally {
      isLoggingOutRef.current = false
    }
  }, [isConnected, disconnect, mutate])

  // --- Timer-based expiry: schedule logout when session expires ---
  useEffect(() => {
    // Clear any existing timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current)
      logoutTimerRef.current = null
    }

    if (!isLoggedIn || !expiresAt) return

    const remaining = expiresAt - Date.now()

    if (remaining <= 0) {
      // Already expired
      performLogout()
      return
    }

    // Schedule logout slightly before expiry (+1s buffer for network)
    logoutTimerRef.current = setTimeout(() => {
      performLogout()
    }, remaining)

    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current)
        logoutTimerRef.current = null
      }
    }
  }, [isLoggedIn, expiresAt, performLogout])

  // --- Wallet disconnect detection ---
  // If the user is logged in via session but wallet is no longer connected,
  // clear the session to keep them in sync.
  useEffect(() => {
    if (isLoggedIn && !isConnected) {
      performLogout()
    }
  }, [isLoggedIn, isConnected, performLogout])
}
