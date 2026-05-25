import { getSettings } from '@/actions/settings'
import AdminTopbar from '@/components/admin/AdminTopbar'
import AdminSettingsClient from './AdminSettingsClient'
import { requireAdminPermission } from '@/lib/admin-guard'

export default async function AdminSettingsPage() {
  await requireAdminPermission('settings')
  const settings = await getSettings()

  return (
    <>
      <AdminTopbar title="Platform Settings" />
      <div className="px-4 lg:px-8 py-5 max-w-2xl space-y-6">
        <AdminSettingsClient settings={settings} />
      </div>
    </>
  )
}
