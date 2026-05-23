import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import Link from 'next/link'
import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

const STATUS_MAP: Record<string, { label: string; pill: string; dot: string }> = {
  pending_acceptance:           { label: 'Awaiting Seller',    pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  awaiting_payment:             { label: 'Awaiting Payment',   pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  pending_ops_confirmation:     { label: 'Needs Review',       pill: 'bg-blue-100 text-blue-800 border-blue-300',     dot: 'bg-blue-600 animate-pulse' },
  fulfillment_in_progress:      { label: 'Sending Funds',      pill: 'bg-teal-50 text-teal-700 border-teal-200',      dot: 'bg-teal-500' },
  pending_receipt_confirmation: { label: 'Awaiting Receipt',   pill: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-400' },
  pending_settlement:           { label: 'Release Funds',      pill: 'bg-green-100 text-green-800 border-green-300',  dot: 'bg-green-600 animate-pulse' },
  fully_completed:              { label: 'Completed',          pill: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  disputed:                     { label: 'Disputed',           pill: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500 animate-pulse' },
  seller_rejected:              { label: 'Rejected',           pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400' },
  seller_timeout:               { label: 'Timed Out',          pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400' },
  cancelled:                    { label: 'Cancelled',          pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400' },
  expired:                      { label: 'Expired',            pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400' },
}

const FILTERS = [
  { label: 'All',             value: '' },
  { label: 'Needs Review',    value: 'pending_ops_confirmation' },
  { label: 'Release Funds',   value: 'pending_settlement' },
  { label: 'Disputed',        value: 'disputed' },
  { label: 'Active',          value: 'active' },
  { label: 'Completed',       value: 'fully_completed' },
  { label: 'Rejected',        value: 'rejected' },
]

const ACTIVE_STATUSES = ['pending_acceptance', 'awaiting_payment', 'pending_ops_confirmation', 'fulfillment_in_progress', 'pending_receipt_confirmation', 'pending_settlement']
const REJECTED_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']

export default async function AdminTransactionsPage({ searchParams }: Props) {
  const { filter } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('transactions')
    .select('id, send_amount, send_currency, receive_amount, receive_currency, from_amount, from_currency, to_amount, to_currency, exchange_rate, rate, status, created_at, hoxa_transaction_id, ive_paid_tapped_at, profiles!buyer_id(full_name), sellers(profiles(full_name))')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filter === 'active') {
    query = query.in('status', ACTIVE_STATUSES)
  } else if (filter === 'rejected') {
    query = query.in('status', REJECTED_STATUSES)
  } else if (filter && filter !== '') {
    query = query.eq('status', filter)
  }

  const { data: transactions } = await query

  // Count badges for filter tabs
  const { data: counts } = await supabase
    .from('transactions')
    .select('status')

  function countFor(f: string) {
    if (!counts) return 0
    if (f === '') return counts.length
    if (f === 'active') return counts.filter(t => ACTIVE_STATUSES.includes(t.status)).length
    if (f === 'rejected') return counts.filter(t => REJECTED_STATUSES.includes(t.status)).length
    return counts.filter(t => t.status === f).length
  }

  return (
    <>
      <AdminTopbar title="Transactions" />
      <div className="px-4 lg:px-8 py-5 space-y-5 w-full">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">All Transactions</h2>
          <p className="text-gray-400 text-sm">{transactions?.length ?? 0} shown</p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => {
            const count = countFor(f.value)
            const isActive = filter === f.value || (!filter && !f.value)
            const isUrgent = (f.value === 'pending_ops_confirmation' || f.value === 'pending_settlement' || f.value === 'disputed') && count > 0
            return (
              <a
                key={f.value}
                href={f.value ? `/admin/transactions?filter=${f.value}` : '/admin/transactions'}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  isActive
                    ? 'bg-[#177945] text-white border-[#177945]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' :
                    isUrgent ? 'bg-amber-500 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                )}
              </a>
            )
          })}
        </div>

        {/* Transaction list */}
        {(transactions ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <ArrowLeftRight size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No transactions found</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Ref', 'Buyer', 'Seller', 'Exchange', 'Rate', 'Status', 'Date', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(transactions ?? []).map((tx: any) => {
                    const s = STATUS_MAP[tx.status] ?? { label: tx.status, pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
                    const sendAmt = tx.send_amount ?? tx.from_amount
                    const sendCur = tx.send_currency ?? tx.from_currency
                    const recvAmt = tx.receive_amount ?? tx.to_amount
                    const recvCur = tx.receive_currency ?? tx.to_currency
                    const txRate = tx.exchange_rate ?? tx.rate
                    const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-400 text-xs">{ref}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{(tx.profiles as any)?.full_name ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{(tx.sellers as any)?.profiles?.full_name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <p className="flex items-center gap-1.5 font-semibold text-gray-900"><CurrencyFlag code={sendCur} size={14}/> {sendAmt?.toLocaleString()} {sendCur}</p>
                          <p className="flex items-center gap-1 text-gray-400 text-xs">→ <CurrencyFlag code={recvCur} size={12}/> {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{txRate}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.pill} whitespace-nowrap`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/transactions/${tx.id}`}
                            className="flex items-center gap-1 text-[#177945] hover:underline text-xs font-medium">
                            View <ArrowRight size={11} />
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
                const s = STATUS_MAP[tx.status] ?? { label: tx.status, pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
                const sendAmt = tx.send_amount ?? tx.from_amount
                const sendCur = tx.send_currency ?? tx.from_currency
                const recvAmt = tx.receive_amount ?? tx.to_amount
                const recvCur = tx.receive_currency ?? tx.to_currency
                const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                return (
                  <Link key={tx.id} href={`/admin/transactions/${tx.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm truncate flex items-center gap-1">
                        <CurrencyFlag code={sendCur} size={14}/> {sendAmt?.toLocaleString()} {sendCur} → <CurrencyFlag code={recvCur} size={14}/> {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5 truncate">
                        {ref} · {(tx.profiles as any)?.full_name ?? '—'} · {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border ${s.pill}`}>
                        <span className={`w-1 h-1 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                      <ArrowRight size={13} className="text-gray-300" />
                    </div>
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
