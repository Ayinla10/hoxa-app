import { getAuthUser } from '@/lib/supabase/server'
import { getSettings } from '@/actions/settings'
import { findReplacementSeller } from '@/actions/exchange'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ShieldCheck, LifeBuoy, ArrowRight, CheckCircle2,
  Clock, AlertTriangle, Star, FileText, Copy, RefreshCw, Store
} from 'lucide-react'
import TransactionTracker from '@/components/buyer/TransactionTracker'
import ReceiptConfirmationOverlay from '@/components/buyer/ReceiptConfirmationOverlay'
import RatingWidget from '@/components/buyer/RatingWidget'
import TransactionDetailClient from './TransactionDetailClient'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { user, supabase } = await getAuthUser()
  if (!user) redirect('/login')

  const [txResult, settings, ratingResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, sellers(id, user_id, completion_rate, avg_response_seconds, total_transactions, profiles(full_name, country))')
      .eq('id', id)
      .eq('buyer_id', user.id)
      .single(),
    getSettings(),
    supabase
      .from('ratings')
      .select('score')
      .eq('transaction_id', id)
      .eq('rater_id', user.id)
      .maybeSingle(),
  ])

  const isTerminalStatus = (s: string) => ['seller_rejected', 'seller_timeout'].includes(s)

  const tx = txResult.data
  if (!tx) redirect('/dashboard/transactions')

  // Fetch replacement seller if this transaction was rejected/timed out
  const replacement = isTerminalStatus(tx.status) ? await findReplacementSeller(id) : null

  const seller = tx.sellers as any
  const sellerProfile = seller?.profiles
  const sellerName = sellerProfile?.full_name ?? 'Exchanger'
  const sellerUserId: string | null = seller?.user_id ?? null
  const existingRatingScore: number | null = ratingResult.data?.score ?? null

  // V5.1 field resolution with legacy fallbacks
  const sendAmount = tx.send_amount ?? tx.from_amount
  const sendCurrency = tx.send_currency ?? tx.from_currency
  const receiveAmount = tx.receive_amount ?? tx.to_amount
  const receiveCurrency = tx.receive_currency ?? tx.to_currency
  const exchangeRate = tx.exchange_rate ?? tx.rate
  const txRef = tx.hoxa_transaction_id ?? `HOXA-${tx.id.slice(0, 8).toUpperCase()}`
  const hoxaFee = tx.hoxa_fee_amount ?? 0

  // Status classification
  const status = tx.status
  const isTerminal = ['cancelled', 'seller_rejected', 'seller_timeout', 'expired'].includes(status)
  const isDisputed = status === 'disputed'
  const isComplete = status === 'fully_completed' || status === 'completed'
  const isPendingReceipt = status === 'pending_receipt_confirmation'
  const isPendingSettlement = status === 'pending_settlement'
  const isActive = !isTerminal && !isComplete && !isDisputed

  // Status-specific data
  const paymentWindowExpires = tx.payment_window_expires_at
  const autoConfirmDue = tx.auto_confirm_due_at

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5 pb-8 min-w-0 overflow-hidden">
      {/* Back */}
      <Link href="/dashboard/transactions" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={14} /> Back to transactions
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4 sm:mb-5 gap-3">
          <div className="min-w-0">
            <p className="text-gray-400 text-xs font-mono mb-1">{txRef}</p>
            <h1 className="flex flex-wrap items-center gap-2 text-lg sm:text-2xl font-bold text-gray-900">
              <CurrencyFlag code={sendCurrency} size={22} /> {sendAmount?.toLocaleString()} {sendCurrency}
              <span className="text-gray-400 font-normal">→</span>
              <CurrencyFlag code={receiveCurrency} size={22} /> {receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {receiveCurrency}
            </h1>
            <p className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
              Rate: <CurrencyFlag code={sendCurrency} size={14} /> 1 {sendCurrency} = {exchangeRate} {receiveCurrency} <CurrencyFlag code={receiveCurrency} size={14} />
              {hoxaFee > 0 && (
                <span className="ml-3 text-gray-300">
                  Fee: {sendCurrency} {hoxaFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              )}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-gray-400 text-[10px] sm:text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
            <StatusBadge status={status} />
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-[#F7F9F8] rounded-xl">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm">
              {sellerName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-semibold text-sm">{sellerName}</p>
            <p className="text-gray-400 text-xs">
              {sellerProfile?.country ?? ''}
              {seller?.completion_rate ? ` · ${seller.completion_rate}% completion` : ''}
              {seller?.total_transactions ? ` · ${seller.total_transactions} exchanges` : ''}
            </p>
          </div>
          <ShieldCheck size={16} className="text-[#177945]" />
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6">
        <h2 className="font-bold text-gray-900 mb-4 sm:mb-5">Transaction Progress</h2>
        <TransactionTracker status={status} />
      </div>

      {/* ─── Status-specific sections ─── */}

      {/* Awaiting Payment: redirect to pay page */}
      {status === 'awaiting_payment' && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock size={22} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Awaiting Your Payment</h2>
              <p className="text-gray-500 text-xs">Complete your payment to proceed with this exchange.</p>
            </div>
          </div>
          <Link
            href={`/dashboard/exchange/pay?tx=${tx.id}`}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#177945]/20"
          >
            Make Payment <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Pending Ops Confirmation */}
      {status === 'pending_ops_confirmation' && (
        <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Verifying Your Payment</h2>
              <p className="text-gray-500 text-xs">We're confirming your payment. This usually takes a few minutes.</p>
            </div>
          </div>

          {/* Verification timeline */}
          <div className="space-y-3 pl-4 border-l-2 border-blue-200 ml-2">
            {[
              { label: 'Payment claim submitted', done: true },
              { label: 'Verification in progress', done: true, active: true },
              { label: 'Notify exchanger', done: false },
              { label: 'Exchanger sends your funds', done: false },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3 relative">
                <div className={`w-2.5 h-2.5 rounded-full -ml-[21px] flex-shrink-0 ${
                  step.active ? 'bg-blue-500 animate-pulse' : step.done ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
                <p className={`text-sm ${step.done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>

          {/* Payment window countdown */}
          {paymentWindowExpires && (
            <TransactionDetailClient
              type="payment_window"
              deadline={paymentWindowExpires}
            />
          )}
        </div>
      )}

      {/* Fulfillment in Progress */}
      {(status === 'fulfillment_in_progress' || status === 'payment_confirmed' || status === 'fulfillment') && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <ShieldCheck size={22} className="text-teal-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Payment Verified!</h2>
              <p className="text-gray-500 text-xs">
                {sellerName} is now sending {receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {receiveCurrency} to your account.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-teal-50/50 rounded-xl p-4 space-y-2 text-sm">
            {tx.buyer_receive_provider && (
              <div className="flex justify-between">
                <span className="text-gray-500">Receiving via</span>
                <span className="font-medium text-gray-900">{tx.buyer_receive_provider}</span>
              </div>
            )}
            {tx.buyer_receive_account && (
              <div className="flex justify-between">
                <span className="text-gray-500">To account</span>
                <span className="font-medium text-gray-900 font-mono">{tx.buyer_receive_account}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Receipt Confirmation — show info banner (overlay handles the CTA) */}
      {isPendingReceipt && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Funds Sent to You</h2>
              <p className="text-gray-500 text-xs">
                {sellerName} reports sending {receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {receiveCurrency}. Please confirm receipt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Settlement */}
      {isPendingSettlement && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-green-800 text-lg">Receipt Confirmed</h2>
              <p className="text-green-600 text-sm">Your exchange is being finalized. Settlement in progress.</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Completed State ─── */}
      {isComplete && (
        <div className="bg-white rounded-2xl border border-green-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-green-800 text-lg">Exchange Complete!</h2>
              <p className="text-green-600 text-sm">Your exchange was successfully completed.</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-green-50/50 rounded-xl p-4 space-y-2.5 text-sm">
            {[
              { label: 'You Sent', value: `${sendAmount?.toLocaleString()} ${sendCurrency}` },
              { label: 'You Received', value: `${receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${receiveCurrency}` },
              { label: 'Exchanger', value: sellerName },
              { label: 'Rate', value: `1 ${sendCurrency} = ${exchangeRate} ${receiveCurrency}` },
              ...(hoxaFee > 0 ? [{ label: 'HOXA Fee', value: `${sendCurrency} ${hoxaFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }] : []),
              ...(tx.completed_at ? [{ label: 'Completed', value: new Date(tx.completed_at).toLocaleString() }] : []),
              { label: 'Reference', value: txRef },
            ].map(d => (
              <div key={d.label} className="flex justify-between">
                <span className="text-gray-500">{d.label}</span>
                <span className="font-medium text-gray-900">{d.value}</span>
              </div>
            ))}
          </div>

          {/* Rating */}
          {sellerUserId && (
            <div className="border-t border-gray-100 pt-4">
              <RatingWidget
                transactionId={tx.id}
                rateeId={sellerUserId}
                role="buyer"
                rateeName={sellerName}
                existingScore={existingRatingScore}
              />
            </div>
          )}

          {/* Post-transaction actions */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Exchange Again <ArrowRight size={13} />
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Back Home
            </Link>
          </div>
        </div>
      )}

      {/* ─── Disputed State ─── */}
      {isDisputed && (
        <div className="bg-white rounded-2xl border border-purple-200 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <AlertTriangle size={22} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-purple-800">Dispute Under Review</h2>
              <p className="text-purple-600 text-sm">
                Your funds are protected. Our team is investigating this exchange.
              </p>
            </div>
          </div>
          {tx.dispute_reason && (
            <div className="bg-purple-50/50 rounded-xl p-4 text-sm">
              <p className="text-gray-500 text-xs mb-1">Reason reported</p>
              <p className="text-gray-900 font-medium">{tx.dispute_reason}</p>
            </div>
          )}
          <Link
            href="/dashboard/support"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-purple-200 text-purple-700 font-medium text-sm hover:bg-purple-50 transition-colors"
          >
            <LifeBuoy size={14} /> Contact Support About This Dispute
          </Link>
        </div>
      )}

      {/* ─── Transaction Details Card (always shown) ─── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Transaction Details</h3>
        <div className="space-y-2.5 text-sm">
          {[
            { label: 'You send', value: `${sendAmount?.toLocaleString()} ${sendCurrency}` },
            { label: 'You receive', value: `${receiveAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${receiveCurrency}` },
            { label: 'Rate', value: `1 ${sendCurrency} = ${exchangeRate} ${receiveCurrency}` },
            ...(hoxaFee > 0 ? [{ label: 'HOXA Fee', value: `${sendCurrency} ${hoxaFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}` }] : []),
            { label: 'Exchanger', value: sellerName },
            ...(tx.buyer_receive_provider ? [{ label: 'Receive via', value: `${tx.buyer_receive_provider}` }] : []),
            ...(tx.buyer_receive_account ? [{ label: 'Receive account', value: tx.buyer_receive_account }] : []),
            { label: 'Status', value: formatStatus(status) },
            { label: 'Reference', value: txRef },
            ...(tx.completed_at ? [{ label: 'Completed', value: new Date(tx.completed_at).toLocaleString() }] : []),
            { label: 'Created', value: new Date(tx.created_at).toLocaleString() },
          ].map(d => (
            <div key={d.label} className="flex justify-between">
              <span className="text-gray-400">{d.label}</span>
              <span className="font-medium text-gray-900">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Seller Rejected / Timeout ─── */}
      {(status === 'seller_rejected' || status === 'seller_timeout') && (
        <div className="space-y-3">
          {/* What happened */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={22} className="text-red-500" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">
                  {status === 'seller_rejected' ? 'Exchanger Declined' : 'Exchanger Didn\'t Respond'}
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  {status === 'seller_rejected'
                    ? 'This exchanger couldn\'t complete your request. Your funds were never moved.'
                    : 'This exchanger didn\'t respond in time. Your funds were never moved.'}
                </p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <ShieldCheck size={15} className="text-green-600 flex-shrink-0" />
              <p className="text-green-700 text-sm font-medium">Your money is safe — no payment was taken.</p>
            </div>
          </div>

          {/* Replacement seller */}
          {replacement ? (
            <div className="bg-white rounded-2xl border border-[#18824a]/20 shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw size={15} className="text-[#18824a]" />
                <p className="text-sm font-bold text-gray-900">We found you a better match</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#F7F9F8] rounded-xl mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {replacement.seller_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{replacement.seller_name}</p>
                  <p className="text-gray-400 text-xs">
                    {replacement.seller_country}
                    {replacement.completion_rate > 0 && ` · ${replacement.completion_rate}% completion`}
                    {replacement.total_transactions > 0 && ` · ${replacement.total_transactions} exchanges`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[#18824a] font-bold text-sm">{replacement.rate}</p>
                  <p className="text-gray-400 text-xs">rate</p>
                </div>
              </div>
              <Link
                href={`/dashboard/marketplace?from=${replacement.send_currency}&to=${replacement.receive_currency}&amount=${replacement.send_amount}`}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#177945]/20"
              >
                Find New Exchanger <ArrowRight size={14} />
              </Link>
              <p className="text-gray-400 text-xs text-center mt-2">Marketplace pre-filtered for your corridor and amount.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <Store size={16} className="text-gray-400" />
                <p className="text-sm font-bold text-gray-900">Try another exchanger</p>
              </div>
              <p className="text-gray-400 text-sm mb-4">No other exchangers are available for this corridor right now. Check back soon or try a different amount.</p>
              <Link
                href={`/dashboard/marketplace?from=${sendCurrency}&to=${receiveCurrency}&amount=${sendAmount}`}
                className="w-full py-3 rounded-xl border border-[#18824a] text-[#18824a] font-semibold text-sm hover:bg-[#18824a]/5 transition-colors flex items-center justify-center gap-2"
              >
                Browse Marketplace <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Support */}
      {isActive && (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/support"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <LifeBuoy size={14} /> Contact Support
          </Link>
        </div>
      )}

      {/* ═══ Receipt Confirmation Overlay ═══
          Forced overlay when status is pending_receipt_confirmation.
          Covers entire viewport, intercepts back button. */}
      {isPendingReceipt && <ReceiptConfirmationOverlay transaction={tx} />}
    </div>
  )
}

// ── Sub-components ──

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    initiated:                   { label: 'Initiated',            cls: 'bg-gray-100 text-gray-600' },
    queued:                      { label: 'Queued',               cls: 'bg-gray-100 text-gray-600' },
    pending_acceptance:          { label: 'Pending',              cls: 'bg-amber-50 text-amber-700' },
    pending_seller:              { label: 'Pending',              cls: 'bg-amber-50 text-amber-700' },
    awaiting_payment:            { label: 'Awaiting Payment',     cls: 'bg-amber-50 text-amber-700' },
    pending_ops_confirmation:    { label: 'Verifying',            cls: 'bg-blue-50 text-blue-700' },
    payment_confirmed:           { label: 'Confirmed',            cls: 'bg-teal-50 text-teal-700' },
    fulfillment_in_progress:     { label: 'Sending',              cls: 'bg-teal-50 text-teal-700' },
    fulfillment:                 { label: 'Sending',              cls: 'bg-teal-50 text-teal-700' },
    pending_receipt_confirmation:{ label: 'Confirm Receipt',      cls: 'bg-green-50 text-green-700' },
    receipt_confirmed:           { label: 'Received',             cls: 'bg-green-50 text-green-700' },
    auto_confirmed:              { label: 'Auto-Confirmed',       cls: 'bg-green-50 text-green-700' },
    pending_settlement:          { label: 'Settling',             cls: 'bg-green-50 text-green-700' },
    fully_completed:             { label: 'Completed',            cls: 'bg-green-100 text-green-800' },
    completed:                   { label: 'Completed',            cls: 'bg-green-100 text-green-800' },
    cancelled:                   { label: 'Cancelled',            cls: 'bg-red-50 text-red-600' },
    seller_rejected:             { label: 'Rejected',             cls: 'bg-red-50 text-red-600' },
    seller_timeout:              { label: 'Timed Out',            cls: 'bg-red-50 text-red-600' },
    disputed:                    { label: 'Disputed',             cls: 'bg-purple-50 text-purple-700' },
    expired:                     { label: 'Expired',              cls: 'bg-gray-100 text-gray-600' },
  }

  const c = config[status] ?? { label: status.replace(/_/g, ' '), cls: 'bg-gray-100 text-gray-600' }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold mt-1 capitalize ${c.cls}`}>
      {c.label}
    </span>
  )
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending_ops_confirmation: 'Payment being verified',
    fulfillment_in_progress: 'Exchanger sending funds',
    pending_receipt_confirmation: 'Awaiting your confirmation',
    pending_settlement: 'Settlement in progress',
    fully_completed: 'Completed',
  }
  return map[status] ?? status.replace(/_/g, ' ')
}
