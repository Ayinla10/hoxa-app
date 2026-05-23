import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import CorridorsClient from './CorridorsClient'
import { ArrowLeftRight } from 'lucide-react'

export default async function CorridorsPage() {
  const service = createServiceClient()
  const { data: corridors } = await service
    .from('corridors')
    .select('*')
    .order('is_active', { ascending: false })
    .order('send_currency', { ascending: true })

  return (
    <>
      <AdminTopbar title="Corridors" />
      <div className="px-4 lg:px-8 py-5 space-y-5 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Exchange Corridors</h1>
            <p className="text-gray-400 text-sm mt-0.5">Manage which currency pairs are available in the marketplace</p>
          </div>
        </div>
        <CorridorsClient corridors={corridors ?? []} />
      </div>
    </>
  )
}
