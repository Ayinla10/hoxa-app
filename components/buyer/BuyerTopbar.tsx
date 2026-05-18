'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, Search, Menu, X, ArrowUpRight,
  LayoutDashboard, RefreshCw, ArrowLeftRight, Heart, User, Settings, LogOut
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface Props {
  fullName: string
  notifCount: number
  title?: string
  isSeller?: boolean
}

export default function BuyerTopbar({ fullName, notifCount, title, isSeller = false }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
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
    router.push('/login')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 py-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-4">

          {/* Desktop left — page title */}
          <div className="hidden lg:block">
            <p className="text-gray-900 font-bold text-base">{title ?? 'Dashboard'}</p>
          </div>

          {/* Mobile left — hamburger + logo + role badge */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#18824a] to-[#0f5530] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <span className="font-bold text-gray-900 text-sm flex-shrink-0">HOXA</span>
              {isSeller && (
                <Link
                  href="/seller/dashboard"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold tracking-wide hover:bg-blue-100 active:bg-blue-150 transition-colors flex-shrink-0"
                  title={t('switch_to_seller')}
                >
                  {t('buyer_badge')}
                  <ArrowUpRight size={9} className="opacity-60" />
                </Link>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 ml-auto">
            <button className="hidden lg:flex p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Search size={17} />
            </button>
            <Link href="/dashboard/notifications"
              className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>
            <Link href="/dashboard/profile" className="ml-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f5530] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Drawer header — gradient */}
        <div className="bg-gradient-to-br from-[#18824a] to-[#0f5530] px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center">
              <span className="text-white font-black text-sm">H</span>
            </div>
            <div>
              <span className="text-white font-bold text-base">HOXA</span>
              <p className="text-white/55 text-[10px] mt-0.5">Buyer Portal</p>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* User strip */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f5530] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-sm font-semibold truncate">{fullName}</p>
            <p className="text-gray-400 text-xs">{t('buyer_account')}</p>
          </div>
          <LanguageSwitcher variant="sidebar" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map(({ href, icon: Icon, key }) => {
            const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
            const hasBadge = href === '/dashboard/notifications' && notifCount > 0
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-[#18824a]/10 text-[#18824a]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#18824a] rounded-r-full" />}
                <Icon size={17} className={active ? 'text-[#18824a]' : 'text-gray-400'} />
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

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <LogOut size={15} /> {t('nav_logout')}
          </button>
        </div>
      </div>
    </>
  )
}
