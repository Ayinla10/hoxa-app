'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Store, LifeBuoy } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

export default function BuyerBottomNav() {
  const pathname = usePathname()
  const { t } = useI18n()

  const nav = [
    { href: '/dashboard',              icon: LayoutDashboard, label: t('nav_dashboard') },
    { href: '/dashboard/marketplace',  icon: Store,           label: t('nav_exchange') },
    { href: '/dashboard/transactions', icon: ArrowLeftRight,  label: t('nav_transactions') },
    { href: '/dashboard/support',      icon: LifeBuoy,        label: t('nav_support') },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-1 py-2">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1 min-w-0">
              <Icon size={20} className={active ? 'text-[#177945]' : 'text-gray-400'} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium truncate max-w-full px-0.5 ${active ? 'text-[#177945]' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
