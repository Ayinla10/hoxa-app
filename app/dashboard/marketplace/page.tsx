import { getMarketplaceOffers } from '@/actions/listings'
import OfferCard from '@/components/buyer/OfferCard'
import { Store, SlidersHorizontal } from 'lucide-react'

const PAIRS = [
  { from: 'GHS', to: 'CFA' },
  { from: 'CFA', to: 'GHS' },
]

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>
}

export default async function MarketplacePage({ searchParams }: Props) {
  const params = await searchParams
  const from = params.from
  const to = params.to

  const offers = await getMarketplaceOffers(from, to)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-gray-500 text-sm mt-0.5">{offers.length} offers available</p>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
          <SlidersHorizontal size={15} />
          <span className="hidden sm:block">Filter</span>
        </div>
      </div>

      {/* Currency pair filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/dashboard/marketplace"
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
            !from && !to
              ? 'bg-[#177945] text-white border-[#177945]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
          }`}
        >
          All Pairs
        </a>
        {PAIRS.map(p => {
          const active = from === p.from && to === p.to
          return (
            <a
              key={`${p.from}-${p.to}`}
              href={`/dashboard/marketplace?from=${p.from}&to=${p.to}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                active
                  ? 'bg-[#177945] text-white border-[#177945]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#177945]/50'
              }`}
            >
              {p.from} → {p.to}
            </a>
          )
        })}
      </div>

      {/* Offers grid */}
      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Store size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No offers available</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon or try a different currency pair</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer: any) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </div>
  )
}
