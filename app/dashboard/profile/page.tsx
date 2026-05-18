import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function BuyerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <ProfileClient
      email={user.email ?? ''}
      fullName={profile?.full_name ?? ''}
      phone={profile?.phone ?? ''}
      country={profile?.country ?? ''}
    />
  )
}
