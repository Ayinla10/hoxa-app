'use client'

import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Bell, Shield, Globe } from 'lucide-react'

export default function BuyerSettingsPage() {
  const { t } = useI18n()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('nav_settings')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">Manage your account preferences</p>
      </div>

      {/* Language */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#177945]/10 flex items-center justify-center">
            <Globe size={16} className="text-[#177945]" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{t('language')}</h2>
            <p className="text-gray-400 text-xs">Dashboard display language</p>
          </div>
        </div>
        <LanguageSwitcher variant="page" />
      </div>

      {/* Notifications placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Bell size={16} className="text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notifications</h2>
            <p className="text-gray-400 text-xs">Email and push preferences</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Notification settings coming soon.</p>
      </div>

      {/* Security placeholder */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Shield size={16} className="text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Security</h2>
            <p className="text-gray-400 text-xs">Password and 2FA</p>
          </div>
        </div>
        <p className="text-gray-400 text-sm">Security settings coming soon.</p>
      </div>
    </div>
  )
}
