'use client'

import Link from 'next/link'
import { ArrowRight, Users, Clock } from 'lucide-react'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

interface Props {
  from: string
  to: string
  avgRate: number | null
  sellerCount: number
  avgSpeed: string
}

export default function CorridorCard({ from, to, avgRate, sellerCount, avgSpeed }: Props) {
  return (
    <Link
      href={`/dashboard/marketplace?from=${from}&to=${to}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#177945]/30 hover:shadow-md transition-all p-3 sm:p-4 group overflow-hidden min-w-0"
    >
      {/* Pair header */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-3 min-w-0">
        <CurrencyFlag code={from} size={18} />
        <span className="font-bold text-gray-900 text-xs sm:text-sm">{from}</span>
        <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
        <CurrencyFlag code={to} size={18} />
        <span className="font-bold text-gray-900 text-xs sm:text-sm">{to}</span>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {avgRate !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Market rate</span>
            <span className="font-semibold text-[#177945]">{avgRate.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1"><Users size={10} /> Sellers</span>
          <span className="font-medium text-gray-700">{sellerCount}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 flex items-center gap-1"><Clock size={10} /> Avg speed</span>
          <span className="font-medium text-gray-700">{avgSpeed}</span>
        </div>
      </div>
    </Link>
  )
}
