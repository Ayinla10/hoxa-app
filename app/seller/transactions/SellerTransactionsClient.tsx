'use client'

import { useState } from 'react'
import Link from 'next/link'
import { markFulfilled } from '@/actions/transactions'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftRight, CheckCircle2, Clock, XCircle,
  AlertTriangle, Loader2, ChevronRight, Filter,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import type { TKey } from '@/lib/i18n'

const STATUS_KEYS: Record<string, { labelKey: TKey; pill: string; dot: string }> = {
  completed:         { labelKey: 'status_completed',  pill: 'bg-green-50 text-green-700 border-green-200',       dot: 'bg-green-500' },
  seller_rejected:   { labelKey: 'status_rejected',   pill: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-500' },
  seller_timeout:    { labelKey: 'status_timed_out',   pill: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-500' },
  cancelled:         { labelKey: 'status_cancelled',   pill: 'bg-red-50 text-red-600 border-red-200',            dot: 'bg-red-500' },
  disputed:          { labelKey: 'status_disputed',    pill: 'bg-purple-50 text-purple-700 border-purple-200',   dot: 'bg-purple-500' },
  payment_submitted: { labelKey: 'status_proof_sent',  pill: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  payment_verified:  { labelKey: 'status_verified',    pill: 'bg-teal-50 text-teal-700 border-teal-200',         dot: 'bg-teal-500' },
  seller_accepted:   { labelKey: 'status_accepted',    pill: 'bg-[#18824a]/10 text-[#18824a] border-[#18824a]/20', dot: 'bg-[#18824a]' },
  pending_seller:    { labelKey: 'status_pending',     pill: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
}

const FILTER_KEYS: { value: string; labelKey: TKey }[] = [
  { value: 'all', labelKey: 'all' },
  { value: 'active', labelKey: 'active' },
  { value: 'completed', labelKey: 'status_completed' },
  { value: 'rejected', labelKey: 'rejected' },
]

const ACTIVE_STATUSES = ['pending_seller', 'seller_accepted', 'payment_submitted', 'payment_verified']
const REJECTED_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled']

interface Props {
  transactions: any[]
}

export default function SellerTransactionsClient({ transactions }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [fulfilling, setFulfilling] = useState<string | null>(null)

  const filtered = transactions.filter(tx => {
    if (filter === 'all') return true
    if (filter === 'active') return ACTIVE_STATUSES.includes(tx.status)
    if (filter === 'completed') return tx.status === 'completed'
    if (filter === 'rejected') return REJECTED_STATUSES.includes(tx.status)
    return true
  })

  const counts = {
    all: transactions.length,
    active: transactions.filter(t => ACTIVE_STATUSES.includes(t.status)).length,
    completed: transactions.filter(t => t.status === 'completed').length,
    rejected: transactions.filter(t => REJECTED_STATUSES.includes(t.status)).length,
  }

  const [error, setError] = useState('')

  async function handleFulfill(txId: string) {
    setFulfilling(txId)
    setError('')
    const res = await markFulfilled(txId)
    if (res?.error) setError(res.error)
    else router.refresh()
    setFulfilling(null)
  }

  function getStatus(status: string) {
    const cfg = STATUS_KEYS[status]
    if (!cfg) return { label: t('status_unknown'), pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400' }
    return { label: t(cfg.labelKey), pill: cfg.pill, dot: cfg.dot }
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
          { label: t('total'), value: counts.all, icon: ArrowLeftRight, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: t('active'), value: counts.active, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: t('status_completed'), value: counts.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: t('rejected'), value: counts.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
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

      {/* Filters */}
      <div className="flex items-center gap-2">
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
            {t(f.labelKey)} ({counts[f.value as keyof typeof counts]})
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
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
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
                        {tx.status === 'payment_verified' && (
                          <button
                            onClick={() => handleFulfill(tx.id)}
                            disabled={fulfilling === tx.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                          >
                            {fulfilling === tx.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            {t('fulfil')}
                          </button>
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
                <div key={tx.id} className="px-4 py-3.5 space-y-2">
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
                    {tx.status === 'payment_verified' && (
                      <button
                        onClick={() => handleFulfill(tx.id)}
                        disabled={fulfilling === tx.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        {fulfilling === tx.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                        Fulfil
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
