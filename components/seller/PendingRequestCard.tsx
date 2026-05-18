'use client'

import { useState } from 'react'
import { Check, X, User } from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import { acceptTransaction, rejectTransaction } from '@/actions/transactions'
import { useI18n } from '@/lib/i18n-context'

export interface PendingRequest {
  id: string
  buyerName: string
  fromCurrency: string
  toCurrency: string
  amount: number
  rate: number
  secondsLeft: number
}

export default function PendingRequestCard({ req }: { req: PendingRequest }) {
  const [state, setState] = useState<'idle' | 'accepted' | 'rejected' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const { t } = useI18n()

  const received = (req.amount * req.rate).toLocaleString()
  const amountFmt = req.amount.toLocaleString()

  if (state === 'accepted') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <Check size={16} className="text-green-600" />
        </div>
        <div>
          <p className="text-green-700 font-semibold text-sm">{t('request_accepted')}</p>
          <p className="text-green-600 text-xs">#{req.id.slice(0, 8)} — {t('transaction_active')}</p>
        </div>
      </div>
    )
  }

  if (state === 'rejected') {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
          <X size={16} className="text-red-500" />
        </div>
        <div>
          <p className="text-red-600 font-semibold text-sm">{t('request_rejected')}</p>
          <p className="text-red-500 text-xs">#{req.id.slice(0, 8)} — {t('transaction_declined')}</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <X size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-amber-700 font-semibold text-sm">{errorMsg}</p>
            <p className="text-amber-500 text-xs">#{req.id.slice(0, 8)}</p>
          </div>
        </div>
        <button onClick={() => { setState('idle'); setErrorMsg('') }} className="text-amber-600 text-xs font-medium hover:underline">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#177945]/10 flex items-center justify-center">
            <User size={14} className="text-[#177945]" />
          </div>
          <div>
            <p className="text-gray-900 font-semibold text-sm">{req.buyerName}</p>
            <p className="text-gray-400 text-xs">#{req.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 mb-0.5">{t('time_left')}</p>
          <CountdownTimer seconds={req.secondsLeft} />
        </div>
      </div>

      {/* Details */}
      <div className="bg-[#F7F9F8] rounded-xl p-3 mb-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-gray-400 text-xs">{t('sends')}</p>
          <p className="text-gray-900 font-semibold text-sm">{amountFmt} {req.fromCurrency}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">{t('you_give')}</p>
          <p className="text-gray-900 font-semibold text-sm">{received} {req.toCurrency}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">{t('rate')}</p>
          <p className="text-gray-700 text-sm">1 {req.fromCurrency} = {req.rate} {req.toCurrency}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">{t('pair')}</p>
          <p className="text-gray-700 text-sm">{req.fromCurrency} → {req.toCurrency}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setState('loading')
            const res = await rejectTransaction(req.id)
            if (res?.error) { setErrorMsg(res.error); setState('error') }
            else setState('rejected')
          }}
          disabled={state === 'loading'}
          className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {t('reject')}
        </button>
        <button
          onClick={async () => {
            setState('loading')
            const res = await acceptTransaction(req.id)
            if (res?.error) { setErrorMsg(res.error); setState('error') }
            else setState('accepted')
          }}
          disabled={state === 'loading'}
          className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white hover:opacity-90 text-sm font-semibold transition-opacity disabled:opacity-50"
        >
          {t('accept')}
        </button>
      </div>
    </div>
  )
}
