'use server'

import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/server'

// Lazy init — only configure when actually sending, not at module load.
// This prevents build-time crashes when env vars aren't set yet.
function initVapid() {
  const mailto = process.env.VAPID_MAILTO
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (mailto && publicKey && privateKey) {
    webpush.setVapidDetails(mailto, publicKey, privateKey)
    return true
  }
  return false
}

/** Save a browser push subscription for a user */
export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const supabase = createServiceClient()
  await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'user_id,endpoint' }
    )
}

/** Remove a push subscription (user denied or browser unsubscribed) */
export async function removePushSubscription(userId: string, endpoint: string) {
  const supabase = createServiceClient()
  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
}

/** Send a push notification to all devices registered for a user */
export async function sendPushToUser(
  userId: string,
  payload: {
    title: string
    message: string
    type?: 'info' | 'success' | 'warning' | 'error'
    url?: string
    tag?: string
  }
) {
  const supabase = createServiceClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) return
  if (!initVapid()) return   // VAPID not configured — skip silently

  const body = JSON.stringify(payload)

  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body
      ).catch(async (err: any) => {
        // 410 Gone = subscription expired/revoked — clean it up
        if (err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      })
    )
  )
}
