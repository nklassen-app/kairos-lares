const CACHE = 'lares-v2';   // bump on EVERY content change, and the .ver marker in index.html with it
const ASSETS = ['.', 'index.html', 'manifest.webmanifest', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Navigations are network-first: a deploy shows up on the next online
// launch, no service-worker re-check needed (the Capacitor WebView proved
// unreliable at those, see kairos-floor). The cache is the offline fallback
// so the page still opens without signal. Static assets stay cache-first.
// cache:'no-cache': GitHub Pages sends max-age=600, and a plain fetch()
// answers from the HTTP cache inside those 10 minutes — a deploy would not
// show on the next open (found on the Whiteboard, 2026-10-03). 'no-cache'
// always asks the server first (a 304 when nothing changed).
self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() =>
        caches.match(e.request).then(hit => hit || caches.match('index.html'))
      )
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
