'use client'

import { useState } from 'react'
import { updateSetting } from '@/actions/settings'
import { useRouter } from 'next/navigation'
import {
  Clock, Percent, Globe, Store, Smartphone, ArrowLeftRight, Timer,
  Save, Loader2, CheckCircle2, AlertTriangle, Plus, X,
  Lock, CreditCard, ShieldAlert, ReceiptText,
} from 'lucide-react'

interface Props {
  settings: Record<string, any>
}

function SettingCard({
  icon: Icon, iconColor, iconBg, title, description, children,
}: {
  icon: any; iconColor: string; iconBg: string; title: string; description: string; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className={iconColor} />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-gray-400 text-xs mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ loading, saved }: { loading: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
      {loading ? 'Saving...' : saved ? 'Saved' : 'Save'}
    </button>
  )
}

// Country-specific MoMo networks config
const DEFAULT_MOMO_NETWORKS: Record<string, string[]> = {
  'Ghana': ['MTN Mobile Money', 'Telecel Cash', 'AirtelTigo Money'],
  'Senegal': ['Orange Money', 'Wave', 'Free Money'],
  "Côte d'Ivoire": ['Orange Money', 'MTN Money', 'Moov Money', 'Wave'],
  'Mali': ['Orange Money', 'Moov Money'],
  'Burkina Faso': ['Orange Money', 'Moov Money'],
  'Niger': ['Airtel Money', 'Orange Money'],
  'Togo': ['T-Money', 'Flooz'],
  'Benin': ['MTN MoMo', 'Moov Money'],
  'Cameroon': ['MTN Mobile Money', 'Orange Money'],
  'Guinea-Bissau': ['Orange Money'],
  'Chad': ['Airtel Money', 'Tigo Cash'],
  'Gabon': ['Airtel Money', 'Moov Money'],
  'Republic of Congo': ['MTN Mobile Money', 'Airtel Money'],
  'Central African Republic': ['Orange Money'],
  'Equatorial Guinea': ['BGFI Mobile'],
}

