import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  ArrowLeftRight, Users, Store, CreditCard, AlertTriangle,
  CheckCircle2, TrendingUp, ArrowRight, ArrowUpRight,
  ShieldCheck, Zap, Activity
} from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; pill: string; dot: string }> = {
  pending:           { label: 'Awaiting Seller',    pill: 'bg-yellow-50 text-yellow-700 border-yellow-200',  dot: 'bg-yellow-400' },
  accepted:          { label: 'Accepted',            pill: 'bg-blue-50 text-blue-700 border-blue-200',        dot: 'bg-blue-500' },
  payment_submitted: { label: 'Escrow Pending',      pill: 'bg-blue-100 text-blue-800 border-blue-300',       dot: 'bg-blue-600 animate-pulse' },
  payment_verified:  { label: 'Fulfillment Pending', pill: 'bg-orange-50 text-orange-700 border-orange-200',  dot: 'bg-orange-400' },
  proof_submitted:   { label: 'Proof Sent',          pill: 'bg-purple-50 text-purple-700 border-purple-200',  dot: 'bg-purple-400' },
  completed:         { label: 'Completed',           pill: 'bg-green-50 text-green-700 border-green-200',     dot: 'bg-green-500' },
  disputed:          { label: 'Disputed',            pill: 'bg-red-50 text-red-700 border-red-200',           dot: 'bg-red-500 animate-pulse' },
  cancelled:         { label: 'Cancelled',           pill: 'bg-gray-100 text-gray-500 border-gray-200',       dot: 'bg-gray-400' },
  seller_timeout:    { label: 'Timed Out',           pill: 'bg-gray-100 text-gray-500 border-gray-200',       dot: 'bg-gray-400' },
}

