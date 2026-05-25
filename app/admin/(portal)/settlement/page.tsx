import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import Link from 'next/link'
import { Banknote, ArrowRight, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import SettlementReleaseButton from './SettlementReleaseButton'
import { requireAdminPermission } from '@/lib/admin-guard'

export default async function SettlementQueuePage() {
  await requireAdminPermission('settlement')
  const service = createServiceClient()

  const { data: transactions } = await service
    .from('transactions')
    .select(`
      id, hoxa_transaction_id, status,
      send_amount, send_currency, receive_amount, receive_currency,
      seller_settlement_amount, created_at, receipt_confirmed_at,
      profiles!buyer_id(full_name),
      sellers(profiles(full_name), settlement_accounts)
    `)
    .eq('status', 'pending_settlement')
    .order('receipt_confirmed_at', { ascending: true }) // oldest first — most urgent

  const txs = transactions ?? []

  function minutesSince(dateStr?: string | null) {
    if (!dateStr) return null
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  }

  return (
    <>
      <AdminTopbar title="Settlement Queue" />
      <div className="px-4 lg:px-8 py-5 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settlement Queue</h1>
            <p className="text-gray-400 text-sm mt-0.5">Buyer confirmed receipt — release funds to seller</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl">
            <Banknote size={16} className="text-green-600" />
            <span className="text-green-800 font-bold text-sm">{txs.length}</span>
            <span className="text-green-600 text-sm">pending</span>
          </div>
        </div>

        {txs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
            <CheckCircle2 size={40} className="text-green-300 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-base">All clear</p>
            <p className="text-gray-400 text-sm mt-1">No settlements pending. All confirmed receipts have been released.</p>
          </div>
        ) : (
          <>
            {/* Alert if any have been waiting a long time */}
            {txs.some(tx => (minutesSince(tx.receipt_confirmed_at) ?? 0) > 60) && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                <p className="text-amber-700 text-sm font-medium">
                  Some settlements have been waiting over an hour. Sellers are expecting payment.
                </p>
              </div>
            )}

            {/* Desktop table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {['Ref', 'Buyer', 'Seller', 'Exchange', 'Settlement Amount', 'Payout Account', 'Waiting', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {txs.map(tx => {
                      const mins = minutesSince(tx.receipt_confirmed_at)
                      const urgent = (mins ?? 0) > 60
                      const sellerProfile = (tx.sellers as any)?.profiles
                      return (
                        <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${urgent ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-4 py-3">
                            <Link href={`/admin/transactions/${tx.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                              {tx.hoxa_transaction_id ?? tx.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{(tx.profiles as any)?.full_name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{sellerProfile?.full_name ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {tx.send_amount?.toLocaleString()} {tx.send_currency} → {tx.receive_amount?.toFixed(2)} {tx.receive_currency}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-green-700 text-sm">{tx.seller_settlement_amount?.toLocaleString()} {tx.send_currency}</p>
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const primaryAccount = ((tx.sellers as any)?.settlement_accounts as any)?.accounts?.find((a: any) => a.is_primary) ??
                                ((tx.sellers as any)?.settlement_accounts as any)?.accounts?.[0]
                              return primaryAccount ? (
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">{primaryAccount.account_name}</p>
                                  <p className="text-xs text-gray-500">{primaryAccount.provider}</p>
                                  <p className="text-xs font-mono text-gray-700">{primaryAccount.account_number}</p>
                                  <p className="text-[10px] text-gray-400">{primaryAccount.currency}</p>
                                </div>
                              ) : (
                                <span className="text-xs text-amber-500 font-medium">⚠ No account set</span>
                              )
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className={`flex items-center gap-1 text-xs font-medium ${urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                              <Clock size={11} />
                              {mins !== null ? `${mins}m` : '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <SettlementReleaseButton transactionId={tx.id} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-gray-100">
                {txs.map(tx => {
                  const mins = minutesSince(tx.receipt_confirmed_at)
                  const urgent = (mins ?? 0) > 60
                  const sellerProfile = (tx.sellers as any)?.profiles
                  return (
                    <div key={tx.id} className={`p-4 space-y-3 ${urgent ? 'bg-amber-50/40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <Link href={`/admin/transactions/${tx.id}`} className="font-mono text-xs text-blue-600">{tx.hoxa_transaction_id ?? tx.id.slice(0, 8)}</Link>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {(tx.profiles as any)?.full_name ?? 'Buyer'} → {sellerProfile?.full_name ?? 'Seller'}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${urgent ? 'text-amber-600' : 'text-gray-400'}`}>
                          <Clock size={11} /> {mins !== null ? `${mins}m` : '—'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Settlement</p>
                          <p className="font-bold text-green-700">{tx.seller_settlement_amount?.toLocaleString()} {tx.send_currency}</p>
                        </div>
                        <SettlementReleaseButton transactionId={tx.id} />
                      </div>
                      {(() => {
                        const acc = ((tx.sellers as any)?.settlement_accounts as any)?.accounts?.find((a: any) => a.is_primary) ??
                          ((tx.sellers as any)?.settlement_accounts as any)?.accounts?.[0]
                        return acc ? (
                          <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs space-y-0.5">
                            <p className="font-semibold text-gray-700">Send to: {acc.account_name}</p>
                            <p className="text-gray-500">{acc.provider} · <span className="font-mono">{acc.account_number}</span> · {acc.currency}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-500 font-medium">⚠ Seller has not set a payout account</p>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
