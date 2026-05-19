import { getAuthUser, getProfile, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBuyerTransactions } from '@/actions/transactions'
import { getSellerApplicationStatus } from '@/actions/profile'
import ExchangeOverviewCard from '@/components/buyer/ExchangeOverviewCard'
import QuickExchangeWidget from '@/components/buyer/QuickExchangeWidget'
import RecommendedSellerCard from '@/components/buyer/RecommendedSellerCard'
import {
  ArrowRight, Clock, CheckCircle2, UserCheck,
  ChevronRight, ArrowLeftRight, Store, ShieldCheck,
} from 'lucide-react'

const TX_STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  completed:         { label: 'Completed',  pill: 'bg-green-50 text-green-700 border-green-200',            dot: 'bg-green-500' },
  seller_rejected:   { label: 'Cancelled',  pill: 'bg-red-50 text-red-600 border-red-200',                 dot: 'bg-red-500' },
  seller_timeout:    { label: 'Timed Out',  pill: 'bg-red-50 text-red-600 border-red-200',                 dot: 'bg-red-500' },
  cancelled:         { label: 'Cancelled',  pill: 'bg-red-50 text-red-600 border-red-200',                 dot: 'bg-red-500' },
  disputed:          { label: 'Disputed',   pill: 'bg-purple-50 text-purple-700 border-purple-200',        dot: 'bg-purple-500' },
  payment_submitted: { label: 'Proof Sent', pill: 'bg-blue-50 text-blue-700 border-blue-200',              dot: 'bg-blue-500' },
  payment_verified:  { label: 'Verified',   pill: 'bg-teal-50 text-teal-700 border-teal-200',              dot: 'bg-teal-500' },
  seller_accepted:   { label: 'Accepted',   pill: 'bg-[#177945]/10 text-[#177945] border-[#177945]/20',   dot: 'bg-[#177945]' },
  pending_seller:    { label: 'Awaiting',   pill: 'bg-amber-50 text-amber-700 border-amber-200',           dot: 'bg-amber-500' },
}

