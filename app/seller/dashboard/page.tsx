import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import SellerTopbar from '@/components/seller/SellerTopbar'
import WalletCard from '@/components/seller/WalletCard'
import PendingRequestCard from '@/components/seller/PendingRequestCard'
import ListingCard from '@/components/seller/ListingCard'
import ReputationCard from '@/components/seller/ReputationCard'
import StatusBadge from '@/components/seller/StatusBadge'
import { ArrowRight, Package, Bell, ArrowLeftRight } from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

const TX_STATUS_MAP: Record<string, 'completed' | 'pending' | 'active' | 'rejected' | 'disputed'> = {
  fully_completed:              'completed',
  seller_rejected:              'rejected',
  seller_timeout:               'rejected',
  cancelled:                    'rejected',
  expired:                      'rejected',
  disputed:                     'disputed',
  pending_acceptance:           'pending',
  awaiting_payment:             'pending',
  pending_ops_confirmation:     'active',
  fulfillment_in_progress:      'active',
  pending_receipt_confirmation: 'active',
  pending_settlement:           'active',
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default async function SellerDashboardPage() {
  // getAuthUser() and getProfile() are cached — reuses layout's data (zero extra DB calls)
  const [{ user, supabase }, profile, cookieStore] = await Promise.all([
    getAuthUser(),
    getProfile(),
    cookies(),
  ])
  if (!user) redirect('/login')

  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!seller) redirect('/dashboard')

  // Parallel queries for dashboard data
  const [
    { data: offers },
    { data: pendingTxns },
    { data: allTxns },
    { data: notifications },
  ] = await Promise.all([
    supabase
      .from('offers')
      .select('*, corridors(send_country, receive_country)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*, profiles!buyer_id(full_name)')
      .eq('seller_id', seller.id)
      .in('status', ['pending_acceptance', 'pending_seller'])
      .order('created_at', { ascending: false }),
    supabase
      .from('transactions')
      .select('*, profiles!buyer_id(full_name)')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const sellerName = profile?.full_name ?? 'Seller'
  const unreadNotifs = (notifications ?? []).filter((n: any) => !n.read).length

  // Wallet stats
  const activeOffers = (offers ?? []).filter((o: any) => o.is_available)
  const totalLiquidity = activeOffers.reduce((sum: number, o: any) => sum + (o.available_liquidity ?? 0), 0)

  const activeTxns = (allTxns ?? []).filter((t: any) =>
    ['pending_ops_confirmation', 'fulfillment_in_progress', 'pending_receipt_confirmation', 'pending_settlement'].includes(t.status)
  )
  const pendingSettlement = activeTxns.reduce((sum: number, t: any) => sum + (t.to_amount ?? 0), 0)

  const today = new Date().toISOString().slice(0, 10)
  const todayTxns = (allTxns ?? []).filter((t: any) =>
    t.created_at?.slice(0, 10) === today
  )
  const dailyVolume = todayTxns.reduce((sum: number, t: any) => sum + (t.from_amount ?? 0), 0)

  // Stats
  const todayCompleted = todayTxns.filter((t: any) => t.status === 'fully_completed').length
  const avgResponse = seller.avg_response_seconds > 0
    ? `${Math.round(seller.avg_response_seconds)}s`
    : '—'

  // Transform pending transactions into PendingRequest shape
  const pendingRequests = (pendingTxns ?? []).map((tx: any) => {
    const deadline = new Date(tx.seller_response_deadline).getTime()
    const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    return {
      id: tx.id,
      buyerName: tx.profiles?.full_name ?? 'Buyer',
      fromCurrency: tx.from_currency,
      toCurrency: tx.to_currency,
      amount: tx.from_amount,
      rate: tx.rate,
      secondsLeft,
    }
  })

  // Transform offers into Listing shape
  const listings = (offers ?? []).slice(0, 3).map((o: any) => ({
    id: o.id,
    fromCurrency: o.from_currency,
    toCurrency: o.to_currency,
    sendCountry: o.corridors?.send_country ?? undefined,
    receiveCountry: o.corridors?.receive_country ?? undefined,
    rate: o.rate,
    rateSendRef: o.rate_send_ref ?? undefined,
    rateReceiveRef: o.rate_receive_ref ?? undefined,
    liquidity: o.available_liquidity,
    minAmount: o.min_amount,
    maxAmount: o.max_amount,
    status: (o.is_available ? 'active' : 'paused') as 'active' | 'paused',
  }))

  // Recent transactions for table
  const recentTxns = (allTxns ?? []).slice(0, 6).map((tx: any) => ({
    id: tx.id,
    buyer: tx.profiles?.full_name ?? 'Buyer',
    pair: `${tx.from_currency}→${tx.to_currency}`,
    amount: `${tx.from_amount?.toLocaleString()} ${tx.from_currency}`,
    status: TX_STATUS_MAP[tx.status] ?? 'pending',
    time: timeAgo(tx.created_at),
  }))

  // Reputation
  const score = Math.min(100, Math.round(
    (seller.completion_rate * 0.6) +
    (Math.max(0, 100 - (seller.timeout_count * 5)) * 0.2) +
    (Math.max(0, 100 - (seller.rejection_count * 3)) * 0.2)
  ))
  const tier = score >= 90 ? t(lang, 'tier_gold') : score >= 70 ? t(lang, 'tier_silver') : t(lang, 'tier_bronze')

  return (
    <>
      <SellerTopbar title={t(lang, 'nav_dashboard')} sellerName={sellerName} notifCount={unreadNotifs} />

      <main className="px-4 lg:px-8 py-5 space-y-6 w-full">

        {/* Wallet Card */}
        <WalletCard
          sellerName={sellerName}
          liquidity={totalLiquidity}
          pendingSettlements={pendingSettlement}
          dailyVolume={dailyVolume}
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t(lang, 'todays_trades'), value: String(todayCompleted), sub: `${todayTxns.length} ${t(lang, 'total_today')}` },
            { label: t(lang, 'completion_rate'), value: `${seller.completion_rate}%`, sub: t(lang, 'all_time') },
            { label: t(lang, 'avg_response'), value: avgResponse, sub: t(lang, 'all_time_avg') },
            { label: t(lang, 'total_trades'), value: String(seller.total_transactions), sub: `${seller.timeout_count} ${t(lang, 'timeouts')}` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-gray-400 text-xs mb-1">{s.label}</p>
              <p className="text-gray-900 font-bold text-xl">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Left: Pending + Listings + Recent */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pending Requests */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-900 font-bold text-base">
                  {t(lang, 'pending_requests')}
                  {pendingRequests.length > 0 && (
                    <span className="ml-2 text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </h2>
                {pendingRequests.length > 0 && (
                  <Link href="/seller/requests" className="text-[#18824a] text-sm font-medium hover:underline flex items-center gap-1">
                    {t(lang, 'view_all')} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
              {pendingRequests.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-[#18824a]/8 flex items-center justify-center mx-auto mb-3">
                    <ArrowLeftRight size={18} className="text-[#18824a]" />
                  </div>
                  <p className="text-gray-900 font-semibold text-sm mb-1">{t(lang, 'no_pending')}</p>
                  <p className="text-gray-400 text-xs">{t(lang, 'no_pending_sub')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.slice(0, 3).map((req: any) => (
                    <PendingRequestCard key={req.id} req={req} />
                  ))}
                </div>
              )}
            </section>

            {/* Active Listings */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-900 font-bold text-base">
                  {t(lang, 'active_listings')}
                  <span className="ml-2 text-xs font-medium text-gray-400">
                    {activeOffers.length} {t(lang, 'live')}
                  </span>
                </h2>
                <Link href="/seller/listings" className="text-[#18824a] text-sm font-medium hover:underline flex items-center gap-1">
                  {t(lang, 'manage')} <ArrowRight size={13} />
                </Link>
              </div>
              {listings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <div className="w-11 h-11 rounded-2xl bg-[#18824a]/8 flex items-center justify-center mx-auto mb-3">
                    <Package size={18} className="text-[#18824a]" />
                  </div>
                  <p className="text-gray-900 font-semibold text-sm mb-1">{t(lang, 'no_listings_dash')}</p>
                  <p className="text-gray-400 text-xs mb-4">{t(lang, 'no_listings_dash_sub')}</p>
                  <Link href="/seller/listings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#18824a] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                    <Package size={13} /> {t(lang, 'create_listing')}
                  </Link>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {listings.map((l: any) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent Transactions */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-gray-900 font-bold text-base">{t(lang, 'recent_transactions')}</h2>
                <Link href="/seller/transactions" className="text-[#18824a] text-sm font-medium hover:underline flex items-center gap-1">
                  View all <ArrowRight size={13} />
                </Link>
              </div>
              {recentTxns.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <p className="text-gray-400 text-sm">{t(lang, 'no_transactions_yet')}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-gray-100">
                        <tr className="text-left">
                          {[t(lang, 'th_txn_id'), t(lang, 'th_buyer'), t(lang, 'th_pair'), t(lang, 'th_amount'), t(lang, 'th_status'), t(lang, 'th_time')].map((h, i) => (
                            <th key={i} className="px-4 py-3 text-gray-400 font-medium text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentTxns.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-500 text-xs">{tx.id.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{tx.buyer}</td>
                            <td className="px-4 py-3 text-gray-600">{tx.pair}</td>
                            <td className="px-4 py-3 text-gray-900 font-semibold">{tx.amount}</td>
                            <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{tx.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile card stack */}
                  <div className="lg:hidden divide-y divide-gray-100">
                    {recentTxns.map((tx: any) => (
                      <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-gray-900 font-medium text-sm">{tx.buyer} · {tx.pair}</p>
                          <p className="text-gray-400 text-xs">{tx.id.slice(0, 8)} · {tx.time}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-900 font-semibold text-sm mb-1">{tx.amount}</p>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: Reputation + Performance + Notifications */}
          <div className="space-y-4">
            <ReputationCard
              score={score}
              completionRate={seller.completion_rate}
              tier={tier}
              verified={seller.status === 'approved'}
              fastResponder={seller.avg_response_seconds > 0 && seller.avg_response_seconds < 60}
            />

            {/* Performance breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-gray-900 font-bold text-sm mb-4">{t(lang, 'performance')}</h3>
              <div className="space-y-3">
                {[
                  { label: t(lang, 'completion_rate'), value: seller.completion_rate, color: 'bg-green-500' },
                  { label: t(lang, 'response_rate'), value: Math.max(0, 100 - (seller.timeout_count * 5)), color: 'bg-blue-500' },
                  { label: t(lang, 'acceptance_rate'), value: Math.max(0, 100 - (seller.rejection_count * 3)), color: 'bg-[#18824a]' },
                  { label: t(lang, 'timeout_rate'), value: Math.min(100, seller.timeout_count * 5), color: 'bg-red-400' },
                ].map(m => (
                  <div key={m.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-500">{m.label}</span>
                      <span className="text-xs font-semibold text-gray-900">{m.value}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${m.color} rounded-full`} style={{ width: `${Math.min(100, m.value)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications preview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-900 font-bold text-sm">{t(lang, 'notifications')}</h3>
                <Link href="/seller/notifications" className="text-[#18824a] text-xs font-medium hover:underline">
                  {t(lang, 'view_all')}
                </Link>
              </div>
              {(notifications ?? []).length === 0 ? (
                <div className="text-center py-4">
                  <Bell size={18} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-xs">{t(lang, 'no_notifications')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(notifications ?? []).slice(0, 4).map((n: any) => (
                    <div key={n.id} className={`flex gap-2.5 p-2.5 rounded-xl ${!n.read ? 'border-l-2 border-[#18824a] bg-[#F7F9F8]' : ''}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-[#18824a]' : 'bg-gray-300'}`} />
                      <div className="min-w-0">
                        <p className={`text-xs truncate ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>{n.title}</p>
                        <p className="text-gray-400 text-xs">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
