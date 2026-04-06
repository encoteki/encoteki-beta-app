import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'

export default async function App() {
  // Check authentication before redirecting
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )

  // If not authenticated or no referral, redirect to login
  if (!session.siwe?.address || !session.hasReferral) {
    redirect('/login')
  }

  // If authenticated, redirect to mint
  redirect('/mint')
}
