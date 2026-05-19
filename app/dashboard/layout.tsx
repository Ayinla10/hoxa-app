import { redirect } from 'next/navigation'
import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { I18nProvider } from '@/lib/i18n-context'
import { type Lang } from '@/lib/i18n'
import BuyerSidebar from '@/components/buyer/BuyerSidebar'
import BuyerTopbar from '@/components/buyer/BuyerTopbar'
import BuyerBottomNav from '@/components/buyer/BuyerBottomNav'
import SessionGuard from '@/components/SessionGuard'
import { getSettings } from '@/actions/settings'
import { cookies } from 'next/headers'

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  // Fetch profile, seller status, notifications, settings, and cookies in parallel
  const [profile, cookieStore, settings] = await Promise.all([
    getProfile(),
    cookies(),
    getSettings(),
  ])

  if (!profile) {
    await supabase.auth.signOut()
    redirect('/login')
  }
  if (profile.role === 'admin') redirect('/admin/dashboard')

  // These depend on profile being valid — run in parallel
  const [sellerResult, notifResult] = await Promise.all([
    supabase.from('sellers').select('id, status').eq('user_id', user.id).single(),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
  ])

  const isSeller = sellerResult.data?.status === 'approved'
  const notifCount = notifResult.count ?? 0

  // Language: profile preference > cookie > default 'en'
  const cookieLang = cookieStore.get('hoxa_lang')?.value
  const lang = (profile?.language ?? cookieLang ?? 'en') as Lang

  const fullName = profile?.full_name ?? ''
  const sessionTimeout = Number(settings['session_timeout_minutes']) || 15

  return (
    <I18nProvider lang={lang}>
      <div className="min-h-screen bg-[#F7F9F8]">
        <BuyerSidebar fullName={fullName} notifCount={notifCount} />
        <div className="lg:pl-64">
          <BuyerTopbar fullName={fullName} notifCount={notifCount} isSeller={isSeller} />
          <main className="px-4 lg:px-8 py-6 pb-28 lg:pb-10 max-w-[1400px] mx-auto space-y-6">
            {children}
          </main>
        </div>
        <BuyerBottomNav />
        <SessionGuard timeoutMinutes={sessionTimeout} />
      </div>
    </I18nProvider>
  )
}
