'use server'

import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/admin-permissions'

const CONFIRM_WORD = 'RESET'

export interface ResetOptions {
  deleteOffers?: boolean
  deleteCollectionAccounts?: boolean
  deleteCorridors?: boolean
  deleteSellerProfiles?: boolean
  deleteUserAccounts?: boolean
  resetSettings?: boolean
}

export async function performPlatformReset(
  password: string,
  confirmWord: string,
  options: ResetOptions = {},
): Promise<{ success?: boolean; error?: string }> {
  // 1. Server-side confirm word check — never trust client alone
  if (confirmWord !== CONFIRM_WORD) {
    return { error: 'Confirmation word incorrect. Reset cancelled.' }
  }

  // 2. Verify caller is admin with reset permission
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }
  if (!user.email) return { error: 'Cannot verify identity — no email on account' }

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role, admin_permissions')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const permissions = (profile?.admin_permissions as string[]) ?? []
  if (!hasPermission(permissions, 'reset')) return { error: 'You do not have permission to perform a platform reset.' }

  // 3. Re-authenticate with a fresh anon client (not the cached SSR client)
  const verifyClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error: authErr } = await verifyClient.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authErr) {
    console.error('[performPlatformReset] password verification failed:', authErr.message)
    return { error: 'Incorrect password. Reset cancelled.' }
  }

  // 4. Execute reset
  console.log(`[PLATFORM RESET] started by ${user.email} at ${new Date().toISOString()}`)
  console.log(`[PLATFORM RESET] options:`, options)
  const errors: string[] = []

  const del = async (table: string, label?: string) => {
    const { error } = await service
      .from(table as any)
      .delete()
      .gte('created_at', '1970-01-01T00:00:00Z')
    if (error) {
      console.error(`[PLATFORM RESET] failed to clear ${label ?? table}:`, error.message)
      errors.push(label ?? table)
    } else {
      console.log(`[PLATFORM RESET] cleared ${label ?? table}`)
    }
  }

  // ── Core reset (always runs) ──────────────────────────────────────────────

  await del('ratings')
  await del('transactions')
  await del('notifications')
  await del('buyer_seller_watches')

  // Reset seller stats
  const { error: sellerStatsErr } = await service
    .from('sellers')
    .update({ total_transactions: 0, completion_rate: 0, avg_response_seconds: null })
    .gte('created_at', '1970-01-01T00:00:00Z')
  if (sellerStatsErr) {
    console.error('[PLATFORM RESET] failed to reset seller stats:', sellerStatsErr.message)
    errors.push('sellers (stats)')
  }

  // Reset buyer fraud flags
  const { error: profileFlagsErr } = await service
    .from('profiles')
    .update({ unconfirmed_claim_count: 0, fraud_flag: false })
    .gte('created_at', '1970-01-01T00:00:00Z')
  if (profileFlagsErr) {
    console.error('[PLATFORM RESET] failed to reset profile flags:', profileFlagsErr.message)
    errors.push('profiles (flags)')
  }

  // ── Extended reset options (order matters for FK constraints) ─────────────

  // Offers depend on sellers, so delete before sellers
  if (options.deleteOffers || options.deleteSellerProfiles) {
    await del('offers')
  }

  // Seller profiles
  if (options.deleteSellerProfiles) {
    await del('sellers')
  }

  // Corridors reference hoxa_collection_accounts — clear the FK first
  if (options.deleteCorridors) {
    // Null out the FK reference so we can delete collection accounts independently
    const { error: fkErr } = await service
      .from('corridors')
      .update({ collection_account_id: null })
      .gte('created_at', '1970-01-01T00:00:00Z')
    if (fkErr) {
      console.error('[PLATFORM RESET] failed to clear corridor FK:', fkErr.message)
    }
    await del('corridors')
  }

  if (options.deleteCollectionAccounts) {
    await del('hoxa_collection_accounts', 'collection accounts')
  }

  // User accounts — delete all non-admin profiles, then their auth records
  // Current admin (user.id) is always excluded to avoid self-deletion
  if (options.deleteUserAccounts) {
    const { data: nonAdmins, error: fetchErr } = await service
      .from('profiles')
      .select('id')
      .neq('role', 'admin')

    if (fetchErr) {
      console.error('[PLATFORM RESET] failed to fetch non-admin users:', fetchErr.message)
      errors.push('user accounts (fetch)')
    } else if (nonAdmins && nonAdmins.length > 0) {
      // Delete profiles first (removes FK references)
      const ids = nonAdmins.map(p => p.id)
      const { error: profileDelErr } = await service
        .from('profiles')
        .delete()
        .in('id', ids)
      if (profileDelErr) {
        console.error('[PLATFORM RESET] failed to delete non-admin profiles:', profileDelErr.message)
        errors.push('profiles (delete)')
      }

      // Delete auth users one by one (admin API)
      let authDelErrors = 0
      for (const { id } of nonAdmins) {
        const { error: authDelErr } = await service.auth.admin.deleteUser(id)
        if (authDelErr) {
          console.error(`[PLATFORM RESET] failed to delete auth user ${id}:`, authDelErr.message)
          authDelErrors++
        }
      }
      if (authDelErrors > 0) {
        errors.push(`user auth records (${authDelErrors} failed)`)
      } else {
        console.log(`[PLATFORM RESET] deleted ${nonAdmins.length} user accounts`)
      }
    }
  }

  // Reset settings to defaults
  if (options.resetSettings) {
    const defaults: { key: string; value: any }[] = [
      { key: 'seller_response_timeout_seconds',      value: 120 },
      { key: 'platform_fee_percent',                value: 1.5 },
      { key: 'marketplace_active',                  value: true },
      { key: 'platform_status',                     value: 'open' },
      { key: 'queue_mode_enabled',                  value: false },
      { key: 'platform_open_hour',                  value: 8 },
      { key: 'platform_close_hour',                 value: 20 },
      { key: 'session_timeout_minutes',             value: 15 },
      { key: 'payment_window_duration_seconds',     value: 1200 },
      { key: 'rate_lock_duration_seconds',          value: 600 },
      { key: 'minimum_tap_time_seconds',            value: 30 },
      { key: 'receipt_auto_confirm_seconds',        value: 10800 },
      { key: 'auto_confirm_enabled',               value: true },
      { key: 'hoxa_buyer_fee_percent',              value: 1 },
    ]

    for (const { key, value } of defaults) {
      const { error: settingsErr } = await service
        .from('settings')
        .upsert({ key, value, updated_by: user.id, updated_at: new Date().toISOString() })
      if (settingsErr) {
        console.error(`[PLATFORM RESET] failed to reset setting ${key}:`, settingsErr.message)
        errors.push(`setting:${key}`)
      }
    }
    console.log('[PLATFORM RESET] settings reset to defaults')
  }

  // ── Audit log ────────────────────────────────────────────────────────────
  try {
    await service.from('admin_audit_log').insert({
      admin_id: user.id,
      action: 'PLATFORM_RESET',
      entity_type: 'platform',
      entity_id: null,
      metadata: {
        reset_at: new Date().toISOString(),
        reset_by_email: user.email,
        options,
        failed_tables: errors,
      },
    })
  } catch (e) {
    console.error('[PLATFORM RESET] audit log failed:', e)
  }

  if (errors.length > 0) {
    return { error: `Reset partially completed. Failed: ${errors.join(', ')}. Check server logs.` }
  }

  console.log(`[PLATFORM RESET] complete by ${user.email} at ${new Date().toISOString()}`)
  revalidatePath('/admin', 'layout')
  return { success: true }
}
