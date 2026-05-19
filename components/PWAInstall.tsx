'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const pathname = usePathname()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  const isAdmin = pathname.startsWith('/admin')
  const appName = isAdmin ? 'HOXA Admin' : 'HOXA'
  const subtitle = isAdmin
    ? 'Admin portal on your home screen'
    : 'Add to home screen for quick access'
  const dismissKey = isAdmin ? 'pwa-dismissed-hoxa-admin' : 'pwa-dismissed-hoxa'

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err))
    }

    // Swap manifest for admin pages
    const link = document.querySelector('link[rel="manifest"]')
    if (link) {
      link.setAttribute('href', isAdmin ? '/admin-manifest.json' : '/manifest.json')
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem(dismissKey)
      if (dismissed) {
        const dismissedAt = Number(dismissed)
        if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
      }
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isAdmin, dismissKey])

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
    localStorage.setItem(dismissKey, String(Date.now()))
  }

  if (!showBanner) return null

  return (
    <div className="fixed top-3 left-4 right-4 z-[9999] animate-in slide-in-from-top duration-300 lg:left-auto lg:right-6 lg:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex items-center gap-3">
        <img src="/icons/icon-192.png" alt={appName} className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">Install {appName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
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
