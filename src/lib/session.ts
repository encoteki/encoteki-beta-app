import { SessionOptions } from 'iron-session'

// Session TTL in seconds (1 hour)
export const SESSION_TTL = 60 * 60

export interface SessionData {
  nonce?: string
  siwe?: {
    address: string
  }
  hasReferral: boolean
  createdAt?: number // unix timestamp (ms) when session was created
}

if (!process.env.IRON_SESSION_PASSWORD) {
  throw new Error('cookie password is not defined')
}

export const sessionOptions: SessionOptions = {
  password: process.env.IRON_SESSION_PASSWORD,
  cookieName: 'siwe-encoteki-beta',
  ttl: SESSION_TTL,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL,
  },
}
