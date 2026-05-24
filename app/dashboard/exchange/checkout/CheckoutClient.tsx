'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Lock, Clock, ArrowRight, ChevronLeft,
  CheckCircle2, AlertCircle, User, Smartphone
} from 'lucide-react'
import { initiateExchange } from '@/actions/exchange'
import { useI18n } from '@/lib/i18n-context'

const PHONE_META: Record<string, { code: string; digits: number; placeholder: string }> = {
  'Ghana':                { code: '+233', digits: 9,  placeholder: '024 123 4567' },
  'Nigeria':              { code: '+234', digits: 10, placeholder: '080 1234 5678' },
  'Senegal':              { code: '+221', digits: 9,  placeholder: '077 123 4567' },
  'Mali':                 { code: '+223', digits: 8,  placeholder: '76 12 34 56' },
  'Burkina Faso':         { code: '+226', digits: 8,  placeholder: '70 12 34 56' },
  'Togo':                 { code: '+228', digits: 8,  placeholder: '90 12 34 56' },
  'Benin':                { code: '+229', digits: 8,  placeholder: '97 12 34 56' },
  'Niger':                { code: '+227', digits: 8,  placeholder: '90 12 34 56' },
  "Côte d'Ivoire":        { code: '+225', digits: 10, placeholder: '07 12 34 56 78' },
  'Guinea-Bissau':        { code: '+245', digits: 7,  placeholder: '955 1234' },
  'Cameroon':             { code: '+237', digits: 9,  placeholder: '6 71 23 45 67' },
  'Chad':                 { code: '+235', digits: 8,  placeholder: '63 12 34 56' },
  'Gabon':                { code: '+241', digits: 7,  placeholder: '06 12 34 56' },
  'Republic of Congo':    { code: '+242', digits: 9,  placeholder: '06 123 4567' },
  'Central African Rep.': { code: '+236', digits: 8,  placeholder: '75 12 34 56' },
  'Equatorial Guinea':    { code: '+240', digits: 9,  placeholder: '222 123 456' },
  'Kenya':                { code: '+254', digits: 9,  placeholder: '0712 345 678' },
  'Uganda':               { code: '+256', digits: 9,  placeholder: '0712 345 678' },
  'Tanzania':             { code: '+255', digits: 9,  placeholder: '0712 345 678' },
  'South Africa':         { code: '+27',  digits: 9,  placeholder: '071 234 5678' },
  'United Kingdom':       { code: '+44',  digits: 10, placeholder: '07700 900000' },
  'France':               { code: '+33',  digits: 9,  placeholder: '06 12 34 56 78' },
  'United States':        { code: '+1',   digits: 10, placeholder: '(555) 123-4567' },
  'Canada':               { code: '+1',   digits: 10, placeholder: '(555) 123-4567' },
}

function PhoneField({ label, country, value, onChange }: {
  label: string; country: string; value: string; onChange: (v: string) => void
}) {
  const meta = PHONE_META[country]
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">
        <Smartphone size={12} className="inline mr-1" />
        {label}
      </label>
      <div className="flex">
        {meta?.code && (
          <span className="inline-flex items-center px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-xs font-bold text-gray-600 whitespace-nowrap flex-shrink-0 select-none">
            {meta.code}
          </span>
        )}
        <input
          type="tel"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={meta?.placeholder ?? 'Phone number'}
          className={`flex-1 px-4 py-2.5 text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all ${meta?.code ? 'rounded-r-xl' : 'rounded-xl'}`}
        />
      </div>
      {meta && (
        <p className="text-gray-400 text-[10px] mt-1 pl-1">{country} · {meta.code} · {meta.digits} digits required</p>
      )}
    </div>
  )
}

interface Props {
  offer: any
  corridor: any
  amount: string
  destinationCountry: string
  feePercent: number
  rateLockSeconds: number
  sendPhone?: string
  receivePhone?: string
  userProfile: {
    sendAccount: string
    receiveAccount: string
    country: string
  }
}

