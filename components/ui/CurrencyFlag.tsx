'use client'

import { currencyFlagUrl } from '@/lib/currency-meta'

interface Props {
  code: string
  size?: number
  className?: string
}

/**
 * Multi-country CFA currencies (XOF / XAF) span many nations, so showing one
 * country's flag is misleading.  We render a compact labelled badge instead.
 */
const CFA_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  XOF: { label: 'CFA', bg: '#f0fdf4', text: '#15803d' },
  XAF: { label: 'FCFA', bg: '#eff6ff', text: '#1d4ed8' },
}

/**
 * Renders a real flag image for a currency code via flagcdn.com.
 * Emoji flags are NOT used — they don't render on Windows.
 * XOF / XAF get a styled text badge instead of a flag.
 */
export default function CurrencyFlag({ code, size = 20, className = '' }: Props) {
  const badge = CFA_BADGE[code]
  if (badge) {
    const fontSize = Math.max(8, Math.round(size * 0.55))
    return (
      <span
        className={`inline-flex items-center justify-center rounded font-bold flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: Math.round(size * 0.75),
          background: badge.bg,
          color: badge.text,
          fontSize,
          border: `1px solid ${badge.text}33`,
          letterSpacing: '-0.02em',
        }}
        aria-label={code}
      >
        {badge.label}
      </span>
    )
  }

  const url = currencyFlagUrl(code, size >= 30 ? 40 : 20)
  if (!url) return null
  return (
    <img
      src={url}
      alt={code}
      width={size}
      height={Math.round(size * 0.67)}
      className={`inline-block rounded-sm object-cover flex-shrink-0 ${className}`}
      loading="lazy"
    />
  )
}
