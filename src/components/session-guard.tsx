'use client'

import { useSessionGuard } from '@/hooks/useSessionGuard'

/**
 * Invisible component that runs the session guard.
 * Automatically logs out when session expires or wallet disconnects.
 */
export function SessionGuard() {
  useSessionGuard()
  return null
}
