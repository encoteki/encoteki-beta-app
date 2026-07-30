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

/**
 * TSBSatellite.mintRequests[reqId].status — matches `enum MintStatus` in
 * TSBEnums.sol exactly (NONE, PENDING, FAILED, REFUNDED). Previously listed
 * as PENDING=0/COMPLETED=1/FAILED=2/REFUNDED=3, which doesn't match the
 * deployed contract; left unused until now so nothing depended on the wrong
 * values.
 */
export enum OnChainMintStatus {
  NONE = 0,
  PENDING = 1,
  FAILED = 2,
  REFUNDED = 3,
}
