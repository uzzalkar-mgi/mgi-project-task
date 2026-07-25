// Minimal service worker — network-first for navigations, cache-first for built assets.
const CACHE = 'mgi-pts-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    // Only handle same-origin.
    if (url.origin !== self.location.origin) return;

    // Cache-first for hashed build assets.
    if (url.pathname.startsWith('/build/') || url.pathname.startsWith('/icons/')) {
        e.respondWith(
            caches.open(CACHE).then((c) =>
                c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))
            )
        );
        return;
    }

    // Network-first for everything else (falls back to cache offline).
    e.respondWith(
        fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
        }).catch(() => caches.match(req))
    );
});
