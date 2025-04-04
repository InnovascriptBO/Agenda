const CACHE_NAME = "app-v1";
const ASSETS = [
  '/',
  '/formulario_agenda.html',
  '/manifest.json',
  '/sw.js',
  // Añade todos los recursos locales y externos
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS));
});

self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
