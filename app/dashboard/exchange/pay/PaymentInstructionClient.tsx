'use client'
import { useI18n } from '@/lib/i18n-context'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Smartphone, Phone, Building2, QrCode, Copy, Check,
  Clock, AlertTriangle, ArrowRight, ChevronLeft, ShieldCheck
} from 'lucide-react'
import { markIvePaid } from '@/actions/exchange'
import type { PaymentProvider, HoxaCollectionAccount } from '@/types'

interface Props {
  transaction: any
  provider: PaymentProvider | null
  collectionAccount: HoxaCollectionAccount | null
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-white border border-gray-200 hover:border-[#177945]/30 hover:text-[#177945]"
    >
      {copied ? (
        <><Check size={12} className="text-green-500" /> Copied!</>
      ) : (
        <><Copy size={12} /> {label}</>
      )}
    </button>
  )
}

export default function PaymentInstructionClient({ transaction, provider, collectionAccount }: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sendAmount = transaction.send_amount ?? transaction.from_amount
  const sendCurrency = transaction.send_currency ?? transaction.from_currency
  const txRef = transaction.hoxa_transaction_id ?? `HOXA-${transaction.id.slice(0, 4).toUpperCase()}`
  const accountNumber = collectionAccount?.account_number ?? '---'
  const accountName = collectionAccount?.account_name ?? 'HOXA Secure Account'

  // Rate lock countdown
  const [countdown, setCountdown] = useState(() => {
    if (transaction.rate_expires_at) {
      return Math.max(0, Math.floor((new Date(transaction.rate_expires_at).getTime() - Date.now()) / 1000))
    }
    return 600
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  // Parse instruction template
  const template = provider?.instruction_template as Record<string, any> ?? {}
  const steps: string[] = template.steps ?? []
  const methodType = provider?.method_type ?? 'app'

  // Replace template variables
  function fillTemplate(text: string) {
    return text
      .replace(/\{hoxa_account_number\}/g, accountNumber)
      .replace(/\{send_amount\}/g, sendAmount?.toLocaleString() ?? '')
      .replace(/\{hoxa_transaction_id\}/g, txRef)
      .replace(/\{provider_name\}/g, provider?.provider_name ?? '')
      .replace(/\{dial\}/g, template.dial ?? '')
  }

  async function handleIvePaid() {
    setError('')
    setLoading(true)

    const result = await markIvePaid(transaction.id)
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/exchange/waiting?tx=${transaction.id}`)
  }

  const MethodIcon = methodType === 'ussd' ? Phone :
                     methodType === 'bank' ? Building2 :
                     methodType === 'qr' ? QrCode : Smartphone

  const methodTitle = methodType === 'app' ? `Pay with ${provider?.display_name ?? 'App'}` :
                      methodType === 'ussd' ? 'Pay via USSD' :
                      methodType === 'bank' ? 'Bank Transfer' :
                      methodType === 'qr' ? 'QR Payment' :
                      'Make Your Payment'

  return (
    <div className="max-w-xl mx-auto space-y-5 min-w-0 overflow-hidden">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={16} /> Use a different method
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <MethodIcon size={18} className="text-[#177945]" />
            <h1 className="text-base sm:text-lg font-bold text-gray-900">{methodTitle}</h1>
          </div>
          <p className="text-gray-500 text-sm">{txRef}</p>
        </div>

        <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
          {/* Payment instruction box */}
          <div className="bg-[#F7F9F8] border border-gray-200 rounded-xl overflow-hidden">
            {/* Account header */}
            <div className="px-4 py-3 bg-[#177945]/5 border-b border-[#177945]/10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#177945]" />
                <span className="text-sm font-semibold text-[#177945]">{accountName}</span>
              </div>
            </div>

            {/* Instructions by method type */}
            <div className="p-4 space-y-3">
              {methodType === 'ussd' && template.dial && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Dial on your phone</p>
                  <p className="text-xl font-bold text-gray-900 font-mono">{template.dial}</p>
                  <p className="text-xs text-gray-500 mt-1">{provider?.provider_name}</p>
                </div>
              )}

              {methodType === 'bank' && template.bank_name && (
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-1">Bank</p>
                  <p className="text-sm font-semibold text-gray-900">{template.bank_name}</p>
                </div>
              )}

              {/* Account number */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">
                  {methodType === 'bank' ? 'Account Number' : 'To number'}
                </p>
                <p className="text-lg font-bold text-gray-900 font-mono tracking-wider">{accountNumber}</p>
              </div>

              {/* Amount */}
              <div className="bg-white rounded-lg p-3 border border-[#177945]/20">
                <p className="text-xs text-gray-400 mb-1">Amount</p>
                <p className="text-lg font-bold text-[#177945]">
                  {sendCurrency} {sendAmount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Reference */}
              <div className="bg-white rounded-lg p-3 border border-amber-200 bg-amber-50/50">
                <p className="text-xs text-gray-400 mb-1">Reference / Note</p>
                <p className="text-lg font-bold text-amber-700 font-mono">{txRef}</p>
              </div>

              {/* Steps */}
              {steps.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 mb-2">Steps:</p>
                  <ol className="space-y-1.5">
                    {steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                          {i + 1}
                        </span>
                        {fillTemplate(step)}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>

          {/* Copy buttons */}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={accountNumber} label="Copy Number" />
            <CopyButton text={sendAmount?.toString() ?? ''} label="Copy Amount" />
            <CopyButton text={txRef} label="Copy Reference" />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 bg-amber-50 rounded-xl px-3 py-2.5 border border-amber-100">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 text-xs font-medium">Use the exact amount and reference.</p>
              <p className="text-amber-600 text-xs mt-0.5">Wrong reference or amount delays your exchange.</p>
            </div>
          </div>

          {/* Rate lock countdown */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
            countdown > 120 ? 'bg-green-50 border-green-100' :
            countdown > 0 ? 'bg-amber-50 border-amber-100' :
            'bg-red-50 border-red-100'
          }`}>
            <Clock size={14} className={
              countdown > 120 ? 'text-green-600' :
              countdown > 0 ? 'text-amber-600 animate-pulse' :
              'text-red-600'
            } />
            <span className={`text-sm font-semibold font-mono ${
              countdown > 120 ? 'text-green-700' :
              countdown > 0 ? 'text-amber-700' :
              'text-red-700'
            }`}>
              {countdown > 0 ? formatCountdown(countdown) : '00:00'}
            </span>
            <span className={`text-xs ${
              countdown > 120 ? 'text-green-600' :
              countdown > 0 ? 'text-amber-600' :
              'text-red-600'
            }`}>
              {countdown > 0 ? 'Rate locked' : 'Rate expired'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* I've Paid CTA */}
          <button
            onClick={handleIvePaid}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-base hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#177945]/20 disabled:opacity-60"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                I've Paid <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
