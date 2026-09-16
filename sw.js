self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {
    try { d = { body: e.data.text() }; } catch (e2) {}
  }
  e.waitUntil(self.registration.showNotification(d.title || '咩&砚', {
    body: d.body || d.text || '有新消息',
    tag: d.kind || 'kai',
    renotify: true,
    icon: 'IMG_6461.jpeg',
    badge: 'IMG_6461.jpeg',
    data: d
  }));
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
