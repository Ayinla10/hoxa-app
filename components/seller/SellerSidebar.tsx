'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, ArrowLeftRight, Clock,
  BarChart2, Bell, User, Settings, LogOut, ChevronsLeft, ChevronsRight, X
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useSidebar } from '@/lib/sidebar-context'

interface Props {
  sellerName: string
  score: number
  online: boolean
}

export default function SellerSidebar({ sellerName, score, online }: Props) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { collapsed, mobileOpen, toggleCollapsed, setMobileOpen } = useSidebar()

  const nav = [
    { href: '/seller/dashboard',     icon: LayoutDashboard, label: t('nav_dashboard') },
    { href: '/seller/listings',      icon: FileText,         label: t('nav_listings') },
    { href: '/seller/transactions',  icon: ArrowLeftRight,   label: t('nav_transactions') },
    { href: '/seller/requests',      icon: Clock,            label: t('nav_requests') },
    { href: '/seller/analytics',     icon: BarChart2,        label: t('nav_analytics') },
    { href: '/seller/notifications', icon: Bell,             label: t('nav_notifications') },
    { href: '/seller/profile',       icon: User,             label: t('nav_profile') },
    { href: '/seller/settings',      icon: Settings,         label: t('nav_settings') },
  ]

  async function handleLogout() {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  function handleNavClick() {
    if (mobileOpen) setMobileOpen(false)
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`px-4 py-4 border-b border-white/10 ${collapsed && !mobileOpen ? 'px-2' : ''}`}>
        <div className="flex items-center gap-2.5">
          {collapsed && !mobileOpen ? (
            <img src="/icons/icon-192.png" alt="HOXA" className="w-8 h-8 rounded-lg flex-shrink-0" />
          ) : (
            <>
              <img src="/hoxa-logo-white.png" alt="HOXA" className="h-6 flex-shrink-0" />
              <span className="text-[10px] text-[#177945] font-semibold bg-[#177945]/20 px-2 py-0.5 rounded-full">SELLER</span>
              <div className="ml-auto">
                <LanguageSwitcher variant="sidebar" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-0.5 overflow-y-auto ${collapsed && !mobileOpen ? 'px-1.5' : 'px-3'}`}>
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={handleNavClick}
              title={collapsed && !mobileOpen ? label : undefined}
              className={`relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all group
                ${collapsed && !mobileOpen ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                ${active
                  ? 'bg-[#177945]/25 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#22C55E] rounded-r-full" />
              )}
              <Icon size={17} className={`flex-shrink-0 ${active ? 'text-[#22C55E]' : 'text-white/40 group-hover:text-white/60'}`} />
              {(!collapsed || mobileOpen) && label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={`py-4 border-t border-white/10 space-y-1 ${collapsed && !mobileOpen ? 'px-1.5' : 'px-4'}`}>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={toggleCollapsed}
          className={`hidden lg:flex items-center gap-2 w-full rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 text-sm transition-colors
            ${collapsed && !mobileOpen ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed && !mobileOpen ? <ChevronsRight size={15} /> : <><ChevronsLeft size={15} /> {t('collapse')}</>}
        </button>

        {/* Profile */}
        <div className={`flex items-center gap-3 ${collapsed && !mobileOpen ? 'justify-center px-1 py-2' : 'px-3 py-2'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {sellerName.charAt(0).toUpperCase()}
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{sellerName}</p>
              <p className="text-white/40 text-xs">{t('seller_account')} · {score}/100</p>
            </div>
          )}
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-green-400' : 'bg-gray-500'}`} />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`flex items-center gap-2 w-full rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm transition-colors
            ${collapsed && !mobileOpen ? 'justify-center px-2 py-2' : 'px-3 py-2'}`}
          aria-label="Logout"
        >
          <LogOut size={15} />
          {(!collapsed || mobileOpen) && t('nav_logout')}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col min-h-screen bg-[#0B1F16] fixed top-0 left-0 z-30 transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-[#0B1F16] flex flex-col animate-slide-in-left">
            {/* Drawer header — gradient */}
            <div className="bg-gradient-to-br from-[#177945] to-[#0f5530] px-5 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/hoxa-logo-white.png" alt="HOXA" className="h-7" />
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
            </div>

            {/* User strip */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-white/5 border-b border-white/10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {sellerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">{sellerName}</p>
                <p className="text-white/40 text-xs">{t('seller_account')}</p>
              </div>
              <LanguageSwitcher variant="sidebar" />
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto px-3">
              {nav.map(({ href, icon: Icon, label }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleNavClick}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                      ${active
                        ? 'bg-[#177945]/25 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                      }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#22C55E] rounded-r-full" />
                    )}
                    <Icon size={17} className={`flex-shrink-0 ${active ? 'text-[#22C55E]' : 'text-white/40 group-hover:text-white/60'}`} />
                    {label}
                  </Link>
                )
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors"
              >
                <LogOut size={15} /> {t('nav_logout')}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
