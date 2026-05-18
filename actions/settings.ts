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
  for (const row of data ?? []) map[row.key] = row.value
  return map
}

export async function updateSetting(key: string, value: any) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()
  const { error } = await service.from('settings').update({
    value: JSON.stringify(value),
    updated_by: admin.id,
    updated_at: new Date().toISOString(),
  }).eq('key', key)

  if (error) return { error: error.message }

  revalidatePath('/admin/settings')
  return { success: true }
}
