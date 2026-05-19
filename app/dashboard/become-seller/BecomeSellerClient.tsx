'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle2, ShieldCheck, Shield, Crown, Zap,
  ChevronDown, ArrowLeft, AlertCircle,
} from 'lucide-react'
import { applyAsSeller } from '@/actions/profile'

interface Props {
  fullName: string
  country: string
  momoNetworks: string[]
  currencyPairs: string[]
  existingStatus: string | null
}

export default function BecomeSellerClient({ fullName, country, momoNetworks, currencyPairs, existingStatus }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    business_name: '',
    legal_name: fullName,
    date_of_birth: '',
    momo_network: '',
    momo_number: '',
    daily_volume: '',
  })
  const [selectedPairs, setSelectedPairs] = useState<string[]>([])
  const [agreements, setAgreements] = useState({ terms: false, escrow: false, accuracy: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function togglePair(pair: string) {
    setSelectedPairs(prev => prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.legal_name.trim()) return setError('Full legal name is required.')
    if (!form.date_of_birth) return setError('Date of birth is required.')
    if (!form.momo_network) return setError('Please select a MoMo network.')
    if (!form.momo_number.trim()) return setError('Mobile Money number is required.')
    if (selectedPairs.length === 0) return setError('Select at least one currency pair.')
    if (!agreements.terms || !agreements.escrow || !agreements.accuracy) return setError('Please accept all agreements.')

    setLoading(true)

    // Extract individual currencies from pairs for the seller record
    const currencies = [...new Set(selectedPairs.flatMap(p => p.split(' ⇄ ')))]

    const result = await applyAsSeller({
      currencies,
      payment_methods: [form.momo_network],
      daily_limit: parseFloat(form.daily_volume) || 0,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    setSuccess(true)
  }

  // Already pending
  if (existingStatus === 'pending') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Under Review</h2>
        <p className="text-gray-500 mb-6">Your Tier 1 seller application is being reviewed. You will be notified once approved.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[#177945] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Return to Dashboard
        </button>
      </div>
    )
  }

  // Already rejected
  if (existingStatus === 'rejected') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Application Not Approved</h2>
        <p className="text-gray-500 mb-6">Your previous application was not approved. Please contact support for more information.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 rounded-xl bg-[#177945] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          Return to Dashboard
        </button>
      </div>
    )
  }

  // Success
  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Seller Application Submitted</h2>
        <p className="text-gray-500 mb-6">Your Tier 1 seller application is under review. You will be notified once approved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => router.push('/dashboard')}
            className="px-6 py-2.5 rounded-xl bg-[#177945] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back link */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Become a Seller</h1>
        <p className="text-gray-500 mt-1.5">Exchange currencies securely with verified buyers across the marketplace.</p>
      </div>

      {/* Tier Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Tier 1 */}
        <div className="relative bg-white rounded-2xl border-2 border-green-200 shadow-sm p-5 ring-2 ring-green-100">
          <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
            Fast Approval
          </span>
          <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Shield size={16} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Tier 1 Seller</p>
              <p className="text-gray-400 text-[10px]">Basic access</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-3">Basic seller access with limited trading capacity.</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-900 text-[10px] uppercase tracking-wide mb-1">Requirements</p>
            <p>• Full legal name</p>
            <p>• Date of birth</p>
            <p>• Mobile Money number</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            <p>✓ Limited currency trading</p>
            <p>✓ Lower transaction limits</p>
            <p>✓ Basic seller visibility</p>
          </div>
        </div>

        {/* Tier 2 */}
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 opacity-75">
          <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
          <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShieldCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Tier 2 Seller</p>
              <p className="text-gray-400 text-[10px]">Enhanced verification</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-3">Enhanced verification for higher limits and more trust.</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-900 text-[10px] uppercase tracking-wide mb-1">Additional Requirements</p>
            <p>• Government-issued ID</p>
            <p>• Selfie verification</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            <p>✓ Higher transaction limits</p>
            <p>✓ Better visibility</p>
            <p>✓ More currency pairs</p>
          </div>
        </div>

        {/* Tier 3 */}
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm p-5 opacity-75">
          <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-purple-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
            Coming Soon
          </span>
          <div className="flex items-center gap-2 mb-3 mt-1">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Crown size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm">Tier 3 Seller</p>
              <p className="text-gray-400 text-[10px]">Advanced verification</p>
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-3">Advanced verification for high-volume sellers.</p>
          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="font-semibold text-gray-900 text-[10px] uppercase tracking-wide mb-1">Additional Requirements</p>
            <p>• Proof of address</p>
            <p>• Enhanced compliance review</p>
            <p>• Business verification (optional)</p>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            <p>✓ Highest limits</p>
            <p>✓ Priority visibility</p>
            <p>✓ Advanced privileges</p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div>
            <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Zap size={16} className="text-[#177945]" /> Seller Setup
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">Apply for Tier 1 seller access</p>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Basic Information</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={form.business_name} onChange={e => update('business_name', e.target.value)} placeholder="Your business or trading name"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Legal Name <span className="text-red-400">*</span></label>
              <input type="text" value={form.legal_name} onChange={e => update('legal_name', e.target.value)} placeholder="As it appears on your ID" required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth <span className="text-red-400">*</span></label>
              <input type="date" value={form.date_of_birth} onChange={e => update('date_of_birth', e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
              <span className="text-gray-400 text-xs">Country:</span>
              <span className="text-gray-900 text-sm font-semibold">{country || 'Not set'}</span>
              <span className="text-gray-400 text-[10px]">(from your profile)</span>
            </div>
          </div>
        </div>

        {/* MoMo Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Mobile Money Details</p>

          {momoNetworks.length > 0 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">MoMo Network <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={form.momo_network} onChange={e => update('momo_network', e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all bg-white appearance-none pr-10">
                    <option value="">Select your network</option>
                    {momoNetworks.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Money Number <span className="text-red-400">*</span></label>
                <input type="tel" value={form.momo_number} onChange={e => update('momo_number', e.target.value)} placeholder="e.g. 024 XXX XXXX" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
              </div>
            </>
          ) : (
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
              <p className="font-medium">No MoMo networks configured for {country || 'your country'}</p>
              <p className="text-xs mt-0.5 text-amber-600">Please contact support or wait for admin to configure networks for your region.</p>
            </div>
          )}
        </div>

        {/* Currency Pairs */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Currency Pairs</p>
            <p className="text-gray-400 text-xs mt-0.5">Select the currency pairs you want to trade</p>
          </div>

          {currencyPairs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currencyPairs.map(pair => {
                const selected = selectedPairs.includes(pair)
                return (
                  <button key={pair} type="button" onClick={() => togglePair(pair)}
                    className={`px-3 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selected
                        ? 'bg-[#177945]/10 text-[#177945] border-[#177945] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/40'
                    }`}>
                    {selected && <CheckCircle2 size={13} className="inline mr-1.5 -mt-0.5" />}
                    {pair}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm">
              <p className="font-medium">No currency pairs configured</p>
              <p className="text-xs mt-0.5 text-amber-600">Please wait for admin to configure available trading pairs.</p>
            </div>
          )}
        </div>

        {/* Seller Preferences */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">Seller Preferences</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Estimated Daily Trading Volume</label>
            <input type="number" value={form.daily_volume} onChange={e => update('daily_volume', e.target.value)} placeholder="e.g. 10000" min="0"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all" />
            <p className="text-gray-400 text-xs mt-1.5">This helps us understand your trading scale. It does not limit your actual volume.</p>
          </div>
        </div>

        {/* Agreements */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
          <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Agreements</p>

          {[
            { key: 'terms' as const, label: 'I agree to HOXA seller terms', link: '#' },
            { key: 'escrow' as const, label: 'I agree to marketplace escrow policies', link: '#' },
            { key: 'accuracy' as const, label: 'I confirm my submitted information is accurate' },
          ].map(a => (
            <label key={a.key} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreements[a.key]}
                onChange={() => setAgreements(prev => ({ ...prev, [a.key]: !prev[a.key] }))}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#177945] focus:ring-[#177945] transition-colors"
              />
              <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                {a.label}
                {'link' in a && a.link && (
                  <a href={a.link} className="text-[#177945] underline ml-1" onClick={e => e.stopPropagation()}>View</a>
                )}
              </span>
            </label>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle size={15} className="flex-shrink-0" /> {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#177945]/20"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting Application...</> : 'Submit Seller Application'}
        </button>
      </form>
    </div>
  )
}
