import { useEffect, useCallback } from 'react'
import DefaultButton from '@/ui/buttons/default-btn'
import { useMintTransaction } from '@/hooks/useMintTransaction'
import { useMintCtx } from '../../contexts/mint.context'
import { Address } from 'viem'
import { MintStatus } from '../../enums/mint.enum'

interface MintButtonProps {
  tokenAddress: Address
  price: string
  referralCode?: string
  targetContract: Address
}

export const MintButton = ({
  tokenAddress,
  price,
  referralCode,
  targetContract,
}: MintButtonProps) => {
  const {
    setStatus,
    setExplorerUrl,
    setSourceHash,
    setReqId,
    setDstTxHash,
    setErrorMessage,
  } = useMintCtx()

  const mint = useMintTransaction({
    tokenAddress,
    price,
    referralCode,
    targetContract,
  })

  // Sync mint phase → context status
  useEffect(() => {
    switch (mint.phase) {
      case 'approving':
        setStatus(MintStatus.APPROVING)
        break
      case 'signing':
      case 'mining':
        setStatus(MintStatus.PENDING)
        break
      case 'inflight':
        setStatus(MintStatus.INFLIGHT)
        if (mint.sourceHash) setSourceHash(mint.sourceHash)
        if (mint.reqId) setReqId(mint.reqId)
        if (mint.explorerUrl) setExplorerUrl(mint.explorerUrl)
        break
      case 'minting':
        setStatus(MintStatus.MINTING)
        if (mint.explorerUrl) setExplorerUrl(mint.explorerUrl)
        if (mint.sourceHash) setSourceHash(mint.sourceHash)
        if (mint.dstTxHash) setDstTxHash(mint.dstTxHash)
        if (mint.reqId) setReqId(mint.reqId)
        break
      case 'success':
        setStatus(MintStatus.SUCCESS)
        if (mint.explorerUrl) setExplorerUrl(mint.explorerUrl)
        if (mint.sourceHash) setSourceHash(mint.sourceHash)
        if (mint.dstTxHash) setDstTxHash(mint.dstTxHash)
        if (mint.reqId) setReqId(mint.reqId)
        break
      case 'error':
        setStatus(MintStatus.FAILED)
        if (mint.errorMsg) setErrorMessage(mint.errorMsg)
        break
    }
  }, [
    mint.phase,
    mint.sourceHash,
    mint.explorerUrl,
    mint.reqId,
    mint.dstTxHash,
    mint.errorMsg,
  ])

  const onClickConfirm = useCallback(() => {
    mint.execute()
  }, [mint.execute])

  const getButtonLabel = () => {
    if (!mint.isReady) return 'Preparing...'
    if (mint.phase === 'signing') return 'Check Wallet...'
    if (mint.phase === 'approving') return 'Approving...'
    if (mint.phase === 'mining')
      return mint.isCrossChain ? 'Sending...' : 'Minting...'
    if (mint.phase === 'inflight') return 'Cross-chain in flight...'
    if (mint.phase === 'minting') return 'Minting...'
    if (mint.phase === 'error') return 'Retry'
    if (mint.phase === 'success') return 'Success!'
    return mint.needsApproval ? 'Approve & Mint' : 'Confirm Mint'
  }

  const isDisabled =
    !mint.isReady ||
    mint.phase === 'signing' ||
    mint.phase === 'approving' ||
    mint.phase === 'mining' ||
    mint.phase === 'inflight' ||
    mint.phase === 'minting' ||
    mint.phase === 'success'

  return (
    <div className="flex flex-col gap-3">
      <DefaultButton
        onClick={
          mint.phase === 'error'
            ? () => {
                mint.reset()
              }
            : onClickConfirm
        }
        disabled={isDisabled}
      >
        {getButtonLabel()}
      </DefaultButton>

      {mint.errorMsg && (
        <p className="text-center text-sm text-red-500">{mint.errorMsg}</p>
      )}

      {mint.isCrossChain && mint.lzFee > BigInt(0) && mint.phase === 'idle' && (
        <p className="text-center text-xs text-neutral-40">
          Includes LayerZero cross-chain fee
        </p>
      )}
    </div>
  )
}
