import Link from 'next/link'
import { MapPin, Zap, ShieldCheck, ArrowRight } from 'lucide-react'

interface Props {
  offer: any
}

export default function ActiveSellerCard({ offer }: Props) {
  const seller = offer.sellers
  const profile = seller?.profiles
  const name: string = profile?.full_name ?? 'Seller'
  const country: string = profile?.country ?? '—'
  const rate: number = offer.rate
  const fromCurrency: string = offer.from_currency
  const toCurrency: string = offer.to_currency
  const completionRate: number = seller?.completion_rate ?? 0
  const avgResponse: number = seller?.avg_response_seconds ?? 0
  const isFast = avgResponse > 0 && avgResponse <= 120

  const responseLabel = avgResponse > 0
    ? avgResponse < 60 ? `${avgResponse}s` : `${Math.round(avgResponse / 60)}m`
    : '—'

  return (
    <Link
      href="/dashboard/marketplace"
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-[#177945]/30 hover:shadow-md transition-all group"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-base flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
          {isFast && <Zap size={11} className="text-yellow-500 flex-shrink-0" />}
          {completionRate >= 95 && <ShieldCheck size={11} className="text-[#177945] flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <span className="flex items-center gap-0.5"><MapPin size={9} /> {country}</span>
          <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
          <span>⚡ {responseLabel}</span>
        </div>
      </div>

      {/* Rate */}
      <div className="text-right flex-shrink-0">
        <p className="text-[#177945] font-bold text-sm">{rate}</p>
        <p className="text-gray-400 text-xs">{fromCurrency}→{toCurrency}</p>
      </div>

      <ArrowRight size={14} className="text-gray-300 group-hover:text-[#177945] transition-colors flex-shrink-0" />
    </Link>
  )
}
