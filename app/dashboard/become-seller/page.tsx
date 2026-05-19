import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSettings } from '@/actions/settings'
import BecomeSellerClient from './BecomeSellerClient'

export default async function BecomeSellerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, country').eq('id', user.id).single()
  if (!profile) redirect('/login')

  // Check if already a seller
  const { data: seller } = await supabase.from('sellers').select('id, status').eq('user_id', user.id).single()
  if (seller?.status === 'approved') redirect('/seller/dashboard')

  const settings = await getSettings()
  const momoNetworks: Record<string, string[]> = (settings['momo_networks'] && typeof settings['momo_networks'] === 'object')
    ? settings['momo_networks']
    : {}
  const currencyPairs: string[] = Array.isArray(settings['currency_pairs'])
    ? settings['currency_pairs']
    : []

  // Get MoMo networks for the buyer's country
  const countryNetworks = momoNetworks[profile.country] ?? []

  return (
    <BecomeSellerClient
      fullName={profile.full_name ?? ''}
      country={profile.country ?? ''}
      momoNetworks={countryNetworks}
      currencyPairs={currencyPairs}
      existingStatus={seller?.status ?? null}
    />
  )
}
