'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      {sent ? (
        <div className="text-center py-4">
          <CheckCircle2 size={48} className="text-[#0F6A3D] mx-auto mb-4" />
          <h2 className="text-gray-900 font-bold text-xl mb-2">Check your email</h2>
          <p className="text-gray-500 text-sm mb-6">We sent a password reset link to <strong>{email}</strong></p>
          <Link href="/login" className="text-[#0F6A3D] font-semibold hover:underline text-sm">Back to login</Link>
        </div>
      ) : (
        <>
          <Link href="/login" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
            <ArrowLeft size={14} /> Back to login
          </Link>
          <h1 className="text-gray-900 font-bold text-2xl mb-1">Reset password</h1>
          <p className="text-gray-500 text-sm mb-7">Enter your email and we'll send you a reset link.</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#0F6A3D] focus:ring-2 focus:ring-[#0F6A3D]/10 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0F6A3D] to-[#1F8A4D] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
