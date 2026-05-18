'use client'

import { useState } from 'react'
import { Check, X, Loader2, ChevronDown, ChevronUp, Phone, Globe } from 'lucide-react'
import { approveSellerApplication, rejectSellerApplication } from '@/actions/profile'
import { useRouter } from 'next/navigation'

export default function SellerApplicationRow({ application: a }: { application: any }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function approve() {
    setLoading('approve')
    await approveSellerApplication(a.id, a.profiles?.id)
    router.refresh()
  }

  async function reject() {
    setLoading('reject')
    await rejectSellerApplication(a.id, a.profiles?.id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm">
              {a.profiles?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{a.profiles?.full_name ?? '—'}</p>
              <div className="flex items-center gap-3 text-gray-400 text-xs mt-0.5">
                <span className="flex items-center gap-1"><Globe size={10} /> {a.profiles?.country}</span>
                <span className="flex items-center gap-1"><Phone size={10} /> {a.profiles?.phone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Currencies</p>
              <p className="font-medium text-gray-900">{a.currencies?.join(', ') || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Payment Methods</p>
              <p className="font-medium text-gray-900">{a.payment_methods?.join(', ') || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Daily Limit</p>
              <p className="font-medium text-gray-900">{a.daily_limit?.toLocaleString() ?? '0'} GHS</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Applied</p>
              <p className="font-medium text-gray-900">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={reject}
            disabled={loading !== null}
            className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === 'reject' ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
          </button>
          <button
            onClick={approve}
            disabled={loading !== null}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading === 'approve' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
          </button>
        </div>
      </div>
    </div>
  )
}
