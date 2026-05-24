import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getSettings } from '@/actions/settings'
import CheckoutClient from './CheckoutClient'

interface Props {
  searchParams: Promise<{ offer?: string; corridor?: string; amount?: string; country?: string; sendPhone?: string; receivePhone?: string }>
}

export default async function CheckoutPage({ searchParams }: Props) {
  const params = await searchParams
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  const offerId = params.offer
  const sendPhone = params.sendPhone ?? ''
  const receivePhone = params.receivePhone ?? ''
  if (!offerId) redirect('/dashboard/marketplace')

  const [profile, settings, offerResult, corridorResult] = await Promise.all([
    getProfile(),
    getSettings(),
    supabase
      .from('offers')
      .select(`
        id, rate, min_amount, max_amount, from_currency, to_currency,
        sellers (
          id, user_id, completion_rate, total_transactions,
          profiles ( full_name, country )
        )
      `)
      .eq('id', offerId)
      .single(),
    params.corridor
      ? supabase.from('corridors').select('*').eq('id', params.corridor).single()
      : Promise.resolve({ data: null }),
  ])

  const offer = offerResult.data
  if (!offer || !params.amount || Number(params.amount) <= 0) redirect('/dashboard/marketplace')

  const feePercent = Number(settings.hoxa_buyer_fee_percent ?? settings.platform_fee_percent ?? 1)
  const rateLockSeconds = Number(settings.rate_lock_duration_seconds ?? 600)

  return (
    <CheckoutClient
      offer={offer}
      corridor={corridorResult.data}
      amount={params.amount ?? ''}
      destinationCountry={params.country ?? ''}
      feePercent={feePercent}
      rateLockSeconds={rateLockSeconds}
      sendPhone={sendPhone}
      receivePhone={receivePhone}
      userProfile={{
        sendAccount: profile?.registered_send_account ?? '',
        receiveAccount: '',
        country: profile?.country ?? '',
      }}
    />
  )
}
