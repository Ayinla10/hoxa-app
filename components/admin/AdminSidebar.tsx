'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Users, Store,
  Settings, LogOut, ChevronRight, AlertTriangle, Banknote,
  BarChart2, Bell, Shield, Globe, Activity, Trash2
} from 'lucide-react'
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions'

const nav: { href: string; icon: React.ElementType; label: string; group: string; badge: string; permission: AdminPermissionKey | null }[] = [
  { href: '/admin/dashboard',        icon: LayoutDashboard, label: 'Overview',            group: 'main',   badge: '',       permission: null },
  { href: '/admin/transactions',     icon: ArrowLeftRight,  label: 'Transactions',        group: 'main',   badge: '',       permission: 'transactions' },
  { href: '/admin/payment-review',   icon: CreditCard,      label: 'Payment Review',      group: 'main',   badge: 'ops',    permission: 'payment_review' },
  { href: '/admin/settlement',       icon: Banknote,        label: 'Settlement',          group: 'main',   badge: 'settle', permission: 'settlement' },
  { href: '/admin/disputes',         icon: AlertTriangle,   label: 'Disputes',            group: 'main',   badge: '',       permission: 'disputes' },
  { href: '/admin/corridors',        icon: Globe,           label: 'Corridors',           group: 'main',   badge: '',       permission: 'corridors' },
  { href: '/admin/users',            icon: Users,           label: 'Users',               group: 'ops',    badge: '',       permission: 'users' },
  { href: '/admin/sellers',          icon: Store,           label: 'Seller Applications', group: 'ops',    badge: '',       permission: 'sellers' },
  { href: '/admin/risk',             icon: Shield,          label: 'Risk',                group: 'ops',    badge: '',       permission: 'risk' },
  { href: '/admin/alerts',           icon: Bell,            label: 'Alerts',              group: 'ops',    badge: '',       permission: 'alerts' },
  { href: '/admin/analytics',        icon: BarChart2,       label: 'Analytics',           group: 'system', badge: '',       permission: 'analytics' },
  { href: '/admin/activity',         icon: Activity,        label: 'Activity Log',        group: 'system', badge: '',       permission: 'activity' },
  { href: '/admin/settings',         icon: Settings,        label: 'Settings',            group: 'system', badge: '',       permission: 'settings' },
]

const groups = [
  { key: 'main',   label: 'Operations' },
  { key: 'ops',    label: 'Management' },
  { key: 'system', label: 'System' },
]

interface Props {
  adminName: string
  pendingEscrow?: number
  pendingSettlement?: number
  permissions: string[]
  isSuperAdmin?: boolean
}

export default function AdminSidebar({ adminName, pendingEscrow = 0, pendingSettlement = 0, permissions, isSuperAdmin = false }: Props) {
  const pathname = usePathname()

  async function logout() {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = '/admin'
  }

  // Filter nav items the admin has access to
  const visibleNav = nav.filter(item =>
    item.permission === null || hasPermission(permissions, item.permission)
  )

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white fixed top-0 left-0 z-30 border-r border-gray-200 shadow-sm">
      <div className="px-5 py-5 bg-gradient-to-br from-[#18824a] to-[#0f6a3d]">
        <div className="flex items-center gap-3">
          <img src="/hoxa-logo-white.png" alt="HOXA" className="h-7 flex-shrink-0" />
          <span className="ml-auto text-[9px] text-white font-bold bg-white/20 border border-white/25 px-1.5 py-0.5 rounded-md tracking-wider">ADMIN</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map(group => {
          const items = visibleNav.filter(n => n.group === group.key)
          if (items.length === 0) return null
          return (
            <div key={group.key}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{group.label}</p>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label, badge }) => {
                  const basePath = href.split('?')[0]
                  const active = pathname === basePath || pathname.startsWith(basePath + '/')
                  const showEscrowBadge = badge === 'ops' && pendingEscrow > 0
                  const showSettleBadge = badge === 'settle' && pendingSettlement > 0
                  return (
                    <Link key={href} href={href}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                        active
                          ? 'bg-[#18824a]/10 text-[#18824a]'
                          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}>
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#18824a] rounded-r-full" />}
                      <Icon size={16} className={active ? 'text-[#18824a]' : 'text-gray-400 group-hover:text-gray-600'} />
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

      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 transition-colors mb-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 text-xs font-semibold truncate">{adminName}</p>
            <p className="text-gray-400 text-[10px]">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] flex-shrink-0" />
        </div>
        {hasPermission(permissions, 'reset') && (
          <Link href="/admin/reset"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium transition-colors mb-0.5">
            <Trash2 size={14} /> Platform Reset
          </Link>
        )}
        <button onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-colors">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </aside>
  )
}
