'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const { user, supabase } = await getAuthUser()
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

  // Admin accounts cannot be deleted through the users panel
  const { data: targetProfile } = await service.from('profiles').select('role, admin_permissions').eq('id', userId).single()
  if (targetProfile?.role === 'admin') {
    return { error: 'Admin accounts cannot be deleted from the Users panel. Admin accounts are managed separately.' }
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

  // Admin accounts are completely separate from user accounts.
  // Cannot promote users to admin or demote admins to users.
  if (role === 'admin' || role === 'revoke_admin') {
    return { error: 'Admin accounts are separate. Use "Create Admin" to add admins.' }
  }

  // Only allow buyer/seller role changes
  if (role !== 'buyer' && role !== 'seller') {
    return { error: 'Invalid role' }
  }

  const service = createServiceClient()

  // Verify the target user is NOT an admin — admins cannot be modified
  const { data: target } = await service.from('profiles').select('role').eq('id', userId).single()
  if (target?.role === 'admin') {
    return { error: 'Admin accounts cannot be modified. They are separate from user accounts.' }
  }

  await service.from('profiles').update({ role }).eq('id', userId)

  revalidatePath('/admin/users')
  return { success: true }
}
