import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import SellerTopbar from '@/components/seller/SellerTopbar'
import {
  TrendingUp, ArrowLeftRight, Clock, CheckCircle2,
  XCircle, AlertTriangle, BarChart2, Timer,
} from 'lucide-react'
import { t, type Lang } from '@/lib/i18n'

export default async function SellerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, language')
    .eq('id', user.id)
    .single()

  const cookieStore = await cookies()
  const lang = (profile?.language ?? cookieStore.get('hoxa_lang')?.value ?? 'en') as Lang

  const { data: seller } = await supabase
    .from('sellers')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!seller) redirect('/dashboard')

  const [{ data: transactions }, { data: offers }, { data: notifications }] = await Promise.all([
    supabase
      .from('transactions')
      .select('status, from_amount, to_amount, from_currency, to_currency, created_at, completed_at')
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('offers')
      .select('id, is_available, available_liquidity, from_currency, to_currency')
      .eq('seller_id', seller.id),
    supabase
      .from('notifications')
      .select('id')
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  const txns = transactions ?? []
  const allOffers = offers ?? []
  const unreadNotifs = notifications?.length ?? 0

  // Compute analytics
  const completed = txns.filter(t => t.status === 'completed')
  const rejected = txns.filter(t => ['seller_rejected', 'seller_timeout', 'cancelled'].includes(t.status))
  const disputed = txns.filter(t => t.status === 'disputed')

  const totalVolume = completed.reduce((sum, t) => sum + (t.from_amount ?? 0), 0)

  // Monthly breakdown (last 6 months)
  const months: { label: string; completed: number; volume: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
    const monthTxns = completed.filter(t => t.completed_at?.slice(0, 7) === key)
    months.push({
      label,
      completed: monthTxns.length,
      volume: monthTxns.reduce((s, t) => s + (t.from_amount ?? 0), 0),
    })
  }
  const maxVolume = Math.max(...months.map(m => m.volume), 1)

  // Currency breakdown
  const currencyMap = new Map<string, number>()
  for (const tx of completed) {
    const pair = `${tx.from_currency}→${tx.to_currency}`
    currencyMap.set(pair, (currencyMap.get(pair) ?? 0) + 1)
  }
  const currencyBreakdown = [...currencyMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const totalLiquidity = allOffers
    .filter(o => o.is_available)
    .reduce((s, o) => s + (o.available_liquidity ?? 0), 0)

  return (
    <>
      <SellerTopbar
        title={t(lang, 'nav_analytics')}
        sellerName={profile?.full_name ?? 'Seller'}
        notifCount={unreadNotifs}
      />
      <main className="px-4 lg:px-8 py-5 space-y-6 w-full">

        {/* Header */}
        <div>
          <h1 className="text-gray-900 font-bold text-lg">{t(lang, 'analytics_title')}</h1>
          <p className="text-gray-400 text-sm mt-0.5">{t(lang, 'analytics_sub')}</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t(lang, 'total_volume'), value: `${totalVolume.toLocaleString()}`, icon: TrendingUp, color: 'text-[#18824a]', bg: 'bg-[#18824a]/10' },
            { label: t(lang, 'status_completed'), value: String(completed.length), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: t(lang, 'rejected'), value: String(rejected.length), icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            { label: t(lang, 'disputed'), value: String(disputed.length), icon: AlertTriangle, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Volume chart (left 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={16} className="text-[#18824a]" />
              <h2 className="text-gray-900 font-bold text-sm">{t(lang, 'monthly_volume')}</h2>
            </div>
            <div className="flex items-end gap-3 h-40">
              {months.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-gray-500 text-[10px] font-semibold">
                    {m.volume > 0 ? m.volume.toLocaleString() : ''}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-8 lg:w-10 rounded-t-lg bg-gradient-to-t from-[#18824a] to-[#18824a]/60 transition-all"
                      style={{
                        height: `${Math.max(4, (m.volume / maxVolume) * 120)}px`,
                      }}
                    />
                  </div>
                  <span className="text-gray-400 text-[10px]">{m.label}</span>
                  <span className="text-gray-300 text-[9px]">{m.completed} {t(lang, 'trades')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Seller metrics */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-gray-900 font-bold text-sm mb-4">{t(lang, 'key_metrics')}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-green-500" /> {t(lang, 'completion_rate')}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">{seller.completion_rate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs flex items-center gap-1.5">
                    <Timer size={12} className="text-blue-500" /> {t(lang, 'avg_response')}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">
                    {seller.avg_response_seconds > 0 ? `${Math.round(seller.avg_response_seconds)}s` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs flex items-center gap-1.5">
                    <ArrowLeftRight size={12} className="text-gray-400" /> {t(lang, 'total_trades')}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">{seller.total_transactions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs flex items-center gap-1.5">
                    <Clock size={12} className="text-amber-500" /> {t(lang, 'timeouts')}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">{seller.timeout_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-xs flex items-center gap-1.5">
                    <XCircle size={12} className="text-red-400" /> {t(lang, 'rejections')}
                  </span>
                  <span className="text-gray-900 font-bold text-sm">{seller.rejection_count}</span>
                </div>
              </div>
            </div>

            {/* Currency pairs */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-gray-900 font-bold text-sm mb-3">{t(lang, 'top_pairs')}</h3>
              {currencyBreakdown.length === 0 ? (
                <p className="text-gray-400 text-xs">{t(lang, 'no_completed_yet')}</p>
              ) : (
                <div className="space-y-2">
                  {currencyBreakdown.map(([pair, count]) => (
                    <div key={pair} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">{pair}</span>
                      <span className="text-xs text-gray-400">{count} {t(lang, 'trades')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liquidity summary */}
            <div className="bg-gradient-to-br from-[#18824a] to-[#0f6a3d] rounded-2xl p-4 text-white">
              <p className="text-white/60 text-xs mb-1">{t(lang, 'total_active_liquidity')}</p>
              <p className="text-2xl font-bold">{totalLiquidity.toLocaleString()}</p>
              <p className="text-white/50 text-xs mt-1">{t(lang, 'across_listings').replace('{count}', String(allOffers.filter(o => o.is_available).length))}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
