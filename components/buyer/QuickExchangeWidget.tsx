'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Search, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { CURRENCY_META } from '@/lib/currency-meta'
import CurrencySelect from '@/components/ui/CurrencySelect'

const ALL_CODES = Object.keys(CURRENCY_META)

export default function QuickExchangeWidget() {
  const router = useRouter()
  const { t } = useI18n()
  const [from, setFrom] = useState('GHS')
  const [to, setTo] = useState('XOF')
  const [amount, setAmount] = useState('')

  function swap() { setFrom(to); setTo(from) }

  function handleFind(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ from, to })
    if (amount) params.set('amount', amount)
    router.push(`/dashboard/marketplace?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] px-6 py-5">
        <h2 className="text-white font-bold text-lg">{t('quick_exchange')}</h2>
        <p className="text-white/50 text-xs mt-0.5">{t('find_best_rate')}</p>
      </div>

      <form onSubmit={handleFind} className="p-5 space-y-4">
        {/* You Send */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('you_send')}</label>
          <div className="flex gap-2">
            <CurrencySelect value={from} options={ALL_CODES.filter(c => c !== to)} onChange={setFrom} className="w-[140px]" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
            />
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            className="w-10 h-10 rounded-full bg-[#177945]/10 flex items-center justify-center hover:bg-[#177945]/20 transition-colors"
          >
            <ArrowLeftRight size={16} className="text-[#177945] rotate-90" />
          </button>
        </div>

        {/* You Receive */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('you_receive')}</label>
          <div className="flex gap-2">
            <CurrencySelect value={to} options={ALL_CODES.filter(c => c !== from)} onChange={setTo} className="w-[140px]" />
            <div className="flex-1 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm">
              Estimated at checkout
            </div>
          </div>
        </div>

        {/* Protection note */}
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
          <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-xs font-medium">{t('escrow_protected')}</p>
        </div>

        {/* CTA */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm shadow-[#177945]/20"
        >
          <Search size={14} /> {t('find_exchange_offers')}
        </button>
      </form>
    </div>
  )
}
