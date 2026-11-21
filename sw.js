/* FAKATE · service worker
   - La app (index.html) se pide SIEMPRE primero a internet: así cada versión nueva llega sola.
     Si no hay señal, abre la última copia guardada.
   - Íconos, manifiesto y Tailwind se guardan para abrir rápido.
   - Los pedidos a Apps Script (datos) NUNCA se guardan: siempre van al servidor. */
const VERSION = 'fakate-v10-2026-11-21';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                          // datos (POST a Apps Script): directo a internet
  if (url.hostname.endsWith('google.com') || url.hostname.endsWith('googleusercontent.com')) return;
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {   // la app: primero internet
    e.respondWith(fetch(req, { cache: 'no-cache' })
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                              // resto: copia guardada y se renueva atrás
    const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
