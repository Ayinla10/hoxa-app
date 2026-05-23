'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { opsConfirmPayment, opsRejectPayment, opsReleaseSettlement, opsFavourBuyer } from '@/actions/exchange'
import { markRefundSent } from '@/actions/admin'
import {
  CheckCircle2, XCircle, SendHorizonal, Loader2,
  AlertTriangle, ChevronDown, Banknote
} from 'lucide-react'

const REJECT_REASONS: { value: string; label: string; desc: string }[] = [
  { value: 'not_received',      label: 'Payment not received',    desc: 'No payment found in account' },
  { value: 'amount_wrong',      label: 'Wrong amount',            desc: 'Amount does not match order' },
  { value: 'reference_missing', label: 'Reference missing',       desc: 'No transaction reference included' },
  { value: 'sender_mismatch',   label: 'Sender mismatch',         desc: 'Payment from unregistered account' },
  { value: 'fraud_suspected',   label: 'Fraud suspected',         desc: 'Suspicious activity detected' },
]

interface Props {
  transaction: any
}

export default function AdminTxActions({ transaction: tx }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('not_received')
  const [refundNotes, setRefundNotes] = useState('')
  const [showRefundForm, setShowRefundForm] = useState(false)

  async function act(key: string, fn: () => Promise<{ error?: string } | undefined | null>) {
    setLoading(key)
    setError('')
    setSuccess('')
    const res = await fn()
    setLoading(null)
    if (res?.error) {
      setError(res.error)
    } else {
      setSuccess('Done!')
      setTimeout(() => setSuccess(''), 2000)
      router.refresh()
    }
  }

  const status = tx.status

  // No actions for terminal / already-settled states
  const isTerminal = ['fully_completed', 'seller_rejected', 'seller_timeout', 'cancelled', 'expired'].includes(status)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
      <h2 className="font-bold text-gray-900 text-sm mb-1">Ops Actions</h2>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-2.5 rounded-xl">
          <AlertTriangle size={13} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-2.5 rounded-xl">
          <CheckCircle2 size={13} /> {success}
        </div>
      )}

      {/* PENDING_OPS_CONFIRMATION — Confirm or Reject payment */}
      {status === 'pending_ops_confirmation' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 font-medium">
            Buyer claimed payment. Verify in your banking app then confirm or reject below.
          </div>

          {/* Confirm button */}
          <button
            onClick={() => act('confirm', () => opsConfirmPayment(tx.id))}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading === 'confirm'
              ? <><Loader2 size={15} className="animate-spin" /> Confirming...</>
              : <><CheckCircle2 size={15} /> Confirm Payment — Release to Seller</>
            }
          </button>

          {/* Reject flow */}
          {!showRejectForm ? (
            <button
              onClick={() => setShowRejectForm(true)}
              className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
            >
              <XCircle size={14} /> Reject Payment
            </button>
          ) : (
            <div className="border border-red-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                <p className="text-red-700 text-xs font-semibold">Select rejection reason:</p>
              </div>
              <div className="divide-y divide-red-50">
                {REJECT_REASONS.map(r => (
                  <label key={r.value} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-red-50/50 transition-colors">
                    <input
                      type="radio"
                      name="reject_reason"
                      value={r.value}
                      checked={rejectReason === r.value}
                      onChange={e => setRejectReason(e.target.value)}
                      className="mt-0.5 accent-red-500 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.label}</p>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 px-4 py-3 bg-red-50 border-t border-red-100">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2 rounded-xl border border-red-200 text-red-500 text-xs font-medium hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => act('reject', () => opsRejectPayment(tx.id, rejectReason))}
                  disabled={loading !== null}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loading === 'reject' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                  Confirm Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PENDING_SETTLEMENT — Release settlement to seller */}
      {status === 'pending_settlement' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-green-700 text-xs font-semibold mb-1">Ready for settlement</p>
            <p className="text-green-600 text-xs">Buyer confirmed receipt. Release funds to seller.</p>
            {tx.seller_settlement_amount && (
              <p className="text-green-800 font-bold text-base mt-2">
                {tx.seller_settlement_amount?.toLocaleString()} {tx.send_currency ?? tx.from_currency}
              </p>
            )}
          </div>
          <button
            onClick={() => act('settle', () => opsReleaseSettlement(tx.id))}
            disabled={loading !== null}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading === 'settle'
              ? <><Loader2 size={15} className="animate-spin" /> Releasing...</>
              : <><SendHorizonal size={15} /> Release Settlement to Seller</>
            }
          </button>
        </div>
      )}

      {/* DISPUTED */}
      {status === 'disputed' && (
        <div className="space-y-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-700 text-xs font-semibold mb-1">Dispute open — funds frozen</p>
            <p className="text-red-600 text-xs">Investigate by checking payment records and contacting both parties before resolving.</p>
            {tx.dispute_reason && (
              <p className="text-red-700 text-xs font-medium mt-2 bg-red-100 px-2 py-1 rounded-lg">
                Buyer's reason: {tx.dispute_reason}
              </p>
            )}
          </div>

          {/* Favour Seller */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600">Seller is right — buyer's claim is false</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Release funds to seller. Buyer gets nothing.</p>
            </div>
            <div className="px-3 py-2.5">
              <button
                onClick={() => act('resolve_seller', () => opsReleaseSettlement(tx.id))}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#18824a] to-[#0f6a3d] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading === 'resolve_seller' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Favour Seller — Release Settlement
              </button>
            </div>
          </div>

          {/* Favour Buyer */}
          <div className="border border-red-100 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-red-50 border-b border-red-100">
              <p className="text-xs font-semibold text-red-700">Buyer is right — seller failed to deliver</p>
              <p className="text-[10px] text-red-400 mt-0.5">Cancel transaction, penalise seller, manually refund buyer.</p>
            </div>
            <div className="px-3 py-2.5">
              <button
                onClick={() => act('resolve_buyer', () => opsFavourBuyer(tx.id))}
                disabled={loading !== null}
                className="w-full py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading === 'resolve_buyer' ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                Favour Buyer — Cancel & Penalise Seller
              </button>
            </div>
          </div>

          <p className="text-amber-600 text-[10px] bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
            ⚠️ If you favour the buyer, you must manually refund them via bank transfer. The system will notify them that a refund is on the way.
          </p>
        </div>
      )}

      {/* PENDING_ACCEPTANCE — seller hasn't responded */}
      {status === 'pending_acceptance' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-medium">
          Waiting for seller to accept. No ops action required yet.
        </div>
      )}

      {/* AWAITING_PAYMENT — buyer needs to pay */}
      {status === 'awaiting_payment' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 font-medium">
          Buyer is viewing payment instructions. No ops action required yet.
        </div>
      )}

      {/* FULFILLMENT_IN_PROGRESS — seller sending */}
      {status === 'fulfillment_in_progress' && (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700 font-medium">
          Seller has been instructed to send funds. Monitoring for completion.
        </div>
      )}

      {/* PENDING_RECEIPT_CONFIRMATION — waiting for buyer */}
      {status === 'pending_receipt_confirmation' && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 font-medium">
          Seller marked fulfilled. Waiting for buyer to confirm receipt. Auto-confirms in ~3 hours.
        </div>
      )}

      {/* Terminal — with optional refund tracking for cancelled */}
      {isTerminal && (
        <div className="space-y-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-500 font-medium text-center">
            This transaction is in a terminal state. No further action required.
          </div>

          {/* Manual refund tracking — only for cancelled (buyer-favoured disputes) */}
          {status === 'cancelled' && (
            tx.manual_refund_sent_at ? (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
                <Banknote size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-700 text-xs font-semibold">Refund marked as sent</p>
                  <p className="text-blue-500 text-[10px] mt-0.5">
                    {new Date(tx.manual_refund_sent_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {tx.manual_refund_notes && (
                    <p className="text-blue-600 text-[10px] mt-1 italic">"{tx.manual_refund_notes}"</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-blue-100 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">Manual Refund Tracking</p>
                    <p className="text-[10px] text-blue-400 mt-0.5">Once you've sent the bank refund, log it here.</p>
                  </div>
                  {!showRefundForm && (
                    <button
                      onClick={() => setShowRefundForm(true)}
                      className="text-[10px] font-bold text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Log Refund
                    </button>
                  )}
                </div>
                {showRefundForm && (
                  <div className="px-3 py-3 space-y-2">
                    <textarea
                      value={refundNotes}
                      onChange={e => setRefundNotes(e.target.value)}
                      placeholder="Notes (e.g. sent via GTBank, ref: TXN123)…"
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRefundForm(false)}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => act('refund', () => markRefundSent(tx.id, refundNotes))}
                        disabled={loading !== null}
                        className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        {loading === 'refund' ? <Loader2 size={12} className="animate-spin" /> : <Banknote size={12} />}
                        Mark Sent
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
