'use client'

import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

interface Props {
  fullName: string
  greeting: string
  successfulExchanges: number
  pendingVerification: number
  activeTransactions: number
  avgCompletionMins: number
}

export default function ExchangeOverviewCard({
  fullName, greeting, activeTransactions, pendingVerification,
}: Props) {
  const { t } = useI18n()
  const first = fullName.split(' ')[0] ?? fullName

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] text-white w-full max-w-full">
      <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full border border-white/8 pointer-events-none hidden sm:block" />
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border border-white/8 pointer-events-none hidden sm:block" />

      <div className="relative px-5 py-5 sm:px-7 sm:py-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          {activeTransactions > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-300/10 border border-amber-300/20 px-2 py-0.5 rounded-full mb-2 w-fit">
              <span className="w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
              {activeTransactions} exchange{activeTransactions > 1 ? 's' : ''} in progress
            </span>
          )}
          <p className="text-white/55 text-sm">{greeting},</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-0.5">{first} 👋</h1>
          <p className="text-white/40 text-xs mt-1">{t('exchange_activity')}</p>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Link
              href="/dashboard/marketplace"
              className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-white text-[#18824a] text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              {t('start_exchange')} <ArrowRight size={14} />
            </Link>
            {activeTransactions > 0 && (
              <Link
                href="/dashboard/transactions"
                className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-white/12 border border-white/15 text-white text-sm font-medium hover:bg-white/20 transition-colors"
              >
                {t('track_active')}
              </Link>
            )}
            {pendingVerification > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                <p className="text-amber-200 text-xs font-medium">{pendingVerification} {t('awaiting_verification')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-11 h-11 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center flex-shrink-0 self-start">
          <ShieldCheck size={18} className="text-green-300" />
        </div>
      </div>
    </div>
  )
}
