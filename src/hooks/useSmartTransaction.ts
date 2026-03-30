import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  type BaseError,
} from 'wagmi'
import { Address, type Abi } from 'viem'

type SimulateContractProps = {
  abi: Abi
  address: Address
  functionName: string
  args?: any[]
  value?: bigint
  query?: {
    enabled?: boolean
  }
}

export function useSmartTransaction(props: SimulateContractProps) {
  const simulation = useSimulateContract({
    ...props,
  })

  // 2. WRITE (Execute the transaction)
  const {
    mutate,
    data: hash,
    isPending: isSigning,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract()

  // 3. WAIT (Wait for block confirmation)
  const confirmation = useWaitForTransactionReceipt({
    hash,
    query: {
      enabled: !!hash, // Only run this hook if we have a transaction hash
    },
  })

  // Combine all errors into one object for the UI
  const error = (simulation.error ||
    writeError ||
    confirmation.error) as BaseError | null

  // Determine the high-level status of the flow
  let status:
    | 'idle'
    | 'simulating'
    | 'signing'
    | 'processing'
    | 'success'
    | 'error' = 'idle'

  if (error) {
    status = 'error'
  } else if (confirmation.isLoading) {
    status = 'processing'
  } else if (isSigning) {
    status = 'signing'
  } else if (confirmation.isSuccess) {
    status = 'success'
  } else if (simulation.isLoading) {
    status = 'simulating'
  }

  // --- Trigger Function ---

  const write = () => {
    if (simulation.data?.request) {
      mutate(simulation.data.request)
    } else {
      console.error('Cannot write: Simulation failed or incomplete')
    }
  }

  const reset = () => {
    resetWrite()
  }

  return {
    write,
    reset,

    // Data
    hash,
    receipt: confirmation.data,

    // UI States
    status,
    error,

    // Detailed Loading States (if you need granular control)
    isSimulating: simulation.isLoading,
    isSigning,
    isProcessing: confirmation.isLoading,
    isSuccess: confirmation.isSuccess,

    // Smart Disabling: Disable button if simulating, signing, processing, or if simulation failed
    isDisabled:
      !simulation.data?.request ||
      isSigning ||
      confirmation.isLoading ||
      confirmation.isSuccess,

    isSimulationSuccess: simulation.isSuccess,
    simulationData: simulation.data,
  }
}
