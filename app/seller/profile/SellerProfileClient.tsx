'use client'

import { User, Mail, Phone, Globe, Shield, MessageCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import Link from 'next/link'
import BackButton from '@/components/ui/BackButton'

interface Props {
  email: string
  fullName: string
  phone: string
  country: string
  score: number
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

export default function SellerProfileClient({ email, fullName, phone, country, score }: Props) {
  const { t } = useI18n()

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <BackButton href="/seller/dashboard" />
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('nav_profile')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('seller_account')} · {t('reputation')} {score}/100</p>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 mb-1">{t('language')}</h2>
        <p className="text-gray-400 text-sm mb-4">{t('choose_language')}</p>
        <LanguageSwitcher variant="page" />
      </div>

      {/* Personal info — read-only */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center">
            <User size={16} className="text-[#177945]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('personal_info')}</h2>
            <p className="text-gray-400 text-xs">Contact support to update your details</p>
          </div>
        </div>

        <ReadOnlyField icon={User}  label={t('full_name')} value={fullName} note="Contact support to change your name" />
        <ReadOnlyField icon={Mail}  label={t('email')}     value={email} />
        <ReadOnlyField icon={Phone} label={t('phone')}     value={phone}    note="Contact support to change your phone number" />
        <ReadOnlyField icon={Globe} label={t('country')}   value={country}  note="Contact support to change your country" />

        <Link
          href="/seller/support"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#177945]/30 text-[#177945] text-sm font-medium hover:bg-[#177945]/5 transition-colors"
        >
          <MessageCircle size={14} /> Contact Support to Update Info
        </Link>
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
    </div>
  )
}
