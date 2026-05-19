'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, ArrowLeftRight, Bell, Heart, User, Settings, LogOut, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Props { fullName: string; notifCount: number }

export default function BuyerSidebar({ fullName, notifCount }: Props) {
  const pathname = usePathname()
  const { t } = useI18n()

  const nav = [
    { href: '/dashboard',               icon: LayoutDashboard, key: 'nav_dashboard' as const },
    { href: '/dashboard/marketplace',   icon: RefreshCw,       key: 'nav_exchange' as const },
    { href: '/dashboard/transactions',  icon: ArrowLeftRight,  key: 'nav_transactions' as const },
    { href: '/dashboard/notifications', icon: Bell,            key: 'nav_notifications' as const },
    { href: '/dashboard/saved-sellers', icon: Heart,           key: 'nav_saved_sellers' as const },
    { href: '/dashboard/profile',       icon: User,            key: 'nav_profile' as const },
    { href: '/dashboard/settings',      icon: Settings,        key: 'nav_settings' as const },
  ]

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0B1F16] fixed top-0 left-0 z-30">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img src="/hoxa-logo-white.png" alt="HOXA" className="h-6 flex-shrink-0" />
          <span className="text-[10px] text-[#22C55E] font-semibold bg-[#177945]/20 px-2 py-0.5 rounded-full">BUYER</span>
          <div className="ml-auto">
            <LanguageSwitcher variant="sidebar" />
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, icon: Icon, key }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          const hasBadge = href === '/dashboard/notifications' && notifCount > 0
          return (
            <Link key={href} href={href}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${active ? 'bg-[#177945]/25 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#22C55E] rounded-r-full" />}
              <Icon size={17} className={active ? 'text-[#22C55E]' : 'text-white/40 group-hover:text-white/60'} />
              <span className="flex-1">{t(key)}</span>
              {hasBadge && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-1">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{fullName}</p>
            <p className="text-white/40 text-xs">{t('buyer_account')}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors">
          <LogOut size={15} /> {t('nav_logout')}
        </button>
      </div>
    </aside>
  )
}
