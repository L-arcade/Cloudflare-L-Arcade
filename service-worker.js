const CACHE_NAME = 'l-arcade-v491-game-fixes';

const LANGUAGE_AUDIO = []; // v482: Sprach-Audio entfernt (Spiele-App)
const ASSETS = ['./', './index.html', './manifest.json', './datenschutz.html', './icon-192.png', './icon-512.png', './icon-maskable-192.png', './icon-maskable-512.png', './gurpreet-signature-engraved.png', './i18n-auto-en.js', './flagship3d.js', './benny-adventure.js', './adventure/adv-benny.jpg', './adventure/adv-owl.jpg',  './adventure/benny-arm.png', './adventure/benny-foot.png', './adventure/benny-front.png', './adventure/benny-head.png', './adventure/benny-l1.jpg', './adventure/benny-l2.jpg', './adventure/benny-l3.jpg', './adventure/benny-l4.jpg', './adventure/benny-l5.jpg', './adventure/benny-more.jpg', './adventure/benny-side.png', './adventure/benny-tail.png', './adventure/benny-torso.png', './adventure/log.png', './adventure/owl-fly1.png', './adventure/owl-fly2.png', './adventure/owl-fly3.png', './adventure/owl-fly4.png', './adventure/owl-l1.jpg', './adventure/owl-l2.jpg', './adventure/owl-l3.jpg', './adventure/owl-l4.jpg', './adventure/owl-l5.jpg', './adventure/owl-more.jpg',  './adventure/rocks.png', './adventure/sticks.png', './ren3d/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => { await cache.addAll(ASSETS); await Promise.allSettled(LANGUAGE_AUDIO.map((url) => cache.add(url))); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Netzwerk zuerst (immer die neueste Version, wenn online),
// Cache nur als Rückfalloption ohne Internet.
// WICHTIG: Nur GET-Anfragen auf die eigene Domain werden abgefangen/gecacht.
// POST-Anfragen und alle Aufrufe an fremde
// Domains (den Cloudflare-Worker-Server) laufen direkt am Service Worker
// vorbei -- vorher wurden sie hier mit abgefangen, und die Cache API kann
// POST-Anfragen gar nicht speichern (wirft intern einen Fehler). Das war die
// wahrscheinliche Ursache fuer das gemeldete dauerhafte Haengenbleiben bei
// "Ueberlegt...", weil manche Browser/WebViews den Abbruch (Timeout) durch
// so eine Service-Worker-Zwischenschicht nicht zuverlaessig durchreichen.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const isSameOrigin = new URL(req.url).origin === self.location.origin;
  // Videos are streamed in pieces (Range requests) — let the browser load them directly, never through the cache.
  if (req.method !== 'GET' || !isSameOrigin || /\.mp4(\?|$)/i.test(req.url) || req.headers.has('range')) {
    return; // kein respondWith() -> der Browser behandelt die Anfrage ganz normal, ohne den Service Worker
  }
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response.ok && response.status === 200) { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {}); }
        return response;
      })
      .catch(() => caches.match(req))
  );
});

// v483 games-only: Push/notification handlers removed.
