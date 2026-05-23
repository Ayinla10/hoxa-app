'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'

interface Toast {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface Props {
  userId: string
}

const TYPE_CONFIG: Record<Toast['type'], {
  icon: React.ElementType
  border: string
  iconCls: string
  bar: string
}> = {
  info:    { icon: Info,          border: 'border-blue-200',  iconCls: 'text-blue-500',   bar: 'bg-blue-500'   },
  success: { icon: CheckCircle2,  border: 'border-green-200', iconCls: 'text-[#18824a]',  bar: 'bg-[#18824a]'  },
  warning: { icon: AlertTriangle, border: 'border-amber-200', iconCls: 'text-amber-500',  bar: 'bg-amber-500'  },
  error:   { icon: XCircle,       border: 'border-red-200',   iconCls: 'text-red-500',    bar: 'bg-red-500'    },
}

const AUTO_DISMISS_MS = 6000

export default function RealtimeNotificationProvider({ userId }: Props) {
  const router = useRouter()
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as any
          const type = (['info', 'success', 'warning', 'error'].includes(n.type)
            ? n.type : 'info') as Toast['type']

          const toast: Toast = {
            id: n.id ?? String(Date.now()),
            title: n.title ?? 'Notification',
            message: n.message ?? '',
            type,
          }

          setToasts(prev => {
            const next = [...prev, toast]
            return next.length > 5 ? next.slice(-5) : next
          })

          setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS)
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, router, dismiss])

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation on next frame
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const cfg = TYPE_CONFIG[toast.type]
  const Icon = cfg.icon

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        bg-white ${cfg.border} border rounded-2xl shadow-xl
        flex items-start gap-3 p-4
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}
      `}
    >
      {/* Left colour bar */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-2xl`} />

      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${cfg.iconCls}`}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-gray-900 font-bold text-sm leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-gray-500 text-xs mt-1 leading-relaxed">{toast.message}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>

      {/* Progress bar */}
      <ProgressBar durationMs={AUTO_DISMISS_MS} barCls={cfg.bar} />
    </div>
  )
}

function ProgressBar({ durationMs, barCls }: { durationMs: number; barCls: string }) {
  const [width, setWidth] = useState(100)

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100)
      setWidth(remaining)
      if (remaining === 0) clearInterval(interval)
    }, 50)
    return () => clearInterval(interval)
  }, [durationMs])

  return (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
      <div
        className={`h-full ${barCls} opacity-40 transition-none`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}
