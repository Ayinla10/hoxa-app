'use server'

import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function verifySuperAdmin(): Promise<{ ok: boolean; email?: string }> {
  const { user } = await getAuthUser()
  if (!user) return { ok: false }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return { ok: false }
  return { ok: true, email: user.email }
}

export async function performPlatformReset(password: string): Promise<{ success?: boolean; error?: string }> {
  // 1. Verify caller is super_admin
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return { error: 'Super admin access required' }

  // 2. Re-authenticate with password — confirms identity before destructive action
  if (!user.email) return { error: 'Cannot verify identity — no email on account' }

  const authClient = await createClient()
  const { error: authErr } = await authClient.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authErr) {
    console.error('[performPlatformReset] password verification failed:', authErr.message)
    return { error: 'Incorrect password. Reset cancelled.' }
  }

  // 3. Execute reset — delete all operational data, preserve config and user accounts
  try {
    // Ratings (no FK dependents)
    await service.from('ratings').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Transactions (cascade deletes anything referencing them)
    await service.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Notifications
    await service.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Buyer-seller watches
    await service.from('buyer_seller_watches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Reset seller stats (keep sellers and their offers, just zero the stats)
    await service.from('sellers').update({
      total_transactions: 0,
      completion_rate: 0,
      avg_response_seconds: null,
    }).neq('id', '00000000-0000-0000-0000-000000000000')

    // Reset buyer fraud flags and claim counts
    await service.from('profiles').update({
      unconfirmed_claim_count: 0,
      fraud_flag: false,
    }).neq('id', '00000000-0000-0000-0000-000000000000')

    // Log the reset action in admin_audit_log if it exists
    try {
      await service.from('admin_audit_log').insert({
        admin_id: user.id,
        action: 'PLATFORM_RESET',
        entity_type: 'platform',
        entity_id: null,
        metadata: {
          reset_at: new Date().toISOString(),
          reset_by_email: user.email,
        },
      })
    } catch { /* table may not exist */ }

    console.log(`[PLATFORM RESET] executed by ${user.email} at ${new Date().toISOString()}`)
    return { success: true }
  } catch (err: any) {
    console.error('[performPlatformReset] error during reset:', err?.message ?? err)
    return { error: 'Reset failed partway through. Check server logs immediately.' }
  }
}
