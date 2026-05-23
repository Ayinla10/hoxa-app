'use client'

import { useState, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { CURRENCY_META } from '@/lib/currency-meta'
import CurrencyFlag from './CurrencyFlag'

interface Props {
  value: string
  onChange: (code: string) => void
  options?: string[]
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
}

export default function CurrencySelect({
  value,
  onChange,
  options,
  placeholder = 'Select currency',
  className = '',
  size = 'md',
}: Props) {
  const [open, setOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const buttonRef = useRef<HTMLButtonElement>(null)

  const list = options ?? Object.keys(CURRENCY_META)
  const selected = CURRENCY_META[value]

  const py = size === 'sm' ? 'py-2' : 'py-2.5'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  function handleOpen() {
    if (open) { setOpen(false); return }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const dropHeight = Math.min(list.length * 44, 256)
      if (spaceBelow >= dropHeight || spaceBelow >= 150) {
        setDropdownStyle({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 200) })
      } else {
        setDropdownStyle({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: Math.max(rect.width, 200) })
      }
    }
    setOpen(true)
  }

  function handleSelect(code: string) {
    onChange(code)
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-2 px-3 ${py} rounded-xl border border-gray-200 bg-white hover:border-[#18824a]/50 focus:outline-none focus:border-[#18824a] focus:ring-2 focus:ring-[#18824a]/10 transition-colors cursor-pointer`}
      >
        {selected ? (
          <>
            <CurrencyFlag code={value} size={18} />
            <span className={`font-semibold text-gray-900 ${text} flex-1 text-left`}>{value}</span>
            <span className={`text-gray-400 ${text} hidden sm:block truncate max-w-[90px]`}>{selected.name}</span>
          </>
        ) : (
          <span className={`${text} text-gray-400 flex-1 text-left`}>{placeholder}</span>
        )}
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Invisible full-screen backdrop — clicking outside closes the dropdown */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />

          {/* Dropdown — sits above the backdrop */}
          <div
            style={{ ...dropdownStyle, position: 'fixed', zIndex: 9999 }}
            className="bg-white border border-gray-200 rounded-xl shadow-2xl py-1 max-h-64 overflow-y-auto"
          >
            {list.map(code => {
              const meta = CURRENCY_META[code]
              const isSelected = code === value
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleSelect(code)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-[#18824a]/5' : ''}`}
                >
                  <CurrencyFlag code={code} size={20} />
                  <span className={`font-semibold text-sm ${isSelected ? 'text-[#18824a]' : 'text-gray-900'}`}>{code}</span>
                  {meta && <span className="text-gray-400 text-xs truncate">{meta.name}</span>}
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
