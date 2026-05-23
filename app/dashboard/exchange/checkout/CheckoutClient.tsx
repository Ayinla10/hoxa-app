'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Lock, Clock, ArrowRight, ChevronLeft,
  CheckCircle2, AlertCircle, User, Smartphone
} from 'lucide-react'
import { initiateExchange } from '@/actions/exchange'

interface Props {
  offer: any
  corridor: any
  amount: string
  destinationCountry: string
  feePercent: number
  rateLockSeconds: number
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
  userProfile,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sendAccount, setSendAccount] = useState(userProfile.sendAccount)
  const [receiveAccount, setReceiveAccount] = useState(userProfile.receiveAccount)
  const [receiveProvider, setReceiveProvider] = useState('')

  // Calculate amounts
  const sendSubtotal = Number(amount) || 0
  const feeAmount = Math.round(sendSubtotal * (feePercent / 100) * 100) / 100
  const totalPay = sendSubtotal + feeAmount
  const receiveAmount = sendSubtotal * offer.rate

  const seller = offer.sellers
  const sellerProfile = seller?.profiles
  const sellerName = sellerProfile?.full_name ?? 'Exchanger'
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
        <ChevronLeft size={16} /> Back to exchangers
      </button>

      {/* Main checkout card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 mb-1">
            <Lock size={16} className="text-white/80" />
            <h1 className="text-white font-bold text-base sm:text-lg">HOXA Protected Exchange</h1>
          </div>
          <p className="text-white/50 text-xs">Review your exchange details before confirming</p>
        </div>

        <div className="p-4 sm:p-6 space-y-5">
          {/* You receive */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs text-green-600 font-medium mb-1">You receive</p>
            <p className="text-2xl font-bold text-green-700">
              {offer.to_currency} {receiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Smartphone size={12} className="inline mr-1" />
                Your {offer.from_currency} account (send from)
              </label>
              <input
                type="text"
                value={sendAccount}
                onChange={e => setSendAccount(e.target.value)}
                placeholder="e.g. 0241234567"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                <Smartphone size={12} className="inline mr-1" />
                Your {offer.to_currency} account (receive to)
              </label>
              <input
                type="text"
                value={receiveAccount}
                onChange={e => setReceiveAccount(e.target.value)}
                placeholder="e.g. 0712345678"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10"
              />
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
