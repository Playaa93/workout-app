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
const TIMER_TAG = 'rest-timer';
const TIMER_ICON = '/icons/icon-192.svg';
let timerGeneration = 0;

function formatDuration(ms) {
  const totalSec = Math.ceil(ms / 1000);
  if (totalSec >= 60) {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')} de repos`;
  }
  return `${totalSec}s de repos`;
}

function clearTimer() {
  if (self._timer) {
    clearInterval(self._timer.interval);
    if (self._timer.resolve) self._timer.resolve();
    self._timer = null;
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_TIMER_NOTIFICATION') {
    clearTimer();
    const endTime = event.data.endTime;
    if (endTime - Date.now() <= 0) return;

    const gen = ++timerGeneration;
    self.registration.showNotification('Repos en cours', {
      body: formatDuration(endTime - Date.now()),
      icon: TIMER_ICON,
      tag: TIMER_TAG,
      silent: true,
      requireInteraction: false,
    });
    event.waitUntil(new Promise((resolve) => {
      const tick = () => {
        if (gen !== timerGeneration) return;
        const remaining = endTime - Date.now();
        if (remaining <= 0) {
          clearInterval(self._timer?.interval);
          self._timer = null;
          self.registration.showNotification('Repos terminé !', {
            body: "C'est reparti 💪",
            icon: TIMER_ICON,
            tag: TIMER_TAG,
            renotify: true,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
          });
          resolve();
        }
      };
      self._timer = { interval: setInterval(tick, 1000), resolve };
    }));
  }
  if (event.data?.type === 'CANCEL_TIMER_NOTIFICATION') {
    timerGeneration++;
    clearTimer();
    self.registration.getNotifications({ tag: TIMER_TAG }).then((n) => n.forEach((x) => x.close()));
  }
});

// Focus app on notification tap
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.visibilityState === 'visible') return client.focus();
      }
      if (clients.length > 0) return clients[0].navigate('/').then((c) => c?.focus());
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
