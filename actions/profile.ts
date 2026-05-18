'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { cookies } from 'next/headers'
import type { Lang } from '@/lib/i18n'

export async function setLanguageAction(lang: Lang) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('profiles').update({ language: lang }).eq('id', user.id)

  const cookieStore = await cookies()
  cookieStore.set('hoxa_lang', lang, { path: '/', maxAge: 60 * 60 * 24 * 365 })

  revalidatePath('/', 'layout')
}

export async function updateProfile(data: {
  full_name?: string
  phone?: string
  country?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('profiles').update(data).eq('id', user.id)
  if (error) return { error: 'Failed to update profile' }

  revalidatePath('/dashboard/profile')
  revalidatePath('/seller/profile')
  return { success: true }
}

export async function applyAsSeller(data: {
  payment_methods: string[]
  currencies: string[]
  daily_limit: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Check if already applied
  const { data: existing } = await supabase.from('sellers').select('id, status').eq('user_id', user.id).single()
  if (existing) {
    if (existing.status === 'pending') return { error: 'Your application is already under review.' }
    if (existing.status === 'approved') return { error: 'You are already an approved seller.' }
  }

  const { error } = await supabase.from('sellers').insert({
    user_id: user.id,
    ...data,
    status: 'pending',
  })

  if (error) return { error: error.message }

  // Notify admins
  const service = createServiceClient()
  const { data: admins } = await service.from('profiles').select('id').eq('role', 'admin')
  for (const admin of admins ?? []) {
    await createNotification(admin.id, 'New Seller Application', `A buyer has applied to become a seller. Review in the admin panel.`, 'info')
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function getSellerApplicationStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('sellers').select('status').eq('user_id', user.id).single()
  return data?.status ?? null
}

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

// Admin actions
export async function approveSellerApplication(sellerId: string, userId: string) {
  if (!await requireAdmin()) return { error: 'Admin access required' }

  const service = createServiceClient()

  await service.from('sellers').update({ status: 'approved' }).eq('id', sellerId)
  await service.from('profiles').update({ role: 'seller' }).eq('id', userId)

  await createNotification(userId, 'Application Approved', 'Congratulations! Your seller application has been approved. You can now create listings.', 'success')

  revalidatePath('/admin/sellers')
  return { success: true }
}

export async function rejectSellerApplication(sellerId: string, userId: string) {
  if (!await requireAdmin()) return { error: 'Admin access required' }

  const service = createServiceClient()

  await service.from('sellers').update({ status: 'rejected' }).eq('id', sellerId)
  await createNotification(userId, 'Application Rejected', 'Your seller application was not approved at this time. Contact support for more information.', 'error')

  revalidatePath('/admin/sellers')
  return { success: true }
}
