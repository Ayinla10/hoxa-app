'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ShieldCheck, AlertCircle, ArrowDown, ChevronDown, Phone } from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'
import type { Corridor } from '@/types'

interface Props {
  corridors: Corridor[]
  userCountry?: string
  initialSendCountry?: string
  initialDestCountry?: string
  initialAmount?: string
  initialSendPhone?: string
  initialReceivePhone?: string
}

// Country → ISO-2 for flags
const COUNTRY_CC: Record<string, string> = {
  'Ghana': 'gh', 'Nigeria': 'ng', "Côte d'Ivoire": 'ci', 'Senegal': 'sn',
  'Mali': 'ml', 'Burkina Faso': 'bf', 'Togo': 'tg', 'Benin': 'bj',
  'Niger': 'ne', 'Guinea-Bissau': 'gw', 'Cameroon': 'cm', 'Chad': 'td',
  'Central African Rep.': 'cf', 'Republic of Congo': 'cg', 'Gabon': 'ga',
  'Equatorial Guinea': 'gq', 'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz',
  'South Africa': 'za', 'United Kingdom': 'gb', 'France': 'fr',
  'Germany': 'de', 'Spain': 'es', 'Italy': 'it', 'Netherlands': 'nl',
  'Belgium': 'be', 'Portugal': 'pt', 'United States': 'us', 'Canada': 'ca',
}

// Country → phone dial code + digit count + placeholder
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

function getPhoneMeta(country: string) {
  return PHONE_META[country] ?? { code: '', digits: 0, placeholder: 'Phone number' }
}

/** Strip non-digits from a phone string */
function digitsOnly(s: string) { return s.replace(/\D/g, '') }

/** Validate a phone number for a given country — returns error string or '' */
function validatePhone(phone: string, country: string): string {
  if (!phone.trim()) return 'Phone number is required'
  const meta = getPhoneMeta(country)
  const raw = digitsOnly(phone)
  if (meta.digits > 0 && raw.length < meta.digits - 1) {
    return `${country} numbers need at least ${meta.digits} digits`
  }
  return ''
}

