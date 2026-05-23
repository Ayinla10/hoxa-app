import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProvidersForCountry } from '@/actions/payment-providers'
import PaymentMethodClient from './PaymentMethodClient'

interface Props {
  searchParams: Promise<{ tx?: string }>
}

export default async function PaymentMethodPage({ searchParams }: Props) {
  const params = await searchParams
  const txId = params.tx
  if (!txId) redirect('/dashboard')

  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  // Fetch transaction and profile in parallel
  const [txResult, profile] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, sellers(profiles(full_name))')
      .eq('id', txId)
      .eq('buyer_id', user.id)
      .single(),
    getProfile(),
  ])

  const txn = txResult.data
  if (!txn) redirect('/dashboard')
  if (txn.status !== 'awaiting_payment' && txn.status !== 'pending_acceptance') {
    redirect(`/dashboard/transactions/${txId}`)
  }

  // Get payment providers for the buyer's send country
  const sendCountry = profile?.country?.slice(0, 2).toUpperCase() ?? 'GH'
  const sendCurrency = txn.send_currency ?? txn.from_currency

  const providers = await getProvidersForCountry(sendCountry, sendCurrency)

  return (
    <PaymentMethodClient
      transaction={txn}
      providers={providers}
      preferredMethodId={profile?.preferred_payment_method ?? null}
      sendCountry={sendCountry}
    />
  )
}
