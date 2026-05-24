'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle } from 'lucide-react'
import { buyerConfirmReceipt, buyerDisputeReceipt } from '@/actions/exchange'

interface Props {
  transaction: {
    id: string
    hoxa_transaction_id: string
    receive_amount: number | null
    receive_currency: string | null
    to_amount: number
    to_currency: string
    buyer_receive_account: string | null
    buyer_receive_provider: string | null
    auto_confirm_due_at: string | null
    sellers?: { profiles?: { full_name?: string } }
  }
}

const DISPUTE_REASONS = [
  { value: 'wrong_amount', label: 'I received the wrong amount' },
  { value: 'wrong_number', label: 'I received to the wrong number' },
  { value: 'nothing_received', label: 'I received nothing' },
  { value: 'other', label: 'Other' },
]

export default function ReceiptConfirmationOverlay({ transaction }: Props) {
  const [confirmError, setConfirmError] = useState('')
  const [disputeError, setDisputeError] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')
  const [disputeNotes, setDisputeNotes] = useState('')
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null)

  const receiveAmount = transaction.receive_amount ?? transaction.to_amount
  const receiveCurrency = transaction.receive_currency ?? transaction.to_currency
  const sellerName = transaction.sellers?.profiles?.full_name ?? 'Exchanger'
  const receiveAccount = transaction.buyer_receive_account ?? ''
  const receiveProvider = transaction.buyer_receive_provider ?? ''
  const txRef = transaction.hoxa_transaction_id ?? ''

  // Auto-confirm countdown
  useEffect(() => {
    if (!transaction.auto_confirm_due_at) return

    function updateCountdown() {
      const remaining = Math.max(0, Math.floor(
        (new Date(transaction.auto_confirm_due_at!).getTime() - Date.now()) / 1000
      ))
      setAutoCountdown(remaining)
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [transaction.auto_confirm_due_at])

  // Intercept back button
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      e.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }
    window.history.pushState(null, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const formatAutoConfirm = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  async function handleConfirmReceipt() {
    setConfirmError('')
    setLoading(true)
    const result = await buyerConfirmReceipt(transaction.id)
    if (result.error) {
      setConfirmError(result.error)
      setLoading(false)
      return
    }
    router.push(`/dashboard/transactions/${transaction.id}`)
    router.refresh()
  }

  async function handleDispute() {
    if (!disputeReason) return
    setDisputeError('')
    setLoading(true)
    const fullReason = disputeNotes
      ? `${disputeReason}: ${disputeNotes}`
      : disputeReason
    const result = await buyerDisputeReceipt(transaction.id, fullReason)
    if (result.error) {
      setDisputeError(result.error)
      setLoading(false)
      return
    }
    router.push(`/dashboard/transactions/${transaction.id}`)
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {!showDispute ? (
          <>
            {/* Main confirmation */}
            <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-green-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Did you receive your {receiveCurrency}?
              </h2>

              <div className="bg-[#F7F9F8] rounded-xl p-4 mb-4 text-left">
                <p className="text-xs text-gray-500 mb-1">{sellerName} claims to have sent:</p>
                <p className="text-2xl font-bold text-[#177945]">
                  {receiveCurrency} {receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {receiveProvider && receiveAccount && (
                  <p className="text-sm text-gray-600 mt-1">
                    To: {receiveProvider} — {receiveAccount}
                  </p>
                )}
                {txRef && (
                  <p className="text-xs text-gray-400 mt-1">Ref: {txRef}</p>
                )}
              </div>

              <p className="text-xs text-gray-500 mb-5">
                Confirming receipt releases the exchanger and completes your exchange.
              </p>

              {/* Confirm error */}
              {confirmError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-medium">{confirmError}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleConfirmReceipt}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60 shadow-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Yes, I received
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowDispute(true)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-60"
                >
                  <XCircle size={16} />
                  No, I didn't
                </button>
              </div>

              {/* Auto-confirm timer */}
              {autoCountdown !== null && autoCountdown > 0 && (
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-gray-400">
                  <Clock size={12} />
                  Auto-confirms in {formatAutoConfirm(autoCountdown)} if no response
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Dispute form */}
            <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-5 sm:pb-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="text-lg font-bold text-gray-900">Report an Issue</h2>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Your {receiveCurrency} {receiveAmount?.toLocaleString()} is fully protected. We'll investigate immediately.
              </p>

              {/* Reason selection */}
              <div className="space-y-2 mb-4">
                {DISPUTE_REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setDisputeReason(r.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      disputeReason === r.value
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Optional notes */}
              <textarea
                value={disputeNotes}
                onChange={e => setDisputeNotes(e.target.value)}
                placeholder="Add details (optional)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDispute(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleDispute}
                  disabled={loading || !disputeReason}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" />
                  ) : (
                    'Submit Dispute'
                  )}
                </button>
              </div>
              {disputeError && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl mt-2">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-600 text-xs font-medium">{disputeError}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
