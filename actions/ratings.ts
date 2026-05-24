'use server'

import { getAuthUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitRating(input: {
  transactionId: string
  rateeId: string
  role: 'buyer' | 'seller'
  score: number
  comment?: string
}) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  if (input.score < 1 || input.score > 5) return { error: 'Invalid score' }

  const service = createServiceClient()

  // Verify transaction exists and involves this user
  const { data: tx } = await service
    .from('transactions')
    .select('id, buyer_id, seller_id, status, sellers(user_id)')
    .eq('id', input.transactionId)
    .single()

  if (!tx) return { error: 'Transaction not found' }

  const isCompleted = ['fully_completed', 'completed', 'pending_settlement', 'receipt_confirmed'].includes(tx.status)
  if (!isCompleted) return { error: 'Transaction must be completed before rating' }

  const sellerUserId = (tx.sellers as any)?.user_id

  // Ensure rater is involved in the transaction
  const isBuyer = tx.buyer_id === user.id
  const isSeller = sellerUserId === user.id
  if (!isBuyer && !isSeller) return { error: 'Unauthorized' }

  const { error } = await service.from('ratings').insert({
    transaction_id: input.transactionId,
    rater_id: user.id,
    ratee_id: input.rateeId,
    role: input.role,
    score: input.score,
    comment: input.comment?.trim() || null,
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
    .single()

  return data?.score ?? null
}
