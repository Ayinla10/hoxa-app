'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Lock, Eye, EyeOff, Loader2, CheckCircle2,
  AlertCircle, User, ChevronRight, Bell, Mail, Smartphone,
} from 'lucide-react'
import { savePushSubscription, removePushSubscription } from '@/actions/push'
import { saveNotificationPreferences } from '@/actions/profile'

interface Props {
  email: string
  notifPrefs: { push: boolean; email: boolean }
}

export default function SettingsClient({ email, notifPrefs }: Props) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your account settings and preferences</p>
      </div>

      {/* Account quick links */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">Account</h2>
        </div>
        <Link
          href="/dashboard/profile"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#177945]/10 flex items-center justify-center">
              <User size={14} className="text-[#177945]" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Profile</p>
              <p className="text-xs text-gray-400">Name, phone, country, language</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      {/* Notification preferences */}
      <NotificationPrefsCard initialPrefs={notifPrefs} email={email} />

      {/* Change password */}
      <ChangePasswordForm email={email} />
    </div>
  )
}

// ─── Notification Preferences ────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output.buffer as ArrayBuffer
}

function NotificationPrefsCard({ initialPrefs, email }: { initialPrefs: { push: boolean; email: boolean }; email: string }) {
  const [pushEnabled, setPushEnabled] = useState(initialPrefs.push)
  const [emailEnabled, setEmailEnabled] = useState(initialPrefs.email)
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!('Notification' in window)) {
      setPushPermission('unsupported')
    } else {
      setPushPermission(Notification.permission)
    }
  }, [])

  async function handlePushToggle(enabled: boolean) {
    setPushEnabled(enabled)

    if (enabled) {
      if (pushPermission === 'unsupported') return
      if (pushPermission === 'denied') {
        setError('Push notifications are blocked in your browser. Allow them in browser settings then try again.')
        setPushEnabled(false)
        return
      }

      try {
        const permission = await Notification.requestPermission()
        setPushPermission(permission)
        if (permission !== 'granted') {
          setPushEnabled(false)
          return
        }

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return

        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        const json = sub.toJSON()
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user && json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await savePushSubscription(user.id, {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          })
        }
      } catch {
        setError('Could not enable push notifications. Please try again.')
        setPushEnabled(false)
        return
      }
    } else {
      // Unsubscribe
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        if (reg) {
          const sub = await reg.pushManager.getSubscription()
          if (sub) {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) await removePushSubscription(user.id, sub.endpoint)
            await sub.unsubscribe()
          }
        }
      } catch { /* silent */ }
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await saveNotificationPreferences({ push: pushEnabled, email: emailEnabled })
    setSaving(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <Bell size={14} className="text-purple-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Notification Preferences</h2>
          <p className="text-gray-400 text-xs">Choose how you want to be notified</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {saved && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            <CheckCircle2 size={15} /> Preferences saved.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Push toggle */}
        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${pushEnabled ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <Smartphone size={16} className={pushEnabled ? 'text-purple-500' : 'text-gray-400'} />
            <div>
              <p className="text-sm font-medium text-gray-900">Push Notifications</p>
              <p className="text-xs text-gray-400">
                {pushPermission === 'unsupported'
                  ? 'Not supported in this browser'
                  : pushPermission === 'denied'
                  ? 'Blocked — allow in browser settings'
                  : 'Real-time alerts on your device'}
              </p>
            </div>
          </div>
          <button
            onClick={() => handlePushToggle(!pushEnabled)}
            disabled={pushPermission === 'unsupported' || pushPermission === 'denied'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${pushEnabled ? 'bg-purple-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Email toggle */}
        <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-colors ${emailEnabled ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex items-center gap-3">
            <Mail size={16} className={emailEnabled ? 'text-blue-500' : 'text-gray-400'} />
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-400">Transaction updates sent to {email}</p>
            </div>
          </div>
          <button
            onClick={() => setEmailEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${emailEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

// ─── Change Password ──────────────────────────────────────────────────────────

function ChangePasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (next !== confirm) { setError('New passwords do not match.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current })
    if (signInErr) { setError('Current password is incorrect.'); setLoading(false); return }
    const { error: updateErr } = await supabase.auth.updateUser({ password: next })
    if (updateErr) { setError(updateErr.message); setLoading(false); return }
    setSuccess(true)
    setCurrent(''); setNext(''); setConfirm('')
    setLoading(false)
    setTimeout(() => setSuccess(false), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Lock size={14} className="text-blue-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">Change Password</h2>
          <p className="text-gray-400 text-xs">Update your login password</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm">
            <CheckCircle2 size={15} /> Password updated successfully.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Current Password</label>
          <div className="relative">
            <input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)}
              placeholder="••••••••" required
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
          <div className="relative">
            <input type={showNext ? 'text' : 'password'} value={next} onChange={e => setNext(e.target.value)}
              placeholder="Min. 8 characters" required
              className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
            <button type="button" onClick={() => setShowNext(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showNext ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm New Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
        </div>

        <button type="submit" disabled={loading || !current || !next || !confirm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : <><Lock size={14} /> Update Password</>}
        </button>
      </div>
    </form>
  )
}
