'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface Props {
  deadlineIso: string
  label?: string
}

export default function TransactionCountdown({ deadlineIso, label = 'Complete payment within' }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const ms = new Date(deadlineIso).getTime() - Date.now()
    return Math.max(0, Math.floor(ms / 1000))
  })

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setInterval(() => {
      const ms = new Date(deadlineIso).getTime() - Date.now()
      const left = Math.max(0, Math.floor(ms / 1000))
      setSecondsLeft(left)
      if (left <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [deadlineIso, secondsLeft])

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const isWarning = secondsLeft > 0 && secondsLeft < 120
  const isExpired = secondsLeft <= 0

  if (isExpired) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
        <Clock size={24} className="text-red-500" />
        <div>
          <p className="text-red-700 font-bold text-sm">Time expired</p>
          <p className="text-red-500 text-xs">The payment window has closed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors ${
      isWarning
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-[#F7F9F8] border border-gray-200'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isWarning ? 'bg-amber-100' : 'bg-[#177945]/10'
      }`}>
        <Clock size={22} className={isWarning ? 'text-amber-600 animate-pulse' : 'text-[#177945]'} />
      </div>
      <div>
        <p className={`text-xs font-medium mb-0.5 ${isWarning ? 'text-amber-600' : 'text-gray-400'}`}>{label}</p>
        <p className={`font-bold text-3xl tracking-wider tabular-nums ${
          isWarning ? 'text-amber-700' : 'text-gray-900'
        }`}>
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </p>
      </div>
    </div>
  )
}
