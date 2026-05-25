'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, Ban, CheckCircle2, Loader2 } from 'lucide-react'
import { setFraudFlag, banUser, unbanUser } from '@/actions/admin'

export function FraudFlagButton({ userId, flagged }: { userId: string; flagged: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await setFraudFlag(userId, !flagged)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
        flagged
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Flag size={12} />}
      {flagged ? 'Flagged' : 'Flag'}
    </button>
  )
}

export function BanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (!banned && !confirm('Ban this user? They will not be able to log in.')) return
    setLoading(true)
    if (banned) await unbanUser(userId)
    else await banUser(userId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
        banned
          ? 'bg-green-50 text-green-700 hover:bg-green-100'
          : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : banned ? <CheckCircle2 size={12} /> : <Ban size={12} />}
      {banned ? 'Unban' : 'Ban'}
    </button>
  )
}
