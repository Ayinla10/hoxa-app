'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'

const COUNTRY_CODES = [
  { name: 'Ghana', iso: 'gh', dial: '+233' },
  { name: 'Senegal', iso: 'sn', dial: '+221' },
  { name: "Côte d'Ivoire", iso: 'ci', dial: '+225' },
  { name: 'Mali', iso: 'ml', dial: '+223' },
  { name: 'Burkina Faso', iso: 'bf', dial: '+226' },
  { name: 'Niger', iso: 'ne', dial: '+227' },
  { name: 'Togo', iso: 'tg', dial: '+228' },
  { name: 'Benin', iso: 'bj', dial: '+229' },
  { name: 'Cameroon', iso: 'cm', dial: '+237' },
  { name: 'Guinea-Bissau', iso: 'gw', dial: '+245' },
  { name: 'Chad', iso: 'td', dial: '+235' },
  { name: 'Gabon', iso: 'ga', dial: '+241' },
  { name: 'Republic of Congo', iso: 'cg', dial: '+242' },
  { name: 'Central African Republic', iso: 'cf', dial: '+236' },
  { name: 'Equatorial Guinea', iso: 'gq', dial: '+240' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    password: '',
    confirm_password: '',
  })
  const [dialCode, setDialCode] = useState(COUNTRY_CODES[0])
  const [showDialDropdown, setShowDialDropdown] = useState(false)

  // Auto-fill country when dial code changes
  function selectDialCode(c: typeof COUNTRY_CODES[number]) {
    setDialCode(c)
    setShowDialDropdown(false)
    update('country', c.name)
  }
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const fullPhone = `${dialCode.dial}${form.phone.replace(/^0+/, '')}`

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: fullPhone,
          country: form.country,
          role: 'buyer',
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-gray-900 font-bold text-2xl mb-1">Create account</h1>
      <p className="text-gray-500 text-sm mb-7">Join HOXA and start exchanging safely</p>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => update('full_name', e.target.value)}
            placeholder="John Doe"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
          />
        </div>

        {/* Phone with dial code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone / WhatsApp</label>
          <div className="flex gap-2">
            {/* Dial code picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDialDropdown(v => !v)}
                className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all whitespace-nowrap"
              >
                <img
                  src={`/flags/${dialCode.iso}.svg`}
                  alt={dialCode.name}
                  className="w-5 h-3.5 object-cover rounded-sm"
                />
                <span>{dialCode.dial}</span>
                <ChevronDown size={12} className="text-gray-400" />
              </button>

              {showDialDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-52 overflow-y-auto">
                  {COUNTRY_CODES.map(c => (
                    <button
                      key={c.iso}
                      type="button"
                      onClick={() => selectDialCode(c)}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <img src={`/flags/${c.iso}.svg`} alt={c.name} className="w-5 h-3.5 object-cover rounded-sm" />
                      <span className="flex-1 text-left">{c.name}</span>
                      <span className="text-gray-400">{c.dial}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Phone number input */}
            <input
              type="tel"
              value={form.phone}
              onChange={e => update('phone', e.target.value)}
              placeholder="XX XXX XXXX"
              required
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
          <select
            value={form.country}
            onChange={e => update('country', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all bg-white"
          >
            <option value="">Select country</option>
            {COUNTRY_CODES.map(c => <option key={c.iso} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={e => update('confirm_password', e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#177945] font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
