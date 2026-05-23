'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, Banknote, AlertTriangle, Users } from 'lucide-react'

const nav = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/admin/settlement',   icon: Banknote,        label: 'Settlement' },
  { href: '/admin/disputes',     icon: AlertTriangle,   label: 'Disputes' },
  { href: '/admin/users',        icon: Users,           label: 'Users' },
]

export default function AdminBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200">
      <div className="flex items-center justify-around px-1 py-2">
        {nav.map(({ href, icon: Icon, label }) => {
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
