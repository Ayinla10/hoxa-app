import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SellerProfileClient from './SellerProfileClient'

export default async function SellerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: seller } = await supabase.from('sellers').select('completion_rate, timeout_count, rejection_count').eq('user_id', user.id).single()
  const score = seller
    ? Math.min(100, Math.round((seller.completion_rate * 0.6) + (Math.max(0, 100 - (seller.timeout_count * 5)) * 0.2) + (Math.max(0, 100 - (seller.rejection_count * 3)) * 0.2)))
    : 0

  return (
    <SellerProfileClient
      email={user.email ?? ''}
      fullName={profile?.full_name ?? ''}
      phone={profile?.phone ?? ''}
      country={profile?.country ?? ''}
      score={score}
    />
  )
}
