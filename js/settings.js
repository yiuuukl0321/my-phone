/* ============================================================
   咩&砚 · js/settings.js
   设置页 · 保存 · 推送 · 记忆 · 外观 · 中继 · AI
   ============================================================ */


(function(){
  'use strict';

  /* ---------------- 小工具 ---------------- */
  var $ = function(id){ return document.getElementById(id); };
  var V = function(id){ var e = $(id); return e ? String(e.value || '').trim() : ''; };

  function card(eyebrow, inner){
    return '<div class="card">' +
      (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') + inner + '</div>';
  }
  function item(label, right, fn){
    return '<div class="item"' + (fn ? ' onclick="' + fn + '"' : '') + '>' +
           '<span>' + label + '</span><em>' + (right || '') + '</em></div>';
  }
  function field(label, html){
    return '<div class="field"><span>' + label + '</span>' + html + '</div>';
  }
  function box(id, value, ph, type){
    return '<input id="' + id + '"' + (type ? ' type="' + type + '"' : '') +
           ' value="' + esc(value || '') + '" placeholder="' + (ph || '') + '">';
  }

  /* ---------------- 页面 ---------------- */
  function vSet(){
    var mem = (typeof MEM !== 'undefined' && MEM && MEM.length) ? MEM : [];

    var push =
      '<div class="sub" style="margin:0 0 6px">开了之后，就算你没停在咩&砚这个画面，' +
        '他的回复也会弹到手机上。iPhone 要先「添加到主屏幕」，' +
        '再从主屏幕那个图标打开才给推送。</div>' +
      item('推送状态', '<em id="pushState">未开启</em>') +
      item('开启推送', '›', 'enablePush()') +
      item('发送测试通知', '›', 'testPush()') +
      item('关闭推送', '›', 'disablePush()') +
      '<div class="st" id="pushMsg"></div>';

    var memory =
      '<div class="sub" style="margin:0 0 6px">它自己判断哪句值得记。值得记的，回完会自动写进来；' +
        '一次性的闲聊不会。这里也能自己加、自己删。</div>' +
      item('自动记忆', '<em>' + (S.autoMem ? 'ON' : 'OFF') + '</em>', 'toggleAuto()') +
      '<textarea id="mNew" placeholder="手动加一条，例：她怕打雷"></textarea>' +
      item('加一条', '›', 'addMem()') +
      '<div class="memlist">' +
        (mem.length
          ? mem.slice().reverse().map(function(m){
              return '<div class="memrow"><span>' + esc(m) + '</span>' +
                     '<b onclick="delMemText(this)">×</b></div>';
            }).join('')
          : '<div class="empty">还没记住什么。</div>') +
      '</div>' +
      (mem.length ? item('<span style="color:#ff3b30">全部清掉</span>', '›', 'clearMem()') : '');

    var look =
      field('壁纸', box('sWall', S.wall, WALL_DEFAULT)) +
      field('暗度', '<input id="sDim" type="number" step="0.05" min="0" max="0.6" value="' +
        (+S.dim || 0) + '">') +
      field('桌面图标', box('sIcon', S.icon, ICON_DEFAULT));

    var relay =
      field('中继地址', box('sRelay', S.relay)) +
      field('中继密钥', box('sKey', S.key, '', 'password')) +
      field('收件箱', box('sInbox', S.inbox));

    var ai =
      field('接口地址', box('sApiUrl', S.apiUrl, 'https://api.deepseek.com/v1')) +
      field('API Key', box('sApiKey', S.apiKey, '', 'password')) +
      field('模型名', box('sModel', S.model, 'deepseek-flash')) +
      field('类型', box('sType', S.apiType, 'openai'));

    var phone =
      field('名字', box('sName', S.name)) +
      field('纪念日', box('sAnniv', S.anniv, '', 'date'));

    var actions =
      item('保存设置', '›', 'saveSet()') +
      item('测试中继', '›', 'testRelay()') +
      item('还原桌面顺序', '›', 'resetLayout()') +
      item('清空聊天记录', '›', 'clearChat()') +
      '<div class="st" id="stTest"></div>';

    return card('PUSH', push) + card('MEMORY', memory) + card('LOOK', look) +
           card('RELAY', relay) + card('AI', ai) + card('PHONE', phone) +
           card('', actions);
  }

  /* ---------------- 保存 / 中继 / 清空 ---------------- */
  function saveSet(){
    S.name    = V('sName') || '小咩';
    S.anniv   = V('sAnniv') || S.anniv;
    S.relay   = V('sRelay') || S.relay;
    S.key     = V('sKey');
    S.inbox   = V('sInbox') || 'xiaomie';
    S.apiUrl  = V('sApiUrl');
    S.apiKey  = V('sApiKey');
    S.model   = V('sModel');
    S.apiType = V('sType') || 'openai';
    S.wall    = V('sWall');
    S.icon    = V('sIcon');
    S.dim     = V('sDim');
    save();
    tick(); applyWall(); applyTouchIcon(); closeOv();
  }

  function clearChat(){
    if (!confirm('清空本地聊天记录吗？')) return;
    CHAT = [];
    saveChat();
    var st = $('stTest'); if (st) st.textContent = '已清空。';
    if ($('msgs')) renderChat(true);
  }

  async function testRelay(){
    var out = $('stTest');
    S.relay = V('sRelay') || S.relay;
    S.key   = V('sKey');
    S.inbox = V('sInbox') || 'xiaomie';
    save();
    if (out) out.textContent = '测试中…';
    try {
      var r = await fetch(base() + '/health');
      if (out) out.textContent = '中继 ' + r.status + '：' + (await r.text());
    } catch(e){
      if (out) out.textContent = '连不上：' + e.message;
    }
  }

  /* ---------------- 推送 ---------------- */
  function urlB64ToUint8Array(b64){
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var s = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(s);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }
  function pushSupported(){
    return ('serviceWorker' in navigator) && ('PushManager' in window);
  }

  async function refreshPushState(){
    var el = $('pushState'); if (!el) return;
    try {
      if (!('serviceWorker' in navigator)){ el.textContent = '不支持'; return; }
      var reg = await navigator.serviceWorker.getRegistration();
      var sub = reg && await reg.pushManager.getSubscription();
      el.textContent = sub ? '已开启' : '未开启';
    } catch(e){ el.textContent = '未开启'; }
  }

  async function enablePush(){
    var out = $('pushMsg');
    if (out) out.textContent = '';
    try {
      if (!pushSupported()){
        if (out) out.textContent = '这个浏览器不支持推送。\niPhone 要先「添加到主屏幕」，' +
          '再从主屏幕那个图标打开，才给推送。';
        return;
      }
      if (!S.key){ if (out) out.textContent = '先去下面把中继密钥填好。'; return; }
      if (!('Notification' in window)){ if (out) out.textContent = '没有 Notification 接口。'; return; }
      var perm = await Notification.requestPermission();
      if (perm !== 'granted'){
        if (out) out.textContent = '权限没给。去 iPhone「设置 → 通知 → 咩&砚」里打开通知。';
        return;
      }
      if (out) out.textContent = '注册中…';
      var reg = await navigator.serviceWorker.register('sw.js');
      await navigator.serviceWorker.ready;
      var kr = await api('/api/push/vapid-key');
      var pub = typeof kr === 'string' ? kr
        : (kr && (kr.publicKey || kr.key || kr.vapidPublicKey || kr.pub));
      if (!pub || typeof pub !== 'string'){
        if (out) out.textContent = '中继没给 VAPID 公钥：' + JSON.stringify(kr).slice(0, 160);
        return;
      }
      var sub = await reg.pushManager.getSubscription();
      if (!sub){
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(pub)
        });
      }
      var json = sub.toJSON();
      await api('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboxId: S.inbox, channel: 'web', sub: json,
          subscription: { channel: 'web', sub: json }
        })
      });
      S.pushOn = 1; save();
      if (out) out.textContent = '推送开好了。';
      refreshPushState();
    } catch(e){
      if (out) out.textContent = '失败：' + e.message;
    }
  }

  async function disablePush(){
    var out = $('pushMsg');
    try {
      var reg = await navigator.serviceWorker.getRegistration();
      var sub = reg && await reg.pushManager.getSubscription();
      if (sub){
        await api('/api/push/unsubscribe', {
          method: 'DELETE', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inboxId: S.inbox, endpoint: sub.endpoint })
        }).catch(function(){});
        await sub.unsubscribe();
      }
      S.pushOn = 0; save();
      if (out) out.textContent = '推送关掉了。';
      refreshPushState();
    } catch(e){ if (out) out.textContent = '失败：' + e.message; }
  }

  async function testPush(){
    var out = $('pushMsg');
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted'){
        if (out) out.textContent = '先点「开启推送」把权限拿到。';
        return;
      }
      var reg = await navigator.serviceWorker.ready;
      await reg.showNotification('祁砚', { body: '测试一下，看得到吗。', tag: 'test' });
      if (out) out.textContent = '发出去了，看到通知了吗？';
    } catch(e){ if (out) out.textContent = '失败：' + e.message; }
  }

  /* ---------------- 记忆 ---------------- */
  function toggleAuto(){ S.autoMem = S.autoMem ? 0 : 1; save(); openApp('set'); }

  function addMem(){
    var t = $('mNew') ? $('mNew').value.trim() : '';
    if (!t) return;
    if (!addMemAuto(t)) return;
    openApp('set');
  }
  function delMemText(el){
    var t = el.previousElementSibling.textContent;
    var i = MEM.indexOf(t);
    if (i > -1){ MEM.splice(i, 1); saveMem(); }
    openApp('set');
  }
  function clearMem(){
    if (!confirm('把记住的事全部清掉？')) return;
    MEM = [];
    saveMem();
    openApp('set');
  }

  /* ---------------- 挂上去（覆盖 index.html 里的旧版） ---------------- */
  window.vSet = vSet;
  window.saveSet = saveSet;
  window.clearChat = clearChat;
  window.testRelay = testRelay;
  window.refreshPushState = refreshPushState;
  window.enablePush = enablePush;
  window.disablePush = disablePush;
  window.testPush = testPush;
  window.toggleAuto = toggleAuto;
  window.addMem = addMem;
  window.delMemText = delMemText;
  window.clearMem = clearMem;
  try { if (typeof APPS !== 'undefined' && APPS.set) APPS.set.v = vSet; } catch(e){}
})();
