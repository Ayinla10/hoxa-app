'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

const CURRENCIES = [
  { code: 'GHS', flag: '🇬🇭' },
  { code: 'CFA', flag: '🇨🇮' },
  { code: 'NGN', flag: '🇳🇬' },
  { code: 'USD', flag: '🇺🇸' },
]

export default function QuickExchangeWidget() {
  const router = useRouter()
  const { t } = useI18n()
  const [from, setFrom] = useState('GHS')
  const [to, setTo]     = useState('CFA')
  const [amount, setAmount] = useState('')

  function swap() { setFrom(to); setTo(from) }

  function handleFind(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ from, to })
    if (amount) params.set('amount', amount)
    router.push(`/dashboard/marketplace?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">{t('quick_exchange')}</h2>
        <p className="text-gray-400 text-xs mt-0.5">{t('find_best_rate')}</p>
      </div>

      <form onSubmit={handleFind} className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('you_send')}</label>
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm font-semibold bg-[#F7F9F8] focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 cursor-pointer"
              >
                {CURRENCIES.filter(c => c.code !== to).map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={swap}
              className="w-9 h-9 mb-0.5 rounded-full bg-[#177945]/10 flex items-center justify-center hover:bg-[#177945]/20 transition-colors flex-shrink-0">
              <ArrowLeftRight size={14} className="text-[#177945]" />
            </button>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('you_receive')}</label>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm font-semibold bg-[#F7F9F8] focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 cursor-pointer"
              >
                {CURRENCIES.filter(c => c.code !== from).map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('amount_optional')}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">{from}</span>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="0.00" min="0"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
            <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-[9px] font-bold">✓</span>
            </div>
            <p className="text-green-700 text-xs font-medium">{t('escrow_protected')}</p>
          </div>
        </div>

        <button type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm shadow-[#177945]/20">
          <Search size={14} /> {t('find_sellers')}
        </button>
      </form>
    </div>
  )
}
