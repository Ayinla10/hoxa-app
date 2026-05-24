'use client'

import { useI18n } from '@/lib/i18n-context'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2, CheckCircle2, Clock, ArrowRight,
  LifeBuoy, FileText, RefreshCw, XCircle, UserCheck, ShieldCheck
} from 'lucide-react'
import { handleSellerTimeout } from '@/actions/exchange'

interface Props {
  transaction: any
}

type Stage = 'waiting_acceptance' | 'confirming' | 'confirmed' | 'sending' | 'confirm_receipt'

const TERMINAL_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled', 'expired']

function getStage(status: string): Stage {
  switch (status) {
    case 'queued':
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
  const { t } = useI18n()
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

  // Seller ETA
  const avgSeconds: number | null = transaction.sellers?.avg_response_seconds ?? null
  function formatETA(s: number): string {
    if (s < 60) return 'under a minute'
    if (s < 3600) {
      const m = Math.round(s / 60)
      return `about ${m} minute${m !== 1 ? 's' : ''}`
    }
    const h = Math.round(s / 3600)
    return `about ${h} hour${h !== 1 ? 's' : ''}`
  }

  // Step timestamps
  function fmtTime(iso: string | null | undefined): string | null {
    if (!iso) return null
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  const acceptedTime = fmtTime(transaction.accepted_at)
  const confirmedTime = fmtTime(transaction.payment_confirmed_at)
  const sentTime = fmtTime(transaction.fulfillment_started_at)

  const stage = getStage(status)

  // Poll for status changes every 8 seconds; trigger timeout check when deadline passes
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // If we're still waiting for acceptance and deadline has passed, trigger reassignment
        if (status === 'pending_acceptance' || status === 'pending_seller') {
          const deadline = transaction.seller_response_deadline
          if (deadline && new Date(deadline) < new Date()) {
            await handleSellerTimeout(transaction.id)
          }
        }
        router.refresh()
      } catch {}
    }, 8000)

    return () => clearInterval(interval)
  }, [router, status, transaction.id, transaction.seller_response_deadline])

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
      sub: status === 'queued'
        ? 'HOXA is currently outside operating hours — your request will be processed when we open'
        : avgSeconds && avgSeconds > 0
        ? `${sellerName} typically responds in ${formatETA(avgSeconds)}`
        : 'Usually within a few minutes',
      timestamp: acceptedTime,
      active: stage === 'waiting_acceptance',
      done: stage !== 'waiting_acceptance',
    },
    {
      key: 'payment',
      label: 'You pay & HOXA verifies',
      sub: 'Send the exact amount via your chosen method — our team confirms receipt',
      timestamp: confirmedTime,
      active: ['confirming', 'confirmed'].includes(stage),
      done: ['sending', 'confirm_receipt'].includes(stage),
    },
    {
      key: 'receipt',
      label: `Funds sent & you confirm receipt`,
      sub: `Exchanger sends your ${receiveCurrency} — you confirm you got it to complete the exchange`,
      timestamp: sentTime,
      active: stage === 'sending' || stage === 'confirm_receipt',
      done: false,
    },
  ]

  const headingText =
    status === 'queued' ? 'Your exchange is queued' :
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
              <div key={step.key} className="flex items-start gap-3">
                {/* Step indicator */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  step.done
                    ? 'bg-green-500 text-white'
                    : step.active
                    ? 'bg-[#177945] text-white animate-pulse'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.done ? (
                    <CheckCircle2 size={14} />
                  ) : step.active ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>

                {/* Step label + sub + timestamp */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm font-medium leading-tight ${
                      step.done ? 'text-green-600' :
                      step.active ? 'text-gray-900 font-semibold' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </p>
                    {step.done && step.timestamp && (
                      <span className="text-[10px] text-green-500 font-mono flex-shrink-0">{step.timestamp}</span>
                    )}
                  </div>
                  {(step.active || (!step.done && i === steps.findIndex(s => !s.done))) && (
                    <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Exchange protection guarantee */}
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
            <ShieldCheck size={15} className="text-[#177945] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#177945]">Your payment is protected</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                HOXA holds your funds in escrow. The exchanger only receives them after you confirm you've received your money. You're always covered.
              </p>
            </div>
          </div>

          {/* Seller ETA / Typical wait time */}
          <div className="bg-[#F7F9F8] rounded-xl p-4 flex items-center gap-3">
            <Clock size={16} className="text-gray-400 flex-shrink-0" />
            <div>
              {avgSeconds && avgSeconds > 0 ? (
                <>
                  <p className="text-sm text-gray-700 font-medium">
                    {sellerName} typically responds in {formatETA(avgSeconds)}
                  </p>
                  <p className="text-xs text-gray-400">based on their recent exchanges</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-700 font-medium">Typical wait: 5–10 minutes</p>
                  <p className="text-xs text-gray-400">during operating hours</p>
                </>
              )}
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