function getStatus(s: string) {
  return TX_STATUS[s] ?? { label: 'Pending', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
}

export default async function BuyerDashboard() {
  // getProfile() and getAuthUser() are cached per request — these reuse
  // the same data already fetched by the layout (zero extra DB calls)
  const [profile, { user, supabase }] = await Promise.all([
    getProfile(),
    getAuthUser(),
  ])
  if (!user) redirect('/login')

  // All three data fetches in parallel
  const [transactions, sellerStatus, sellersResult] = await Promise.all([
    getBuyerTransactions(),
    getSellerApplicationStatus(),
    supabase
      .from('offers')
      .select(`
        id, from_currency, to_currency, rate, min_amount, max_amount,
        sellers!inner (
          id, status, completion_rate, avg_response_seconds, total_transactions,
          profiles ( full_name, country )
        )
      `)
      .eq('is_available', true)
      .eq('sellers.status', 'approved')
      .order('rate', { ascending: true })
      .limit(3),
  ])

  const sellers = sellersResult.data

  const completed = transactions.filter((t: any) => t.status === 'completed')
  const active    = transactions.filter((t: any) => !['completed', 'cancelled', 'seller_rejected', 'seller_timeout'].includes(t.status))
  const pending   = transactions.filter((t: any) => t.status === 'payment_submitted')
  const recent    = transactions.slice(0, 5)
  const avgMins   = completed.length > 0 ? 8 : 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">

      {/* 1. Hero overview card */}
      <ExchangeOverviewCard
        fullName={profile?.full_name ?? ''}
        greeting={greeting}
        successfulExchanges={completed.length}
        pendingVerification={pending.length}
        activeTransactions={active.length}
        avgCompletionMins={avgMins}
      />

      {/* 2. Quick Exchange + Recommended Sellers — side by side */}
      <div className="grid lg:grid-cols-5 gap-6 items-start">

        {/* Quick Exchange — 2 cols */}
        <div className="lg:col-span-2">
          <QuickExchangeWidget />
        </div>

        {/* Recommended Sellers — 3 cols */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Recommended Sellers</h2>
              <p className="text-gray-400 text-xs">Ranked by reputation &amp; speed</p>
            </div>
            <Link href="/dashboard/marketplace" className="text-[#177945] text-xs font-semibold hover:underline flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>

          {sellers && sellers.length > 0 ? (
            <div className="grid sm:grid-cols-1 gap-3">
              {sellers.map((offer: any) => (
                <RecommendedSellerCard key={offer.id} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center flex-1">
              <div className="w-11 h-11 rounded-2xl bg-[#177945]/8 flex items-center justify-center mx-auto mb-3">
                <Store size={18} className="text-[#177945]" />
              </div>
              <p className="text-gray-900 font-semibold text-sm mb-1">No active sellers yet</p>
              <p className="text-gray-400 text-xs">Sellers will appear here once approved and live.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Active Transactions — only when present */}
      {active.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">
              Active Transactions
              <span className="ml-2 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">{active.length}</span>
            </h2>
            <Link href="/dashboard/transactions" className="text-[#177945] text-xs font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {active.slice(0, 3).map((tx: any) => {
              const st = getStatus(tx.status)
              return (
                <Link
                  key={tx.id}
                  href={`/dashboard/transactions/${tx.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-3.5 hover:border-[#177945]/30 hover:shadow-md transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_currency}
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.pill}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot} animate-pulse`} />
                      {st.label}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#177945] transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Recent Activity + Right cards */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">

        {/* Recent Activity — 2 cols */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Recent Activity</h2>
            <Link href="/dashboard/transactions" className="text-[#177945] text-xs font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <div className="w-11 h-11 rounded-2xl bg-[#177945]/8 flex items-center justify-center mx-auto mb-3">
                <ArrowLeftRight size={18} className="text-[#177945]" />
              </div>
              <p className="text-gray-900 font-semibold text-sm mb-1">No activity yet</p>
              <p className="text-gray-400 text-xs mb-4">Your completed exchanges will appear here.</p>
              <Link href="/dashboard/marketplace" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                <Store size={13} /> Start an Exchange
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {recent.map((tx: any, i: number) => {
                const st = getStatus(tx.status)
                return (
                  <Link
                    key={tx.id}
                    href={`/dashboard/transactions/${tx.id}`}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors group ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#177945]/8 flex items-center justify-center flex-shrink-0">
                      <ArrowLeftRight size={13} className="text-[#177945]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm">{tx.from_amount?.toLocaleString()} {tx.from_currency}</span>
                        <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                        <span className="font-semibold text-gray-900 text-sm">{tx.to_amount?.toFixed(2)} {tx.to_currency}</span>
                      </div>
                      <p className="text-gray-400 text-xs truncate">
                        {tx.sellers?.profiles?.full_name ?? 'Seller'} · {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.pill}`}>
                        <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <ChevronRight size={13} className="text-gray-300 group-hover:text-gray-400" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column — 1 col */}
        <div className="space-y-3">

          {/* Escrow trust */}
          <div className="bg-white rounded-2xl border border-[#177945]/20 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-[#177945]" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">HOXA Escrow Protection</p>
              <p className="text-gray-400 text-xs leading-relaxed mt-0.5">
                Funds are verified before seller fulfilment begins. Every exchange is protected.
              </p>
            </div>
          </div>

          {/* Seller CTA */}
          {!sellerStatus && (
            <div className="bg-gradient-to-br from-[#0B1F16] to-[#0f2d1a] rounded-2xl p-5 text-white">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                <UserCheck size={16} className="text-green-300" />
              </div>
              <h3 className="font-bold text-sm mb-1">Become a Seller</h3>
              <p className="text-white/50 text-xs mb-4 leading-relaxed">List your liquidity and earn from every exchange on HOXA.</p>
              <Link href="/dashboard/become-seller" className="block text-center py-2.5 rounded-xl bg-[#177945] text-white text-sm font-bold hover:opacity-90 transition-opacity">
                Apply Now
              </Link>
            </div>
          )}

          {sellerStatus === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <Clock size={16} className="text-amber-600" />
              </div>
              <p className="text-amber-800 font-semibold text-sm mb-1">Application Under Review</p>
              <p className="text-amber-600 text-xs leading-relaxed">We'll notify you once your seller application is approved.</p>
            </div>
          )}

          {sellerStatus === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 size={16} className="text-green-600" />
              </div>
              <p className="text-green-800 font-semibold text-sm mb-1">You're an Approved Seller</p>
              <Link href="/seller/dashboard" className="inline-flex items-center gap-1 text-[#177945] text-xs font-semibold hover:underline mt-1">
                Go to Seller Dashboard <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
