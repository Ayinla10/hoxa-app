import Link from 'next/link'
import { Store, ArrowLeftRight } from 'lucide-react'

interface Props {
  fullName: string
  greeting: string
  activeTrades: number
}

export default function WelcomeHero({ fullName, greeting, activeTrades }: Props) {
  const first = fullName.split(' ')[0]

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0B1F16] via-[#0D2B1C] to-[#177945] p-6 shadow-xl shadow-[#177945]/20">
      {/* Decorative rings */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full border border-white/5" />
      <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full border border-white/5" />
      <div className="absolute bottom-0 left-1/2 w-64 h-64 rounded-full bg-[#177945]/20 blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-white/50 text-sm mb-1">{greeting}</p>
          <h1 className="text-2xl font-bold text-white mb-0.5">{first} 👋</h1>
          <p className="text-white/40 text-sm">Welcome back to HOXA</p>

          {activeTrades > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-300 text-xs font-medium">{activeTrades} exchange{activeTrades > 1 ? 's' : ''} in progress</span>
            </div>
          )}
        </div>

        {/* Logo mark */}
        <img src="/icons/icon-192.png" alt="HOXA" className="w-12 h-12 rounded-2xl flex-shrink-0" />
      </div>

      {/* Actions */}
      <div className="relative flex gap-2 mt-6 flex-wrap">
        <Link
          href="/dashboard/marketplace"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#177945] text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
        >
          <Store size={14} /> Browse Market
        </Link>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-white/20 transition-colors"
        >
          <ArrowLeftRight size={14} /> My Trades
        </Link>
      </div>
    </div>
  )
}
