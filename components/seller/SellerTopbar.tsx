'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Search, ChevronDown, Menu, ArrowUpRight, User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateSellerAvailability, getSellerRecord } from '@/actions/listings'
import { useSidebar } from '@/lib/sidebar-context'
import { useI18n } from '@/lib/i18n-context'

interface Props {
  title: string
  sellerName: string
  notifCount?: number
}

export default function SellerTopbar({ title, sellerName, notifCount = 0 }: Props) {
  const [availability, setAvailability] = useState('online')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { setMobileOpen } = useSidebar()
  const { t } = useI18n()
  const router = useRouter()
  const profileRef = useRef<HTMLDivElement>(null)

  const statusOptions = [
    { value: 'online', label: t('online'),  color: 'bg-green-500' },
    { value: 'busy',   label: t('busy'),    color: 'bg-orange-500' },
    { value: 'offline',label: t('offline'), color: 'bg-gray-400' },
  ] as const

  const current = statusOptions.find(s => s.value === availability)!

  useEffect(() => {
    getSellerRecord().then(s => { if (s?.availability) setAvailability(s.availability) })
  }, [])

  useEffect(() => {
    if (!profileOpen) return
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  async function handleLogout() {
    setProfileOpen(false)
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 lg:px-6 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          <h1 className="text-gray-900 font-bold text-lg hidden lg:block">{title}</h1>
          <div className="flex items-center gap-2 lg:hidden min-w-0">
            <img src="/hoxa-logo.png" alt="HOXA" className="h-6 flex-shrink-0" />
            <Link
              href="/dashboard"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#177945]/10 border border-[#177945]/20 text-[#177945] text-[10px] font-bold tracking-wide hover:bg-[#177945]/20 active:bg-[#177945]/25 transition-colors flex-shrink-0"
              title={t('switch_to_buyer')}
            >
              {t('seller_badge')}
              <ArrowUpRight size={9} className="opacity-60" />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
          <button className="hidden lg:flex p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Search">
            <Search size={18} />
          </button>

          <Link href="/seller/notifications" className="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors" aria-label="Notifications">
            <Bell size={18} />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Availability toggle */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="Change availability status"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${current.color}`} />
              <span className="hidden sm:inline">{current.label}</span>
              <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} aria-hidden="true" />
                <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  {statusOptions.map(s => (
                    <button
                      key={s.value}
                      onClick={() => { setAvailability(s.value); setDropdownOpen(false); updateSellerAvailability(s.value) }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${s.color}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Avatar with dropdown */}
          <div ref={profileRef} className="relative flex-shrink-0">
            <button onClick={() => setProfileOpen(v => !v)} className="focus:outline-none">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm">
                {sellerName.charAt(0).toUpperCase()}
              </div>
            </button>
            {profileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                  <p className="px-3 py-1.5 text-gray-400 text-xs font-medium truncate border-b border-gray-100 mb-1">{sellerName}</p>
                  <Link href="/seller/profile" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <User size={14} /> {t('nav_profile')}
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> {t('nav_logout')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
