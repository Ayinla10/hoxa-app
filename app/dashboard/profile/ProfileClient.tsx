'use client'

import { User, Mail, Phone, Globe, Shield, Bell, CheckCircle2, MessageCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import BackButton from '@/components/ui/BackButton'

interface Props {
  email: string
  fullName: string
  phone: string
  country: string
}

function ReadOnlyField({ icon: Icon, label, value, note }: { icon: any; label: string; value: string; note?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <div className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-100 text-sm text-gray-700 bg-gray-50 cursor-default select-none">
          {value || '—'}
        </div>
      </div>
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  )
}

export default function ProfileClient({ email, fullName, phone, country }: Props) {
  const { t } = useI18n()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('nav_profile')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('buyer_account')}</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-xl">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900">{fullName}</h2>
            <p className="text-gray-400 text-xs">{email}</p>
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 size={12} className="text-green-500" />
              <span className="text-green-600 text-xs font-medium">Verified</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#F7F9F8] rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Phone</p>
            <p className="text-gray-900 font-medium">{phone || '—'}</p>
          </div>
          <div className="bg-[#F7F9F8] rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Country</p>
            <p className="text-gray-900 font-medium">{country || '—'}</p>
          </div>
        </div>
      </div>

      {/* Personal info — read-only */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center">
            <User size={16} className="text-[#177945]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Personal Information</h2>
            <p className="text-gray-400 text-xs">Contact support to update your details</p>
          </div>
        </div>

        <ReadOnlyField icon={User}  label="Full Name" value={fullName} note="Contact support to change your name" />
        <ReadOnlyField icon={Mail}  label="Email"     value={email} />
        <ReadOnlyField icon={Phone} label="Phone"     value={phone}    note="Contact support to change your phone number" />
        <ReadOnlyField icon={Globe} label="Country"   value={country}  note="Contact support to change your country" />

        <a
          href="/dashboard/support"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#177945]/30 text-[#177945] text-sm font-medium hover:bg-[#177945]/5 transition-colors"
        >
          <MessageCircle size={14} /> Contact Support to Update Info
        </a>
      </div>

      {/* Preferences — Language */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center">
            <Globe size={16} className="text-[#177945]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('language')}</h2>
            <p className="text-gray-400 text-xs">{t('choose_language')}</p>
          </div>
        </div>
        <LanguageSwitcher variant="page" />
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Shield size={16} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('security')}</h2>
            <p className="text-gray-400 text-xs">{t('security_sub')}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">{t('security_soon')}</p>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('notification_settings')}</h2>
            <p className="text-gray-400 text-xs">{t('notification_sub')}</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">{t('notification_soon')}</p>
      </div>
    </div>
  )
}
