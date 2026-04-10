'use client'

import { useState, useEffect, useRef } from 'react'
import { useSignMessage, useChainId, useDisconnect, useConnection } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useConnectModal } from '@xellar/kit'
import { useUser } from '@/hooks/useUser'
import {
  generateSiweNonce,
  verifySiweMessage,
  destroySession,
} from '@/actions/auth'

export function SignInButton() {
  const { open } = useConnectModal()
  const { address, isConnected } = useConnection()
  const chainId = useChainId()
  const signMessage = useSignMessage()
  const disconnect = useDisconnect()
  const { isLoggedIn, isLoading: isSessionLoading, mutate } = useUser()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const shouldSignRef = useRef(false)

  // Login SIWE
  const handleLogin = async () => {
    try {
      if (!address || !chainId) return
      setIsSigningIn(true)

      const nonce = await generateSiweNonce()

      const message = new SiweMessage({
        domain: window.location.host,
        address: address,
        statement: 'Sign in to Encoteki Beta App',
        uri: window.location.origin,
        version: '1',
        chainId: chainId,
        nonce: nonce,
      })

      const messageToSign = message.prepareMessage()
      const signature = await signMessage.mutateAsync({
        message: messageToSign,
      })

      const result = await verifySiweMessage(messageToSign, signature)

      if (!result.success) throw new Error('Failed to verify')

      await mutate()

      shouldSignRef.current = false
    } catch (error) {
      console.error('Login Error:', error)
      await disconnect.mutateAsync()
    } finally {
      setIsSigningIn(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    try {
      await destroySession()
      if (isConnected) {
        await disconnect.mutateAsync()
      }
      await mutate(undefined, false)
      shouldSignRef.current = false
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  // Auto effect SIWE
  useEffect(() => {
    if (
      isConnected &&
      address &&
      shouldSignRef.current &&
      !isLoggedIn &&
      !isSigningIn
    ) {
      handleLogin()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, isLoggedIn, isSigningIn])

  const handleClick = () => {
    if (!isConnected) {
      shouldSignRef.current = true
      open()
    } else {
      handleLogin()
    }
  }

  if (isSessionLoading) {
    return (
      <button
        className="flex w-full cursor-not-allowed items-center justify-center rounded-full bg-neutral-60/20 px-5 py-3 text-sm font-medium text-neutral-40 transition-colors duration-300 tablet:w-auto tablet:py-2.5"
        disabled
      >
        <Loading label="Loading..." />
      </button>
    )
  }

  // Disconnect Button
  if (isLoggedIn && isConnected) {
    return (
      <button
        onClick={handleLogout}
        className="w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-primary-red shadow-sm ring-1 ring-neutral-60/20 transition-all duration-200 outline-none hover:bg-red-50 hover:shadow focus-visible:ring-2 focus-visible:ring-primary-red active:scale-[0.98] tablet:w-auto tablet:py-2.5"
      >
        Disconnect
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSigningIn}
      className="w-full rounded-full bg-primary-green px-5 py-3 text-sm font-medium text-white shadow-[0_4px_12px_rgba(36,98,52,0.2)] transition-all duration-200 outline-none hover:bg-primary-green/90 hover:shadow-[0_6px_16px_rgba(36,98,52,0.3)] focus-visible:ring-2 focus-visible:ring-primary-green focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary-green disabled:hover:shadow-none tablet:w-auto tablet:py-2.5"
    >
      {isSigningIn ? (
        <Loading label="Signing..." />
      ) : isConnected ? (
        'Sign-In with Ethereum'
      ) : (
        'Sign In'
      )}
    </button>
  )
}

function Loading({ label = 'Loading...' }: { label: string }) {
  return (
    <span className="flex w-full justify-center gap-2">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {label}
    </span>
  )
}
