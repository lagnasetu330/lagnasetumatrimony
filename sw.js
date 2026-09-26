/* ============================================================
   LAGNA SETU SERVICE WORKER (PWA)
   Strategy: Network-First with Fallback Cache (Ensures instant updates)
   ============================================================ */

const CACHE_NAME = 'lagna-setu-v1.2';

// Core assets to pre-cache on install
const PRECACHE_ASSETS = [
    './',
    './index.html',
    './app.html',
    './manifest.json',
    './images/lagna_setu_logo.png',
    './images/lagna_setu-welcome_banner.png',
    './images/icon-192.png',
    './images/icon-512.png',
    './css/tokens.css',
    './css/base.css',
    './css/components.css',
    './css/screens.css?v=3.3',
    './css/fonts.css',
    './css/fontawesome.css'
];

// Install Event: Cache critical shell and activate immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS).catch((err) => {
                console.warn('[SW] Precache non-critical issue:', err);
            });
        })
    );
});

// Activate Event: Clear older caches and claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Network-First Strategy
// This guarantees that any update you deploy is immediately seen when user reloads!
self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Only handle GET requests
    if (req.method !== 'GET') return;

    let url;
    try {
        url = new URL(req.url);
    } catch (_) {
        return;
    }

    // CRITICAL FIX: Only handle http: and https: requests.
    // Explicitly bypass chrome-extension://, moz-extension://, chrome://, data:, blob:, ws:, wss:
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return;
    }

    // Bypass dynamic APIs & external services (Supabase, EmailJS, Cloudinary, Razorpay, CDN scripts)
    if (
        url.hostname.includes('supabase.co') ||
        url.hostname.includes('emailjs.com') ||
        url.hostname.includes('cloudinary.com') ||
        url.hostname.includes('razorpay.com') ||
        url.hostname.includes('unsplash.com') ||
        url.pathname.includes('/rest/v1/') ||
        url.pathname.includes('/auth/v1/')
    ) {
        return;
    }

    // Network-First: Try fresh response from server first
    event.respondWith(
        fetch(req)
            .then((networkResponse) => {
                // If valid response, update cache in background
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(req, responseToCache).catch(() => {});
                        })
                        .catch(() => {});
                }
                return networkResponse;
            })
            .catch(() => {
                // Offline fallback from cache
                return caches.match(req).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;
                    if (req.mode === 'navigate') {
                        return caches.match('./app.html');
                    }
                }).catch(() => {});
            })
    );
});

// Allow app to trigger skipWaiting
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
