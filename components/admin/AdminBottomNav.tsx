'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Banknote, AlertTriangle, Users } from 'lucide-react'
import { hasPermission, type AdminPermissionKey } from '@/lib/admin-permissions'

const nav: { href: string; icon: React.ElementType; label: string; permission: AdminPermissionKey | null }[] = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Overview',     permission: null },
  { href: '/admin/transactions', icon: ArrowLeftRight,  label: 'Transactions', permission: 'transactions' },
  { href: '/admin/settlement',   icon: Banknote,        label: 'Settlement',   permission: 'settlement' },
  { href: '/admin/disputes',     icon: AlertTriangle,   label: 'Disputes',     permission: 'disputes' },
  { href: '/admin/users',        icon: Users,           label: 'Users',        permission: 'users' },
]

interface Props {
  permissions?: string[]
}

export default function AdminBottomNav({ permissions = [] }: Props) {
  const pathname = usePathname()

  const visibleNav = nav.filter(item =>
    item.permission === null || hasPermission(permissions, item.permission)
  )

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200">
      <div className="flex items-center justify-around px-1 py-2">
        {visibleNav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
              <Icon size={19} className={active ? 'text-[#18824a]' : 'text-gray-400'} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[10px] font-medium ${active ? 'text-[#18824a]' : 'text-gray-400'}`}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
