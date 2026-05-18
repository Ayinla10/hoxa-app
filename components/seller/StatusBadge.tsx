'use client'

import { useI18n } from '@/lib/i18n-context'
import type { TKey } from '@/lib/i18n'

type Status = 'active' | 'paused' | 'busy' | 'completed' | 'pending' | 'rejected' | 'disputed' | 'online' | 'offline'

const styles: Record<Status, string> = {
  active:    'bg-green-50 text-green-700 border-green-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  online:    'bg-green-50 text-green-700 border-green-200',
  pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  busy:      'bg-orange-50 text-orange-700 border-orange-200',
  paused:    'bg-gray-100 text-gray-500 border-gray-200',
  offline:   'bg-gray-100 text-gray-500 border-gray-200',
  rejected:  'bg-red-50 text-red-600 border-red-200',
  disputed:  'bg-purple-50 text-purple-700 border-purple-200',
}

const dots: Record<Status, string> = {
  active:    'bg-green-500',
  completed: 'bg-green-500',
  online:    'bg-green-500',
  pending:   'bg-yellow-500',
  busy:      'bg-orange-500',
  paused:    'bg-gray-400',
  offline:   'bg-gray-400',
  rejected:  'bg-red-500',
  disputed:  'bg-purple-500',
}

const labelKeys: Record<Status, TKey> = {
  active:    'active',
  completed: 'status_completed',
  online:    'online',
  pending:   'status_pending',
  busy:      'busy',
  paused:    'paused',
  offline:   'offline',
  rejected:  'rejected',
  disputed:  'disputed',
}

export default function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n()

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[status]}`} />
      {t(labelKeys[status])}
    </span>
  )
}
