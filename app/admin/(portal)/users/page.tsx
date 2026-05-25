import { createServiceClient } from '@/lib/supabase/server'
import AdminTopbar from '@/components/admin/AdminTopbar'
import UserActionsMenu from './UserActionsMenu'
import UsersPageClient from './UsersPageClient'
import Link from 'next/link'
import { Users, ShieldCheck, Store, User } from 'lucide-react'
import { requireAdminPermission } from '@/lib/admin-guard'

export default async function AdminUsersPage() {
  await requireAdminPermission('users')
  const supabase = createServiceClient()

  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, country, created_at, admin_permissions')

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  const allUsers = (authUsers ?? []).map((u: any) => {
    const profile = profileMap.get(u.id) as any
    return {
      id: u.id,
      email: u.email ?? '—',
      created_at: u.created_at,
      email_confirmed: !!u.email_confirmed_at,
      full_name: profile?.full_name as string | undefined,
      role: profile?.role as string | undefined,
      phone: profile?.phone as string | undefined,
      country: profile?.country as string | undefined,
      admin_permissions: (profile?.admin_permissions ?? []) as string[],
      is_banned: !!(u.banned_until) || !!(profile?.is_banned),
    }
  })

  // Separate admin accounts from user accounts
  const adminAccounts = allUsers.filter((u: any) => u.role === 'admin')
  const users = allUsers.filter((u: any) => u.role !== 'admin')

  const counts = {
    total: users.length,
    seller: users.filter((u: any) => u.role === 'seller').length,
    buyer: users.filter((u: any) => !u.role || u.role === 'buyer').length,
  }

  function roleStyle(role?: string) {
    if (role === 'admin') return 'bg-red-50 text-red-600 border-red-200'
    if (role === 'seller') return 'bg-[#18824a]/10 text-[#18824a] border-[#18824a]/20'
    return 'bg-gray-100 text-gray-500 border-gray-200'
  }

  function roleLabel(role?: string) {
    if (role === 'admin') return 'Admin'
    if (role === 'seller') return 'Seller'
    return 'Buyer'
  }

  return (
    <>
      <AdminTopbar title="Users" />
      <div className="px-4 lg:px-8 py-5 space-y-6 w-full">

        {/* Stats */}
        <div className="flex items-start justify-between gap-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            {[
              { label: 'Total Users', value: counts.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Buyers', value: counts.buyer, icon: User, color: 'text-gray-600', bg: 'bg-gray-100' },
              { label: 'Sellers', value: counts.seller, icon: Store, color: 'text-[#18824a]', bg: 'bg-[#18824a]/10' },
              { label: 'Admins', value: adminAccounts.length, icon: ShieldCheck, color: 'text-red-500', bg: 'bg-red-50' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.color} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Accounts Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-red-500" />
              <h2 className="text-gray-900 font-bold text-sm">Admin Accounts</h2>
              <span className="text-xs text-gray-400">Separate from user accounts</span>
            </div>
            <UsersPageClient />
          </div>

          <div className="bg-white rounded-2xl border border-red-100 shadow-sm">
            {adminAccounts.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No admin accounts</div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden lg:block">
                  <table className="w-full text-sm">
                    <thead className="border-b border-red-50">
                      <tr>
                        {['Name', 'Email', 'Permissions', 'Joined'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {adminAccounts.map((u: any) => (
                        <tr key={u.id} className="hover:bg-red-50/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900">{u.full_name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.email}</td>
                          <td className="px-4 py-3">
                            {u.admin_permissions.includes('super_admin') ? (
                              <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">Super Admin</span>
                            ) : u.admin_permissions.length > 0 ? (
                              <span className="text-xs text-gray-500">{u.admin_permissions.length} permission{u.admin_permissions.length !== 1 ? 's' : ''}</span>
                            ) : (
                              <span className="text-xs text-gray-300">No permissions set</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {adminAccounts.map((u: any) => (
                    <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-sm truncate">{u.full_name ?? '—'}</p>
                        <p className="text-gray-400 text-xs truncate">{u.email}</p>
                      </div>
                      {u.admin_permissions.includes('super_admin') && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full flex-shrink-0">Super</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Accounts Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-600" />
            <h2 className="text-gray-900 font-bold text-sm">User Accounts</h2>
            <span className="text-xs text-gray-400">{counts.total} total</span>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
            {/* Desktop */}
            <div className="hidden lg:block">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100">
                  <tr>
                    {['Name', 'Email', 'Role', 'Country', 'Joined', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-gray-400 font-medium text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${u.is_banned ? 'bg-gray-400' : 'bg-gradient-to-br from-[#18824a] to-[#0f6a3d]'}`}>
                            {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">{u.full_name ?? '—'}</span>
                            {u.is_banned && <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Banned</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleStyle(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.country ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <UserActionsMenu userId={u.id} currentRole={u.role ?? 'buyer'} userName={u.full_name ?? u.email} isBanned={u.is_banned} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="lg:hidden divide-y divide-gray-100">
              {users.map((u: any) => (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#18824a] to-[#0f6a3d] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(u.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{u.full_name ?? '—'}</p>
                      <p className="text-gray-400 text-xs truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${roleStyle(u.role)}`}>
                      {roleLabel(u.role)}
                    </span>
                    <UserActionsMenu userId={u.id} currentRole={u.role ?? 'buyer'} userName={u.full_name ?? u.email} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
