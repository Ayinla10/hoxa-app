'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

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

  // Upsert — handles both: profile already created by trigger, or not yet
  const { error: profileError } = await service.from('profiles').upsert({
    id: created.user.id,
    full_name,
    role: 'admin',
    admin_permissions: data.permissions,
  }, { onConflict: 'id' })

  if (profileError) return { error: 'Admin created but failed to set permissions: ' + profileError.message }

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

  // Delete related data in dependency order
  // 1. Get the seller record id first (needed to delete offers)
  const { data: sellerToDelete } = await service.from('sellers').select('id').eq('user_id', userId).single()
  if (sellerToDelete?.id) {
    await service.from('offers').delete().eq('seller_id', sellerToDelete.id)
  }
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

export async function banUser(userId: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }
  if (userId === admin.id) return { error: 'Cannot ban yourself' }

  const service = createServiceClient()

  const { data: target } = await service.from('profiles').select('role').eq('id', userId).single()
  if (target?.role === 'admin') return { error: 'Admin accounts cannot be banned' }

  // Supabase auth-level ban — prevents login entirely
  const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
  if (error) return { error: error.message }

  // Also flag in profile so UI can reflect it without an auth lookup
  await service.from('profiles').update({ is_banned: true }).eq('id', userId)

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function unbanUser(userId: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()
  const { error } = await service.auth.admin.updateUserById(userId, { ban_duration: 'none' })
  if (error) return { error: error.message }

  await service.from('profiles').update({ is_banned: false }).eq('id', userId)

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function markRefundSent(transactionId: string, notes: string) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()

  const { data: tx } = await service
    .from('transactions')
    .select('id, status, buyer_id, hoxa_transaction_id, send_amount, send_currency')
    .eq('id', transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }
  if (tx.status !== 'cancelled') return { error: 'Only cancelled (favour-buyer) transactions can be marked as refunded' }

  const { error } = await service.from('transactions').update({
    manual_refund_sent_at: new Date().toISOString(),
    manual_refund_notes: notes || null,
    manual_refund_by: admin.id,
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to record refund' }

  // Notify buyer
  await createNotification(
    tx.buyer_id,
    'Refund Sent',
    `Your refund of ${tx.send_amount} ${tx.send_currency ?? ''} for transaction ${tx.hoxa_transaction_id} has been sent. Please check your account.`,
    'success'
  )

  revalidatePath(`/admin/transactions/${transactionId}`)
  revalidatePath('/admin/transactions')
  return { success: true }
}

/**
 * Admin override: force a seller available or offline regardless of their own toggle or schedule.
 * Pass null to clear the override (restore seller control).
 */
export async function setSellerAvailabilityOverride(
  sellerId: string,
  override: 'available' | 'offline' | null
) {
  const admin = await requireAdmin()
  if (!admin) return { error: 'Admin access required' }

  const service = createServiceClient()

  const { error } = await service
    .from('sellers')
    .update({ admin_availability_override: override })
    .eq('id', sellerId)

  if (error) return { error: error.message }

  revalidatePath('/admin/sellers')
  return { success: true }
}

/**
 * Get all transactions for admin reporting
 */
export async function getAdminTransactionStats() {
  const admin = await requireAdmin()
  if (!admin) return null

  const service = createServiceClient()

  const [
    { count: total },
    { count: completed },
    { count: active },
    { count: disputed },
    { count: needsReview },
    { count: pendingSettlement },
  ] = await Promise.all([
    service.from('transactions').select('*', { count: 'exact', head: true }),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'fully_completed'),
    service.from('transactions').select('*', { count: 'exact', head: true })
      .in('status', ['pending_acceptance', 'awaiting_payment', 'pending_ops_confirmation', 'fulfillment_in_progress', 'pending_receipt_confirmation', 'pending_settlement']),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending_ops_confirmation'),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending_settlement'),
  ])

  return { total, completed, active, disputed, needsReview, pendingSettlement }
}
