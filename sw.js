self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('mi-cache-v1').then(function(cache) {
      return cache.addAll([
        '/', // Asegúrate de tener la ruta raíz del sitio
        '/formulario_agenda.html' // O el archivo principal de tu app, si aplica
        // Agrega otros archivos estáticos que quieras cachear
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
