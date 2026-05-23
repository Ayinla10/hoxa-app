import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import PWAInstall from '@/components/PWAInstall'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HOXA — P2P Currency Exchange',
  description: 'Safe, escrow-protected peer-to-peer currency exchange for West Africa.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HOXA',
  },
  icons: {
    icon: '/icons/favicon-32.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#18824a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* Capture install prompt BEFORE React hydrates — prevents race condition */}
        <Script id="pwa-prompt-capture" strategy="beforeInteractive">{`
          window.__pwaPrompt = null;
          window.addEventListener('beforeinstallprompt', function(e) {
            e.preventDefault();
            window.__pwaPrompt = e;
          });
        `}</Script>
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <PWAInstall />
      </body>
    </html>
  )
}
