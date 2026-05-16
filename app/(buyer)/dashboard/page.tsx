import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function BuyerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#0F6A3D] flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <span className="font-bold text-xl text-gray-900">HOXA</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {profile?.full_name} 👋</h1>
        <p className="text-gray-500 mb-8">Buyer Dashboard — Marketplace coming soon.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['Browse Marketplace', 'My Transactions', 'Profile'].map(item => (
            <div key={item} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <p className="font-semibold text-gray-700">{item}</p>
              <p className="text-gray-400 text-sm mt-1">Coming soon</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
