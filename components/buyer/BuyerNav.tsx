'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { useState } from 'react'

const links = [
  { href: '/dashboard', label: 'Home' },
  { href: '/dashboard/marketplace', label: 'Marketplace' },
  { href: '/dashboard/transactions', label: 'Transactions' },
]

interface Props {
  fullName: string
  notifCount: number
}

export default function BuyerNav({ fullName, notifCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await createClient().auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="HOXA" className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-gray-900 hidden sm:block">HOXA</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(l => {
            const active = l.href === '/dashboard' ? pathname === l.href : pathname.startsWith(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-[#177945]/10 text-[#177945]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notifications" className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white text-xs font-bold">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">{fullName}</span>
              <ChevronDown size={13} className="text-gray-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <User size={15} /> Profile
                </Link>
                <Link href="/dashboard/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings size={15} /> Settings
                </Link>
                <div className="border-t border-gray-100" />
                <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
