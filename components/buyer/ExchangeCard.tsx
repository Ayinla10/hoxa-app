'use client'

import { useState } from 'react'
import { Eye, EyeOff, Store, ArrowLeftRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  totalVolume: number
  totalTrades: number
  successRate: number
  activeTrades: number
  currency?: string
}

export default function ExchangeCard({ totalVolume, totalTrades, successRate, activeTrades, currency = 'GHS' }: Props) {
  const [hidden, setHidden] = useState(false)
  const fmt = (n: number) => hidden ? '••••••' : n.toLocaleString('en-GH', { minimumFractionDigits: 2 })

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-br from-[#0B1F16] via-[#0F3D24] to-[#177945] shadow-xl shadow-[#177945]/20 text-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-1.5">Total Exchanged Volume</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight">{currency} {fmt(totalVolume)}</span>
            <button onClick={() => setHidden(v => !v)} className="mb-1 text-white/40 hover:text-white transition-colors">
              {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">H</span>
        </div>
      </div>

      <div className="flex gap-6 mb-6">
        <div>
          <p className="text-white/40 text-xs mb-0.5">Total Trades</p>
          <p className="text-white font-semibold text-sm">{totalTrades}</p>
        </div>
        <div className="w-px bg-white/15" />
        <div>
          <p className="text-white/40 text-xs mb-0.5">Success Rate</p>
          <p className={`font-semibold text-sm ${successRate >= 80 ? 'text-green-300' : successRate >= 50 ? 'text-yellow-300' : 'text-white'}`}>
            {totalTrades > 0 ? `${successRate}%` : '—'}
          </p>
        </div>
        <div className="w-px bg-white/15" />
        <div>
          <p className="text-white/40 text-xs mb-0.5">Active Now</p>
          <div className="flex items-center gap-1.5">
            {activeTrades > 0 && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
            <p className="text-white font-semibold text-sm">{activeTrades > 0 ? activeTrades : '—'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/dashboard/marketplace" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
          <Store size={13} /> Browse Market
        </Link>
        <Link href="/dashboard/transactions" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors">
          <ArrowLeftRight size={13} /> My Trades
        </Link>
        {activeTrades > 0 && (
          <Link href="/dashboard/transactions" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/30 hover:bg-green-500/40 text-green-300 text-xs font-medium transition-colors">
            <TrendingUp size={13} /> {activeTrades} Active
          </Link>
        )}
      </div>
    </div>
  )
}
