import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminBottomNav from '@/components/admin/AdminBottomNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }
  if (profile.role !== 'admin') redirect('/dashboard')

  const service = createServiceClient()
  const { count: pendingEscrow } = await service
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'payment_submitted')

  return (
    <div className="min-h-screen bg-[#F7F9F8]">
      <AdminSidebar adminName={profile?.full_name ?? 'Admin'} pendingEscrow={pendingEscrow ?? 0} />
      <div className="lg:pl-64 pb-20 lg:pb-0">
        {children}
      </div>
      <AdminBottomNav />
    </div>
  )
}
