import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SellerTopbar from '@/components/seller/SellerTopbar'
import SellerTransactionsClient from './SellerTransactionsClient'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerTransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, language')
    .eq('id', user.id)
    .single()

  const { data: seller } = await supabase
    .from('sellers')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!seller) redirect('/dashboard')

  const [{ data: transactions }, { data: notifications }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, profiles!buyer_id(full_name, country)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  const cookieStore = await cookies()
  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  return (
    <>
      <SellerTopbar
        title={t(lang, 'nav_transactions')}
        sellerName={profile?.full_name ?? 'Seller'}
        notifCount={notifications?.length ?? 0}
      />
      <main className="px-4 lg:px-8 py-5 w-full">
        <SellerTransactionsClient transactions={transactions ?? []} />
      </main>
    </>
  )
}
