'use client'

import Link from 'next/link'
import { ShieldCheck, Clock, CheckCircle2, RefreshCw, ArrowRight } from 'lucide-react'
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
  fullName, greeting, successfulExchanges, pendingVerification,
  activeTransactions, avgCompletionMins,
}: Props) {
  const { t } = useI18n()
  const lastName = fullName.split(' ').pop() ?? fullName

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] text-white">
      {/* Decorative rings */}
      <div className="absolute -top-14 -right-14 w-56 h-56 rounded-full border border-white/8 pointer-events-none" />
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full border border-white/8 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-24 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />

      <div className="relative px-6 py-6 lg:px-8 lg:py-7">
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-white/50 font-semibold uppercase tracking-widest">Exchange Hub</span>
              {activeTransactions > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-300/10 border border-amber-300/20 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-amber-300 animate-pulse" />
                  {activeTransactions} active
                </span>
              )}
            </div>
            <p className="text-white/55 text-sm">{greeting}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-0.5">{lastName} 👋</h1>
            <p className="text-white/40 text-xs mt-1">{t('exchange_activity')}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-green-300" />
          </div>
        </div>

        {/* Stats + CTA */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          {/* Stat tiles */}
          <div className="flex gap-3 flex-1">
            <div className="flex-1 bg-white/10 border border-white/12 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 size={11} className="text-green-400" />
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{t('completed')}</p>
              </div>
              <p className="text-white font-bold text-2xl leading-none">{successfulExchanges}</p>
              <p className="text-white/35 text-[10px] mt-1">{t('exchanges')}</p>
            </div>

            <div className="flex-1 bg-white/10 border border-white/12 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <RefreshCw size={11} className={activeTransactions > 0 ? 'text-amber-400' : 'text-white/30'} />
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{t('active')}</p>
              </div>
              <p className={`font-bold text-2xl leading-none ${activeTransactions > 0 ? 'text-amber-300' : 'text-white'}`}>
                {activeTransactions}
              </p>
              {activeTransactions > 0
                ? <div className="flex items-center gap-1 mt-1"><span className="w-1 h-1 bg-amber-400 rounded-full animate-pulse" /><span className="text-amber-400/70 text-[10px]">{t('in_progress')}</span></div>
                : <p className="text-white/35 text-[10px] mt-1">{t('in_progress')}</p>
              }
            </div>

            <div className="flex-1 bg-white/10 border border-white/12 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={11} className="text-blue-400" />
                <p className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">{t('avg_speed')}</p>
              </div>
              <p className="text-white font-bold text-2xl leading-none">{avgCompletionMins > 0 ? avgCompletionMins : '—'}</p>
              <p className="text-white/35 text-[10px] mt-1">{avgCompletionMins > 0 ? t('minutes') : t('no_data')}</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 lg:w-44">
            {pendingVerification > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-xl px-3 py-2">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse flex-shrink-0" />
                <p className="text-amber-200 text-xs font-medium">
                  {pendingVerification} {t('awaiting_verification')}
                </p>
              </div>
            )}
            <Link href="/dashboard/marketplace"
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-white text-[#18824a] text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm shadow-black/10">
              {t('start_exchange')} <ArrowRight size={14} />
            </Link>
            {activeTransactions > 0 && (
              <Link href="/dashboard/transactions"
                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-white/12 border border-white/15 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                {t('track_active')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
