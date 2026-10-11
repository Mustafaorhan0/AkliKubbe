const CACHE = 'aklikubbe-shell-v1';
const FILES = ['./', './index.html', './src/app.js', './src/style.css', './src/data.js', './src/content.js', './src/storage.js', './public/icon.svg', './public/icon-192.png', './public/icon-512.png', './manifest.webmanifest'];
const ALLOWED = new Set(FILES.map(file => new URL(file, self.registration.scope).href));
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))); });
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('aklikubbe-shell-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  // Yalnızca uygulama kabuğu: dış görseller ve API yanıtları Cache Storage'a yazılmaz.
  if (event.request.method !== 'GET' || !ALLOWED.has(event.request.url)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(() => caches.match(event.request)));
});
