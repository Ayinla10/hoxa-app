'use client'

import { useState } from 'react'
import {
  Bell, ArrowLeftRight, ShieldCheck, LifeBuoy,
  CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Loader2
} from 'lucide-react'
import { markNotificationRead, markAllRead } from '@/actions/notifications'
import BackButton from '@/components/ui/BackButton'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n-context'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

const TABS = [
  { key: 'all',          icon: Bell },
  { key: 'transactions', icon: ArrowLeftRight },
  { key: 'security',     icon: ShieldCheck },
  { key: 'support',      icon: LifeBuoy },
] as const

const TYPE_ICONS: Record<string, any> = {
  info:    Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error:   XCircle,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  info:    { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-200' },
  success: { bg: 'bg-green-50',  text: 'text-green-600',  border: 'border-green-200' },
  warning: { bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  error:   { bg: 'bg-red-50',    text: 'text-red-500',    border: 'border-red-200' },
}

function categorize(n: Notification): string {
  const combined = (n.title + ' ' + n.message).toLowerCase()
  if (combined.includes('exchange') || combined.includes('payment') || combined.includes('transaction') ||
      combined.includes('seller') || combined.includes('verified') || combined.includes('completed') ||
      combined.includes('accepted') || combined.includes('rejected')) return 'transactions'
  if (combined.includes('security') || combined.includes('login') || combined.includes('password') ||
      combined.includes('session')) return 'security'
  if (combined.includes('support') || combined.includes('dispute') || combined.includes('help') ||
      combined.includes('fraud')) return 'support'
  return 'transactions'
}

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  const d = Math.floor(s / 86400)
  if (d < 7) return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

export default function BuyerNotificationsClient({ notifications }: { notifications: Notification[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('all')
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [markingAll, setMarkingAll] = useState(false)

  const unread = notifications.filter(n => !n.read && !readIds.has(n.id)).length

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => categorize(n) === activeTab)

  async function handleMarkRead(id: string) {
    setReadIds(prev => new Set(prev).add(id))
    await markNotificationRead(id)
    router.refresh()
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    await markAllRead()
    setReadIds(new Set(notifications.map(n => n.id)))
    router.refresh()
    setMarkingAll(false)
  }

  const tabKeys: Record<string, string> = {
    all: t('tab_all'),
    transactions: t('tab_transactions'),
    security: t('tab_security'),
    support: t('tab_support'),
  }

  return (
    <div className="space-y-5">
      <BackButton href="/dashboard" />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('notifications')}</h1>
          {unread > 0 && <p className="text-gray-400 text-sm mt-0.5">{unread} {t('unread')}</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#177945] text-xs font-semibold hover:bg-[#177945]/5 transition-colors disabled:opacity-50"
          >
            {markingAll ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            {t('mark_all_read')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${activeTab === key
                ? 'bg-[#177945] text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-[#177945]/30 hover:text-[#177945]'
              }`}
          >
            <Icon size={13} />
            {tabKeys[key]}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Bell size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">{t('no_notifications')}</p>
          <p className="text-gray-400 text-xs mt-1">{t('no_notifications_sub')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {filtered.map((n, i) => {
            const isRead = n.read || readIds.has(n.id)
            const colors = TYPE_COLORS[n.type] ?? TYPE_COLORS.info
            const Icon = TYPE_ICONS[n.type] ?? Info
            return (
              <button
                key={n.id}
                onClick={() => !isRead && handleMarkRead(n.id)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-colors
                  ${i > 0 ? 'border-t border-gray-100' : ''}
                  ${!isRead ? 'bg-[#177945]/[0.02] hover:bg-[#177945]/[0.04]' : 'hover:bg-gray-50'}
                  ${!isRead ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {/* Icon badge */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${colors.bg} ${colors.border}`}>
                  <Icon size={16} className={colors.text} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm leading-snug ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-gray-400 text-xs whitespace-nowrap">{timeAgo(n.created_at)}</span>
                      {!isRead && <span className="w-2 h-2 bg-[#177945] rounded-full flex-shrink-0" />}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 line-clamp-2 text-left">{n.message}</p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
