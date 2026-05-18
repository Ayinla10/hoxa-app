'use client'

import { useState } from 'react'
import { Pencil, Pause, Play, Loader2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { toggleOfferAvailability } from '@/actions/listings'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'

export interface Listing {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  liquidity: number
  minAmount: number
  maxAmount: number
  status: 'active' | 'paused' | 'busy'
}

interface Props {
  listing: Listing
  onEdit?: () => void
}

export default function ListingCard({ listing, onEdit }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState(listing.status)
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    const newAvailable = status === 'paused'
    setToggling(true)
    setStatus(newAvailable ? 'active' : 'paused')
    const res = await toggleOfferAvailability(listing.id, newAvailable)
    if (res?.error) setStatus(status)
    else router.refresh()
    setToggling(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-gray-900 font-bold text-base">
            {listing.fromCurrency} → {listing.toCurrency}
          </p>
          <p className="text-gray-400 text-xs">#{listing.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Rate & Liquidity */}
      <div className="bg-[#F7F9F8] rounded-xl p-3 mb-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-gray-400 text-xs mb-0.5">{t('rate')}</p>
          <p className="text-gray-900 font-semibold">{listing.rate}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">{t('liquidity')}</p>
          <p className="text-gray-900 font-semibold">{listing.liquidity.toLocaleString()} {listing.toCurrency}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">{t('min')}</p>
          <p className="text-gray-700 text-sm">{listing.minAmount.toLocaleString()} {listing.fromCurrency}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-0.5">{t('max')}</p>
          <p className="text-gray-700 text-sm">{listing.maxAmount.toLocaleString()} {listing.fromCurrency}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onEdit ?? (() => router.push('/seller/listings'))}
          aria-label={`Edit ${listing.fromCurrency} to ${listing.toCurrency} listing`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors"
        >
          <Pencil size={12} /> {t('edit')}
        </button>
        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label={status === 'paused' ? 'Resume listing' : 'Pause listing'}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {toggling ? <Loader2 size={12} className="animate-spin" /> : status === 'paused' ? <><Play size={12} /> {t('resume')}</> : <><Pause size={12} /> {t('pause')}</>}
        </button>
      </div>
    </div>
  )
}
