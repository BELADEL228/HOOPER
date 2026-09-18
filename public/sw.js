/**
 * Service Worker FIRE STONE Basketball Club
 * Cache offline résilient, gestion des scores en direct et notifications push.
 */

const CACHE_VERSION = 'firestone-pwa-v1';
const API_CACHE_VERSION = 'firestone-api-v1';
const ASSETS_CACHE_VERSION = 'firestone-assets-v1';

// Ressources critiques de l'App Shell mises en cache dès l'installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/icons/icon-maskable.svg',
];

// Endpoints API éligibles à la lecture hors-ligne (Stale-While-Revalidate)
const OFFLINE_API_ENDPOINTS = [
  '/api/teams',
  '/api/tournaments',
  '/api/matches',
  '/api/health',
];

// ─── 1. INSTALLATION ──────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      console.log('⚡ [Service Worker] Pré-mise en cache de l’App Shell FIRE STONE');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── 2. ACTIVATION & NETTOYAGE ────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_VERSION, API_CACHE_VERSION, ASSETS_CACHE_VERSION];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🧹 [Service Worker] Suppression de l’ancien cache :', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ─── 3. STRATÉGIES DE REQUÊTES (FETCH) ─────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non GET (POST, PATCH, DELETE doivent être exécutées en direct)
  if (request.method !== 'GET') {
    return;
  }

  // A. Navigation HTML (Page principale SPA) : Network-First avec fallback vers /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        const cachedResponse = await cache.match('/index.html');
        return cachedResponse || new Response('FIRE STONE hors ligne. Vérifiez votre connexion internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
    );
    return;
  }

  // B. Endpoints API consultables hors-ligne : Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    const isCacheableApi = OFFLINE_API_ENDPOINTS.some((ep) => url.pathname.startsWith(ep));

    if (isCacheableApi) {
      event.respondWith(
        caches.open(API_CACHE_VERSION).then(async (apiCache) => {
          const cachedResponse = await apiCache.match(request);

          // Lancer le fetch réseau en arrière-plan pour rafraîchir le cache
          const networkFetch = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                apiCache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          // Si on a du cache, le retourner immédiatement (instantané), sinon attendre le réseau
          return cachedResponse || networkFetch;
        })
      );
      return;
    }

    // Autres APIs non mises en cache (ex. auth, admin en direct)
    return;
  }

  // C. Images & Polices externes (Dicebear, Unsplash, Google Fonts) : Cache-First avec TTL
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|woff2|woff|ttf)$/) ||
    url.hostname.includes('dicebear.com') ||
    url.hostname.includes('images.unsplash.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.open(ASSETS_CACHE_VERSION).then(async (assetsCache) => {
        const cachedAsset = await assetsCache.match(request);
        if (cachedAsset) {
          return cachedAsset;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            void assetsCache.put(request, copy);
          }
          return networkResponse;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // D. Fichiers JS, CSS et bundles Vite : Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ─── 4. NOTIFICATIONS PUSH (Live Scores & Buzzer Beaters) ──────────────────────
self.addEventListener('push', (event) => {
  let data = {
    title: '🔥 FIRE STONE Basketball',
    body: 'Nouveau fait de match ou notification de club !',
    url: '/',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Voir le match' },
      { action: 'close', title: 'Fermer' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── 5. BACKGROUND SYNC (Envoi des actions différées) ─────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-actions') {
    console.log('🔄 [Service Worker] Exécution de la synchronisation en arrière-plan');
  }
});
