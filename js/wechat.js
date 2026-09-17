/* ===== 1. 聊天 + 面板：图片 / 拍摄 / 收藏 / 位置（照片真送进模型） ===== */
(function(){
  if (S.vision === undefined){ S.vision = 1; try { save(); } catch(e){} }

  var S1 = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  var IC = {
    pic:'<svg width="23" height="23" viewBox="0 0 24 24" '+S1+'><rect x="3.2" y="4.8" width="17.6" height="14.4" rx="3"/><circle cx="8.7" cy="9.7" r="1.5"/><path d="M3.6 16.6l4.6-4.2 3.3 3 3.1-2.8 5.8 5.2"/></svg>',
    cam:'<svg width="23" height="23" viewBox="0 0 24 24" '+S1+'><path d="M3.4 8.8a2.6 2.6 0 0 1 2.6-2.6h1.4l1.3-2h6.6l1.3 2H18a2.6 2.6 0 0 1 2.6 2.6v7.8a2.6 2.6 0 0 1-2.6 2.6H6a2.6 2.6 0 0 1-2.6-2.6z"/><circle cx="12" cy="12.7" r="3.5"/></svg>',
    fav:'<svg width="23" height="23" viewBox="0 0 24 24" '+S1+'><path d="M6.6 3.9h10.8a1.5 1.5 0 0 1 1.5 1.5v14.7L12 16.3l-6.9 3.8V5.4a1.5 1.5 0 0 1 1.5-1.5z"/></svg>',
    loc:'<svg width="23" height="23" viewBox="0 0 24 24" '+S1+'><path d="M12 21.3s6.5-6 6.5-10.7A6.5 6.5 0 0 0 5.5 10.6c0 4.7 6.5 10.7 6.5 10.7z"/><circle cx="12" cy="10.4" r="2.4"/></svg>'
  };

  var st = document.createElement('style');
  st.textContent =
    '.xmPanel{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:14px 0;'+
      'padding:0 8px;background:#f2f2f0;border-top:1px solid var(--line);'+
      'max-height:0;overflow:hidden;opacity:0;transition:max-height .22s ease,opacity .16s,padding .22s}'+
    '.xmPanel.on{max-height:200px;opacity:1;padding:16px 8px 12px}'+
    '.xmItem{display:flex;flex-direction:column;align-items:center;gap:7px;font-size:11px;'+
      'color:#5d5d59;-webkit-tap-highlight-color:transparent}'+
    '.xmItem .box{width:54px;height:54px;border-radius:16px;background:#fff;display:flex;'+
      'align-items:center;justify-content:center;color:#3a3a37;box-shadow:0 1px 4px rgba(0,0,0,.05);'+
      'transition:transform .12s}'+
    '.xmItem:active .box{transform:scale(.93)}'+
    '.xmBar{position:fixed;left:50%;bottom:130px;transform:translateX(-50%);z-index:95;'+
      'background:rgba(0,0,0,.82);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:14px;'+
      'max-width:82vw;text-align:center;display:none}'+
    'img.xmPic{display:block;max-width:190px;max-height:250px;border-radius:13px;cursor:zoom-in}';
  document.head.appendChild(st);

  var tEl = null, tTimer = 0;
  function toast(t){
    if (!tEl){ tEl = document.createElement('div'); tEl.className = 'xmBar'; document.body.appendChild(tEl); }
    tEl.textContent = t; tEl.style.display = 'block';
    clearTimeout(tTimer);
    tTimer = setTimeout(function(){ tEl.style.display = 'none'; }, 2400);
  }
  function closePanel(){ var p = document.querySelector('.xmPanel'); if (p) p.classList.remove('on'); }

  /* ---- 附件库：IndexedDB，不占 localStorage ---- */
  var DB = null, IMGC = {};
  function idb(){
    return new Promise(function(res, rej){
      if (DB) return res(DB);
      var r = indexedDB.open('xmimg', 1);
      r.onupgradeneeded = function(){ r.result.createObjectStore('img'); };
      r.onsuccess = function(){ DB = r.result; res(DB); };
      r.onerror = function(){ rej(r.error); };
    });
  }
  function idbPut(k, v){
    return idb().then(function(d){ return new Promise(function(res){
      var t = d.transaction('img', 'readwrite');
      t.objectStore('img').put(v, k);
      t.oncomplete = res; t.onerror = res;
    }); }).catch(function(){});
  }
  function idbGet(k){
    return idb().then(function(d){ return new Promise(function(res){
      var q = d.transaction('img', 'readonly').objectStore('img').get(k);
      q.onsuccess = function(){ res(q.result || null); };
      q.onerror = function(){ res(null); };
    }); }).catch(function(){ return null; });
  }

  /* ---- 选图 / 拍照 ---- */
  var fPic = document.createElement('input');
  fPic.type = 'file'; fPic.accept = 'image/*'; fPic.multiple = true; fPic.style.display = 'none';
  var fCam = document.createElement('input');
  fCam.type = 'file'; fCam.accept = 'image/*'; fCam.capture = 'environment'; fCam.style.display = 'none';
  document.body.appendChild(fPic); document.body.appendChild(fCam);

  function shrink(file, cb){
    var fr = new FileReader();
    fr.onload = function(){
      var im = new Image();
      im.onload = function(){
        function mk(mx, q){
          var s = Math.min(1, mx / im.naturalWidth, mx / im.naturalHeight);
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(im.naturalWidth * s));
          c.height = Math.max(1, Math.round(im.naturalHeight * s));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          return c.toDataURL('image/jpeg', q);
        }
        cb({ full: mk(1600, .85), thumb: mk(260, .55) });
      };
      im.onerror = function(){ cb(null); };
      im.src = fr.result;
    };
    fr.onerror = function(){ cb(null); };
    fr.readAsDataURL(file);
  }

  function handleFiles(files){
    var list = Array.prototype.slice.call(files || []).slice(0, 4);
    if (!list.length) return;
    var done = 0;
    list.forEach(function(f){
      shrink(f, function(o){
        if (o){
          var id = 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          IMGC[id] = o.full;
          idbPut(id, o.full);
          CHAT.push({ role:'user', imgId:id, thumb:o.thumb, text:'', t:Date.now() });
        }
        if (++done === list.length) finish();
      });
    });
    function finish(){
      saveChat();
      if (document.getElementById('msgs')) renderChat(true);
      closePanel();
      var inp = document.getElementById('mIn');
      if (!inp) return;
      if (!inp.value.trim()) inp.value = '（我发了张照片）';
      try { sendChat(); } catch(e){}
    }
  }
  fPic.onchange = function(){ handleFiles(fPic.files); fPic.value = ''; };
  fCam.onchange = function(){ handleFiles(fCam.files); fCam.value = ''; };

  /* ---- 全屏看 ---- */
  function view(m){
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:120;background:rgba(0,0,0,.94);'+
      'display:flex;align-items:center;justify-content:center';
    var im = document.createElement('img');
    im.src = IMGC[m.imgId] || m.thumb;
    im.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain';
    d.appendChild(im);
    d.onclick = function(){ d.remove(); };
    document.body.appendChild(d);
    if (m.imgId && !IMGC[m.imgId]){
      idbGet(m.imgId).then(function(v){ if (v){ IMGC[m.imgId] = v; im.src = v; } });
    }
  }

  /* ---- 收藏 ---- */
  function favs(){ try { return JSON.parse(localStorage.getItem('xm_favs') || '[]'); } catch(e){ return []; } }
  function saveFavs(a){ try { localStorage.setItem('xm_favs', JSON.stringify(a)); } catch(e){} }
  function favSheet(){
    var old = document.getElementById('xmFav'); if (old) old.remove();
    var list = favs();
    var d = document.createElement('div');
    d.id = 'xmFav';
    d.style.cssText = 'position:fixed;inset:0;z-index:85;background:rgba(0,0,0,.3);display:flex;align-items:flex-end';
    d.innerHTML = '<div style="width:100%;max-height:68vh;overflow-y:auto;background:#f4f4f2;'+
      'border-radius:20px 20px 0 0;padding:18px 16px calc(env(safe-area-inset-bottom) + 18px)">'+
      '<div style="font-size:15px;font-weight:600;margin-bottom:6px">收藏</div>'+
      (list.length ? list.map(function(t, i){
        return '<div class="item"><span>' + esc(t) + '</span><em><b class="x" data-d="' + i + '">×</b></em></div>';
      }).join('') : '<div class="empty">还没有收藏。在输入框里写好，点「收藏」就存下来了。</div>')+
      '</div>';
    d.onclick = function(e){
      if (e.target === d){ d.remove(); return; }
      var del = e.target.closest('[data-d]');
      if (del){ var a = favs(); a.splice(+del.dataset.d, 1); saveFavs(a); favSheet(); return; }
      var row = e.target.closest('.item');
      if (row){
        var t = (row.querySelector('span') || {}).textContent || '';
        var inp = document.getElementById('mIn');
        if (inp){ inp.value = inp.value.trim() ? inp.value.trim() + ' ' + t : t; inp.focus(); }
        d.remove();
      }
    };
    document.body.appendChild(d);
  }
  function doFav(){
    var inp = document.getElementById('mIn');
    var t = inp ? inp.value.trim() : '';
    if (t){
      var a = favs();
      if (a.indexOf(t) < 0) a.unshift(t);
      saveFavs(a.slice(0, 50));
      inp.value = ''; toast('已收藏');
    } else favSheet();
    closePanel();
  }

  /* ---- 位置 ---- */
  function doLoc(){
    if (!navigator.geolocation){ toast('这台设备不给定位'); return; }
    toast('定位中…');
    navigator.geolocation.getCurrentPosition(function(p){
      var la = p.coords.latitude, lo = p.coords.longitude;
      var send = function(name){
        var t = '我在' + (name ? name : '这里') + '（' + la.toFixed(4) + ', ' + lo.toFixed(4) + '）';
        var inp = document.getElementById('mIn');
        if (inp){ inp.value = t; try { sendChat(); } catch(e){} }
        closePanel();
      };
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&accept-language=zh-CN&lat='
        + la + '&lon=' + lo)
        .then(function(r){ return r.json(); })
        .then(function(j){
          var a = (j && j.address) || {};
          var n = a.road || a.suburb || a.neighbourhood || a.village || a.town || a.city_district || '';
          send(n ? n + '附近' : '');
        })
        .catch(function(){ send(''); });
    }, function(){
      toast('拿不到位置。去 iPhone 设置 → 隐私与安全性 → 定位服务 里给 Safari 打开。');
    }, { timeout: 9000, enableHighAccuracy: true });
  }

  /* ---- 挂到输入栏 ---- */
  function build(){
    var bar = document.querySelector('.inputbar');
    if (!bar) return;
    var plus = bar.querySelector('.ibPlus');
    if (!plus || bar.dataset.xm2 === '1') return;
    bar.dataset.xm2 = '1';
    var panel = document.createElement('div');
    panel.className = 'xmPanel';
    panel.innerHTML = [['pic','图片'], ['cam','拍摄'], ['fav','收藏'], ['loc','位置']]
      .map(function(x){
        return '<div class="xmItem" data-a="' + x[0] + '"><span class="box">' + IC[x[0]] + '</span>' + x[1] + '</div>';
      }).join('');
    bar.parentNode.insertBefore(panel, bar);
    panel.onclick = function(e){
      var it = e.target.closest('[data-a]');
      if (!it) return;
      var a = it.dataset.a;
      if (a === 'pic') fPic.click();
      else if (a === 'cam') fCam.click();
      else if (a === 'fav') doFav();
      else if (a === 'loc') doLoc();
    };
    plus.onclick = function(e){ e.preventDefault(); e.stopPropagation(); panel.classList.toggle('on'); };
    var inp = bar.querySelector('#mIn');
    if (inp) inp.addEventListener('focus', closePanel);
  }
  build();
  setInterval(build, 900);

  /* ---- 渲染缩略图 ---- */
  var _rc = window.renderChat;
  if (typeof _rc === 'function' && !_rc.__pic){
    var fr = function(){
      var r = _rc.apply(this, arguments);
      try {
        var box = document.getElementById('msgs');
        if (box) CHAT.forEach(function(m, i){
          if (!m || !m.thumb) return;
          var el = box.querySelector('[data-i="' + i + '"]');
          if (!el || el.querySelector('img.xmPic')) return;
          var im = document.createElement('img');
          im.className = 'xmPic';
          im.src = m.thumb;
          im.onclick = function(ev){ ev.stopPropagation(); view(m); };
          el.insertBefore(im, el.firstChild);
          if (el.classList.contains('bub')) el.style.padding = '7px';
        });
      } catch(e){}
      return r;
    };
    fr.__pic = true;
    window.renderChat = fr;
  }

  /* ---- 启动时把最近的图预读进内存 ---- */
  function preload(){
    var ids = [];
    for (var i = CHAT.length - 1; i >= 0 && ids.length < 6; i--){
      var m = CHAT[i];
      if (m && m.imgId && !IMGC[m.imgId] && ids.indexOf(m.imgId) < 0) ids.push(m.imgId);
    }
    ids.forEach(function(k){ idbGet(k).then(function(v){ if (v) IMGC[k] = v; }); });
  }
  setTimeout(preload, 1200);
  setInterval(preload, 60000);

  /* ---- 带图的消息改成 OpenAI content 数组 ---- */
  var _bm = window.buildMessages;
  if (typeof _bm === 'function' && !_bm.__vis){
    var fb = function(){
      var m = _bm.apply(this, arguments);
      try {
        if (!Array.isArray(m)) return m;
        var src = CHAT.filter(function(x){ return !x.typing; }).slice(-12);
        for (var i = 0; i < src.length; i++){
          var c = src[i], t = m[i + 1];
          if (!c || !t || t.role !== 'user') continue;
          var txt = String(t.content || '').trim();
          if (!txt || txt === '（图片）') txt = '（我发了张照片）';
          var url = c.imgId ? (IMGC[c.imgId] || c.thumb) : (c.img || null);
          t.content = (url && +S.vision)
            ? [{ type:'text', text: txt }, { type:'image_url', image_url:{ url: url } }]
            : txt;
        }
      } catch(e){}
      return m;
    };
    fb.__vis = true;
    window.buildMessages = fb;
  }

  /* ---- 发带图的请求时，临时换成视觉模型 ---- */
  var _api = window.api;
  if (typeof _api === 'function' && !_api.__vis){
    var fa = function(path, opts){
      try {
        if (String(path).indexOf('/generate') > -1 && opts && opts.body){
          var b = JSON.parse(opts.body);
          var has = JSON.stringify(b.messages || []).indexOf('image_url') > -1;
          if (has){
            window.__lastGen = { settings: JSON.parse(JSON.stringify(b.settings || {})), meta: b.meta, messages: b.messages };
            if (S.visModel && b.settings){
              b.settings.mainApiUrl = S.visUrl || S.apiUrl;
              b.settings.mainApiKey = S.visKey || S.apiKey;
              b.settings.mainApiModel = S.visModel;
              b.settings.apiType = 'openai';
            }
          } else window.__lastGen = null;
          return _api.call(this, path, Object.assign({}, opts, { body: JSON.stringify(b) }));
        }
      } catch(e){}
      return _api.apply(this, arguments);
    };
    fa.__vis = true;
    window.api = fa;
  }

  /* ---- 模型看不了图时，自动退回纯文字再发一次 ---- */
  async function degrade(){
    var g = window.__lastGen; window.__lastGen = null;
    if (!g) return;
    var last = CHAT[CHAT.length - 1];
    if (!last || last.role !== 'assistant' || last.typing) return;
    if (!/出错了|error|invalid|image|400/i.test(String(last.text || ''))) return;
    var msgs = (g.messages || []).map(function(x){
      if (x && Array.isArray(x.content)){
        var t = x.content.filter(function(c){ return c.type === 'text'; })
                        .map(function(c){ return c.text; }).join(' ').trim();
        return { role: x.role, content: t || '（我发了张照片）' };
      }
      return x;
    });
    var rid = 'rv' + Date.now() + Math.random().toString(36).slice(2, 7);
    SENDING = true;
    try {
      await api('/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: rid, inboxId: S.inbox, messages: msgs,
                               settings: g.settings, meta: g.meta })
      });
      var hit = null;
      for (var i = 0; i < 20; i++){
        await sleep(i ? 2000 : 500);
        try {
          var j = await api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
          var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
          if (f){
            await api('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
            hit = f; break;
          }
        } catch(e){}
      }
      if (hit && hit.content && CHAT[CHAT.length - 1] === last){
        var r = parseReply(hit.content);
        last.text = r.text || last.text;
        last.think = r.think || last.think;
        if (S.autoMem) r.mems.forEach(function(m){ addMemAuto(m); });
      }
    } catch(e){
    } finally {
      SENDING = false; saveChat();
      if (document.getElementById('msgs')) renderChat(true);
    }
  }
  var _send = window.sendChat;
  if (typeof _send === 'function' && !_send.__vis){
    var fs = async function(){
      var r = await _send.apply(this, arguments);
      try { await degrade(); } catch(e){}
      return r;
    };
    fs.__vis = true;
    window.sendChat = fs;
  }

  /* ---- 聊天详情里的视觉设置 ---- */
  var _oci = window.openChatInfo;
  if (typeof _oci === 'function' && !_oci.__vis){
    var fo = function(){
      _oci.apply(this, arguments);
      try {
        var b = document.getElementById('shbody'); if (!b) return;
        var old = document.getElementById('xmVisCard'); if (old) old.remove();
        var d = document.createElement('div');
        d.id = 'xmVisCard';
        d.className = 'card';
        d.innerHTML =
          '<div class="eyebrow">视觉</div>'+
          '<div class="item"><span>让祁砚看到照片</span><em>'+
            '<span class="sw ' + (+S.vision ? 'on' : '') + '" id="xmVisSw"><i></i></span></em></div>'+
          '<div class="field"><span>视觉模型</span>'+
            '<input id="xmVisModel" value="' + String(S.visModel || '') + '" placeholder="留空就用主模型"></div>'+
          '<div class="field"><span>地址</span>'+
            '<input id="xmVisUrl" value="' + String(S.visUrl || '') + '" placeholder="留空就同上"></div>'+
          '<div class="field"><span>密钥</span>'+
            '<input id="xmVisKey" type="password" value="' + String(S.visKey || '') + '" placeholder="留空就同上"></div>'+
          '<div class="sub" style="margin:12px 0 0">主模型（DeepSeek 官方）看不见图，'+
          '这里单独填一个支持看图的模型，只在发照片那一条用它。'+
          '填错或失败会自动退回纯文字重发，不会卡住。</div>';
        b.insertBefore(d, b.firstChild);
        d.querySelector('#xmVisSw').onclick = function(){
          S.vision = +S.vision ? 0 : 1; save();
          this.classList.toggle('on', !!+S.vision);
        };
        var bind = function(id, key){
          d.querySelector('#' + id).oninput = function(){ S[key] = this.value.trim(); save(); };
        };
        bind('xmVisModel', 'visModel');
        bind('xmVisUrl', 'visUrl');
        bind('xmVisKey', 'visKey');
      } catch(e){}
    };
    fo.__vis = true;
    window.openChatInfo = fo;
  }
})();


