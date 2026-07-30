'use client'

import { useEffect, useState } from 'react'
import { fetchIpfsJson, isIpfsUri } from '@/lib/ipfs-client'
import { ProposalIpfsContentSchema } from '@/lib/schemas'
import { reportError } from '@/lib/telemetry'

interface UseProposalDescriptionResult {
  description: string
  isLoading: boolean
  isError: boolean
}

/**
 * Resolves a proposal's `description` field, which is either inline text/HTML
 * or an `ipfs://` URI pointing at a JSON document with a `description` field
 * (see ProposalIpfsContentSchema). Non-IPFS descriptions resolve immediately
 * with no network round trip.
 */
export function useProposalDescription(
  raw: string,
): UseProposalDescriptionResult {
  const ipfs = isIpfsUri(raw)
  const [state, setState] = useState<{
    key: string
    description: string
    isError: boolean
  }>({ key: '', description: '', isError: false })

  useEffect(() => {
    if (!ipfs) return
    let active = true
    const controller = new AbortController()

    fetchIpfsJson(raw, controller.signal)
      .then((json) => {
        if (!active) return
        const parsed = ProposalIpfsContentSchema.safeParse(json)
        if (parsed.success && parsed.data.description) {
          setState({
            key: raw,
            description: parsed.data.description,
            isError: false,
          })
        } else {
          setState({ key: raw, description: '', isError: true })
        }
      })
      .catch((err: unknown) => {
        if (!active) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        reportError(err, { source: 'useProposalDescription', uri: raw })
        setState({ key: raw, description: '', isError: true })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [raw, ipfs])

  if (!ipfs) return { description: raw, isLoading: false, isError: false }

  const isLoading = state.key !== raw
  return {
    description: isLoading ? '' : state.description,
    isLoading,
    isError: !isLoading && state.isError,
  }
}
