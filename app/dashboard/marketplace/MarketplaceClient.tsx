'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Store, ArrowRight, CheckCircle2, Clock, Bell,
  Zap, ArrowLeft
} from 'lucide-react'
import type { Corridor } from '@/types'
import CurrencyFlag from '@/components/ui/CurrencyFlag'
import ExchangeEntryWidget from '@/components/buyer/ExchangeEntryWidget'
import BackButton from '@/components/ui/BackButton'

interface Props {
  offers: any[]
  corridors: Corridor[]
  from?: string
  to?: string
  amount?: string
  sendCountry?: string
  destinationCountry?: string
  corridorId?: string
  sendPhone?: string
  receivePhone?: string
  feePercent: number
}

const COUNTRY_CC: Record<string, string> = {
  'Ghana': 'gh', 'Nigeria': 'ng', "Côte d'Ivoire": 'ci', 'Senegal': 'sn',
  'Mali': 'ml', 'Burkina Faso': 'bf', 'Togo': 'tg', 'Benin': 'bj',
  'Niger': 'ne', 'Guinea-Bissau': 'gw', 'Cameroon': 'cm', 'Chad': 'td',
  'Central African Rep.': 'cf', 'Republic of Congo': 'cg', 'Gabon': 'ga',
  'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz', 'South Africa': 'za',
  'United Kingdom': 'gb', 'France': 'fr', 'United States': 'us', 'Canada': 'ca',
}

function SmallFlag({ country }: { country?: string }) {
  if (!country) return null
  const cc = COUNTRY_CC[country]
  if (!cc) return null
  return <img src={`https://flagcdn.com/w20/${cc}.png`} width={14} height={10} alt={country} className="rounded-sm object-cover flex-shrink-0 inline-block" />
}

