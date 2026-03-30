import { useState, useEffect, useCallback, useRef } from 'react'

type LzStatus = 'IDLE' | 'INFLIGHT' | 'DELIVERED' | 'FAILED' | 'PAYLOAD_STORED'

const LZ_API_BASE =
  process.env.NEXT_PUBLIC_LZ_API_URL ??
  'https://scan.layerzero-api.com/v1/messages/tx'

const POLL_INTERVAL = 5_000
const INITIAL_DELAY = 2_000
const MAX_POLL_ATTEMPTS = 120 // ~10 minutes

async function fetchLzStatus(
  hash: string,
  signal?: AbortSignal,
): Promise<{ status: LzStatus; dstTxHash: string | null } | null> {
  try {
    const response = await fetch(`${LZ_API_BASE}/${hash}`, { signal })
    if (!response.ok) return null

    const data = await response.json()
    const message = data.data?.[0]
    if (!message) return null

    const status = message.status?.name as string
    if (
      status === 'DELIVERED' ||
      status === 'FAILED' ||
      status === 'PAYLOAD_STORED'
    ) {
      return {
        status: status as LzStatus,
        dstTxHash: message.destination?.tx?.txHash ?? null,
      }
    }
    return null // still INFLIGHT or unknown
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err
    console.error('LayerZero polling error:', err)
    return null
  }
}

export function useLayerZeroScan(sourceHash?: string) {
  const [lzStatus, setLzStatus] = useState<LzStatus>('IDLE')
  const [dstTxHash, setDstTxHash] = useState<string | null>(null)
  const activeRef = useRef(false)

  useEffect(() => {
    if (!sourceHash) return

    setLzStatus('INFLIGHT')
    setDstTxHash(null)
    activeRef.current = true

    const controller = new AbortController()
    let timeoutId: ReturnType<typeof setTimeout>
    let attempts = 0

    const poll = async () => {
      if (!activeRef.current) return

      attempts += 1
      if (attempts > MAX_POLL_ATTEMPTS) {
        setLzStatus('FAILED')
        return
      }

      const result = await fetchLzStatus(sourceHash, controller.signal).catch(
        () => null,
      )

      if (!activeRef.current) return

      if (result) {
        setLzStatus(result.status)
        if (result.dstTxHash) setDstTxHash(result.dstTxHash)
        activeRef.current = false
        return // terminal state — stop polling
      }

      // Not terminal yet — schedule next poll
      timeoutId = setTimeout(poll, POLL_INTERVAL)
    }

    // Start first poll after a short initial delay
    timeoutId = setTimeout(poll, INITIAL_DELAY)

    return () => {
      activeRef.current = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [sourceHash])

  // Manual refetch for imperative use (e.g. visibility change)
  const refetch = useCallback(async () => {
    if (!sourceHash || activeRef.current) return

    const result = await fetchLzStatus(sourceHash).catch(() => null)
    if (result) {
      setLzStatus(result.status)
      if (result.dstTxHash) setDstTxHash(result.dstTxHash)
    }
  }, [sourceHash])

  // Auto-refetch when user returns to the tab (handles backgrounded tabs
  // where setTimeout is throttled by the browser)
  useEffect(() => {
    if (!sourceHash) return

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && activeRef.current) {
        // Immediately fire one poll when tab becomes visible
        fetchLzStatus(sourceHash).then((result) => {
          if (!result || !activeRef.current) return
          setLzStatus(result.status)
          if (result.dstTxHash) setDstTxHash(result.dstTxHash)
          activeRef.current = false
        })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [sourceHash])

  return { lzStatus, dstTxHash, refetch }
}
