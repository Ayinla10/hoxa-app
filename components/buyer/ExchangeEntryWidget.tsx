'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftRight, Search, ShieldCheck, AlertCircle, ArrowRight, ChevronDown } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import type { Corridor } from '@/types'
import CurrencySelect from '@/components/ui/CurrencySelect'

interface Props {
  corridors: Corridor[]
  userCountry?: string
  userSendAccount?: string
}

// Keyed by the exact country name stored in corridors.receive_country (set by admin)
const COUNTRY_CC: Record<string, string> = {
  'Ghana':                'gh',
  'Nigeria':              'ng',
  "Côte d'Ivoire":        'ci',
  'Senegal':              'sn',
  'Mali':                 'ml',
  'Burkina Faso':         'bf',
  'Togo':                 'tg',
  'Benin':                'bj',
  'Niger':                'ne',
  'Guinea-Bissau':        'gw',
  'Cameroon':             'cm',
  'Chad':                 'td',
  'Central African Rep.': 'cf',
  'Republic of Congo':    'cg',
  'Gabon':                'ga',
  'Equatorial Guinea':    'gq',
  'Kenya':                'ke',
  'Uganda':               'ug',
  'Tanzania':             'tz',
  'South Africa':         'za',
  'United Kingdom':       'gb',
  'France':               'fr',
  'Germany':              'de',
  'Spain':                'es',
  'Italy':                'it',
  'Netherlands':          'nl',
  'Belgium':              'be',
  'Portugal':             'pt',
  'Other EU':             'eu',
  'United States':        'us',
  'Canada':               'ca',
}