/* ===== 2. 输入栏微调：加号贴右、发送改上箭头、placeholder 锁住 ===== */
(function(){
  var UP = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M12 19.4V5.4"/><path d="M6.1 11.3 12 5.4l5.9 5.9"/></svg>';

  var st = document.createElement('style');
  st.textContent =
    '.inputbar .ibField{padding-right:7px!important}'+
    '.inputbar .ibField .ibPlus{padding:2px!important;margin-left:2px}';
  document.head.appendChild(st);

  function fix(){
    var bar = document.querySelector('.inputbar');
    if (!bar) return;

    var send = bar.querySelector('button.send');
    if (send && send.dataset.up !== '1'){
      send.dataset.up = '1';
      send.innerHTML = UP;
    }

    var inp = bar.querySelector('#mIn');
    if (inp && inp.placeholder !== '愛してる') inp.placeholder = '愛してる';
  }
  fix();
  setInterval(fix, 700);
})();


/* ===== 3. 朋友圈升级：接着你的动态发 + 上网找图 + 自动发 ===== */
(function(){
  if (S.momOn === undefined){
    S.momOn = 1; S.momGap = 8; S.momLast = 0; try { save(); } catch(e){}
  }

  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function getMom(){ return ls('xm_moments', []); }
  function setMom(a){ ss('xm_moments', a.slice(-60)); }
  function hhmm(){
    var d = new Date();
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
           (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  }
  function partOfDay(){
    var h = new Date().getHours();
    if (h < 5) return '凌晨';
    if (h < 11) return '早上';
    if (h < 14) return '中午';
    if (h < 18) return '下午';
    if (h < 22) return '晚上';
    return '深夜';
  }
  function ago(t){
    var s = (Date.now() - t) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return Math.floor(s / 86400) + '天前';
  }

  var tEl = null, tT = 0;
  function toast(t){
    if (!tEl){ tEl = document.createElement('div'); tEl.className = 'xmBar'; document.body.appendChild(tEl); }
    tEl.textContent = t; tEl.style.display = 'block';
    clearTimeout(tT);
    tT = setTimeout(function(){ tEl.style.display = 'none'; }, 2400);
  }

  async function rawApi(path, opts){
    var r = await fetch((S.relay || '').replace(/\/+$/, '') + path, Object.assign({}, opts || {}, {
      headers: Object.assign({ 'Authorization': 'Bearer ' + S.key }, (opts && opts.headers) || {})
    }));
    var t = await r.text();
    try { return JSON.parse(t); } catch(e){ return t; }
  }

  /* ---- 上下文：人设 + 记忆 + 最近聊天 + 她最近两条朋友圈 ---- */
  async function askCtx(user, temp){
    var sys = PERSONA;
    if (typeof MEM !== 'undefined' && MEM.length){
      sys += '\n\n【你记得关于她的事】\n' + MEM.slice(-40).map(function(x){ return '· ' + x; }).join('\n');
    }
    var msgs = [{ role: 'system', content: sys }];
    if (typeof CHAT !== 'undefined' && CHAT.length){
      CHAT.filter(function(m){ return !m.typing && m.text; }).slice(-16).forEach(function(m){
        msgs.push({ role: m.role === 'user' ? 'user' : 'assistant',
                    content: String(m.text).slice(0, 300) });
      });
    }
    msgs.push({ role: 'user', content: user });

    var rid = 'mom' + Date.now() + Math.random().toString(36).slice(2, 6);
    await rawApi('/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: rid, inboxId: S.inbox, messages: msgs,
        settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model,
                    apiType: S.apiType || 'openai', temperature: temp || 0.95 },
        meta: { charName: '祁砚', charId: 'kai' }
      })
    });
    for (var i = 0; i < 22; i++){
      await sleep(i ? 2000 : 600);
      try {
        var j = await rawApi('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
        if (f){
          await rawApi('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
          return String(f.content || '');
        }
      } catch(e){}
    }
    return '';
  }

  /* ---- 上网找图 ---- */
  async function searchPic(q){
    var kw = String(q || '').replace(/[\[\]]/g, ' ').trim().slice(0, 40);
    if (!kw) return '';
    var api = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*' +
      '&generator=search&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url&iiurlwidth=1000' +
      '&gsrsearch=' + encodeURIComponent('filetype:bitmap ' + kw);
    try {
      var r = await fetch(api);
      var j = await r.json();
      var pages = (j && j.query && j.query.pages) || {};
      var list = Object.keys(pages).map(function(k){ return pages[k]; })
        .filter(function(p){
          return p.imageinfo && p.imageinfo[0] && /\.(jpe?g|png)$/i.test(p.imageinfo[0].url || '');
        });
      if (!list.length) return '';
      var p = list[Math.floor(Math.random() * Math.min(list.length, 6))];
      var url = p.imageinfo[0].thumburl || p.imageinfo[0].url;
      try {
        var im = new Image();
        im.crossOrigin = 'anonymous';
        await new Promise(function(res, rej){
          im.onload = res; im.onerror = rej;
          setTimeout(rej, 8000);
          im.src = url;
        });
        var s = Math.min(1, 1000 / im.naturalWidth);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.naturalWidth * s));
        c.height = Math.max(1, Math.round(im.naturalHeight * s));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', .72);
      } catch(e){
        return url;
      }
    } catch(e){ return ''; }
  }

  function makePic(){
    var c = document.createElement('canvas');
    c.width = 900; c.height = 700;
    var g = c.getContext('2d');
    var h = Math.floor(20 + Math.random() * 60);
    var gr = g.createLinearGradient(0, 0, 900, 700);
    gr.addColorStop(0, 'hsl(' + h + ',30%,90%)');
    gr.addColorStop(1, 'hsl(' + ((h + 40) % 360) + ',26%,70%)');
    g.fillStyle = gr; g.fillRect(0, 0, 900, 700);
    for (var i = 0; i < 8; i++){
      g.beginPath();
      g.strokeStyle = 'rgba(255,255,255,' + (0.1 + Math.random() * 0.32) + ')';
      g.lineWidth = 1 + Math.random() * 3;
      g.moveTo(Math.random() * 900, Math.random() * 700);
      g.bezierCurveTo(Math.random()*900, Math.random()*700, Math.random()*900, Math.random()*700,
                      Math.random()*900, Math.random()*700);
      g.stroke();
    }
    return c.toDataURL('image/jpeg', .68);
  }

  /* ---- 重绘朋友圈（正停在那页才动） ---- */
  function refreshWx(){
    var box = document.getElementById('wx');
    if (!box || !box.classList.contains('on')) return;
    var back = box.querySelector('#wxBack');
    if (!back) return;
    back.click();
    var row = box.querySelector('[data-go="moments"]');
    if (row) row.click();
  }

  function popWx(title, body){
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 10px);'+
      'z-index:130;background:rgba(255,255,255,.92);backdrop-filter:blur(24px) saturate(180%);'+
      '-webkit-backdrop-filter:blur(24px) saturate(180%);border-radius:18px;padding:13px 16px;'+
      'box-shadow:0 8px 30px rgba(0,0,0,.16);transition:transform .3s,opacity .3s;'+
      'transform:translateY(-140%);opacity:0';
    d.innerHTML = '<div style="font-size:12px;color:#8f8f8b;margin-bottom:3px">' + esc(title) + '</div>' +
      '<div style="font-size:14.5px;line-height:1.5">' + esc(body) + '</div>';
    document.body.appendChild(d);
    requestAnimationFrame(function(){ d.style.transform = 'translateY(0)'; d.style.opacity = '1'; });
    var kill = function(){
      d.style.transform = 'translateY(-140%)'; d.style.opacity = '0';
      setTimeout(function(){ d.remove(); }, 320);
    };
    d.onclick = function(){
      kill();
      try { if (typeof window.openWx === 'function') window.openWx(); } catch(e){}
      var box = document.getElementById('wx');
      if (box){
        var row = box.querySelector('[data-go="moments"]');
        if (row) row.click();
      }
    };
    setTimeout(kill, 6500);
    try {
      if ('Notification' in window && Notification.permission === 'granted'){
        navigator.serviceWorker.ready.then(function(r){
          r.showNotification(title, { body: body, tag: 'kai-mom' });
        }).catch(function(){});
      }
    } catch(e){}
  }

  /* ---- 他发一条 ---- */
  var posting = false;
  async function post(silent){
    if (posting) return;
    if (!S.key){ if (!silent) toast('先去设置填中继密钥'); return; }
    posting = true;
    if (!silent) toast('他在写…');
    try {
      var mine = getMom().filter(function(m){ return m.who === 'me'; }).slice(-2);
      var ctxLine = mine.length
        ? '小咩最近发的朋友圈：\n' + mine.map(function(m, i){
            return (i + 1) + '. 「' + String(m.text || '（图片）').slice(0, 60) + '」（' + ago(m.t) + '）';
          }).join('\n') + '\n你可以接着她这条说，也可以完全写你自己的事。'
        : '小咩还没发过朋友圈。';

      var raw = await askCtx('现在是 ' + hhmm() + '，' + partOfDay() + '。\n' + ctxLine + '\n\n' +
        '发一条朋友圈。第一行只写正文，30 字内，写你此刻真的在想的事。不要引号，不要解释。\n' +
        '第二行写 [[图]] 加一个具体的搜索词，你一般都应该配一张图。' +
        '词越具体越好，中英文都行，例如 [[图]]香港夜景、[[图]]coffee on desk。\n' +
        '确实不想配图就不写第二行。');

      if (!raw){ if (!silent) toast('没写出来，再试一次'); return; }
      var lines = String(raw).split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
      var txt = '', kw = '', pic = '';
      lines.forEach(function(l){
        var mm = l.match(/^\[\[\s*图\s*\]\]\s*(.*)$/);
        if (mm){ kw = mm[1].trim(); return; }
        if (!txt) txt = l.replace(/^\[\[\s*文\s*\]\]/, '').trim();
      });
      if (kw){ pic = await searchPic(kw); if (!pic) pic = makePic(); }

      var all = getMom();
      all.push({ who: 'kai', text: txt, img: pic, t: Date.now(), likes: [], cms: [] });
      setMom(all);
      S.momLast = Date.now();
      try { save(); } catch(e){}
      refreshWx();
      if (!silent) toast('他发了朋友圈');
      else popWx('祁砚发了朋友圈', txt);
    } finally {
      posting = false;
    }
  }
  window.kaiPostNow = function(){ post(false); };

  /* ---- 接管「让祁砚发一条」 ---- */
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('#wx [data-kai]') : null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    post(false);
  }, true);

  /* ---- 自动发 ---- */
  setInterval(function(){
    if (!+S.momOn) return;
    if (posting || SENDING) return;
    if (document.hidden) return;
    if (+S.asleep) return;
    var h = new Date().getHours();
    if (h < 8 || h > 22) return;
    var gap = Math.max(1, +S.momGap || 8) * 3600e3;
    var all = getMom();
    var last = all.length ? all[all.length - 1].t : 0;
    if (Date.now() - last < gap) return;
    if (Date.now() - (+S.momLast || 0) < gap) return;
    post(true);
  }, 60000);

  /* ---- 设置里的卡片 ---- */
  setInterval(function(){
    var b = document.getElementById('ovbody');
    if (!b || b.querySelector('#xmMomCard')) return;
    if (!/壁纸|暗度|中继/.test(b.textContent || '')) return;
    var d = document.createElement('div');
    d.id = 'xmMomCard';
    d.className = 'card';
    d.innerHTML =
      '<div class="eyebrow">朋友圈</div>' +
      '<div class="item"><span>他自己发朋友圈</span><em><span class="sw ' + (+S.momOn ? 'on' : '') +
        '" id="xmMomSw"><i></i></span></em></div>' +
      '<div class="item"><span>隔几小时发一条</span><em><input id="xmMomGap" value="' + (+S.momGap || 8) +
        '" style="width:44px;text-align:right;border:0;background:transparent;font-size:14px"></em></div>' +
      '<div class="item" id="xmMomNow"><span>让他现在发一条</span><em>点一下</em></div>' +
      '<div class="sub" style="margin:10px 0 0">打开后他会在 8 点到 22 点之间自己发，隔多久由上面那个数决定。' +
      '他会先看你最近两条朋友圈，再决定是接着你说还是写自己的事。' +
      '配图去 Wikimedia Commons 搜真实照片，搜不到才退回抽象图。</div>';
    b.insertBefore(d, b.firstChild);
    d.querySelector('#xmMomSw').onclick = function(){
      S.momOn = +S.momOn ? 0 : 1; save(); this.classList.toggle('on', !!+S.momOn);
    };
    d.querySelector('#xmMomGap').oninput = function(){
      S.momGap = Math.max(1, Math.min(72, parseInt(this.value, 10) || 8)); save();
    };
    d.querySelector('#xmMomNow').onclick = function(){
      if (typeof window.kaiPostNow === 'function') window.kaiPostNow();
    };
  }, 1200);
})();
/* ===== 4. 朋友圈：下拉刷新 + 他评论/点赞了发通知 ===== */
(function(){
  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ME(){ return S.name || '小咩'; }
  function others(a){ return (a || []).filter(function(x){ return x !== ME(); }); }

  function note(title, body){
    try {
      if ('Notification' in window && Notification.permission === 'granted'){
        navigator.serviceWorker.ready.then(function(r){
          r.showNotification(title, { body: body, tag: 'kai-mom' });
        }).catch(function(){});
      }
    } catch(e){}
  }

  var seen = {};
  function snap(){
    ls('xm_moments', []).forEach(function(m){
      seen[String(m.t)] = {
        c: (m.cms || []).filter(function(x){ return x.who !== ME(); }).length,
        l: others(m.likes).length
      };
    });
  }
  snap();

  setInterval(function(){
    ls('xm_moments', []).forEach(function(m){
      var k = String(m.t);
      var cs = (m.cms || []).filter(function(x){ return x.who !== ME(); });
      var cur = { c: cs.length, l: others(m.likes).length };
      var old = seen[k];
      seen[k] = cur;
      if (!old) return;
      if (cur.c > old.c){
        var last = cs[cs.length - 1];
        if (last) note('祁砚评论了你', last.text);
      } else if (cur.l > old.l){
        note('祁砚赞了你', String(m.text || '（图片）').slice(0, 30));
      }
    });
  }, 4000);

  /* ---------- 下拉刷新 ---------- */
  var ind = document.createElement('div');
  ind.style.cssText = 'position:absolute;left:0;right:0;top:0;height:56px;display:flex;'+
    'align-items:center;justify-content:center;color:#9a9a96;font-size:12px;'+
    'opacity:0;pointer-events:none;transition:opacity .15s';
  ind.textContent = '下拉刷新';

  var live = false, y0 = 0, dy = 0, busy = false, TH = 34;
  function body(){ return document.querySelector('#wx .wxBody'); }
  function onMoments(){ return !!document.querySelector('#wx #wxBack'); }

  document.addEventListener('touchstart', function(e){
    if (!onMoments() || busy) return;
    var b = body(); if (!b || b.scrollTop > 2) return;
    live = true; y0 = e.touches[0].clientY; dy = 0;
    b.style.transition = 'none';
    if (ind.parentNode !== b.parentNode) b.parentNode.insertBefore(ind, b);
  }, { passive: true });

  document.addEventListener('touchmove', function(e){
    if (!live) return;
    var b = body(); if (!b) return;
    var d = e.touches[0].clientY - y0;
    if (d <= 0){ dy = 0; b.style.transform = ''; ind.style.opacity = '0'; return; }
    e.preventDefault();
    dy = Math.min(90, d * 0.55);
    b.style.transform = 'translateY(' + dy + 'px)';
    ind.style.opacity = Math.min(1, dy / 40);
    ind.textContent = dy >= TH ? '松手刷新' : '下拉刷新';
  }, { passive: false });

  document.addEventListener('touchend', function(){
    if (!live) return;
    live = false;
    var b = body(); if (!b) return;
    b.style.transition = 'transform .2s ease-out';
    if (dy >= TH){
      busy = true;
      ind.textContent = '刷新中…';
      b.style.transform = 'translateY(56px)';
      setTimeout(function(){
        var back = document.querySelector('#wx #wxBack');
        if (back) back.click();
        var row = document.querySelector('#wx [data-go="moments"]');
        if (row) row.click();
        var nb = body();
        if (!nb || !nb.parentNode){ busy = false; return; }
        nb.parentNode.insertBefore(ind, nb);
        ind.textContent = '好了';
        ind.style.opacity = '1';
        nb.style.transition = 'none';
        nb.style.transform = 'translateY(56px)';
        nb.getBoundingClientRect();
        nb.style.transition = 'transform .24s ease-out';
        nb.style.transform = '';
        setTimeout(function(){
          ind.style.opacity = '0';
          nb.style.transition = '';
          busy = false;
        }, 560);
      }, 420);
    } else {
      b.style.transform = ''; ind.style.opacity = '0';
      setTimeout(function(){ b.style.transition = ''; }, 220);
    }
    dy = 0;
  }, { passive: true });
})();

