import { getAuthUser, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminTopbar from '@/components/admin/AdminTopbar'
import ResetClient from './ResetClient'

export default async function ResetPage() {
  const { user } = await getAuthUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only super_admin can access this page
  if (profile?.role !== 'super_admin') redirect('/admin/dashboard')

  return (
    <>
      <AdminTopbar title="Platform Reset" />
      <div className="px-4 lg:px-8 py-5 space-y-5">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Platform Reset</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Clear all operational data and return the platform to a fresh state.
            This page is only accessible to super admins.
          </p>
        </div>
        <ResetClient adminEmail={user.email ?? ''} />
      </div>
    </>
  )
}
