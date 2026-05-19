import { redirect } from 'next/navigation'
import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import SellerTopbar from '@/components/seller/SellerTopbar'
import SellerProfileClient from './SellerProfileClient'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerProfilePage() {
  const [{ user, supabase }, profile, cookieStore] = await Promise.all([getAuthUser(), getProfile(), cookies()])
  if (!user) redirect('/login')

  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  const { data: seller } = await supabase.from('sellers').select('completion_rate, timeout_count, rejection_count').eq('user_id', user.id).single()
  const score = seller
    ? Math.min(100, Math.round((seller.completion_rate * 0.6) + (Math.max(0, 100 - (seller.timeout_count * 5)) * 0.2) + (Math.max(0, 100 - (seller.rejection_count * 3)) * 0.2)))
    : 0

  return (
    <>
      <SellerTopbar title={t(lang, 'nav_profile')} sellerName={profile?.full_name ?? ''} />
      <SellerProfileClient
        email={user.email ?? ''}
        fullName={profile?.full_name ?? ''}
        phone={profile?.phone ?? ''}
        country={profile?.country ?? ''}
        score={score}
      />
    </>
  )
}
