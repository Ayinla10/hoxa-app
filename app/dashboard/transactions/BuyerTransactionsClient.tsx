'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowLeftRight, Filter } from 'lucide-react'
import CurrencyFlag from '@/components/ui/CurrencyFlag'
import BackButton from '@/components/ui/BackButton'

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

const FILTER_TABS = [
  { key: 'all',       label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'failed',    label: 'Failed' },
]

const ACTIVE_STATUSES   = new Set(['pending_acceptance','awaiting_payment','pending_ops_confirmation','fulfillment_in_progress','pending_receipt_confirmation','pending_settlement'])
const COMPLETE_STATUSES = new Set(['fully_completed'])
const FAILED_STATUSES   = new Set(['seller_rejected','seller_timeout','cancelled','expired','disputed'])

function TxStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${config.cls}`}>
      {config.label}
    </span>
  )
}

const COUNTRY_CC: Record<string, string> = {
  Ghana: 'gh', Nigeria: 'ng', Senegal: 'sn', Mali: 'ml',
  'Burkina Faso': 'bf', Togo: 'tg', Benin: 'bj', Niger: 'ne',
  'Guinea-Bissau': 'gw', Cameroon: 'cm', Chad: 'td', Gabon: 'ga',
  'Republic of Congo': 'cg', Kenya: 'ke', Uganda: 'ug', Tanzania: 'tz',
  'South Africa': 'za', 'United Kingdom': 'gb', France: 'fr',
  'United States': 'us', Canada: 'ca',
}

function SmallFlag({ country }: { country?: string }) {
  if (!country) return null
  const cc = COUNTRY_CC[country]
  if (!cc) return null
  return <img src={`https://flagcdn.com/w20/${cc}.png`} width={12} height={9} alt={country} className="rounded-sm object-cover flex-shrink-0 inline-block" />
}

export default function BuyerTransactionsClient({ transactions }: { transactions: any[] }) {
  const [filter, setFilter] = useState('all')

  const filtered = transactions.filter(tx => {
    if (filter === 'active')    return ACTIVE_STATUSES.has(tx.status)
    if (filter === 'completed') return COMPLETE_STATUSES.has(tx.status)
    if (filter === 'failed')    return FAILED_STATUSES.has(tx.status)
    return true
  })

  return (
    <div className="space-y-5 min-w-0 w-full overflow-hidden">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-xl font-bold text-gray-900">My Transactions</h1>
        <p className="text-gray-500 text-sm mt-0.5">{transactions.length} total exchanges</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={14} className="text-gray-400 flex-shrink-0" />
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
              ${filter === tab.key
                ? 'bg-[#177945] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-[#177945]/30 hover:text-[#177945]'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <ArrowLeftRight size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No transactions found</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            {filter === 'all' ? 'Start your first exchange on the dashboard' : 'Try a different filter'}
          </p>
          {filter === 'all' && (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90">
              Start an Exchange
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Reference', 'Exchange', 'Route', 'Exchanger', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((tx: any) => {
                  const sendAmt = tx.send_amount ?? tx.from_amount
                  const sendCur = tx.send_currency ?? tx.from_currency
                  const recvAmt = tx.receive_amount ?? tx.to_amount
                  const recvCur = tx.receive_currency ?? tx.to_currency
                  const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
                  const sendCountry = tx.corridors?.send_country ?? tx.buyer_send_country
                  const recvCountry = tx.corridors?.receive_country ?? tx.buyer_destination_country

                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-gray-500 text-xs">{ref}</td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                          <CurrencyFlag code={sendCur} size={14} /> {sendAmt?.toLocaleString()} {sendCur}
                        </p>
                        <p className="flex items-center gap-1 text-gray-400 text-xs">
                          <span>to</span>
                          <CurrencyFlag code={recvCur} size={12} />
                          {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        {(sendCountry || recvCountry) ? (
                          <p className="flex items-center gap-1 text-xs text-gray-500">
                            {sendCountry && <><SmallFlag country={sendCountry} /><span>{sendCountry}</span></>}
                            {sendCountry && recvCountry && <span className="mx-0.5 text-gray-300">to</span>}
                            {recvCountry && <><SmallFlag country={recvCountry} /><span>{recvCountry}</span></>}
                          </p>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-gray-700">{tx.sellers?.profiles?.full_name ?? '—'}</td>
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
            {filtered.map((tx: any) => {
              const sendAmt = tx.send_amount ?? tx.from_amount
              const sendCur = tx.send_currency ?? tx.from_currency
              const recvAmt = tx.receive_amount ?? tx.to_amount
              const recvCur = tx.receive_currency ?? tx.to_currency
              const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
              const sendCountry = tx.corridors?.send_country ?? tx.buyer_send_country
              const recvCountry = tx.corridors?.receive_country ?? tx.buyer_destination_country

              return (
                <Link key={tx.id} href={`/dashboard/transactions/${tx.id}`}
                  className="flex items-center gap-3 px-3 sm:px-4 py-3.5 hover:bg-gray-50 transition-colors overflow-hidden">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold text-sm flex items-center gap-1 flex-wrap">
                      <CurrencyFlag code={sendCur} size={14} /> {sendAmt?.toLocaleString()} {sendCur}
                      <span className="text-gray-300">to</span>
                      <CurrencyFlag code={recvCur} size={14} />
                      {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
                    </p>
                    {(sendCountry || recvCountry) && (
                      <p className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                        {sendCountry && <><SmallFlag country={sendCountry} /><span>{sendCountry}</span></>}
                        {sendCountry && recvCountry && <span>to</span>}
                        {recvCountry && <><SmallFlag country={recvCountry} /><span>{recvCountry}</span></>}
                      </p>
                    )}
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
