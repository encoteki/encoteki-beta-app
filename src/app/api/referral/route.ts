import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase/admin'

const jsonResponse = (success: boolean, data?: any, status = 200) =>
  NextResponse.json({ success, ...data }, { status })

async function getSession() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  )
  if (!session.siwe?.address) return null
  return session
}

interface CreateReferralRequest {
  code: string
}

export async function POST(request: Request) {
  try {
    const ses = await getSession()

    if (!ses?.siwe?.address)
      return jsonResponse(false, { message: 'Unauthorized' }, 401)

    const body = (await request
      .json()
      .catch(() => ({}))) as CreateReferralRequest

    let requestedCode = body.code ? body.code.toUpperCase().trim() : null

    if (requestedCode) {
      // Validate code format
      if (!/^[A-Z0-9]{6}$/.test(requestedCode)) {
        return jsonResponse(
          false,
          {
            message:
              'Invalid format. Code must be exactly 6 alphanumeric characters.',
          },
          400,
        )
      }

      // Check if code is exist
      const { data: existingCode } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('ref_code', requestedCode)
        .single()

      if (!existingCode) {
        return jsonResponse(
          false,
          { message: 'Referral code does not exist' },
          409,
        )
      }
    }

    const { data, error } = await supabaseAdmin
      .from('referral')
      .upsert(
        {
          address: ses.siwe.address,
          code: requestedCode,
          skip: true,
        },
        { onConflict: 'address' },
      )
      .select()
      .single()

    if (error) {
      throw error
    }

    ses.hasReferral = true
    await ses.save()
    return jsonResponse(true, { message: 'Referral code applied' }, 201)
  } catch (error) {
    console.error('Create Referral Error:', error)
    return jsonResponse(
      false,
      { message: 'Failed to apply referral code' },
      500,
    )
  }
}
