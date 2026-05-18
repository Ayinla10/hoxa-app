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

export async function createAdminUser(data: {
  first_name: string
  last_name: string
  email: string
  password: string
  permissions: string[]
}) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()
  const full_name = `${data.first_name.trim()} ${data.last_name.trim()}`

  const { data: created, error } = await service.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { full_name },
  })

  if (error) return { error: error.message }

  await service.from('profiles').update({
    full_name,
    role: 'admin',
    admin_permissions: data.permissions,
  }).eq('id', created.user.id)

  revalidatePath('/admin/users')
  return { success: true }
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  // Cannot delete yourself
  if (userId === admin.id) return { error: 'Cannot delete your own account' }

  const service = createServiceClient()

  // Check if target is a super_admin — cannot delete them
  const { data: targetProfile } = await service.from('profiles').select('role, admin_permissions').eq('id', userId).single()
  if (targetProfile?.role === 'admin' && (targetProfile?.admin_permissions as string[] ?? []).includes('super_admin')) {
    return { error: 'Cannot delete a Super Admin' }
  }

  // Delete related data first (sellers, notifications, transactions references are handled by DB cascade/RLS)
  await service.from('sellers').delete().eq('user_id', userId)
  await service.from('notifications').delete().eq('user_id', userId)
  await service.from('profiles').delete().eq('id', userId)

  // Delete the auth user last
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/users')
  return { success: true }
}

export async function setUserRole(userId: string, role: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  // Prevent privilege escalation to admin via this action
  const actualRole = role === 'revoke_admin' ? 'buyer' : role
  if (actualRole === 'admin') return { error: 'Cannot assign admin role via this action' }

  const service = createServiceClient()
  await service.from('profiles').update({ role: actualRole }).eq('id', userId)

  revalidatePath('/admin/users')
  return { success: true }
}