export default function AdminSettingsClient({ settings }: Props) {
  const router = useRouter()

  // V5.1 timing settings
  const [rateLock, setRateLock] = useState(String(settings['rate_lock_duration_seconds'] ?? 600))
  const [paymentWindow, setPaymentWindow] = useState(String(settings['payment_window_duration_seconds'] ?? 1200))
  const [minTapTime, setMinTapTime] = useState(String(settings['minimum_tap_time_seconds'] ?? 30))
  const [receiptAutoConfirm, setReceiptAutoConfirm] = useState(String(settings['receipt_auto_confirm_seconds'] ?? 10800))

  const [timeout, setTimeout_] = useState(String(settings['seller_response_timeout_seconds'] ?? 120))
  const [fallbackSellerId, setFallbackSellerId] = useState(String(settings['admin_fallback_seller_id'] ?? ''))
  const [fee, setFee] = useState(String(settings['platform_fee_percent'] ?? 1.5))
  const [sessionTimeout, setSessionTimeout] = useState(String(settings['session_timeout_minutes'] ?? 15))
  const [marketplaceActive, setMarketplaceActive] = useState(settings['marketplace_active'] === true || settings['marketplace_active'] === 'true')

  // MoMo networks
  const [momoNetworks, setMomoNetworks] = useState<Record<string, string[]>>(
    (settings['momo_networks'] && typeof settings['momo_networks'] === 'object')
      ? settings['momo_networks']
      : DEFAULT_MOMO_NETWORKS
  )
  const [momoNewCountry, setMomoNewCountry] = useState('')
  const [momoNewNetwork, setMomoNewNetwork] = useState('')
  const [momoEditCountry, setMomoEditCountry] = useState<string | null>(null)

  // Currency pairs
  const [currencyPairs, setCurrencyPairs] = useState<string[]>(
    Array.isArray(settings['currency_pairs'])
      ? settings['currency_pairs']
      : ['USD ⇄ GHS', 'EUR ⇄ GHS', 'USDT ⇄ GHS', 'NGN ⇄ GHS', 'XOF ⇄ GHS', 'GBP ⇄ GHS', 'USD ⇄ XOF', 'EUR ⇄ XOF']
  )
  const [newPairFrom, setNewPairFrom] = useState('')
  const [newPairTo, setNewPairTo] = useState('')

  const [loading, setLoading] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function save(key: string, value: any, validate?: () => string | null) {
    if (validate) {
      const err = validate()
      if (err) { setErrors(p => ({ ...p, [key]: err })); return }
    }
    setErrors(p => ({ ...p, [key]: '' }))
    setLoading(key)
    const result = await updateSetting(key, value)
    setLoading(null)
    if (result?.error) {
      setErrors(p => ({ ...p, [key]: result.error! }))
    } else {
      setSaved(key)
      setTimeout(() => setSaved(null), 2000)
      router.refresh()
    }
  }

  function addMomoNetwork(country: string) {
    if (!momoNewNetwork.trim()) return
    const updated = { ...momoNetworks }
    if (!updated[country]) updated[country] = []
    if (updated[country].includes(momoNewNetwork.trim())) return
    updated[country] = [...updated[country], momoNewNetwork.trim()]
    setMomoNetworks(updated)
    setMomoNewNetwork('')
  }

  function removeMomoNetwork(country: string, network: string) {
    const updated = { ...momoNetworks }
    updated[country] = updated[country].filter(n => n !== network)
    if (updated[country].length === 0) delete updated[country]
    setMomoNetworks(updated)
  }

  function addCurrencyPair() {
    if (!newPairFrom.trim() || !newPairTo.trim()) return
    const pair = `${newPairFrom.trim().toUpperCase()} ⇄ ${newPairTo.trim().toUpperCase()}`
    if (currencyPairs.includes(pair)) return
    setCurrencyPairs([...currencyPairs, pair])
    setNewPairFrom('')
    setNewPairTo('')
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-gray-900 font-bold text-lg">Platform Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Changes take effect immediately across the platform.</p>
      </div>

      {/* Seller Response Timeout */}
      <SettingCard
        icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50"
        title="Seller Response Timeout"
        description="How long a seller has to accept or reject a buyer's request before it auto-cancels."
      >
        <form onSubmit={e => { e.preventDefault(); save('seller_response_timeout_seconds', Number(timeout), () => { const n = Number(timeout); if (isNaN(n) || n < 30 || n > 3600) return 'Must be between 30 and 3600 seconds'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={30} max={3600} value={timeout} onChange={e => setTimeout_(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">seconds</span>
            </div>
            <SaveButton loading={loading === 'seller_response_timeout_seconds'} saved={saved === 'seller_response_timeout_seconds'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[60, 120, 180, 300, 600].map(s => (
              <button key={s} type="button" onClick={() => setTimeout_(String(s))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${timeout === String(s) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
          {errors['seller_response_timeout_seconds'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['seller_response_timeout_seconds']}</p>}
        </form>
      </SettingCard>

      {/* Admin Fallback Seller */}
      <SettingCard
        icon={Store} iconColor="text-purple-600" iconBg="bg-purple-50"
        title="Admin Fallback Seller"
        description="When a seller times out, the transaction is automatically reassigned to this seller account (typically an admin-controlled account). Paste the seller record ID from the sellers table."
      >
        <form onSubmit={e => { e.preventDefault(); save('admin_fallback_seller_id', fallbackSellerId) }}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={fallbackSellerId}
              onChange={e => setFallbackSellerId(e.target.value)}
              placeholder="seller UUID (from sellers table)"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm font-mono focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
            />
            <SaveButton loading={loading === 'admin_fallback_seller_id'} saved={saved === 'admin_fallback_seller_id'} />
          </div>
          {!fallbackSellerId && (
            <p className="text-amber-600 text-xs mt-2 flex items-center gap-1">
              <AlertTriangle size={11} /> Not set — timed-out transactions will be cancelled instead of reassigned.
            </p>
          )}
        </form>
      </SettingCard>

      {/* Platform Fee */}
      <SettingCard
        icon={Percent} iconColor="text-blue-600" iconBg="bg-blue-50"
        title="Platform Fee"
        description="Percentage charged by HOXA on each completed exchange."
      >
        <form onSubmit={e => { e.preventDefault(); save('platform_fee_percent', Number(fee), () => { const n = Number(fee); if (isNaN(n) || n < 0 || n > 10) return 'Must be between 0% and 10%'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={0} max={10} step={0.1} value={fee} onChange={e => setFee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
            </div>
            <SaveButton loading={loading === 'platform_fee_percent'} saved={saved === 'platform_fee_percent'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[0.5, 1, 1.5, 2, 2.5].map(f => (
              <button key={f} type="button" onClick={() => setFee(String(f))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${fee === String(f) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {f}%
              </button>
            ))}
          </div>
          {errors['platform_fee_percent'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['platform_fee_percent']}</p>}
        </form>
      </SettingCard>

      {/* Marketplace Status */}
      <SettingCard
        icon={Store} iconColor="text-[#18824a]" iconBg="bg-[#18824a]/10"
        title="Marketplace Status"
        description="When paused, buyers cannot initiate new exchanges. Existing transactions continue."
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${marketplaceActive ? 'text-[#18824a]' : 'text-red-500'}`}>
              {marketplaceActive ? 'Live — accepting new exchanges' : 'Paused — no new exchanges'}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">
              {marketplaceActive ? 'Toggle off to halt all new activity.' : 'Toggle on to resume the marketplace.'}
            </p>
          </div>
          <button
            onClick={() => { const next = !marketplaceActive; setMarketplaceActive(next); save('marketplace_active', next) }}
            disabled={loading === 'marketplace_active'}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${marketplaceActive ? 'bg-[#18824a]' : 'bg-gray-300'} disabled:opacity-50`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${marketplaceActive ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </SettingCard>

      {/* Session Timeout */}
      <SettingCard
        icon={Timer} iconColor="text-rose-600" iconBg="bg-rose-50"
        title="Session Idle Timeout"
        description="Auto-logout users after this many minutes of inactivity. Takes effect on next page load."
      >
        <form onSubmit={e => { e.preventDefault(); save('session_timeout_minutes', Number(sessionTimeout), () => { const n = Number(sessionTimeout); if (isNaN(n) || n < 1 || n > 1440) return 'Must be between 1 and 1440 minutes'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={1} max={1440} value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">minutes</span>
            </div>
            <SaveButton loading={loading === 'session_timeout_minutes'} saved={saved === 'session_timeout_minutes'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[5, 15, 30, 60, 120].map(m => (
              <button key={m} type="button" onClick={() => setSessionTimeout(String(m))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${sessionTimeout === String(m) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {m >= 60 ? `${m / 60}h` : `${m}m`}
              </button>
            ))}
          </div>
          {errors['session_timeout_minutes'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['session_timeout_minutes']}</p>}
        </form>
      </SettingCard>

      {/* Rate Lock Duration */}
      <SettingCard
        icon={Lock} iconColor="text-violet-600" iconBg="bg-violet-50"
        title="Rate Lock Duration"
        description="How long the buyer's exchange rate is locked after a seller accepts. After this window, the rate may be refreshed."
      >
        <form onSubmit={e => { e.preventDefault(); save('rate_lock_duration_seconds', Number(rateLock), () => { const n = Number(rateLock); if (isNaN(n) || n < 60 || n > 3600) return 'Must be between 60 and 3600 seconds'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={60} max={3600} value={rateLock} onChange={e => setRateLock(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">seconds</span>
            </div>
            <SaveButton loading={loading === 'rate_lock_duration_seconds'} saved={saved === 'rate_lock_duration_seconds'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[300, 600, 900, 1800, 3600].map(s => (
              <button key={s} type="button" onClick={() => setRateLock(String(s))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${rateLock === String(s) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s >= 60 ? `${s / 60}m` : `${s}s`}
              </button>
            ))}
          </div>
          {errors['rate_lock_duration_seconds'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['rate_lock_duration_seconds']}</p>}
        </form>
      </SettingCard>

      {/* Payment Window Duration */}
      <SettingCard
        icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50"
        title="Payment Window"
        description="How long a buyer has after tapping 'I've Paid' for ops to confirm payment before the window expires."
      >
        <form onSubmit={e => { e.preventDefault(); save('payment_window_duration_seconds', Number(paymentWindow), () => { const n = Number(paymentWindow); if (isNaN(n) || n < 60 || n > 7200) return 'Must be between 60 and 7200 seconds'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={60} max={7200} value={paymentWindow} onChange={e => setPaymentWindow(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">seconds</span>
            </div>
            <SaveButton loading={loading === 'payment_window_duration_seconds'} saved={saved === 'payment_window_duration_seconds'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[600, 1200, 1800, 3600, 7200].map(s => (
              <button key={s} type="button" onClick={() => setPaymentWindow(String(s))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${paymentWindow === String(s) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s >= 3600 ? `${s / 3600}h` : `${s / 60}m`}
              </button>
            ))}
          </div>
          {errors['payment_window_duration_seconds'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['payment_window_duration_seconds']}</p>}
        </form>
      </SettingCard>

      {/* Minimum Tap Time (Fraud Detection) */}
      <SettingCard
        icon={ShieldAlert} iconColor="text-red-600" iconBg="bg-red-50"
        title="Fraud Detection — Minimum Tap Time"
        description="If a buyer taps 'I've Paid' faster than this threshold, the transaction is flagged as suspicious."
      >
        <form onSubmit={e => { e.preventDefault(); save('minimum_tap_time_seconds', Number(minTapTime), () => { const n = Number(minTapTime); if (isNaN(n) || n < 5 || n > 300) return 'Must be between 5 and 300 seconds'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={5} max={300} value={minTapTime} onChange={e => setMinTapTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">seconds</span>
            </div>
            <SaveButton loading={loading === 'minimum_tap_time_seconds'} saved={saved === 'minimum_tap_time_seconds'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[15, 30, 60, 90, 120].map(s => (
              <button key={s} type="button" onClick={() => setMinTapTime(String(s))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${minTapTime === String(s) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {s}s
              </button>
            ))}
          </div>
          <p className="text-amber-600 text-xs mt-2.5 flex items-center gap-1.5 bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
            <AlertTriangle size={11} /> Transactions tapped faster than this are auto-flagged for manual review.
          </p>
          {errors['minimum_tap_time_seconds'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['minimum_tap_time_seconds']}</p>}
        </form>
      </SettingCard>

      {/* Receipt Auto-Confirm */}
      <SettingCard
        icon={ReceiptText} iconColor="text-teal-600" iconBg="bg-teal-50"
        title="Receipt Auto-Confirm Timeout"
        description="If the buyer doesn't confirm receipt within this window after the seller marks fulfilled, the transaction auto-completes."
      >
        <form onSubmit={e => { e.preventDefault(); save('receipt_auto_confirm_seconds', Number(receiptAutoConfirm), () => { const n = Number(receiptAutoConfirm); if (isNaN(n) || n < 1800 || n > 86400) return 'Must be between 30 minutes and 24 hours'; return null }) }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input type="number" min={1800} max={86400} step={600} value={receiptAutoConfirm} onChange={e => setReceiptAutoConfirm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">seconds</span>
            </div>
            <SaveButton loading={loading === 'receipt_auto_confirm_seconds'} saved={saved === 'receipt_auto_confirm_seconds'} />
          </div>
          <div className="flex gap-2 mt-2.5">
            {[
              { label: '1h',  val: 3600 },
              { label: '3h',  val: 10800 },
              { label: '6h',  val: 21600 },
              { label: '12h', val: 43200 },
              { label: '24h', val: 86400 },
            ].map(({ label, val }) => (
              <button key={val} type="button" onClick={() => setReceiptAutoConfirm(String(val))}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${receiptAutoConfirm === String(val) ? 'bg-[#18824a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {label}
              </button>
            ))}
          </div>
          {errors['receipt_auto_confirm_seconds'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['receipt_auto_confirm_seconds']}</p>}
        </form>
      </SettingCard>

      {/* Currency Pairs */}
      <SettingCard
        icon={ArrowLeftRight} iconColor="text-indigo-600" iconBg="bg-indigo-50"
        title="Currency Pairs"
        description="Trading pairs available to sellers. Sellers can only select from these approved pairs."
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {currencyPairs.map(pair => (
            <span key={pair} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-100">
              {pair}
              <button onClick={() => setCurrencyPairs(currencyPairs.filter(p => p !== pair))} className="text-indigo-400 hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          {currencyPairs.length === 0 && <p className="text-gray-400 text-xs">No pairs configured yet.</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" placeholder="From (e.g. USD)" value={newPairFrom} onChange={e => setNewPairFrom(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all uppercase" maxLength={5} />
          <span className="text-gray-400 text-xs font-bold">⇄</span>
          <input type="text" placeholder="To (e.g. GHS)" value={newPairTo} onChange={e => setNewPairTo(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all uppercase" maxLength={5} />
          <button type="button" onClick={addCurrencyPair}
            className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <Plus size={16} />
          </button>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => save('currency_pairs', currencyPairs)}
            disabled={loading === 'currency_pairs'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === 'currency_pairs' ? <Loader2 size={13} className="animate-spin" /> : saved === 'currency_pairs' ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {loading === 'currency_pairs' ? 'Saving...' : saved === 'currency_pairs' ? 'Saved' : 'Save Pairs'}
          </button>
        </div>
        {errors['currency_pairs'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['currency_pairs']}</p>}
      </SettingCard>

      {/* MoMo Networks */}
      <SettingCard
        icon={Smartphone} iconColor="text-orange-600" iconBg="bg-orange-50"
        title="Mobile Money Networks"
        description="MoMo networks available per country. Sellers see these based on their country."
      >
        <div className="space-y-3 mb-4">
          {Object.entries(momoNetworks).map(([country, networks]) => (
            <div key={country} className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-900">{country}</p>
                <button onClick={() => setMomoEditCountry(momoEditCountry === country ? null : country)}
                  className="text-xs text-[#18824a] font-medium hover:underline">
                  {momoEditCountry === country ? 'Done' : 'Edit'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {networks.map(n => (
                  <span key={n} className="flex items-center gap-1 px-2.5 py-1 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-200">
                    {n}
                    {momoEditCountry === country && (
                      <button onClick={() => removeMomoNetwork(country, n)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={11} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {momoEditCountry === country && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="text" placeholder="Add network..." value={momoNewNetwork} onChange={e => setMomoNewNetwork(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMomoNetwork(country) } }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-[#18824a] transition-all" />
                  <button type="button" onClick={() => addMomoNetwork(country)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
                    <Plus size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add new country */}
        <div className="flex items-center gap-2 mb-3">
          <input type="text" placeholder="Add country..." value={momoNewCountry} onChange={e => setMomoNewCountry(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all" />
          <button type="button" onClick={() => {
            if (!momoNewCountry.trim()) return
            if (momoNetworks[momoNewCountry.trim()]) return
            setMomoNetworks({ ...momoNetworks, [momoNewCountry.trim()]: [] })
            setMomoEditCountry(momoNewCountry.trim())
            setMomoNewCountry('')
          }} className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => save('momo_networks', momoNetworks)}
            disabled={loading === 'momo_networks'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === 'momo_networks' ? <Loader2 size={13} className="animate-spin" /> : saved === 'momo_networks' ? <CheckCircle2 size={13} /> : <Save size={13} />}
            {loading === 'momo_networks' ? 'Saving...' : saved === 'momo_networks' ? 'Saved' : 'Save Networks'}
          </button>
        </div>
        {errors['momo_networks'] && <p className="text-red-500 text-xs mt-2 flex items-center gap-1"><AlertTriangle size={11} /> {errors['momo_networks']}</p>}
      </SettingCard>

      {/* Supported Countries — read only */}
      <SettingCard
        icon={Globe} iconColor="text-purple-600" iconBg="bg-purple-50"
        title="Supported Countries"
        description="Countries eligible to use the HOXA platform."
      >
        <div className="flex flex-wrap gap-2">
          {(Array.isArray(settings['supported_countries']) ? settings['supported_countries'] : []).map((c: string) => (
            <span key={c} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">{c}</span>
          ))}
        </div>
        <p className="text-gray-400 text-xs mt-3">To add or remove countries, contact your developer to update the schema.</p>
      </SettingCard>

    </div>
  )
}
