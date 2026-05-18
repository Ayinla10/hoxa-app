import { getBuyerTransactions } from '@/actions/transactions'
import Link from 'next/link'
import { ArrowRight, ArrowLeftRight } from 'lucide-react'
import StatusBadge from '@/components/seller/StatusBadge'

function mapStatus(status: string): any {
  if (status === 'completed') return 'completed'
  if (['seller_rejected', 'seller_timeout', 'cancelled'].includes(status)) return 'rejected'
  if (status === 'disputed') return 'disputed'
  return 'pending'
}

export default async function TransactionsPage() {
  const transactions = await getBuyerTransactions()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-gray-500 text-sm mt-0.5">{transactions.length} total exchanges</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <ArrowLeftRight size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No transactions yet</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">Start your first exchange in the marketplace</p>
          <Link href="/dashboard/marketplace" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90">
            Go to Marketplace
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['ID', 'Exchange', 'Seller', 'Rate', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-gray-400 text-xs">{tx.id.slice(0, 8)}…</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{tx.from_amount.toLocaleString()} {tx.from_currency}</p>
                      <p className="text-gray-400 text-xs">→ {tx.to_amount.toFixed(2)} {tx.to_currency}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{tx.sellers?.profiles?.full_name ?? '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{tx.rate}</td>
                    <td className="px-5 py-4"><StatusBadge status={mapStatus(tx.status)} /></td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-4">
                      <Link href={`/dashboard/transactions/${tx.id}`} className="text-[#177945] hover:underline text-xs font-medium flex items-center gap-1">
                        View <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="lg:hidden divide-y divide-gray-100">
            {transactions.map((tx: any) => (
              <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`} className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{tx.from_amount.toLocaleString()} {tx.from_currency} → {tx.to_amount.toFixed(2)} {tx.to_currency}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{tx.sellers?.profiles?.full_name ?? '—'} · {new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={mapStatus(tx.status)} />
                  <ArrowRight size={14} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
