'use client'

import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Bell, Shield, Globe } from 'lucide-react'

export default function SellerSettingsClient() {
  const { t } = useI18n()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900">{t('nav_settings')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('settings_sub')}</p>
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

      {/* Notifications placeholder */}
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

      {/* Security placeholder */}
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
