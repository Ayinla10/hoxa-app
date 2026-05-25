import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import CorridorsClient from './CorridorsClient'
import { requireAdminPermission } from '@/lib/admin-guard'

export default async function CorridorsPage() {
  await requireAdminPermission('corridors')
  const service = createServiceClient()

  const [{ data: corridors }, { data: accounts }] = await Promise.all([
    service
      .from('corridors')
      .select('*, hoxa_collection_accounts(id, currency, provider, account_number, account_name, is_active)')
      .order('is_active', { ascending: false })
      .order('send_currency', { ascending: true }),
    service
      .from('hoxa_collection_accounts')
      .select('*')
      .order('currency', { ascending: true })
      .order('created_at', { ascending: true }),
  ])

  return (
    <>
      <AdminTopbar title="Corridors" />
      <div className="px-4 lg:px-8 py-5 space-y-5 max-w-4xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Corridors & Collection Accounts</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage exchange routes and the accounts buyers pay into</p>
        </div>
        <CorridorsClient corridors={corridors ?? []} collectionAccounts={accounts ?? []} />
      </div>
    </>
  )
}
