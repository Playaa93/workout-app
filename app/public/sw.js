const CACHE_NAME = 'graal-v3'
const OFFLINE_URL = '/offline.html'
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  OFFLINE_URL,
]

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// The page owns foreground feedback. While hidden it may delegate one
// best-effort alarm per tab. Mobile browsers can suspend even a waiting worker.
const restTimers = new Map();
const MAX_ALERT_DELAY_MS = 30_000;

async function closeRestNotifications(tag, alarmId) {
  const notifications = await self.registration.getNotifications({ tag });
  for (const notification of notifications) {
    if (!alarmId || notification.data?.alarmId === alarmId) notification.close();
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'REST_TIMER_DEADLINE' || event.source?.type !== 'window') return;
  const clientId = event.source.id;
  const tag = `rest-timer-${clientId}`;
  restTimers.get(clientId)?.cancel();
  restTimers.delete(clientId);
  const { endTime, sessionId } = event.data;
  const delay = endTime - Date.now();
  if (!Number.isFinite(delay) || delay <= 0) {
    event.waitUntil(closeRestNotifications(tag).catch(() => {}));
    return;
  }

  const alarmId = crypto.randomUUID();
  let cancel;
  const wait = new Promise(resolve => {
    const timeout = setTimeout(resolve, delay);
    cancel = () => { clearTimeout(timeout); resolve(); };
  });
  const alarm = { cancel };
  restTimers.set(clientId, alarm);
  event.waitUntil((async () => {
    try {
      await wait;
      if (restTimers.get(clientId) !== alarm) return;
      const client = await self.clients.get(clientId);
      if (client?.visibilityState !== 'hidden' || restTimers.get(clientId) !== alarm) return;
      // After a long suspension the page will show completion on return.
      if (Date.now() - endTime > MAX_ALERT_DELAY_MS) return;
      await self.registration.showNotification('Repos terminé', {
        body: 'Tu peux commencer ta prochaine série.',
        icon: '/icons/icon-192.svg',
        tag,
        silent: true,
        data: { alarmId, clientId, sessionId },
      });
      if (restTimers.get(clientId) !== alarm) await closeRestNotifications(tag, alarmId);
    } catch {
      // The tab may be gone or permission revoked while the timer was waiting.
    } finally {
      if (restTimers.get(clientId) === alarm) restTimers.delete(clientId);
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  const { sessionId, clientId } = event.notification.data || {};
  const path = sessionId ? '/workout/active?' + new URLSearchParams({ id: sessionId }) : '/workout';
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const url = new URL(path, self.location.origin).href;
    const owner = windows.find(client => client.id === clientId);
    if (owner) return owner.focus();
    const match = windows.find(client => client.url === url);
    return match ? match.focus() : self.clients.openWindow(url);
  })());
});

// Network-first strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Navigation requests → serve offline page on failure
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    )
    return
  }

  // Sub-resources → network-first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
