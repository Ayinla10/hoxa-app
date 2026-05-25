'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function acceptTransaction(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('*, sellers(user_id)')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.sellers.user_id !== user.id) return { error: 'Unauthorized' }
  if (!['pending_seller', 'pending_acceptance'].includes(txn.status)) return { error: 'Transaction is no longer pending' }

  // V5.1: acceptance moves transaction to awaiting_payment (buyer can now pay)
  const acceptedAt = new Date()
  const { error } = await supabase
    .from('transactions')
    .update({ status: 'awaiting_payment', accepted_at: acceptedAt.toISOString() })
    .eq('id', transactionId)

  if (error) return { error: 'Failed to accept transaction' }

  // Update seller's rolling average response time (last 20 accepted transactions)
  try {
    const service = createServiceClient()
    const createdAt = new Date(txn.created_at)
    const responseSeconds = Math.round((acceptedAt.getTime() - createdAt.getTime()) / 1000)

    const { data: recentTxns } = await service
      .from('transactions')
      .select('created_at, accepted_at')
      .eq('seller_id', txn.seller_id)
      .not('accepted_at', 'is', null)  // any transaction they accepted, regardless of current status
      .order('accepted_at', { ascending: false })
      .limit(19) // + current one = 20

    const samples: number[] = [responseSeconds]
    for (const t of recentTxns ?? []) {
      if (t.accepted_at && t.created_at) {
        samples.push(Math.round((new Date(t.accepted_at).getTime() - new Date(t.created_at).getTime()) / 1000))
      }
    }
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)

    await service
      .from('sellers')
      .update({ avg_response_seconds: avg })
      .eq('id', txn.seller_id)
  } catch { /* non-fatal — don't block acceptance */ }

  // Notify buyer that seller accepted and they can now pay
  await createNotification(
    txn.buyer_id,
    'Exchange Accepted — Pay Now',
    `Your exchange request has been accepted. Please complete your payment to proceed.`,
    'info'
  )

  revalidatePath('/seller/requests')
  revalidatePath('/seller/dashboard')
  return { success: true }
}

export async function rejectTransaction(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('*, sellers(user_id)')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.sellers.user_id !== user.id) return { error: 'Unauthorized' }
  if (!['pending_seller', 'pending_acceptance'].includes(txn.status)) return { error: 'Transaction is no longer pending' }

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'seller_rejected' })
    .eq('id', transactionId)

  if (error) return { error: 'Failed to reject transaction' }

  // Restore liquidity atomically
  await supabase.rpc('restore_offer_liquidity', {
    p_offer_id: txn.offer_id,
    p_amount: txn.from_amount,
  })

  await supabase.rpc('increment_seller_rejection', { p_seller_id: txn.seller_id })

  // Notification handled atomically by DB trigger
  revalidatePath('/seller/requests')
  revalidatePath('/seller/dashboard')
  return { success: true }
}


export async function getBuyerTransactions() {
  const { user, supabase } = await getAuthUser()
  if (!user) return []

  const { data } = await supabase
    .from('transactions')
    .select(`*, sellers(profiles(full_name)), corridors(send_country, receive_country)`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getTransactionById(id: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return null

  const { data } = await supabase
    .from('transactions')
    .select(`*, sellers(id, user_id, completion_rate, profiles(full_name, country))`)
    .eq('id', id)
    .single()

  if (!data) return null
  if (data.buyer_id !== user.id && data.sellers?.user_id !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return null
  }

  return data
}

export async function getSellerTransactions() {
  const { user, supabase } = await getAuthUser()
  if (!user) return []

  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!seller) return []

  const { data } = await supabase
    .from('transactions')
    .select(`*, profiles!buyer_id(full_name, country)`)
    .eq('seller_id', seller.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getSellerPendingRequests() {
  const { user, supabase } = await getAuthUser()
  if (!user) return []

  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!seller) return []

  const { data } = await supabase
    .from('transactions')
    .select(`*, profiles!buyer_id(full_name)`)
    .eq('seller_id', seller.id)
    .in('status', ['pending_acceptance', 'pending_seller'])
    .or('seller_response_deadline.is.null,seller_response_deadline.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })

  return data ?? []
}
