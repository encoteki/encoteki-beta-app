'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { getAuthSession } from './auth'

export async function submitReferralCode(code: string) {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error }
  }

  if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return {
      success: false,
      error: 'Kode tidak valid. Harus 6 karakter alphanumeric kapital.',
    }
  }

  try {
    const { data: existingCode } = await supabaseAdmin
      .from('users')
      .select('ref_code')
      .eq('ref_code', code)
      .single()

    if (existingCode) {
      return {
        success: false,
        error: 'Code exists, try other',
      }
    }

    const { error: insertError } = await supabaseAdmin.from('users').upsert(
      [
        {
          address: auth.address,
          ref_code: code,
        },
      ],
      { onConflict: 'address' },
    )

    if (insertError) {
      return { success: false, error: 'Failed to create referral code' }
    }

    return { success: true, message: 'Successfully claim referral code' }
  } catch (error) {
    return { success: false, error: 'Internal Server Error' }
  }
}

export async function getUserReferralCode() {
  const auth = await getAuthSession()
  if (!auth.success || !auth.address) {
    return { success: false, error: auth.error }
  }

  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('ref_code')
      .eq('address', auth.address)
      .single()

    if (error && error.code !== 'PGRST116') {
      return { success: false, error: 'Failed to fetch referral code' }
    }

    return { success: true, data: user?.ref_code || null }
  } catch (error) {
    return { success: false, error: 'Internal Server Error' }
  }
}
