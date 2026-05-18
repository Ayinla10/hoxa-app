import { getSellerOffers, getSellerRecord } from '@/actions/listings'
import SellerTopbar from '@/components/seller/SellerTopbar'
import SellerListingsClient from './client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { FileText } from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('full_name, language').eq('id', user.id).single()
  const cookieStore = await cookies()
  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang
  const seller = await getSellerRecord()
  const offers = await getSellerOffers()

  if (!seller || seller.status !== 'approved') {
    return (
      <>
        <SellerTopbar title={t(lang, 'nav_listings')} sellerName={profile?.full_name ?? ''} />
        <div className="px-6 py-10 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {!seller ? t(lang, 'no_seller_record') : t(lang, 'pending_approval_msg')}
          </p>
          <p className="text-gray-400 text-sm mt-1">{t(lang, 'listings_unavailable')}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <SellerTopbar title={t(lang, 'nav_listings')} sellerName={profile?.full_name ?? ''} />
      <SellerListingsClient offers={offers} />
    </>
  )
}
