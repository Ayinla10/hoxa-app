'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Users, Store,
  AlertTriangle, BarChart2, Bell, Shield, Settings, LogOut, ChevronRight
} from 'lucide-react'

const nav = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Overview',     group: 'main' },
  { href: '/admin/transactions', icon: ArrowLeftRight,  label: 'Transactions', group: 'main' },
  { href: '/admin/escrow',       icon: CreditCard,      label: 'Escrow Queue', group: 'main', badge: 'escrow' },
  { href: '/admin/users',        icon: Users,           label: 'Users',        group: 'ops' },
  { href: '/admin/sellers',      icon: Store,           label: 'Sellers',      group: 'ops' },
  { href: '/admin/disputes',     icon: AlertTriangle,   label: 'Disputes',     group: 'ops' },
  { href: '/admin/analytics',    icon: BarChart2,       label: 'Analytics',    group: 'system' },
  { href: '/admin/alerts',       icon: Bell,            label: 'Alerts',       group: 'system' },
  { href: '/admin/risk',         icon: Shield,          label: 'Risk Control', group: 'system' },
  { href: '/admin/settings',     icon: Settings,        label: 'Settings',     group: 'system' },
]

const groups = [
  { key: 'main',   label: 'Operations' },
  { key: 'ops',    label: 'Management' },
  { key: 'system', label: 'System' },
]

export default function AdminSidebar({ adminName, pendingEscrow = 0 }: { adminName: string; pendingEscrow?: number }) {
  const pathname = usePathname()

  async function logout() {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = '/admin'
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white fixed top-0 left-0 z-30 border-r border-gray-200 shadow-sm">
      {/* Gradient header */}
      <div className="px-5 py-5 bg-gradient-to-br from-[#18824a] to-[#0f6a3d]">
        <div className="flex items-center gap-3">
          <img src="/hoxa-logo-white.png" alt="HOXA" className="h-7 flex-shrink-0" />
          <span className="ml-auto text-[9px] text-white font-bold bg-white/20 border border-white/25 px-1.5 py-0.5 rounded-md tracking-wider">ADMIN</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map(group => {
          const items = nav.filter(n => n.group === group.key)
          return (
            <div key={group.key}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label, badge }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  const showBadge = badge === 'escrow' && pendingEscrow > 0
                  return (
                    <Link key={href} href={href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                        ${active
                          ? 'bg-[#18824a]/10 text-[#18824a]'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}>
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#18824a] rounded-r-full" />}
                      <Icon size={16} className={active ? 'text-[#18824a]' : 'text-gray-400 group-hover:text-gray-600'} />
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xs font-semibold truncate">{adminName}</p>
            <p className="text-gray-400 text-[10px]">Super Admin</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
        </div>
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}
