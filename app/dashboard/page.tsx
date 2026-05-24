import { getAuthUser, getProfile, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getBuyerTransactions } from '@/actions/transactions'
import { getSellerApplicationStatus } from '@/actions/profile'
import { getActiveCorridors } from '@/actions/corridors'
import { getSettings } from '@/actions/settings'
import ExchangeOverviewCard from '@/components/buyer/ExchangeOverviewCard'
import ExchangeEntryWidget from '@/components/buyer/ExchangeEntryWidget'
import PlatformStatusBanner from '@/components/buyer/PlatformStatusBanner'
import CorridorCard from '@/components/buyer/CorridorCard'
import {
  ArrowRight, Clock, CheckCircle2, UserCheck,
  ChevronRight, ArrowLeftRight, Store, ShieldCheck,
} from 'lucide-react'

const TX_STATUS: Record<string, { label: string; pill: string; dot: string }> = {
  pending_acceptance:            { label: 'Matching',        pill: 'bg-amber-50 text-amber-700 border-amber-200',            dot: 'bg-amber-500' },
  awaiting_payment:              { label: 'Pay Now',         pill: 'bg-amber-50 text-amber-700 border-amber-200',            dot: 'bg-amber-500' },
  pending_ops_confirmation:      { label: 'Confirming',      pill: 'bg-blue-50 text-blue-700 border-blue-200',               dot: 'bg-blue-500' },
  fulfillment_in_progress:       { label: 'Sending',         pill: 'bg-blue-50 text-blue-700 border-blue-200',               dot: 'bg-blue-500' },
  pending_receipt_confirmation:  { label: 'Confirm Receipt', pill: 'bg-purple-50 text-purple-700 border-purple-200',         dot: 'bg-purple-500' },
  pending_settlement:            { label: 'Settling',        pill: 'bg-teal-50 text-teal-700 border-teal-200',               dot: 'bg-teal-500' },
  fully_completed:               { label: 'Completed',       pill: 'bg-green-50 text-green-700 border-green-200',            dot: 'bg-green-500' },
  disputed:                      { label: 'Disputed',        pill: 'bg-purple-50 text-purple-700 border-purple-200',         dot: 'bg-purple-500' },
  seller_rejected:               { label: 'Cancelled',       pill: 'bg-red-50 text-red-600 border-red-200',                  dot: 'bg-red-500' },
  seller_timeout:                { label: 'Timed Out',       pill: 'bg-red-50 text-red-600 border-red-200',                  dot: 'bg-red-500' },
  cancelled:                     { label: 'Cancelled',       pill: 'bg-red-50 text-red-600 border-red-200',                  dot: 'bg-red-500' },
  expired:                       { label: 'Expired',         pill: 'bg-gray-100 text-gray-500 border-gray-200',              dot: 'bg-gray-400' },
}

