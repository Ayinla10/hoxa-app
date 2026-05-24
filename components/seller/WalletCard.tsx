'use client'

import { useState } from 'react'
import { Eye, EyeOff, Plus, PauseCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import { pauseAllOffers } from '@/actions/listings'

interface Props {
  sellerName?: string
  liquidity: number
  pendingSettlements: number
  dailyVolume: number
  currency?: string
  onAddListing?: () => void
}

export default function WalletCard({ sellerName, liquidity, pendingSettlements, dailyVolume, currency = 'GHS', onAddListing }: Props) {
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
          <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1.5">Seller Account</p>
          <h2 className="text-2xl font-bold tracking-tight leading-tight truncate max-w-[200px]">
            {sellerName ?? 'My Account'}
          </h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <p className="text-white/60 text-xs">{t('available_liquidity')}:</p>
            <span className="text-white text-xs font-semibold">{currency} {fmt(liquidity)}</span>
            <button onClick={() => setHidden(v => !v)} className="text-white/50 hover:text-white transition-colors">
              {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
        </div>
        <img src="/icons/icon-192.png" alt="HOXA" className="w-10 h-10 rounded-xl" />
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
      <div className="flex gap-3">
        <button
          onClick={onAddListing ?? (() => router.push('/seller/listings'))}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
        >
          <Plus size={15} className="flex-shrink-0" /> {t('add_listing')}
        </button>
        <button
          onClick={handlePauseAll}
          disabled={pausing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {pausing ? <Loader2 size={15} className="animate-spin flex-shrink-0" /> : <PauseCircle size={15} className="flex-shrink-0" />} {t('pause_all')}
        </button>
      </div>
    </div>
  )
}
