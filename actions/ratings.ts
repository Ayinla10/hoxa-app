'use server'

import { getAuthUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitRating(input: {
  transactionId: string
  role: 'buyer' | 'seller'  // role of the RATER (not the ratee)
  score: number
  comment?: string
}) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  if (input.score < 1 || input.score > 5) return { error: 'Invalid score' }

  const service = createServiceClient()

  // Fetch the transaction and derive rateeId server-side — never trust client input
  const { data: tx } = await service
    .from('transactions')
    .select('id, buyer_id, seller_id, status, sellers(user_id)')
    .eq('id', input.transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  const isCompleted = ['fully_completed', 'completed', 'pending_settlement', 'receipt_confirmed'].includes(tx.status)
  if (!isCompleted) return { error: 'Transaction must be completed before rating' }

  const sellerUserId = (tx.sellers as any)?.user_id

  // Verify rater is a participant and derive the correct ratee
  let rateeId: string
  if (input.role === 'buyer') {
    if (tx.buyer_id !== user.id) return { error: 'Unauthorized' }
    if (!sellerUserId) return { error: 'Seller account not found' }
    rateeId = sellerUserId
  } else {
    if (sellerUserId !== user.id) return { error: 'Unauthorized' }
    rateeId = tx.buyer_id
  }

  const { error } = await service.from('ratings').insert({
    transaction_id: input.transactionId,
    rater_id: user.id,
    ratee_id: rateeId,
    role: input.role,
    score: input.score,
    comment: input.comment?.trim().slice(0, 500) || null,
  })

  if (error) {
    if (error.code === '23505') return { error: 'You have already rated this transaction' }
    console.error('[submitRating] error:', error.message)
    return { error: 'Something went wrong. Please try again.' }
  }

  revalidatePath(`/dashboard/transactions/${input.transactionId}`)
  revalidatePath(`/seller/transactions/${input.transactionId}`)
  return { success: true }
}

export async function getMyRatingForTransaction(transactionId: string): Promise<number | null> {
  const { user } = await getAuthUser()
  if (!user) return null

  const service = createServiceClient()
  const { data } = await service
    .from('ratings')
    .select('score')
    .eq('transaction_id', transactionId)
    .eq('rater_id', user.id)
    .maybeSingle()

  return data?.score ?? null
}
