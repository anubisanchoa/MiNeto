const CACHE = "knrad-v24";
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-k192.png', './icon-k512.png', './seed.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// red primero, caché como respaldo: así al actualizar el HTML lo coges enseguida,
// y sin cobertura sigue abriendo
// SOLO la propia app. Las consultas a Polymarket y a la cadena no se tocan:
// guardar copia de ellas hacía que, sin conexión, se sirviera un dato viejo
// como si fuera nuevo.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match('./index.html')))
  );
});
