'use client'

import Footer from '@/components/footer'
import Header from '@/components/header'

export default function PointsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
