'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n-context'

export default function CountdownTimer({ seconds, onExpired }: { seconds: number; onExpired?: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const { t } = useI18n()

  useEffect(() => { setRemaining(seconds) }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.()
      return
    }
    const id = setInterval(() => setRemaining(r => {
      if (r <= 1) { onExpired?.(); return 0 }
      return r - 1
    }), 1000)
    return () => clearInterval(id)
  }, [remaining]) // eslint-disable-line

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const color =
    remaining > 60 ? 'text-green-600' :
    remaining > 20 ? 'text-orange-500' :
    'text-red-600 animate-pulse'

  return (
    <span className={`font-mono font-bold text-sm tabular-nums ${color}`}>
      {remaining <= 0 ? t('expired') : display}
    </span>
  )
}
