const CACHE = 'blattwerk-v1';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/Didact Gothic Regular 7mod.ttf',
  './fonts/Grundschrift-Regular.otf',
  './fonts/Grundschrift-Bold.otf',
  './widgets/heading.js',
  './widgets/subheading.js',
  './widgets/instruction.js',
  './widgets/namedate.js',
  './widgets/divider.js',
  './widgets/linebox.js',
  './widgets/checkbox.js',
  './widgets/image.js',
  './widgets/table.js',
  './widgets/gap_text.js',
  './widgets/wordsearch.js',
  './widgets/scramble.js',
  './widgets/matching.js',
  './widgets/numbering.js',
  './widgets/arithmetic.js',
  './widgets/numberline.js',
  './widgets/geometry.js',
  './widgets/zahlenmauer.js',
  './widgets/zahlenhaus.js',
  './widgets/uhr.js',
  './widgets/kaestchen.js',
  './widgets/schriftlich_addition.js',
  './widgets/schriftlich_subtraktion.js',
  './widgets/schriftlich_multiplikation.js',
  './widgets/bildwort.js',
  './widgets/stop.js',
  './widgets/infobox.js',
  './widgets/text.js',
  './widgets/silbentext.js',
  './widgets/silbenwort.js',
  './widgets/crossword.js',
  './widgets/multiplechoice.js',
  './widgets/zahlenkette.js',
  './widgets/stellenwert.js',
  './widgets/geld.js',
  './widgets/zwanzigerfeld.js',
  './widgets/zwanzigerrahmen.js',
  './widgets/rechendreiecke.js',
];

// Installation: alle App-Dateien cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

// Aktivierung: alten Cache löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: Cache-first für App-Dateien, Network-first für CDN
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // CDN-Ressourcen (html2canvas, jsPDF, Fonts): erst Netzwerk, dann Cache
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Eigene Dateien: Cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
        return res;
      });
    })
  );
});
