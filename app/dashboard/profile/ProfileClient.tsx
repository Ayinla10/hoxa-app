'use client'

import { useState } from 'react'
import { User, Mail, Phone, Globe, Save } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { updateProfile } from '@/actions/profile'

interface Props {
  email: string
  fullName: string
  phone: string
  country: string
}

export default function ProfileClient({ email, fullName, phone, country }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState(fullName)
  const [ph, setPh] = useState(phone)
  const [ct, setCt] = useState(country)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateProfile({ full_name: name, phone: ph, country: ct })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('nav_profile')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('buyer_account')}</p>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">{t('language')}</h2>
        <p className="text-gray-400 text-sm mb-4">Choose your preferred language for the dashboard.</p>
        <LanguageSwitcher variant="page" />
      </div>

      {/* Profile info */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <h2 className="font-semibold text-gray-900">Personal Information</h2>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
          <div className="relative">
            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={email} disabled
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 text-sm text-gray-400 bg-gray-50 cursor-not-allowed" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={ph} onChange={e => setPh(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Country</label>
          <div className="relative">
            <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={ct} onChange={e => setCt(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10" />
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          <Save size={14} />
          {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
