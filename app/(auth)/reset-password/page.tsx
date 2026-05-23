'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash.
    // createClient() detects it automatically and creates a session.
    const supabase = createClient()

    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
      setChecking(false)
    })

    // Fallback: if already in a session (e.g. page reloaded)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
        setChecking(false)
      } else {
        setChecking(false)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    // Redirect to dashboard after short delay
    setTimeout(() => {
      router.push('/dashboard')
    }, 2500)
  }

  if (checking) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <Loader2 size={32} className="animate-spin text-[#177945] mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Verifying reset link…</p>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
        <h2 className="text-gray-900 font-bold text-xl mb-2">Invalid or expired link</h2>
        <p className="text-gray-500 text-sm mb-6">
          This password reset link has expired or is invalid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Request New Link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
        <CheckCircle2 size={48} className="text-[#177945] mx-auto mb-4" />
        <h2 className="text-gray-900 font-bold text-xl mb-2">Password updated!</h2>
        <p className="text-gray-500 text-sm mb-2">Your password has been changed successfully.</p>
        <p className="text-gray-400 text-xs">Redirecting to your dashboard…</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#177945]/10 flex items-center justify-center">
          <Lock size={18} className="text-[#177945]" />
        </div>
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Set new password</h1>
          <p className="text-gray-400 text-xs">Choose a strong password</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : 'Update Password'}
        </button>
      </form>
    </div>
  )
}
