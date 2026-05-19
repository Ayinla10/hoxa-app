'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err))
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show if not already installed and not dismissed recently
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (dismissed) {
        const dismissedAt = Number(dismissed)
        // Don't show again for 7 days after dismissal
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
      }
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Hide banner if already installed
    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa-dismissed', String(Date.now()))
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[9999] animate-in slide-in-from-bottom duration-300 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="HOXA" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Install HOXA</p>
          <p className="text-xs text-gray-500 mt-0.5">Add to home screen for quick access</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="bg-[#18824a] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#146b3d] transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  )
}
