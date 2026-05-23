'use client'

import { useState } from 'react'
import { ShieldCheck, Zap } from 'lucide-react'
import InitiateModal from './InitiateModal'

interface Props {
  offer: any
  variant?: 'card' | 'table-action'
}

export default function OfferCard({ offer, variant = 'card' }: Props) {
  const [showModal, setShowModal] = useState(false)
  const seller = offer.sellers
  const profile = seller?.profiles

  // Table action variant — just the button for the marketplace table
  if (variant === 'table-action') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Exchange Now
        </button>
        {showModal && <InitiateModal offer={offer} onClose={() => setShowModal(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#177945]/30 transition-all p-5">
        {/* Seller header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">{profile?.full_name ?? 'Seller'}</p>
              <p className="text-gray-400 text-xs">{profile?.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {seller?.completion_rate >= 95 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                <ShieldCheck size={9} /> Trusted
              </span>
            )}
            {seller?.avg_response_seconds <= 45 && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200">
                <Zap size={9} /> Fast
              </span>
            )}
          </div>
        </div>

        {/* Rate */}
        <div className="bg-[#F7F9F8] rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs">Rate</span>
            <span className="text-[#177945] font-bold text-lg">
              {offer.rate} <span className="text-sm font-normal text-gray-500">{offer.to_currency}/{offer.from_currency}</span>
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Min: <span className="text-gray-700 font-medium">{offer.min_amount?.toLocaleString()} {offer.from_currency}</span></span>
            <span>Max: <span className="text-gray-700 font-medium">{offer.max_amount?.toLocaleString()} {offer.from_currency}</span></span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-xs mb-4">
          <div className="text-center">
            <p className="font-semibold text-gray-900">{seller?.completion_rate ?? 0}%</p>
            <p className="text-gray-400">Completion</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{seller?.total_transactions ?? 0}</p>
            <p className="text-gray-400">Trades</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900">{seller?.avg_response_seconds ? `${seller.avg_response_seconds}s` : '—'}</p>
            <p className="text-gray-400">Avg Response</p>
          </div>
        </div>

        {/* Availability + CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              {offer.from_currency} → {offer.to_currency}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Available
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Exchange Now
          </button>
        </div>
      </div>

      {showModal && <InitiateModal offer={offer} onClose={() => setShowModal(false)} />}
    </>
  )
}
