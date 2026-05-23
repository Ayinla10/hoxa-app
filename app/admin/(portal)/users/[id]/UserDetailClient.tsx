'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, ShieldCheck, Loader2 } from 'lucide-react'
import { banUser, unbanUser } from '@/actions/admin'

interface Props {
  userId: string
  isBanned: boolean
  userName: string
}

export default function UserDetailClient({ userId, isBanned, userName }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBan() {
    const action = isBanned ? 'unban' : 'ban'
    const confirmed = confirm(
      isBanned
        ? `Unban ${userName}? They will be able to log in again.`
        : `Ban ${userName}? They will be immediately signed out and cannot log in until unbanned.`
    )
    if (!confirmed) return
    setLoading(true)
    setError('')
    const res = isBanned ? await unbanUser(userId) : await banUser(userId)
    if (res?.error) setError(res.error)
    else router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleBan}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
          isBanned
            ? 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
            : 'bg-red-50 border border-red-200 text-red-600 hover:bg-red-100'
        }`}
      >
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : isBanned
            ? <ShieldCheck size={14} />
            : <Ban size={14} />
        }
        {isBanned ? 'Unban User' : 'Ban User'}
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  )
}
