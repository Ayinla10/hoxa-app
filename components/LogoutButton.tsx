'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ redirectTo = '/login' }: { redirectTo?: string }) {
  async function handleLogout() {
    localStorage.removeItem('hoxa_last_active')
    await createClient().auth.signOut()
    window.location.href = redirectTo
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
    >
      <LogOut size={16} />
      Logout
    </button>
  )
}
