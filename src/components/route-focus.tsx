'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * App Router navigations don't reload the page, so assistive tech is never told
 * the view changed and focus stays on the old (now-gone) element. On each route
 * change this moves focus to the main landmark and announces the new page via an
 * aria-live region — the SPA equivalent of a full page load for screen readers.
 */
export function RouteFocus() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Skip the initial load — the browser already focuses correctly there.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const main =
      document.getElementById('main-content') ?? document.querySelector('main')

    if (main instanceof HTMLElement) {
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1')
      main.focus({ preventScroll: false })
    }

    if (announcerRef.current) {
      // Prefer the document title; fall back to the path.
      announcerRef.current.textContent = document.title || pathname
    }
  }, [pathname])

  return (
    <div
      ref={announcerRef}
      role="status"
      aria-live="polite"
      className="sr-only"
    />
  )
}
