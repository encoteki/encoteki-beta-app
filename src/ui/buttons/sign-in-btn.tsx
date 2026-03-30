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
        className="w-full animate-pulse cursor-pointer rounded-4xl bg-gray-200 px-4 py-3 text-gray-500 duration-300 hover:scale-105 hover:bg-(--green-10) disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-4"
        disabled
      >
        Loading...
      </button>
    )
  }

  // Disconnect Button
  if (isLoggedIn && isConnected) {
    return (
      <button
        onClick={handleLogout}
        className="w-full cursor-pointer rounded-4xl bg-white py-3 font-medium text-primary-red duration-300 marker:text-sm hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-4 md:text-base"
      >
        Disconnect
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSigningIn}
      className="w-full cursor-pointer rounded-4xl bg-primary-green py-3 font-medium text-white duration-300 marker:text-sm hover:scale-105 hover:bg-green-10 disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-4 md:text-base"
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
