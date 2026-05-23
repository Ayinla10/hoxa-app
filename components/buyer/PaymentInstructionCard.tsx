'use client'

import { useState } from 'react'
import { Copy, Check, ShieldCheck } from 'lucide-react'

interface Props {
  accountName: string
  momoNumber: string
  amount: string
  reference: string
  currency: string
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:bg-[#177945]/10"
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-600" />
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={12} className="text-[#177945]" />
          <span className="text-[#177945]">{label}</span>
        </>
      )}
    </button>
  )
}

export default function PaymentInstructionCard({ accountName, momoNumber, amount, reference, currency }: Props) {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#177945]/30 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#177945]/5 px-5 py-3 flex items-center gap-2 border-b border-[#177945]/10">
        <ShieldCheck size={16} className="text-[#177945]" />
        <h3 className="font-bold text-gray-900 text-sm">Secure Exchange Payment</h3>
      </div>

      <div className="p-5 space-y-4">
        {/* Account Name */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Account Name</p>
            <p className="text-gray-900 font-semibold text-sm">{accountName || 'HOXA Exchange'}</p>
          </div>
        </div>

        {/* MoMo Number */}
        <div className="flex items-center justify-between bg-[#F7F9F8] rounded-xl px-4 py-3">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">MoMo / Account Number</p>
            <p className="text-gray-900 font-bold text-lg tracking-wider">{momoNumber || '---'}</p>
          </div>
          <CopyButton text={momoNumber} label="Copy" />
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between bg-[#F7F9F8] rounded-xl px-4 py-3">
          <div>
            <p className="text-gray-400 text-xs mb-0.5">Exact Amount</p>
            <p className="text-[#177945] font-bold text-xl">{amount} <span className="text-sm font-normal text-gray-500">{currency}</span></p>
          </div>
          <CopyButton text={amount} label="Copy" />
        </div>

        {/* Reference */}
        <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
          <div>
            <p className="text-amber-600 text-xs mb-0.5 font-medium">Transaction Reference</p>
            <p className="text-gray-900 font-bold text-sm font-mono">{reference}</p>
          </div>
          <CopyButton text={reference} label="Copy" />
        </div>

        <p className="text-gray-400 text-xs text-center">
          Include the reference when making your payment for faster verification.
        </p>
      </div>
    </div>
  )
}
