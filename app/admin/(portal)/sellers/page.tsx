import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import SellerApplicationRow from './SellerApplicationRow'
import { ShieldCheck } from 'lucide-react'

export default async function AdminSellersPage() {
  const supabase = createServiceClient()

  const { data: applications } = await supabase
    .from('sellers')
    .select('*, profiles!user_id(id, full_name, phone, country, created_at)')
    .order('created_at', { ascending: false })

  const pending = applications?.filter((a: any) => a.status === 'pending') ?? []
  const reviewed = applications?.filter((a: any) => a.status !== 'pending') ?? []

  return (
    <>
      <AdminTopbar title="Seller Applications" notifCount={pending.length} />
      <div className="px-4 lg:px-8 py-5 space-y-6 w-full">

        {/* Pending */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Pending Review
              {pending.length > 0 && <span className="ml-2 text-xs font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">{pending.length}</span>}
            </h2>
          </div>
          {pending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <ShieldCheck size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map((a: any) => <SellerApplicationRow key={a.id} application={a} />)}
            </div>
          )}
        </section>

        {/* Reviewed */}
        {reviewed.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3">Reviewed</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm hidden lg:table">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['Applicant', 'Country', 'Currencies', 'Daily Limit', 'Status', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reviewed.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.profiles?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.profiles?.country}</td>
                      <td className="px-4 py-3 text-gray-600">{a.currencies?.join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{a.daily_limit?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                          a.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                          a.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="lg:hidden divide-y divide-gray-100">
                {reviewed.map((a: any) => (
                  <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{a.profiles?.full_name}</p>
                      <p className="text-gray-400 text-xs">{a.profiles?.country}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      a.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
