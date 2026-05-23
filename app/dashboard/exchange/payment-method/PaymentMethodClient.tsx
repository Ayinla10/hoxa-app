'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard, Smartphone, Phone, Building2, QrCode,
  ChevronLeft, ArrowRight, Check
} from 'lucide-react'
import { selectPaymentMethod } from '@/actions/exchange'
import type { PaymentProvider } from '@/types'

interface Props {
  transaction: any
  providers: PaymentProvider[]
  preferredMethodId: string | null
  sendCountry: string
}

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  app: Smartphone,
  ussd: Phone,
  bank: Building2,
  qr: QrCode,
  cash_deposit: CreditCard,
}

// Brand colors for known providers
const PROVIDER_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  wave: { bg: 'bg-[#1DC1EC]/10', text: 'text-[#1DC1EC]', border: 'border-[#1DC1EC]/20' },
  mtn: { bg: 'bg-[#FFCB05]/10', text: 'text-[#996B00]', border: 'border-[#FFCB05]/30' },
  orange: { bg: 'bg-[#FF6600]/10', text: 'text-[#FF6600]', border: 'border-[#FF6600]/20' },
  telecel: { bg: 'bg-[#E31937]/10', text: 'text-[#E31937]', border: 'border-[#E31937]/20' },
  ussd: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  bank: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
}

function getProviderStyle(icon: string | null) {
  if (!icon) return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
  return PROVIDER_STYLES[icon.toLowerCase()] ?? PROVIDER_STYLES.ussd
}

export default function PaymentMethodClient({ transaction, providers, preferredMethodId, sendCountry }: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>(preferredMethodId ?? providers[0]?.id ?? '')
  const [loading, setLoading] = useState(false)

  const sendAmount = transaction.send_amount ?? transaction.from_amount
  const sendCurrency = transaction.send_currency ?? transaction.from_currency
  const txRef = transaction.hoxa_transaction_id ?? ''

  async function handleContinue() {
    if (!selectedId) return
    setLoading(true)

    const result = await selectPaymentMethod(transaction.id, selectedId)
    if (result.error) {
      setLoading(false)
      return
    }

    router.push(`/dashboard/exchange/pay?tx=${transaction.id}&method=${selectedId}`)
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 min-w-0 overflow-hidden">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-[#177945]" />
            <h1 className="text-base sm:text-lg font-bold text-gray-900">How would you like to pay?</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {sendCurrency} {sendAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            {txRef && <span className="text-gray-400"> · {txRef}</span>}
          </p>
        </div>

        {/* Payment method cards */}
        <div className="p-4 sm:p-5 space-y-3">
          {providers.map(provider => {
            const isSelected = selectedId === provider.id
            const Icon = METHOD_ICONS[provider.method_type] ?? CreditCard
            const style = getProviderStyle(provider.display_icon)

            return (
              <button
                key={provider.id}
                onClick={() => setSelectedId(provider.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-[#177945] bg-[#177945]/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {/* Provider icon */}
                <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={22} className={style.text} />
                </div>

                {/* Provider info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{provider.display_name}</span>
                    {provider.method_type === 'app' && (
                      <span className="text-[9px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                        Recommended
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs capitalize">{provider.method_type === 'ussd' ? 'USSD' : provider.method_type}</span>
                </div>

                {/* Selection indicator */}
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected ? 'border-[#177945] bg-[#177945]' : 'border-gray-300'
                }`}>
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </button>
            )
          })}

          {providers.length === 0 && (
            <div className="text-center py-8">
              <CreditCard size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">No payment methods available</p>
              <p className="text-gray-400 text-xs mt-1">for {sendCountry}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-3">
          <p className="text-xs text-gray-400 text-center">
            Options available in your country · Your preference is saved for next time
          </p>

          <button
            onClick={handleContinue}
            disabled={!selectedId || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue to Payment <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
