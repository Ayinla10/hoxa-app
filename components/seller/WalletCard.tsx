'use client'

import { useState } from 'react'
import { Eye, EyeOff, Plus, PauseCircle, BarChart2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import { pauseAllOffers } from '@/actions/listings'

interface Props {
  liquidity: number
  pendingSettlements: number
  dailyVolume: number
  currency?: string
  onAddListing?: () => void
}

export default function WalletCard({ liquidity, pendingSettlements, dailyVolume, currency = 'GHS', onAddListing }: Props) {
  const [hidden, setHidden] = useState(false)
  const [pausing, setPausing] = useState(false)
  const router = useRouter()
  const { t } = useI18n()
  const fmt = (n: number) => hidden ? '••••••' : n.toLocaleString('en-GH', { minimumFractionDigits: 2 })

  async function handlePauseAll() {
    setPausing(true)
    await pauseAllOffers()
    router.refresh()
    setPausing(false)
  }

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-[#177945] to-[#1a9152] shadow-xl shadow-[#177945]/20 text-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5">{t('available_liquidity')}</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight">{currency} {fmt(liquidity)}</span>
            <button onClick={() => setHidden(v => !v)} className="mb-1 text-white/50 hover:text-white transition-colors">
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          <span className="text-white font-bold text-base">H</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-6 mb-6">
        <div>
          <p className="text-white/50 text-xs mb-0.5">{t('pending_settlements')}</p>
          <p className="text-white font-semibold text-sm">{currency} {fmt(pendingSettlements)}</p>
        </div>
        <div className="w-px bg-white/20" />
        <div>
          <p className="text-white/50 text-xs mb-0.5">{t('daily_volume')}</p>
          <p className="text-white font-semibold text-sm">{currency} {fmt(dailyVolume)}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={onAddListing ?? (() => router.push('/seller/listings'))}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
        >
          <Plus size={13} /> {t('add_listing')}
        </button>
        <button
          onClick={handlePauseAll}
          disabled={pausing}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          {pausing ? <Loader2 size={13} className="animate-spin" /> : <PauseCircle size={13} />} {t('pause_all')}
        </button>
        <button
          onClick={() => router.push('/seller/analytics')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
        >
          <BarChart2 size={13} /> {t('nav_analytics')}
        </button>
      </div>
    </div>
  )
}
