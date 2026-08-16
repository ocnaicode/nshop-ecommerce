'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';

// Registers the service worker and stores the push subscription for the
// logged-in user. Silently no-ops when push is disabled or unsupported.
export default function PushNotificationRegister() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (process.env.NEXT_PUBLIC_ENABLE_PUSH !== 'true') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    if (!('PushManager' in window)) return;

    let cancelled = false;

    async function register() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        if (cancelled) return;

        // Ask for permission only after a successful registration.
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const existing = await reg.pushManager.getSubscription();
        const subscription =
          existing ||
          (await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
            ) as unknown as BufferSource,
          }));

        if (!cancelled && subscription) {
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          });
        }
      } catch (error) {
        // Push is best-effort; never block the app on failures.
        console.debug('Push notification registration skipped:', error);
      }
    }

    register();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
