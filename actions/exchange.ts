'use server'

import { createClient, createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'
import { getSettings } from './settings'

// ══════════════════════════════════════════════
// V5.1 Exchange Flow Actions
// ══════════════════════════════════════════════

/**
 * Step 4.3: Buyer taps "Exchange Now" on a seller
 * - Lock rate for 10 minutes
 * - Create transaction in PENDING_ACCEPTANCE
 * - Trigger auto-accept engine
 */
export async function initiateExchange(input: {
  offer_id: string
  corridor_id: string
  send_amount: number        // subtotal the buyer wants to send (before fee)
  buyer_send_account: string
  buyer_send_provider: string
  buyer_receive_account: string
  buyer_receive_provider: string
  buyer_destination_country: string
}) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  // ── Fetch offer from DB — NEVER trust client-computed financials ──
  const service = createServiceClient()
  const { data: offer } = await service
    .from('offers')
    .select('id, seller_id, from_currency, to_currency, rate, min_amount, max_amount, is_available, sellers(id, status)')
    .eq('id', input.offer_id)
    .single()

  if (!offer || !offer.is_available) return { error: 'Offer not found or no longer available' }
  if ((offer.sellers as any)?.status !== 'approved') return { error: 'Seller is not active' }

  // Validate amount against offer limits
  const sendSubtotal = input.send_amount
  if (sendSubtotal <= 0) return { error: 'Invalid amount' }
  if (sendSubtotal < offer.min_amount) return { error: `Minimum amount is ${offer.min_amount} ${offer.from_currency}` }
  if (sendSubtotal > offer.max_amount) return { error: `Maximum amount is ${offer.max_amount} ${offer.from_currency}` }

  // ── Recompute all financial values server-side ──
  const settings = await getSettings()
  const feePercent = Number(settings.hoxa_buyer_fee_percent ?? settings.platform_fee_percent ?? 1)
  const rateLockSeconds = Number(settings.rate_lock_duration_seconds ?? 600)
  const acceptTimeoutSeconds = Number(settings.seller_response_timeout_seconds ?? 120)

  const feeAmount = Math.round(sendSubtotal * (feePercent / 100) * 100) / 100
  const totalPay = sendSubtotal + feeAmount
  const receiveAmount = Math.round(sendSubtotal * offer.rate * 100) / 100
  const sellerSettlementAmount = Math.round(sendSubtotal * 100) / 100 // seller gets the subtotal (fee kept by Hoxa)

  const now = new Date()
  const rateExpiresAt = new Date(now.getTime() + rateLockSeconds * 1000)

  const { data: txn, error: txnErr } = await service.from('transactions').insert({
    buyer_id: user.id,
    seller_id: offer.seller_id,
    offer_id: input.offer_id,
    // V5.1 fields — all computed server-side
    send_amount: totalPay,
    send_currency: offer.from_currency,
    receive_amount: receiveAmount,
    receive_currency: offer.to_currency,
    exchange_rate: offer.rate,
    hoxa_fee_amount: feeAmount,
    seller_settlement_amount: sellerSettlementAmount,
    buyer_send_account: input.buyer_send_account,
    buyer_send_provider: input.buyer_send_provider,
    buyer_receive_account: input.buyer_receive_account,
    buyer_receive_provider: input.buyer_receive_provider,
    buyer_destination_country: input.buyer_destination_country,
    rate_locked_at: now.toISOString(),
    rate_expires_at: rateExpiresAt.toISOString(),
    seller_response_deadline: new Date(now.getTime() + acceptTimeoutSeconds * 1000).toISOString(),
    status: 'pending_acceptance',
    // Legacy fields for backward compat
    from_currency: offer.from_currency,
    to_currency: offer.to_currency,
    from_amount: totalPay,
    to_amount: receiveAmount,
    rate: offer.rate,
  }).select().single()

  if (txnErr) {
    console.error('[initiateExchange] DB error:', txnErr.message, txnErr.details)
    return { error: 'Something went wrong. Please try again or contact support.' }
  }

  // Prevent duplicate pending transactions: if the buyer already has a pending tx
  // on this offer, cancel the old one before creating a new one
  await service
    .from('transactions')
    .update({ status: 'cancelled' })
    .eq('buyer_id', user.id)
    .eq('offer_id', input.offer_id)
    .in('status', ['pending_acceptance', 'awaiting_payment'])
    .neq('id', txn.id)

  // Auto-accept engine: check seller's rules
  const { data: seller } = await supabase
    .from('sellers')
    .select('auto_accept_enabled, auto_accept_rules, user_id')
    .eq('id', offer.seller_id)
    .single()

  if (seller?.auto_accept_enabled) {
    const rules = seller.auto_accept_rules as Record<string, unknown> | null
    let shouldAccept = true

    if (rules?.max_amount && sellerSettlementAmount > Number(rules.max_amount)) {
      shouldAccept = false
    }

    if (shouldAccept) {
      // Auto-accept: move directly to AWAITING_PAYMENT
      await supabase
        .from('transactions')
        .update({ status: 'awaiting_payment' })
        .eq('id', txn.id)

      return { success: true, transactionId: txn.id, autoAccepted: true }
    }
  }

  // Manual accept: notify seller
  if (seller?.user_id) {
    await createNotification(
      seller.user_id,
      'New Exchange Request',
      `New exchange: ${totalPay} ${offer.from_currency} → ${receiveAmount} ${offer.to_currency}. Accept within 15 seconds.`,
      'info'
    )
  }

  return { success: true, transactionId: txn.id, autoAccepted: false }
}

