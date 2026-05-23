import { getAuthUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BuyerNotificationsClient from '@/components/buyer/BuyerNotificationsClient'

export default async function BuyerNotificationsPage() {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl">
      <BuyerNotificationsClient notifications={notifications ?? []} />
    </div>
  )
}
