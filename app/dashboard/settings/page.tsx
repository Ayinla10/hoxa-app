import { getAuthUser, getProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const [{ user }, profile] = await Promise.all([
    getAuthUser(),
    getProfile(),
  ])
  if (!user) redirect('/login')

  const prefs = (profile as any)?.notification_preferences ?? { push: true, email: true }

  return (
    <SettingsClient
      email={user.email ?? ''}
      notifPrefs={{ push: prefs.push ?? true, email: prefs.email ?? true }}
    />
  )
}