export default async function AdminDashboard() {
  const supabase = createServiceClient()
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  const [
    { count: totalUsers },
    { count: totalTransactions },
    { count: activeExchanges },
    { count: pendingEscrow },
    { count: activeSellers },
    { count: disputes },
    { count: completedAll },
    { count: pendingApplications },
    { data: recentTxns },
    { data: escrowQueue },
    { data: recentDisputes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true })
      .in('status', ['accepted', 'payment_submitted', 'payment_verified', 'proof_submitted']),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'payment_submitted'),
    supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('sellers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('transactions')
      .select('id, from_amount, from_currency, to_currency, status, created_at, profiles!buyer_id(full_name), sellers(profiles(full_name))')
      .order('created_at', { ascending: false }).limit(8),
    supabase.from('transactions')
      .select('id, from_amount, from_currency, to_currency, created_at, profiles!buyer_id(full_name), sellers(profiles(full_name))')
      .eq('status', 'payment_submitted').order('created_at', { ascending: false }).limit(4),
    supabase.from('transactions')
      .select('id, from_amount, from_currency, to_currency, created_at, profiles!buyer_id(full_name), sellers(profiles(full_name))')
      .eq('status', 'disputed').order('created_at', { ascending: false }).limit(3),
  ])

  const { data: adminProfile } = await authSupabase.from('profiles').select('full_name').eq('id', user?.id ?? '').single()
  const fullName = adminProfile?.full_name ?? user?.email?.split('@')[0] ?? 'Admin'
  const adminName = fullName.split(' ').pop() ?? fullName
  const totalNotifs = (pendingEscrow ?? 0) + (pendingApplications ?? 0) + (disputes ?? 0)
  const completionRate = totalTransactions ? Math.round(((completedAll ?? 0) / (totalTransactions ?? 1)) * 100) : 0

  const metrics = [
    { label: 'Total Transactions', value: (totalTransactions ?? 0).toLocaleString(), sub: 'All time', icon: ArrowLeftRight, accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Active Exchanges',   value: (activeExchanges ?? 0).toLocaleString(),   sub: 'Live now',  icon: Activity,       accent: 'text-[#18824a]', bg: 'bg-green-50', border: 'border-green-100', pulse: (activeExchanges ?? 0) > 0 },
    { label: 'Escrow Pending',     value: (pendingEscrow ?? 0).toLocaleString(),     sub: 'Needs review', icon: CreditCard,  accent: 'text-amber-600', bg: 'bg-amber-50', border: (pendingEscrow ?? 0) > 0 ? 'border-amber-300' : 'border-amber-100', urgent: (pendingEscrow ?? 0) > 0 },
    { label: 'Active Sellers',     value: (activeSellers ?? 0).toLocaleString(),     sub: 'Approved',  icon: Store,          accent: 'text-[#18824a]', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Open Disputes',      value: (disputes ?? 0).toLocaleString(),          sub: 'Unresolved', icon: AlertTriangle, accent: 'text-red-600',   bg: 'bg-red-50',   border: (disputes ?? 0) > 0 ? 'border-red-300' : 'border-red-100', urgent: (disputes ?? 0) > 0 },
    { label: 'Total Users',        value: (totalUsers ?? 0).toLocaleString(),        sub: 'Registered', icon: Users,         accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Completion Rate',    value: `${completionRate}%`,                      sub: 'Success rate', icon: CheckCircle2, accent: 'text-[#18824a]', bg: 'bg-green-50', border: 'border-green-100' },
    { label: 'Seller Applications',value: (pendingApplications ?? 0).toLocaleString(), sub: 'Pending review', icon: ShieldCheck, accent: 'text-amber-600', bg: 'bg-amber-50', border: (pendingApplications ?? 0) > 0 ? 'border-amber-300' : 'border-amber-100', urgent: (pendingApplications ?? 0) > 0 },
  ]

  return (
    <>
      <AdminTopbar title="Overview" adminName={fullName} notifCount={totalNotifs} pendingEscrow={pendingEscrow ?? 0} />

      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-[1400px] mx-auto">

        {/* Hero card */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530]">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full border border-white/8 pointer-events-none" />
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full border border-white/8 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />

          <div className="relative px-6 py-6 lg:px-8 lg:py-7">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              {/* Left */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Control Center</span>
                  <span className="flex items-center gap-1 text-[10px] text-green-300 font-semibold bg-green-300/10 border border-green-300/20 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-green-300 animate-pulse" />
                    Live
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
                  Welcome back, {adminName} 👋
                </h1>
                <p className="text-white/45 text-sm">Here's what's happening on the HOXA platform right now.</p>
              </div>

            </div>

            {/* Bottom row */}
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-300" />
                <span className="text-white/50 text-xs">{activeSellers ?? 0} active sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-300" />
                <span className="text-white/50 text-xs">{totalUsers ?? 0} registered users</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-300" />
                <span className="text-white/50 text-xs">{completionRate}% completion rate</span>
              </div>
              {(pendingApplications ?? 0) > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                  <span className="text-amber-300 text-xs font-medium">{pendingApplications} seller application{(pendingApplications ?? 0) > 1 ? 's' : ''} pending</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Urgent escrow alert */}
        {(pendingEscrow ?? 0) > 0 && (
          <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
              <p className="text-amber-800 text-sm font-semibold">
                {pendingEscrow} payment{(pendingEscrow ?? 0) > 1 ? 's' : ''} awaiting escrow verification
              </p>
            </div>
            <Link href="/admin/escrow"
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5">
              Review Now <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label}
              className={`bg-white rounded-2xl border ${m.border} p-5 shadow-sm hover:shadow-md transition-all`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center`}>
                  <m.icon size={16} className={m.accent} />
                </div>
                {m.pulse && <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse mt-1" />}
                {m.urgent && !m.pulse && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1" />}
              </div>
              <p className="text-2xl font-bold text-gray-900 tracking-tight">{m.value}</p>
              <p className="text-gray-500 text-xs mt-1 font-medium">{m.label}</p>
              <p className="text-gray-400 text-[10px] mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">

          {/* Left: transactions + disputes */}
          <div className="lg:col-span-2 space-y-5">

            {/* Transactions table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-gray-900 font-bold">Live Transactions</h2>
                  <p className="text-gray-400 text-xs mt-0.5">Most recent exchange activity</p>
                </div>
                <Link href="/admin/transactions"
                  className="flex items-center gap-1 text-[#18824a] hover:text-[#0f6a3d] text-xs font-semibold transition-colors">
                  View all <ArrowUpRight size={12} />
                </Link>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
                  {['Buyer', 'Seller', 'Amount / Pair', 'Status', 'Date'].map(h => (
                    <p key={h} className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider">{h}</p>
                  ))}
                </div>
                <div className="divide-y divide-gray-50">
                  {(recentTxns ?? []).length === 0 ? (
                    <div className="py-12 text-center">
                      <ArrowLeftRight size={28} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No transactions yet</p>
                    </div>
                  ) : (recentTxns ?? []).map((tx: any) => {
                    const s = STATUS_MAP[tx.status] ?? STATUS_MAP.pending
                    return (
                      <div key={tx.id}>
                        <div className="hidden lg:grid grid-cols-[1fr_1fr_1fr_auto_auto] gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors items-center">
                          <p className="text-gray-900 text-sm font-medium truncate">{tx.profiles?.full_name ?? '—'}</p>
                          <p className="text-gray-500 text-sm truncate">{tx.sellers?.profiles?.full_name ?? '—'}</p>
                          <div>
                            <p className="text-gray-900 text-sm font-semibold">{tx.from_amount?.toLocaleString()} {tx.from_currency}</p>
                            <p className="text-gray-400 text-xs">→ {tx.to_currency}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.pill} whitespace-nowrap`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                          <p className="text-gray-400 text-xs whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="lg:hidden flex items-center justify-between px-4 py-3.5">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{tx.profiles?.full_name ?? '—'}</p>
                            <p className="text-gray-400 text-xs">{tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_currency}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${s.pill}`}>
                            <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Disputes */}
            {(recentDisputes ?? []).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" /> Open Disputes
                  </h3>
                  <Link href="/admin/disputes" className="text-red-500 text-xs font-semibold hover:text-red-600 transition-colors">View all</Link>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                  {(recentDisputes ?? []).map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-red-50/50 transition-colors">
                      <div>
                        <p className="text-gray-900 text-sm font-medium">{tx.profiles?.full_name ?? '—'} vs {tx.sellers?.profiles?.full_name ?? '—'}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_currency} · #{tx.id.slice(0, 8)}</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-red-50 text-red-700 border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Disputed
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Escrow queue */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 font-bold text-sm">Escrow Queue</h3>
                  <p className="text-gray-400 text-[10px] mt-0.5">Payments awaiting verification</p>
                </div>
                <Link href="/admin/escrow" className="text-[#18824a] text-xs font-semibold hover:text-[#0f6a3d] transition-colors">View all</Link>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {(escrowQueue ?? []).length === 0 ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 size={24} className="text-[#18824a]/30 mx-auto mb-2" />
                    <p className="text-gray-400 text-xs font-medium">Queue is clear</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {(escrowQueue ?? []).map((tx: any) => (
                      <div key={tx.id} className="px-4 py-4">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-gray-900 text-sm font-semibold">{tx.profiles?.full_name ?? '—'}</p>
                          <span className="text-gray-400 text-[10px] font-mono">#{tx.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-gray-400 text-xs mb-3">{tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_currency}</p>
                        <div className="flex gap-2">
                          <Link href="/admin/escrow"
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-bold text-center hover:opacity-90 transition-opacity shadow-sm">
                            Verify
                          </Link>
                          <button className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500 text-xs font-medium transition-colors">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Platform health */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-[#18824a]" />
                <h3 className="text-gray-900 font-bold text-sm">Platform Health</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Completion Rate', value: `${completionRate}%`, good: completionRate >= 80 },
                  { label: 'Pending Seller Apps', value: String(pendingApplications ?? 0), good: (pendingApplications ?? 0) === 0 },
                  { label: 'Open Disputes', value: String(disputes ?? 0), good: (disputes ?? 0) === 0 },
                  { label: 'Active Sellers', value: String(activeSellers ?? 0), good: (activeSellers ?? 0) > 0 },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-gray-400 text-xs">{item.label}</span>
                    <span className={`text-xs font-bold ${item.good ? 'text-[#18824a]' : 'text-amber-500'}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-gray-900 font-bold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-1">
                {[
                  { label: 'Seller Applications', href: '/admin/sellers', count: pendingApplications ?? 0, icon: ShieldCheck },
                  { label: 'Escrow Queue',         href: '/admin/escrow',  count: pendingEscrow ?? 0,      icon: CreditCard },
                  { label: 'Manage Users',         href: '/admin/users',   count: null,                    icon: Users },
                ].map(action => (
                  <Link key={action.href} href={action.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-2.5">
                      <action.icon size={14} className="text-gray-400 group-hover:text-[#18824a] transition-colors" />
                      <span className="text-gray-600 text-xs font-medium group-hover:text-gray-900 transition-colors">{action.label}</span>
                    </div>
                    {action.count !== null && action.count > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {action.count > 9 ? '9+' : action.count}
                      </span>
                    ) : (
                      <ArrowRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* System status */}
            <div className="bg-gradient-to-br from-[#18824a] to-[#0f6a3d] rounded-2xl p-5 shadow-sm shadow-[#18824a]/20">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={13} className="text-green-200" />
                <h3 className="text-white font-bold text-sm">System Status</h3>
                <span className="ml-auto text-[10px] text-green-200 font-semibold">All Operational</span>
              </div>
              <div className="space-y-2.5">
                {['API Gateway', 'Escrow Engine', 'Notifications', 'Database'].map(service => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-white/60 text-xs">{service}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-300" />
                      <span className="text-green-200 text-[10px] font-semibold">OK</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
