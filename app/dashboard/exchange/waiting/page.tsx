import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WaitingClient from './WaitingClient'

interface Props {
  searchParams: Promise<{ tx?: string }>
}

export default async function WaitingPage({ searchParams }: Props) {
  const params = await searchParams
  const txId = params.tx
  if (!txId) redirect('/dashboard')

  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: txn } = await supabase
    .from('transactions')
    .select('*, accepted_at, payment_confirmed_at, fulfillment_started_at, sellers(avg_response_seconds, profiles(full_name))')
    .eq('id', txId)
    .eq('buyer_id', user.id)
    .single()

  if (!txn) redirect('/dashboard')

  // Redirect based on status
  const status = txn.status
  const TERMINAL = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']
  if (status === 'awaiting_payment') redirect(`/dashboard/exchange/pay?tx=${txId}`)
  if (status === 'fully_completed' || status === 'completed') redirect(`/dashboard/transactions/${txId}`)
  if (status === 'pending_receipt_confirmation') redirect(`/dashboard/transactions/${txId}`)
  if (TERMINAL.includes(status)) redirect(`/dashboard/transactions/${txId}`)

  return <WaitingClient transaction={txn} />
}
