'use client'

import { useState } from 'react'
import { Plus, FileText } from 'lucide-react'
import ListingCard from '@/components/seller/ListingCard'
import CreateListingModal from '@/components/seller/CreateListingModal'
import { useI18n } from '@/lib/i18n-context'

interface Corridor { send_currency: string; receive_currency: string }

export default function SellerListingsClient({ offers, corridors = [] }: { offers: any[]; corridors?: Corridor[] }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingOffer, setEditingOffer] = useState<any>(null)
  const { t } = useI18n()

  return (
    <div className="px-4 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{t('your_listings')}</h2>
          <p className="text-gray-400 text-sm">{offers.length} {t('total')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> {t('new_listing')}
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <FileText size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('no_listings')}</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">{t('no_listings_sub')}</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90"
          >
            <Plus size={14} /> {t('create_listing')}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer: any) => (
            <ListingCard
              key={offer.id}
              listing={{
                id: offer.id,
                fromCurrency: offer.from_currency,
                toCurrency: offer.to_currency,
                rate: offer.rate,
                liquidity: offer.available_liquidity,
                minAmount: offer.min_amount,
                maxAmount: offer.max_amount,
                status: offer.is_available ? 'active' : 'paused',
              }}
              onEdit={() => setEditingOffer(offer)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateListingModal corridors={corridors} onClose={() => setShowCreate(false)} />}
      {editingOffer && <CreateListingModal corridors={corridors} existing={editingOffer} onClose={() => setEditingOffer(null)} />}
    </div>
  )
}
