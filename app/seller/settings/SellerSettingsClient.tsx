'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import {
  Globe, Zap, Loader2, Clock,
  CheckCircle2, AlertCircle, ChevronDown, Lock, Eye, EyeOff,
} from 'lucide-react'
import { updateAutoAcceptRules, updateAvailabilitySchedule } from '@/actions/listings'
import { createClient } from '@/lib/supabase/client'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

const DEFAULT_HOURS = { open: '08:00', close: '20:00', enabled: true }
const WEEKEND_HOURS = { open: '10:00', close: '18:00', enabled: false }

const TIMEZONES = [
  'Africa/Accra', 'Africa/Abidjan', 'Africa/Dakar', 'Africa/Bamako',
  'Africa/Ouagadougou', 'Africa/Niamey', 'Africa/Lome', 'Africa/Cotonou',
  'Africa/Douala', 'Africa/Libreville', 'Africa/Brazzaville', 'Africa/Bangui',
  'Africa/Malabo', 'Africa/Ndjamena',
]

interface Props {
  autoAcceptEnabled: boolean
  autoAcceptMaxAmount: number | null
  weeklyHours: Record<string, { open: string; close: string; enabled: boolean }> | null
  timezone: string
}

export default function SellerSettingsClient({
  autoAcceptEnabled, autoAcceptMaxAmount, weeklyHours, timezone,
}: Props) {
  const { t } = useI18n()
  const router = useRouter()

  const initSchedule = (): Record<string, { open: string; close: string; enabled: boolean }> => {
    if (weeklyHours) return weeklyHours as any
    return Object.fromEntries(DAYS.map(d => [
      d,
      ['saturday', 'sunday'].includes(d) ? WEEKEND_HOURS : DEFAULT_HOURS,
    ]))
  }

  const [autoAccept, setAutoAccept] = useState(autoAcceptEnabled)
  const [maxAmount, setMaxAmount] = useState<string>(autoAcceptMaxAmount?.toString() ?? '')
  const [savingAuto, setSavingAuto] = useState(false)

  const [schedule, setSchedule] = useState(initSchedule)
  const [tz, setTz] = useState(timezone)
  const [savingSchedule, setSavingSchedule] = useState(false)

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string; section: string } | null>(null)

  function flash(type: 'success' | 'error', text: string, section: string) {
    setMsg({ type, text, section })
    setTimeout(() => setMsg(null), 3500)
  }

  // ── Auto-accept ───────────────────────────────────────────
  async function saveAutoAccept() {
    setSavingAuto(true)
    const res = await updateAutoAcceptRules({
      auto_accept_enabled: autoAccept,
      auto_accept_max_amount: maxAmount ? Number(maxAmount) : null,
    })
    if (res?.error) flash('error', res.error, 'auto')
    else { flash('success', 'Auto-accept rules saved.', 'auto'); router.refresh() }
    setSavingAuto(false)
  }

  // ── Schedule ──────────────────────────────────────────────
  function toggleDay(day: string) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }))
  }
  function setHour(day: string, field: 'open' | 'close', val: string) {
    setSchedule(s => ({ ...s, [day]: { ...s[day], [field]: val } }))
  }

  async function saveSchedule() {
    setSavingSchedule(true)
    const res = await updateAvailabilitySchedule({ weekly_hours: schedule as any, timezone: tz })
    if (res?.error) flash('error', res.error, 'schedule')
    else { flash('success', 'Schedule saved.', 'schedule'); router.refresh() }
    setSavingSchedule(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{t('nav_settings')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('settings_sub')}</p>
      </div>

      {/* Auto-Accept */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#18824a]/10 flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-[#18824a]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-gray-900">Auto-Accept Requests</h2>
                <p className="text-gray-400 text-xs mt-0.5">Accept incoming requests automatically. Improves your response ranking.</p>
              </div>
              <button
                onClick={() => setAutoAccept(v => !v)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${autoAccept ? 'bg-[#18824a]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${autoAccept ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Max amount threshold */}
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Max amount to auto-accept <span className="text-gray-400 font-normal">(leave blank = no limit)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-40 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10"
                />
                <span className="text-gray-400 text-sm">GHS</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">Requests above this amount will need manual approval even if auto-accept is on.</p>
            </div>

            {msg?.section === 'auto' && <FeedbackMsg msg={msg} />}

            <button
              onClick={saveAutoAccept}
              disabled={savingAuto}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18824a] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {savingAuto ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save Rules'}
            </button>
          </div>
        </div>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Availability Schedule</h2>
            <p className="text-gray-400 text-xs mt-0.5">Set the hours you're available to accept and fulfill exchanges.</p>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Timezone</label>
          <div className="relative">
            <select
              value={tz}
              onChange={e => setTz(e.target.value)}
              className="w-full appearance-none px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:border-[#18824a] pr-9"
            >
              {TIMEZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Day rows */}
        <div className="space-y-2">
          {DAYS.map(day => {
            const enabled = schedule[day]?.enabled
            return (
              <div key={day} className={`rounded-xl border transition-colors ${enabled ? 'bg-[#F7F9F8] border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
                {/* Top row: toggle + day name */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <button
                    onClick={() => toggleDay(day)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#18824a]' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className={`text-sm font-semibold ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>{DAY_LABELS[day]}</span>
                  {!enabled && <span className="text-gray-400 text-xs ml-1">— Unavailable</span>}
                </div>
                {/* Time pickers: full width, no indent */}
                {enabled && (
                  <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Open</p>
                      <input
                        type="time"
                        value={schedule[day]?.open ?? '08:00'}
                        onChange={e => setHour(day, 'open', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#18824a] focus:ring-1 focus:ring-[#18824a]/20"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 mb-1">Close</p>
                      <input
                        type="time"
                        value={schedule[day]?.close ?? '20:00'}
                        onChange={e => setHour(day, 'close', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 bg-white focus:outline-none focus:border-[#18824a] focus:ring-1 focus:ring-[#18824a]/20"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {msg?.section === 'schedule' && <FeedbackMsg msg={msg} />}

        <button
          onClick={saveSchedule}
          disabled={savingSchedule}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18824a] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {savingSchedule ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : <><Clock size={13} /> Save Schedule</>}
        </button>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#18824a]/10 flex items-center justify-center">
            <Globe size={16} className="text-[#18824a]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('language')}</h2>
            <p className="text-gray-400 text-xs">{t('display_language')}</p>
          </div>
        </div>
        <LanguageSwitcher variant="page" />
      </div>

      {/* Change password */}
      <ChangePasswordCard />
    </div>
  )
}

// ─────────────────────────────────────────
// Change password
// ─────────────────────────────────────────
function ChangePasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showC, setShowC] = useState(false)
  const [showN, setShowN] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 8) { setError('Min. 8 characters.'); return }
    if (next !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user?.email ?? '', password: current })
    if (signInErr) { setError('Current password incorrect.'); setLoading(false); return }

    const { error: updErr } = await supabase.auth.updateUser({ password: next })
    if (updErr) { setError(updErr.message); setLoading(false); return }

    setSuccess(true)
    setCurrent(''); setNext(''); setConfirm('')
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Lock size={16} className="text-blue-500" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Change Password</h2>
          <p className="text-gray-400 text-xs">Update your login password</p>
        </div>
      </div>

      {success && <FeedbackMsg msg={{ type: 'success', text: 'Password updated!', section: '' }} />}
      {error && <FeedbackMsg msg={{ type: 'error', text: error, section: '' }} />}

      <PasswordField label="Current password" value={current} onChange={setCurrent} show={showC} onToggle={() => setShowC(v => !v)} />
      <PasswordField label="New password" value={next} onChange={setNext} show={showN} onToggle={() => setShowN(v => !v)} placeholder="Min. 8 chars" />
      <PasswordField label="Confirm new password" value={confirm} onChange={setConfirm} />

      <button type="submit" disabled={loading || !current || !next || !confirm}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18824a] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
        {loading ? <><Loader2 size={13} className="animate-spin" /> Updating…</> : <><Lock size={13} /> Update Password</>}
      </button>
    </form>
  )
}

function PasswordField({ label, value, onChange, show, onToggle, placeholder }: {
  label: string; value: string; onChange: (v: string) => void
  show?: boolean; onToggle?: () => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          required
          className="w-full px-3 py-2 pr-9 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10"
        />
        {onToggle && (
          <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}

function FeedbackMsg({ msg }: { msg: { type: 'success' | 'error'; text: string; section?: string } }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm ${
      msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
    }`}>
      {msg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {msg.text}
    </div>
  )
}
