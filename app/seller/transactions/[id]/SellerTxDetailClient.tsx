'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, Clock, AlertTriangle, SendHorizonal,
  Loader2, Copy, User, Phone, Globe, CreditCard, Banknote,
  ArrowRight, ShieldCheck, XCircle,
} from 'lucide-react'
import { sellerMarkFulfilled } from '@/actions/exchange'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending_acceptance:           { label: 'Pending Acceptance',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  awaiting_payment:             { label: 'Awaiting Buyer Payment', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  pending_ops_confirmation:     { label: 'Ops Verifying Payment',  color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  fulfillment_in_progress:      { label: 'Send Funds Now ⚡',      color: 'text-teal-700',   bg: 'bg-teal-50',   border: 'border-teal-200' },
  pending_receipt_confirmation: { label: 'Awaiting Buyer Receipt', color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  pending_settlement:           { label: 'Settling',               color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
  fully_completed:              { label: 'Completed',              color: 'text-green-800',  bg: 'bg-green-100', border: 'border-green-300' },
  disputed:                     { label: 'Disputed — Funds Frozen',color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200' },
  seller_rejected:              { label: 'You Rejected',           color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  seller_timeout:               { label: 'Timed Out',              color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200' },
  cancelled:                    { label: 'Cancelled',              color: 'text-gray-600',   bg: 'bg-gray-100',  border: 'border-gray-200' },
  expired:                      { label: 'Expired',                color: 'text-gray-500',   bg: 'bg-gray-100',  border: 'border-gray-200' },
}

interface Props {
  tx: any
  sellerUserId: string
}

export default function SellerTxDetailClient({ tx, sellerUserId }: Props) {
  const router = useRouter()
  const [fulfilling, setFulfilling] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const st = STATUS_MAP[tx.status] ?? { label: tx.status, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }

  // Field resolution (V5.1 + legacy fallback)
  const sendAmount = tx.send_amount ?? tx.from_amount
  const sendCurrency = tx.send_currency ?? tx.from_currency
  const receiveAmount = tx.receive_amount ?? tx.to_amount
  const receiveCurrency = tx.receive_currency ?? tx.to_currency
  const rate = tx.exchange_rate ?? tx.rate
  const txRef = tx.hoxa_transaction_id ?? `HOXA-${tx.id.slice(0, 8).toUpperCase()}`
  const settlementAmount = tx.seller_settlement_amount ?? sendAmount

  const buyer = tx.profiles as any

  const isTerminal = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired'].includes(tx.status)
  const isComplete = tx.status === 'fully_completed'
  const isDisputed = tx.status === 'disputed'

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  async function handleFulfill() {
    setFulfilling(true)
    setError('')
    const res = await sellerMarkFulfilled(tx.id)
    if (res?.error) {
      setError(res.error)
      setFulfilling(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {/* Back */}
      <Link href="/seller/transactions" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm">
        <ArrowLeft size={15} /> Back to Transactions
      </Link>

      {/* Status banner */}
      <div className={`${st.bg} ${st.border} border rounded-2xl px-5 py-4 flex items-center justify-between gap-4`}>
        <div>
          <p className={`font-bold text-base ${st.color}`}>{st.label}</p>
          <p className="text-gray-500 text-xs mt-0.5">Ref: {txRef}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.bg} ${st.color} border ${st.border}`}>
          {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Dispute alert */}
      {tx.status === 'disputed' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={15} className="text-red-600" />
            <p className="font-bold text-red-800 text-sm">Buyer has opened a dispute</p>
          </div>
          <p className="text-red-600 text-xs leading-relaxed">{tx.dispute_reason ?? 'No reason given.'}</p>
          <p className="text-red-500 text-xs mt-2">Funds are frozen. HOXA Ops is reviewing. You will be notified of the outcome.</p>
        </div>
      )}

      {/* ACTION CARD: Fulfillment */}
      {tx.status === 'fulfillment_in_progress' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <SendHorizonal size={16} className="text-teal-700" />
            <p className="font-bold text-teal-800 text-sm">Action required — Send funds now</p>
          </div>
          <div className="bg-white rounded-xl p-4 mb-4 space-y-2">
            <Row label="Send to account" value={tx.buyer_receive_account ?? '—'} copyKey="account" copied={copied} onCopy={() => copy(tx.buyer_receive_account, 'account')} />
            <Row label="Via" value={tx.buyer_receive_provider ?? '—'} />
            <Row label="Amount to send" value={`${receiveAmount?.toFixed(2)} ${receiveCurrency}`} bold />
          </div>
          {error && (
            <p className="text-red-600 text-xs bg-red-50 px-3 py-2 rounded-xl mb-3">{error}</p>
          )}
          <button
            onClick={handleFulfill}
            disabled={fulfilling}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {fulfilling ? <><Loader2 size={15} className="animate-spin" /> Processing…</> : <><CheckCircle2 size={15} /> I've Sent the Funds</>}
          </button>
          <p className="text-teal-700 text-xs text-center mt-2">Only tap this after you have actually sent the money.</p>
        </div>
      )}

      {/* Transaction summary */}
      <div className={`bg-white rounded-2xl border shadow-sm p-5 space-y-4 ${isTerminal ? 'border-gray-200 opacity-75' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Transaction Summary</h2>
          {isTerminal && (
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">Did not complete</span>
          )}
          {isComplete && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
              <CheckCircle2 size={11} /> Completed
            </span>
          )}
          {isDisputed && (
            <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-medium">Disputed</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3 ${isTerminal ? 'bg-gray-50' : 'bg-[#F7F9F8]'}`}>
            <p className="text-gray-400 text-xs mb-0.5">{isTerminal ? 'Would-be buyer amount' : isComplete ? 'Buyer paid' : 'Buyer sends'}</p>
            <p className={`font-bold text-base ${isTerminal ? 'text-gray-400' : 'text-gray-900'}`}>{sendAmount?.toLocaleString()} {sendCurrency}</p>
          </div>
          <div className={`rounded-xl p-3 ${isTerminal ? 'bg-gray-50' : 'bg-[#F7F9F8]'}`}>
            <p className="text-gray-400 text-xs mb-0.5">{isTerminal ? 'Would-be receive amount' : isComplete ? 'Buyer received' : 'Buyer receives'}</p>
            <p className={`font-bold text-base ${isTerminal ? 'text-gray-400' : 'text-gray-900'}`}>{receiveAmount?.toFixed(2)} {receiveCurrency}</p>
          </div>
          <div className="bg-[#F7F9F8] rounded-xl p-3">
            <p className="text-gray-400 text-xs mb-0.5">Exchange rate</p>
            <p className="text-gray-900 font-semibold text-sm">1 {sendCurrency} = {rate} {receiveCurrency}</p>
          </div>
          <div className={`rounded-xl p-3 ${isTerminal ? 'bg-gray-50' : isComplete ? 'bg-green-50' : 'bg-[#F7F9F8]'}`}>
            <p className="text-gray-400 text-xs mb-0.5">{isTerminal ? 'Settlement' : isComplete ? 'You earned' : 'Your settlement'}</p>
            <p className={`font-bold text-base ${isTerminal ? 'text-gray-400' : 'text-[#18824a]'}`}>
              {isTerminal ? '—' : `${settlementAmount?.toLocaleString()} ${sendCurrency}`}
            </p>
          </div>
        </div>

        {isTerminal && (
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
            <XCircle size={13} className="text-gray-400 flex-shrink-0" />
            <p className="text-gray-400 text-xs">No funds were moved. This transaction did not complete.</p>
          </div>
        )}

        {tx.hoxa_fee_amount > 0 && !isTerminal && (
          <div className="flex items-center justify-between text-xs text-gray-400 px-1">
            <span>HOXA platform fee</span>
            <span>{tx.hoxa_fee_amount} {sendCurrency}</span>
          </div>
        )}
      </div>

      {/* Buyer info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900 text-sm">Buyer Details</h2>
        <div className="space-y-2.5">
          <InfoRow icon={User} label="Name" value={buyer?.full_name ?? '—'} />
          <InfoRow icon={Globe} label="Country" value={buyer?.country ?? '—'} />
          {tx.buyer_send_account && (
            <InfoRow icon={CreditCard} label="Buyer sends from" value={`${tx.buyer_send_account} (${tx.buyer_send_provider ?? ''})`} />
          )}
          {tx.buyer_receive_account && (
            <InfoRow icon={Banknote} label="Buyer receives at" value={`${tx.buyer_receive_account} (${tx.buyer_receive_provider ?? ''})`} copyKey="receive" copied={copied} onCopy={() => copy(tx.buyer_receive_account, 'receive')} />
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900 text-sm">Timeline</h2>
        <TimelineItem icon={Clock} label="Created" value={fmt(tx.created_at)} active />
        {tx.accepted_at && <TimelineItem icon={CheckCircle2} label="Accepted" value={fmt(tx.accepted_at)} active />}
        {tx.payment_confirmed_at && <TimelineItem icon={CheckCircle2} label="Payment confirmed" value={fmt(tx.payment_confirmed_at)} active />}
        {tx.fulfilled_at && <TimelineItem icon={SendHorizonal} label="You sent funds" value={fmt(tx.fulfilled_at)} active />}
        {tx.receipt_confirmed_at && <TimelineItem icon={CheckCircle2} label="Buyer confirmed receipt" value={fmt(tx.receipt_confirmed_at)} active />}
        {tx.settled_at && <TimelineItem icon={ShieldCheck} label="Settlement released" value={fmt(tx.settled_at)} active />}
        {(tx.status === 'seller_rejected' || tx.status === 'seller_timeout') && (
          <TimelineItem icon={XCircle} label={tx.status === 'seller_rejected' ? 'Rejected by you' : 'Timed out'} value={fmt(tx.updated_at)} active={false} danger />
        )}
      </div>
    </div>
  )
}

function fmt(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function Row({ label, value, bold, copyKey, copied, onCopy }: {
  label: string; value: string; bold?: boolean
  copyKey?: string; copied?: string; onCopy?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400 text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-300 hover:text-[#18824a] transition-colors">
            <Copy size={12} />
          </button>
        )}
        {copyKey && copied === copyKey && <span className="text-[#18824a] text-[10px] font-medium">Copied!</span>}
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, copyKey, copied, onCopy }: {
  icon: any; label: string; value: string
  copyKey?: string; copied?: string; onCopy?: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={14} className="text-gray-300 flex-shrink-0" />
      <span className="text-gray-400 text-xs w-32 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-gray-900 text-sm font-medium truncate">{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-300 hover:text-[#18824a] transition-colors flex-shrink-0">
            <Copy size={12} />
          </button>
        )}
        {copyKey && copied === copyKey && <span className="text-[#18824a] text-[10px] font-medium flex-shrink-0">Copied!</span>}
      </div>
    </div>
  )
}

function TimelineItem({ icon: Icon, label, value, active, danger }: {
  icon: any; label: string; value: string; active: boolean; danger?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 ${active ? '' : 'opacity-40'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        danger ? 'bg-red-50' : active ? 'bg-[#18824a]/10' : 'bg-gray-100'
      }`}>
        <Icon size={13} className={danger ? 'text-red-500' : active ? 'text-[#18824a]' : 'text-gray-400'} />
      </div>
      <div className="flex-1 flex items-center justify-between gap-2">
        <span className="text-sm text-gray-700 font-medium">{label}</span>
        <span className="text-xs text-gray-400">{value}</span>
      </div>
    </div>
  )
}