function CountryDropdown({
  label, value, options, onChange, placeholder,
}: {
  label: string; value: string; options: string[]
  onChange: (v: string) => void; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const btnRef = useRef<HTMLButtonElement>(null)

  function openDrop() {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const dropH = Math.min(options.length * 44, 220)
      const spaceBelow = window.innerHeight - rect.bottom
      setStyle(
        spaceBelow >= dropH || spaceBelow >= 120
          ? { top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 220) }
          : { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: Math.max(rect.width, 220) }
      )
    }
    setOpen(true)
  }

  const cc = value ? COUNTRY_CC[value] : null
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <button ref={btnRef} type="button" onClick={openDrop}
        className="w-full flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-200 bg-white hover:border-[#18824a]/50 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-colors">
        {value && cc
          ? <><img src={`https://flagcdn.com/w20/${cc}.png`} alt={value} width={20} height={13} className="rounded-sm object-cover flex-shrink-0" /><span className="text-sm font-semibold text-gray-900 flex-1 text-left truncate">{value}</span></>
          : <span className="text-sm text-gray-400 flex-1 text-left">{placeholder}</span>}
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
          <div style={{ ...style, position: 'fixed', zIndex: 9999 }} className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 max-h-56 overflow-y-auto">
            {options.map(name => {
              const ncc = COUNTRY_CC[name]
              const isSelected = name === value
              return (
                <button key={name} type="button" onClick={() => { onChange(name); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#18824a]/5' : ''}`}>
                  {ncc && <img src={`https://flagcdn.com/w20/${ncc}.png`} alt={name} width={20} height={13} className="rounded-sm object-cover flex-shrink-0" />}
                  <span className={`text-sm font-semibold ${isSelected ? 'text-[#18824a]' : 'text-gray-900'}`}>{name}</span>
                  {isSelected && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#18824a] flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function PhoneInput({
  label, country, value, onChange, error,
}: {
  label: string; country: string; value: string
  onChange: (v: string) => void; error?: string
}) {
  const meta = getPhoneMeta(country)
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      <div className="flex gap-0">
        {meta.code && (
          <span className="inline-flex items-center px-3 py-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-xs font-bold text-gray-500 whitespace-nowrap flex-shrink-0">
            {meta.code}
          </span>
        )}
        <input
          type="tel"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={meta.placeholder}
          className={`flex-1 px-3 py-3 text-sm text-gray-900 border border-gray-200 focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all
            ${meta.code ? 'rounded-r-xl' : 'rounded-xl'}
            ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  )
}

/** Strip a dial-code prefix from a full phone number, returning just the local digits */
function stripDialCode(fullPhone: string, country: string): string {
  if (!fullPhone) return ''
  const meta = getPhoneMeta(country)
  if (meta.code && fullPhone.startsWith(meta.code)) {
    return fullPhone.slice(meta.code.length)
  }
  return fullPhone
}

export default function ExchangeEntryWidget({
  corridors, userCountry,
  initialSendCountry = '',
  initialDestCountry = '',
  initialAmount = '',
  initialSendPhone = '',
  initialReceivePhone = '',
}: Props) {
  const router = useRouter()
  const { t } = useI18n()

  const sendCountries = [...new Set(corridors.map(c => c.send_country).filter(Boolean))].sort()

  const [sendCountry, setSendCountry] = useState(initialSendCountry)
  const [destinationCountry, setDestinationCountry] = useState(initialDestCountry)
  const [amount, setAmount] = useState(initialAmount)
  const [sendPhone, setSendPhone] = useState(() => stripDialCode(initialSendPhone, initialSendCountry))
  const [receivePhone, setReceivePhone] = useState(() => stripDialCode(initialReceivePhone, initialDestCountry))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const sendCorridors = sendCountry
    ? corridors.filter(c => c.send_country === sendCountry && c.is_active)
    : []
  const sendCurrency = sendCorridors[0]?.send_currency ?? ''
  const destCountries = [...new Set(sendCorridors.map(c => c.receive_country).filter(Boolean))].sort()

  const prevSendCountryRef = useRef(initialSendCountry)
  useEffect(() => {
    // Only auto-select destination when the user actively changes sendCountry
    if (prevSendCountryRef.current === sendCountry) return
    prevSendCountryRef.current = sendCountry
    if (destCountries.length > 0 && !destCountries.includes(destinationCountry)) {
      setDestinationCountry(destCountries[0])
    }
  }, [sendCountry]) // eslint-disable-line

  const validCorridor = sendCorridors.find(c => c.receive_country === destinationCountry) ?? null
  const receiveCurrency = validCorridor?.receive_currency ?? ''

  useEffect(() => { setErrors({}) }, [sendCountry, destinationCountry])

  function handleFind(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!sendCountry) { newErrors.sendCountry = 'Select your sending country'; }
    if (!destinationCountry) { newErrors.destCountry = 'Select destination country'; }
    if (!validCorridor && sendCountry && destinationCountry) {
      newErrors.corridor = `No active corridor from ${sendCountry} to ${destinationCountry}`
    }

    // Amount is required
    const numAmount = Number(amount)
    if (!amount || numAmount <= 0) {
      newErrors.amount = 'Enter the amount you want to send'
    } else if (validCorridor) {
      if (numAmount < validCorridor.min_amount) {
        newErrors.amount = `Minimum is ${validCorridor.min_amount.toLocaleString()} ${sendCurrency}`
      } else if (numAmount > validCorridor.max_amount) {
        newErrors.amount = `Maximum is ${validCorridor.max_amount.toLocaleString()} ${sendCurrency}`
      }
    }

    // Phone numbers — required + validated per country
    if (sendCountry) {
      const spErr = validatePhone(sendPhone, sendCountry)
      if (spErr) newErrors.sendPhone = spErr
    }
    if (destinationCountry) {
      const rpErr = validatePhone(receivePhone, destinationCountry)
      if (rpErr) newErrors.receivePhone = rpErr
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    const sendMeta = getPhoneMeta(sendCountry)
    const recvMeta = getPhoneMeta(destinationCountry)
    const fullSendPhone = sendMeta.code
      ? `${sendMeta.code}${digitsOnly(sendPhone)}`
      : sendPhone.trim()
    const fullReceivePhone = recvMeta.code
      ? `${recvMeta.code}${digitsOnly(receivePhone)}`
      : receivePhone.trim()

    const params = new URLSearchParams({
      from: sendCurrency,
      to: receiveCurrency,
      country: destinationCountry,
      sendCountry,
      corridor: validCorridor!.id,
      amount,
      sendPhone: fullSendPhone,
      receivePhone: fullReceivePhone,
    })
    router.push(`/dashboard/marketplace?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden w-full max-w-full">
      <div className="bg-gradient-to-br from-[#18824a] via-[#146b3e] to-[#0f5530] px-4 sm:px-6 py-4 sm:py-5">
        <h2 className="text-white font-bold text-lg">Start Exchange</h2>
        <p className="text-white/50 text-xs mt-0.5">Send money across Africa in minutes</p>
      </div>

      <form onSubmit={handleFind} className="p-4 sm:p-5 space-y-4">

        {/* Row 1: Sending from + Amount */}
        <div>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <CountryDropdown
                label="Sending from"
                value={sendCountry}
                options={sendCountries}
                onChange={setSendCountry}
                placeholder="Your country"
              />
              {errors.sendCountry && <p className="text-red-500 text-[10px] mt-1">{errors.sendCountry}</p>}
            </div>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                Amount {sendCurrency ? `(${sendCurrency})` : ''} <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={validCorridor ? validCorridor.min_amount.toLocaleString() : '0'}
                disabled={!sendCountry}
                min="0"
                className={`w-full px-3 py-3 rounded-xl border text-gray-900 text-sm focus:outline-none focus:border-[#177945] focus:ring-2 focus:ring-[#177945]/10 transition-all disabled:bg-gray-50 disabled:text-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
                  ${errors.amount ? 'border-red-300' : 'border-gray-200'}`}
              />
              {errors.amount && <p className="text-red-500 text-[10px] mt-1">{errors.amount}</p>}
            </div>
          </div>
          {sendCurrency && validCorridor && (
            <p className="text-[10px] text-gray-400 mt-1 pl-1">
              {sendCurrency} · Min {validCorridor.min_amount.toLocaleString()} · Max {validCorridor.max_amount.toLocaleString()}
            </p>
          )}
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-0.5">
          <div className="w-8 h-8 rounded-full bg-[#177945]/10 flex items-center justify-center">
            <ArrowDown size={15} className="text-[#177945]" />
          </div>
        </div>

        {/* Destination country */}
        <div>
          <CountryDropdown
            label="Destination country"
            value={destinationCountry}
            options={destCountries}
            onChange={setDestinationCountry}
            placeholder={sendCountry ? 'Choose destination' : 'Select sending country first'}
          />
          {errors.destCountry && <p className="text-red-500 text-[10px] mt-1">{errors.destCountry}</p>}
          {errors.corridor && <p className="text-red-500 text-[10px] mt-1">{errors.corridor}</p>}
        </div>

        {receiveCurrency && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-xs text-gray-400">They receive:</span>
            <span className="text-sm font-bold text-gray-800">{receiveCurrency}</span>
            {receiveCurrency === sendCurrency && destinationCountry && (
              <span className="text-xs text-gray-400">in {destinationCountry}</span>
            )}
          </div>
        )}

        {/* Phone numbers — shown once both countries selected */}
        {sendCountry && destinationCountry && (
          <div className="space-y-3 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium pt-1">
              <Phone size={12} />
              Phone numbers for the transfer
            </div>
            <PhoneInput
              label={`Your phone number (${sendCountry})`}
              country={sendCountry}
              value={sendPhone}
              onChange={setSendPhone}
              error={errors.sendPhone}
            />
            <PhoneInput
              label={`Recipient phone number (${destinationCountry})`}
              country={destinationCountry}
              value={receivePhone}
              onChange={setReceivePhone}
              error={errors.receivePhone}
            />
          </div>
        )}

        {/* Protection note */}
        <div className="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
          <ShieldCheck size={14} className="text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-xs font-medium">HOXA Protected Exchange — your payment is secured</p>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#177945] to-[#1a9152] text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#177945]/20"
        >
          <Search size={14} /> Find Exchange Offers
        </button>
      </form>
    </div>
  )
}
