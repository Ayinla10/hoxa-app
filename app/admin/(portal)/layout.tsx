import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser, getProfile, createServiceClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'
import SessionGuard from '@/components/SessionGuard'
import RealtimeNotificationProvider from '@/components/RealtimeNotificationProvider'
import PushNotificationSetup from '@/components/PushNotificationSetup'
import { getSettings } from '@/actions/settings'
import { isSuperAdmin } from '@/lib/admin-permissions'

export const metadata: Metadata = {
  title: 'HOXA Admin',
  manifest: '/admin-manifest.json',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/admin')

  // Fetch profile, pending counts, and settings in parallel
  const service = createServiceClient()
  const [profile, pendingResult, pendingSettlementResult, settings] = await Promise.all([
    getProfile(),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending_ops_confirmation'),
    service.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'pending_settlement'),
    getSettings(),
  ])

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/admin')
  }
  if (profile.role !== 'admin') redirect('/dashboard')

  const sessionTimeout = Number(settings['session_timeout_minutes']) || 15
  const permissions: string[] = (profile.admin_permissions as string[]) ?? []
  const superAdmin = isSuperAdmin(permissions)

  return (
    <div className="min-h-screen bg-[#F7F9F8]">
      <AdminSidebar
        adminName={profile?.full_name ?? 'Admin'}
        pendingEscrow={pendingResult.count ?? 0}
        pendingSettlement={pendingSettlementResult.count ?? 0}
        permissions={permissions}
        isSuperAdmin={superAdmin}
      />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </div>
      <AdminBottomNav permissions={permissions} />
      <SessionGuard timeoutMinutes={sessionTimeout} logoutPath="/admin" />
      <RealtimeNotificationProvider userId={user.id} />
      <PushNotificationSetup userId={user.id} />
    </div>
  )
}
