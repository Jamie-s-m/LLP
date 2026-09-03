import { useEffect, useState } from 'react'
import api from '../services/api'

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationOptIn() {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

  // Previously always started from enabled=false, so the button reverted to "Enable" on every
  // remount (any navigation, or a parent re-render) even when the browser already had a real,
  // active push subscription - it never checked. This is the actual source of truth: whether
  // the service worker currently holds a subscription, not any local/component state.
  //
  // Uses getRegistration() (resolves immediately with whatever's registered, or undefined),
  // not .ready (waits indefinitely for an ACTIVE worker) - confirmed live that .ready never
  // resolves at all in a plain `vite dev` session (no SW registers there), which would have
  // left this stuck on "Checking..." forever in that environment. A timeout is kept as a
  // second backstop in case a real registration exists but stalls before activating.
  useEffect(() => {
    let cancelled = false
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setChecking(false)
      return
    }
    const timeout = setTimeout(() => {
      if (!cancelled) setChecking(false)
    }, 4000)
    navigator.serviceWorker.getRegistration()
      .then((reg) => reg?.pushManager.getSubscription() ?? null)
      .then((sub) => {
        if (!cancelled) setEnabled(!!sub)
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(timeout)
        if (!cancelled) setChecking(false)
      })
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  const subscribe = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      await api.post('/push/subscribe', sub)
      setEnabled(true)
    } catch (err: any) {
      console.error(err)
      alert('Failed to subscribe to push notifications')
    } finally { setLoading(false) }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setEnabled(false)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h4 className="text-sm font-semibold">Push Notifications</h4>
        <p className="text-xs text-muted">Get reminders and important updates</p>
      </div>
      <div>
        {enabled ? (
          <button className="btn btn-ghost" onClick={unsubscribe} disabled={loading || checking}>Disable</button>
        ) : (
          <button className="btn btn-primary" onClick={subscribe} disabled={loading || checking}>
            {checking ? 'Checking...' : loading ? 'Processing...' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  )
}
