import AdminTopbar from '@/components/admin/AdminTopbar'
import { createServiceClient } from '@/lib/supabase/server'
import {
  BarChart2, ArrowLeftRight, CheckCircle2, XCircle,
  AlertTriangle, TrendingUp, Users, Store, DollarSign,
} from 'lucide-react'
import { requireAdminPermission } from '@/lib/admin-guard'

function getDayKey(dateStr: string, tz = 'Africa/Accra') {
  return new Date(dateStr).toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD
}

function formatDay(yyyy_mm_dd: string) {
  const [, m, d] = yyyy_mm_dd.split('-')
  return `${d}/${m}`
}

export default async function AnalyticsPage() {
  await requireAdminPermission('analytics')
  const supabase = createServiceClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const startOfMonth  = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [
    { count: totalTx },
    { count: completedTx },
    { count: disputedTx },
    { count: failedTx },
    { count: totalUsers },
    { count: totalSellers },
    { count: newUsersMonth },
    { data: completedTxns },
    { data: allRecentTxns },
    feeResult,
  ] = await Promise.all([
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'fully_completed'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).in('status', ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin').gte('created_at', startOfMonth),
    // For chart + corridor breakdown: last 30 days completed
    supabase.from('transactions')
      .select('send_amount, from_amount, send_currency, from_currency, receive_currency, to_currency, hoxa_fee_amount, created_at')
      .eq('status', 'fully_completed')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
    // For volume chart (all statuses last 30 days)
    supabase.from('transactions')
      .select('send_amount, from_amount, send_currency, from_currency, status, created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: true }),
    // Total fees ever
    supabase.from('transactions')
      .select('hoxa_fee_amount')
      .eq('status', 'fully_completed'),
  ])

  const completionRate = totalTx ? Math.round(((completedTx ?? 0) / totalTx) * 100) : 0
  const disputeRate    = totalTx ? Math.round(((disputedTx  ?? 0) / totalTx) * 100) : 0

  // ── Daily volume chart (last 30 days) ──────────────────────────
  const last30Days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    last30Days.push(d.toLocaleDateString('en-CA'))
  }

  const volumeByDay: Record<string, number> = {}
  for (const day of last30Days) volumeByDay[day] = 0
  for (const tx of allRecentTxns ?? []) {
    const day = getDayKey(tx.created_at)
    if (volumeByDay[day] !== undefined) {
      volumeByDay[day] += tx.send_amount ?? tx.from_amount ?? 0
    }
  }

  const dailyValues = last30Days.map(d => volumeByDay[d])
  const maxDaily = Math.max(...dailyValues, 1)

  // ── Corridor breakdown ──────────────────────────────────────────
  const corridorMap: Record<string, { count: number; volume: number }> = {}
  for (const tx of completedTxns ?? []) {
    const from = tx.send_currency ?? tx.from_currency ?? '?'
    const to   = tx.receive_currency ?? tx.to_currency ?? '?'
    const key  = `${from} → ${to}`
    if (!corridorMap[key]) corridorMap[key] = { count: 0, volume: 0 }
    corridorMap[key].count++
    corridorMap[key].volume += tx.send_amount ?? tx.from_amount ?? 0
  }

  const topCorridors = Object.entries(corridorMap)
    .sort((a, b) => b[1].volume - a[1].volume)
    .slice(0, 6)

  // ── Revenue (fees) ──────────────────────────────────────────────
  const feeData = (feeResult.data ?? []) as any[]
  const totalRevenue = feeData.reduce((s, tx) => s + (tx.hoxa_fee_amount ?? 0), 0)
  const revenueThisMonth = (completedTxns ?? []).reduce((s: number, tx: any) => s + (tx.hoxa_fee_amount ?? 0), 0)

  // ── Volume totals ───────────────────────────────────────────────
  const volume30d = (completedTxns ?? []).reduce((s: number, tx: any) => s + (tx.send_amount ?? tx.from_amount ?? 0), 0)

  const stats = [
    { label: 'Total Transactions', value: (totalTx ?? 0).toLocaleString(),       icon: ArrowLeftRight, color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Completed',          value: (completedTx ?? 0).toLocaleString(),   icon: CheckCircle2,   color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Completion Rate',    value: `${completionRate}%`,                  icon: TrendingUp,     color: 'text-[#18824a]', bg: 'bg-[#18824a]/10' },
    { label: 'Disputes',           value: (disputedTx ?? 0).toLocaleString(),    icon: AlertTriangle,  color: 'text-red-500',   bg: 'bg-red-50' },
    { label: 'Dispute Rate',       value: `${disputeRate}%`,                     icon: AlertTriangle,  color: 'text-red-500',   bg: 'bg-red-50' },
    { label: 'Failed / Expired',   value: (failedTx ?? 0).toLocaleString(),      icon: XCircle,        color: 'text-gray-500',  bg: 'bg-gray-100' },
    { label: 'Total Users',        value: (totalUsers ?? 0).toLocaleString(),    icon: Users,          color: 'text-blue-600',  bg: 'bg-blue-50' },
    { label: 'Active Sellers',     value: (totalSellers ?? 0).toLocaleString(),  icon: Store,          color: 'text-[#18824a]', bg: 'bg-[#18824a]/10' },
    { label: 'New Users (month)',   value: (newUsersMonth ?? 0).toLocaleString(), icon: Users,          color: 'text-purple-500',bg: 'bg-purple-50' },
  ]

  return (
    <>
      <AdminTopbar title="Analytics" />
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-6xl">

        <div>
          <h1 className="text-gray-900 font-bold text-lg">Platform Analytics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Live overview of platform performance.</p>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon size={16} className={s.color} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#18824a] to-[#0f6a3d] rounded-2xl p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={15} className="text-white/70" />
              <p className="text-white/70 text-xs font-medium">Total Revenue (all time)</p>
            </div>
            <p className="text-3xl font-bold">
              {totalRevenue > 0
                ? totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : '—'}
            </p>
            <p className="text-white/50 text-xs mt-1">From HOXA fee on completed exchanges</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 size={15} className="text-[#18824a]" />
              <p className="text-gray-400 text-xs font-medium">Volume (last 30 days)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {volume30d > 0
                ? volume30d.toLocaleString(undefined, { maximumFractionDigits: 0 })
                : '—'}
            </p>
            <p className="text-gray-400 text-xs mt-1">Combined send amount, completed only</p>
          </div>
        </div>

        {/* Daily volume chart */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Daily Transaction Volume</h2>
              <p className="text-gray-400 text-xs mt-0.5">All transactions — last 30 days</p>
            </div>
            <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">Last 30 days</span>
          </div>

          {/* SVG Bar chart */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: 480 }}>
              <svg width="100%" viewBox={`0 0 ${last30Days.length * 20} 80`} preserveAspectRatio="none" className="h-28">
                {dailyValues.map((val, i) => {
                  const barH = Math.max((val / maxDaily) * 64, val > 0 ? 3 : 0)
                  const x = i * 20 + 2
                  const y = 70 - barH
                  return (
                    <g key={i}>
                      <rect
                        x={x} y={y} width={16} height={barH}
                        rx={2}
                        fill={val > 0 ? '#18824a' : '#e5e7eb'}
                        opacity={val > 0 ? 0.85 : 0.4}
                      />
                    </g>
                  )
                })}
              </svg>

              {/* X-axis labels — show every 5 days */}
              <div className="flex mt-1" style={{ minWidth: 480 }}>
                {last30Days.map((day, i) => (
                  <div key={day} className="flex-1 text-center">
                    {i % 5 === 0 ? (
                      <span className="text-[9px] text-gray-400">{formatDay(day)}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#18824a]" />
              <span>Has activity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-200" />
              <span>No activity</span>
            </div>
            <span className="ml-auto">Peak: {maxDaily.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>

        {/* Corridor breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Top Corridors (last 30 days)</h2>
            <p className="text-gray-400 text-xs mt-0.5">Completed exchanges only, ranked by volume</p>
          </div>

          {topCorridors.length === 0 ? (
            <div className="p-10 text-center">
              <BarChart2 size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No completed exchanges in the last 30 days</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topCorridors.map(([corridor, data], i) => {
                const pct = Math.round((data.volume / (volume30d || 1)) * 100)
                return (
                  <div key={corridor} className="px-6 py-4 flex items-center gap-4">
                    <span className="w-6 text-xs font-bold text-gray-300">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{corridor}</p>
                      <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#18824a] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        {data.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-gray-400">{data.count} exchange{data.count !== 1 ? 's' : ''} · {pct}%</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
