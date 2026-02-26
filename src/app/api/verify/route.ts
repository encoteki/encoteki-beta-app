import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { SiweMessage } from 'siwe'
import { sessionOptions, SessionData } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase/admin' // 1. Pastikan import ini ada

export async function POST(request: Request) {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  const { message, signature } = await request.json()

  try {
    const siweMessage = new SiweMessage(message)
    const { data } = await siweMessage.verify({ signature })

    if (data.nonce !== session.nonce) {
      return Response.json({ message: 'Invalid nonce' }, { status: 422 })
    }

    const userAddress = data.address.toLowerCase()

    // Check if already apply referral
    const { data: referralData, error } = await supabaseAdmin
      .from('referral')
      .select('id')
      .eq('address'.toLowerCase(), userAddress)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Referral Check Error:', error)
    }

    session.siwe = {
      address: userAddress,
    }
    session.hasReferral = !!referralData
    session.createdAt = Date.now()
    session.nonce = undefined

    await session.save()

    return Response.json(
      { success: true, hasReferral: !!referralData },
      { status: 200 },
    )
  } catch (error) {
    console.error(error)
    session.destroy()
    return Response.json(
      { success: false, message: 'Invalid signature' },
      { status: 500 },
    )
  }
}
