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
  chainId: number
}

export const MintButton = ({
  tokenAddress,
  price,
  referralCode,
  targetContract,
  chainId,
}: MintButtonProps) => {
  const {
    setStatus,
    setExplorerUrl,
    setSourceHash,
    setReqId,
    setDstTxHash,
    setErrorMessage,
    sourceHash,
    status,
  } = useMintCtx()

  // When the component mounts after a restore-from-background, status is
  // already INFLIGHT and sourceHash is the confirmed source tx hash. Pass it
  // as initialHash so useMintTransaction can resume receipt watching and LZ
  // polling immediately without a new on-chain write.
  // On a fresh mint (status === REVIEW) sourceHash is null, so this is a no-op.
  const initialHash =
    status === MintStatus.INFLIGHT && sourceHash ? sourceHash : null

  const mint = useMintTransaction({
    tokenAddress,
    price,
    referralCode,
    targetContract,
    chainId,
    initialHash,
  })

  // Sync mint phase → context status
  useEffect(() => {
    switch (mint.phase) {
      case 'signing-approve':
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
    if (mint.phase === 'switching-chain') return 'Switching network...'
    if (mint.phase === 'signing-approve' || mint.phase === 'signing')
      return 'Check wallet...'
    if (mint.phase === 'approving') return 'Approving...'
    if (mint.phase === 'mining')
      return mint.isCrossChain ? 'Sending...' : 'Minting...'
    if (mint.phase === 'inflight') return 'Bridging tokens...'
    if (mint.phase === 'minting') return 'Minting...'
    if (mint.phase === 'error') return 'Retry'
    if (mint.phase === 'success') return 'Success!'
    return mint.needsApproval ? 'Approve & mint' : 'Confirm mint'
  }

  const isDisabled =
    !mint.isReady ||
    mint.phase === 'switching-chain' ||
    mint.phase === 'signing-approve' ||
    mint.phase === 'signing' ||
    mint.phase === 'approving' ||
    mint.phase === 'mining' ||
    mint.phase === 'inflight' ||
    mint.phase === 'minting' ||
    mint.phase === 'success'

  return (
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
  )
}
