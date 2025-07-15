// Service Worker for Patel Chat
const CACHE_NAME = 'patel-chat-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/App.css',
  '/manifest.json'
];

// CDN resources to cache
const CDN_CACHE_URLS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js',
  'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static files cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache CDN resources and static assets
            if (shouldCache(event.request.url)) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  console.log('Service Worker: Caching new resource', event.request.url);
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch((error) => {
            console.error('Service Worker: Fetch failed', error);
            
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Helper function to determine if a URL should be cached
function shouldCache(url) {
  // Cache CDN resources
  if (CDN_CACHE_URLS.some(cdnUrl => url.includes(cdnUrl))) {
    return true;
  }
  
  // Cache Google Fonts
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    return true;
  }
  
  // Cache Monaco Editor resources
  if (url.includes('monaco-editor') && url.includes('cdn.jsdelivr.net')) {
    return true;
  }
  
  // Cache Mermaid resources
  if (url.includes('mermaid') && url.includes('cdn.jsdelivr.net')) {
    return true;
  }
  
  // Cache static assets from same origin
  if (url.startsWith(self.location.origin)) {
    return true;
  }
  
  return false;
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatData());
  }
});

// Sync chat data when back online
async function syncChatData() {
  try {
    console.log('Service Worker: Syncing chat data...');
    // This would sync any pending chat data when back online
    // For now, just log that sync would happen
    console.log('Service Worker: Chat data sync completed');
  } catch (error) {
    console.error('Service Worker: Chat data sync failed', error);
  }
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Chat',
        icon: '/vite.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/vite.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Patel Chat', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('Service Worker: Loaded');

