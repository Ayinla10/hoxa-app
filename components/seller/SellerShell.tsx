'use client'

import { useSidebar } from '@/lib/sidebar-context'

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div
      className={`pb-20 lg:pb-0 transition-all duration-300 ease-in-out ${
        collapsed ? 'lg:pl-16' : 'lg:pl-64'
      }`}
    >
      {children}
    </div>
  )
}
