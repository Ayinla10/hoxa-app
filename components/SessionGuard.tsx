'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const DEFAULT_TIMEOUT_MIN = 15

export default function SessionGuard({ timeoutMinutes, logoutPath = '/login' }: { timeoutMinutes?: number; logoutPath?: string }) {
  const timeoutMs = (timeoutMinutes ?? DEFAULT_TIMEOUT_MIN) * 60 * 1000
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef(Date.now())
  const timeoutMsRef = useRef(timeoutMs)
  timeoutMsRef.current = timeoutMs
  const logoutPathRef = useRef(logoutPath)
  logoutPathRef.current = logoutPath

  const logout = useCallback(async () => {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = logoutPathRef.current
  }, [])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(logout, timeoutMsRef.current)
  }, [logout])

  useEffect(() => {
    // Check if session was idle before page load (e.g. laptop woke from sleep)
    const stored = localStorage.getItem('hoxa_last_active')
    if (stored) {
      const elapsed = Date.now() - parseInt(stored, 10)
      if (elapsed > timeoutMs) {
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
        if (stored && Date.now() - parseInt(stored, 10) > timeoutMsRef.current) {
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
  }, [resetTimer, logout, timeoutMs])

  return null
}
