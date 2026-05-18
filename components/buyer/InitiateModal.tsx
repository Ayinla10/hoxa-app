'use client'

import { useState } from 'react'
import { X, Loader2, ShieldCheck, ArrowRight } from 'lucide-react'
import { initiateTransaction } from '@/actions/transactions'
import { useRouter } from 'next/navigation'

interface Offer {
  id: string
  from_currency: string
  to_currency: string
  rate: number
  min_amount: number
  max_amount: number
  available_liquidity: number
  sellers: { completion_rate: number; profiles: { full_name: string } }
}

export default function InitiateModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fromAmount = parseFloat(amount) || 0
  const toAmount = fromAmount * offer.rate
  const valid = fromAmount >= offer.min_amount && fromAmount <= offer.max_amount && fromAmount <= offer.available_liquidity

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    setError('')
    setLoading(true)

    const result = await initiateTransaction(offer.id, fromAmount)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(`/dashboard/transactions/${result.transactionId}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Initiate Exchange</h2>
            <p className="text-gray-400 text-xs mt-0.5">with {offer.sellers?.profiles?.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Rate info */}
          <div className="bg-[#F7F9F8] rounded-xl p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Exchange Rate</span>
              <span className="font-semibold text-gray-900">1 {offer.from_currency} = {offer.rate} {offer.to_currency}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Seller Rating</span>
              <span className="font-semibold text-gray-900">{offer.sellers?.completion_rate ?? 0}% completion</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Limits</span>
              <span className="text-gray-700">{offer.min_amount.toLocaleString()} – {offer.max_amount.toLocaleString()} {offer.from_currency}</span>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">You Send ({offer.from_currency})</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={`Min ${offer.min_amount}`}
              min={offer.min_amount}
              max={Math.min(offer.max_amount, offer.available_liquidity)}
              step="0.01"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all"
            />
          </div>

          {/* You receive */}
          {fromAmount > 0 && (
            <div className="bg-[#177945]/5 border border-[#177945]/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs mb-1">You Receive</p>
                  <p className="text-2xl font-bold text-[#177945]">{toAmount.toFixed(2)} <span className="text-base">{offer.to_currency}</span></p>
                </div>
                <ArrowRight size={20} className="text-[#177945]/40" />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {/* Escrow note */}
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <ShieldCheck size={14} className="text-[#177945] mt-0.5 flex-shrink-0" />
            <span>This transaction is escrow-protected. Your payment is only released when the seller fulfils.</span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !valid || !fromAmount}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : 'Confirm Exchange'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
