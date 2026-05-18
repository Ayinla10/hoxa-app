'use client'

import { useState, useRef, useEffect } from 'react'
import { useI18n } from '@/lib/i18n-context'
import { ChevronDown, Globe } from 'lucide-react'

interface Props {
  variant?: 'sidebar' | 'page' | 'icon'
}

const LANGS = [
  { code: 'en' as const, flag: 'GB', label: 'English' },
  { code: 'fr' as const, flag: 'FR', label: 'Français' },
]

function FlagIcon({ code, size = 18 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt={code}
      width={size}
      height={Math.round(size * 0.75)}
      className="rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
      onError={(e) => {
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        const fallback = target.nextElementSibling as HTMLElement
        if (fallback) fallback.style.display = 'flex'
      }}
    />
  )
}

function FlagWithFallback({ code, size = 18 }: { code: string; size?: number }) {
  return (
    <span className="inline-flex items-center flex-shrink-0">
      <FlagIcon code={code} size={size} />
      <span
        className="items-center justify-center rounded-sm bg-gray-200 text-[9px] font-bold text-gray-500"
        style={{ width: size, height: Math.round(size * 0.75), display: 'none' }}
      >
        {code}
      </span>
    </span>
  )
}

export default function LanguageSwitcher({ variant = 'sidebar' }: Props) {
  const { lang, toggle, isPending } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LANGS.find(l => l.code === lang) ?? LANGS[0]

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleSelect() {
    toggle()
    setOpen(false)
  }

  if (variant === 'icon') {
    return (
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen(v => !v)}
          disabled={isPending}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Change language"
        >
          <FlagWithFallback code={current.flag} size={20} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { if (l.code !== lang) handleSelect(); else setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${l.code === lang ? 'font-semibold text-[#177945]' : 'text-gray-700'}`}
                >
                  <FlagWithFallback code={l.flag} size={18} />
                  {l.label}
                  {l.code === lang && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#177945]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen(v => !v)}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          aria-label="Change language"
        >
          <FlagWithFallback code={current.flag} size={20} />
          <span>{current.label}</span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { if (l.code !== lang) handleSelect(); else setOpen(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${l.code === lang ? 'font-semibold text-[#177945]' : 'text-gray-700'}`}
                >
                  <FlagWithFallback code={l.flag} size={20} />
                  {l.label}
                  {l.code === lang && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#177945]" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // sidebar variant
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
        aria-label="Change language"
      >
        <FlagWithFallback code={current.flag} size={16} />
        <span className="text-white/70 text-xs font-semibold uppercase">{current.code}</span>
        <ChevronDown size={11} className={`text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-full mt-1.5 w-40 bg-[#0f2a1a] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { if (l.code !== lang) handleSelect(); else setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-white/10 transition-colors ${l.code === lang ? 'text-white font-semibold' : 'text-white/60'}`}
              >
                <FlagWithFallback code={l.flag} size={16} />
                {l.label}
                {l.code === lang && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#22C55E]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
