/* Service worker: lets the site open without internet and be installed as an app.
   It always tries the network first, so your updates on GitHub show up right away;
   the saved copy is used only when offline. */
const CACHE = 'tripplanner-v2';
const FILES = [
  './', './index.html', './style.css', './manifest.webmanifest', './icons/icon-192.png',
  './js/config.js', './js/i18n.js', './js/core.js', './js/sync.js', './js/places.js', './js/extras.js',
  './js/plan.js', './js/invite.js', './js/vote.js', './js/itinerary.js', './js/app.js',
];
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => {})))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // maps, Firebase etc. go straight to the internet
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('./index.html')))
  );
});
