'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ArrowRight, Loader2, X, AlertCircle, ToggleLeft, ToggleRight, Pencil, MapPin } from 'lucide-react'
import { createCorridor, toggleCorridorActive, updateCorridor } from '@/actions/corridors'
import { CURRENCY_META } from '@/lib/currency-meta'
import CurrencyFlag from '@/components/ui/CurrencyFlag'
import CurrencySelect from '@/components/ui/CurrencySelect'

// Countries that use each currency — allows one currency to serve many destinations
const CURRENCY_COUNTRIES: Record<string, { name: string; cc: string }[]> = {
  GHS: [{ name: 'Ghana',           cc: 'gh' }],
  NGN: [{ name: 'Nigeria',         cc: 'ng' }],
  XOF: [
    { name: "Côte d'Ivoire",  cc: 'ci' },
    { name: 'Senegal',        cc: 'sn' },
    { name: 'Mali',           cc: 'ml' },
    { name: 'Burkina Faso',   cc: 'bf' },
    { name: 'Togo',           cc: 'tg' },
    { name: 'Benin',          cc: 'bj' },
    { name: 'Niger',          cc: 'ne' },
    { name: 'Guinea-Bissau',  cc: 'gw' },
  ],
  XAF: [
    { name: 'Cameroon',             cc: 'cm' },
    { name: 'Chad',                 cc: 'td' },
    { name: 'Central African Rep.', cc: 'cf' },
    { name: 'Republic of Congo',    cc: 'cg' },
    { name: 'Gabon',                cc: 'ga' },
    { name: 'Equatorial Guinea',    cc: 'gq' },
  ],
  KES: [{ name: 'Kenya',        cc: 'ke' }],
  UGX: [{ name: 'Uganda',       cc: 'ug' }],
  TZS: [{ name: 'Tanzania',     cc: 'tz' }],
  ZAR: [{ name: 'South Africa', cc: 'za' }],
  GBP: [{ name: 'United Kingdom', cc: 'gb' }],
  EUR: [
    { name: 'France',      cc: 'fr' },
    { name: 'Germany',     cc: 'de' },
    { name: 'Spain',       cc: 'es' },
    { name: 'Italy',       cc: 'it' },
    { name: 'Netherlands', cc: 'nl' },
    { name: 'Belgium',     cc: 'be' },
    { name: 'Portugal',    cc: 'pt' },
    { name: 'Other EU',    cc: 'eu' },
  ],
  USD: [{ name: 'United States', cc: 'us' }],
  CAD: [{ name: 'Canada',        cc: 'ca' }],
}

const currencyCountry = (code: string) => CURRENCY_META[code]?.country ?? code

interface Corridor {
  id: string
  send_currency: string
  send_country: string
  receive_currency: string
  receive_country: string
  min_amount: number
  max_amount: number
  is_active: boolean
}

