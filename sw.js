self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }

  const title = data.title || 'Auralex'
  const options = {
    body: data.body || '',
    icon: `${self.registration.scope}auralex-mark.svg`,
    badge: `${self.registration.scope}auralex-mark.svg`,
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetPath = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetPath) && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(targetPath)
    })
  )
})
