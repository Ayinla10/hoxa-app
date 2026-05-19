'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('settings').select('*')
  const map: Record<string, any> = {}
  for (const row of data ?? []) {
    let v = row.value
    // Fix double-encoded JSON strings (from previous bug)
    if (typeof v === 'string') {
      try { v = JSON.parse(v) } catch {}
    }
    map[row.key] = v
  }
  return map
}

export async function updateSetting(key: string, value: any) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()

  // Upsert: update if exists, insert if not
  const { data: existing } = await service.from('settings').select('key').eq('key', key).single()

  // Supabase handles jsonb serialization — pass the value directly, not JSON.stringify'd
  if (existing) {
    const { error } = await service.from('settings').update({
      value,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    }).eq('key', key)
    if (error) return { error: error.message }
  } else {
    const { error } = await service.from('settings').insert({
      key,
      value,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}
