'use client'

import { useCallback, useRef, useState } from 'react'
import { useMintCtx } from '@/contexts/mint.context'
import { MintStatus } from '@/enums/mint.enum'
import DefaultButton from './default-btn'

type MockScenario = 'hub' | 'cross-chain' | 'fail-hub' | 'fail-cross'

const SCENARIOS: { key: MockScenario; label: string }[] = [
  { key: 'hub', label: 'Hub mint' },
  { key: 'cross-chain', label: 'Cross-chain' },
  { key: 'fail-hub', label: 'Fail (hub)' },
  { key: 'fail-cross', label: 'Fail (cross)' },
]

const MOCK_SRC_HASH =
  '0xabc123000000000000000000000000000000000000000000000000000000001a'
const MOCK_DST_HASH =
  '0xdef456000000000000000000000000000000000000000000000000000000002b'

// Sequences: [status, delayMs before advancing to next]
const FLOWS: Record<MockScenario, [MintStatus, number][]> = {
  hub: [
    [MintStatus.APPROVING, 1400],
    [MintStatus.PENDING, 1800],
    [MintStatus.SUCCESS, 0],
  ],
  'cross-chain': [
    [MintStatus.APPROVING, 1200],
    [MintStatus.PENDING, 1600],
    [MintStatus.INFLIGHT, 2200],
    [MintStatus.MINTING, 1600],
    [MintStatus.SUCCESS, 0],
  ],
  'fail-hub': [
    [MintStatus.APPROVING, 1000],
    [MintStatus.PENDING, 1200],
    [MintStatus.FAILED, 0],
  ],
  'fail-cross': [
    [MintStatus.APPROVING, 1000],
    [MintStatus.PENDING, 1200],
    [MintStatus.INFLIGHT, 1400],
    [MintStatus.FAILED, 0],
  ],
}

export function MockMintButton() {
  const {
    setStatus,
    setSourceHash,
    setExplorerUrl,
    setDstTxHash,
    setReqId,
    setIsCrossChain,
    setErrorMessage,
    status,
  } = useMintCtx()

  const [scenario, setScenario] = useState<MockScenario>('hub')
  const [running, setRunning] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const run = useCallback(() => {
    clearTimers()
    setRunning(true)

    const isCross = scenario === 'cross-chain' || scenario === 'fail-cross'
    setIsCrossChain(isCross)
    setSourceHash(MOCK_SRC_HASH as `0x${string}`)
    setExplorerUrl(null)
    setDstTxHash(null)
    setReqId(null)
    setErrorMessage(null)

    const flow = FLOWS[scenario]
    let elapsed = 0

    flow.forEach(([s, delay], i) => {
      const t = setTimeout(() => {
        setStatus(s)

        if (s === MintStatus.INFLIGHT || s === MintStatus.MINTING) {
          setReqId(
            '0xreqid00000000000000000000000000000000000000000000000001' as `0x${string}`,
          )
        }
        if (s === MintStatus.MINTING || s === MintStatus.SUCCESS) {
          setDstTxHash(MOCK_DST_HASH)
        }
        if (s === MintStatus.FAILED) {
          setErrorMessage('Simulated failure — no real transaction was made.')
        }

        const isLast = i === flow.length - 1
        if (isLast) setRunning(false)
      }, elapsed)

      timersRef.current.push(t)
      elapsed += delay
    })
  }, [
    scenario,
    clearTimers,
    setStatus,
    setSourceHash,
    setExplorerUrl,
    setDstTxHash,
    setReqId,
    setIsCrossChain,
    setErrorMessage,
  ])

  const isTerminal =
    status === MintStatus.SUCCESS || status === MintStatus.FAILED

  return (
    <div className="flex flex-col gap-3">
      {/* Dev banner */}
      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <span className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">
          Dev mode
        </span>
        <span className="text-xs text-amber-700">
          Mock — no contract interaction
        </span>
      </div>

      {/* Scenario pills */}
      <div className="flex flex-wrap gap-1.5">
        {SCENARIOS.map(({ key, label }) => (
          <button
            key={key}
            disabled={running}
            onClick={() => setScenario(key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              scenario === key
                ? 'bg-neutral-10 text-white'
                : 'bg-khaki-90 text-neutral-40 hover:bg-khaki-70 hover:text-neutral-10'
            } disabled:opacity-40`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Action button */}
      <DefaultButton onClick={run} disabled={running}>
        {running ? 'Simulating...' : 'Simulate mint'}
      </DefaultButton>
    </div>
  )
}
