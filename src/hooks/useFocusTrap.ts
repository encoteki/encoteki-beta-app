'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

interface FocusTrapOptions {
  /** Called when Escape is pressed while the trap is active. */
  onEscape?: () => void
  /** Restore focus to the previously-focused element on deactivate. Default true. */
  restoreFocus?: boolean
  /** Element to focus first; defaults to the first focusable descendant. */
  initialFocusRef?: RefObject<HTMLElement | null>
}

/**
 * Traps keyboard focus within `containerRef` while `isActive` is true:
 * moves focus into the container on activate, cycles Tab/Shift+Tab within it,
 * optionally closes on Escape, and restores focus to the trigger on deactivate.
 *
 * This is what makes `aria-modal="true"` honest — without it, keyboard and
 * screen-reader users can tab out into the inert background behind a dialog.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
  { onEscape, restoreFocus = true, initialFocusRef }: FocusTrapOptions = {},
) {
  // Hold callbacks in refs so changing identities don't re-run the main effect.
  const onEscapeRef = useRef(onEscape)
  const initialFocusRefRef = useRef(initialFocusRef)
  // Sync the refs in an effect (not during render) to satisfy react-hooks/refs.
  useEffect(() => {
    onEscapeRef.current = onEscape
    initialFocusRefRef.current = initialFocusRef
  })

  useEffect(() => {
    if (!isActive) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Focus after paint so the dialog content is mounted and measurable.
    const raf = requestAnimationFrame(() => {
      const target =
        initialFocusRefRef.current?.current ??
        container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
        container
      target.focus()
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscapeRef.current?.()
        return
      }
      if (e.key !== 'Tab') return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (el) =>
          // visible…
          (el.offsetParent !== null || el === document.activeElement) &&
          // …and not inside an inert subtree (e.g. the panel behind an overlay)
          !el.closest('[inert]'),
      )

      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKeyDown)
      if (restoreFocus) previouslyFocused?.focus?.()
    }
  }, [isActive, containerRef, restoreFocus])
}
