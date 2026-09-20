/* ============================================================
   咩&砚 · sw.js
   Service Worker · 缓存与推送
   ============================================================ */


self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {
    try { d = { body: e.data.text() }; } catch (e2) {}
  }
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const here = list.filter(c => c.visibilityState === 'visible');
    if (here.length) {
      here.forEach(c => { try { c.postMessage({ type: 'kai-new' }); } catch (e) {} });
      return;
    }
    await self.registration.showNotification(d.title || '咩&砚', {
      body: d.body || d.text || '有新消息',
      tag: d.kind || 'kai',
      renotify: true,
      icon: 'IMG_6461.jpeg',
      badge: 'IMG_6461.jpeg',
      data: d
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if ('focus' in c) { await c.focus(); c.postMessage({ type: 'open-chat' }); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow('./?chat=1');
  })());
});

const MJC = 'mj-v2';
const IMG = /\.(jpe?g|png|svg|webp)$/i;

self.addEventListener('fetch', e => {
  const req = e.request;

  // 图片：有缓存直接给，没有再去拿，拿到就存
  if (IMG.test(req.url)){
    e.respondWith((async () => {
      const c = await caches.open(MJC);
      const hit = await c.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const r = await fetch(req);
        if (r && r.ok) c.put(req, r.clone());
        return r;
      } catch (err){ return Response.error(); }
    })());
    return;
  }

  if (req.mode !== 'navigate') return;
  e.respondWith((async () => {
    const c = await caches.open(MJC);
    const hit = await c.match(req);
    try {
      const r = await fetch(req);
      if (r && r.ok) c.put(req, r.clone());
      return r;
    } catch (err){ return hit || Response.error(); }
  })());
});


