'use client'

import { useState, useTransition } from 'react'
import { Bell, CheckCircle2, AlertTriangle, Info, Check, Loader2 } from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead } from '@/actions/admin'
import { useRouter } from 'next/navigation'

type Notification = {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  profiles: { full_name: string; role: string } | null
}

const typeConfig: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  info:    { icon: Info,          bg: 'bg-blue-50',   text: 'text-blue-600',  label: 'Info' },
  success: { icon: CheckCircle2,  bg: 'bg-green-50',  text: 'text-green-600', label: 'Success' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',  text: 'text-amber-600', label: 'Warning' },
  error:   { icon: AlertTriangle, bg: 'bg-red-50',    text: 'text-red-500',   label: 'Error' },
}

const FILTER_TABS = ['all', 'info', 'success', 'warning', 'error'] as const
type FilterTab = typeof FILTER_TABS[number]

export default function AlertsClient({ notifications: initial }: { notifications: Notification[] }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [markingAll, startMarkAll] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  async function handleMarkOne(id: string) {
    setLoadingId(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(id)
    setLoadingId(null)
    router.refresh()
  }

  function handleMarkAll() {
    startMarkAll(async () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Platform Alerts</h1>
          <p className="text-gray-400 text-sm mt-0.5">All system-generated notifications across all users.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors disabled:opacity-50 flex-shrink-0 mt-1"
          >
            {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TABS.map(tab => {
          const count = tab === 'all'
            ? notifications.length
            : notifications.filter(n => n.type === tab).length
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors capitalize ${
                filter === tab
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'all' ? 'All' : typeConfig[tab]?.label ?? tab} {count > 0 && `(${count})`}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <Bell size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium text-sm">No notifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
          {filtered.map((n) => {
            const cfg = typeConfig[n.type] ?? typeConfig.info
            const Icon = cfg.icon
            return (
              <div key={n.id} className={`px-5 py-4 flex items-start gap-3 transition-opacity ${n.read ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                  <Icon size={14} className={cfg.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-gray-900 text-sm font-semibold">{n.title}</p>
                      {!n.read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-gray-400 text-[10px] whitespace-nowrap flex-shrink-0">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                  {n.profiles && (
                    <p className="text-gray-400 text-[10px] mt-1">→ {n.profiles.full_name} ({n.profiles.role})</p>
                  )}
                </div>
                {!n.read && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    disabled={loadingId === n.id}
                    title="Mark as read"
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                  >
                    {loadingId === n.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Check size={13} />
                    }
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
