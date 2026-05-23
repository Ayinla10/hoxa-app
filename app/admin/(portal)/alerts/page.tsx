import AdminTopbar from '@/components/admin/AdminTopbar'
import { createServiceClient } from '@/lib/supabase/server'
import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

export default async function AlertsPage() {
  const supabase = createServiceClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, message, type, is_read, created_at, profiles!user_id(full_name, role)')
    .order('created_at', { ascending: false })
    .limit(100)

  const typeConfig: Record<string, { icon: any; pill: string }> = {
    info:    { icon: Info,          pill: 'bg-blue-50 text-blue-700 border-blue-200' },
    success: { icon: CheckCircle2,  pill: 'bg-green-50 text-green-700 border-green-200' },
    warning: { icon: AlertTriangle, pill: 'bg-amber-50 text-amber-700 border-amber-200' },
    error:   { icon: AlertTriangle, pill: 'bg-red-50 text-red-600 border-red-200' },
  }

  return (
    <>
      <AdminTopbar title="Alerts & Notifications" />
      <div className="px-4 lg:px-8 py-6 space-y-5 max-w-3xl">
        <div>
          <h1 className="text-gray-900 font-bold text-lg">Platform Alerts</h1>
          <p className="text-gray-400 text-sm mt-0.5">All system-generated notifications across all users.</p>
        </div>

        {(notifications ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Bell size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-50">
            {(notifications ?? []).map((n: any) => {
              const cfg = typeConfig[n.type] ?? typeConfig.info
              const Icon = cfg.icon
              return (
                <div key={n.id} className={`px-5 py-4 flex items-start gap-3 ${n.is_read ? 'opacity-60' : ''}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.pill.split(' ')[0]}`}>
                    <Icon size={14} className={cfg.pill.split(' ')[1]} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-gray-900 text-sm font-semibold">{n.title}</p>
                      <p className="text-gray-400 text-[10px] whitespace-nowrap flex-shrink-0">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{n.message}</p>
                    {n.profiles && (
                      <p className="text-gray-400 text-[10px] mt-1">→ {n.profiles.full_name} ({n.profiles.role})</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
