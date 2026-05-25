import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import { redirect } from 'next/navigation'
import AdminTxActions from './AdminTxActions'
import { requireAdminPermission } from '@/lib/admin-guard'
import {
  ArrowLeft, ArrowRight, User, Store, Clock, CheckCircle2,
  AlertTriangle, CreditCard, SendHorizonal, ReceiptText, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'
import CurrencyFlag from '@/components/ui/CurrencyFlag'

interface Props {
  params: Promise<{ id: string }>
}

const STATUS_CONFIG: Record<string, { label: string; pill: string; dot: string; description: string }> = {
  pending_acceptance:           { label: 'Awaiting Seller',    pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',          description: 'Seller has not yet accepted this exchange.' },
  awaiting_payment:             { label: 'Awaiting Payment',   pill: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',          description: 'Buyer needs to send payment.' },
  pending_ops_confirmation:     { label: 'Needs Review',       pill: 'bg-blue-100 text-blue-800 border-blue-300',     dot: 'bg-blue-600',           description: 'Buyer tapped "I\'ve Paid". Verify the payment before releasing.' },
  fulfillment_in_progress:      { label: 'Sending Funds',      pill: 'bg-teal-50 text-teal-700 border-teal-200',      dot: 'bg-teal-500',           description: 'Seller has been instructed to send funds.' },
  pending_receipt_confirmation: { label: 'Awaiting Receipt',   pill: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-400',          description: 'Seller marked fulfilled. Waiting for buyer to confirm receipt.' },
  pending_settlement:           { label: 'Release Funds',      pill: 'bg-green-100 text-green-800 border-green-300',  dot: 'bg-green-600',          description: 'Buyer confirmed receipt. Release settlement to seller.' },
  fully_completed:              { label: 'Completed',          pill: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500',          description: 'Exchange fully completed and settled.' },
  disputed:                     { label: 'Disputed',           pill: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-500',            description: 'Buyer raised a dispute. Funds held until resolved.' },
  seller_rejected:              { label: 'Seller Rejected',    pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400',           description: 'Seller declined this exchange.' },
  seller_timeout:               { label: 'Timed Out',          pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400',           description: 'Seller did not respond in time.' },
  cancelled:                    { label: 'Cancelled',          pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400',           description: 'Transaction was cancelled.' },
  expired:                      { label: 'Expired',            pill: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400',           description: 'Transaction expired before completion.' },
}

function Field({ label, value, mono = false, highlight = false }: { label: string; value?: string | null; mono?: boolean; highlight?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
      <p className={`text-sm ${mono ? 'font-mono' : 'font-medium'} ${highlight ? 'text-[#18824a] font-bold' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function TimelineItem({ icon: Icon, label, time, color = 'text-gray-400', done = false }: {
  icon: any; label: string; time?: string | null; color?: string; done?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-50' : 'bg-gray-100'}`}>
        <Icon size={14} className={done ? 'text-green-600' : 'text-gray-400'} />
      </div>
      <div className="flex-1 min-w-0 pb-4 border-b border-gray-50 last:border-0">
        <p className={`text-sm font-medium ${done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
        {time && <p className="text-xs text-gray-400 mt-0.5">{new Date(time).toLocaleString()}</p>}
      </div>
    </div>
  )
}

export default async function AdminTransactionDetailPage({ params }: Props) {
  await requireAdminPermission('transactions')
  const { id } = await params
  const supabase = createServiceClient()

  const { data: tx } = await supabase
    .from('transactions')
    .select(`
      id, status, created_at,
      buyer_id, seller_id, offer_id,
      send_amount, send_currency, receive_amount, receive_currency,
      from_amount, from_currency, to_amount, to_currency,
      exchange_rate, rate, hoxa_fee_amount, seller_settlement_amount,
      hoxa_transaction_id,
      buyer_send_account, buyer_send_provider,
      buyer_receive_account, buyer_receive_provider,
      buyer_destination_country,
      rate_locked_at, ive_paid_tapped_at, payment_window_expires_at,
      payment_confirmed_at, fulfillment_confirmed_at,
      receipt_confirmed_at, settlement_released_at, completed_at,
      dispute_reason, dispute_notes, ops_reject_reason,
      manual_refund_sent_at, manual_refund_notes,
      profiles!buyer_id(id, full_name, phone, country),
      sellers(
        id, user_id, completion_rate, total_transactions,
        profiles(id, full_name, phone, country)
      )
    `)
    .eq('id', id)
    .single()

  if (!tx) redirect('/admin/transactions')

  const status = STATUS_CONFIG[tx.status] ?? { label: tx.status, pill: 'bg-gray-100 text-gray-500 border-gray-200', dot: 'bg-gray-400', description: '' }
  const sendAmt = tx.send_amount ?? tx.from_amount
  const sendCur = tx.send_currency ?? tx.from_currency
  const recvAmt = tx.receive_amount ?? tx.to_amount
  const recvCur = tx.receive_currency ?? tx.to_currency
  const txRate = tx.exchange_rate ?? tx.rate
  const ref = tx.hoxa_transaction_id ?? tx.id.slice(0, 8)
  const buyer = tx.profiles as any
  const seller = tx.sellers as any

  const paymentWindowExpires = tx.payment_window_expires_at ? new Date(tx.payment_window_expires_at) : null
  const windowMinutesLeft = paymentWindowExpires ? Math.max(0, Math.round((paymentWindowExpires.getTime() - Date.now()) / 60000)) : null

  return (
    <>
      <AdminTopbar title={`Transaction ${ref}`} />
      <div className="px-4 lg:px-8 py-5 space-y-5 max-w-5xl">

        {/* Back */}
        <Link href="/admin/transactions" className="inline-flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-800 transition-colors">
          <ArrowLeft size={15} /> Back to Transactions
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${status.pill}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
                <span className="font-mono text-gray-400 text-xs">{ref}</span>
              </div>
              <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-gray-900 mb-1">
                <CurrencyFlag code={sendCur} size={22}/> {sendAmt?.toLocaleString()} {sendCur}
                <ArrowRight size={18} className="text-gray-400" />
                <CurrencyFlag code={recvCur} size={22}/> {recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {recvCur}
              </h1>
              <p className="flex items-center gap-1.5 text-gray-500 text-sm">Rate: <CurrencyFlag code={sendCur} size={14}/> 1 {sendCur} = {txRate} {recvCur} <CurrencyFlag code={recvCur} size={14}/></p>
              {status.description && (
                <p className="text-gray-400 text-xs mt-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">{status.description}</p>
              )}
            </div>
            <div className="text-sm text-right lg:flex-shrink-0">
              <p className="text-gray-400 text-xs">Created</p>
              <p className="text-gray-700 font-medium">{new Date(tx.created_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Payment window warning */}
          {tx.status === 'pending_ops_confirmation' && windowMinutesLeft !== null && (
            <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
              windowMinutesLeft < 5 ? 'bg-red-50 border-red-200 text-red-700' :
              windowMinutesLeft < 10 ? 'bg-amber-50 border-amber-200 text-amber-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              <Clock size={14} />
              {windowMinutesLeft > 0
                ? `Payment window closes in ${windowMinutesLeft} minute${windowMinutesLeft !== 1 ? 's' : ''}`
                : 'Payment window has expired'
              }
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-5">

          {/* Left col: details */}
          <div className="lg:col-span-2 space-y-5">

            {/* Financial breakdown */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <CreditCard size={14} className="text-gray-400" /> Financial Breakdown
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Buyer Pays" value={`${sendAmt?.toLocaleString()} ${sendCur}`} highlight />
                <Field label="Buyer Receives" value={`${recvAmt?.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${recvCur}`} highlight />
                <Field label="Exchange Rate" value={`1 ${sendCur} = ${txRate} ${recvCur}`} />
                {tx.hoxa_fee_amount != null && <Field label="HOXA Fee" value={`${tx.hoxa_fee_amount?.toLocaleString()} ${sendCur}`} />}
                {tx.seller_settlement_amount != null && <Field label="Seller Settlement" value={`${tx.seller_settlement_amount?.toLocaleString()} ${sendCur}`} highlight />}
              </div>
            </div>

            {/* Buyer info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <User size={14} className="text-gray-400" /> Buyer Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={buyer?.full_name} />
                <Field label="Country" value={buyer?.country} />
                <Field label="Phone" value={buyer?.phone} mono />
                <Field label="Send Account" value={tx.buyer_send_account} mono />
                <Field label="Send Provider" value={tx.buyer_send_provider} />
                <Field label="Receive Account" value={tx.buyer_receive_account} mono />
                <Field label="Receive Provider" value={tx.buyer_receive_provider} />
                <Field label="Destination Country" value={tx.buyer_destination_country} />
              </div>
            </div>

            {/* Seller info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Store size={14} className="text-gray-400" /> Seller Information
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={seller?.profiles?.full_name} />
                <Field label="Country" value={seller?.profiles?.country} />
                <Field label="Phone" value={seller?.profiles?.phone} mono />
                <Field label="Completion Rate" value={seller?.completion_rate != null ? `${seller.completion_rate}%` : null} />
                <Field label="Total Exchanges" value={seller?.total_transactions?.toString()} />
              </div>
            </div>

            {/* Dispute info */}
            {tx.status === 'disputed' && tx.dispute_reason && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <h2 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle size={14} /> Dispute Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Dispute Reason" value={tx.dispute_reason} />
                </div>
              </div>
            )}

            {/* Ops notes */}
            {tx.ops_reject_reason && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h2 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> Ops Rejection Note
                </h2>
                <p className="text-amber-700 text-sm">{tx.ops_reject_reason}</p>
              </div>
            )}
          </div>

          {/* Right col: actions + timeline */}
          <div className="space-y-5">

            {/* OPS ACTIONS — client component */}
            <AdminTxActions transaction={tx} />

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Clock size={14} className="text-gray-400" /> Timeline
              </h2>
              <div className="space-y-0">
                <TimelineItem icon={CheckCircle2} label="Transaction created" time={tx.created_at} done />
                <TimelineItem icon={ShieldCheck} label="Seller accepted" time={tx.rate_locked_at} done={!!tx.rate_locked_at && tx.status !== 'pending_acceptance'} />
                <TimelineItem icon={CreditCard} label="Buyer tapped 'I've Paid'" time={tx.ive_paid_tapped_at} done={!!tx.ive_paid_tapped_at} />
                <TimelineItem icon={CheckCircle2} label="Payment confirmed by ops" time={tx.payment_confirmed_at} done={!!tx.payment_confirmed_at} />
                <TimelineItem icon={SendHorizonal} label="Seller marked fulfilled" time={tx.fulfillment_confirmed_at} done={!!tx.fulfillment_confirmed_at} />
                <TimelineItem icon={ReceiptText} label="Buyer confirmed receipt" time={tx.receipt_confirmed_at} done={!!tx.receipt_confirmed_at} />
                <TimelineItem icon={CheckCircle2} label="Settlement released" time={tx.settlement_released_at} done={!!tx.settlement_released_at} />
                {tx.completed_at && <TimelineItem icon={CheckCircle2} label="Fully completed" time={tx.completed_at} done />}
              </div>
            </div>

            {/* Raw IDs for debugging */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Debug Info</p>
              <div className="space-y-2">
                <div><p className="text-[10px] text-gray-400">Transaction ID</p><p className="font-mono text-xs text-gray-600 break-all">{tx.id}</p></div>
                <div><p className="text-[10px] text-gray-400">Buyer ID</p><p className="font-mono text-xs text-gray-600 break-all">{tx.buyer_id}</p></div>
                <div><p className="text-[10px] text-gray-400">Seller ID</p><p className="font-mono text-xs text-gray-600 break-all">{tx.seller_id}</p></div>
                {tx.offer_id && <div><p className="text-[10px] text-gray-400">Offer ID</p><p className="font-mono text-xs text-gray-600 break-all">{tx.offer_id}</p></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