export default function CorridorsClient({ corridors }: { corridors: Corridor[] }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Corridor | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggle(c: Corridor) {
    setTogglingId(c.id)
    await toggleCorridorActive(c.id, !c.is_active)
    router.refresh()
    setTogglingId(null)
  }

  const active   = corridors.filter(c => c.is_active)
  const inactive = corridors.filter(c => !c.is_active)

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus size={15} /> Add Corridor
        </button>
      </div>

      {corridors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <p className="text-gray-500 font-medium">No corridors yet</p>
          <p className="text-gray-400 text-sm mt-1">Add a corridor to enable the marketplace</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-green-50/50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <p className="text-sm font-semibold text-gray-700">Active ({active.length})</p>
              </div>
              <div className="divide-y divide-gray-50">
                {active.map(c => (
                  <CorridorRow key={c.id} corridor={c} toggling={togglingId === c.id}
                    onToggle={() => handleToggle(c)}
                    onEdit={() => { setEditing(c); setShowModal(true) }} />
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden opacity-70">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                <p className="text-sm font-semibold text-gray-500">Inactive ({inactive.length})</p>
              </div>
              <div className="divide-y divide-gray-50">
                {inactive.map(c => (
                  <CorridorRow key={c.id} corridor={c} toggling={togglingId === c.id}
                    onToggle={() => handleToggle(c)}
                    onEdit={() => { setEditing(c); setShowModal(true) }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CorridorModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => { setShowModal(false); setEditing(null); router.refresh() }}
        />
      )}
    </>
  )
}

function CorridorRow({ corridor: c, toggling, onToggle, onEdit }: {
  corridor: Corridor; toggling: boolean; onToggle: () => void; onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.is_active ? 'bg-green-400' : 'bg-gray-300'}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <CurrencyFlag code={c.send_currency} size={18} />
            <span className="font-bold text-gray-900 text-sm">{c.send_currency}</span>
            <ArrowRight size={12} className="text-gray-400" />
            <CurrencyFlag code={c.receive_currency} size={18} />
            <span className="font-bold text-gray-900 text-sm">{c.receive_currency}</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={10} /> {c.receive_country}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Min: {c.min_amount?.toLocaleString()} — Max: {c.max_amount?.toLocaleString()} {c.send_currency}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onToggle} disabled={toggling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            c.is_active
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}>
          {toggling ? <Loader2 size={12} className="animate-spin" /> :
            c.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {c.is_active ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  )
}

function CorridorModal({ existing, onClose, onSaved }: {
  existing: Corridor | null; onClose: () => void; onSaved: () => void
}) {
  const [sendCurrency, setSendCurrency]       = useState(existing?.send_currency ?? '')
  const [receiveCurrency, setReceiveCurrency] = useState(existing?.receive_currency ?? '')
  const [receiveCountry, setReceiveCountry]   = useState(existing?.receive_country ?? '')
  const [minAmount, setMinAmount]             = useState(existing?.min_amount?.toString() ?? '')
  const [maxAmount, setMaxAmount]             = useState(existing?.max_amount?.toString() ?? '')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')

  const sendCountry = currencyCountry(sendCurrency)

  // Countries available for the selected receive currency
  const availableCountries = receiveCurrency ? (CURRENCY_COUNTRIES[receiveCurrency] ?? []) : []

  // Auto-select if only one country available, or clear if currency changed
  function handleReceiveCurrencyChange(code: string) {
    setReceiveCurrency(code)
    const countries = CURRENCY_COUNTRIES[code] ?? []
    // Auto-select if only one option
    setReceiveCountry(countries.length === 1 ? countries[0].name : '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!sendCurrency || !receiveCurrency)      return setError('Select both currencies')
    if (sendCurrency === receiveCurrency)       return setError('Send and receive currencies must differ')
    if (!receiveCountry)                        return setError('Select the destination country')
    if (!minAmount || !maxAmount)               return setError('Enter min and max amounts')
    if (Number(minAmount) >= Number(maxAmount)) return setError('Max must be greater than min')

    setLoading(true)
    const input = {
      send_currency: sendCurrency,
      send_country: sendCountry,
      receive_currency: receiveCurrency,
      receive_country: receiveCountry,
      min_amount: Number(minAmount),
      max_amount: Number(maxAmount),
    }

    const res = existing
      ? await updateCorridor(existing.id, input)
      : await createCorridor(input)

    setLoading(false)
    if (res?.error) return setError(res.error)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">{existing ? 'Edit Corridor' : 'Add Corridor'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Currencies */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buyer Sends</label>
                <CurrencySelect value={sendCurrency} onChange={setSendCurrency} placeholder="Select" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buyer Receives</label>
                <CurrencySelect value={receiveCurrency} onChange={handleReceiveCurrencyChange} placeholder="Select" />
              </div>
            </div>
          </div>

          {/* Destination country */}
          {receiveCurrency && availableCountries.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">
                {availableCountries.length === 1
                  ? 'Only one country uses this currency.'
                  : `${availableCountries.length} countries use ${receiveCurrency}. Pick the destination.`}
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCountries.map(country => {
                  const isSelected = receiveCountry === country.name
                  return (
                    <button
                      key={country.name}
                      type="button"
                      onClick={() => setReceiveCountry(country.name)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                        isSelected
                          ? 'bg-[#18824a] text-white border-[#18824a]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#18824a]/40'
                      }`}
                    >
                      <img
                        src={`https://flagcdn.com/w20/${country.cc}.png`}
                        alt={country.name}
                        width={18}
                        height={12}
                        className="rounded-sm object-cover"
                      />
                      {country.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          {sendCurrency && receiveCurrency && receiveCountry && sendCurrency !== receiveCurrency && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#18824a]/5 border border-[#18824a]/20 rounded-xl flex-wrap">
              <CurrencyFlag code={sendCurrency} size={18} />
              <span className="text-sm font-bold text-[#18824a]">{sendCurrency}</span>
              <span className="text-xs text-gray-400">{sendCountry}</span>
              <ArrowRight size={14} className="text-[#18824a]" />
              <CurrencyFlag code={receiveCurrency} size={18} />
              <span className="text-sm font-bold text-[#18824a]">{receiveCurrency}</span>
              <span className="text-xs text-gray-400">{receiveCountry}</span>
            </div>
          )}

          {/* Limits */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Transaction Limits {sendCurrency ? `(${sendCurrency})` : ''}
            </p>
            <p className="text-xs text-gray-400 mb-2">
              The minimum and maximum a buyer can send in a single transaction on this corridor.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Min Amount</label>
                <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)}
                  placeholder="e.g. 100" required min="1"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Max Amount</label>
                <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)}
                  placeholder="e.g. 50000" required min="1"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : existing ? 'Save Changes' : 'Add Corridor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
