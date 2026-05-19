import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthUser, getProfile, createServiceClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'
import SessionGuard from '@/components/SessionGuard'
import { getSettings } from '@/actions/settings'

export const metadata: Metadata = {
  title: 'HOXA Admin',
  manifest: '/admin-manifest.json',
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/admin')

  // Fetch profile, pending escrow count, and settings in parallel
  const [profile, pendingResult, settings] = await Promise.all([
    getProfile(),
    createServiceClient()
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'payment_submitted'),
    getSettings(),
  ])

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/admin')
  }
  if (profile.role !== 'admin') redirect('/dashboard')

  const sessionTimeout = Number(settings['session_timeout_minutes']) || 15

  return (
    <div className="min-h-screen bg-[#F7F9F8]">
      <AdminSidebar adminName={profile?.full_name ?? 'Admin'} pendingEscrow={pendingResult.count ?? 0} />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </div>
      <AdminBottomNav />
      <SessionGuard timeoutMinutes={sessionTimeout} logoutPath="/admin" />
    </div>
  )
}
