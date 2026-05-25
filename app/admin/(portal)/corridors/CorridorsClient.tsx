'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ArrowRight, Loader2, X, AlertCircle,
  ToggleLeft, ToggleRight, Pencil, Trash2,
  Banknote, ArrowLeftRight, CheckCircle2, Link2,
} from 'lucide-react'
import {
  createCorridor, toggleCorridorActive, updateCorridor,
  createCollectionAccount, updateCollectionAccount,
  toggleCollectionAccountActive, deleteCollectionAccount,
} from '@/actions/corridors'
import { CURRENCY_META } from '@/lib/currency-meta'
import CurrencyFlag from '@/components/ui/CurrencyFlag'
import CurrencySelect from '@/components/ui/CurrencySelect'

const CURRENCY_COUNTRIES: Record<string, { name: string; cc: string }[]> = {
  GHS: [{ name: 'Ghana',           cc: 'gh' }],
  NGN: [{ name: 'Nigeria',         cc: 'ng' }],
  XOF: [
    { name: "Côte d'Ivoire", cc: 'ci' }, { name: 'Senegal',       cc: 'sn' },
    { name: 'Mali',          cc: 'ml' }, { name: 'Burkina Faso',  cc: 'bf' },
    { name: 'Togo',          cc: 'tg' }, { name: 'Benin',         cc: 'bj' },
    { name: 'Niger',         cc: 'ne' }, { name: 'Guinea-Bissau', cc: 'gw' },
  ],
  XAF: [
    { name: 'Cameroon',             cc: 'cm' }, { name: 'Chad',                 cc: 'td' },
    { name: 'Central African Rep.', cc: 'cf' }, { name: 'Republic of Congo',    cc: 'cg' },
    { name: 'Gabon',                cc: 'ga' }, { name: 'Equatorial Guinea',    cc: 'gq' },
  ],
  KES: [{ name: 'Kenya',          cc: 'ke' }],
  UGX: [{ name: 'Uganda',         cc: 'ug' }],
  TZS: [{ name: 'Tanzania',       cc: 'tz' }],
  ZAR: [{ name: 'South Africa',   cc: 'za' }],
  GBP: [{ name: 'United Kingdom', cc: 'gb' }],
  EUR: [
    { name: 'France',  cc: 'fr' }, { name: 'Germany',     cc: 'de' },
    { name: 'Spain',   cc: 'es' }, { name: 'Italy',       cc: 'it' },
    { name: 'Netherlands', cc: 'nl' }, { name: 'Belgium', cc: 'be' },
    { name: 'Portugal', cc: 'pt' }, { name: 'Other EU',  cc: 'eu' },
  ],
  USD: [{ name: 'United States', cc: 'us' }],
  CAD: [{ name: 'Canada',        cc: 'ca' }],
}

const currencyCountry = (code: string) => CURRENCY_META[code]?.country ?? code

export interface CollectionAccount {
  id: string
  country: string
  currency: string
  provider: string
  account_number: string
  account_name: string
  is_active: boolean
  created_at: string
}

export interface Corridor {
  id: string
  send_currency: string
  send_country: string
  receive_currency: string
  receive_country: string
  min_amount: number
  max_amount: number
  is_active: boolean
  collection_account_id: string | null
  hoxa_collection_accounts: CollectionAccount | null
}

type Tab = 'corridors' | 'accounts'

