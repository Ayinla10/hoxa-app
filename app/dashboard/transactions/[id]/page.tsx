import { getTransactionById } from '@/actions/transactions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck, ExternalLink } from 'lucide-react'
import TransactionTracker from '@/components/buyer/TransactionTracker'
import PaymentProofUpload from '@/components/buyer/PaymentProofUpload'
import type { TransactionStatus } from '@/types'

export default async function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tx = await getTransactionById(id)
  if (!tx) redirect('/dashboard/transactions')

  const seller = tx.sellers
  const sellerProfile = seller?.profiles

  const deadlineMs = tx.seller_response_deadline ? new Date(tx.seller_response_deadline).getTime() - Date.now() : null
  const secondsLeft = deadlineMs ? Math.max(0, Math.floor(deadlineMs / 1000)) : null

  return (
    <div className="max-w-3xl space-y-5">
      {/* Back */}
      <Link href="/dashboard/transactions" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={14} /> Back to transactions
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-gray-400 text-xs font-mono mb-1">TXN · {tx.id.slice(0, 12)}…</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {tx.from_amount.toLocaleString()} {tx.from_currency}
              <span className="text-gray-400 mx-2 font-normal">→</span>
              {tx.to_amount.toFixed(2)} {tx.to_currency}
            </h1>
            <p className="text-gray-400 text-sm mt-1">Rate: 1 {tx.from_currency} = {tx.rate} {tx.to_currency}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">{new Date(tx.created_at).toLocaleString()}</p>
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center gap-3 p-4 bg-[#F7F9F8] rounded-xl">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm">
            {sellerProfile?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-semibold text-sm">{sellerProfile?.full_name ?? 'Seller'}</p>
            <p className="text-gray-400 text-xs">{sellerProfile?.country} · {seller?.completion_rate ?? 0}% completion rate</p>
          </div>
          <ShieldCheck size={16} className="text-[#177945]" />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Transaction tracker */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-5">Transaction Status</h2>
          <TransactionTracker status={tx.status as TransactionStatus} />

          {/* Deadline for pending */}
          {tx.status === 'pending_seller' && secondsLeft !== null && (
            <div className="mt-5 p-3 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-orange-700 text-xs font-medium">Seller response deadline</p>
              <p className="text-orange-600 text-xs mt-0.5">If seller doesn't respond in time, you'll be notified.</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Upload proof */}
          {tx.status === 'seller_accepted' && (
            <div className="bg-white rounded-2xl border border-[#177945]/30 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Upload Payment Proof</h2>
              <p className="text-gray-500 text-xs mb-4">Send your payment and upload proof to continue.</p>
              <PaymentProofUpload transactionId={tx.id} />
            </div>
          )}

          {/* Existing proof */}
          {tx.payment_proof_url && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Payment Proof</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-900">{tx.payment_reference ?? '—'}</span>
                </div>
                {tx.payment_notes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Notes</span>
                    <span className="text-gray-700">{tx.payment_notes}</span>
                  </div>
                )}
                <a
                  href={tx.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#177945] text-sm font-medium hover:underline mt-2"
                >
                  View proof <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}

          {/* Transaction details */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Details</h3>
            <div className="space-y-2.5 text-sm">
              {[
                { label: 'You send', value: `${tx.from_amount.toLocaleString()} ${tx.from_currency}` },
                { label: 'You receive', value: `${tx.to_amount.toFixed(2)} ${tx.to_currency}` },
                { label: 'Rate', value: `${tx.rate} ${tx.to_currency}/${tx.from_currency}` },
                { label: 'Status', value: tx.status.replace(/_/g, ' ') },
                ...(tx.completed_at ? [{ label: 'Completed', value: new Date(tx.completed_at).toLocaleString() }] : []),
              ].map(d => (
                <div key={d.label} className="flex justify-between">
                  <span className="text-gray-400">{d.label}</span>
                  <span className="font-medium text-gray-900 capitalize">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
