'use client'

import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh'

interface Props {
  table: string
  filter?: string
}

export default function RealtimeSubscriber({ table, filter }: Props) {
  useRealtimeRefresh(table, filter)
  return null
}
