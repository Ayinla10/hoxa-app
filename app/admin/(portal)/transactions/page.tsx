import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import AdminTransactionRow from './AdminTransactionRow'
import StatusBadge from '@/components/seller/StatusBadge'

interface Props {
  searchParams: Promise<{ filter?: string }>
}

export default async function AdminTransactionsPage({ searchParams }: Props) {
  const { filter } = await searchParams
  const supabase = createServiceClient()

  let query = supabase
    .from('transactions')
    .select('*, profiles!buyer_id(full_name), sellers(profiles!user_id(full_name))')
    .order('created_at', { ascending: false })

  if (filter) query = query.eq('status', filter)

  const { data: transactions } = await query

  function mapStatus(status: string): any {
    if (status === 'completed') return 'completed'
    if (['seller_rejected', 'seller_timeout', 'cancelled'].includes(status)) return 'rejected'
    if (status === 'disputed') return 'disputed'
    return 'pending'
  }

  const filters = [
    { label: 'All', value: '' },
    { label: 'Pending Escrow', value: 'payment_submitted' },
    { label: 'Active', value: 'seller_accepted' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disputed', value: 'disputed' },
  ]

  return (
    <>
      <AdminTopbar title="Transactions" />
      <div className="px-4 lg:px-8 py-5 space-y-5 w-full">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">All Transactions</h2>
          <p className="text-gray-400 text-sm">{transactions?.length ?? 0} total</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <a
              key={f.value}
              href={f.value ? `/admin/transactions?filter=${f.value}` : '/admin/transactions'}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                filter === f.value || (!filter && !f.value)
                  ? 'bg-[#177945] text-white border-[#177945]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
              }`}
            >
              {f.label}
            </a>
          ))}
        </div>

        {/* Escrow verification queue */}
        {filter === 'payment_submitted' && (
          <div className="space-y-3">
            {(transactions ?? []).map((tx: any) => (
              <AdminTransactionRow key={tx.id} transaction={tx} />
            ))}
          </div>
        )}

        {/* Regular table */}
        {filter !== 'payment_submitted' && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['ID', 'Buyer', 'Seller', 'Exchange', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(transactions ?? []).map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-400 text-xs">{tx.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{tx.profiles?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{tx.sellers?.profiles?.full_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{tx.from_amount?.toLocaleString()} {tx.from_currency}</p>
                        <p className="text-gray-400 text-xs">→ {tx.to_amount?.toFixed(2)} {tx.to_currency}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={mapStatus(tx.status)} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lg:hidden divide-y divide-gray-100">
              {(transactions ?? []).map((tx: any) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_currency}</p>
                    <p className="text-gray-400 text-xs">{tx.profiles?.full_name} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={mapStatus(tx.status)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
