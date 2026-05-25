import { createServiceClient } from '@/lib/supabase/server'
import { sweepExpiredPaymentWindows } from '@/actions/exchange'
import AdminTopbar from '@/components/admin/AdminTopbar'
import { requireAdminPermission } from '@/lib/admin-guard'
import Link from 'next/link'
import { CreditCard, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'

export default async function AdminPaymentReviewPage() {
  await requireAdminPermission('payment_review')
  // Non-blocking sweep: move expired payment windows back to awaiting_payment
  void sweepExpiredPaymentWindows()

  const supabase = createServiceClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('id, send_amount, send_currency, receive_amount, receive_currency, from_amount, from_currency, to_amount, to_currency, exchange_rate, rate, status, created_at, hoxa_transaction_id, payment_window_expires_at, buyer_send_account, profiles!buyer_id(full_name, phone), sellers(profiles(full_name))')
    .eq('status', 'pending_ops_confirmation')
    .order('created_at', { ascending: true }) // oldest first — most urgent

  const now = Date.now()

  return (
    <>
      <AdminTopbar title="Payment Review" notifCount={transactions?.length ?? 0} />
      <div className="px-4 lg:px-8 py-5 space-y-5 w-full">

        <div>
          <h2 className="font-bold text-gray-900 text-lg">Payment Review</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            Buyers who tapped "I've Paid" — verify each payment before releasing funds to the seller.
          </p>
        </div>

        {/* Alert banner */}
        {(transactions?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-2xl">
            <CreditCard size={16} className="text-blue-600 flex-shrink-0" />
            <p className="text-blue-800 text-sm font-medium">
              <span className="font-bold">{transactions!.length}</span> payment{transactions!.length !== 1 ? 's' : ''} waiting for ops confirmation
            </p>
          </div>
        )}

        {(transactions ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <CheckCircle2 size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No payments pending review</p>
            <p className="text-gray-300 text-xs mt-1">You're all caught up.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Ref', 'Buyer', 'Sender Account', 'Seller', 'Exchange', 'Rate', 'Window', 'Submitted', ''].map(h => (
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
                    const txRate = tx.exchange_rate ?? tx.rate
                    const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                    const expires = tx.payment_window_expires_at ? new Date(tx.payment_window_expires_at) : null
                    const minsLeft = expires ? Math.max(0, Math.round((expires.getTime() - now) / 60000)) : null
                    const urgent = minsLeft !== null && minsLeft < 10

                    return (
                      <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${urgent ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{ref}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{(tx.profiles as any)?.full_name ?? '—'}</p>
                          <p className="text-gray-400 text-xs">{(tx.profiles as any)?.phone ?? ''}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-sm text-gray-800">{tx.buyer_send_account ?? '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{(tx.sellers as any)?.profiles?.full_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{sendAmt?.toLocaleString()} {sendCur}</p>
                          <p className="text-gray-400 text-xs">→ {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{txRate}</td>
                        <td className="px-4 py-3">
                          {minsLeft !== null ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${
                              minsLeft < 5  ? 'bg-red-50 text-red-700 border-red-200' :
                              minsLeft < 10 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-gray-50 text-gray-500 border-gray-200'
                            }`}>
                              <Clock size={10} />
                              {minsLeft > 0 ? `${minsLeft}m left` : 'Expired'}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/transactions/${tx.id}`}
                            className="flex items-center gap-1 text-[#177945] hover:underline text-xs font-semibold whitespace-nowrap">
                            Review <ArrowRight size={11} />
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
                const expires = tx.payment_window_expires_at ? new Date(tx.payment_window_expires_at) : null
                const minsLeft = expires ? Math.max(0, Math.round((expires.getTime() - now) / 60000)) : null

                return (
                  <Link key={tx.id} href={`/admin/transactions/${tx.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {sendAmt?.toLocaleString()} {sendCur} → {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">
                        {ref} · {(tx.profiles as any)?.full_name ?? '—'}
                      </p>
                      {tx.buyer_send_account && (
                        <p className="font-mono text-xs text-gray-600 mt-0.5 truncate">{tx.buyer_send_account}</p>
                      )}
                      {minsLeft !== null && (
                        <p className={`text-xs mt-1 font-medium ${minsLeft < 10 ? 'text-red-600' : 'text-gray-400'}`}>
                          {minsLeft > 0 ? `Window: ${minsLeft}m left` : 'Window expired'}
                        </p>
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
