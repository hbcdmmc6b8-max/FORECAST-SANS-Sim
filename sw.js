const CACHE = "forecast-sans-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./css/game.css",
  "./js/phases.js",
  "./js/weapons.js",
  "./js/eyes.js",
  "./js/techniques.js",
  "./js/dialogue.js",
  "./js/battle.js",
  "./js/game.js",
  "./js/offline.js",
  "./forecast-spritesheet.png",
  "./manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        const copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(event.request, copy);
        });
        return response;
      });
    })
  );
});