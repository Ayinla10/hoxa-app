import { Check, Clock, Upload, ShieldCheck, Banknote, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { TransactionStatus } from '@/types'

const STEPS: { status: TransactionStatus[]; label: string; desc: string; icon: any }[] = [
  {
    status: ['pending_seller'],
    label: 'Waiting for Seller',
    desc: 'Seller has 2 minutes to accept',
    icon: Clock,
  },
  {
    status: ['seller_accepted'],
    label: 'Seller Accepted',
    desc: 'Upload your payment proof now',
    icon: Check,
  },
  {
    status: ['payment_submitted'],
    label: 'Payment Submitted',
    desc: 'Admin is verifying your payment',
    icon: Upload,
  },
  {
    status: ['payment_verified'],
    label: 'Payment Verified',
    desc: 'Seller is sending your funds',
    icon: ShieldCheck,
  },
  {
    status: ['fulfillment'],
    label: 'Funds Being Sent',
    desc: 'Seller is fulfilling the order',
    icon: Banknote,
  },
  {
    status: ['completed'],
    label: 'Completed',
    desc: 'Exchange successful',
    icon: CheckCircle2,
  },
]

const TERMINAL_STATUSES = ['seller_rejected', 'seller_timeout', 'cancelled', 'disputed']

function getStepIndex(status: TransactionStatus) {
  return STEPS.findIndex(s => s.status.includes(status))
}

export default function TransactionTracker({ status }: { status: TransactionStatus }) {
  if (TERMINAL_STATUSES.includes(status)) {
    const isDispute = status === 'disputed'
    const Icon = isDispute ? AlertTriangle : XCircle
    const color = isDispute ? 'text-purple-600' : 'text-red-500'
    const bg = isDispute ? 'bg-purple-50 border-purple-200' : 'bg-red-50 border-red-200'
    const label = status === 'seller_rejected' ? 'Seller Rejected' : status === 'seller_timeout' ? 'Seller Timed Out' : status === 'disputed' ? 'Dispute Opened' : 'Cancelled'
    const desc = status === 'seller_rejected' ? 'The seller declined this request. Try another seller.' : status === 'seller_timeout' ? 'Seller did not respond in time. Try another seller.' : status === 'disputed' ? 'A dispute has been opened. Admin is reviewing.' : 'This transaction was cancelled.'

    return (
      <div className={`flex items-center gap-4 p-4 rounded-2xl border ${bg}`}>
        <Icon size={28} className={color} />
        <div>
          <p className={`font-bold ${color}`}>{label}</p>
          <p className="text-gray-500 text-sm">{desc}</p>
        </div>
      </div>
    )
  }

  const currentIndex = getStepIndex(status)

  return (
    <div className="relative">
      {STEPS.map((step, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const Icon = step.icon

        return (
          <div key={i} className="flex gap-4 pb-6 last:pb-0">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all
                ${done ? 'bg-[#177945] text-white' : active ? 'bg-[#177945] text-white ring-4 ring-[#177945]/20' : 'bg-gray-100 text-gray-400'}`}
              >
                {done ? <Check size={15} strokeWidth={2.5} /> : <Icon size={14} />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 mt-1 ${done ? 'bg-[#177945]' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className="pt-1 pb-2">
              <p className={`text-sm font-semibold ${done || active ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </p>
              {(active) && (
                <p className="text-gray-500 text-xs mt-0.5">{step.desc}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
