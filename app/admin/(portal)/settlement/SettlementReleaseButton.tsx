'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SendHorizonal, Loader2, CheckCircle2 } from 'lucide-react'
import { opsReleaseSettlement } from '@/actions/exchange'

export default function SettlementReleaseButton({ transactionId }: { transactionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRelease() {
    if (!confirm('Release settlement to seller? This cannot be undone.')) return
    setLoading(true)
    const res = await opsReleaseSettlement(transactionId)
    setLoading(false)
    if (res?.error) {
      alert(res.error)
    } else {
      setDone(true)
      router.refresh()
    }
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle2 size={13} /> Released
      </span>
    )
  }

  return (
    <button
      onClick={handleRelease}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm whitespace-nowrap"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <SendHorizonal size={12} />}
      {loading ? 'Releasing...' : 'Release'}
    </button>
  )
}
