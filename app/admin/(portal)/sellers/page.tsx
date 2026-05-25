import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import SellerApplicationRow from './SellerApplicationRow'
import SellerOverrideButton from './SellerOverrideButton'
import { ShieldCheck, Store, XCircle, Wifi, WifiOff } from 'lucide-react'
import { requireAdminPermission } from '@/lib/admin-guard'

export default async function AdminSellersPage() {
  await requireAdminPermission('sellers')
  const supabase = createServiceClient()

  const { data: applications } = await supabase
    .from('sellers')
    .select('*, profiles!user_id(id, full_name, phone, country, created_at)')
    .order('created_at', { ascending: false })

  const pending  = applications?.filter((a: any) => a.status === 'pending')  ?? []
  const approved = applications?.filter((a: any) => a.status === 'approved') ?? []
  const rejected = applications?.filter((a: any) => a.status === 'rejected') ?? []

  function availabilityLabel(seller: any) {
    if (seller.admin_availability_override === 'available') return { label: 'Forced Online', cls: 'bg-green-100 text-green-800 border-green-300' }
    if (seller.admin_availability_override === 'offline')   return { label: 'Forced Offline', cls: 'bg-red-100 text-red-700 border-red-200' }
    if (seller.manual_availability_status === 'available')  return { label: 'Online',         cls: 'bg-green-50 text-green-700 border-green-200' }
    return { label: 'Offline', cls: 'bg-gray-100 text-gray-500 border-gray-200' }
  }

  return (
    <>
      <AdminTopbar title="Seller Management" notifCount={pending.length} />
      <div className="px-4 lg:px-8 py-5 space-y-6 w-full">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Sellers', value: approved.length, icon: Store,       color: 'text-[#18824a]', bg: 'bg-green-50' },
            { label: 'Pending Review', value: pending.length,  icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rejected',       value: rejected.length, icon: XCircle,     color: 'text-red-500',   bg: 'bg-red-50'   },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className={`w-8 h-8 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={15} className={s.color} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Pending applications */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Pending Review
              {pending.length > 0 && (
                <span className="ml-2 text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">{pending.length}</span>
              )}
            </h2>
          </div>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <ShieldCheck size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((a: any) => <SellerApplicationRow key={a.id} application={a} />)}
            </div>
          )}
        </section>

        {/* Approved sellers with availability override */}
        {approved.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="font-bold text-gray-900">Active Sellers</h2>
              <span className="text-xs text-gray-400">Manage availability overrides</span>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      {['Seller', 'Country', 'Currencies', 'Completion', 'Availability', 'Override'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {approved.map((a: any) => {
                      const avail = availabilityLabel(a)
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(a.profiles?.full_name ?? 'S').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{a.profiles?.full_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{a.profiles?.country ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{a.currencies?.join(', ') || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold ${(a.completion_rate ?? 0) >= 80 ? 'text-green-600' : 'text-amber-500'}`}>
                              {a.completion_rate ?? 0}%
                            </span>
                            <span className="text-gray-400 text-[10px] ml-1">({a.total_transactions ?? 0} txns)</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${avail.cls}`}>
                              {avail.label.includes('Online') ? <Wifi size={10} /> : <WifiOff size={10} />}
                              {avail.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <SellerOverrideButton
                              sellerId={a.id}
                              currentOverride={a.admin_availability_override ?? null}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden divide-y divide-gray-100">
                {approved.map((a: any) => {
                  const avail = availabilityLabel(a)
                  return (
                    <div key={a.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {(a.profiles?.full_name ?? 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{a.profiles?.full_name ?? '—'}</p>
                            <p className="text-gray-400 text-xs">{a.profiles?.country} · {a.completion_rate ?? 0}% · {a.total_transactions ?? 0} txns</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${avail.cls}`}>
                          {avail.label.includes('Online') ? <Wifi size={9} /> : <WifiOff size={9} />}
                          {avail.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">Override:</span>
                        <SellerOverrideButton
                          sellerId={a.id}
                          currentOverride={a.admin_availability_override ?? null}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Rejected */}
        {rejected.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3 text-sm">Rejected Applications</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
              {rejected.map((a: any) => (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.profiles?.full_name}</p>
                    <p className="text-gray-400 text-xs">{a.profiles?.country} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">Rejected</span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </>
  )
}
