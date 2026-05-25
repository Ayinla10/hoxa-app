import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminTopbar from '@/components/admin/AdminTopbar'
import UserDetailClient from './UserDetailClient'
import { requireAdminPermission } from '@/lib/admin-guard'
import {
  ArrowLeft, User, Mail, Phone, Globe, Calendar, ShieldCheck,
  Store, ArrowLeftRight, AlertTriangle, CheckCircle2, Ban,
} from 'lucide-react'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPermission('users')
  const { id } = await params
  const service = createServiceClient()

  // Auth user + profile
  const [{ data: authUser }, { data: profile }] = await Promise.all([
    service.auth.admin.getUserById(id),
    service.from('profiles').select('*').eq('id', id).single(),
  ])

  if (!authUser?.user) redirect('/admin/users')

  const u = authUser.user

  // Seller record + transactions in parallel
  const [{ data: seller }, { data: transactions }] = await Promise.all([
    service.from('sellers').select('id, status, completion_rate, total_transactions, timeout_count, rejection_count, availability, created_at').eq('user_id', id).single(),
    service.from('transactions')
      .select('id, status, hoxa_transaction_id, send_amount, send_currency, receive_amount, receive_currency, created_at, dispute_reason, manual_refund_sent_at')
      .or(`buyer_id.eq.${id},seller_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const isBanned = !!(u as any).banned_until || profile?.is_banned

  const txStats = {
    total: transactions?.length ?? 0,
    completed: transactions?.filter(t => t.status === 'fully_completed').length ?? 0,
    disputed: transactions?.filter(t => t.status === 'disputed').length ?? 0,
    cancelled: transactions?.filter(t => ['cancelled', 'seller_rejected', 'seller_timeout'].includes(t.status)).length ?? 0,
  }

  const STATUS_PILL: Record<string, string> = {
    fully_completed: 'bg-green-100 text-green-800 border-green-300',
    disputed: 'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    seller_rejected: 'bg-gray-100 text-gray-500 border-gray-200',
    seller_timeout: 'bg-gray-100 text-gray-500 border-gray-200',
    pending_ops_confirmation: 'bg-blue-50 text-blue-700 border-blue-200',
    pending_settlement: 'bg-green-50 text-green-700 border-green-200',
    fulfillment_in_progress: 'bg-teal-50 text-teal-700 border-teal-200',
    pending_receipt_confirmation: 'bg-green-50 text-green-600 border-green-200',
    awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
    pending_acceptance: 'bg-amber-50 text-amber-700 border-amber-200',
  }

  function pillFor(status: string) {
    return STATUS_PILL[status] ?? 'bg-gray-100 text-gray-500 border-gray-200'
  }

  function labelFor(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <>
      <AdminTopbar title="User Detail" />
      <div className="px-4 lg:px-8 py-5 max-w-5xl space-y-6">

        {/* Back */}
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm">
          <ArrowLeft size={15} /> Back to Users
        </Link>

        {/* Header card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 ${isBanned ? 'bg-gray-400' : 'bg-gradient-to-br from-[#18824a] to-[#0f6a3d]'}`}>
                {(profile?.full_name ?? u.email ?? '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? '—'}</h1>
                  {isBanned && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <Ban size={9} /> BANNED
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                    profile?.role === 'admin' ? 'bg-red-50 text-red-600 border-red-200' :
                    profile?.role === 'seller' ? 'bg-[#18824a]/10 text-[#18824a] border-[#18824a]/20' :
                    'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {profile?.role ?? 'buyer'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-0.5">{u.email}</p>
                <p className="text-gray-400 text-xs mt-1">ID: <span className="font-mono">{id}</span></p>
              </div>
            </div>
            {/* Ban/Unban button */}
            <UserDetailClient userId={id} isBanned={isBanned} userName={profile?.full_name ?? u.email ?? id} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <InfoTile icon={Mail} label="Email" value={u.email ?? '—'} verified={!!u.email_confirmed_at} />
            <InfoTile icon={Phone} label="Phone" value={profile?.phone ?? '—'} />
            <InfoTile icon={Globe} label="Country" value={profile?.country ?? '—'} />
            <InfoTile icon={Calendar} label="Joined" value={new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left col: stats + seller */}
          <div className="space-y-4">
            {/* Transaction stats */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <ArrowLeftRight size={14} className="text-gray-400" /> Transaction Summary
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Total', value: txStats.total, color: 'text-gray-900' },
                  { label: 'Completed', value: txStats.completed, color: 'text-green-700' },
                  { label: 'Disputed', value: txStats.disputed, color: 'text-red-600' },
                  { label: 'Cancelled', value: txStats.cancelled, color: 'text-gray-400' },
                ].map(s => (
                  <div key={s.label} className="bg-[#F7F9F8] rounded-xl p-3">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-gray-400 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Seller record */}
            {seller && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                  <Store size={14} className="text-gray-400" /> Seller Record
                </h2>
                <div className="space-y-2.5 text-sm">
                  <Row label="Status" value={
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                      seller.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      seller.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    }`}>{seller.status}</span>
                  } />
                  <Row label="Completion rate" value={`${seller.completion_rate ?? 0}%`} />
                  <Row label="Total exchanges" value={String(seller.total_transactions ?? 0)} />
                  <Row label="Timeouts" value={String(seller.timeout_count ?? 0)} />
                  <Row label="Rejections" value={String(seller.rejection_count ?? 0)} />
                  <Row label="Availability" value={seller.availability ?? '—'} />
                  <Row label="Seller since" value={new Date(seller.created_at).toLocaleDateString()} />
                </div>
              </div>
            )}
          </div>

          {/* Right col: transaction history */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-gray-900 text-sm">Transaction History</h2>
                <span className="text-xs text-gray-400">{txStats.total} transactions</span>
              </div>

              {(transactions ?? []).length === 0 ? (
                <div className="p-10 text-center">
                  <ArrowLeftRight size={24} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {(transactions ?? []).map(tx => (
                    <Link
                      key={tx.id}
                      href={`/admin/transactions/${tx.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{tx.hoxa_transaction_id ?? tx.id.slice(0, 8)}</p>
                          {tx.manual_refund_sent_at && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">Refunded</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {tx.send_amount?.toLocaleString()} {tx.send_currency} → {tx.receive_amount?.toFixed(2)} {tx.receive_currency}
                          <span className="mx-1.5">·</span>
                          {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                        {tx.dispute_reason && (
                          <p className="text-[10px] text-red-500 mt-0.5 truncate">{tx.dispute_reason}</p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${pillFor(tx.status)}`}>
                        {labelFor(tx.status)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function InfoTile({ icon: Icon, label, value, verified }: { icon: any; label: string; value: string; verified?: boolean }) {
  return (
    <div className="bg-[#F7F9F8] rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-gray-400" />
        <p className="text-gray-400 text-[10px] font-medium">{label}</p>
        {verified && <CheckCircle2 size={10} className="text-green-500" />}
      </div>
      <p className="text-gray-900 text-sm font-medium truncate">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400 text-xs">{label}</span>
      <span className="text-gray-900 text-xs font-medium">{value}</span>
    </div>
  )
}
