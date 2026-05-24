'use client'

import { useState } from 'react'
import { Pencil, Pause, Play, Loader2 } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { toggleOfferAvailability } from '@/actions/listings'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

export interface Listing {
  id: string
  fromCurrency: string
  toCurrency: string
  sendCountry?: string
  receiveCountry?: string
  rate: number
  rateSendRef?: number     // seller's original "sends X" amount
  rateReceiveRef?: number  // seller's original "receives Y" amount
  liquidity: number
  minAmount: number
  maxAmount: number
  status: 'active' | 'paused' | 'busy'
}

const COUNTRY_CC: Record<string, string> = {
  'Ghana': 'gh', 'Nigeria': 'ng', "Côte d'Ivoire": 'ci', 'Senegal': 'sn',
  'Mali': 'ml', 'Burkina Faso': 'bf', 'Togo': 'tg', 'Benin': 'bj',
  'Niger': 'ne', 'Guinea-Bissau': 'gw', 'Cameroon': 'cm', 'Chad': 'td',
  'Central African Rep.': 'cf', 'Republic of Congo': 'cg', 'Gabon': 'ga',
  'Equatorial Guinea': 'gq', 'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz',
  'South Africa': 'za', 'United Kingdom': 'gb', 'France': 'fr', 'United States': 'us',
}

function SmallFlag({ country }: { country: string }) {
  const cc = COUNTRY_CC[country]
  if (!cc) return null
  return <img src={`https://flagcdn.com/w20/${cc}.png`} width={14} height={10} alt={country} className="rounded-sm object-cover flex-shrink-0 inline-block" />
}

interface Props {
  listing: Listing
  onEdit?: () => void
}

/** Shows rate exactly as the seller typed it, e.g. "10,000 XOF = 218 GHS" */
function RateDisplay({ listing }: { listing: Listing }) {
  const { fromCurrency, toCurrency, rate, rateSendRef, rateReceiveRef } = listing

  if (rateSendRef && rateReceiveRef) {
    // Exact seller-entered values
    return (
      <p className="text-gray-900 font-semibold text-sm flex items-center gap-1.5 flex-wrap">
        <CurrencyFlag code={fromCurrency} size={14} />
        <span>{rateSendRef.toLocaleString()} {fromCurrency}</span>
        <span className="text-gray-400">=</span>
        <CurrencyFlag code={toCurrency} size={14} />
        <span>{rateReceiveRef.toLocaleString()} {toCurrency}</span>
      </p>
    )
  }

  // Fallback for older offers: "1 FROM = X.XX TO"
  return (
    <p className="text-gray-900 font-semibold text-sm flex items-center gap-1.5 flex-wrap">
      <CurrencyFlag code={fromCurrency} size={14} />
      <span>1 {fromCurrency}</span>
      <span className="text-gray-400">=</span>
      <CurrencyFlag code={toCurrency} size={14} />
      <span>{rate.toFixed(2)} {toCurrency}</span>
    </p>
  )
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
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-gray-900 font-bold text-base">
            <span className="inline-flex items-center gap-1.5">
              <CurrencyFlag code={listing.fromCurrency} size={16} />
              {listing.fromCurrency}
              <span className="text-gray-300">→</span>
              <CurrencyFlag code={listing.toCurrency} size={16} />
              {listing.toCurrency}
            </span>
          </p>
          {/* Send → Receive countries in text */}
          {(listing.sendCountry || listing.receiveCountry) && (
            <p className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
              {listing.sendCountry && <><SmallFlag country={listing.sendCountry} /> <span>{listing.sendCountry}</span></>}
              {listing.sendCountry && listing.receiveCountry && <span className="text-gray-300">→</span>}
              {listing.receiveCountry && <><SmallFlag country={listing.receiveCountry} /> <span>{listing.receiveCountry}</span></>}
            </p>
          )}
          <p className="text-gray-400 text-xs mt-0.5">#{listing.id.slice(0, 8)}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Rate — shown in the seller's natural format */}
      <div className="bg-[#F7F9F8] rounded-xl p-3 mb-3 space-y-2.5">
        <div>
          <p className="text-gray-400 text-xs mb-1">{t('rate')}</p>
          <RateDisplay listing={listing} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
          <div>
            <p className="text-gray-400 text-[10px] mb-0.5">{t('min')}</p>
            <p className="text-gray-700 text-xs font-medium">{listing.minAmount.toLocaleString()} <span className="text-gray-400">{listing.fromCurrency}</span></p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] mb-0.5">{t('max')}</p>
            <p className="text-gray-700 text-xs font-medium">{listing.maxAmount.toLocaleString()} <span className="text-gray-400">{listing.fromCurrency}</span></p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] mb-0.5">{t('liquidity')}</p>
            <p className="text-gray-700 text-xs font-medium">{listing.liquidity.toLocaleString()} <span className="text-gray-400">{listing.toCurrency}</span></p>
          </div>
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