export default function CheckoutClient({
  offer,
  corridor,
  amount,
  destinationCountry,
  feePercent,
  rateLockSeconds,
  sendPhone = '',
  receivePhone = '',
  userProfile,
}: Props) {
  const router = useRouter()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendAccount, setSendAccount] = useState(sendPhone || userProfile.sendAccount)
  const [receiveAccount, setReceiveAccount] = useState(receivePhone || userProfile.receiveAccount)
  const [receiveProvider, setReceiveProvider] = useState('')

  // Calculate amounts
  const sendSubtotal = Number(amount) || 0
  const feeAmount = Math.round(sendSubtotal * (feePercent / 100) * 100) / 100
  const totalPay = sendSubtotal + feeAmount
  const receiveAmount = sendSubtotal * offer.rate

  const seller = offer.sellers
  const sellerProfile = seller?.profiles
  const sellerName = sellerProfile?.full_name ?? "Exchanger"
  const completion = seller?.completion_rate ?? 0
  const isVerified = completion >= 90 && (seller?.total_transactions ?? 0) >= 5

  // Rate lock countdown
  const [countdown, setCountdown] = useState(rateLockSeconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  async function handleConfirm() {
    setError('')

    if (!sendAccount.trim()) {
      setError('Please enter your send account number')
      return
    }
    if (!receiveAccount.trim()) {
      setError('Please enter your receive account number')
      return
    }

    setLoading(true)
    try {
      const result = await initiateExchange({
        offer_id: offer.id,
        corridor_id: corridor?.id ?? '',
        send_amount: sendSubtotal,        // subtotal only — server adds fee
        buyer_send_account: sendAccount,
        buyer_send_provider: '',
        buyer_receive_account: receiveAccount,
        buyer_receive_provider: receiveProvider,
        buyer_destination_country: destinationCountry,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // V5.1: if auto-accepted go straight to payment, else wait for seller acceptance
      if (result.autoAccepted) {
        router.push(`/dashboard/exchange/payment-method?tx=${result.transactionId}`)
      } else {
        router.push(`/dashboard/exchange/waiting?tx=${result.transactionId}`)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-5 min-w-0 overflow-hidden">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        <ChevronLeft size={16} /> {t("back_to_exchangers")}
      </button>

      {/* Main checkout card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-white/80" />
            <h1 className="text-white font-bold text-base sm:text-lg">HOXA Protected Exchange</h1>
          </div>
          <p className="text-white/50 text-xs">{t("checkout_subtitle")}</p>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* You receive */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">
              They receive{destinationCountry ? ` in ${destinationCountry}` : ''}
            </p>
            <p className="text-2xl font-bold text-green-700">
              {offer.to_currency} {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            {offer.from_currency === offer.to_currency && (
              <p className="text-xs text-green-600 mt-1">Same currency · different country transfer</p>
            )}
          </div>

          {/* Exchange details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Exchange rate</span>
              <span className="text-sm font-semibold text-gray-900">
                1 {offer.from_currency} = {offer.rate} {offer.to_currency}
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-500">Exchanger</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">{sellerName}</span>
                {isVerified && <CheckCircle2 size={13} className="text-green-500" />}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm text-gray-700">
                  {offer.from_currency} {sendSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">HOXA fee ({feePercent}%)</span>
                <span className="text-sm text-gray-700">
                  {offer.from_currency} {feeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">You pay</span>
                <span className="text-lg font-bold text-[#177945]">
                  {offer.from_currency} {totalPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Account inputs */}
          <div className="space-y-3 pt-2">
            <PhoneField
              label={`Your send number · ${corridor?.send_country ?? offer.from_currency}`}
              country={corridor?.send_country ?? ''}
              value={sendAccount}
              onChange={setSendAccount}
            />
            <PhoneField
              label={`Recipient number · ${destinationCountry || corridor?.receive_country || offer.to_currency}`}
              country={destinationCountry || corridor?.receive_country || ''}
              value={receiveAccount}
              onChange={setReceiveAccount}
            />
          </div>

          {/* Rate lock countdown */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
            countdown > 120 ? 'bg-green-50 border-green-100' :
            countdown > 0 ? 'bg-amber-50 border-amber-100' :
            'bg-red-50 border-red-100'
          }`}>
            <Clock size={14} className={
              countdown > 120 ? 'text-green-600' :
              countdown > 0 ? 'text-amber-600' :
              'text-red-600'
            } />
            <span className={`text-sm font-medium ${
              countdown > 120 ? 'text-green-700' :
              countdown > 0 ? 'text-amber-700' :
              'text-red-700'
            }`}>
              {countdown > 0 ? `Rate locked for ${formatCountdown(countdown)}` : 'Rate expired — confirm for updated rate'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-xs font-medium">{error}</p>
            </div>
          )}

          {/* Exchange protection guarantee */}
          <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
            <ShieldCheck size={15} className="text-[#177945] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-[#177945]">HOXA Exchange Guarantee</p>
              <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                Your payment is held securely by HOXA and only released to the exchanger after you confirm receipt. If anything goes wrong, we'll refund you in full.
              </p>
            </div>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#177945]/20 disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Securing your rate...
              </>
            ) : (
              <>
                <ShieldCheck size={15} />
                Confirm Exchange
                <ArrowRight size={14} />
              </>
            )}
          </button>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-1">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Protected</span>
            <span className="flex items-center gap-1"><Lock size={11} /> Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={11} /> Verified</span>
          </div>
        </div>
      </div>
    </div>
  )
}
