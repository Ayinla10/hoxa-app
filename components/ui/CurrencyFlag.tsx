'use client'

import { currencyFlagUrl } from '@/lib/currency-meta'

interface Props {
  code: string
  size?: number
  className?: string
}

/**
 * Renders a real flag image for a currency code via flagcdn.com.
 * Emoji flags are NOT used — they don't render on Windows.
 */
export default function CurrencyFlag({ code, size = 20, className = '' }: Props) {
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
