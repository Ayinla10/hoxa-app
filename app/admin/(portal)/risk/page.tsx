import AdminTopbar from '@/components/admin/AdminTopbar'
import { createServiceClient } from '@/lib/supabase/server'
import { Shield, AlertTriangle, User, ArrowLeftRight, Flag } from 'lucide-react'
import { requireAdminPermission } from '@/lib/admin-guard'
import { FraudFlagButton, BanButton } from './RiskActions'
import Link from 'next/link'

export default async function RiskPage() {
  await requireAdminPermission('risk')
  const supabase = createServiceClient()

  const [
    { data: disputes, count: totalDisputed },
    { data: timedOut },
    { data: flaggedUsers },
    { data: highClaims },
  ] = await Promise.all([
    supabase
      .from('transactions')
      .select('id, hoxa_transaction_id, send_amount, from_amount, send_currency, from_currency, receive_currency, to_currency, dispute_reason, created_at, profiles!buyer_id(id, full_name, country, fraud_flag, is_banned), sellers(profiles(full_name))', { count: 'exact' })
      .eq('status', 'disputed')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('transactions')
      .select('id, hoxa_transaction_id, send_amount, from_amount, send_currency, from_currency, created_at, profiles!buyer_id(full_name), sellers(profiles(id, full_name, is_banned))')
      .eq('status', 'seller_timeout')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('profiles')
      .select('id, full_name, phone, country, role, fraud_flag, is_banned, unconfirmed_claim_count')
      .eq('fraud_flag', true)
      .order('full_name'),
    supabase
      .from('profiles')
      .select('id, full_name, phone, country, fraud_flag, is_banned, unconfirmed_claim_count')
      .gt('unconfirmed_claim_count', 2)
      .order('unconfirmed_claim_count', { ascending: false })
      .limit(20),
  ])

  return (
    <>
      <AdminTopbar title="Risk Control" notifCount={totalDisputed ?? 0} />
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Risk Control</h1>
          <p className="text-gray-400 text-sm mt-0.5">Monitor disputes, fraud flags, and suspicious activity.</p>
        </div>

        {/* ── Disputed transactions ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={15} className="text-red-500" />
            <h2 className="font-bold text-gray-900 text-sm">Open Disputes ({totalDisputed ?? 0})</h2>
          </div>
          {(disputes ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <Shield size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No open disputes</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {(disputes ?? []).map((tx: any) => {
                const buyer = tx.profiles as any
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <User size={12} className="text-gray-400 flex-shrink-0" />
                        <p className="text-gray-900 text-sm font-semibold truncate">
                          {buyer?.full_name ?? '—'} vs {(tx.sellers as any)?.profiles?.full_name ?? '—'}
                        </p>
                        {buyer?.fraud_flag && <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">FLAGGED</span>}
                        {buyer?.is_banned && <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded-full">BANNED</span>}
                      </div>
                      <p className="text-gray-400 text-xs">{tx.hoxa_transaction_id ?? tx.id.slice(0, 8)} · {(tx.send_amount ?? tx.from_amount)?.toLocaleString()} {tx.send_currency ?? tx.from_currency}</p>
                      {tx.dispute_reason && <p className="text-red-500 text-xs mt-0.5">Reason: {tx.dispute_reason}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {buyer?.id && <FraudFlagButton userId={buyer.id} flagged={!!buyer.fraud_flag} />}
                      {buyer?.id && <BanButton userId={buyer.id} banned={!!buyer.is_banned} />}
                      <Link href={`/admin/transactions/${tx.id}`}
                        className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors">
                        Resolve
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Fraud-flagged users ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flag size={15} className="text-red-500" />
            <h2 className="font-bold text-gray-900 text-sm">Fraud-Flagged Users ({(flaggedUsers ?? []).length})</h2>
          </div>
          {(flaggedUsers ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No users currently flagged</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
              {(flaggedUsers ?? []).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 text-sm font-semibold">{u.full_name}</p>
                      {u.is_banned && <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded-full">BANNED</span>}
                    </div>
                    <p className="text-gray-400 text-xs">{u.phone} · {u.country} · {u.unconfirmed_claim_count ?? 0} unconfirmed claims</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <FraudFlagButton userId={u.id} flagged={true} />
                    <BanButton userId={u.id} banned={!!u.is_banned} />
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── High unconfirmed claim count ── */}
        {(highClaims ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-500" />
              <h2 className="font-bold text-gray-900 text-sm">High Unconfirmed Claims</h2>
              <span className="text-xs text-gray-400">— buyers who disputed many times without confirming receipt</span>
            </div>
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden divide-y divide-gray-50">
              {(highClaims ?? []).map((u: any) => (
                <div key={u.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-gray-900 text-sm font-semibold">{u.full_name}</p>
                    <p className="text-gray-400 text-xs">{u.phone} · {u.country}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-amber-600">{u.unconfirmed_claim_count} claims</span>
                    <FraudFlagButton userId={u.id} flagged={!!u.fraud_flag} />
                    <BanButton userId={u.id} banned={!!u.is_banned} />
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Seller timeouts ── */}
        {(timedOut ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeftRight size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Recent Seller Timeouts</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
              {(timedOut ?? []).map((tx: any) => {
                const sellerProfile = (tx.sellers as any)?.profiles as any
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                    <div>
                      <p className="text-gray-900 text-sm font-medium">{sellerProfile?.full_name ?? '—'}</p>
                      <p className="text-gray-400 text-xs">{(tx.send_amount ?? tx.from_amount)?.toLocaleString()} {tx.send_currency ?? tx.from_currency} · {new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {sellerProfile?.id && <BanButton userId={sellerProfile.id} banned={!!sellerProfile.is_banned} />}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Timed Out</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
