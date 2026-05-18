'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info'
) {
  const supabase = createServiceClient()
  await supabase.from('notifications').insert({ user_id: userId, title, message, type })
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