export default function ExchangeEntryWidget({ corridors, userCountry, userSendAccount }: Props) {
  const router = useRouter()
  const { t } = useI18n()

  // Derive available currencies from corridors
  const sendCurrencies = [...new Set(corridors.map(c => c.send_currency))]

  const [sendCurrency, setSendCurrency] = useState(sendCurrencies[0] ?? '')
  const [receiveCurrency, setReceiveCurrency] = useState('')
  const [amount, setAmount] = useState('')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [validCorridor, setValidCorridor] = useState<Corridor | null>(null)
  const [error, setError] = useState('')
  const [countryDropOpen, setCountryDropOpen] = useState(false)
  const [countryDropStyle, setCountryDropStyle] = useState<React.CSSProperties>({})
  const countryBtnRef = useRef<HTMLButtonElement>(null)

  // Filter receive currencies based on selected send currency
  const receiveCurrencies = [...new Set(
    corridors
      .filter(c => c.send_currency === sendCurrency)
      .map(c => c.receive_currency)
  )]

  // Auto-select first receive currency when send changes
  useEffect(() => {
    if (receiveCurrencies.length > 0 && !receiveCurrencies.includes(receiveCurrency)) {
      setReceiveCurrency(receiveCurrencies[0])
    }
  }, [sendCurrency, receiveCurrencies, receiveCurrency])

  // Find matching corridor and suggest destination countries
  const destinationCountries = corridors
    .filter(c => c.send_currency === sendCurrency && c.receive_currency === receiveCurrency && c.is_active)
    .map(c => c.receive_country)
  const uniqueDestCountries = [...new Set(destinationCountries)]

  // Auto-select destination country
  useEffect(() => {
    if (uniqueDestCountries.length > 0 && !uniqueDestCountries.includes(destinationCountry)) {
      setDestinationCountry(uniqueDestCountries[0])
    }
  }, [receiveCurrency, uniqueDestCountries, destinationCountry])

  // Validate corridor
  useEffect(() => {
    const corridor = corridors.find(
      c => c.send_currency === sendCurrency &&
           c.receive_currency === receiveCurrency &&
           c.receive_country === destinationCountry &&
           c.is_active
    )
    setValidCorridor(corridor ?? null)
    setError('')
  }, [sendCurrency, receiveCurrency, destinationCountry, corridors])

  function swap() {
    const prevSend = sendCurrency
    const prevReceive = receiveCurrency
    setSendCurrency(prevReceive)
    setReceiveCurrency(prevSend)
  }

  function handleFind(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!validCorridor) {
      setError(`We don't support ${sendCurrency} → ${receiveCurrency} yet.`)
      return
    }

    const numAmount = Number(amount)
    if (amount && numAmount > 0) {
      if (numAmount < validCorridor.min_amount) {
        setError(`Minimum amount is ${validCorridor.min_amount.toLocaleString()} ${sendCurrency}`)
        return
      }
      if (numAmount > validCorridor.max_amount) {
        setError(`Maximum amount is ${validCorridor.max_amount.toLocaleString()} ${sendCurrency}`)
        return
      }
    }

    const params = new URLSearchParams({
      from: sendCurrency,
      to: receiveCurrency,
      country: destinationCountry,
      corridor: validCorridor.id,
    })
    if (amount) params.set('amount', amount)
    router.push(`/dashboard/marketplace?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] px-4 sm:px-6 py-4 sm:py-5">
        <h2 className="text-white font-bold text-lg">Start Exchange</h2>
        <p className="text-white/50 text-xs mt-0.5">Send money across Africa in 5 simple steps</p>
      </div>

      <form onSubmit={handleFind} className="p-4 sm:p-5 space-y-4">
        {/* You Send — currency + amount */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">I want to send</label>
          <div className="flex gap-2">
            <CurrencySelect value={sendCurrency} options={sendCurrencies} onChange={setSendCurrency} placeholder="Send" className="w-[130px] sm:w-[150px]" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0"
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          {validCorridor && amount && (
            <p className="text-xs text-gray-400 mt-1.5 pl-1">
              Min: {validCorridor.min_amount.toLocaleString()} · Max: {validCorridor.max_amount.toLocaleString()} {sendCurrency}
            </p>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={swap}
            className="w-10 h-10 rounded-full bg-[#177945]/10 flex items-center justify-center hover:bg-[#177945]/20 hover:scale-110 transition-all active:scale-95"
          >
            <ArrowLeftRight size={16} className="text-[#177945] rotate-90" />
          </button>
        </div>

        {/* I want to receive — currency + destination country side by side */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">I want to receive</label>
          <div className="flex gap-2">
            <CurrencySelect value={receiveCurrency} options={receiveCurrencies} onChange={setReceiveCurrency} placeholder="Receive" className="w-[130px] sm:w-[150px]" />

            {/* Destination country dropdown — replaces "Estimated at checkout" */}
            {uniqueDestCountries.length > 0 ? (
              <div className="relative flex-1 min-w-0">
                <button
                  ref={countryBtnRef}
                  type="button"
                  onClick={() => {
                    if (countryDropOpen) { setCountryDropOpen(false); return }
                    if (countryBtnRef.current) {
                      const rect = countryBtnRef.current.getBoundingClientRect()
                      const dropH = Math.min(uniqueDestCountries.length * 44, 220)
                      const spaceBelow = window.innerHeight - rect.bottom
                      if (spaceBelow >= dropH || spaceBelow >= 120) {
                        setCountryDropStyle({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) })
                      } else {
                        setCountryDropStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: Math.max(rect.width, 200) })
                      }
                    }
                    setCountryDropOpen(true)
                  }}
                  className="w-full h-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#18824a]/50 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-colors cursor-pointer"
                >
                  {destinationCountry && COUNTRY_CC[destinationCountry] ? (
                    <>
                      <img
                        src={`https://flagcdn.com/w20/${COUNTRY_CC[destinationCountry]}.png`}
                        alt={destinationCountry}
                        width={20} height={13}
                        className="rounded-sm object-cover flex-shrink-0"
                      />
                      <span className="text-sm font-semibold text-gray-900 flex-1 text-left truncate">{destinationCountry}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 flex-1 text-left">Choose Country</span>
                  )}
                  <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${countryDropOpen ? 'rotate-180' : ''}`} />
                </button>

                {countryDropOpen && (
                  <>
                    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setCountryDropOpen(false)} />
                    <div style={{ ...countryDropStyle, position: 'fixed', zIndex: 9999 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto">
                      {uniqueDestCountries.map(name => {
                        const cc = COUNTRY_CC[name]
                        const isSelected = name === destinationCountry
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => { setDestinationCountry(name); setCountryDropOpen(false) }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#18824a]/5' : ''}`}
                          >
                            {cc && (
                              <img
                                src={`https://flagcdn.com/w20/${cc}.png`}
                                alt={name}
                                width={20} height={13}
                                className="rounded-sm object-cover flex-shrink-0"
                              />
                            )}
                            <span className={`text-sm font-semibold ${isSelected ? 'text-[#18824a]' : 'text-gray-900'}`}>{name}</span>
                            {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#18824a] flex-shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 text-sm flex items-center">
                Select currency first
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 rounded-xl px-3 py-2.5 border border-red-100">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Protection note */}
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
          <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-xs font-medium">HOXA Protected Exchange — your payment is secured</p>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!validCorridor}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#177945]/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Search size={14} /> Find Exchange Offers <ArrowRight size={14} />
        </button>
      </form>
    </div>
  )
}
