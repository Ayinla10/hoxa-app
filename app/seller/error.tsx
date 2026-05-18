'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export default function SellerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useI18n()

  useEffect(() => {
    console.error('Seller portal error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h2 className="text-gray-900 font-bold text-lg mb-1">{t('something_wrong')}</h2>
        <p className="text-gray-400 text-sm mb-6">
          {t('unexpected_error')}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#18824a] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <RefreshCcw size={14} />
          {t('try_again')}
        </button>
      </div>
    </div>
  )
}