/**
 * Step 4.5: Buyer confirms exchange on checkout summary
 * Moves from AWAITING_PAYMENT → stays AWAITING_PAYMENT but marks commitment
 */
export async function confirmExchange(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'awaiting_payment' && txn.status !== 'pending_acceptance') {
    return { error: 'Transaction is not in the correct state' }
  }

  // Already in awaiting_payment — commitment point logged
  return { success: true }
}

/**
 * Step 4.6: Buyer selects payment method
 */
export async function selectPaymentMethod(transactionId: string, providerId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'awaiting_payment') return { error: 'Cannot select payment method now' }

  const { error } = await supabase
    .from('transactions')
    .update({
      buyer_selected_payment_method: providerId,
      payment_screen_loaded_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { error: 'Failed to update payment method' }

  // Save as preferred method on buyer profile
  await supabase
    .from('profiles')
    .update({ preferred_payment_method: providerId })
    .eq('id', user.id)

  return { success: true }
}

/**
 * Step 4.7: Buyer taps "I've Paid"
 * - Record timestamp
 * - Open 20-minute payment window
 * - Move to PENDING_OPS_CONFIRMATION
 * - Alert ops
 */
export async function markIvePaid(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id, payment_screen_loaded_at, hoxa_transaction_id, send_amount, send_currency, buyer_send_account, rate_expires_at')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'awaiting_payment') return { error: 'Cannot mark as paid at this stage' }

  // Reject if the rate lock has expired
  if (txn.rate_expires_at && new Date(txn.rate_expires_at) < new Date()) {
    await supabase.from('transactions').update({ status: 'payment_expired' }).eq('id', transactionId)
    return { error: 'Your rate has expired. Please start a new exchange.' }
  }

  const settings = await getSettings()
  const windowDuration = Number(settings.payment_window_duration_seconds ?? 1200)
  const minTapTime = Number(settings.minimum_tap_time_seconds ?? 30)

  const now = new Date()
  const windowExpires = new Date(now.getTime() + windowDuration * 1000)

  // Check for suspicious tap speed (fraud detection)
  let fraudFlag = false
  if (txn.payment_screen_loaded_at) {
    const loadedAt = new Date(txn.payment_screen_loaded_at).getTime()
    const tapTime = (now.getTime() - loadedAt) / 1000
    if (tapTime < minTapTime) {
      fraudFlag = true
    }
  }

  const { error } = await supabase
    .from('transactions')
    .update({
      status: 'pending_ops_confirmation',
      ive_paid_tapped_at: now.toISOString(),
      payment_window_expires_at: windowExpires.toISOString(),
    })
    .eq('id', transactionId)

  if (error) return { error: 'Failed to update transaction' }

  // Notify all admins (ops) — high priority
  const service = createServiceClient()
  const { data: admins } = await service
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  for (const admin of admins ?? []) {
    await createNotification(
      admin.id,
      `Payment Claim — ${txn.hoxa_transaction_id}`,
      `${txn.send_amount} ${txn.send_currency} from ${txn.buyer_send_account}. Window closes in ${windowDuration / 60} min.${fraudFlag ? ' ⚠️ FAST TAP FLAG' : ''}`,
      fraudFlag ? 'warning' : 'info'
    )
  }

  revalidatePath(`/dashboard/transactions/${transactionId}`)
  revalidatePath('/admin/transactions')
  return { success: true }
}

/**
 * Step 4.9: Ops confirms payment (admin action)
 */
export async function opsConfirmPayment(transactionId: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { data: txn } = await service
    .from('transactions')
    .select('id, status, seller_id, receive_amount, receive_currency, buyer_receive_account, buyer_receive_provider, hoxa_transaction_id')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_ops_confirmation') return { error: 'Not awaiting confirmation' }

  // Check window hasn't expired
  // (In production, a cron job would auto-expire these)

  const now = new Date()
  const { error } = await service.from('transactions').update({
    status: 'fulfillment_in_progress',
    payment_confirmed_at: now.toISOString(),
    fulfillment_notified_at: now.toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to confirm payment' }

  // Notify seller to fulfill
  const { data: seller } = await service
    .from('sellers')
    .select('user_id')
    .eq('id', txn.seller_id)
    .single()

  if (seller?.user_id) {
    await createNotification(
      seller.user_id,
      `Fulfill Exchange — ${txn.hoxa_transaction_id}`,
      `Send ${txn.receive_amount} ${txn.receive_currency} to ${txn.buyer_receive_provider}: ${txn.buyer_receive_account}`,
      'info'
    )
  }

  revalidatePath('/admin/transactions')
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  return { success: true }
}

/**
 * Step 4.9: Ops rejects payment (admin action)
 */
export async function opsRejectPayment(transactionId: string, reason: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { data: txn } = await service
    .from('transactions')
    .select('id, status, buyer_id, hoxa_transaction_id')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_ops_confirmation') return { error: 'Not awaiting confirmation' }

  const { error } = await service.from('transactions').update({
    status: 'awaiting_payment',
    ops_reject_reason: reason,
    ive_paid_tapped_at: null,
    payment_window_expires_at: null,
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to reject payment' }

  // Increment unconfirmed claim count if reason is fraud
  if (reason === 'fraud_suspected') {
    await service.rpc('increment_claim_count', { p_user_id: txn.buyer_id })
  }

  // Notify buyer
  const reasonMessages: Record<string, string> = {
    amount_wrong: 'The amount received does not match. Please retry with the exact amount.',
    not_received: 'We did not receive your payment. Please try again.',
    reference_missing: 'The payment reference was missing. Please include the reference and retry.',
    sender_mismatch: 'The payment came from a different account. Please send from your registered account.',
    fraud_suspected: 'Your payment could not be verified. Please contact support.',
  }

  await createNotification(
    txn.buyer_id,
    `Payment Issue — ${txn.hoxa_transaction_id}`,
    reasonMessages[reason] ?? 'Payment issue. Please retry.',
    'warning'
  )

  revalidatePath('/admin/transactions')
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  return { success: true }
}

/**
 * Seller marks fulfillment: "I've Sent the XOF"
 */
export async function sellerMarkFulfilled(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('*, sellers(user_id)')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.sellers?.user_id !== user.id) return { error: 'Unauthorized' }
  if (txn.status !== 'fulfillment_in_progress') return { error: 'Not in fulfillment stage' }

  const settings = await getSettings()
  const autoConfirmSeconds = Number(settings.receipt_auto_confirm_seconds ?? 10800) // 3 hours

  const now = new Date()
  const autoConfirmDue = new Date(now.getTime() + autoConfirmSeconds * 1000)

  const { error } = await supabase.from('transactions').update({
    status: 'pending_receipt_confirmation',
    fulfillment_confirmed_at: now.toISOString(),
    auto_confirm_due_at: autoConfirmDue.toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to mark as fulfilled' }

  // Notify buyer to confirm receipt
  await createNotification(
    txn.buyer_id,
    `Did you receive your ${txn.receive_currency}?`,
    `${txn.receive_amount} ${txn.receive_currency} has been sent to your account. Please confirm receipt.`,
    'info'
  )

  revalidatePath('/seller/transactions')
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  return { success: true }
}

/**
 * Step 4.8: Buyer confirms receipt
 */
export async function buyerConfirmReceipt(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id, hoxa_transaction_id, seller_settlement_amount, send_currency, seller_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_receipt_confirmation') return { error: 'Not awaiting receipt confirmation' }

  const now = new Date()
  const { error } = await supabase.from('transactions').update({
    status: 'pending_settlement',
    receipt_confirmed_at: now.toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to confirm receipt' }

  // Notify ops: ready for settlement
  const service = createServiceClient()
  const { data: admins } = await service.from('profiles').select('id').eq('role', 'admin')

  for (const admin of admins ?? []) {
    await createNotification(
      admin.id,
      `Settlement Ready — ${txn.hoxa_transaction_id}`,
      `Release ${txn.seller_settlement_amount} ${txn.send_currency} to seller. Buyer confirmed receipt.`,
      'success'
    )
  }

  revalidatePath(`/dashboard/transactions/${transactionId}`)
  revalidatePath('/admin/transactions')
  return { success: true }
}

/**
 * Buyer disputes: "No, I didn't receive it"
 */
export async function buyerDisputeReceipt(transactionId: string, reason: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id, hoxa_transaction_id, send_amount, send_currency')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_receipt_confirmation') return { error: 'Not awaiting receipt confirmation' }

  const { error } = await supabase.from('transactions').update({
    status: 'disputed',
    dispute_reason: reason,
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to open dispute' }

  // Notify ops immediately (high priority)
  const service = createServiceClient()
  const { data: admins } = await service.from('profiles').select('id').eq('role', 'admin')

  for (const admin of admins ?? []) {
    await createNotification(
      admin.id,
      `⚠️ Dispute — ${txn.hoxa_transaction_id}`,
      `Buyer disputes receipt: ${reason}. Settlement frozen. ${txn.send_amount} ${txn.send_currency} protected.`,
      'error'
    )
  }

  revalidatePath(`/dashboard/transactions/${transactionId}`)
  revalidatePath('/admin/transactions')
  return { success: true }
}

/**
 * Support page: buyer opens a dispute on any active transaction
 * (not limited to pending_receipt_confirmation)
 */
export async function submitSupportDispute(input: {
  transactionId: string
  issueType: string
  description: string
}) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id, hoxa_transaction_id, send_amount, send_currency, seller_id')
    .eq('id', input.transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }

  const terminalStatuses = ['cancelled', 'seller_rejected', 'seller_timeout', 'fully_completed', 'disputed']
  if (terminalStatuses.includes(txn.status)) {
    return { error: 'Cannot open a dispute on this transaction' }
  }

  const reason = `[${input.issueType}] ${input.description}`

  const { error } = await supabase.from('transactions').update({
    status: 'disputed',
    dispute_reason: reason,
  }).eq('id', input.transactionId)

  if (error) return { error: 'Failed to open dispute' }

  // Notify ops
  const service = createServiceClient()
  const { data: admins } = await service.from('profiles').select('id').eq('role', 'admin')

  for (const admin of admins ?? []) {
    await createNotification(
      admin.id,
      `⚠️ Dispute — ${txn.hoxa_transaction_id}`,
      `Support dispute raised: ${reason}. Tx frozen. ${txn.send_amount} ${txn.send_currency}.`,
      'error',
      `/admin/transactions/${txn.id}`
    )
  }

  // Notify seller — must use the seller's user_id (profile id), not the sellers record id
  if (txn.seller_id) {
    const { data: sellerRecord } = await service
      .from('sellers')
      .select('user_id')
      .eq('id', txn.seller_id)
      .single()
    if (sellerRecord?.user_id) {
      await createNotification(
        sellerRecord.user_id,
        'Transaction Disputed',
        `A buyer has raised a dispute on transaction ${txn.hoxa_transaction_id}. Ops is reviewing.`,
        'warning',
        `/seller/transactions/${txn.id}`
      )
    }
  }

  revalidatePath('/dashboard/support')
  revalidatePath(`/dashboard/transactions/${input.transactionId}`)
  revalidatePath('/admin/disputes')

  return { success: true }
}

/**
 * Step 4.10: Ops releases settlement to seller
 */
export async function opsReleaseSettlement(transactionId: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { data: txn } = await service
    .from('transactions')
    .select('id, status, seller_id, seller_settlement_amount, send_currency, hoxa_transaction_id')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_settlement') return { error: 'Not awaiting settlement' }

  const now = new Date()
  const { error } = await service.from('transactions').update({
    status: 'fully_completed',
    settlement_released_at: now.toISOString(),
    completed_at: now.toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to release settlement' }

  // Notify seller
  const { data: seller } = await service
    .from('sellers')
    .select('user_id')
    .eq('id', txn.seller_id)
    .single()

  if (seller?.user_id) {
    await createNotification(
      seller.user_id,
      `Settlement Sent — ${txn.hoxa_transaction_id}`,
      `${txn.seller_settlement_amount} ${txn.send_currency} has been sent to your account.`,
      'success'
    )
  }

  // Update seller stats
  const { data: sellerRecord } = await service
    .from('sellers')
    .select('total_transactions, completion_rate')
    .eq('id', txn.seller_id)
    .single()

  if (sellerRecord) {
    const total = sellerRecord.total_transactions + 1
    const rate = ((sellerRecord.completion_rate * sellerRecord.total_transactions) + 100) / total
    await service.from('sellers').update({
      total_transactions: total,
      completion_rate: Math.round(rate),
    }).eq('id', txn.seller_id)
  }

  revalidatePath('/admin/transactions')
  return { success: true }
}

/**
 * Ops resolves dispute in BUYER's favour.
 * - Cancels the transaction
 * - Penalises the seller (drops completion rate)
 * - Notifies both parties
 * - Ops manually refunds the buyer outside the system
 */
export async function opsFavourBuyer(transactionId: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { data: txn } = await service
    .from('transactions')
    .select('id, status, buyer_id, seller_id, send_amount, send_currency, from_amount, from_currency, hoxa_transaction_id, dispute_reason')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'disputed') return { error: 'Transaction is not in a disputed state' }

  const sendAmount = txn.send_amount ?? txn.from_amount
  const sendCurrency = txn.send_currency ?? txn.from_currency
  const ref = txn.hoxa_transaction_id ?? transactionId.slice(0, 8)

  // Cancel the transaction — buyer won
  const { error } = await service.from('transactions').update({
    status: 'cancelled',
    ops_reject_reason: `Dispute resolved in buyer's favour. Reason: ${txn.dispute_reason ?? 'not specified'}`,
    completed_at: new Date().toISOString(),
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to resolve dispute' }

  // Notify buyer — they won, manual refund coming
  await createNotification(
    txn.buyer_id,
    `Dispute Resolved — ${ref}`,
    `We've reviewed your dispute and ruled in your favour. Ops will manually refund ${sendAmount?.toLocaleString()} ${sendCurrency} to your account within 24 hours.`,
    'success'
  )

  // Penalise seller — counts as a failed transaction (completion rate drops)
  const { data: seller } = await service
    .from('sellers')
    .select('user_id, total_transactions, completion_rate')
    .eq('id', txn.seller_id)
    .single()

  if (seller) {
    // Add transaction as failed (contributes 0 to completion rate instead of 100)
    const total = (seller.total_transactions ?? 0) + 1
    const rate = ((seller.completion_rate ?? 0) * (seller.total_transactions ?? 0)) / total
    await service.from('sellers').update({
      total_transactions: total,
      completion_rate: Math.max(0, Math.round(rate)),
    }).eq('id', txn.seller_id)

    // Notify seller — they lost
    if (seller.user_id) {
      await createNotification(
        seller.user_id,
        `Dispute Resolved Against You — ${ref}`,
        `After review, the dispute for transaction ${ref} was resolved in the buyer's favour. This has affected your completion rate. Contact support if you have questions.`,
        'warning'
      )
    }
  }

  revalidatePath('/admin/disputes')
  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/transactions/${transactionId}`)
  return { success: true }
}

/**
 * Called by the buyer's waiting page when the seller response deadline has passed.
 * Reassigns the transaction to the admin fallback seller account.
 */
export async function handleSellerTimeout(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: txn } = await supabase
    .from('transactions')
    .select('id, status, buyer_id, seller_id, seller_response_deadline, send_amount, send_currency, receive_amount, receive_currency, hoxa_transaction_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'pending_acceptance') return { already_handled: true }

  // Only act if deadline has actually passed
  if (txn.seller_response_deadline && new Date(txn.seller_response_deadline) > new Date()) {
    return { not_yet: true }
  }

  const service = createServiceClient()

  // Mark original seller as timed out, then look for admin fallback seller
  const settings = await getSettings()
  const fallbackSellerId = settings.admin_fallback_seller_id as string | undefined

  if (!fallbackSellerId) {
    // No fallback configured — just mark as seller_timeout and cancel
    await service.from('transactions').update({ status: 'seller_timeout' }).eq('id', transactionId)
    await createNotification(
      txn.buyer_id,
      'Exchanger did not respond',
      'The exchanger did not accept your request in time. Please try a different exchanger.',
      'warning'
    )
    revalidatePath(`/dashboard/transactions/${transactionId}`)
    return { timedOut: true }
  }

  // Reassign to admin fallback seller and move to awaiting_payment
  const { data: fallbackSeller } = await service
    .from('sellers')
    .select('id, user_id')
    .eq('id', fallbackSellerId)
    .single()

  if (!fallbackSeller) {
    await service.from('transactions').update({ status: 'seller_timeout' }).eq('id', transactionId)
    revalidatePath(`/dashboard/transactions/${transactionId}`)
    return { timedOut: true }
  }

  await service.from('transactions').update({
    seller_id: fallbackSeller.id,
    status: 'awaiting_payment',
  }).eq('id', transactionId)

  const ref = txn.hoxa_transaction_id ?? transactionId.slice(0, 8)
  await createNotification(
    txn.buyer_id,
    'Exchange accepted — please pay now',
    `Your request (${ref}) has been picked up. Please proceed to payment.`,
    'success'
  )

  revalidatePath(`/dashboard/exchange/waiting`)
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  return { reassigned: true }
}

// ── Helpers ──

/**
 * Find the best replacement seller when a seller rejects or times out.
 * Matches same corridor + destination country + amount range.
 * Ranked by: completion_rate DESC, then rate ASC (best deal).
 */
export async function findReplacementSeller(transactionId: string) {
  const { user, supabase } = await getAuthUser()
  if (!user) return null

  const { data: tx } = await supabase
    .from('transactions')
    .select('id, send_amount, send_currency, receive_currency, buyer_destination_country, from_amount, from_currency, to_currency, seller_id')
    .eq('id', transactionId)
    .eq('buyer_id', user.id)
    .single()

  if (!tx) return null

  const sendCurrency = tx.send_currency ?? tx.from_currency
  const receiveCurrency = tx.receive_currency ?? tx.to_currency
  const sendAmount = tx.send_amount ?? tx.from_amount
  const destination = tx.buyer_destination_country

  const { data: offers } = await supabase
    .from('offers')
    .select(`
      id, rate, min_amount, max_amount,
      sellers (
        id, user_id, completion_rate, avg_response_seconds, total_transactions,
        status, manual_availability_status, admin_availability_override,
        weekly_hours, timezone, supported_receive_countries,
        profiles ( full_name, country )
      )
    `)
    .eq('from_currency', sendCurrency)
    .eq('to_currency', receiveCurrency)
    .eq('is_available', true)
    .neq('sellers.id', tx.seller_id) // exclude the seller who just rejected
    .order('rate', { ascending: true })

  if (!offers) return null

  const candidates = offers
    .filter(o => {
      const seller = o.sellers as any
      if (!seller || seller.status !== 'approved') return false

      // Check availability
      const avail = computeSellerStatus(seller)
      if (avail !== 'available') return false

      // Check destination country
      const countries = (seller.supported_receive_countries as string[]) ?? []
      if (countries.length > 0 && destination && !countries.includes(destination)) return false

      // Check amount range
      if (o.min_amount && sendAmount < o.min_amount) return false
      if (o.max_amount && sendAmount > o.max_amount) return false

      return true
    })
    .map(o => {
      const seller = o.sellers as any
      const profile = seller.profiles as any
      return {
        offer_id: o.id as string,
        seller_id: seller.id as string,
        seller_name: profile?.full_name ?? 'Exchanger',
        seller_country: profile?.country ?? '',
        rate: o.rate as number,
        completion_rate: (seller.completion_rate as number) ?? 0,
        total_transactions: (seller.total_transactions as number) ?? 0,
        send_currency: sendCurrency,
        receive_currency: receiveCurrency,
        send_amount: sendAmount,
      }
    })

  // Sort by completion_rate DESC, then rate ASC
  candidates.sort((a, b) =>
    b.completion_rate !== a.completion_rate
      ? b.completion_rate - a.completion_rate
      : a.rate - b.rate
  )

  return candidates[0] ?? null
}

/** Get marketplace sellers for a corridor + destination country */
export async function getMarketplaceSellers(
  sendCurrency: string,
  receiveCurrency: string,
  destinationCountry: string
) {
  const supabase = await createClient()

  const { data: offers } = await supabase
    .from('offers')
    .select(`
      id, rate, min_amount, max_amount, from_currency, to_currency,
      sellers (
        id, user_id, completion_rate, avg_response_seconds, total_transactions,
        status, manual_availability_status, admin_availability_override,
        weekly_hours, timezone, supported_receive_countries,
        profiles ( full_name, country )
      )
    `)
    .eq('from_currency', sendCurrency)
    .eq('to_currency', receiveCurrency)
    .eq('is_available', true)
    .eq('sellers.status', 'approved')
    .order('rate', { ascending: true })

  if (!offers) return []

  // Filter by approval status (belt-and-suspenders: PostgREST join filters can be unreliable)
  // and destination country support, then compute availability
  return offers
    .filter(o => {
      const seller = o.sellers as unknown as Record<string, unknown> | null
      if (!seller) return false
      if (seller.status !== 'approved') return false
      const countries = (seller.supported_receive_countries as string[]) ?? []
      // If seller hasn't set countries, show them (backward compat)
      return countries.length === 0 || countries.includes(destinationCountry)
    })
    .map(o => {
      const seller = o.sellers as unknown as Record<string, unknown>
      const profile = seller.profiles as Record<string, unknown>
      const status = computeSellerStatus(seller)
      return {
        offer_id: o.id,
        seller_id: seller.id as string,
        seller_name: (profile?.full_name as string) ?? 'Unknown',
        rate: o.rate,
        from_currency: o.from_currency,
        to_currency: o.to_currency,
        min_amount: o.min_amount,
        max_amount: o.max_amount,
        avg_speed_minutes: Math.round(((seller.avg_response_seconds as number) ?? 300) / 60),
        serves_countries: (seller.supported_receive_countries as string[]) ?? [],
        total_completed: (seller.total_transactions as number) ?? 0,
        completion_rate: (seller.completion_rate as number) ?? 0,
        status,
        next_available_at: status === 'offline' ? computeNextAvailable(seller) : null,
      }
    })
}

function computeSellerStatus(seller: Record<string, unknown>): 'available' | 'offline' {
  // Admin override takes precedence
  if (seller.admin_availability_override === 'available') return 'available'
  if (seller.admin_availability_override === 'offline') return 'offline'

  // Manual toggle
  if (seller.manual_availability_status === 'available') return 'available'
  if (seller.manual_availability_status === 'offline') return 'offline'

  // Weekly schedule
  const weeklyHours = seller.weekly_hours as Record<string, { open: string; close: string }> | null
  if (!weeklyHours || Object.keys(weeklyHours).length === 0) return 'available' // Default available if no schedule

  const tz = (seller.timezone as string) ?? 'Africa/Accra'
  const now = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    })
    const parts = formatter.formatToParts(now)
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? dayNames[now.getDay()]
    const hour = Number(parts.find(p => p.type === 'hour')?.value ?? now.getHours())
    const minute = Number(parts.find(p => p.type === 'minute')?.value ?? now.getMinutes())

    const schedule = weeklyHours[weekday]
    if (!schedule) return 'offline'

    const [openH, openM] = schedule.open.split(':').map(Number)
    const [closeH, closeM] = schedule.close.split(':').map(Number)
    const currentMinutes = hour * 60 + minute
    const openMinutes = openH * 60 + (openM ?? 0)
    const closeMinutes = closeH * 60 + (closeM ?? 0)

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes ? 'available' : 'offline'
  } catch {
    return 'available'
  }
}

function computeNextAvailable(seller: Record<string, unknown>): string | null {
  // Simplified: return null for now, can be computed from weekly_hours
  return null
}

// ── ADMIN AUDIT LOGGING ─────────────────────────────────────────────────────
async function logAdminAction(
  adminId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const service = createServiceClient()
    await service.from('audit_logs').insert({
      actor_id: adminId,
      actor_role: 'admin',
      action,
      entity,
      entity_id: entityId,
      metadata,
    })
  } catch {
    // Non-fatal — never block main action for logging failure
  }
}

// ── DISPUTE: Favour Seller (correctly handles 'disputed' status) ─────────────
export async function opsResolveDisputeSellerWins(transactionId: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { data: txn } = await service
    .from('transactions')
    .select('id, status, seller_id, buyer_id, seller_settlement_amount, send_amount, send_currency, from_amount, from_currency, hoxa_transaction_id, dispute_reason')
    .eq('id', transactionId)
    .single()

  if (!txn) return { error: 'Transaction not found' }
  if (txn.status !== 'disputed') return { error: 'Transaction is not in a disputed state' }

  const ref = txn.hoxa_transaction_id ?? transactionId.slice(0, 8)
  const now = new Date().toISOString()

  const { error } = await service.from('transactions').update({
    status: 'fully_completed',
    settlement_released_at: now,
    completed_at: now,
    ops_reject_reason: null,
  }).eq('id', transactionId)

  if (error) return { error: 'Failed to resolve dispute' }

  // Notify seller — they won
  const { data: seller } = await service.from('sellers').select('user_id, total_transactions, completion_rate').eq('id', txn.seller_id).single()
  if (seller?.user_id) {
    await createNotification(
      seller.user_id,
      `Dispute Resolved in Your Favour — ${ref}`,
      `We've reviewed the dispute and ruled in your favour. Your settlement for transaction ${ref} will be released to your account.`,
      'success'
    )
    // Update stats (counts as completed)
    const total = (seller.total_transactions ?? 0) + 1
    const rate = (((seller.completion_rate ?? 0) * (seller.total_transactions ?? 0)) + 100) / total
    await service.from('sellers').update({ total_transactions: total, completion_rate: Math.round(rate) }).eq('id', txn.seller_id)
  }

  // Notify buyer — they lost
  const sendAmount = txn.send_amount ?? txn.from_amount
  const sendCurrency = txn.send_currency ?? txn.from_currency
  await createNotification(
    txn.buyer_id,
    `Dispute Outcome — ${ref}`,
    `After reviewing your dispute for transaction ${ref}, we were unable to substantiate the claim. The funds (${sendAmount?.toLocaleString()} ${sendCurrency}) have been released to the exchanger.`,
    'info'
  )

  // Log admin action
  await logAdminAction(user.id, 'DISPUTE_RESOLVED_SELLER_WINS', 'transaction', transactionId, {
    ref,
    dispute_reason: txn.dispute_reason,
  })

  revalidatePath('/admin/disputes')
  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/transactions/${transactionId}`)
  return { success: true }
}

// ── DISPUTE: Save admin notes ─────────────────────────────────────────────────
export async function opsUpdateDisputeNotes(transactionId: string, notes: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Admin access required' }

  const { error } = await service
    .from('transactions')
    .update({ dispute_notes: notes })
    .eq('id', transactionId)

  if (error) {
    // Column may not exist yet — fail gracefully
    return { error: 'Failed to save notes (ensure dispute_notes column exists in transactions table)' }
  }

  await logAdminAction(user.id, 'DISPUTE_NOTES_UPDATED', 'transaction', transactionId, { notes })
  revalidatePath(`/admin/transactions/${transactionId}`)
  return { success: true }
}
