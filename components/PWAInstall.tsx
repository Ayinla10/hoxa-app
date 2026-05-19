'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    __pwaPrompt: BeforeInstallPromptEvent | null
  }
}

export default function PWAInstall() {
  const pathname = usePathname()
  const [showBanner, setShowBanner] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

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

    // Pick up prompt captured in <head> script before React hydrated
    if (window.__pwaPrompt) {
      promptRef.current = window.__pwaPrompt
    }

    // Also listen for future events (in case it fires after hydration)
    const promptHandler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as BeforeInstallPromptEvent
      window.__pwaPrompt = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', promptHandler)

    // Hide if installed
    const installedHandler = () => {
      setShowBanner(false)
      promptRef.current = null
      window.__pwaPrompt = null
    }
    window.addEventListener('appinstalled', installedHandler)

    // One-time reset of dismiss flags (remove this block after testing)
    if (!localStorage.getItem('pwa-dismiss-reset-v1')) {
      localStorage.removeItem('pwa-dismissed')
      localStorage.removeItem('pwa-dismissed-admin')
      localStorage.setItem('pwa-dismiss-reset-v1', '1')
    }

    // Don't show if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (isStandalone) return

    // Check dismissal
    const dismissed = localStorage.getItem(dismissKey)
    if (dismissed) {
      const elapsed = Date.now() - Number(dismissed)
      if (elapsed < 7 * 24 * 60 * 60 * 1000) return
    }

    // Show banner after short delay
    const timer = setTimeout(() => setShowBanner(true), 2000)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', promptHandler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [isAdmin, dismissKey])

  const handleInstall = async () => {
    // Try the ref first, then the global
    const prompt = promptRef.current || window.__pwaPrompt
    if (prompt) {
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
        localStorage.setItem(dismissKey, String(Date.now()))
      }
      promptRef.current = null
      window.__pwaPrompt = null
    } else {
      // No native prompt available — show install instructions
      setShowInstructions(true)
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowInstructions(false)
    localStorage.setItem(dismissKey, String(Date.now()))
  }

  if (!showBanner) return null

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <>
      {/* Install banner */}
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

      {/* Instructions modal (when native prompt isn't available) */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center gap-3 mb-5">
              <img src="/icons/icon-192.png" alt={appName} className="w-10 h-10 rounded-xl" />
              <div>
                <p className="font-bold text-gray-900">Install {appName}</p>
                <p className="text-xs text-gray-500">Follow these steps</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <p className="text-sm text-gray-700">Tap the <strong>Share</strong> button <span className="inline-block text-blue-500">↑</span> at the bottom of Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <p className="text-sm text-gray-700">Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <p className="text-sm text-gray-700">Tap <strong>&quot;Add&quot;</strong> to confirm</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <p className="text-sm text-gray-700">Tap the <strong>menu</strong> button <span className="inline-block font-bold">⋮</span> in your browser</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <p className="text-sm text-gray-700">Tap <strong>&quot;Add to Home Screen&quot;</strong> or <strong>&quot;Install App&quot;</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#18824a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <p className="text-sm text-gray-700">Tap <strong>&quot;Install&quot;</strong> to confirm</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
