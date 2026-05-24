'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface Crumb {
  label: string
  href?: string
}

interface Props {
  crumbs: Crumb[]
  homeHref?: string
}

export default function Breadcrumb({ crumbs, homeHref = '/dashboard' }: Props) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-4 flex-wrap" aria-label="Breadcrumb">
      <Link href={homeHref} className="flex items-center gap-1 hover:text-[#177945] transition-colors">
        <Home size={12} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight size={12} className="text-gray-300 flex-shrink-0" />
          {crumb.href && i < crumbs.length - 1 ? (
            <Link href={crumb.href} className="hover:text-[#177945] transition-colors">{crumb.label}</Link>
          ) : (
            <span className="text-gray-600 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
