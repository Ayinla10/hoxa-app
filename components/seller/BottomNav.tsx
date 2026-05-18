'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Clock, ArrowLeftRight, FileText } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export default function BottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const nav = [
    { href: '/seller/dashboard',    icon: LayoutDashboard, label: t('nav_dashboard') },
    { href: '/seller/requests',     icon: Clock,           label: t('requests_short') },
    { href: '/seller/transactions', icon: ArrowLeftRight,  label: t('nav_transactions') },
    { href: '/seller/listings',     icon: FileText,        label: t('nav_listings') },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1 py-1.5">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 py-1 flex-1 min-w-0"
            >
              <Icon
                size={20}
                className={active ? 'text-[#177945]' : 'text-gray-400'}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={`text-[10px] leading-tight font-medium truncate max-w-full px-0.5 ${active ? 'text-[#177945]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
