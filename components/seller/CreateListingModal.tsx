'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowRight } from 'lucide-react'
import { createOffer, updateOffer, type OfferInput } from '@/actions/listings'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

const PAYMENT_METHODS = ['Mobile Money (MTN)', 'Mobile Money (Vodafone)', 'Mobile Money (AirtelTigo)', 'Bank Transfer', 'Wave', 'Orange Money']

interface Corridor { send_currency: string; receive_currency: string }

interface Props {
  onClose: () => void
  existing?: any
  corridors?: Corridor[]
}

export default function CreateListingModal({ onClose, existing, corridors = [] }: Props) {
  const router = useRouter()
  const { t } = useI18n()

  // Derive pairs from corridors prop; fallback to hardcoded if none loaded yet
  const pairs: Corridor[] = corridors.length > 0
    ? corridors
    : [
        { send_currency: 'GHS', receive_currency: 'XOF' },
        { send_currency: 'XOF', receive_currency: 'GHS' },
        { send_currency: 'GHS', receive_currency: 'USD' },
        { send_currency: 'USD', receive_currency: 'GHS' },
      ]

  const defaultPair = existing
    ? pairs.find(p => p.send_currency === existing.from_currency && p.receive_currency === existing.to_currency) ?? pairs[0]
    : null

  const [selectedPair, setSelectedPair] = useState<Corridor | null>(defaultPair)

  // Natural rate inputs: "buyer sends X from_currency, receives Y to_currency"
  const [sendAmt, setSendAmt] = useState(existing ? '1' : '')
  const [receiveAmt, setReceiveAmt] = useState(
    existing?.rate ? existing.rate.toString() : ''
  )

  const [minAmount, setMinAmount] = useState(existing?.min_amount?.toString() ?? '')
  const [maxAmount, setMaxAmount] = useState(existing?.max_amount?.toString() ?? '')
  const [liquidity, setLiquidity] = useState(existing?.available_liquidity?.toString() ?? '')
  const [payments, setPayments] = useState<string[]>(existing?.payment_methods ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Computed rate
  const sendNum = parseFloat(sendAmt)
  const receiveNum = parseFloat(receiveAmt)
  const computedRate = (!isNaN(sendNum) && !isNaN(receiveNum) && sendNum > 0)
    ? receiveNum / sendNum
    : null

  function togglePayment(m: string) {
    setPayments(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedPair) return setError(t('select_currency_pair'))
    if (payments.length === 0) return setError(t('select_payment_method'))
    if (!computedRate || computedRate <= 0) return setError(t('invalid_rate'))

    const minNum = parseFloat(minAmount)
    const maxNum = parseFloat(maxAmount)
    const liqNum = parseFloat(liquidity)

    if (isNaN(minNum) || minNum <= 0) return setError(t('invalid_min'))
    if (isNaN(maxNum) || maxNum <= 0) return setError(t('invalid_max'))
    if (minNum > maxNum) return setError(t('min_exceeds_max'))
    if (isNaN(liqNum) || liqNum <= 0) return setError(t('invalid_liquidity'))

    setLoading(true)

    const input: OfferInput = {
      from_currency: selectedPair.send_currency,
      to_currency: selectedPair.receive_currency,
      rate: computedRate,
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
            {pairs.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No active corridors available. Ask your admin to add corridors first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {pairs.map(p => {
                  const isActive = selectedPair?.send_currency === p.send_currency && selectedPair?.receive_currency === p.receive_currency
                  return (
                    <button
                      key={`${p.send_currency}-${p.receive_currency}`}
                      type="button"
                      onClick={() => { setSelectedPair(p); setSendAmt(''); setReceiveAmt('') }}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        isActive ? 'bg-[#177945] text-white border-[#177945]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/40'
                      }`}
                    >
                      <CurrencyFlag code={p.send_currency} size={16} /> {p.send_currency} → <CurrencyFlag code={p.receive_currency} size={16} /> {p.receive_currency}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Natural rate input */}
          {selectedPair && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Exchange Rate</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 mb-1">Buyer sends ({selectedPair.send_currency})</p>
                  <input
                    type="number"
                    value={sendAmt}
                    onChange={e => setSendAmt(e.target.value)}
                    placeholder="e.g. 10000"
                    min="0.0001"
                    step="any"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
                  />
                </div>
                <ArrowRight size={16} className="text-gray-400 flex-shrink-0 mt-4" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 mb-1">Buyer receives ({selectedPair.receive_currency})</p>
                  <input
                    type="number"
                    value={receiveAmt}
                    onChange={e => setReceiveAmt(e.target.value)}
                    placeholder="e.g. 218"
                    min="0.0001"
                    step="any"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
                  />
                </div>
              </div>

              {/* Live rate preview */}
              {computedRate !== null && sendAmt && receiveAmt && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-[#177945]/5 border border-[#177945]/20 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-[#177945] font-semibold flex-wrap">
                    <CurrencyFlag code={selectedPair.send_currency} size={14} />
                    {parseFloat(sendAmt).toLocaleString()} {selectedPair.send_currency}
                    {' → '}
                    <CurrencyFlag code={selectedPair.receive_currency} size={14} />
                    {parseFloat(receiveAmt).toLocaleString()} {selectedPair.receive_currency}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">
                    rate: {computedRate.toFixed(6)} {selectedPair.receive_currency}/{selectedPair.send_currency}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('min_amount')}{selectedPair ? ` (${selectedPair.send_currency})` : ''}
              </label>
              <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} placeholder="100" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('max_amount')}{selectedPair ? ` (${selectedPair.send_currency})` : ''}
              </label>
              <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} placeholder="5000" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>
          </div>

          {/* Liquidity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('available_liquidity_label')}{selectedPair ? ` (${selectedPair.receive_currency})` : ''}
            </label>
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
