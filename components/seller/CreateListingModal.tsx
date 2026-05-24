'use client'

import { useState } from 'react'
import { X, Loader2, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react'
import { createOffer, updateOffer, type OfferInput } from '@/actions/listings'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

// ── Country flag helper ────────────────────────────────────────────
const COUNTRY_CC: Record<string, string> = {
  'Ghana': 'gh', 'Nigeria': 'ng', "Côte d'Ivoire": 'ci',
  'Senegal': 'sn', 'Mali': 'ml', 'Burkina Faso': 'bf',
  'Togo': 'tg', 'Benin': 'bj', 'Niger': 'ne', 'Guinea-Bissau': 'gw',
  'Cameroon': 'cm', 'Chad': 'td', 'Central African Rep.': 'cf',
  'Republic of Congo': 'cg', 'Gabon': 'ga', 'Equatorial Guinea': 'gq',
  'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz', 'South Africa': 'za',
  'United Kingdom': 'gb', 'France': 'fr', 'Germany': 'de', 'Spain': 'es',
  'Italy': 'it', 'Netherlands': 'nl', 'Belgium': 'be', 'Portugal': 'pt',
  'United States': 'us', 'Canada': 'ca', 'Other EU': 'eu',
}

function CountryFlag({ country, size = 16 }: { country: string; size?: number }) {
  const cc = COUNTRY_CC[country]
  if (!cc) return null
  return (
    <img
      src={`https://flagcdn.com/w20/${cc}.png`}
      width={size}
      height={Math.round(size * 0.67)}
      alt={country}
      className="inline-block rounded-sm object-cover flex-shrink-0"
    />
  )
}

// ── Payment methods by destination country ─────────────────────────
// Mirrors the admin DEFAULT_MOMO_NETWORKS list so options always match
const PAYMENT_BY_COUNTRY: Record<string, string[]> = {
  'Ghana':            ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money', 'Bank Transfer'],
  'Senegal':          ['Orange Money', 'Wave', 'Free Money', 'Bank Transfer'],
  "Côte d'Ivoire":    ['Orange Money', 'MTN Money', 'Moov Money', 'Wave', 'Bank Transfer'],
  'Mali':             ['Orange Money', 'Moov Money', 'Bank Transfer'],
  'Burkina Faso':     ['Orange Money', 'Moov Money', 'Bank Transfer'],
  'Niger':            ['Airtel Money', 'Orange Money', 'Bank Transfer'],
  'Togo':             ['T-Money', 'Flooz', 'Bank Transfer'],
  'Benin':            ['MTN MoMo', 'Moov Money', 'Bank Transfer'],
  'Cameroon':         ['MTN Mobile Money', 'Orange Money', 'Bank Transfer'],
  'Guinea-Bissau':    ['Orange Money', 'Bank Transfer'],
  'Chad':             ['Airtel Money', 'Tigo Cash', 'Bank Transfer'],
  'Gabon':            ['Airtel Money', 'Moov Money', 'Bank Transfer'],
  'Republic of Congo':['MTN Mobile Money', 'Airtel Money', 'Bank Transfer'],
  'Nigeria':          ['Bank Transfer', 'Opay', 'PalmPay', 'Chipper Cash'],
  'Kenya':            ['M-Pesa', 'Airtel Money', 'Bank Transfer'],
  'Uganda':           ['MTN Mobile Money', 'Airtel Money', 'Bank Transfer'],
  'Tanzania':         ['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Bank Transfer'],
  'South Africa':     ['Bank Transfer', 'Capitec Pay', 'FNB Pay'],
  'United Kingdom':   ['Bank Transfer', 'Wise', 'Revolut'],
  'France':           ['Bank Transfer', 'Wise', 'Revolut'],
  'Germany':          ['Bank Transfer', 'Wise'],
  'United States':    ['Bank Transfer', 'Zelle', 'Wise'],
  'Canada':           ['Bank Transfer', 'Interac e-Transfer', 'Wise'],
}

const DEFAULT_PAYMENT_METHODS = ['Bank Transfer', 'Mobile Money', 'Wave', 'Orange Money']

function getPaymentMethods(receiveCountry?: string): string[] {
  if (receiveCountry && PAYMENT_BY_COUNTRY[receiveCountry]) {
    return PAYMENT_BY_COUNTRY[receiveCountry]
  }
  return DEFAULT_PAYMENT_METHODS
}

// ── Types ──────────────────────────────────────────────────────────
export interface Corridor {
  id: string
  send_currency: string
  receive_currency: string
  send_country: string
  receive_country: string
  min_amount: number
  max_amount: number
}

interface Props {
  onClose: () => void
  existing?: any
  corridors?: Corridor[]
}

// ── Component ──────────────────────────────────────────────────────
export default function CreateListingModal({ onClose, existing, corridors = [] }: Props) {
  const router = useRouter()
  const { t } = useI18n()

  const matchedCorridor = existing
    ? corridors.find(c =>
        (existing.corridor_id && c.id === existing.corridor_id) ||
        (c.send_currency === existing.from_currency && c.receive_currency === existing.to_currency)
      ) ?? null
    : null

  const [selectedCorridor, setSelectedCorridor] = useState<Corridor | null>(matchedCorridor)

  // Natural rate inputs: "buyer sends X → receives Y"
  const [sendAmt, setSendAmt] = useState(existing?.rate ? '1' : '')
  const [receiveAmt, setReceiveAmt] = useState(existing?.rate ? existing.rate.toString() : '')

  const [minAmount, setMinAmount] = useState(existing?.min_amount?.toString() ?? '')
  const [maxAmount, setMaxAmount] = useState(existing?.max_amount?.toString() ?? '')
  const [liquidity, setLiquidity] = useState(existing?.available_liquidity?.toString() ?? '')
  const [payments, setPayments] = useState<string[]>(existing?.payment_methods ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendNum = parseFloat(sendAmt)
  const receiveNum = parseFloat(receiveAmt)
  const computedRate =
    !isNaN(sendNum) && !isNaN(receiveNum) && sendNum > 0 ? receiveNum / sendNum : null

  const availablePayments = getPaymentMethods(selectedCorridor?.receive_country)

  function selectCorridor(c: Corridor) {
    setSelectedCorridor(c)
    setSendAmt('')
    setReceiveAmt('')
    setMinAmount('')
    setMaxAmount('')
    setPayments([])
    setError('')
  }

  function togglePayment(m: string) {
    setPayments(prev => (prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedCorridor) return setError('Please select a corridor first.')
    if (payments.length === 0) return setError(t('select_payment_method'))
    if (!computedRate || computedRate <= 0) return setError(t('invalid_rate'))

    const minNum = parseFloat(minAmount)
    const maxNum = parseFloat(maxAmount)
    const liqNum = parseFloat(liquidity)

    if (isNaN(minNum) || minNum <= 0) return setError(t('invalid_min'))
    if (isNaN(maxNum) || maxNum <= 0) return setError(t('invalid_max'))
    if (minNum > maxNum) return setError(t('min_exceeds_max'))
    if (minNum < selectedCorridor.min_amount)
      return setError(`Minimum must be at least ${selectedCorridor.min_amount.toLocaleString()} ${selectedCorridor.send_currency}`)
    if (maxNum > selectedCorridor.max_amount)
      return setError(`Maximum cannot exceed ${selectedCorridor.max_amount.toLocaleString()} ${selectedCorridor.send_currency}`)
    if (isNaN(liqNum) || liqNum <= 0) return setError(t('invalid_liquidity'))

    setLoading(true)

    const input: OfferInput = {
      from_currency: selectedCorridor.send_currency,
      to_currency: selectedCorridor.receive_currency,
      rate: computedRate,
      rate_send_ref: sendNum,
      rate_receive_ref: receiveNum,
      min_amount: minNum,
      max_amount: maxNum,
      available_liquidity: liqNum,
      payment_methods: payments,
      corridor_id: selectedCorridor.id,
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
  const step = selectedCorridor ? 'details' : 'corridor'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {step === 'details' && !existing && (
              <button
                type="button"
                onClick={() => setSelectedCorridor(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="Back"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <h2 className="font-bold text-gray-900">{modalTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label={t('cancel')}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Step 1 — Pick corridor ── */}
        {step === 'corridor' && (
          <div className="p-5">
            <p className="text-sm text-gray-500 mb-4">
              Select the corridor you want to list on. Currencies and destination country are set by admin.
            </p>

            {corridors.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm font-medium">No active corridors available.</p>
                <p className="text-gray-300 text-xs mt-1">Ask your admin to configure corridors first.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {corridors.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCorridor(c)}
                    className="w-full px-4 py-3.5 rounded-xl border border-gray-200 hover:border-[#177945]/60 hover:bg-[#177945]/5 transition-all text-left group"
                  >
                    {/* Top row: currency pair */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <CurrencyFlag code={c.send_currency} size={18} />
                      <span className="font-bold text-gray-800 text-sm">{c.send_currency}</span>
                      <ArrowRight size={13} className="text-gray-300 flex-shrink-0" />
                      <CurrencyFlag code={c.receive_currency} size={18} />
                      <span className="font-bold text-gray-800 text-sm">{c.receive_currency}</span>
                    </div>

                    {/* Bottom row: send country → destination country in full text */}
                    <div className="flex items-center gap-1.5 ml-0.5 flex-wrap">
                      {c.send_country && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <CountryFlag country={c.send_country} size={13} />
                          <span className="font-semibold text-gray-700">{c.send_country}</span>
                        </span>
                      )}
                      {c.send_country && c.receive_country && (
                        <span className="text-gray-300 text-xs">→</span>
                      )}
                      {c.receive_country && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <CountryFlag country={c.receive_country} size={13} />
                          <span className="font-semibold text-gray-700">{c.receive_country}</span>
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 2 — Listing details ── */}
        {step === 'details' && selectedCorridor && (
          <form onSubmit={handleSubmit} className="p-5 space-y-5">

            {/* Selected corridor badge */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#177945]/5 border border-[#177945]/20">
              <CheckCircle2 size={16} className="text-[#177945] flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <CurrencyFlag code={selectedCorridor.send_currency} size={16} />
                  <span className="text-sm font-semibold text-gray-800">{selectedCorridor.send_currency}</span>
                </div>
                <ArrowRight size={12} className="text-gray-400" />
                <div className="flex items-center gap-1.5">
                  <CurrencyFlag code={selectedCorridor.receive_currency} size={16} />
                  <span className="text-sm font-semibold text-gray-800">{selectedCorridor.receive_currency}</span>
                  {selectedCorridor.receive_country && (
                    <>
                      <CountryFlag country={selectedCorridor.receive_country} size={13} />
                      <span className="text-xs text-gray-500">{selectedCorridor.receive_country}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Natural rate input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Your Exchange Rate</label>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 mb-1">Buyer sends ({selectedCorridor.send_currency})</p>
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
                <ArrowRight size={15} className="text-gray-400 flex-shrink-0 mb-2.5" />
                <div className="flex-1">
                  <p className="text-[10px] text-gray-400 mb-1">Buyer receives ({selectedCorridor.receive_currency})</p>
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

              {/* Live rate preview — 2 decimal places */}
              {computedRate !== null && sendAmt && receiveAmt && (
                <div className="mt-2 px-3 py-2 rounded-xl bg-[#177945]/5 border border-[#177945]/20 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-[#177945] font-semibold flex-wrap">
                    <CurrencyFlag code={selectedCorridor.send_currency} size={13} />
                    {parseFloat(sendAmt).toLocaleString()} {selectedCorridor.send_currency}
                    {' → '}
                    <CurrencyFlag code={selectedCorridor.receive_currency} size={13} />
                    {parseFloat(receiveAmt).toLocaleString()} {selectedCorridor.receive_currency}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                    rate {computedRate.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Min / Max — with admin limit hint */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Transaction Limits ({selectedCorridor.send_currency})
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Minimum</p>
                  <input
                    type="number"
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value)}
                    placeholder={selectedCorridor.min_amount.toString()}
                    min={selectedCorridor.min_amount}
                    max={selectedCorridor.max_amount}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
                  />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">Maximum</p>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    placeholder={selectedCorridor.max_amount.toString()}
                    min={selectedCorridor.min_amount}
                    max={selectedCorridor.max_amount}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Admin range: {selectedCorridor.min_amount.toLocaleString()} – {selectedCorridor.max_amount.toLocaleString()} {selectedCorridor.send_currency}
              </p>
            </div>

            {/* Liquidity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {t('available_liquidity_label')} ({selectedCorridor.receive_currency})
              </label>
              <input
                type="number"
                value={liquidity}
                onChange={e => setLiquidity(e.target.value)}
                placeholder="e.g. 50000"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Total {selectedCorridor.receive_currency} you can fulfill across all orders
              </p>
            </div>

            {/* Payment methods — country-specific chips */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('payment_methods')}
                {selectedCorridor.receive_country && (
                  <span className="ml-1.5 text-xs font-normal text-gray-400">
                    for {selectedCorridor.receive_country}
                  </span>
                )}
              </label>
              <div className="bg-gray-50 rounded-xl p-3 flex flex-wrap gap-2">
                {availablePayments.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => togglePayment(m)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      payments.includes(m)
                        ? 'bg-[#177945] text-white border-[#177945] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/40 hover:text-[#177945]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {payments.length === 0 && (
                <p className="text-[10px] text-gray-400 mt-1">Tap to select the payment methods you accept</p>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> {t('saving')}</>
                ) : existing ? t('update_listing') : t('create_listing')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
