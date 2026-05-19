'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Auto-logout after 30 minutes of inactivity
const IDLE_TIMEOUT_MS = 30 * 60 * 1000

export default function SessionGuard() {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())

  const logout = useCallback(async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }, [router])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS)
  }, [logout])

  useEffect(() => {
    // Check if session was idle before page load (e.g. laptop woke from sleep)
    const stored = localStorage.getItem('hoxa_last_active')
    if (stored) {
      const elapsed = Date.now() - parseInt(stored, 10)
      if (elapsed > IDLE_TIMEOUT_MS) {
        logout()
        return
      }
    }

    // Start the idle timer
    resetTimer()

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const
    const handleActivity = () => {
      resetTimer()
      localStorage.setItem('hoxa_last_active', String(Date.now()))
    }

    for (const e of events) window.addEventListener(e, handleActivity, { passive: true })

    // Persist timestamp periodically
    const persistInterval = setInterval(() => {
      localStorage.setItem('hoxa_last_active', String(lastActivityRef.current))
    }, 60_000)

    // Check on visibility change (tab switch, laptop wake)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const stored = localStorage.getItem('hoxa_last_active')
        if (stored && Date.now() - parseInt(stored, 10) > IDLE_TIMEOUT_MS) {
          logout()
        } else {
          resetTimer()
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      clearInterval(persistInterval)
      for (const e of events) window.removeEventListener(e, handleActivity)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [resetTimer, logout])

  return null
}
