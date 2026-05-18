'use client'

import { useState } from 'react'
import { Check, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { verifyPayment } from '@/actions/transactions'
import { useRouter } from 'next/navigation'

export default function AdminTransactionRow({ transaction: tx }: { transaction: any }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleVerify() {
    setLoading(true)
    await verifyPayment(tx.id)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-yellow-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-mono text-gray-400 text-xs mb-1">TXN · {tx.id.slice(0, 12)}…</p>
            <p className="font-bold text-gray-900">{tx.from_amount?.toLocaleString()} {tx.from_currency} → {tx.to_amount?.toFixed(2)} {tx.to_currency}</p>
          </div>
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-gray-400 text-xs">Buyer</p>
            <p className="font-medium text-gray-900">{tx.profiles?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Seller</p>
            <p className="font-medium text-gray-900">{tx.sellers?.profiles?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Reference</p>
            <p className="font-medium text-gray-900">{tx.payment_reference ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Submitted</p>
            <p className="font-medium text-gray-900">{new Date(tx.created_at).toLocaleString()}</p>
          </div>
        </div>

        {expanded && tx.payment_notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
            <p className="text-gray-400 text-xs mb-1">Buyer Notes</p>
            {tx.payment_notes}
          </div>
        )}

        {tx.payment_proof_url && (
          <a
            href={tx.payment_proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#177945] text-sm font-medium hover:underline mb-4"
          >
            <ExternalLink size={14} /> View Payment Proof
          </a>
        )}

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : <><Check size={14} /> Verify & Release to Seller</>}
        </button>
      </div>
    </div>
  )
}
