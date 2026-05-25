import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCollectionAccount } from '@/actions/payment-providers'
import PaymentInstructionClient from './PaymentInstructionClient'

interface Props {
  searchParams: Promise<{ tx?: string; method?: string }>
}

export default async function PaymentPage({ searchParams }: Props) {
  const params = await searchParams
  const txId = params.tx
  const methodId = params.method
  if (!txId) redirect('/dashboard')

  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  // Fetch transaction + corridor's collection account + optional payment provider in parallel
  const [txResult, providerResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, sellers(profiles(full_name)), corridors(hoxa_collection_accounts(*))')
      .eq('id', txId)
      .eq('buyer_id', user.id)
      .single(),
    methodId
      ? supabase.from('payment_providers').select('*').eq('id', methodId).single()
      : Promise.resolve({ data: null }),
  ])

  const txn = txResult.data
  if (!txn) redirect('/dashboard')

  // Only allow access if in awaiting_payment status
  if (txn.status !== 'awaiting_payment') {
    redirect(`/dashboard/transactions/${txId}`)
  }

  const provider = providerResult.data
  const sendCurrency = txn.send_currency ?? txn.from_currency

  // Prefer collection account linked to the corridor; fall back to currency/country lookup
  const corridorAccount = (txn as any).corridors?.hoxa_collection_accounts ?? null
  const collectionAccount = corridorAccount ?? await getCollectionAccount('', sendCurrency)

  return (
    <PaymentInstructionClient
      transaction={txn}
      provider={provider}
      collectionAccount={collectionAccount}
    />
  )
}
