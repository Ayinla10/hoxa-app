import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { I18nProvider } from '@/lib/i18n-context'
import { type Lang } from '@/lib/i18n'
import BuyerSidebar from '@/components/buyer/BuyerSidebar'
import BuyerTopbar from '@/components/buyer/BuyerTopbar'
import BuyerBottomNav from '@/components/buyer/BuyerBottomNav'
import SessionGuard from '@/components/SessionGuard'
import { getSettings } from '@/actions/settings'
import { cookies } from 'next/headers'

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) {
    // Profile was deleted — sign out the orphaned auth session
    await supabase.auth.signOut()
    redirect('/login')
  }
  if (profile.role === 'admin') redirect('/admin/dashboard')

  // Check if this user also has an approved seller account
  const { data: seller } = await supabase.from('sellers').select('id, status').eq('user_id', user.id).single()
  const isSeller = seller?.status === 'approved'

  const { data: notifications } = await supabase
    .from('notifications').select('id').eq('user_id', user.id).eq('read', false)

  // Language: profile preference > cookie > default 'en'
  const cookieStore = await cookies()
  const cookieLang = cookieStore.get('hoxa_lang')?.value
  const lang = (profile?.language ?? cookieLang ?? 'en') as Lang

  const notifCount = notifications?.length ?? 0
  const fullName = profile?.full_name ?? ''

  const settings = await getSettings()
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
