import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsClient from '@/app/seller/notifications/NotificationsClient'

export default async function BuyerNotificationsPage() {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-2xl">
      <NotificationsClient notifications={notifications ?? []} />
    </div>
  )
}
