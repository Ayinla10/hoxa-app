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

  // Fetch transaction, payment provider, and collection account in parallel
  const [txResult, providerResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, sellers(profiles(full_name))')
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
  const sendCountry = txn.send_currency === 'GHS' ? 'GH' : txn.send_currency === 'XOF' ? 'CI' : 'GH'
  const sendCurrency = txn.send_currency ?? txn.from_currency

  // Get HOXA collection account for this currency
  const collectionAccount = await getCollectionAccount(sendCountry, sendCurrency)

  return (
    <PaymentInstructionClient
      transaction={txn}
      provider={provider}
      collectionAccount={collectionAccount}
    />
  )
}
