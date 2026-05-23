'use client'

import { Check, Clock, Loader2, ShieldCheck, Banknote, CheckCircle2, XCircle, AlertTriangle, Send } from 'lucide-react'
import type { TransactionStatus } from '@/types'

// V5.1 steps — maps status to step index
const STEPS = [
  { key: 'accepted',    label: 'Order Accepted',       icon: Check },
  { key: 'payment',     label: 'Payment Confirmed',    icon: ShieldCheck },
  { key: 'fulfillment', label: 'Sending Your Funds',   icon: Send },
  { key: 'receipt',     label: 'Receipt Confirmed',     icon: Banknote },
  { key: 'settled',     label: 'Completed',             icon: CheckCircle2 },
]

const STATUS_TO_STEP: Record<string, number> = {
  // Pre-flow
  initiated: -1,
  queued: -1,
  pending_acceptance: -1,
  pending_seller: -1,   // legacy

  // Step 0: Accepted
  awaiting_payment: 0,

  // Step 1: Payment confirmed
  pending_ops_confirmation: 1,
  payment_confirmed: 1,

  // Step 2: Fulfillment
  fulfillment_in_progress: 2,
  fulfillment: 2,        // legacy

  // Step 3: Receipt
  pending_receipt_confirmation: 3,
  receipt_confirmed: 3,
  auto_confirmed: 3,

  // Step 4: Complete
  pending_settlement: 4,
  fully_completed: 4,
  completed: 4,          // legacy
}

const TERMINAL_STATUSES: Record<string, { label: string; desc: string; color: string; bg: string; Icon: typeof XCircle }> = {
  seller_rejected: {
    label: 'Seller Rejected',
    desc: 'The seller declined this request. Try another seller.',
    color: 'text-red-500', bg: 'bg-red-50 border-red-200', Icon: XCircle,
  },
  seller_timeout: {
    label: 'Seller Timed Out',
    desc: 'Seller did not respond in time. Try another seller.',
    color: 'text-red-500', bg: 'bg-red-50 border-red-200', Icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    desc: 'This transaction was cancelled.',
    color: 'text-red-500', bg: 'bg-red-50 border-red-200', Icon: XCircle,
  },
  disputed: {
    label: 'Dispute Opened',
    desc: 'A dispute has been opened. Our team is investigating.',
    color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', Icon: AlertTriangle,
  },
  expired: {
    label: 'Expired',
    desc: 'This exchange has expired. You can start a new one.',
    color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', Icon: Clock,
  },
}

export default function TransactionTracker({ status }: { status: TransactionStatus | string }) {
  // Terminal states
  const terminal = TERMINAL_STATUSES[status]
  if (terminal) {
    const { Icon } = terminal
    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${terminal.bg}`}>
        <Icon size={28} className={terminal.color} />
        <div>
          <p className={`font-bold ${terminal.color}`}>{terminal.label}</p>
          <p className="text-gray-500 text-sm">{terminal.desc}</p>
        </div>
      </div>
    )
  }

  // Waiting for acceptance
  if (['initiated', 'queued', 'pending_acceptance', 'pending_seller'].includes(status)) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-200 bg-amber-50">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock size={20} className="text-amber-600 animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-amber-800">Waiting for Acceptance</p>
          <p className="text-amber-600 text-sm">Your exchange request is being processed.</p>
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_TO_STEP[status] ?? 0
  const isComplete = status === 'fully_completed' || status === 'completed' || status === 'pending_settlement'

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting line bg */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        {/* Progress fill */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-[#177945] z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (Math.min(currentIndex, STEPS.length - 1) / (STEPS.length - 1)) * 100)}%` }}
        />

        {STEPS.map((step, i) => {
          const done = isComplete ? true : i < currentIndex
          const active = !isComplete && i === currentIndex
          const Icon = step.icon

          return (
            <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  done ? 'bg-[#177945] text-white'
                    : active ? 'bg-[#177945] text-white ring-4 ring-[#177945]/20'
                    : 'bg-white border-2 border-gray-200 text-gray-400'
                }`}
              >
                {done ? (
                  <Check size={14} strokeWidth={2.5} />
                ) : active ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Icon size={13} />
                )}
              </div>
              <p className={`text-[10px] mt-2 text-center font-medium leading-tight max-w-[80px] ${
                done || active ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
