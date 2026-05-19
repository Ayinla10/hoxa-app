import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SellerTopbar from '@/components/seller/SellerTopbar'
import SellerSettingsClient from './SellerSettingsClient'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerSettingsPage() {
  const [{ user, supabase }, profile, cookieStore] = await Promise.all([
    getAuthUser(),
    getProfile(),
    cookies(),
  ])
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications').select('id').eq('user_id', user.id).eq('read', false)

  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  return (
    <>
      <SellerTopbar
        title={t(lang, 'nav_settings')}
        sellerName={profile?.full_name ?? 'Seller'}
        notifCount={notifications?.length ?? 0}
      />
      <main className="px-4 lg:px-8 py-5 w-full">
        <SellerSettingsClient />
      </main>
    </>
  )
}
