'use client'


import { useState } from 'react'
import { MessageCircle, AlertTriangle, HelpCircle, ShieldAlert, X, Loader2, Upload, ImageIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import { submitSupportDispute } from '@/actions/exchange'
import BackButton from '@/components/ui/BackButton'

const ISSUE_TYPES = [
  { value: 'payment_not_received', label: 'Payment not received' },
  { value: 'wrong_amount', label: 'Wrong amount sent' },
  { value: 'seller_unresponsive', label: 'Seller unresponsive' },
  { value: 'other', label: 'Other issue' },
]

const FAQS = [
  {
    q: 'How does HOXA work?',
    a: 'HOXA connects you with verified local exchangers who complete currency transfers peer-to-peer. You send funds to the exchanger, they release the equivalent in your destination currency.',
  },
  {
    q: 'How long does an exchange take?',
    a: 'Most exchanges complete within 15–30 minutes once both sides confirm. The exchanger has a fulfillment window set by ops after payment confirmation.',
  },
  {
    q: 'What happens if the exchanger doesn\'t respond?',
    a: 'If a seller times out, your transaction is automatically cancelled and no money is moved. You can browse the marketplace to find another exchanger.',
  },
  {
    q: 'Is my money safe?',
    a: 'All transactions go through our escrow-style flow. Funds are only released to the seller after you confirm receipt. If anything goes wrong, open a dispute and our ops team will review.',
  },
  {
    q: 'How do I open a dispute?',
    a: 'Use the "Open Dispute" option on this page or on your transaction detail page. Provide a clear description and any evidence (screenshots). Ops typically reviews within 24 hours.',
  },
  {
    q: 'What fees does HOXA charge?',
    a: 'HOXA charges a small platform fee on each transaction, shown clearly before you confirm. There are no hidden charges.',
  },
]

interface Props {
  transactions: any[]
  whatsappNumber?: string
}

export default function SupportPageClient({ transactions, whatsappNumber }: Props) {
  const { t } = useI18n()
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const WHATSAPP_NUMBER = whatsappNumber ?? '+233000000000'
  const SUPPORT_EMAIL = 'support@hoxa.app'

  const supportCards = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      desc: 'Chat with our support team on WhatsApp for quick help.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      action: () => window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`, '_blank'),
      cta: 'Open WhatsApp',
      disabled: false,
    },
    {
      icon: AlertTriangle,
      title: t('open_dispute'),
      desc: 'Report an issue with a transaction and get it resolved.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      action: () => setShowDisputeForm(true),
      cta: t('open_dispute'),
      disabled: false,
    },
    {
      icon: HelpCircle,
      title: t('faqs'),
      desc: 'Find answers to commonly asked questions about HOXA.',
      color: 'text-[#177945]',
      bg: 'bg-[#177945]/10',
      border: 'border-[#177945]/20',
      action: () => document.getElementById('faqs-section')?.scrollIntoView({ behavior: 'smooth' }),
      cta: 'View FAQs',
      disabled: false,
    },
    {
      icon: ShieldAlert,
      title: t('report_fraud'),
      desc: 'Report suspicious activity or fraudulent behavior.',
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-100',
      action: () => window.open(`mailto:${SUPPORT_EMAIL}?subject=Fraud%20Report&body=Please%20describe%20the%20suspicious%20activity%3A`, '_blank'),
      cta: 'Email Report',
      disabled: false,
    },
  ]

  const disputedTxs = transactions.filter((tx: any) => tx.status === 'disputed')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <BackButton href="/dashboard" />
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('support_title')}</h1>
        <p className="text-gray-400 text-sm mt-0.5">{t('support_sub')}</p>
      </div>

      {/* Support option cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {supportCards.map((card) => (
          <div key={card.title} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-5 flex flex-col`}>
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon size={18} className={card.color} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm mb-1">{card.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed mb-4 flex-1">{card.desc}</p>
            <button
              onClick={card.action}
              disabled={card.disabled}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all self-start ${
                card.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#177945] to-[#1a9152] text-white hover:opacity-90'
              }`}
            >
              {card.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Your disputes */}
      <div className="space-y-3">
        <h2 className="font-bold text-gray-900 text-sm">Your Disputes</h2>
        {disputedTxs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <AlertTriangle size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium text-sm">{t('no_disputes')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('no_disputes_sub')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {disputedTxs.map((tx: any) => (
              <div key={tx.id} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{tx.hoxa_transaction_id ?? tx.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{tx.from_amount} {tx.from_currency} → {tx.to_currency}</p>
                  {tx.dispute_reason && (
                    <p className="text-xs text-amber-600 mt-1">{tx.dispute_reason}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                  Under Review
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQs */}
      <div id="faqs-section" className="space-y-3">
        <h2 className="font-bold text-gray-900 text-sm">Frequently Asked Questions</h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 pr-4">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dispute modal */}
      {showDisputeForm && (
        <DisputeModal
          transactions={transactions}
          onClose={() => setShowDisputeForm(false)}
        />
      )}
    </div>
  )
}

function DisputeModal({ transactions, onClose }: { transactions: any[]; onClose: () => void }) {
  const { t } = useI18n()
  const [txnId, setTxnId] = useState('')
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const activeTx = transactions.filter((tx: any) =>
    !['cancelled', 'seller_rejected', 'seller_timeout', 'fully_completed', 'disputed'].includes(tx.status)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!txnId || !issueType || !description) return
    setLoading(true)
    setError('')

    const result = await submitSupportDispute({ transactionId: txnId, issueType, description })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <h2 className="font-bold text-gray-900 text-lg mb-2">Dispute Submitted</h2>
          <p className="text-gray-500 text-sm mb-2">Our ops team has been notified and will review your dispute.</p>
          <p className="text-gray-400 text-xs mb-6">You can track the status in <strong>Your Disputes</strong> above.</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-[#177945] text-white text-sm font-semibold hover:opacity-90">
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">{t('open_dispute')}</h2>
            <p className="text-gray-400 text-xs mt-0.5">Report an issue with a transaction</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {activeTx.length === 0 && (
            <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-sm">
              You have no active transactions to dispute.
            </div>
          )}

          {/* Transaction select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('select_transaction')}</label>
            <select
              value={txnId}
              onChange={e => setTxnId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10"
            >
              <option value="">Select a transaction…</option>
              {activeTx.map((tx: any) => (
                <option key={tx.id} value={tx.id}>
                  {tx.hoxa_transaction_id ?? tx.id.slice(0, 8)} — {tx.from_amount} {tx.from_currency} → {tx.to_currency}
                </option>
              ))}
            </select>
          </div>

          {/* Issue type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('issue_type')}</label>
            <select
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm bg-white focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10"
            >
              <option value="">Select issue type…</option>
              {ISSUE_TYPES.map(it => (
                <option key={it.value} value={it.value}>{it.label}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('description')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in detail…"
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !txnId || !issueType || !description || activeTx.length === 0}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : t('submit_dispute')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
