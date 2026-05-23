'use client'

import { useState } from 'react'
import { Bell, ArrowLeftRight, ShieldCheck, LifeBuoy, Check, CheckCheck } from 'lucide-react'
import { markNotificationRead, markAllRead } from '@/actions/notifications'
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
  { key: 'all', icon: Bell },
  { key: 'transactions', icon: ArrowLeftRight },
  { key: 'security', icon: ShieldCheck },
  { key: 'support', icon: LifeBuoy },
] as const

function categorize(n: Notification): string {
  const title = n.title.toLowerCase()
  const msg = n.message.toLowerCase()
  const combined = title + ' ' + msg

  if (combined.includes('exchange') || combined.includes('payment') || combined.includes('transaction') || combined.includes('seller') || combined.includes('verified') || combined.includes('completed') || combined.includes('accepted') || combined.includes('rejected')) {
    return 'transactions'
  }
  if (combined.includes('security') || combined.includes('login') || combined.includes('password') || combined.includes('session')) {
    return 'security'
  }
  if (combined.includes('support') || combined.includes('dispute') || combined.includes('help') || combined.includes('fraud')) {
    return 'support'
  }
  return 'transactions' // default
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

const TYPE_STYLES: Record<string, { bg: string; text: string }> = {
  info:    { bg: 'bg-blue-50',   text: 'text-blue-600' },
  success: { bg: 'bg-green-50',  text: 'text-green-600' },
  warning: { bg: 'bg-amber-50',  text: 'text-amber-600' },
  error:   { bg: 'bg-red-50',    text: 'text-red-600' },
}

export default function BuyerNotificationsClient({ notifications }: { notifications: Notification[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('all')

  const unread = notifications.filter(n => !n.read).length

  const filtered = activeTab === 'all'
    ? notifications
    : notifications.filter(n => categorize(n) === activeTab)

  async function handleMarkRead(id: string) {
    await markNotificationRead(id)
    router.refresh()
  }

  async function handleMarkAllRead() {
    await markAllRead()
    router.refresh()
  }

  const tabKeys: Record<string, string> = {
    all: t('tab_all'),
    transactions: t('tab_transactions'),
    security: t('tab_security'),
    support: t('tab_support'),
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('notifications')}</h1>
          {unread > 0 && <p className="text-gray-400 text-sm mt-0.5">{unread} {t('unread')}</p>}
        </div>
        {unread > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#177945] hover:bg-[#177945]/10 transition-colors"
          >
            <CheckCheck size={13} /> {t('mark_all_read')}
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map(tab => {
          const active = activeTab === tab.key
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tabKeys[tab.key]}</span>
            </button>
          )
        })}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
          <Bell size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">{t('no_notifications')}</p>
          <p className="text-gray-400 text-xs mt-1">{t('no_notifications_sub')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop table */}
          <div className="hidden lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Notification', 'Type', 'Time', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(n => {
                  const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info
                  return (
                    <tr
                      key={n.id}
                      className={`hover:bg-gray-50 transition-colors ${!n.read ? 'bg-[#177945]/[0.02]' : ''}`}
                      onClick={() => !n.read && handleMarkRead(n.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          {!n.read && <span className="w-2 h-2 bg-[#177945] rounded-full mt-1.5 flex-shrink-0" />}
                          <div>
                            <p className={`${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          {n.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">{timeAgo(n.created_at)}</td>
                      <td className="px-5 py-4">
                        {n.read ? (
                          <span className="text-gray-400 text-xs">Read</span>
                        ) : (
                          <span className="text-[#177945] text-xs font-medium">New</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="lg:hidden divide-y divide-gray-100">
            {filtered.map(n => (
              <div
                key={n.id}
                className={`px-4 py-4 ${!n.read ? 'bg-[#177945]/[0.02]' : ''}`}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  {!n.read && <span className="w-2 h-2 bg-[#177945] rounded-full mt-1.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-sm truncate ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                      <span className="text-gray-400 text-xs whitespace-nowrap flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2">{n.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
