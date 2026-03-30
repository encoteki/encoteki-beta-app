export enum MintStatus {
  HOME = 'HOME',
  REVIEW = 'REVIEW',
  APPROVING = 'APPROVING',
  PENDING = 'PENDING',
  INFLIGHT = 'INFLIGHT',
  MINTING = 'MINTING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

/** On-chain MintRequest status (maps to contract uint8) */
export enum OnChainMintStatus {
  PENDING = 0,
  COMPLETED = 1,
  FAILED = 2,
  REFUNDED = 3,
}
