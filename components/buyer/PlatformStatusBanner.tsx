'use client'

import { useEffect, useState } from 'react'
import type { PlatformStatus } from '@/types'

interface Props {
  openHour: number   // e.g. 7
  closeHour: number  // e.g. 22
  timezone: string   // e.g. "Africa/Accra"
  statusOverride?: PlatformStatus
}

export default function PlatformStatusBanner({ openHour, closeHour, timezone, statusOverride }: Props) {
  const [status, setStatus] = useState<PlatformStatus>('open')
  const [timeUntil, setTimeUntil] = useState('')

  useEffect(() => {
    function compute() {
      if (statusOverride) {
        setStatus(statusOverride)
        return
      }

      try {
        const now = new Date()
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        })
        const parts = formatter.formatToParts(now)
        const hour = Number(parts.find(p => p.type === 'hour')?.value ?? now.getHours())

        if (hour >= openHour && hour < closeHour) {
          setStatus('open')
        } else {
          setStatus('closed')
          // Calculate time until open
          const nextOpen = new Date(now)
          if (hour >= closeHour) {
            nextOpen.setDate(nextOpen.getDate() + 1)
          }
          nextOpen.setHours(openHour, 0, 0, 0)
          const diff = nextOpen.getTime() - now.getTime()
          const hours = Math.floor(diff / 3600000)
          const mins = Math.floor((diff % 3600000) / 60000)
          setTimeUntil(`${hours}h ${mins}m`)
        }
      } catch {
        setStatus('open')
      }
    }

    compute()
    const interval = setInterval(compute, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [openHour, closeHour, timezone, statusOverride])

  const config = {
    open: {
      bg: 'bg-green-50 border-green-200',
      dot: 'bg-green-500',
      text: 'text-green-700',
      label: 'HOXA is Open',
      sub: 'Avg. confirmation: ~5 min',
    },
    busy: {
      bg: 'bg-amber-50 border-amber-200',
      dot: 'bg-amber-500',
      text: 'text-amber-700',
      label: 'HOXA is Busy',
      sub: 'Avg. confirmation: ~15 min',
    },
    closed: {
      bg: 'bg-red-50 border-red-200',
      dot: 'bg-red-500',
      text: 'text-red-700',
      label: 'HOXA is Closed',
      sub: `Opens at ${openHour}:00 GMT${timeUntil ? ` (in ${timeUntil})` : ''}`,
    },
  }

  const c = config[status]

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${status === 'open' ? 'animate-pulse' : ''}`} />
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-sm font-semibold ${c.text}`}>{c.label}</span>
        <span className={`text-xs ${c.text} opacity-70`}>{c.sub}</span>
      </div>
    </div>
  )
}
