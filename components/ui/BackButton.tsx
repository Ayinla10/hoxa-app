'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  label?: string
  href?: string          // if set, navigates to this URL; otherwise router.back()
  className?: string
}

export default function BackButton({ label = 'Back', href, className = '' }: Props) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => href ? router.push(href) : router.back()}
      className={`inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#177945] transition-colors mb-4 ${className}`}
    >
      <ChevronLeft size={16} />
      {label}
    </button>
  )
}
