'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, AlertTriangle, Eye, EyeOff, Trash2, X, CheckCircle2, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { performPlatformReset, type ResetOptions } from '@/actions/reset'

interface Props {
  adminEmail: string
}

type Step = 'idle' | 'confirm1' | 'confirm2' | 'done'

const EXTENDED_OPTIONS: { key: keyof ResetOptions; label: string; description: string; danger: 'high' | 'extreme' }[] = [
  {
    key: 'deleteOffers',
    label: 'Delete all offers',
    description: 'Sellers will need to re-create their exchange rate listings',
    danger: 'high',
  },
  {
    key: 'deleteCollectionAccounts',
    label: 'Delete collection accounts',
    description: 'HOXA bank/mobile money accounts buyers pay into. Corridors will break until re-linked.',
    danger: 'high',
  },
  {
    key: 'deleteCorridors',
    label: 'Delete all corridors',
    description: 'Disables the platform entirely — no exchanges can be started until corridors are recreated',
    danger: 'extreme',
  },
  {
    key: 'deleteSellerProfiles',
    label: 'Delete seller profiles',
    description: 'Removes all seller approvals and offers. Sellers must reapply to trade again.',
    danger: 'extreme',
  },
  {
    key: 'deleteUserAccounts',
    label: 'Delete all user accounts',
    description: 'Permanently deletes every non-admin user from the platform. They cannot log in again.',
    danger: 'extreme',
  },
  {
    key: 'resetSettings',
    label: 'Reset settings to defaults',
    description: 'Restores platform fee, timeouts, operating hours, and status to factory defaults',
    danger: 'high',
  },
]

const CONFIRM_WORD = 'RESET'

export default function ResetClient({ adminEmail }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [confirmWord, setConfirmWord] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showExtended, setShowExtended] = useState(false)
  const [options, setOptions] = useState<ResetOptions>({})

  const confirmWordMatch = confirmWord === CONFIRM_WORD
  const anyExtendedSelected = Object.values(options).some(Boolean)

  function toggleOption(key: keyof ResetOptions) {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleReset() {
    if (!confirmWordMatch) return
    setError('')
    setLoading(true)

    const result = await performPlatformReset(password, confirmWord, options)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      setStep('idle')
      setPassword('')
      setConfirmWord('')
      return
    }

    setStep('done')
    setLoading(false)
  }

  if (step === 'done') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Platform Reset Complete</h2>
        <p className="text-gray-400 text-sm mb-6">
          All selected data has been permanently cleared.
        </p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-6 py-2.5 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">

      {/* Warning card */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <p className="font-bold text-red-800 text-sm">Danger Zone — Irreversible Action</p>
            <p className="text-red-600 text-xs mt-0.5">
              This permanently deletes platform data. It cannot be undone.
            </p>
          </div>
        </div>

        {/* Core reset items */}
        <div className="bg-white/60 rounded-xl p-4 space-y-1.5 text-xs text-red-700">
          <p className="font-semibold text-red-800 mb-2">Always deleted:</p>
          <p>• All transactions (all statuses)</p>
          <p>• All ratings and reviews</p>
          <p>• All notifications</p>
          <p>• All buyer-seller watches</p>
          <p>• Seller stats reset (transactions, completion rate, avg response)</p>
          <p>• Buyer fraud flags and claim counts reset</p>
        </div>

        {/* Extended options toggle */}
        <button
          type="button"
          onClick={() => setShowExtended(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/60 hover:bg-white/80 text-xs font-semibold text-red-800 transition-colors border border-red-100"
        >
          <span className="flex items-center gap-2">
            {anyExtendedSelected && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {Object.values(options).filter(Boolean).length}
              </span>
            )}
            Also delete (optional)
          </span>
          {showExtended ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showExtended && (
          <div className="space-y-2">
            {EXTENDED_OPTIONS.map(opt => {
              const active = !!options[opt.key]
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleOption(opt.key)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? opt.danger === 'extreme'
                        ? 'border-red-400 bg-red-100'
                        : 'border-orange-300 bg-orange-50'
                      : 'border-red-100 bg-white/50 hover:bg-white/80'
                  }`}
                >
                  <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    active
                      ? opt.danger === 'extreme' ? 'bg-red-500' : 'bg-orange-500'
                      : 'border-2 border-red-300'
                  }`}>
                    {active && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${
                      active
                        ? opt.danger === 'extreme' ? 'text-red-800' : 'text-orange-800'
                        : 'text-red-700'
                    }`}>
                      {opt.label}
                      {opt.danger === 'extreme' && (
                        <span className="ml-1.5 text-[9px] font-bold bg-red-500 text-white px-1 py-0.5 rounded">NUCLEAR</span>
                      )}
                    </p>
                    <p className="text-[11px] text-red-500 mt-0.5">{opt.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Password field */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 mb-0.5">Admin Password Verification</p>
          <p className="text-xs text-gray-400">Enter your password to confirm your identity before proceeding</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Password for <span className="text-gray-900 font-semibold">{adminEmail}</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your admin password"
              className="w-full px-4 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-xs font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={() => {
            if (!password.trim()) { setError('Password is required'); return }
            setError('')
            setStep('confirm1')
          }}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Trash2 size={15} />
          Reset Platform Data
        </button>
      </div>

      {/* First confirmation modal */}
      {step === 'confirm1' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Are you absolutely sure?</p>
                  <p className="text-gray-400 text-xs">This cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setStep('idle')} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 space-y-1">
              <p className="font-semibold mb-1">You are about to permanently delete:</p>
              <p>• All transactions, ratings, notifications, and activity data</p>
              {options.deleteOffers && <p>• All seller offers</p>}
              {options.deleteCollectionAccounts && <p>• All collection accounts</p>}
              {options.deleteCorridors && <p>• All exchange corridors</p>}
              {options.deleteSellerProfiles && <p>• All seller profiles and approvals</p>}
              {options.deleteUserAccounts && <p className="font-bold text-red-800">• ALL non-admin user accounts (permanent)</p>}
              {options.resetSettings && <p>• Platform settings will be reset to defaults</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('idle')}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('confirm2')}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:opacity-90"
              >
                Yes, continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Second confirmation modal — type RESET */}
      {step === 'confirm2' && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert size={20} className="text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Final confirmation</p>
                  <p className="text-gray-400 text-xs">Type the word below to proceed</p>
                </div>
              </div>
              <button onClick={() => { setStep('idle'); setConfirmWord('') }} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-2">Type exactly:</p>
              <p className="font-mono text-2xl font-bold text-red-600 tracking-widest">{CONFIRM_WORD}</p>
            </div>

            <div>
              <input
                type="text"
                value={confirmWord}
                onChange={e => setConfirmWord(e.target.value.toUpperCase())}
                placeholder={`Type ${CONFIRM_WORD} to confirm`}
                className={`w-full px-4 py-2.5 text-sm border rounded-xl focus:outline-none font-mono tracking-widest text-center transition-colors ${
                  confirmWord.length > 0 && !confirmWordMatch
                    ? 'border-red-300 bg-red-50 focus:border-red-400'
                    : confirmWordMatch
                    ? 'border-green-400 bg-green-50 focus:border-green-400'
                    : 'border-gray-200 focus:border-red-400'
                }`}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setStep('idle'); setConfirmWord('') }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={!confirmWordMatch || loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Trash2 size={14} /> Execute Reset</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
