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
import { Loader2 } from 'lucide-react'

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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-10 py-12 sm:px-6 lg:px-8">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <Image
          src={Bg}
          alt="Background"
          fill
          className="object-cover object-center opacity-40 mix-blend-luminosity"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-10/80 to-neutral-10/20" />
      </div>

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-2xl backdrop-blur-xl sm:mx-auto"
      >
        {/* Logo Placement */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 shadow-inner ring-1 ring-white/10 backdrop-blur-md">
          <Image
            src={Logo}
            alt="Encoteki Logo"
            width={40}
            height={40}
            priority
            className="drop-shadow-md"
          />
        </div>

        <h1 className="mb-2 text-2xl font-medium tracking-tight text-white">
          Sign in to Encoteki Beta
        </h1>
        <p className="mb-10 text-sm leading-relaxed text-white/60">
          Connect your wallet and enter your invite code to begin your journey
          on Encoteki.
        </p>

        {/* Logic Rendering */}
        <div className="w-full">
          {isLoading ? (
            <div className="flex animate-pulse flex-col items-center gap-4 py-4">
              <div className="h-12 w-full rounded-2xl bg-white/10"></div>
              <div className="h-4 w-1/3 rounded-full bg-white/10"></div>
            </div>
          ) : showLoginForm ? (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex w-full flex-col items-center"
            >
              <SignInButton />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.4 }}
              className="flex w-full flex-col"
            >
              {!hasReferral ? (
                <div className="w-full text-left">
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="code"
                        className="pl-1 text-xs font-medium tracking-wider text-white/70 uppercase"
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
                        className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-lg tracking-widest text-white shadow-inner transition-all duration-200 placeholder:tracking-normal placeholder:text-white/20 focus:border-primary-green/50 focus:bg-white/10 focus:ring-1 focus:ring-primary-green/50 focus:outline-none"
                      />
                    </div>

                    {errorMsg && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-sm font-medium text-red-200"
                      >
                        {errorMsg}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting || !code}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-green px-4 py-3.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(36,98,52,0.4)] transition-all duration-300 hover:bg-primary-green/90 hover:shadow-[0_0_24px_rgba(36,98,52,0.6)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Validating...</span>
                        </>
                      ) : (
                        'Enter Beta'
                      )}
                    </button>

                    <div className="mt-4 flex w-full flex-col items-center border-t border-white/5 pt-6">
                      <p className="mb-4 text-xs text-white/40">
                        Switch Wallet
                      </p>
                      <SignInButton />
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-green" />
                  <p className="text-sm font-medium tracking-wide text-white/80">
                    Preparing your workspace...
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
