import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { I18nProvider } from '@/lib/i18n-context'
import { type Lang } from '@/lib/i18n'
import { SidebarProvider } from '@/lib/sidebar-context'
import SellerSidebar from '@/components/seller/SellerSidebar'
import SellerShell from '@/components/seller/SellerShell'
import BottomNav from '@/components/seller/BottomNav'
import RealtimeSubscriber from '@/components/seller/RealtimeSubscriber'

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }
  if (profile.role !== 'seller' && profile.role !== 'admin') redirect('/dashboard')

  const { data: seller } = await supabase.from('sellers').select('id, status, availability, completion_rate, timeout_count, rejection_count').eq('user_id', user.id).single()
  if (!seller || seller.status !== 'approved') redirect('/dashboard')

  const score = Math.min(100, Math.round((seller.completion_rate * 0.6) + (Math.max(0, 100 - (seller.timeout_count * 5)) * 0.2) + (Math.max(0, 100 - (seller.rejection_count * 3)) * 0.2)))

  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('hoxa_lang')?.value
  const lang = (profile?.language ?? cookieLang ?? 'en') as Lang

  return (
    <I18nProvider lang={lang}>
      <SidebarProvider>
        <div className="min-h-screen bg-[#F7F9F8]">
          <SellerSidebar
            sellerName={profile?.full_name ?? 'Seller'}
            score={score}
            online={seller.availability !== 'offline'}
          />
          <RealtimeSubscriber table="transactions" filter={`seller_id=eq.${seller.id}`} />
          <RealtimeSubscriber table="notifications" filter={`user_id=eq.${user.id}`} />
          <SellerShell>
            {children}
          </SellerShell>
          <BottomNav />
        </div>
      </SidebarProvider>
    </I18nProvider>
  )
}
