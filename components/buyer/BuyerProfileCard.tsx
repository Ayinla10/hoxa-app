import { ShieldCheck, Zap, Star, User } from 'lucide-react'

interface Props {
  fullName: string
  country: string
  totalTrades: number
  successRate: number
  memberSince: string
}

function getTier(trades: number): { label: string; color: string } {
  if (trades >= 50) return { label: 'Power Trader', color: 'text-purple-700' }
  if (trades >= 20) return { label: 'Active Trader', color: 'text-blue-700' }
  if (trades >= 5)  return { label: 'Regular Buyer', color: 'text-[#177945]' }
  return { label: 'New Buyer', color: 'text-gray-600' }
}

export default function BuyerProfileCard({ fullName, country, totalTrades, successRate, memberSince }: Props) {
  const tier = getTier(totalTrades)
  const score = Math.min(100, Math.round((totalTrades * 2) + (successRate * 0.5)))
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      {/* Identity */}
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {fullName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{fullName}</p>
          <p className="text-gray-400 text-xs">{country}</p>
        </div>
      </div>

      <h3 className="text-gray-900 font-bold text-sm mb-4">Buyer Profile</h3>

      <div className="flex items-center gap-5 mb-4">
        {/* Score ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="7" />
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#177945"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">{score}</span>
            <span className="text-xs text-gray-400">/100</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="text-gray-400 text-xs">Buyer Tier</p>
            <p className={`font-semibold text-sm ${tier.color}`}>{tier.label}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Trades Completed</p>
            <p className="text-gray-900 font-semibold text-sm">{totalTrades}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Member Since</p>
            <p className="text-gray-900 font-semibold text-sm">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {totalTrades >= 1 && (
          <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <ShieldCheck size={11} /> Verified Buyer
          </span>
        )}
        {successRate >= 90 && totalTrades >= 3 && (
          <span className="flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
            <Zap size={11} /> High Trust
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
          <Star size={11} /> {tier.label}
        </span>
      </div>
    </div>
  )
}
