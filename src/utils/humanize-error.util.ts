const PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /user rejected|user denied|rejected the request|action_rejected/i,
    message:
      'You cancelled the transaction. Tap "Try again" whenever you\'re ready.',
  },
  {
    test: /insufficient funds|exceeds.*balance|balance.*insufficient|not enough.*balance/i,
    message:
      'Not enough funds to cover this transaction. Top up your wallet and try again.',
  },
  {
    test: /insufficient allowance|allowance.*low|erc20.*allowance/i,
    message:
      'Token approval was too low. Try again and approve the full amount.',
  },
  {
    test: /execution reverted|reverted without a reason|transaction reverted/i,
    message:
      'The contract rejected this transaction. Try again or contact support if it keeps failing.',
  },
  {
    test: /cannot estimate gas|gas.*required.*exceeds|gas.*too low|out of gas|intrinsic gas/i,
    message:
      'Unable to estimate gas fees. Make sure you have enough ETH for network fees.',
  },
  {
    test: /nonce too low|replacement.*underpriced|already known/i,
    message: 'A transaction conflict was detected. Please try again.',
  },
  {
    test: /network.*error|connection.*refused|could not connect|fetch failed|request timeout|etimedout/i,
    message: 'Network connection error. Check your internet and try again.',
  },
  {
    test: /cross-chain delivery failed/i,
    message: 'Cross-chain delivery failed. Use the recovery options below.',
  },
  {
    test: /failed to switch|switch.*chain.*failed/i,
    message:
      'Could not switch networks. Try switching manually in your wallet.',
  },
]

export function humanizeError(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.'

  const raw = [
    (err as any)?.shortMessage,
    (err as any)?.message,
    (err as any)?.details,
    String(err),
  ]
    .filter(Boolean)
    .join(' ')

  for (const { test, message } of PATTERNS) {
    if (test.test(raw)) return message
  }

  return 'Something went wrong. Please try again.'
}
