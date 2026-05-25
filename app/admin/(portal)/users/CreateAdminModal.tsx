'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ShieldCheck, Eye, EyeOff, Loader2, Check } from 'lucide-react'
import { createAdminUser } from '@/actions/admin'

const PERMISSIONS = [
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'View all platform transactions',
  },
  {
    id: 'payment_review',
    label: 'Payment Review',
    description: 'Confirm or reject buyer payment proofs',
  },
  {
    id: 'settlement',
    label: 'Settlement',
    description: 'Release seller settlement funds',
  },
  {
    id: 'disputes',
    label: 'Disputes',
    description: 'View and resolve buyer/seller disputes',
  },
  {
    id: 'corridors',
    label: 'Corridors',
    description: 'Manage exchange corridors and rates',
  },
  {
    id: 'users',
    label: 'User Management',
    description: 'View, search and change user roles',
  },
  {
    id: 'sellers',
    label: 'Seller Applications',
    description: 'Approve or reject seller applications',
  },
  {
    id: 'risk',
    label: 'Risk Control',
    description: 'Manage risk flags and fraud limits',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    description: 'View and manage platform alerts',
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    description: 'Access platform metrics and exports',
  },
  {
    id: 'activity',
    label: 'Activity Log',
    description: 'View admin audit and activity log',
  },
  {
    id: 'settings',
    label: 'System Settings',
    description: 'Change platform-wide configuration',
  },
  {
    id: 'reset',
    label: 'Platform Reset',
    description: 'Wipe all operational data (danger)',
  },
]

const ALL_PERMISSION_IDS = PERMISSIONS.map(p => p.id)

interface Props {
  onClose: () => void
}

export default function CreateAdminModal({ onClose }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [permissions, setPermissions] = useState<string[]>([])
  const [superAdmin, setSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function togglePermission(id: string) {
    setPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  function toggleSuperAdmin(checked: boolean) {
    setSuperAdmin(checked)
    if (checked) setPermissions(ALL_PERMISSION_IDS)
    else setPermissions([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!superAdmin && permissions.length === 0) {
      setError('Select at least one permission or grant Super Admin access.')
      return
    }
    setLoading(true)
    const result = await createAdminUser({
      ...form,
      permissions: superAdmin ? ['super_admin', ...ALL_PERMISSION_IDS] : permissions,
    })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center">
              <ShieldCheck size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Create Admin Account</h2>
              <p className="text-gray-400 text-xs">Account will be active immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
              <input
                type="text" required
                value={form.first_name}
                onChange={e => set('first_name', e.target.value)}
                placeholder="John"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
              <input
                type="text" required
                value={form.last_name}
                onChange={e => set('last_name', e.target.value)}
                placeholder="Doe"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="admin@hoxa.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Temporary Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'} required minLength={8}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-all"
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-gray-400 text-xs mt-1">Share this with the admin. They should change it after first login.</p>
          </div>

          {/* Permissions */}
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-3">Access Permissions</p>

            {/* Super Admin toggle */}
            <button
              type="button"
              onClick={() => toggleSuperAdmin(!superAdmin)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all mb-3 ${
                superAdmin
                  ? 'border-[#18824a] bg-[#18824a]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                superAdmin ? 'bg-[#18824a]' : 'border-2 border-gray-300'
              }`}>
                {superAdmin && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
              <div className="text-left flex-1">
                <p className={`text-sm font-bold ${superAdmin ? 'text-[#18824a]' : 'text-gray-800'}`}>Super Admin</p>
                <p className="text-xs text-gray-400">Full access to all features including creating other admins</p>
              </div>
              {superAdmin && (
                <span className="text-[10px] font-bold bg-[#18824a] text-white px-2 py-0.5 rounded-full">ALL</span>
              )}
            </button>

            {/* Individual permissions */}
            <div className={`space-y-2 transition-opacity ${superAdmin ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              {PERMISSIONS.map(p => {
                const active = permissions.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePermission(p.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${
                      active
                        ? 'border-[#18824a]/40 bg-[#18824a]/5'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                      active ? 'bg-[#18824a]' : 'border-2 border-gray-300'
                    }`} style={{ width: 18, height: 18 }}>
                      {active && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${active ? 'text-[#18824a]' : 'text-gray-700'}`}>{p.label}</p>
                      <p className="text-gray-400 text-[11px]">{p.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
