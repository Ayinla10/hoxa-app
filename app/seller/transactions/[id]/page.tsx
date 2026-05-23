import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { t, type Lang } from '@/lib/i18n'
import SellerTopbar from '@/components/seller/SellerTopbar'
import SellerTxDetailClient from './SellerTxDetailClient'

export default async function SellerTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ user, supabase }, profile, cookieStore] = await Promise.all([
    getAuthUser(),
    getProfile(),
    cookies(),
  ])
  if (!user) redirect('/login')

  const [{ data: seller }, notifResult] = await Promise.all([
    supabase.from('sellers').select('id').eq('user_id', user.id).single(),
    supabase.from('notifications').select('id').eq('user_id', user.id).eq('read', false),
  ])

  if (!seller) redirect('/dashboard')

  const { data: tx } = await supabase
    .from('transactions')
    .select(`
      *,
      profiles!buyer_id(full_name, country, phone)
    `)
    .eq('id', id)
    .eq('seller_id', seller.id)
    .single()

  if (!tx) redirect('/seller/transactions')

  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  return (
    <>
      <SellerTopbar
        title="Transaction Detail"
        sellerName={profile?.full_name ?? 'Seller'}
        notifCount={notifResult.data?.length ?? 0}
      />
      <main className="px-4 lg:px-8 py-5 max-w-3xl">
        <SellerTxDetailClient tx={tx} sellerUserId={user.id} />
      </main>
    </>
  )
}