export default function CorridorsClient({
  corridors,
  collectionAccounts,
}: {
  corridors: Corridor[]
  collectionAccounts: CollectionAccount[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('corridors')
  const [showCorridorModal, setShowCorridorModal] = useState(false)
  const [editingCorridor, setEditingCorridor] = useState<Corridor | null>(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<CollectionAccount | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleToggleCorridor(c: Corridor) {
    setTogglingId(c.id)
    await toggleCorridorActive(c.id, !c.is_active)
    router.refresh()
    setTogglingId(null)
  }

  async function handleToggleAccount(a: CollectionAccount) {
    setTogglingId(a.id)
    await toggleCollectionAccountActive(a.id, !a.is_active)
    router.refresh()
    setTogglingId(null)
  }

  async function handleDeleteAccount(a: CollectionAccount) {
    if (!confirm(`Delete "${a.account_name} (${a.provider})"? Any corridors using this account will be unlinked.`)) return
    setDeletingId(a.id)
    await deleteCollectionAccount(a.id)
    router.refresh()
    setDeletingId(null)
  }

  const activeCorridors   = corridors.filter(c => c.is_active)
  const inactiveCorridors = corridors.filter(c => !c.is_active)
  const unlinkedCorridors = corridors.filter(c => !c.collection_account_id)

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('corridors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'corridors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <ArrowLeftRight size={14} /> Corridors
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'corridors' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
            {corridors.length}
          </span>
        </button>
        <button
          onClick={() => setTab('accounts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'accounts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Banknote size={14} /> Collection Accounts
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'accounts' ? 'bg-gray-100 text-gray-600' : 'bg-gray-200 text-gray-500'}`}>
            {collectionAccounts.length}
          </span>
        </button>
      </div>

      {/* ── CORRIDORS TAB ── */}
      {tab === 'corridors' && (
        <div className="space-y-4">
          {/* Warning: unlinked corridors */}
          {unlinkedCorridors.length > 0 && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
              <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-semibold">
                  {unlinkedCorridors.length} corridor{unlinkedCorridors.length > 1 ? 's have' : ' has'} no collection account linked
                </p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Buyers on these corridors won't receive payment instructions. Edit each corridor to link an account.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => { setEditingCorridor(null); setShowCorridorModal(true) }}
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
              {activeCorridors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-green-50/50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-sm font-semibold text-gray-700">Active ({activeCorridors.length})</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {activeCorridors.map(c => (
                      <CorridorRow
                        key={c.id} corridor={c} toggling={togglingId === c.id}
                        onToggle={() => handleToggleCorridor(c)}
                        onEdit={() => { setEditingCorridor(c); setShowCorridorModal(true) }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {inactiveCorridors.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden opacity-70">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    <p className="text-sm font-semibold text-gray-500">Inactive ({inactiveCorridors.length})</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {inactiveCorridors.map(c => (
                      <CorridorRow
                        key={c.id} corridor={c} toggling={togglingId === c.id}
                        onToggle={() => handleToggleCorridor(c)}
                        onEdit={() => { setEditingCorridor(c); setShowCorridorModal(true) }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── COLLECTION ACCOUNTS TAB ── */}
      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-gray-500">
              These are the bank / mobile money accounts buyers send their payment into. Each corridor should be linked to one.
            </p>
            <button
              onClick={() => { setEditingAccount(null); setShowAccountModal(true) }}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              <Plus size={15} /> Add Account
            </button>
          </div>

          {collectionAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
              <Banknote size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No collection accounts yet</p>
              <p className="text-gray-400 text-sm mt-1">Add at least one account so buyers know where to pay</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
              {collectionAccounts.map(a => {
                const usedBy = corridors.filter(c => c.collection_account_id === a.id)
                return (
                  <div key={a.id} className={`px-5 py-4 flex items-start justify-between gap-4 ${!a.is_active ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CurrencyFlag code={a.currency} size={22} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm">{a.account_name}</p>
                          {!a.is_active && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">INACTIVE</span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {a.provider} · <span className="font-mono">{a.account_number}</span>
                        </p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {a.currency} · {a.country}
                        </p>
                        {usedBy.length > 0 ? (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Link2 size={10} className="text-green-500 flex-shrink-0" />
                            <p className="text-[11px] text-green-700 font-medium">
                              Used by: {usedBy.map(c => `${c.send_currency}→${c.receive_currency}`).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-600 mt-1.5 font-medium">⚠ Not linked to any corridor</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setEditingAccount(a); setShowAccountModal(true) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleAccount(a)}
                        disabled={togglingId === a.id}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                          a.is_active
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {togglingId === a.id
                          ? <Loader2 size={12} className="animate-spin" />
                          : a.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {a.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(a)}
                        disabled={deletingId === a.id}
                        className="p-1.5 rounded-lg text-red-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Corridor modal */}
      {showCorridorModal && (
        <CorridorModal
          existing={editingCorridor}
          collectionAccounts={collectionAccounts}
          onClose={() => { setShowCorridorModal(false); setEditingCorridor(null) }}
          onSaved={() => { setShowCorridorModal(false); setEditingCorridor(null); router.refresh() }}
        />
      )}

      {/* Collection account modal */}
      {showAccountModal && (
        <CollectionAccountModal
          existing={editingAccount}
          onClose={() => { setShowAccountModal(false); setEditingAccount(null) }}
          onSaved={() => { setShowAccountModal(false); setEditingAccount(null); router.refresh() }}
        />
      )}
    </>
  )
}

// ── Corridor row ──────────────────────────────────────────────────────────────

function CorridorRow({ corridor: c, toggling, onToggle, onEdit }: {
  corridor: Corridor; toggling: boolean; onToggle: () => void; onEdit: () => void
}) {
  const acc = c.hoxa_collection_accounts
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
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {c.send_country} → {c.receive_country}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Min: {c.min_amount?.toLocaleString()} — Max: {c.max_amount?.toLocaleString()} {c.send_currency}
          </p>
          {acc ? (
            <p className="text-[11px] text-green-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-500" />
              {acc.provider} · <span className="font-mono">{acc.account_number}</span>
            </p>
          ) : (
            <p className="text-[11px] text-amber-600 font-medium mt-1">⚠ No collection account linked</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          <Pencil size={14} />
        </button>
        <button
          onClick={onToggle} disabled={toggling}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
            c.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {toggling ? <Loader2 size={12} className="animate-spin" /> : c.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
          {c.is_active ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  )
}

// ── Corridor modal ────────────────────────────────────────────────────────────

function CorridorModal({ existing, collectionAccounts, onClose, onSaved }: {
  existing: Corridor | null
  collectionAccounts: CollectionAccount[]
  onClose: () => void
  onSaved: () => void
}) {
  const [sendCurrency, setSendCurrency]           = useState(existing?.send_currency ?? '')
  const [receiveCurrency, setReceiveCurrency]     = useState(existing?.receive_currency ?? '')
  const [receiveCountry, setReceiveCountry]       = useState(existing?.receive_country ?? '')
  const [minAmount, setMinAmount]                 = useState(existing?.min_amount?.toString() ?? '')
  const [maxAmount, setMaxAmount]                 = useState(existing?.max_amount?.toString() ?? '')
  const [collectionAccountId, setCollectionAccountId] = useState(existing?.collection_account_id ?? '')
  const [loading, setLoading]                     = useState(false)
  const [error, setError]                         = useState('')

  const sendCountry = currencyCountry(sendCurrency)
  const availableCountries = receiveCurrency ? (CURRENCY_COUNTRIES[receiveCurrency] ?? []) : []

  // Collection accounts that match the send currency
  const matchingAccounts = collectionAccounts.filter(a => a.currency === sendCurrency && a.is_active)
  const allAccounts = collectionAccounts.filter(a => a.is_active)

  function handleReceiveCurrencyChange(code: string) {
    setReceiveCurrency(code)
    const countries = CURRENCY_COUNTRIES[code] ?? []
    setReceiveCountry(countries.length === 1 ? countries[0].name : '')
  }

  function handleSendCurrencyChange(code: string) {
    setSendCurrency(code)
    // Auto-select matching account if only one
    const matching = collectionAccounts.filter(a => a.currency === code && a.is_active)
    if (matching.length === 1) setCollectionAccountId(matching[0].id)
    else setCollectionAccountId('')
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
      collection_account_id: collectionAccountId || undefined,
    }

    const res = existing
      ? await updateCorridor(existing.id, input)
      : await createCorridor(input)

    setLoading(false)
    if (res?.error) return setError(res.error)
    onSaved()
  }

  const accountsToShow = matchingAccounts.length > 0 ? matchingAccounts : allAccounts

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buyer Sends</label>
              <CurrencySelect value={sendCurrency} onChange={handleSendCurrencyChange} placeholder="Select" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Buyer Receives</label>
              <CurrencySelect value={receiveCurrency} onChange={handleReceiveCurrencyChange} placeholder="Select" />
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
                {availableCountries.map(country => (
                  <button
                    key={country.name} type="button"
                    onClick={() => setReceiveCountry(country.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      receiveCountry === country.name
                        ? 'bg-[#18824a] text-white border-[#18824a]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#18824a]/40'
                    }`}
                  >
                    <img src={`https://flagcdn.com/w20/${country.cc}.png`} alt={country.name} width={18} height={12} className="rounded-sm object-cover" />
                    {country.name}
                  </button>
                ))}
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

          {/* Collection account */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Collection Account <span className="text-gray-400 font-normal">(where buyers send payment)</span>
            </label>
            {collectionAccounts.length === 0 ? (
              <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                No collection accounts yet. Add one in the Collection Accounts tab first.
              </div>
            ) : (
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setCollectionAccountId('')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    !collectionAccountId
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${!collectionAccountId ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                    {!collectionAccountId && <div className="w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
                  </div>
                  <span className="text-xs">No account (not recommended)</span>
                </button>
                {(sendCurrency && matchingAccounts.length > 0 ? matchingAccounts : accountsToShow).map(a => (
                  <button
                    key={a.id} type="button"
                    onClick={() => setCollectionAccountId(a.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                      collectionAccountId === a.id
                        ? 'border-[#18824a] bg-[#18824a]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${collectionAccountId === a.id ? 'border-[#18824a] bg-[#18824a]' : 'border-gray-300'}`}>
                      {collectionAccountId === a.id && <div className="w-2 h-2 rounded-full bg-white m-auto mt-0.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{a.account_name}</p>
                      <p className="text-[11px] text-gray-500">{a.provider} · <span className="font-mono">{a.account_number}</span> · {a.currency}</p>
                    </div>
                  </button>
                ))}
                {sendCurrency && matchingAccounts.length === 0 && allAccounts.length > 0 && (
                  <p className="text-[11px] text-amber-600 px-1">No {sendCurrency} accounts found — showing all active accounts</p>
                )}
              </div>
            )}
          </div>

          {/* Limits */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Transaction Limits {sendCurrency ? `(${sendCurrency})` : ''}
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

// ── Collection account modal ──────────────────────────────────────────────────

const PROVIDERS = ['Orange Money', 'Wave', 'MTN Mobile Money', 'Moov Money', 'Free Money', 'Airtel Money', 'M-Pesa', 'Bank Transfer', 'Other']

function CollectionAccountModal({ existing, onClose, onSaved }: {
  existing: CollectionAccount | null
  onClose: () => void
  onSaved: () => void
}) {
  const [currency, setCurrency]           = useState(existing?.currency ?? '')
  const [country, setCountry]             = useState(existing?.country ?? '')
  const [provider, setProvider]           = useState(existing?.provider ?? '')
  const [customProvider, setCustomProvider] = useState('')
  const [accountNumber, setAccountNumber] = useState(existing?.account_number ?? '')
  const [accountName, setAccountName]     = useState(existing?.account_name ?? 'HOXA Secure Account')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')

  const showCustomProvider = provider === 'Other'
  const finalProvider = showCustomProvider ? customProvider : provider

  // Countries for selected currency
  const availableCountries = currency ? (CURRENCY_COUNTRIES[currency] ?? []) : []

  function handleCurrencyChange(code: string) {
    setCurrency(code)
    const countries = CURRENCY_COUNTRIES[code] ?? []
    setCountry(countries.length === 1 ? countries[0].name : '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!currency)       return setError('Select a currency')
    if (!country)        return setError('Select a country')
    if (!finalProvider)  return setError('Enter or select a provider')
    if (!accountNumber)  return setError('Enter the account number')
    if (!accountName)    return setError('Enter the account name')

    setLoading(true)
    const input = { currency, country, provider: finalProvider, account_number: accountNumber, account_name: accountName }
    const res = existing
      ? await updateCollectionAccount(existing.id, input)
      : await createCollectionAccount(input)

    setLoading(false)
    if (res?.error) return setError(res.error)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-bold text-gray-900">{existing ? 'Edit Collection Account' : 'Add Collection Account'}</h2>
            <p className="text-gray-400 text-xs mt-0.5">The account buyers send their payment into</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Currency */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Currency accepted</label>
            <CurrencySelect value={currency} onChange={handleCurrencyChange} placeholder="e.g. XOF, GHS..." />
            <p className="text-[11px] text-gray-400 mt-1">Buyers paying in this currency will be directed to this account</p>
          </div>

          {/* Country */}
          {currency && availableCountries.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Country</label>
              <div className="flex flex-wrap gap-2">
                {availableCountries.map(c => (
                  <button
                    key={c.name} type="button"
                    onClick={() => setCountry(c.name)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      country === c.name
                        ? 'bg-[#18824a] text-white border-[#18824a]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#18824a]/40'
                    }`}
                  >
                    <img src={`https://flagcdn.com/w20/${c.cc}.png`} alt={c.name} width={16} height={11} className="rounded-sm" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Provider */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Provider</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PROVIDERS.map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setProvider(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    provider === p
                      ? 'bg-[#18824a] text-white border-[#18824a]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#18824a]/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {showCustomProvider && (
              <input
                type="text" value={customProvider} onChange={e => setCustomProvider(e.target.value)}
                placeholder="Enter provider name"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10"
              />
            )}
          </div>

          {/* Account number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Number / Phone</label>
            <input
              type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
              placeholder="e.g. 07XXXXXXXX or IBAN..."
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-mono text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10"
            />
          </div>

          {/* Account name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Account Name</label>
            <input
              type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
              placeholder="e.g. HOXA Secure Account"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10"
            />
            <p className="text-[11px] text-gray-400 mt-1">This is what the buyer sees as the payee name</p>
          </div>

          {/* Preview */}
          {currency && country && finalProvider && accountNumber && accountName && (
            <div className="bg-[#18824a]/5 border border-[#18824a]/20 rounded-xl p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#18824a] mb-2">Buyer will see:</p>
              <div className="flex items-center gap-2">
                <CurrencyFlag code={currency} size={18} />
                <p className="text-sm font-bold text-gray-900">{currency} · {country}</p>
              </div>
              <p className="text-xs text-gray-700">Provider: <span className="font-semibold">{finalProvider}</span></p>
              <p className="text-xs text-gray-700">Account: <span className="font-mono font-semibold">{accountNumber}</span></p>
              <p className="text-xs text-gray-700">Name: <span className="font-semibold">{accountName}</span></p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : existing ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
