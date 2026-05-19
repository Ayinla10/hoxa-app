import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SellerTopbar from '@/components/seller/SellerTopbar'
import NotificationsClient from './NotificationsClient'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerNotificationsPage() {
  const [{ user, supabase }, profile] = await Promise.all([getAuthUser(), getProfile()])
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const unread = (notifications ?? []).filter((n: any) => !n.read).length

  const cookieStore = await cookies()
  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  return (
    <>
      <SellerTopbar
        title={t(lang, 'nav_notifications')}
        sellerName={profile?.full_name ?? 'Seller'}
        notifCount={unread}
      />
      <main className="px-4 lg:px-8 py-5 w-full max-w-2xl">
        <NotificationsClient notifications={notifications ?? []} />
      </main>
    </>
  )
}
