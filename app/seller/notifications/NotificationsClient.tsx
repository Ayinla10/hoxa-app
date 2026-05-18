'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationRead, markAllRead } from '@/actions/notifications'
import {
  Bell, CheckCheck, Info, CheckCircle2,
  AlertTriangle, XCircle, Loader2,
} from 'lucide-react'
import { useI18n } from '@/lib/i18n-context'

const TYPE_ICONS: Record<string, any> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info:    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  success: { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
  warning: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  error:   { bg: 'bg-red-50',    text: 'text-red-500',    border: 'border-red-200' },
}

function timeAgo(date: string, justNow: string, locale: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return justNow
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return new Date(date).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  notifications: any[]
}

export default function NotificationsClient({ notifications }: Props) {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [markingAll, setMarkingAll] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length

  async function handleMarkRead(id: string) {
    setReadIds(prev => new Set(prev).add(id))
    await markNotificationRead(id)
    router.refresh()
  }

  async function handleMarkAll() {
    if (notifications.length === 0) return
    setMarkingAll(true)
    await markAllRead()
    setReadIds(new Set(notifications.map(n => n.id)))
    router.refresh()
    setMarkingAll(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">{t('notifications')}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {unreadCount > 0 ? `${unreadCount} ${t('unread')}` : t('all_caught_up')}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#18824a] text-xs font-semibold hover:bg-[#18824a]/5 transition-colors disabled:opacity-50"
          >
            {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            {t('mark_all_read')}
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Bell size={28} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900 font-semibold text-sm mb-1">{t('no_notifications')}</p>
          <p className="text-gray-400 text-xs">{t('no_notifications_sub')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {notifications.map((n: any, i: number) => {
            const isRead = n.read || readIds.has(n.id)
            const colors = TYPE_COLORS[n.type] ?? TYPE_COLORS.info
            const Icon = TYPE_ICONS[n.type] ?? Info
            return (
              <button
                key={n.id}
                onClick={() => !isRead && handleMarkRead(n.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors ${
                  !isRead ? 'bg-[#18824a]/3 hover:bg-[#18824a]/5' : 'hover:bg-gray-50'
                } ${i !== 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={14} className={colors.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm truncate ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      {n.title}
                    </p>
                    {!isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#18824a] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2">{n.message}</p>
                  <p className="text-gray-300 text-xs mt-1">{timeAgo(n.created_at, t('just_now'), lang)}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
