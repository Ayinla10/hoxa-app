'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user!.id).single()
    if (profile?.role !== 'admin') {
      await supabase.auth.signOut()
      setError('You do not have admin access.')
      setLoading(false)
      return
    }
    window.location.href = '/admin/dashboard'
  }

  return (
    <div className="min-h-screen bg-[#0B1F16] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">HOXA Admin</h1>
            <p className="text-gray-400 text-xs">Secure administrator portal</p>
          </div>
          <span className="ml-auto text-[10px] text-red-500 font-bold bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">ADMIN</span>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm border bg-red-50 border-red-100 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="admin@hoxa.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all pr-11"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in...</> : 'Sign In to Admin Portal'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Access is invitation-only. Contact your super admin if you need an account.
        </p>
      </div>
    </div>
  )
}
