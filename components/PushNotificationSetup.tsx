'use client'

import { useEffect, useRef } from 'react'
import { savePushSubscription, removePushSubscription } from '@/actions/push'

interface Props {
  userId: string
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

export default function PushNotificationSetup({ userId }: Props) {
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    async function setup() {
      try {
        // Register service worker
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await navigator.serviceWorker.ready

        // Check current permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Get or create push subscription
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey!),
          })
        }

        // Save to DB
        const json = sub.toJSON()
        if (json.endpoint && json.keys?.p256dh && json.keys?.auth) {
          await savePushSubscription(userId, {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          })
        }
      } catch {
        // Silent fail — push is an enhancement, not critical
      }
    }

    setup()
  }, [userId])

  return null
}
