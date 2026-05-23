'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle2, Clock, ArrowRight,
  LifeBuoy, FileText, RefreshCw, XCircle, UserCheck
} from 'lucide-react'

interface Props {
  transaction: any
}

type Stage = 'waiting_acceptance' | 'confirming' | 'confirmed' | 'sending' | 'confirm_receipt'

const TERMINAL_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']

function getStage(status: string): Stage {
  switch (status) {
    case 'pending_acceptance':
    case 'pending_seller':        return 'waiting_acceptance'
    case 'pending_ops_confirmation': return 'confirming'
    case 'payment_confirmed':     return 'confirmed'
    case 'fulfillment_in_progress': return 'sending'
    case 'pending_receipt_confirmation': return 'confirm_receipt'
    default: return 'confirming'
  }
}

export default function WaitingClient({ transaction }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(transaction.status)

  // Re-sync status when server re-renders with updated props (after router.refresh())
  useEffect(() => {
    setStatus(transaction.status)
  }, [transaction.status])

  const sendAmount = transaction.send_amount ?? transaction.from_amount
  const sendCurrency = transaction.send_currency ?? transaction.from_currency
  const receiveAmount = transaction.receive_amount ?? transaction.to_amount
  const receiveCurrency = transaction.receive_currency ?? transaction.to_currency
  const txRef = transaction.hoxa_transaction_id ?? ''
  const sellerName = transaction.sellers?.profiles?.full_name ?? 'Exchanger'

  const stage = getStage(status)

  // Poll for status changes every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Use router.refresh() to get updated data from server
        router.refresh()
      } catch {}
    }, 15000)

    return () => clearInterval(interval)
  }, [router])

  // Redirect when status moves forward or hits terminal
  useEffect(() => {
    if (
      status === 'pending_receipt_confirmation' ||
      status === 'fully_completed' ||
      status === 'completed' ||
      TERMINAL_STATUSES.includes(status)
    ) {
      router.push(`/dashboard/transactions/${transaction.id}`)
    }
  }, [status, transaction.id, router])

  const steps = [
    {
      key: 'acceptance',
      label: 'Exchanger accepts your request',
      active: stage === 'waiting_acceptance',
      done: !['waiting_acceptance'].includes(stage),
    },
    {
      key: 'confirming',
      label: 'HOXA verifies your payment',
      active: stage === 'confirming',
      done: ['confirmed', 'sending', 'confirm_receipt'].includes(stage),
    },
    {
      key: 'sending',
      label: `Exchanger sends your ${receiveCurrency}`,
      active: stage === 'confirmed' || stage === 'sending',
      done: stage === 'confirm_receipt',
    },
    {
      key: 'receipt',
      label: 'You confirm receipt',
      active: stage === 'confirm_receipt',
      done: false,
    },
  ]

  const headingText =
    stage === 'waiting_acceptance' ? 'Waiting for exchanger to accept...' :
    stage === 'confirming' ? 'Confirming your payment...' :
    stage === 'confirmed' ? 'Payment confirmed!' :
    stage === 'sending' ? `${sellerName} is sending your ${receiveCurrency}...` :
    'Confirm receipt to complete'

  const headingIcon =
    stage === 'waiting_acceptance' ? <UserCheck size={32} className="text-amber-500" /> :
    stage === 'confirming' ? <Loader2 size={32} className="text-[#177945] animate-spin" /> :
    <CheckCircle2 size={32} className="text-green-500" />

  return (
    <div className="max-w-xl mx-auto space-y-5 min-w-0 overflow-hidden">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Animated header */}
        <div className="px-4 sm:px-6 py-6 sm:py-8 text-center border-b border-gray-100">
          <div className="flex justify-center mb-4">
            {headingIcon}
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">{headingText}</h1>
          <p className="text-gray-500 text-sm">
            {txRef && <span className="font-medium text-gray-600">{txRef} · </span>}
            {sendAmount?.toLocaleString()} {sendCurrency} → {receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {receiveCurrency}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* Progress steps */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">What happens next</p>

            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                {/* Step indicator */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  step.done
                    ? 'bg-green-500 text-white'
                    : step.active
                    ? 'bg-[#177945] text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {step.done ? (
                    <CheckCircle2 size={14} />
                  ) : step.active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Step label */}
                <span className={`text-sm ${
                  step.done
                    ? 'text-green-600 font-medium line-through'
                    : step.active
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-400'
                }`}>
                  {step.done && '✓ '}{step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Typical wait time */}
          <div className="bg-[#F7F9F8] rounded-xl p-4 flex items-center gap-3">
            <Clock size={16} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700 font-medium">Typical wait: 5–10 minutes</p>
              <p className="text-xs text-gray-400">during operating hours</p>
            </div>
          </div>

          {/* Window expiry message if applicable */}
          {status === 'awaiting_payment' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-700 font-medium mb-2">
                We could not confirm your payment within the required window.
              </p>
              <p className="text-xs text-amber-600 mb-3">
                Please try again. Your exchange rate is still reserved.
              </p>
              <Link
                href={`/dashboard/exchange/pay?tx=${transaction.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:opacity-90"
              >
                <RefreshCw size={13} /> Try Again
              </Link>
            </div>
          )}

          {/* Action links */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/dashboard/transactions/${transaction.id}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <FileText size={14} /> View Transaction Details
            </Link>
            <Link
              href="/dashboard/support"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
            >
              <LifeBuoy size={14} /> Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
