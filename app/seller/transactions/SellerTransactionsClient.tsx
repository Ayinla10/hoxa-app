'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sellerMarkFulfilled } from '@/actions/exchange'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight, CheckCircle2, Clock, XCircle,
  AlertTriangle, Loader2, Filter, SendHorizonal,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import type { TKey } from '@/lib/i18n'

const STATUS_KEYS: Record<string, { label: string; pill: string; dot: string }> = {
  // V5.1 flow (only)
  pending_acceptance:          { label: 'Pending',           pill: 'bg-amber-50 text-amber-700 border-amber-200',          dot: 'bg-amber-500' },
  awaiting_payment:            { label: 'Awaiting Payment',  pill: 'bg-amber-50 text-amber-700 border-amber-200',          dot: 'bg-amber-400' },
  pending_ops_confirmation:    { label: 'Verifying Payment', pill: 'bg-blue-50 text-blue-700 border-blue-200',             dot: 'bg-blue-500' },
  fulfillment_in_progress:     { label: 'Send Funds ⚡',     pill: 'bg-teal-50 text-teal-700 border-teal-200',             dot: 'bg-teal-500' },
  pending_receipt_confirmation:{ label: 'Awaiting Receipt',  pill: 'bg-green-50 text-green-700 border-green-200',          dot: 'bg-green-400' },
  pending_settlement:          { label: 'Settling',          pill: 'bg-green-50 text-green-700 border-green-200',          dot: 'bg-green-500' },
  fully_completed:             { label: 'Completed',         pill: 'bg-green-100 text-green-800 border-green-300',         dot: 'bg-green-600' },
  // Terminal
  seller_rejected:             { label: 'Rejected',          pill: 'bg-red-50 text-red-600 border-red-200',                dot: 'bg-red-500' },
  seller_timeout:              { label: 'Timed Out',         pill: 'bg-red-50 text-red-600 border-red-200',                dot: 'bg-red-500' },
  cancelled:                   { label: 'Cancelled',         pill: 'bg-red-50 text-red-600 border-red-200',                dot: 'bg-red-500' },
  disputed:                    { label: 'Disputed',          pill: 'bg-purple-50 text-purple-700 border-purple-200',       dot: 'bg-purple-500' },
  expired:                     { label: 'Expired',           pill: 'bg-gray-100 text-gray-500 border-gray-200',            dot: 'bg-gray-400' },
}

const FILTER_KEYS: { value: string; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'action',    label: 'Action Needed' },
  { value: 'disputed',  label: 'Disputes' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected',  label: 'Rejected' },
]

const ACTIVE_STATUSES = [
  'pending_acceptance', 'awaiting_payment', 'pending_ops_confirmation',
  'fulfillment_in_progress', 'pending_receipt_confirmation', 'pending_settlement',
]
const ACTION_STATUSES = ['fulfillment_in_progress']
const DISPUTED_STATUSES = ['disputed']
const REJECTED_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']
const COMPLETED_STATUSES = ['fully_completed']

interface Props {
  transactions: any[]
}

