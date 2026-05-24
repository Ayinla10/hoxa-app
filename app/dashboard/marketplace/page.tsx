import { getMarketplaceOffers } from '@/actions/listings'
import { getActiveCorridors } from '@/actions/corridors'
import { getSettings } from '@/actions/settings'
import MarketplaceClient from './MarketplaceClient'
import { Store } from 'lucide-react'

interface Props {
  searchParams: Promise<{ from?: string; to?: string; amount?: string; country?: string; corridor?: string; sendCountry?: string; sendPhone?: string; receivePhone?: string }>
}

export default async function MarketplacePage({ searchParams }: Props) {
  const params = await searchParams
  const from = params.from
  const to = params.to
  const amount = params.amount
  const destinationCountry = params.country
  const corridorId = params.corridor
  const sendCountry = params.sendCountry
  const sendPhone = params.sendPhone
  const receivePhone = params.receivePhone

  const [offers, corridors, settings] = await Promise.all([
    getMarketplaceOffers(from, to, sendCountry),
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
      sendCountry={sendCountry}
      destinationCountry={destinationCountry}
      corridorId={corridorId}
      sendPhone={sendPhone}
      receivePhone={receivePhone}
      feePercent={feePercent}
    />
  )
}
