import { getMarketplaceOffers } from '@/actions/listings'
import { getActiveCorridors } from '@/actions/corridors'
import { getSettings } from '@/actions/settings'
import MarketplaceClient from './MarketplaceClient'
import { Store } from 'lucide-react'

interface Props {
  searchParams: Promise<{ from?: string; to?: string; amount?: string; country?: string; corridor?: string }>
}

export default async function MarketplacePage({ searchParams }: Props) {
  const params = await searchParams
  const from = params.from
  const to = params.to
  const amount = params.amount
  const destinationCountry = params.country
  const corridorId = params.corridor

  const [offers, corridors, settings] = await Promise.all([
    getMarketplaceOffers(from, to),
    getActiveCorridors(),
    getSettings(),
  ])

  const feePercent = Number(settings.hoxa_buyer_fee_percent ?? settings.platform_fee_percent ?? 1)

  return (
    <MarketplaceClient
      offers={offers}
      corridors={corridors}
      from={from}
      to={to}
      amount={amount}
      destinationCountry={destinationCountry}
      corridorId={corridorId}
      feePercent={feePercent}
    />
  )
}
