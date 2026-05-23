import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'

export default async function AdminDisputesPage() {
  const supabase = createServiceClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, send_amount, send_currency, receive_amount, receive_currency, from_amount, from_currency, to_amount, to_currency, exchange_rate, rate, status, created_at, hoxa_transaction_id, dispute_reason, profiles!buyer_id(full_name, phone, country), sellers(profiles(full_name, country))')
    .eq('status', 'disputed')
    .order('created_at', { ascending: true })

  return (
    <>
      <AdminTopbar title="Disputes" notifCount={transactions?.length ?? 0} />
      <div className="px-4 lg:px-8 py-5 space-y-5 w-full">

        <div>
          <h2 className="font-bold text-gray-900 text-lg">Disputes</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Buyers who raised a dispute — funds are held until you resolve each case.
          </p>
        </div>

        {(transactions?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm font-medium">
              <span className="font-bold">{transactions!.length}</span> active dispute{transactions!.length !== 1 ? 's' : ''} — funds are frozen pending resolution
            </p>
          </div>
        )}

        {(transactions ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <ShieldCheck size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No active disputes</p>
            <p className="text-gray-300 text-xs mt-1">All clear — no funds currently frozen.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Ref', 'Buyer', 'Seller', 'Exchange', 'Dispute Reason', 'Raised', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(transactions ?? []).map((tx: any) => {
                    const sendAmt = tx.send_amount ?? tx.from_amount
                    const sendCur = tx.send_currency ?? tx.from_currency
                    const recvAmt = tx.receive_amount ?? tx.to_amount
                    const recvCur = tx.receive_currency ?? tx.to_currency
                    const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                    return (
                      <tr key={tx.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{ref}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{(tx.profiles as any)?.full_name ?? '—'}</p>
                          <p className="text-gray-400 text-xs">{(tx.profiles as any)?.country ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-gray-600">{(tx.sellers as any)?.profiles?.full_name ?? '—'}</p>
                          <p className="text-gray-400 text-xs">{(tx.sellers as any)?.profiles?.country ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{sendAmt?.toLocaleString()} {sendCur}</p>
                          <p className="text-gray-400 text-xs">→ {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}</p>
                        </td>
                        <td className="px-4 py-3">
                          {tx.dispute_reason ? (
                            <span className="inline-block max-w-xs text-xs text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-lg truncate">
                              {tx.dispute_reason}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">No reason given</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/transactions/${tx.id}`}
                            className="flex items-center gap-1 text-red-600 hover:underline text-xs font-semibold whitespace-nowrap">
                            Resolve <ArrowRight size={11} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {(transactions ?? []).map((tx: any) => {
                const sendAmt = tx.send_amount ?? tx.from_amount
                const sendCur = tx.send_currency ?? tx.from_currency
                const recvAmt = tx.receive_amount ?? tx.to_amount
                const recvCur = tx.receive_currency ?? tx.to_currency
                const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                return (
                  <Link key={tx.id} href={`/admin/transactions/${tx.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-red-50/20 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {sendAmt?.toLocaleString()} {sendCur} → {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">
                        {ref} · {(tx.profiles as any)?.full_name ?? '—'}
                      </p>
                      {tx.dispute_reason && (
                        <p className="text-red-600 text-xs mt-1 truncate">{tx.dispute_reason}</p>
                      )}
                    </div>
                    <ArrowRight size={13} className="text-gray-300 flex-shrink-0 ml-3" />
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
