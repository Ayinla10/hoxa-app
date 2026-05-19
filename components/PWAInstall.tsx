'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstall() {
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  const isAdmin = pathname.startsWith('/admin')
  const appName = isAdmin ? 'HOXA Admin' : 'HOXA'
  const subtitle = isAdmin
    ? 'Admin portal on your home screen'
    : 'Add to home screen for quick access'
  const dismissKey = isAdmin ? 'pwa-dismissed-admin' : 'pwa-dismissed'

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.log('SW registration failed:', err))
    }

    // Capture install prompt if browser fires it
    const promptHandler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', promptHandler)

    // Hide if installed
    const installedHandler = () => {
      setShowBanner(false)
      deferredPromptRef.current = null
    }
    window.addEventListener('appinstalled', installedHandler)

    // Don't show if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (isStandalone) return

    // Check dismissal
    const dismissed = localStorage.getItem(dismissKey)
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed)
      if (elapsed < 7 * 24 * 60 * 60 * 1000) return // 7-day cooldown
    }

    // Show banner after a short delay (don't rely on beforeinstallprompt to show)
    const timer = setTimeout(() => setShowBanner(true), 2000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', promptHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [isAdmin, dismissKey])

  const handleInstall = async () => {
    if (deferredPromptRef.current) {
      // Chrome/Android: use the native install prompt
      deferredPromptRef.current.prompt()
      const { outcome } = await deferredPromptRef.current.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        localStorage.setItem(dismissKey, String(Date.now()))
      }
      deferredPromptRef.current = null
    } else {
      // iOS / other browsers: show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      if (isIOS) {
        alert('To install: tap the Share button (↑) at the bottom of Safari, then tap "Add to Home Screen"')
      } else {
        alert('To install: tap the browser menu (⋮) and select "Add to Home Screen" or "Install App"')
      }
    }
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
