import AdminTopbar from '@/components/admin/AdminTopbar'
import { createServiceClient } from '@/lib/supabase/server'
import { requireAdminPermission } from '@/lib/admin-guard'
import AlertsClient from './AlertsClient'

export default async function AlertsPage() {
  await requireAdminPermission('alerts')
  const supabase = createServiceClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, read, created_at, profiles!user_id(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(100)

  const unreadCount = (notifications ?? []).filter((n: any) => !n.read).length

  return (
    <>
      <AdminTopbar title="Alerts & Notifications" notifCount={unreadCount} />
      <AlertsClient notifications={(notifications ?? []) as any} />
    </>
  )
}
