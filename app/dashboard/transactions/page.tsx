import { getBuyerTransactions } from '@/actions/transactions'
import Link from 'next/link'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

// V5.1 status display config
const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending_acceptance:           { label: 'Matching',        cls: 'bg-amber-50 text-amber-700' },
  awaiting_payment:             { label: 'Pay Now',         cls: 'bg-amber-50 text-amber-700' },
  pending_ops_confirmation:     { label: 'Verifying',       cls: 'bg-blue-50 text-blue-700' },
  fulfillment_in_progress:      { label: 'Sending',         cls: 'bg-teal-50 text-teal-700' },
  pending_receipt_confirmation: { label: 'Confirm Receipt', cls: 'bg-green-50 text-green-700 animate-pulse' },
  pending_settlement:           { label: 'Settling',        cls: 'bg-green-50 text-green-700' },
  fully_completed:              { label: 'Completed',       cls: 'bg-green-100 text-green-800' },
  disputed:                     { label: 'Disputed',        cls: 'bg-purple-50 text-purple-700' },
  seller_rejected:              { label: 'Rejected',        cls: 'bg-red-50 text-red-600' },
  seller_timeout:               { label: 'Timed Out',       cls: 'bg-red-50 text-red-600' },
  cancelled:                    { label: 'Cancelled',       cls: 'bg-red-50 text-red-600' },
  expired:                      { label: 'Expired',         cls: 'bg-gray-100 text-gray-500' },
}

function TxStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${config.cls}`}>
      {config.label}
    </span>
  )
}

export default async function TransactionsPage() {
  const transactions = await getBuyerTransactions()

  return (
    <div className="space-y-5 min-w-0 w-full overflow-hidden">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-gray-500 text-sm mt-0.5">{transactions.length} total exchanges</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <ArrowLeftRight size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No transactions yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Start your first exchange on the dashboard</p>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90">
            Start an Exchange
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Reference', 'Exchange', 'Exchanger', 'Rate', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx: any) => {
                  const sendAmt = tx.send_amount ?? tx.from_amount
                  const sendCur = tx.send_currency ?? tx.from_currency
                  const recvAmt = tx.receive_amount ?? tx.to_amount
                  const recvCur = tx.receive_currency ?? tx.to_currency
                  const rate = tx.exchange_rate ?? tx.rate
                  const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-gray-500 text-xs">{ref}</td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 font-semibold text-gray-900"><CurrencyFlag code={sendCur} size={14}/> {sendAmt?.toLocaleString()} {sendCur}</p>
                        <p className="flex items-center gap-1 text-gray-400 text-xs">→ <CurrencyFlag code={recvCur} size={12}/> {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}</p>
                      </td>
                      <td className="px-5 py-4 text-gray-700">{tx.sellers?.profiles?.full_name ?? '—'}</td>
                      <td className="px-5 py-4 text-gray-600">{rate}</td>
                      <td className="px-5 py-4"><TxStatusBadge status={tx.status} /></td>
                      <td className="px-5 py-4 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/transactions/${tx.id}`} className="text-[#177945] hover:underline text-xs font-medium flex items-center gap-1">
                          View <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden divide-y divide-gray-100">
            {transactions.map((tx: any) => {
              const sendAmt = tx.send_amount ?? tx.from_amount
              const sendCur = tx.send_currency ?? tx.from_currency
              const recvAmt = tx.receive_amount ?? tx.to_amount
              const recvCur = tx.receive_currency ?? tx.to_currency
              const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)

              return (
                <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`} className="flex items-center gap-3 px-3 sm:px-4 py-3.5 sm:py-4 hover:bg-gray-50 transition-colors overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm truncate flex items-center gap-1">
                      <CurrencyFlag code={sendCur} size={14}/> {sendAmt?.toLocaleString()} {sendCur} → <CurrencyFlag code={recvCur} size={14}/> {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      {ref} · {tx.sellers?.profiles?.full_name ?? '—'} · {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <TxStatusBadge status={tx.status} />
                    <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