/** Show rate. When currencies match, show country route instead of "1 XOF = 1.00 XOF" */
function OfferRate({ offer }: { offer: any }) {
  const from = offer.from_currency
  const to = offer.to_currency
  const sameCurrency = from === to
  const sendCountry = offer.corridors?.send_country
  const recvCountry = offer.corridors?.receive_country

  if (sameCurrency) {
    // Same currency — show "Senegal XOF → CI XOF" with fee/rate if not 1:1
    const rate = Number(offer.rate)
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[#177945] flex-wrap">
        {sendCountry && <><SmallFlag country={sendCountry} /><span>{sendCountry}</span></>}
        <span className="text-gray-400 font-normal mx-0.5">→</span>
        {recvCountry && <><SmallFlag country={recvCountry} /><span>{recvCountry}</span></>}
        {rate !== 1 && (
          <span className="text-xs font-normal text-gray-400 ml-1">({rate.toFixed(4)} rate)</span>
        )}
        <span className="ml-1 text-xs font-semibold text-[#177945] bg-[#177945]/10 px-1.5 py-0.5 rounded-md">{from}</span>
      </span>
    )
  }

  if (offer.rate_send_ref && offer.rate_receive_ref) {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-[#177945] flex-wrap">
        <CurrencyFlag code={from} size={14} />
        {Number(offer.rate_send_ref).toLocaleString()} {from}
        <span className="text-gray-400 font-normal">=</span>
        <CurrencyFlag code={to} size={14} />
        {Number(offer.rate_receive_ref).toLocaleString()} {to}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 font-bold text-[#177945]">
      <CurrencyFlag code={from} size={14} />
      1 {from} = {Number(offer.rate).toFixed(2)} {to}
      <CurrencyFlag code={to} size={14} />
    </span>
  )
}

/** "Senegal → Ghana" country route line */
function OfferRoute({ offer }: { offer: any }) {
  const send = offer.corridors?.send_country
  const recv = offer.corridors?.receive_country
  if (!send && !recv) return null
  return (
    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
      {send && <><SmallFlag country={send} /> {send}</>}
      {send && recv && <span className="mx-0.5">→</span>}
      {recv && <><SmallFlag country={recv} /> {recv}</>}
    </p>
  )
}

export default function MarketplaceClient({
  offers,
  corridors,
  from,
  to,
  amount,
  sendCountry,
  destinationCountry,
  corridorId,
  sendPhone,
  receivePhone,
  feePercent,
}: Props) {
  const router = useRouter()

  // Build pair filters from corridors (config-driven, not hardcoded)
  const pairs = useMemo(() => {
    const seen = new Set<string>()
    return corridors
      .filter(c => c.is_active)
      .map(c => {
        const key = `${c.send_currency}-${c.receive_currency}`
        if (seen.has(key)) return null
        seen.add(key)
        return { from: c.send_currency, to: c.receive_currency }
      })
      .filter(Boolean)
  }, [corridors])

  const filteredOffers = offers.filter((offer: any) => {
    // Filter by destination country if provided (seller supports it)
    if (destinationCountry && offer.sellers?.supported_receive_countries?.length > 0) {
      if (!offer.sellers.supported_receive_countries.includes(destinationCountry)) return false
    }
    return true
  })

  // Sort: available first, then by rate
  const sortedOffers = [...filteredOffers].sort((a, b) => {
    // Available sellers first
    const aAvail = isSellerAvailable(a.sellers)
    const bAvail = isSellerAvailable(b.sellers)
    if (aAvail && !bAvail) return -1
    if (!aAvail && bAvail) return 1
    return a.rate - b.rate
  })

  const numAmount = Number(amount) || 0

  return (
    <div className="space-y-5 min-w-0 w-full overflow-hidden">
      <BackButton href="/dashboard" />

      {/* Exchange widget — always visible at top of marketplace */}
      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-1">
          <ExchangeEntryWidget
            corridors={corridors}
            initialSendCountry={sendCountry}
            initialDestCountry={destinationCountry}
            initialAmount={amount}
            initialSendPhone={sendPhone}
            initialReceivePhone={receivePhone}
          />
        </div>
        <div className="lg:col-span-2">
          {/* Results header */}
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900">Available Exchangers</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {sortedOffers.length} {sortedOffers.length === 1 ? 'exchanger' : 'exchangers'} found
              {sendCountry ? ` · from ${sendCountry}` : ''}
              {destinationCountry ? ` → ${destinationCountry}` : (from && to ? ` for ${from} → ${to}` : '')}
            </p>
          </div>

      {/* Amount context */}
      {numAmount > 0 && from && to && (
        <div className="bg-[#177945]/5 border border-[#177945]/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Sending <span className="font-bold text-[#177945]">{numAmount.toLocaleString()} {from}</span>
            </p>
            <p className="text-xs text-gray-500">HOXA fee ({feePercent}%) will be shown at checkout</p>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-[#177945] font-medium hover:underline flex items-center gap-1"
          >
            <ArrowLeft size={12} /> Change
          </Link>
        </div>
      )}

      {/* Offers */}
      {sortedOffers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Store size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No exchangers available</p>
          <p className="text-gray-400 text-sm mt-1">Check back soon or try a different currency pair</p>
        </div>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Exchanger', 'Rate', 'Completed', 'Avg Speed', 'Limits', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedOffers.map((offer: any) => {
                  const seller = offer.sellers
                  const profile = seller?.profiles
                  const completion = seller?.completion_rate ?? 0
                  const avgSec = seller?.avg_response_seconds ?? 0
                  const speedLabel = avgSec > 0 ? (avgSec < 60 ? `${avgSec}s` : `${Math.round(avgSec / 60)} min`) : '~5 min'
                  const total = seller?.total_transactions ?? 0
                  const available = isSellerAvailable(seller)
                  const isVerified = completion >= 90 && total >= 5
                  const isFast = avgSec > 0 && avgSec < 45

                  return (
                    <tr key={offer.id} className={`transition-colors ${available ? 'hover:bg-gray-50' : 'opacity-60'}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
                            </div>
                            {available && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900">{profile?.full_name ?? 'Exchanger'}</span>
                              {isVerified && (
                                <CheckCircle2 size={13} className="text-green-500" />
                              )}
                              {isFast && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5">
                                  <Zap size={8} /> Fast
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400 text-xs">{profile?.country ?? '--'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <OfferRate offer={offer} />
                        <OfferRoute offer={offer} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-gray-700 font-medium">{total}</span>
                        <span className="text-gray-400 text-xs ml-1">({completion}%)</span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{speedLabel}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        {offer.min_amount?.toLocaleString()} – {offer.max_amount?.toLocaleString()} {offer.from_currency}
                      </td>
                      <td className="px-5 py-4">
                        {available ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Live
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {available ? (
                          <Link
                            href={`/dashboard/exchange/checkout?offer=${offer.id}&corridor=${corridorId ?? ''}&amount=${amount ?? ''}&country=${destinationCountry ?? ''}&sendPhone=${sendPhone ?? ''}&receivePhone=${receivePhone ?? ''}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                          >
                            Exchange Now <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <button
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-medium hover:bg-gray-200 transition-colors"
                          >
                            <Bell size={11} /> Notify Me
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="lg:hidden space-y-3">
            {sortedOffers.map((offer: any) => {
              const seller = offer.sellers
              const profile = seller?.profiles
              const completion = seller?.completion_rate ?? 0
              const total = seller?.total_transactions ?? 0
              const avgSec = seller?.avg_response_seconds ?? 0
              const speedLabel = avgSec > 0 ? (avgSec < 60 ? `${avgSec}s` : `${Math.round(avgSec / 60)} min`) : '~5 min'
              const available = isSellerAvailable(seller)
              const isVerified = completion >= 90 && total >= 5

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${!available ? 'opacity-60' : ''}`}
                >
                  <div className="p-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#177945] to-[#1a9152] flex items-center justify-center text-white font-bold text-sm">
                            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'S'}
                          </div>
                          {available && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-sm">{profile?.full_name ?? 'Exchanger'}</span>
                            {isVerified && <CheckCircle2 size={13} className="text-green-500" />}
                          </div>
                          {available ? (
                            <span className="text-green-600 text-xs font-medium">Live now</span>
                          ) : (
                            <span className="text-gray-400 text-xs">Offline</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rate + Route */}
                    <div className="bg-[#F7F9F8] rounded-xl px-3 py-2.5 mb-3">
                      <p className="text-xs text-gray-500 mb-1">Exchange Rate</p>
                      <OfferRate offer={offer} />
                      <OfferRoute offer={offer} />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Speed</p>
                        <p className="text-sm font-semibold text-gray-700">{speedLabel}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Completed</p>
                        <p className="text-sm font-semibold text-gray-700">{total}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg py-2">
                        <p className="text-xs text-gray-400">Success</p>
                        <p className="text-sm font-semibold text-gray-700">{completion}%</p>
                      </div>
                    </div>

                    {/* Limits */}
                    <p className="text-xs text-gray-400 mb-3">
                      Limits: {offer.min_amount?.toLocaleString()} – {offer.max_amount?.toLocaleString()} {offer.from_currency}
                    </p>

                    {/* CTA */}
                    {available ? (
                      <Link
                        href={`/dashboard/exchange/checkout?offer=${offer.id}&corridor=${corridorId ?? ''}&amount=${amount ?? ''}&country=${destinationCountry ?? ''}&sendPhone=${sendPhone ?? ''}&receivePhone=${receivePhone ?? ''}`}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white text-sm font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        Exchange Now <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <button
                        className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                      >
                        <Bell size={13} /> Notify Me When Available
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
        </div>
      </div>
    </div>
  )
}

function isSellerAvailable(seller: any): boolean {
  if (!seller) return false
  // Admin override
  if (seller.admin_availability_override === 'available') return true
  if (seller.admin_availability_override === 'offline') return false
  // Manual toggle
  if (seller.manual_availability_status === 'available') return true
  if (seller.manual_availability_status === 'offline') return false
  // Default available if no schedule set
  return true
}
