import { redirect } from 'next/navigation'
import { getAuthUser, getProfile } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function BuyerProfilePage() {
  const [{ user }, profile] = await Promise.all([getAuthUser(), getProfile()])
  if (!user) redirect('/login')

  return (
    <ProfileClient
      email={user.email ?? ''}
      fullName={profile?.full_name ?? ''}
      phone={profile?.phone ?? ''}
      country={profile?.country ?? ''}
    />
  )
}
