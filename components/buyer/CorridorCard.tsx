'use client'

import Link from 'next/link'
import { ArrowRight, Users, Clock } from 'lucide-react'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

const COUNTRY_CC: Record<string, string> = {
  'Ghana': 'gh', 'Nigeria': 'ng', "Côte d'Ivoire": 'ci', 'Senegal': 'sn',
  'Mali': 'ml', 'Burkina Faso': 'bf', 'Togo': 'tg', 'Benin': 'bj',
  'Niger': 'ne', 'Guinea-Bissau': 'gw', 'Cameroon': 'cm', 'Chad': 'td',
  'Central African Rep.': 'cf', 'Republic of Congo': 'cg', 'Gabon': 'ga',
  'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz', 'South Africa': 'za',
  'United Kingdom': 'gb', 'France': 'fr', 'United States': 'us', 'Canada': 'ca',
}

function Flag({ country }: { country?: string }) {
  if (!country) return null
  const cc = COUNTRY_CC[country]
  if (!cc) return null
  return <img src={`https://flagcdn.com/w20/${cc}.png`} width={12} height={9} alt={country} className="rounded-sm object-cover flex-shrink-0 inline-block" />
}

interface Props {
  from: string
  to: string
  sendCountry?: string
  receiveCountry?: string
  avgRate: number | null
  sellerCount: number
  avgSpeed: string
}

export default function CorridorCard({ from, to, sendCountry, receiveCountry, avgRate, sellerCount, avgSpeed }: Props) {
  return (
    <Link
      href={`/dashboard/marketplace?from=${from}&to=${to}${sendCountry ? `&sendCountry=${encodeURIComponent(sendCountry)}` : ''}${receiveCountry ? `&country=${encodeURIComponent(receiveCountry)}` : ''}`}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#177945]/30 hover:shadow-md transition-all p-3 sm:p-4 group overflow-hidden min-w-0"
    >
      {/* Currency pair */}
      <div className="flex items-center gap-1.5 mb-1 min-w-0">
        <CurrencyFlag code={from} size={16} />
        <span className="font-bold text-gray-900 text-xs sm:text-sm">{from}</span>
        <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
        <CurrencyFlag code={to} size={16} />
        <span className="font-bold text-gray-900 text-xs sm:text-sm">{to}</span>
      </div>

      {/* Country route in text */}
      {(sendCountry || receiveCountry) && (
        <p className="flex items-center gap-1 text-[10px] text-gray-400 mb-2.5 flex-wrap">
          {sendCountry && <><Flag country={sendCountry} /><span>{sendCountry}</span></>}
          {sendCountry && receiveCountry && <span>→</span>}
          {receiveCountry && <><Flag country={receiveCountry} /><span>{receiveCountry}</span></>}
        </p>
      )}

      {/* Stats */}
      <div className="space-y-1.5">
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
