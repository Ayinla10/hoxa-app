'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { setSellerAvailabilityOverride } from '@/actions/admin'
import { Loader2, WifiOff, Wifi, RotateCcw } from 'lucide-react'

interface Props {
  sellerId: string
  currentOverride: string | null
}

export default function SellerOverrideButton({ sellerId, currentOverride }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function set(val: 'available' | 'offline' | null) {
    setLoading(val ?? 'clear')
    await setSellerAvailabilityOverride(sellerId, val)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-1.5">
      {currentOverride && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          currentOverride === 'available'
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-600 border-red-200'
        }`}>
          Override: {currentOverride}
        </span>
      )}
      {currentOverride !== 'available' && (
        <button
          onClick={() => set('available')}
          disabled={loading !== null}
          title="Force online"
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          {loading === 'available' ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
        </button>
      )}
      {currentOverride !== 'offline' && (
        <button
          onClick={() => set('offline')}
          disabled={loading !== null}
          title="Force offline"
          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          {loading === 'offline' ? <Loader2 size={12} className="animate-spin" /> : <WifiOff size={12} />}
        </button>
      )}
      {currentOverride && (
        <button
          onClick={() => set(null)}
          disabled={loading !== null}
          title="Clear override (restore seller control)"
          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {loading === 'clear' ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
        </button>
      )}
    </div>
  )
}