export default function SellerTransactionsClient({ transactions }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [fulfilling, setFulfilling] = useState<string | null>(null)
  const [error, setError] = useState('')

  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'active') return ACTIVE_STATUSES.includes(tx.status)
    if (filter === 'action') return ACTION_STATUSES.includes(tx.status)
    if (filter === 'disputed') return DISPUTED_STATUSES.includes(tx.status)
    if (filter === 'completed') return COMPLETED_STATUSES.includes(tx.status)
    if (filter === 'rejected') return REJECTED_STATUSES.includes(tx.status)
    return true
  })

  const counts = {
    all: transactions.length,
    active: transactions.filter(tx => ACTIVE_STATUSES.includes(tx.status)).length,
    action: transactions.filter(tx => ACTION_STATUSES.includes(tx.status)).length,
    disputed: transactions.filter(tx => DISPUTED_STATUSES.includes(tx.status)).length,
    completed: transactions.filter(tx => COMPLETED_STATUSES.includes(tx.status)).length,
    rejected: transactions.filter(tx => REJECTED_STATUSES.includes(tx.status)).length,
  }

  const disputedTxs = transactions.filter(tx => tx.status === 'disputed')

  async function handleFulfillV5(txId: string) {
    setFulfilling(txId)
    setError('')
    const res = await sellerMarkFulfilled(txId)
    if (res?.error) setError(res.error)
    else router.refresh()
    setFulfilling(null)
  }

  function getStatus(status: string) {
    const cfg = STATUS_KEYS[status]
    if (!cfg) return { label: status.replace(/_/g, ' '), pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
    return { label: cfg.label, pill: cfg.pill, dot: cfg.dot }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-gray-900 font-bold text-lg">{t('transaction_history')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{transactions.length} {t('total_transactions')}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.all, icon: ArrowLeftRight, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Action Needed', value: counts.action, icon: SendHorizonal, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Completed', value: counts.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Disputes', value: counts.disputed, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
              <s.icon size={15} className={s.color} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Dispute alert banner */}
      {disputedTxs.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
            <p className="text-red-800 font-bold text-sm">
              {disputedTxs.length} active dispute{disputedTxs.length > 1 ? 's' : ''} — funds frozen
            </p>
          </div>
          <p className="text-red-600 text-xs leading-relaxed">
            A buyer has disputed one or more of your transactions. Funds are held by HOXA until the issue is resolved. Please contact support if you believe this is an error.
          </p>
          {disputedTxs.map(tx => (
            <div key={tx.id} className="bg-white rounded-xl px-3 py-2.5 border border-red-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-gray-900 font-semibold text-xs">
                    {(tx.from_amount ?? tx.send_amount)?.toLocaleString()} {tx.from_currency ?? tx.send_currency} → {(tx.to_amount ?? tx.receive_amount)?.toFixed(2)} {tx.to_currency ?? tx.receive_currency}
                  </p>
                  <p className="text-gray-400 text-xs">{tx.profiles?.full_name ?? 'Buyer'} · {new Date(tx.created_at).toLocaleDateString()}</p>
                  {tx.dispute_reason && (
                    <p className="text-red-600 text-xs mt-1 font-medium">Reason: {tx.dispute_reason}</p>
                  )}
                </div>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-lg font-semibold flex-shrink-0">Disputed</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-gray-400" />
        {FILTER_KEYS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-[#18824a] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.label} ({counts[f.value as keyof typeof counts] ?? 0})
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <ArrowLeftRight size={24} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">{t('no_transactions')}</p>
          <p className="text-gray-400 text-xs mt-1">{t('change_filter')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {[t('buyer'), t('pair'), t('amount'), t('you_send_col'), t('rate'), t('status'), t('date'), ''].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(tx => {
                  const st = getStatus(tx.status)
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/seller/transactions/${tx.id}`)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(tx.profiles?.full_name ?? 'B').charAt(0)}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium text-sm">{tx.profiles?.full_name ?? '—'}</p>
                            <p className="text-gray-400 text-xs">{tx.profiles?.country ?? ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{tx.from_currency} → {tx.to_currency}</td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{tx.from_amount?.toLocaleString()} {tx.from_currency}</td>
                      <td className="px-4 py-3 text-gray-900">{tx.to_amount?.toFixed(2)} {tx.to_currency}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{tx.rate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.pill}`}>
                          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        {tx.status === 'fulfillment_in_progress' && (
                          <button
                            onClick={() => handleFulfillV5(tx.id)}
                            disabled={fulfilling === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {fulfilling === tx.id ? <Loader2 size={12} className="animate-spin" /> : <SendHorizonal size={12} />}
                            I've Sent
                          </button>
                        )}
                        {tx.status === 'disputed' && tx.dispute_reason && (
                          <span className="text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg max-w-[160px] truncate block">
                            {tx.dispute_reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filtered.map(tx => {
              const st = getStatus(tx.status)
              return (
                <div key={tx.id} className="px-4 py-3.5 space-y-2 cursor-pointer" onClick={() => router.push(`/seller/transactions/${tx.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(tx.profiles?.full_name ?? 'B').charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium text-sm">{tx.profiles?.full_name ?? '—'}</p>
                        <p className="text-gray-400 text-xs">{tx.from_currency} → {tx.to_currency} · {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${st.pill}`}>
                      <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-900 font-semibold text-sm">
                      {tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_amount?.toFixed(2)} {tx.to_currency}
                    </p>
                    {tx.status === 'fulfillment_in_progress' && (
                      <button
                        onClick={() => handleFulfillV5(tx.id)}
                        disabled={fulfilling === tx.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {fulfilling === tx.id ? <Loader2 size={12} className="animate-spin" /> : <SendHorizonal size={12} />}
                        I've Sent
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
