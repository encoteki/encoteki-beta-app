import { Hex, stringToHex, zeroHash } from 'viem'

/**
 * Encodes a referral code into the `bytes32 refCode` param `vote()`/`abstain()`
 * expect on-chain. Right-padded like a Solidity string-literal-to-bytes32
 * conversion (not hashed), so it round-trips via `hexToString` for later
 * off-chain attribution. Falls back to the zero hash when there's no code or
 * it doesn't fit in 32 bytes.
 */
export function encodeRefCode(code: string | null | undefined): Hex {
  if (!code) return zeroHash
  try {
    return stringToHex(code, { size: 32 })
  } catch {
    return zeroHash
  }
}
