'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createOffer, updateOffer, type OfferInput } from '@/actions/listings'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'

const CURRENCY_PAIRS = [
  { from: 'GHS', to: 'CFA' },
  { from: 'CFA', to: 'GHS' },
  { from: 'GHS', to: 'USD' },
  { from: 'USD', to: 'GHS' },
]
const PAYMENT_METHODS = ['Mobile Money (MTN)', 'Mobile Money (Vodafone)', 'Mobile Money (AirtelTigo)', 'Bank Transfer', 'Wave', 'Orange Money']

interface Props {
  onClose: () => void
  existing?: any
}

export default function CreateListingModal({ onClose, existing }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [pair, setPair] = useState(existing ? `${existing.from_currency}-${existing.to_currency}` : '')
  const [rate, setRate] = useState(existing?.rate?.toString() ?? '')
  const [minAmount, setMinAmount] = useState(existing?.min_amount?.toString() ?? '')
  const [maxAmount, setMaxAmount] = useState(existing?.max_amount?.toString() ?? '')
  const [liquidity, setLiquidity] = useState(existing?.available_liquidity?.toString() ?? '')
  const [payments, setPayments] = useState<string[]>(existing?.payment_methods ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedPair = CURRENCY_PAIRS.find(p => `${p.from}-${p.to}` === pair)

  function togglePayment(m: string) {
    setPayments(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPair) return setError(t('select_currency_pair'))
    if (payments.length === 0) return setError(t('select_payment_method'))

    const rateNum = parseFloat(rate)
    const minNum = parseFloat(minAmount)
    const maxNum = parseFloat(maxAmount)
    const liqNum = parseFloat(liquidity)

    if (isNaN(rateNum) || rateNum <= 0) return setError(t('invalid_rate'))
    if (isNaN(minNum) || minNum <= 0) return setError(t('invalid_min'))
    if (isNaN(maxNum) || maxNum <= 0) return setError(t('invalid_max'))
    if (minNum > maxNum) return setError(t('min_exceeds_max'))
    if (isNaN(liqNum) || liqNum <= 0) return setError(t('invalid_liquidity'))

    setError('')
    setLoading(true)

    const input: OfferInput = {
      from_currency: selectedPair.from,
      to_currency: selectedPair.to,
      rate: rateNum,
      min_amount: minNum,
      max_amount: maxNum,
      available_liquidity: liqNum,
      payment_methods: payments,
    }

    const result = existing ? await updateOffer(existing.id, input) : await createOffer(input)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  const modalTitle = existing ? t('edit_listing') : t('new_listing')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={modalTitle} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{modalTitle}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" aria-label={t('cancel')}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Currency pair */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('currency_pair')}</label>
            <div className="grid grid-cols-2 gap-2">
              {CURRENCY_PAIRS.map(p => {
                const val = `${p.from}-${p.to}`
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPair(val)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                      pair === val ? 'bg-[#177945] text-white border-[#177945]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/40'
                    }`}
                  >
                    {p.from} → {p.to}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('rate')} {selectedPair ? `(1 ${selectedPair.from} = ? ${selectedPair.to})` : ''}
            </label>
            <input type="number" step="0.0001" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. 65.4" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
          </div>

          {/* Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('min_amount')}</label>
              <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="100" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('max_amount')}</label>
              <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="5000" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>
          </div>

          {/* Liquidity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('available_liquidity_label')}</label>
            <input type="number" value={liquidity} onChange={e => setLiquidity(e.target.value)} placeholder="e.g. 50000" required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
          </div>

          {/* Payment methods */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('payment_methods')}</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map(m => (
                <button key={m} type="button" onClick={() => togglePayment(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    payments.includes(m) ? 'bg-[#177945] text-white border-[#177945]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/40'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              {t('cancel')}
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> {t('saving')}</> : existing ? t('update_listing') : t('create_listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
