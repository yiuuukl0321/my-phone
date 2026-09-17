self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {
    try { d = { body: e.data.text() }; } catch (e2) {}
  }
  e.waitUntil((async () => {
    // 人还在「咩&砚」画面里 → 不弹通知，只叫页面自己去取新消息
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const here = list.filter(c => c.visibilityState === 'visible');
    if (here.length) {
      here.forEach(c => { try { c.postMessage({ type: 'kai-new' }); } catch (e) {} });
      return;
    }
    // 人离开画面了 → 正常弹通知
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

const MJC = 'mj-v1';
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith((async () => {
    const c = await caches.open(MJC);
    const hit = await c.match(e.request);
    try {
      const r = await fetch(e.request);
      if (r && r.ok) c.put(e.request, r.clone());
      return r;
    } catch (err) {
      return hit || Response.error();
    }
  })());
});
