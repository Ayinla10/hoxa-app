'use server'

import { createServiceClient, getAuthUser } from '@/lib/supabase/server'
import { sendPushToUser } from './push'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  url?: string
) {
  const supabase = createServiceClient()

  // Insert into DB (triggers Supabase Realtime for in-app toast)
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })

  // Send Web Push (for when app is in background or closed)
  await sendPushToUser(userId, { title, message, type, url })
}

export async function markNotificationRead(id: string) {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update notification' }
  return { success: true }
}

export async function markAllRead() {
  const { user } = await getAuthUser()
  if (!user) return { error: 'Unauthorized' }

  const service = createServiceClient()
  const { error } = await service
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)

  if (error) return { error: 'Failed to update notifications' }
  return { success: true }
}
