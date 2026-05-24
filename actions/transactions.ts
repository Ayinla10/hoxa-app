'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function initiateTransaction(offerId: string, fromAmount: number) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .select('*, sellers(id, user_id)')
    .eq('id', offerId)
    .eq('is_available', true)
    .single()

  if (offerErr || !offer) return { error: 'Offer not found or unavailable' }
  if (fromAmount < offer.min_amount) return { error: `Minimum amount is ${offer.min_amount} ${offer.from_currency}` }
  if (fromAmount > offer.max_amount) return { error: `Maximum amount is ${offer.max_amount} ${offer.from_currency}` }

  const { data: timeoutSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'seller_response_timeout_seconds')
    .single()
  const timeoutSeconds = Number(timeoutSetting?.value ?? 120)

  const toAmount = fromAmount * offer.rate
  const deadline = new Date(Date.now() + timeoutSeconds * 1000).toISOString()

  // Atomically reserve liquidity — prevents race condition
  const { data: reserved, error: reserveErr } = await supabase
    .rpc('reserve_offer_liquidity', { p_offer_id: offerId, p_amount: fromAmount })

  if (reserveErr) return { error: 'Failed to reserve liquidity' }
  if (!reserved) return { error: 'Seller does not have enough liquidity for this amount' }

  const { data: txn, error: txnErr } = await supabase.from('transactions').insert({
    buyer_id: user.id,
    seller_id: offer.seller_id,
    offer_id: offerId,
    from_currency: offer.from_currency,
    to_currency: offer.to_currency,
    from_amount: fromAmount,
    to_amount: toAmount,
    rate: offer.rate,
    status: 'pending_seller',
    seller_response_deadline: deadline,
  }).select().single()

  if (txnErr) {
    await supabase.rpc('restore_offer_liquidity', { p_offer_id: offerId, p_amount: fromAmount })
    return { error: 'Failed to create transaction' }
  }

  // Notify seller of the new request (INSERT trigger handles all other notifications)
  await createNotification(
    offer.sellers.user_id,
    'New Exchange Request',
    `Buyer wants to exchange ${fromAmount} ${offer.from_currency} → ${toAmount.toFixed(2)} ${offer.to_currency}. You have ${timeoutSeconds}s to respond.`,
    'info'
  )

  revalidatePath('/dashboard/transactions')
  return { success: true, transactionId: txn.id }
}

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
  if (txn.status !== 'pending_seller') return { error: 'Transaction is no longer pending' }

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

export async function submitPaymentProof(
  transactionId: string,
  proofUrl: string,
  reference: string,
  notes: string
) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'seller_accepted') return { error: 'Cannot upload proof at this stage' }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'payment_submitted',
      payment_proof_url: proofUrl,
      payment_reference: reference,
      payment_notes: notes,
    })
    .eq('id', transactionId)

  if (error) return { error: 'Failed to submit payment proof' }

  revalidatePath(`/dashboard/transactions/${transactionId}`)
  return { success: true }
}

export async function verifyPayment(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (callerProfile?.role !== 'admin') return { error: 'Admin access required' }

  const service = createServiceClient()
  const { data: txn } = await service
    .from('transactions')
    .select('id, status')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'payment_submitted') return { error: 'Transaction is not awaiting verification' }

  const { error } = await service.from('transactions').update({
    status: 'payment_verified',
    verified_by: user.id,
    verified_at: new Date().toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to verify payment' }

  revalidatePath('/admin/transactions')
  return { success: true }
}

export async function markFulfilled(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('*, sellers(user_id)')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.sellers.user_id !== user.id) return { error: 'Unauthorized' }
  if (txn.status !== 'payment_verified') return { error: 'Payment not yet verified' }

  const { error } = await supabase.from('transactions').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to mark transaction as fulfilled' }

  // Update seller stats atomically via service client
  const service = createServiceClient()
  const { data: seller } = await service
    .from('sellers')
    .select('total_transactions, completion_rate')
    .eq('id', txn.seller_id)
    .single()

  if (seller) {
    const total = seller.total_transactions + 1
    const rate = ((seller.completion_rate * seller.total_transactions) + 100) / total
    await service.from('sellers').update({
      total_transactions: total,
      completion_rate: Math.round(rate),
    }).eq('id', txn.seller_id)
  }

  // Buyer completion notification handled atomically by DB trigger
  revalidatePath('/seller/transactions')
  revalidatePath(`/dashboard/transactions/${transactionId}`)
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
