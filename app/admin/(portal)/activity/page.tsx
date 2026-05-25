import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import Link from 'next/link'
import { Activity, ArrowRight, ExternalLink } from 'lucide-react'
import { requireAdminPermission } from '@/lib/admin-guard'

const ACTION_LABELS: Record<string, { label: string; cls: string }> = {
  DISPUTE_RESOLVED_SELLER_WINS:  { label: 'Dispute → Seller wins',  cls: 'bg-green-50 text-green-700' },
  DISPUTE_RESOLVED_BUYER_WINS:   { label: 'Dispute → Buyer wins',   cls: 'bg-red-50 text-red-700' },
  DISPUTE_NOTES_UPDATED:         { label: 'Dispute notes saved',     cls: 'bg-gray-50 text-gray-600' },
  STATUS_CHANGE:                 { label: 'Status changed',          cls: 'bg-blue-50 text-blue-700' },
  PAYMENT_CONFIRMED:             { label: 'Payment confirmed',        cls: 'bg-teal-50 text-teal-700' },
  PAYMENT_REJECTED:              { label: 'Payment rejected',         cls: 'bg-amber-50 text-amber-700' },
  SETTLEMENT_RELEASED:           { label: 'Settlement released',      cls: 'bg-green-50 text-green-700' },
  SELLER_APPROVED:               { label: 'Seller approved',          cls: 'bg-green-50 text-green-700' },
  SELLER_SUSPENDED:              { label: 'Seller suspended',         cls: 'bg-red-50 text-red-700' },
  CORRIDOR_TOGGLED:              { label: 'Corridor toggled',         cls: 'bg-purple-50 text-purple-700' },
  ROLE_CHANGE:                   { label: 'Role changed',             cls: 'bg-indigo-50 text-indigo-700' },
  SETTINGS_CHANGE:               { label: 'Settings updated',         cls: 'bg-amber-50 text-amber-700' },
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const LOG_PAGE_SIZE = 50

interface ActivityProps {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminActivityPage({ searchParams }: ActivityProps) {
  await requireAdminPermission('activity')
  const { page: pageParam } = await searchParams
  const page = Math.max(0, parseInt(pageParam ?? '0', 10) || 0)
  const supabase = createServiceClient()

  const { data: logs, count: totalCount } = await supabase
    .from('audit_logs')
    .select('*, profiles!actor_id(full_name, role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * LOG_PAGE_SIZE, (page + 1) * LOG_PAGE_SIZE - 1)

  const entries = logs ?? []
  const totalPages = Math.ceil((totalCount ?? 0) / LOG_PAGE_SIZE)

  function pageUrl(p: number) {
    return p > 0 ? `/admin/activity?page=${p}` : '/admin/activity'
  }

  return (
    <>
      <AdminTopbar title="Activity Log" notifCount={0} />
      <div className="px-4 lg:px-8 py-5 space-y-5 w-full">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Activity Log</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              {totalCount ?? 0} total entries · page {page + 1} of {totalPages || 1}
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium">
            <Activity size={12} /> {entries.length} shown
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
            <Activity size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-medium">No activity logged yet</p>
            <p className="text-gray-300 text-xs mt-1">Admin actions will appear here as they happen.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {['Action', 'Entity', 'Admin', 'Details', 'Time', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((log: any) => {
                    const config = ACTION_LABELS[log.action] ?? { label: log.action.replace(/_/g, ' '), cls: 'bg-gray-50 text-gray-600' }
                    const actorName = (log.profiles as any)?.full_name ?? log.actor_role ?? 'System'
                    const entityLink = log.entity === 'transaction' ? `/admin/transactions/${log.entity_id}` : null
                    const meta = log.metadata ?? {}
                    const detail = meta.ref ?? meta.notes?.slice(0, 60) ?? meta.dispute_reason?.slice(0, 60) ?? ''

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${config.cls}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 capitalize text-xs">
                          {log.entity}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-gray-900 font-medium text-xs">{actorName}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs max-w-xs truncate">
                          {detail || '—'}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(log.created_at)}</td>
                        <td className="px-5 py-3">
                          {entityLink ? (
                            <Link href={entityLink} className="flex items-center gap-1 text-[#18824a] hover:underline text-xs font-medium">
                              View <ExternalLink size={10} />
                            </Link>
                          ) : (
                            <span className="text-gray-200">—</span>
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
              {entries.map((log: any) => {
                const config = ACTION_LABELS[log.action] ?? { label: log.action.replace(/_/g, ' '), cls: 'bg-gray-50 text-gray-600' }
                const actorName = (log.profiles as any)?.full_name ?? log.actor_role ?? 'System'
                const entityLink = log.entity === 'transaction' ? `/admin/transactions/${log.entity_id}` : null
                const meta = log.metadata ?? {}
                const detail = meta.ref ?? meta.notes?.slice(0, 40) ?? ''

                return (
                  <div key={log.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold ${config.cls}`}>
                        {config.label}
                      </span>
                      <span className="text-gray-400 text-xs">{timeAgo(log.created_at)}</span>
                    </div>
                    <p className="text-gray-600 text-xs">
                      By <span className="font-medium">{actorName}</span>
                      {detail ? ` — ${detail}` : ''}
                    </p>
                    {entityLink && (
                      <Link href={entityLink} className="inline-flex items-center gap-1 text-[#18824a] text-xs mt-1 hover:underline">
                        View {log.entity} <ArrowRight size={10} />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">Page {page + 1} of {totalPages}</p>
            <div className="flex items-center gap-2">
              {page > 0 && (
                <a href={pageUrl(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  ← Prev
                </a>
              )}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(0, Math.min(totalPages - 5, page - 2)) + i
                return (
                  <a key={p} href={pageUrl(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                      p === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {p + 1}
                  </a>
                )
              })}
              {page < totalPages - 1 && (
                <a href={pageUrl(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Next →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
