const CACHE_NAME = 'workout-v2'
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
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

// ── Rest timer notification scheduler ──
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_TIMER_NOTIFICATION') {
    if (self._timerTimeout) clearTimeout(self._timerTimeout);
    const delay = event.data.endTime - Date.now();
    if (delay > 0) {
      self._timerTimeout = setTimeout(() => {
        self.registration.showNotification('Repos terminé !', {
          body: "C'est reparti 💪",
          icon: '/icons/icon-192.svg',
          tag: 'rest-timer',
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 200],
        });
      }, delay);
    }
  }
  if (event.data?.type === 'CANCEL_TIMER_NOTIFICATION') {
    if (self._timerTimeout) clearTimeout(self._timerTimeout);
    // Close any existing rest-timer notification
    self.registration.getNotifications({ tag: 'rest-timer' }).then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});

// Focus app on notification tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

// Network-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request)
      })
  )
})
