import AdminTopbar from '@/components/admin/AdminTopbar'
import { createServiceClient } from '@/lib/supabase/server'
import { Shield, AlertTriangle, User, ArrowLeftRight } from 'lucide-react'

export default async function RiskPage() {
  const supabase = createServiceClient()

  const [
    { data: disputes },
    { data: timedOut },
    { count: totalDisputed },
  ] = await Promise.all([
    supabase.from('transactions')
      .select('id, hoxa_transaction_id, send_amount, from_amount, send_currency, from_currency, receive_currency, to_currency, dispute_reason, created_at, profiles!buyer_id(full_name, country), sellers(profiles(full_name))')
      .eq('status', 'disputed')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('transactions')
      .select('id, hoxa_transaction_id, send_amount, from_amount, send_currency, from_currency, created_at, profiles!buyer_id(full_name), sellers(profiles(full_name))')
      .eq('status', 'seller_timeout')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
  ])

  return (
    <>
      <AdminTopbar title="Risk Control" notifCount={totalDisputed ?? 0} />
      <div className="px-4 lg:px-8 py-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Risk Control</h1>
          <p className="text-gray-400 text-sm mt-0.5">Monitor disputes, timeouts and suspicious activity.</p>
        </div>

        {/* Disputed transactions */}
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
              {(disputes ?? []).map((tx: any) => (
                <a key={tx.id} href={`/admin/transactions/${tx.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-red-50/40 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <User size={12} className="text-gray-400 flex-shrink-0" />
                      <p className="text-gray-900 text-sm font-semibold truncate">
                        {(tx.profiles as any)?.full_name ?? '—'} vs {(tx.sellers as any)?.profiles?.full_name ?? '—'}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs">{tx.hoxa_transaction_id ?? tx.id.slice(0, 8)} · {(tx.send_amount ?? tx.from_amount)?.toLocaleString()} {tx.send_currency ?? tx.from_currency} → {tx.receive_currency ?? tx.to_currency}</p>
                    {tx.dispute_reason && <p className="text-red-500 text-xs mt-0.5 font-medium">Reason: {tx.dispute_reason}</p>}
                  </div>
                  <span className="ml-4 flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border bg-red-50 text-red-700 border-red-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Disputed
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Seller timeouts */}
        {(timedOut ?? []).length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <ArrowLeftRight size={14} className="text-gray-400" />
              <h2 className="font-bold text-gray-900 text-sm">Recent Seller Timeouts</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
              {(timedOut ?? []).map((tx: any) => (
                <a key={tx.id} href={`/admin/transactions/${tx.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-gray-900 text-sm font-medium">{(tx.sellers as any)?.profiles?.full_name ?? '—'}</p>
                    <p className="text-gray-400 text-xs">{(tx.send_amount ?? tx.from_amount)?.toLocaleString()} {tx.send_currency ?? tx.from_currency} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Timed Out</span>
                </a>
              ))}
            </div>
          </section>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
          <Shield size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">Advanced risk controls coming soon</p>
          <p className="text-gray-400 text-xs mt-1">Fraud scoring, account flagging, and automated limits are in development.</p>
        </div>
      </div>
    </>
  )
}
