import Link from 'next/link'
import { ShieldCheck, Zap, MapPin, Star, ArrowRight } from 'lucide-react'

interface Props {
  offer: any
}

export default function RecommendedSellerCard({ offer }: Props) {
  const seller   = offer.sellers
  const profile  = seller?.profiles
  const name: string     = profile?.full_name ?? 'Seller'
  const country: string  = profile?.country ?? '—'
  const rate: number     = offer.rate
  const from: string     = offer.from_currency
  const to: string       = offer.to_currency
  const min: number      = offer.min_amount ?? 0
  const max: number      = offer.max_amount ?? 0
  const completion: number = seller?.completion_rate ?? 0
  const avgSec: number   = seller?.avg_response_seconds ?? 0
  const totalTx: number  = seller?.total_transactions ?? 0
  const isFast = avgSec > 0 && avgSec <= 120
  const isVerified = completion >= 90 && totalTx >= 5

  const speedLabel = avgSec > 0
    ? avgSec < 60 ? `${avgSec}s` : `${Math.round(avgSec / 60)}m`
    : '—'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#177945]/30 hover:shadow-md transition-all p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-base">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-gray-900 text-sm">{name}</p>
              {isVerified && <ShieldCheck size={13} className="text-[#177945]" />}
              {isFast && <Zap size={13} className="text-yellow-500" />}
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-xs">
              <MapPin size={9} />
              <span>{country}</span>
            </div>
          </div>
        </div>

        {/* Rate */}
        <div className="text-right">
          <p className="text-[#177945] font-bold text-lg leading-none">{rate}</p>
          <p className="text-gray-400 text-xs mt-0.5">{from}/{to}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#F7F9F8] rounded-xl p-2 text-center">
          <p className="text-gray-900 font-bold text-sm">{completion}%</p>
          <p className="text-gray-400 text-[10px]">Completion</p>
        </div>
        <div className="bg-[#F7F9F8] rounded-xl p-2 text-center">
          <p className="text-gray-900 font-bold text-sm">{speedLabel}</p>
          <p className="text-gray-400 text-[10px]">Avg Speed</p>
        </div>
        <div className="bg-[#F7F9F8] rounded-xl p-2 text-center">
          <p className="text-gray-900 font-bold text-sm">{totalTx}</p>
          <p className="text-gray-400 text-[10px]">Trades</p>
        </div>
      </div>

      {/* Limits */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-gray-400 text-xs">
          Limits: <span className="text-gray-700 font-medium">{min.toLocaleString()} – {max.toLocaleString()} {from}</span>
        </p>
        {isVerified && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#177945] bg-[#177945]/8 px-2 py-0.5 rounded-full">
            <Star size={9} /> Trusted
          </span>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/dashboard/marketplace"
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        Select Seller <ArrowRight size={13} />
      </Link>
    </div>
  )
}