function getStatus(s: string) {
  return TX_STATUS[s] ?? { label: 'Pending', pill: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' }
}

const TERMINAL_STATUSES = ['fully_completed', 'cancelled', 'seller_rejected', 'seller_timeout', 'expired']

export default async function BuyerDashboard() {
  const [profile, { user, supabase }] = await Promise.all([
    getProfile(),
    getAuthUser(),
  ])
  if (!user) redirect('/login')

  // All data fetches in parallel
  const [transactions, sellerStatus, corridors, settings, corridorResult] = await Promise.all([
    getBuyerTransactions(),
    getSellerApplicationStatus(),
    getActiveCorridors(),
    getSettings(),
    supabase
      .from('offers')
      .select('from_currency, to_currency, rate, seller_id')
      .eq('is_available', true),
  ])

  // Build corridor stats from offers
  const corridorStats: Record<string, { rates: number[]; sellers: Set<string> }> = {}
  for (const offer of (corridorResult.data ?? [])) {
    const key = `${offer.from_currency}-${offer.to_currency}`
    if (!corridorStats[key]) corridorStats[key] = { rates: [], sellers: new Set() }
    corridorStats[key].rates.push(offer.rate)
    corridorStats[key].sellers.add(offer.seller_id)
  }

  const completed = transactions.filter((t: any) =>
    ['completed', 'fully_completed'].includes(t.status)
  )
  const active = transactions.filter((t: any) => !TERMINAL_STATUSES.includes(t.status))
  const pending = transactions.filter((t: any) =>
    t.status === 'pending_ops_confirmation'
  )
  const recent = transactions.slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const platformOpenHour = Number(settings.platform_open_hour ?? 7)
  const platformCloseHour = Number(settings.platform_close_hour ?? 22)
  const platformTimezone = String(settings.platform_timezone ?? 'Africa/Accra').replace(/"/g, '')
  const platformStatusOverride = settings.platform_status ? String(settings.platform_status).replace(/"/g, '') : undefined


  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">

      {/* Platform Status Banner */}
      <PlatformStatusBanner
        openHour={platformOpenHour}
        closeHour={platformCloseHour}
        timezone={platformTimezone}
        statusOverride={platformStatusOverride as any}
      />

      {/* 1. Hero Overview Card — the green hero */}
      <ExchangeOverviewCard
        fullName={profile?.full_name ?? ''}
        greeting={greeting}
        successfulExchanges={completed.length}
        pendingVerification={pending.length}
        activeTransactions={active.length}
        avgCompletionMins={completed.length > 0 ? 8 : 0}
      />

      {/* 2. Exchange Widget + Sidebar cards */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 items-start w-full max-w-full overflow-hidden">
        {/* Exchange Widget — 2 cols */}
        <div className="lg:col-span-2 min-w-0 max-w-full">
          <ExchangeEntryWidget
            corridors={corridors}
            userCountry={profile?.country ?? ''}

          />
        </div>

        {/* Right sidebar — 1 col */}
        <div className="space-y-4 min-w-0 max-w-full">
          {/* Protection card */}
          <div className="bg-white rounded-2xl border border-[#177945]/20 p-4 flex items-start gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={16} className="text-[#177945]" />
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold text-sm">HOXA Protected</p>
              <p className="text-gray-400 text-xs leading-relaxed mt-0.5">
                Every exchange is secured. You pay HOXA, we verify, then the seller delivers. Your money is always protected.
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

      {/* 3. Active Corridors — driven by DB */}
      {corridors.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 text-sm">Active Corridors</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full max-w-full">
            {corridors.slice(0, 4).map(c => {
              const key = `${c.send_currency}-${c.receive_currency}`
              const stats = corridorStats[key]
              const avgRate = stats && stats.rates.length > 0
                ? stats.rates.reduce((a, b) => a + b, 0) / stats.rates.length
                : null
              const sellerCount = stats ? stats.sellers.size : 0

              return (
                <CorridorCard
                  key={c.id}
                  from={c.send_currency}
                  to={c.receive_currency}
                  sendCountry={c.send_country}
                  receiveCountry={c.receive_country}
                  avgRate={avgRate}
                  sellerCount={sellerCount}
                  avgSpeed={sellerCount > 0 ? '~8 min' : '--'}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* 4. Active Transactions */}
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-full">
            {active.slice(0, 3).map((tx: any) => {
              const st = getStatus(tx.status)
              const sendAmt = tx.send_amount ?? tx.from_amount
              const sendCur = tx.send_currency ?? tx.from_currency
              const recvCur = tx.receive_currency ?? tx.to_currency
              const txRef = tx.hoxa_transaction_id ?? `HOXA-${tx.id.slice(0, 4).toUpperCase()}`
              return (
                <Link
                  key={tx.id}
                  href={`/dashboard/transactions/${tx.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-gray-200 shadow-sm px-3 sm:px-4 py-3 sm:py-3.5 hover:border-[#177945]/30 hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                      {sendAmt?.toLocaleString()} {sendCur} → {recvCur}
                    </p>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-400 text-xs truncate">{txRef}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border whitespace-nowrap flex-shrink-0 ${st.pill}`}>
                        <span className={`w-1 h-1 rounded-full ${st.dot} animate-pulse`} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-[#177945] transition-colors flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* 5. Recent Activity */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Recent Activity</h2>
          {recent.length > 0 && (
            <Link href="/dashboard/transactions" className="text-[#177945] text-xs font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          )}
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
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-w-0">
            {recent.map((tx: any, i: number) => {
              const st = getStatus(tx.status)
              const sendAmt = tx.send_amount ?? tx.from_amount
              const sendCur = tx.send_currency ?? tx.from_currency
              const recvAmt = tx.receive_amount ?? tx.to_amount
              const recvCur = tx.receive_currency ?? tx.to_currency
              const txRef = tx.hoxa_transaction_id ?? ''
              return (
                <Link
                  key={tx.id}
                  href={`/dashboard/transactions/${tx.id}`}
                  className={`flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-3.5 hover:bg-gray-50 transition-colors group ${i !== 0 ? 'border-t border-gray-100' : ''}`}
                >
                  <div className="w-8 h-8 rounded-xl bg-[#177945]/8 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight size={13} className="text-[#177945]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate mb-0.5">
                      {sendAmt?.toLocaleString()} {sendCur} → {recvAmt?.toFixed(2)} {recvCur}
                    </p>
                    <p className="text-gray-400 text-xs truncate">
                      {txRef && <span className="text-gray-500 font-medium">{txRef} · </span>}
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
    </div>
  )
}
