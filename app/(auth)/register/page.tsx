'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const COUNTRIES = [
  'Ghana', 'Senegal', "Côte d'Ivoire", 'Mali', 'Burkina Faso',
  'Niger', 'Togo', 'Benin', 'Cameroon', 'Guinea-Bissau',
  'Chad', 'Gabon', 'Republic of Congo', 'Central African Republic', 'Equatorial Guinea',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: '', password: '', confirm_password: '' })
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

    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
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

  const fields = [
    { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Phone / WhatsApp', type: 'tel', placeholder: '+233 XX XXX XXXX' },
  ]

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
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={form[f.key as keyof typeof form]}
              onChange={e => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0F6A3D] focus:ring-2 focus:ring-[#0F6A3D]/10 transition-all"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
          <select
            value={form.country}
            onChange={e => update('country', e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#0F6A3D] focus:ring-2 focus:ring-[#0F6A3D]/10 transition-all bg-white"
          >
            <option value="">Select country</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => update('password', e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0F6A3D] focus:ring-2 focus:ring-[#0F6A3D]/10 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={form.confirm_password}
            onChange={e => update('confirm_password', e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0F6A3D] focus:ring-2 focus:ring-[#0F6A3D]/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0F6A3D] to-[#1F8A4D] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#0F6A3D] font-semibold hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
