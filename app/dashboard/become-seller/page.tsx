'use client'

import { useState } from 'react'
import { applyAsSeller } from '@/actions/profile'
import { Loader2, ShieldCheck, CheckCircle2, Star, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

const CURRENCIES = ['GHS', 'CFA', 'USD', 'EUR']
const PAYMENT_METHODS = ['Mobile Money (MTN)', 'Mobile Money (Vodafone)', 'Mobile Money (AirtelTigo)', 'Bank Transfer', 'Wave', 'Orange Money']

export default function BecomeSellerPage() {
  const router = useRouter()
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([])
  const [selectedPayments, setSelectedPayments] = useState<string[]>([])
  const [dailyLimit, setDailyLimit] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function toggle<T>(arr: T[], item: T, set: (v: T[]) => void) {
    set(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedCurrencies.length === 0) return setError('Select at least one currency.')
    if (selectedPayments.length === 0) return setError('Select at least one payment method.')
    setError('')
    setLoading(true)

    const result = await applyAsSeller({
      currencies: selectedCurrencies,
      payment_methods: selectedPayments,
      daily_limit: parseFloat(dailyLimit) || 0,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
        <p className="text-gray-500 mb-6">Our team will review your application and notify you within 24 hours.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[#177945] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
        <p className="text-gray-500 mt-1">List your liquidity and earn from every exchange you fulfil on HOXA.</p>
      </div>

      {/* Benefits */}
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: ShieldCheck, label: 'Escrow Protected', desc: 'Every deal is secured' },
          { icon: Star, label: 'Build Reputation', desc: 'Score grows with trades' },
          { icon: Zap, label: 'Fast Earnings', desc: 'Get paid per fulfilment' },
        ].map(b => (
          <div key={b.label} className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
            <b.icon size={20} className="text-[#177945] mx-auto mb-2" />
            <p className="font-semibold text-gray-900 text-sm">{b.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{b.desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Currencies */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Currencies you trade</label>
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggle(selectedCurrencies, c, setSelectedCurrencies)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  selectedCurrencies.includes(c)
                    ? 'bg-[#177945] text-white border-[#177945]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Payment methods you accept</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => toggle(selectedPayments, m, setSelectedPayments)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  selectedPayments.includes(m)
                    ? 'bg-[#177945] text-white border-[#177945]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Daily limit */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-1.5">Estimated daily volume (GHS)</label>
          <input
            type="number"
            value={dailyLimit}
            onChange={e => setDailyLimit(e.target.value)}
            placeholder="e.g. 10000"
            min="0"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
          />
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <div className="flex items-start gap-2 text-xs text-gray-400 bg-[#F7F9F8] p-3 rounded-xl">
          <ShieldCheck size={14} className="text-[#177945] mt-0.5 flex-shrink-0" />
          <span>Your application will be reviewed by the HOXA team. You'll be notified once approved. All sellers are KYC verified.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}
