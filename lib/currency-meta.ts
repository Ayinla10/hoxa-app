/**
 * Single source of truth for currency display metadata.
 * Uses real flag images via flagcdn.com — emoji flags don't work on Windows.
 */

export interface CurrencyMeta {
  cc: string      // ISO 3166-1 alpha-2 country code (for flag images)
  symbol: string  // currency symbol (GH₵, $, £ …)
  name: string    // human-readable name
  country: string // primary country name
}

export const CURRENCY_META: Record<string, CurrencyMeta> = {
  GHS: { cc: 'gh', symbol: 'GH₵',  name: 'Ghanaian Cedi',            country: 'Ghana'         },
  NGN: { cc: 'ng', symbol: '₦',    name: 'Nigerian Naira',            country: 'Nigeria'       },
  XOF: { cc: 'ci', symbol: 'CFA',  name: 'West African CFA Franc',    country: "Côte d'Ivoire" },
  XAF: { cc: 'cm', symbol: 'FCFA', name: 'Central African CFA Franc', country: 'Cameroon'      },
  KES: { cc: 'ke', symbol: 'KSh',  name: 'Kenyan Shilling',           country: 'Kenya'         },
  UGX: { cc: 'ug', symbol: 'USh',  name: 'Ugandan Shilling',          country: 'Uganda'        },
  TZS: { cc: 'tz', symbol: 'TSh',  name: 'Tanzanian Shilling',        country: 'Tanzania'      },
  ZAR: { cc: 'za', symbol: 'R',    name: 'South African Rand',        country: 'South Africa'  },
  GBP: { cc: 'gb', symbol: '£',    name: 'British Pound',             country: 'United Kingdom'},
  EUR: { cc: 'eu', symbol: '€',    name: 'Euro',                      country: 'Europe'        },
  USD: { cc: 'us', symbol: '$',    name: 'US Dollar',                 country: 'United States' },
  CAD: { cc: 'ca', symbol: 'CA$',  name: 'Canadian Dollar',           country: 'Canada'        },
}

/** Returns the flagcdn.com image URL for a currency code */
export function currencyFlagUrl(code: string, size: 20 | 40 = 20): string {
  const cc = CURRENCY_META[code]?.cc
  if (!cc) return ''
  // EU flag for EUR
  if (cc === 'eu') return `https://flagcdn.com/w${size}/eu.png`
  return `https://flagcdn.com/w${size}/${cc}.png`
}

/** Returns "{code} — {name}" e.g. "GHS — Ghanaian Cedi" */
export function currencyLongLabel(code: string): string {
  const meta = CURRENCY_META[code]
  return meta ? `${code} — ${meta.name}` : code
}

// Keep currencyFlag as empty string — use <CurrencyFlag> component for images
export function currencyFlag(_code: string): string { return '' }
