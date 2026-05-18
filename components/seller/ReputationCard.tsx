'use client'

import { ShieldCheck, Zap, Star } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

interface Props {
  score: number
  completionRate: number
  tier: string
  verified: boolean
  fastResponder: boolean
}

export default function ReputationCard({ score, completionRate, tier, verified, fastResponder }: Props) {
  const { t } = useI18n()
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-gray-900 font-bold text-sm mb-4">{t('reputation')}</h3>

      <div className="flex items-center gap-5 mb-4">
        {/* Score ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="7" />
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#177945"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{score}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-gray-400 text-xs">{t('seller_tier')}</p>
            <p className="text-gray-900 font-semibold text-sm">{tier}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">{t('completion_rate')}</p>
            <p className="text-gray-900 font-semibold text-sm">{completionRate}%</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {verified && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <ShieldCheck size={11} /> {t('verified_seller')}
          </span>
        )}
        {fastResponder && (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
            <Zap size={11} /> {t('fast_responder')}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
          <Star size={11} /> {tier}
        </span>
      </div>
    </div>
  )
}
