'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Bell, Search, Activity, Menu, X,
  LayoutDashboard, ArrowLeftRight, CreditCard, Users, Store,
  Settings, LogOut, ChevronRight, AlertTriangle, Banknote,
  BarChart2, Shield, Globe, Trash2
} from 'lucide-react'
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions'

const nav: { href: string; icon: React.ElementType; label: string; group: string; badge: string; permission: AdminPermissionKey | null }[] = [
  { href: '/admin/dashboard',        icon: LayoutDashboard, label: 'Overview',            group: 'Operations', badge: '',       permission: null },
  { href: '/admin/transactions',     icon: ArrowLeftRight,  label: 'Transactions',        group: 'Operations', badge: '',       permission: 'transactions' },
  { href: '/admin/payment-review',   icon: CreditCard,      label: 'Payment Review',      group: 'Operations', badge: 'ops',    permission: 'payment_review' },
  { href: '/admin/settlement',       icon: Banknote,        label: 'Settlement',          group: 'Operations', badge: 'settle', permission: 'settlement' },
  { href: '/admin/disputes',         icon: AlertTriangle,   label: 'Disputes',            group: 'Operations', badge: '',       permission: 'disputes' },
  { href: '/admin/corridors',        icon: Globe,           label: 'Corridors',           group: 'Operations', badge: '',       permission: 'corridors' },
  { href: '/admin/users',            icon: Users,           label: 'Users',               group: 'Management', badge: '',       permission: 'users' },
  { href: '/admin/sellers',          icon: Store,           label: 'Seller Applications', group: 'Management', badge: '',       permission: 'sellers' },
  { href: '/admin/risk',             icon: Shield,          label: 'Risk',                group: 'Management', badge: '',       permission: 'risk' },
  { href: '/admin/alerts',           icon: Bell,            label: 'Alerts',              group: 'Management', badge: '',       permission: 'alerts' },
  { href: '/admin/analytics',        icon: BarChart2,       label: 'Analytics',           group: 'System',     badge: '',       permission: 'analytics' },
  { href: '/admin/activity',         icon: Activity,        label: 'Activity Log',        group: 'System',     badge: '',       permission: 'activity' },
  { href: '/admin/settings',         icon: Settings,        label: 'Settings',            group: 'System',     badge: '',       permission: 'settings' },
]

const groups = ['Operations', 'Management', 'System']

interface Props {
  title: string
  adminName?: string
  notifCount?: number
  pendingEscrow?: number
  pendingSettlement?: number
  permissions?: string[]
  isSuperAdmin?: boolean
}

export default function AdminTopbar({ title, adminName = 'Admin', notifCount = 0, pendingEscrow = 0, pendingSettlement = 0, permissions = [], isSuperAdmin = false }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  async function logout() {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = '/admin'
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
              <img src="/hoxa-logo.png" alt="HOXA" className="h-6" />
              <span className="text-[9px] text-white font-bold bg-[#18824a] px-1.5 py-0.5 rounded-md tracking-wider">ADMIN</span>
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
            <img src="/hoxa-logo-white.png" alt="HOXA" className="h-7" />
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
            <p className="text-gray-400 text-xs">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
          <div className="ml-auto w-2 h-2 rounded-full bg-[#22C55E]" />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groups.map(group => {
            const items = nav.filter(n => n.group === group && (n.permission === null || hasPermission(permissions, n.permission)))
            if (items.length === 0) return null
            return (
              <div key={group}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group}</p>
                <div className="space-y-0.5">
                  {items.map(({ href, icon: Icon, label, badge }) => {
                    const basePath = href.split('?')[0]
                    const active = pathname === basePath || pathname.startsWith(basePath + '/')
                    const showEscrowBadge = badge === 'ops' && pendingEscrow > 0
                    const showSettleBadge = badge === 'settle' && pendingSettlement > 0
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
                        {showEscrowBadge && (
                          <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                            {pendingEscrow > 9 ? '9+' : pendingEscrow}
                          </span>
                        )}
                        {showSettleBadge && (
                          <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                            {pendingSettlement > 9 ? '9+' : pendingSettlement}
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

        {/* Logout + super admin actions */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-0.5">
          {hasPermission(permissions, 'reset') && (
            <Link
              href="/admin/reset"
              onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Trash2 size={15} /> Platform Reset
            </Link>
          )}
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