/* ===== 5. 「我」页面改版 + 清空我的朋友圈（留备份 + 分析） ===== */
(function(){
  if (S.sign === undefined){ S.sign = ''; try { save(); } catch(e){} }

  var st = document.createElement('style');
  st.textContent =
    '#wx .meWrap{padding:30px 20px calc(env(safe-area-inset-bottom) + 30px);text-align:center}'+
    '#wx .meAva{width:98px;height:98px;border-radius:50%;margin:0 auto;'+
      'background:#e6e6e2 center/cover;border:1px solid rgba(0,0,0,.06);'+
      'box-shadow:0 3px 14px rgba(0,0,0,.08)}'+
    '#wx .meNameWrap{margin-top:18px}'+
    '#wx .meName{display:inline-block;min-width:70px;font-size:17px;font-weight:500;'+
      'letter-spacing:.03em;padding:0 12px 7px;border-bottom:1px solid rgba(0,0,0,.15);color:#0b0b0b}'+
    '#wx .meSign{margin-top:30px;font-size:19px;font-weight:200;line-height:1.65;'+
      'color:#5d5d59;padding:0 4px;min-height:32px;word-break:break-word}'+
    '#wx .meSign.ph{color:#c4c4c0}'+
    '#wx .meBtns{margin-top:46px;display:flex;flex-direction:column;gap:14px}'+
    '#wx .meBtn{padding:20px;border-radius:18px;background:#fff;'+
      'border:1px solid rgba(0,0,0,.09);font-size:16.5px;font-weight:300;'+
      'letter-spacing:.08em;color:#0b0b0b;box-shadow:0 1px 5px rgba(0,0,0,.03)}'+
    '#wx .meBtn:active{background:#f2f2f0;transform:scale(.985)}'+
    '#wx .meEdit{font:inherit;font-weight:inherit;letter-spacing:inherit;color:inherit;'+
      'text-align:center;border:0;background:transparent;outline:none;width:100%;'+
      'border-bottom:1px solid rgba(0,0,0,.3);padding:0 12px 7px}'+
    '#meSet{position:fixed;inset:0;z-index:19;background:#f4f4f2;display:none;flex-direction:column}'+
    '#meSet.on{display:flex}'+
    '#meSet .mtop{flex:0 0 auto;padding:calc(env(safe-area-inset-top) + 12px) 16px 12px;'+
      'display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--line)}'+
    '#meSet .mtop b{font-size:16px;font-weight:600}'+
    '#meSet .mback{width:34px;height:34px;display:grid;place-items:center;border-radius:50%}'+
    '#meSet .mback:active{background:rgba(0,0,0,.06)}'+
    '#meSet .mbody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;'+
      'padding:18px 16px calc(env(safe-area-inset-bottom) + 20px)}';
  document.head.appendChild(st);

  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function toast(t){
    var el = document.createElement('div');
    el.className = 'xmBar'; el.textContent = t; el.style.display = 'block';
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2200);
  }
  function ago(t){
    var s = (Date.now() - t) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return Math.floor(s / 86400) + '天前';
  }
  function partOfDay(){
    var h = new Date().getHours();
    if (h < 5) return '凌晨';
    if (h < 11) return '早上';
    if (h < 14) return '中午';
    if (h < 18) return '下午';
    if (h < 22) return '晚上';
    return '深夜';
  }

  /* ---- 自己问一次模型 ---- */
  async function rawApi(path, opts){
    var r = await fetch((S.relay || '').replace(/\/+$/, '') + path, Object.assign({}, opts || {}, {
      headers: Object.assign({ 'Authorization': 'Bearer ' + S.key }, (opts && opts.headers) || {})
    }));
    var t = await r.text();
    try { return JSON.parse(t); } catch(e){ return t; }
  }
  async function ask(user, temp){
    var sys = PERSONA;
    if (typeof MEM !== 'undefined' && MEM.length){
      sys += '\n\n【你记得关于她的事】\n' + MEM.slice(-40).map(function(x){ return '· ' + x; }).join('\n');
    }
    var msgs = [{ role: 'system', content: sys }];
    if (typeof CHAT !== 'undefined' && CHAT.length){
      CHAT.filter(function(m){ return !m.typing && m.text; }).slice(-16).forEach(function(m){
        msgs.push({ role: m.role === 'user' ? 'user' : 'assistant',
                    content: String(m.text).slice(0, 300) });
      });
    }
    msgs.push({ role: 'user', content: user });

    var rid = 'mom' + Date.now() + Math.random().toString(36).slice(2, 6);
    await rawApi('/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: rid, inboxId: S.inbox, messages: msgs,
        settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model,
                    apiType: S.apiType || 'openai', temperature: temp || 0.9 },
        meta: { charName: '祁砚', charId: 'kai' }
      })
    });
    for (var i = 0; i < 22; i++){
      await sleep(i ? 2000 : 600);
      try {
        var j = await rawApi('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
        if (f){
          await rawApi('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
          return String(f.content || '');
        }
      } catch(e){}
    }
    return '';
  }

  /* ---- 我 页面 ---- */
  function meHtml(){
    var ava = localStorage.getItem('xm_ava') || '';
    var sign = String(S.sign || '').trim();
    return '<div class="meWrap">' +
      '<div class="meAva" id="meAva"' + (ava ? ' style="background-image:url(\'' + ava + '\')"' : '') + '></div>' +
      '<div class="meNameWrap"><span class="meName" id="meName">' + esc(S.name || '小咩') + '</span></div>' +
      '<div class="meSign' + (sign ? '' : ' ph') + '" id="meSign">' +
        esc(sign || '点这里写点什么') + '</div>' +
      '<div class="meBtns">' +
        '<div class="meBtn" data-me="fav">收藏</div>' +
        '<div class="meBtn" data-me="mom">朋友圈</div>' +
        '<div class="meBtn" data-me="set">设置</div>' +
      '</div></div>';
  }

  function edit(el, kind, max, done){
    if (el.dataset.ed) return;
    el.dataset.ed = '1';
    var inp = document.createElement('input');
    inp.className = 'meEdit';
    inp.maxLength = max;
    inp.value = kind === 'name' ? (S.name || '') : (S.sign || '');
    if (kind === 'sign') inp.style.fontSize = '19px';
    el.replaceWith(inp);
    inp.focus();
    try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch(e){}
    var once = false;
    function commit(){
      if (once) return;
      once = true;
      var v = inp.value.trim();
      if (kind === 'name'){ if (v) S.name = v; } else S.sign = v;
      try { save(); } catch(e){}
      done();
    }
    inp.onblur = commit;
    inp.onkeydown = function(e){ if (e.key === 'Enter'){ e.preventDefault(); inp.blur(); } };
  }

  /* ---- 分析弹窗 ---- */
  function showPop(text, canBak){
    var old = document.getElementById('momPop'); if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'momPop';
    d.style.cssText = 'position:fixed;inset:0;z-index:140;background:rgba(0,0,0,.34);'+
      'display:flex;align-items:center;justify-content:center;padding:26px';
    d.innerHTML = '<div style="width:100%;max-width:340px;background:#f7f7f5;border-radius:22px;'+
      'padding:22px 20px;box-shadow:0 20px 50px rgba(0,0,0,.28)">'+
      '<div style="font-size:11px;letter-spacing:.18em;color:#9a9a96;margin-bottom:10px">祁砚</div>'+
      '<div id="momPopTx" style="font-size:15px;line-height:1.75;color:#0b0b0b;'+
      'white-space:pre-wrap;max-height:46vh;overflow-y:auto">' + esc(text) + '</div>'+
      '<div style="display:flex;gap:10px;margin-top:20px">' +
        (canBak ? '<button id="momPopBak" style="flex:1;border:1px solid rgba(0,0,0,.12);'+
          'background:#fff;color:#0b0b0b;border-radius:16px;padding:12px;font-size:13.5px">恢复备份</button>' : '') +
        '<button id="momPopOk" style="flex:1;border:0;background:#111;color:#fff;'+
          'border-radius:16px;padding:12px;font-size:13.5px">知道了</button>'+
      '</div></div>';
    document.body.appendChild(d);
    d.querySelector('#momPopOk').onclick = function(){ d.remove(); };
    var bk = d.querySelector('#momPopBak');
    if (bk) bk.onclick = function(){
      var bak = ls('xm_moments_bak', null);
      if (!bak || !bak.items || !bak.items.length){ toast('没有备份'); return; }
      var all = ls('xm_moments', []);
      bak.items.forEach(function(m){ all.push(m); });
      all.sort(function(a, b){ return a.t - b.t; });
      ss('xm_moments', all.slice(-60));
      d.remove(); openSet(); repaint();
      toast('备份回来了');
    };
  }

  /* ---- 清空我的朋友圈 ---- */
  async function clearMine(){
    var all = ls('xm_moments', []);
    var mine = all.filter(function(m){ return m.who === 'me'; });
    if (!mine.length){ toast('你还没发过朋友圈'); return; }
    if (!confirm('清掉你自己发的 ' + mine.length + ' 条朋友圈？\n他的会留着，你那份会存一份备份。')) return;

    ss('xm_moments_bak', { at: Date.now(), items: mine });
    ss('xm_moments', all.filter(function(m){ return m.who !== 'me'; }));
    set.classList.remove('on');
    repaint();

    if (!S.key){ showPop('删掉了。备份留着，想拿回来点下面。', 1); return; }
    showPop('…', 1);

    var lines = mine.slice(-8).map(function(m, i){
      return (i + 1) + '. 「' + String(m.text || '（图片）').slice(0, 50) + '」（' + ago(m.t) + '）';
    }).join('\n');
    var said = (typeof CHAT !== 'undefined' ? CHAT : [])
      .filter(function(m){ return m.role === 'user' && m.text; }).slice(-8)
      .map(function(m){ return '· ' + String(m.text).slice(0, 60); }).join('\n');

    var raw = await ask('现在是 ' + partOfDay() + '。\n' +
      '小咩刚刚把自己朋友圈里 ' + mine.length + ' 条动态全删了。删掉的是：\n' + lines + '\n\n' +
      (said ? '她最近对你说过的话：\n' + said + '\n\n' : '') +
      '写一段话，直接对她说。说说你觉得她为什么删。' +
      '不要像心理咨询，不要列点，不要问「要不要聊聊」，不要说「我理解你」。' +
      '60 字内，口语，不要 markdown，不要加引号。');
    showPop(raw ? String(raw).trim() : '没连上中继，分析不了。备份还在。', 1);
  }

  /* ---- 我 的设置页 ---- */
  var set = document.createElement('div');
  set.id = 'meSet';
  document.body.appendChild(set);

  function setHtml(){
    var mom = ls('xm_moments', []);
    var bak = ls('xm_moments_bak', null);
    var ava = localStorage.getItem('xm_ava') || '';
    var cov = localStorage.getItem('xm_cover') || '';
    return '<div class="mtop"><span class="mback" id="meBack">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b0b0b" ' +
        'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M15 5l-7 7 7 7"/></svg></span><b>设置</b></div>' +
      '<div class="mbody">' +
      '<div class="card"><div class="eyebrow">我的资料</div>' +
        '<div class="item" id="meSetAva"><span>头像</span><em>' +
          '<i style="display:inline-block;width:34px;height:34px;border-radius:50%;' +
          'background:#e6e6e2 center/cover' + (ava ? ';background-image:url(\'' + ava + '\')' : '') +
          '"></i>›</em></div>' +
        '<div class="item" id="meSetCov"><span>封面</span><em>' +
          '<i style="display:inline-block;width:52px;height:34px;border-radius:8px;' +
          'background:#e6e6e2 center/cover' + (cov ? ';background-image:url(\'' + cov + '\')' : '') +
          '"></i>›</em></div>' +
      '</div>' +
      '<div class="card"><div class="eyebrow">朋友圈</div>' +
        '<div class="item"><span>他自己发朋友圈</span><em><span class="sw ' + (+S.momOn ? 'on' : '') +
          '" id="meSetMom"><i></i></span></em></div>' +
        '<div class="item"><span>隔几小时发一条</span><em><input id="meSetGap" value="' +
          (+S.momGap || 8) + '" style="width:44px;text-align:right;border:0;' +
          'background:transparent;font-size:14px"></em></div>' +
        '<div class="item" id="meSetNow"><span>让他现在发一条</span><em>›</em></div>' +
        '<div class="item" id="meSetClr"><span style="color:#ff3b30">清空我的朋友圈</span><em>' +
          (bak && bak.items ? bak.items.length + ' 条备份' : '') + '</em></div>' +
      '</div>' +
      '<div class="card"><div class="eyebrow">关于</div>' +
        '<div class="item"><span>在一起</span><em>' + days() + ' 天</em></div>' +
        '<div class="item"><span>朋友圈</span><em>' + mom.length + ' 条</em></div>' +
        '<div class="item"><span>记住的事</span><em>' +
          (typeof MEM !== 'undefined' ? MEM.length : 0) + ' 条</em></div>' +
      '</div></div>';
  }

  var fAva = document.createElement('input');
  fAva.type = 'file'; fAva.accept = 'image/*'; fAva.style.display = 'none';
  document.body.appendChild(fAva);
  var fCov = document.createElement('input');
  fCov.type = 'file'; fCov.accept = 'image/*'; fCov.style.display = 'none';
  document.body.appendChild(fCov);

  function pick(file, mx, cb){
    var fr = new FileReader();
    fr.onload = function(){
      var im = new Image();
      im.onload = function(){
        var s = Math.min(1, mx / im.naturalWidth, mx / im.naturalHeight);
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(im.naturalWidth * s));
        c.height = Math.max(1, Math.round(im.naturalHeight * s));
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', .72));
      };
      im.onerror = function(){ cb(''); };
      im.src = fr.result;
    };
    fr.onerror = function(){ cb(''); };
    fr.readAsDataURL(file);
  }
  fAva.onchange = function(){
    var f = fAva.files && fAva.files[0]; fAva.value = '';
    if (!f) return;
    pick(f, 320, function(u){
      try { localStorage.setItem('xm_ava', u); } catch(e){ toast('图太大'); }
      openSet(); repaint();
    });
  };
  fCov.onchange = function(){
    var f = fCov.files && fCov.files[0]; fCov.value = '';
    if (!f) return;
    pick(f, 1000, function(u){
      try { localStorage.setItem('xm_cover', u); } catch(e){ toast('图太大'); }
      openSet();
    });
  };

  function openSet(){
    set.innerHTML = setHtml();
    set.classList.add('on');
    bindSet();
  }
  function bindSet(){
    var q = function(id){ return set.querySelector('#' + id); };
    if (q('meBack')) q('meBack').onclick = function(){ set.classList.remove('on'); };
    if (q('meSetAva')) q('meSetAva').onclick = function(){ fAva.click(); };
    if (q('meSetCov')) q('meSetCov').onclick = function(){ fCov.click(); };
    if (q('meSetMom')) q('meSetMom').onclick = function(){
      S.momOn = +S.momOn ? 0 : 1; try { save(); } catch(e){}
      this.classList.toggle('on', !!+S.momOn);
    };
    if (q('meSetGap')) q('meSetGap').oninput = function(){
      S.momGap = Math.max(1, Math.min(72, parseInt(this.value, 10) || 8));
      try { save(); } catch(e){}
    };
    if (q('meSetNow')) q('meSetNow').onclick = function(){
      if (typeof window.kaiPostNow === 'function') window.kaiPostNow();
      else toast('要贴第 28 块才能用');
    };
    if (q('meSetClr')) q('meSetClr').onclick = function(){ clearMine(); };
  }

  /* ---- 收藏 ---- */
  function favSheet(){
    var old = document.getElementById('meFav'); if (old) old.remove();
    var list = ls('xm_favs', []);
    var d = document.createElement('div');
    d.id = 'meFav';
    d.style.cssText = 'position:fixed;inset:0;z-index:70;background:rgba(0,0,0,.3);'+
      'display:flex;align-items:flex-end';
    d.innerHTML = '<div style="width:100%;max-height:70vh;overflow-y:auto;background:#f4f4f2;'+
      'border-radius:20px 20px 0 0;padding:18px 16px calc(env(safe-area-inset-bottom) + 18px)">'+
      '<div style="font-size:15px;font-weight:600;margin-bottom:8px">收藏</div>'+
      (list.length ? list.map(function(t, i){
        return '<div class="item"><span data-fc="' + i + '">' + esc(t) + '</span>' +
          '<em><b class="x" data-fd="' + i + '">×</b></em></div>';
      }).join('') : '<div class="empty">还没有收藏。聊天里那条回复下面点星星，或者输入框里写好点「收藏」。</div>') +
      '</div>';
    d.onclick = function(e){
      if (e.target === d){ d.remove(); return; }
      var del = e.target.closest('[data-fd]');
      if (del){
        var a = ls('xm_favs', []);
        a.splice(+del.dataset.fd, 1);
        ss('xm_favs', a);
        favSheet(); return;
      }
      var cp = e.target.closest('[data-fc]');
      if (cp){
        try { navigator.clipboard.writeText(cp.textContent); toast('复制好了'); }
        catch(err){ toast('复制失败'); }
      }
    };
    document.body.appendChild(d);
  }

  /* ---- 接管 我 页面 ---- */
  function goMoments(){
    var box = document.getElementById('wx');
    if (!box) return;
    var t = box.querySelector('[data-tab="find"]');
    if (t) t.click();
    var row = box.querySelector('[data-go="moments"]');
    if (row) row.click();
  }

  function repaint(){
    var box = document.getElementById('wx');
    if (!box || !box.classList.contains('on')) return;
    var on = box.querySelector('.wxT.on');
    if (!on || on.dataset.tab !== 'me') return;
    var b = box.querySelector('.wxBody');
    if (!b || b.dataset.me === '1') return;
    b.dataset.me = '1';
    b.innerHTML = meHtml();
    var q = function(id){ return b.querySelector('#' + id); };
    if (q('meAva')) q('meAva').onclick = function(){ fAva.click(); };
    if (q('meName')) q('meName').onclick = function(){ edit(this, 'name', 12, repaint); };
    if (q('meSign')) q('meSign').onclick = function(){ edit(this, 'sign', 40, repaint); };
    b.querySelectorAll('[data-me]').forEach(function(el){
      el.onclick = function(){
        var a = el.dataset.me;
        if (a === 'fav') favSheet();
        else if (a === 'mom') goMoments();
        else openSet();
      };
    });
  }

  var last = 0;
  new MutationObserver(function(){
    var now = Date.now();
    if (now - last < 250) return;
    last = now;
    repaint();
  }).observe(document.body, { childList: true, subtree: true });
  setInterval(repaint, 800);
})();
