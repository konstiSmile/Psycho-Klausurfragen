const CACHE = 'psyklausur-v7';
const FILES = ['./', 'index.html', 'app.css?v=7', 'theme.js?v=7', 'app.js?v=7', 'data.js?v=7', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('psyklausur-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: false }).then(hit => hit || fetch(e.request).catch(() => caches.match('index.html'))));
});
