'use client'

import { SignInButton } from '@/ui/buttons/sign-in-btn'
import Image from 'next/image'
import Logo from '@/assets/logos/icon-white.png'
import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { useConnection } from 'wagmi'
import { motion } from 'framer-motion'
import Bg from '@/assets/bg-login.png'
import { applyReferralCode } from '@/actions/referral'

export default function SignInPage() {
  const { isLoggedIn, hasReferral, isLoading, mutate } = useUser()
  const { isConnected } = useConnection()

  // State Form
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Auto Reset on Disconnect
  useEffect(() => {
    if (!isConnected) {
      setCode('')
      setErrorMsg('')
    }
  }, [isConnected])

  // Auto Redirect if Eligible (Has Referral)
  useEffect(() => {
    if (isLoggedIn && hasReferral) {
      window.location.href = '/mint'
    }
  }, [isLoggedIn, hasReferral])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg('')

    try {
      const result = await applyReferralCode(code)

      if (!result.success) {
        throw new Error(result.error || 'Failed to apply referral code')
      }

      await mutate()
      window.location.href = '/mint'
    } catch (err: any) {
      setErrorMsg(err.message)
      setIsSubmitting(false)
    }
  }

  const showLoginForm = !isConnected || !isLoggedIn

  return (
    // Background Layer - Menggunakan solid color (indigo gelap) sementara
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#2A0E61] py-12 sm:px-6 lg:px-8">
      {/* ALTERNATIF NEXT/IMAGE UNTUK BACKGROUND:
        Uncomment bagian di bawah ini nanti ketika aset gambar background sudah siap.
        Pastikan gambar memiliki resolusi tinggi.
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src={Bg}
          alt="Background"
          fill
          className="object-cover object-center"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Modal Container dengan Animasi */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        // bg-white/10, backdrop-blur-xl, dan border-white/20 adalah kunci efek glass-nya
        className="relative z-10 flex w-full max-w-105 flex-col items-center rounded-4xl border border-white/20 bg-white/20 p-10 text-center shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl sm:mx-auto"
      >
        {/* Logo Placement */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl">
          <Image
            src={Logo}
            alt="Encoteki Logo"
            width={56}
            height={56}
            priority
            className="drop-shadow-sm"
          />
        </div>

        {/* Wording yang diminta */}
        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-white/95">
          Sign in to Encoteki Beta Apps
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-white/90">
          Just follow a few simple steps to connect your wallet and launch your
          journey on Encoteki.
        </p>

        {/* Logic Rendering */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex animate-pulse flex-col items-center gap-3">
              <div className="h-12 w-full rounded-full bg-gray-200"></div>
              <div className="mt-2 h-4 w-32 rounded bg-gray-200"></div>
            </div>
          ) : showLoginForm ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full flex-col items-center"
            >
              {/* Pastikan SignInButton Anda styling-nya rounded-full atau pill-shape agar cocok */}
              <SignInButton />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex w-full flex-col"
            >
              {!hasReferral ? (
                <div className="w-full text-left">
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col space-y-4"
                  >
                    <div>
                      <label
                        htmlFor="code"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Referral Code
                      </label>
                      <input
                        id="code"
                        name="code"
                        type="text"
                        required
                        placeholder="Enter your invite code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="block w-full rounded-xl border-0 bg-gray-50 px-4 py-3 text-center text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all duration-200 ring-inset placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-primary-green focus:ring-inset sm:text-sm sm:leading-6"
                      />
                    </div>

                    {errorMsg && (
                      <p className="rounded-lg border border-red-100 bg-red-50 p-3 text-center text-sm text-red-600">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !code}
                      className="mt-2 w-full cursor-pointer rounded-full bg-primary-green py-3.5 font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="loading loading-spinner loading-sm"></span>
                          <span>Validating...</span>
                        </div>
                      ) : (
                        'Enter Beta App'
                      )}
                    </button>

                    <div className="pt-4 text-center">
                      <SignInButton />
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-green"></div>
                  <p className="text-sm font-medium text-white">
                    Redirecting...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </main>
  )
}
