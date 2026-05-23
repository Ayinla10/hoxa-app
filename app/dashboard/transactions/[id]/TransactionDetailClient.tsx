'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'

interface Props {
  type: 'payment_window' | 'auto_confirm'
  deadline: string
}

export default function TransactionDetailClient({ type, deadline }: Props) {
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)))
    }, 1000)
    return () => clearInterval(timer)
  }, [deadline])

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (remaining <= 0) {
    return (
      <div className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
        <AlertTriangle size={14} className="text-red-500" />
        <span className="text-red-600 text-sm font-medium">
          {type === 'payment_window' ? 'Verification window expired' : 'Auto-confirm timer expired'}
        </span>
      </div>
    )
  }

  const isUrgent = type === 'payment_window' ? remaining < 300 : remaining < 1800

  return (
    <div className={`flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl border ${
      isUrgent ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'
    }`}>
      <Clock size={14} className={`${isUrgent ? 'text-amber-500 animate-pulse' : 'text-blue-500'}`} />
      <span className={`text-sm font-semibold font-mono ${isUrgent ? 'text-amber-700' : 'text-blue-700'}`}>
        {formatTime(remaining)}
      </span>
      <span className={`text-xs ${isUrgent ? 'text-amber-600' : 'text-blue-600'}`}>
        {type === 'payment_window' ? 'verification window' : 'until auto-confirm'}
      </span>
    </div>
  )
}
