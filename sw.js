const CACHE = "forecast-sans-v3";
const ASSETS = [
  "./index.html","./css/game.css","./js/phases.js","./js/weapons.js","./js/eyes.js",
  "./js/techniques.js","./js/dialogue.js","./js/battle.js","./js/game.js","./js/offline.js",
  "./forecast-spritesheet.png","./manifest.webmanifest"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith("forecast-sans-") && key !== CACHE).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put("./index.html", copy));
        return response;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});