'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, Search, Activity, Menu, X,
  LayoutDashboard, ArrowLeftRight, CreditCard, Users, Store,
  AlertTriangle, BarChart2, Shield, Settings, LogOut, ChevronRight
} from 'lucide-react'

const nav = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Overview',     group: 'Operations' },
  { href: '/admin/transactions', icon: ArrowLeftRight,  label: 'Transactions', group: 'Operations' },
  { href: '/admin/escrow',       icon: CreditCard,      label: 'Escrow Queue', group: 'Operations' },
  { href: '/admin/users',        icon: Users,           label: 'Users',        group: 'Management' },
  { href: '/admin/sellers',      icon: Store,           label: 'Sellers',      group: 'Management' },
  { href: '/admin/disputes',     icon: AlertTriangle,   label: 'Disputes',     group: 'Management' },
  { href: '/admin/analytics',    icon: BarChart2,       label: 'Analytics',    group: 'System' },
  { href: '/admin/alerts',       icon: Bell,            label: 'Alerts',       group: 'System' },
  { href: '/admin/risk',         icon: Shield,          label: 'Risk Control', group: 'System' },
  { href: '/admin/settings',     icon: Settings,        label: 'Settings',     group: 'System' },
]

const groups = ['Operations', 'Management', 'System']

interface Props {
  title: string
  adminName?: string
  notifCount?: number
  pendingEscrow?: number
}

export default function AdminTopbar({ title, adminName = 'Admin', notifCount = 0, pendingEscrow = 0 }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await createClient().auth.signOut()
    router.push('/admin')
  }

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 lg:px-6 py-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-4">

          {/* Desktop left */}
          <div className="hidden lg:flex items-center gap-3">
            <h1 className="text-gray-900 font-bold text-base leading-tight">{title}</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span className="text-gray-400 text-[10px] font-medium">Production Environment</span>
            </div>
          </div>

          {/* Mobile left — hamburger + logo */}
          <div className="flex lg:hidden items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <img src="/icons/icon-192.png" alt="HOXA" className="w-7 h-7 rounded-lg" />
              <span className="text-gray-900 font-bold text-sm">HOXA Admin</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 mr-2">
              <Activity size={12} className="text-[#18824a]" />
              <span className="text-[#18824a] text-xs font-semibold">All systems operational</span>
            </div>

            <button className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Search size={17} />
            </button>

            <button className="relative p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Bell size={17} />
              {notifCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            <div className="ml-1 w-8 h-8 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Drawer header */}
        <div className="bg-gradient-to-br from-[#18824a] to-[#0f6a3d] px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/icons/icon-192.png" alt="HOXA" className="w-9 h-9 rounded-xl" />
            <div>
              <span className="text-white font-bold text-base">HOXA</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                <span className="text-white/60 text-[10px]">Production</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Admin info strip */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-50 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-gray-900 text-sm font-semibold">{adminName}</p>
            <p className="text-gray-400 text-xs">Super Admin</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map(group => {
            const items = nav.filter(n => n.group === group)
            return (
              <div key={group}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group}</p>
                <div className="space-y-0.5">
                  {items.map(({ href, icon: Icon, label }) => {
                    const active = pathname === href || pathname.startsWith(href + '/')
                    const showBadge = href === '/admin/escrow' && pendingEscrow > 0
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setDrawerOpen(false)}
                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                          ${active ? 'bg-[#18824a]/10 text-[#18824a]' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                      >
                        {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#18824a] rounded-r-full" />}
                        <Icon size={16} className={active ? 'text-[#18824a]' : 'text-gray-400'} />
                        <span className="flex-1">{label}</span>
                        {showBadge && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                            {pendingEscrow > 9 ? '9+' : pendingEscrow}
                          </span>
                        )}
                        {active && <ChevronRight size={12} className="text-[#18824a]/40" />}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-sm font-medium transition-colors"
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </div>
    </>
  )
}
