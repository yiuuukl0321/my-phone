/* ===== 1. 语音朗读：系统内置 / OpenAI 兼容 / ElevenLabs ===== */
(function(){
  try {
    var KEY = 'xm_tts';
    var cfg = Object.assign({ on: 1, auto: 0, provider: 'system', url: '', key: '', model: '', voice: '', speed: 1 },
      JSON.parse(localStorage.getItem(KEY) || '{}'));
    var saveCfg = function(){ try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch(e){} };
    var audio = null;

    function toast(t){
      var d = document.createElement('div');
      d.textContent = t;
      d.style.cssText = 'position:fixed;left:50%;bottom:120px;transform:translateX(-50%);background:rgba(0,0,0,.82);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:14px;z-index:99;max-width:80vw;text-align:center';
      document.body.appendChild(d);
      setTimeout(function(){ d.remove(); }, 2400);
    }
    function stop(){
      try { if (audio){ audio.pause(); audio.src = ''; audio = null; } } catch(e){}
      try { window.speechSynthesis && speechSynthesis.cancel(); } catch(e){}
    }
    function voices(){ try { return speechSynthesis.getVoices() || []; } catch(e){ return []; } }

    function speak(raw){
      var text = String(raw || '').replace(/\s+/g, ' ').trim();
      if (!text) return;
      stop();
      if (!+cfg.on) return;
      var sp = Math.max(.5, Math.min(2, +cfg.speed || 1));
      if (cfg.provider === 'system'){
        try {
          var u = new SpeechSynthesisUtterance(text.slice(0, 900));
          u.rate = sp;
          u.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
          var list = voices(), v = null;
          if (cfg.voice) v = list.filter(function(x){ return x.name === cfg.voice; })[0];
          if (!v) v = list.filter(function(x){ return /zh[-_]|Chinese|中文|粤|Yue/i.test(x.lang + ' ' + x.name); })[0];
          if (v) u.voice = v;
          speechSynthesis.speak(u);
        } catch(e){ toast('这台设备的系统语音用不了'); }
        return;
      }
      var url = String(cfg.url || '').replace(/\/+$/, '');
      if (!url || !cfg.key){ toast('先在语音设置里填地址和 Key'); return; }
      var req;
      if (cfg.provider === 'elevenlabs'){
        req = fetch(url + '/v1/text-to-speech/' + encodeURIComponent(cfg.voice || '21m00Tcm4TlvDq8ikWAM'), {
          method: 'POST',
          headers: { 'xi-api-key': cfg.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text.slice(0, 2500), model_id: cfg.model || 'eleven_multilingual_v2' })
        });
      } else {
        var ep = /\/v\d+$/.test(url) ? url : url + '/v1';
        req = fetch(ep + '/audio/speech', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + cfg.key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: cfg.model || 'gpt-4o-mini-tts', input: text.slice(0, 1500), voice: cfg.voice || 'alloy', response_format: 'mp3' })
        });
      }
      toast('合成中…');
      req.then(function(r){
        if (!r.ok) return r.text().then(function(t){ throw new Error(r.status + ' ' + String(t).slice(0, 120)); });
        return r.blob();
      }).then(function(b){
        var ou = URL.createObjectURL(b);
        audio = new Audio(ou);
        audio.playbackRate = sp;
        audio.onended = function(){ try { URL.revokeObjectURL(ou); } catch(e){} audio = null; };
        return audio.play();
      }).catch(function(e){ toast('朗读失败：' + ((e && e.message) || e)); });
    }

    function openPanel(){
      var old = document.getElementById('ttsPanel'); if (old) old.remove();
      var d = document.createElement('div');
      d.id = 'ttsPanel';
      d.style.cssText = 'position:fixed;inset:0;z-index:80;background:#f4f4f2;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(env(safe-area-inset-top) + 16px) 18px calc(env(safe-area-inset-bottom) + 30px);font-size:14px';
      var ipt = 'flex:1;max-width:64%;text-align:right;border:0;background:transparent;font-size:14px;color:#0b0b0b';
      var rowS = 'padding:14px 0;border-bottom:1px solid rgba(0,0,0,.08);display:flex;align-items:center;justify-content:space-between;gap:12px';
      var isSys = cfg.provider === 'system';
      var voiceCtl = isSys
        ? '<select id="ttsVoice" style="' + ipt + '"><option value="">默认</option>' +
            voices().map(function(v){ return '<option value="' + v.name + '"' + (cfg.voice === v.name ? ' selected' : '') + '>' + v.name + '</option>'; }).join('') +
          '</select>'
        : '<input id="ttsVoice" style="' + ipt + '" value="' + (cfg.voice || '') + '" placeholder="alloy / Voice ID">';
      d.innerHTML =
        '<div style="display:flex;align-items:center;margin-bottom:8px">' +
          '<b style="font-size:17px">语音朗读</b>' +
          '<button id="ttsClose" style="margin-left:auto;border:0;background:#111;color:#fff;border-radius:18px;padding:8px 18px;font-size:13px">完成</button>' +
        '</div>' +
        '<div style="' + rowS + '"><span>开启朗读</span><input type="checkbox" id="ttsOn" ' + (+cfg.on ? 'checked' : '') + ' style="width:22px;height:22px"></div>' +
        '<div style="' + rowS + '"><span>自动朗读新回复</span><input type="checkbox" id="ttsAuto" ' + (+cfg.auto ? 'checked' : '') + ' style="width:22px;height:22px"></div>' +
        '<div style="' + rowS + '"><span>平台</span><select id="ttsProv" style="' + ipt + '">' +
          '<option value="system"' + (isSys ? ' selected' : '') + '>系统内置（免费）</option>' +
          '<option value="openai"' + (cfg.provider === 'openai' ? ' selected' : '') + '>OpenAI 兼容</option>' +
          '<option value="elevenlabs"' + (cfg.provider === 'elevenlabs' ? ' selected' : '') + '>ElevenLabs</option>' +
        '</select></div>' +
        '<div id="ttsOnline"' + (isSys ? ' style="display:none"' : '') + '>' +
          '<div style="' + rowS + '"><span>API 地址</span><input id="ttsUrl" style="' + ipt + '" value="' + (cfg.url || '') + '" placeholder="' + (cfg.provider === 'elevenlabs' ? 'https://api.elevenlabs.io' : 'https://api.openai.com') + '"></div>' +
          '<div style="' + rowS + '"><span>API Key</span><input id="ttsKey" type="password" style="' + ipt + '" value="' + (cfg.key || '') + '" placeholder="sk-..."></div>' +
          '<div style="' + rowS + '"><span>模型</span><input id="ttsModel" style="' + ipt + '" value="' + (cfg.model || '') + '" placeholder="' + (cfg.provider === 'elevenlabs' ? 'eleven_multilingual_v2' : 'gpt-4o-mini-tts') + '"></div>' +
        '</div>' +
        '<div style="' + rowS + '"><span>音色</span>' + voiceCtl + '</div>' +
        '<div style="' + rowS + '"><span>语速</span><span style="display:flex;align-items:center;gap:10px;flex:1;max-width:64%;justify-content:flex-end">' +
          '<input id="ttsSpeed" type="range" min="0.5" max="2" step="0.05" value="' + (+cfg.speed || 1) + '" style="width:120px">' +
          '<b id="ttsSpeedV" style="font-size:13px;color:#a0a09c;width:34px;text-align:right">' + (+cfg.speed || 1).toFixed(2) + '</b></span></div>' +
        '<div style="display:flex;gap:10px;margin-top:18px">' +
          '<button id="ttsTest" style="flex:1;border:0;background:#111;color:#fff;border-radius:18px;padding:13px;font-size:14px">试听</button>' +
          '<button id="ttsLast" style="flex:1;border:1px solid rgba(0,0,0,.12);background:#fff;color:#0b0b0b;border-radius:18px;padding:13px;font-size:14px">读最后一条</button>' +
        '</div>' +
        '<div style="font-size:11px;color:#a0a09c;line-height:1.75;margin-top:14px">系统内置不用 Key，用手机自带音色（设置 → 辅助功能 → 朗读内容 可下载更多）。OpenAI 兼容填平台根地址（如 https://api.openai.com），会自动接 /v1/audio/speech。ElevenLabs 填 https://api.elevenlabs.io，音色填 Voice ID。在线合成需要平台允许浏览器跨域，报错就先用系统内置。</div>';
      document.body.appendChild(d);

      var q = function(id){ return d.querySelector('#' + id); };
      q('ttsClose').onclick = function(){ d.remove(); };
      q('ttsOn').onchange = function(){ cfg.on = this.checked ? 1 : 0; saveCfg(); if (!+cfg.on) stop(); };
      q('ttsAuto').onchange = function(){ cfg.auto = this.checked ? 1 : 0; saveCfg(); };
      q('ttsProv').onchange = function(){ cfg.provider = this.value; saveCfg(); openPanel(); };
      if (q('ttsUrl')) q('ttsUrl').oninput = function(){ cfg.url = this.value.trim(); saveCfg(); };
      if (q('ttsKey')) q('ttsKey').oninput = function(){ cfg.key = this.value.trim(); saveCfg(); };
      if (q('ttsModel')) q('ttsModel').oninput = function(){ cfg.model = this.value.trim(); saveCfg(); };
      if (q('ttsVoice')) q('ttsVoice').onchange = function(){ cfg.voice = this.value; saveCfg(); };
      q('ttsSpeed').oninput = function(){ cfg.speed = +this.value; q('ttsSpeedV').textContent = (+this.value).toFixed(2); saveCfg(); };
      q('ttsTest').onclick = function(){ speak('你好，我是祁砚。这是现在的语速。'); };
      q('ttsLast').onclick = function(){
        var els = document.querySelectorAll('#msgs .bub.kai:not(.typing)');
        var el = els[els.length - 1];
        if (el) speak(el.textContent); else toast('还没有可以读的消息');
      };
    }

    function addTop(){
      var bar = document.querySelector('#ov .ovtop');
      if (!bar || bar.querySelector('.ttsTop')) return;
      var b = document.createElement('div');
      b.className = 'ttsTop';
      b.textContent = '🔊';
      b.style.cssText = 'font-size:17px;padding:2px 8px;opacity:.8';
      b.onclick = function(e){ e.stopPropagation(); openPanel(); };
      var act = bar.querySelector('.ovact');
      if (act) bar.insertBefore(b, act); else bar.appendChild(b);
    }

    var lastText = '';
    function decorate(){
      var box = document.getElementById('msgs');
      if (!box) return;
      var wraps = box.querySelectorAll('.wrap');
      for (var i = 0; i < wraps.length; i++){
        var w = wraps[i];
        if (w.querySelector('.spk')) continue;
        var bub = w.querySelector('.bub.kai');
        if (!bub || bub.classList.contains('typing')) continue;
        (function(el, host){
          var s = document.createElement('span');
          s.className = 'spk';
          s.textContent = '🔊';
          s.style.cssText = 'font-size:11px;opacity:.38;align-self:flex-end;margin-top:2px;padding:2px 4px';
          s.onclick = function(ev){ ev.stopPropagation(); speak(el.textContent); };
          host.appendChild(s);
        })(bub, w);
      }
      if (+cfg.on && +cfg.auto){
        var els = box.querySelectorAll('.bub.kai:not(.typing)');
        var last = els[els.length - 1];
        if (last){
          var t = last.textContent.trim();
          if (t && t !== lastText){ lastText = t; speak(t); }
        }
      }
    }

    addTop();
    var box = document.getElementById('msgs');
    if (box) new MutationObserver(function(){ setTimeout(decorate, 80); })
      .observe(box, { childList: true, subtree: true, characterData: true });
    decorate();
    window.addEventListener('load', addTop);
  } catch(e){ console.warn('tts block failed', e); }
})();


/* ===== 2. 语音界面增强：模型名自动纠正 + 模型快捷选择 + 一键拉取 ElevenLabs 音色 ===== */
(function(){
  var KEY = 'xm_tts';
  var MODELS = [
    ['eleven_multilingual_v2', 'Multilingual v2'],
    ['eleven_turbo_v2_5', 'Turbo v2.5'],
    ['eleven_flash_v2_5', 'Flash v2.5'],
    ['eleven_v3', 'v3']
  ];
  function read(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(e){ return {}; } }
  function norm(v){
    var s = String(v || '').trim().toLowerCase().replace(/[\s\-]+/g, '_');
    if (/^eleven_[a-z0-9_]+$/.test(s)) return s;
    if (s.indexOf('multilingual') >= 0) return 'eleven_multilingual_v2';
    if (s.indexOf('turbo') >= 0) return 'eleven_turbo_v2_5';
    if (s.indexOf('flash') >= 0) return 'eleven_flash_v2_5';
    if (s.indexOf('v3') >= 0) return 'eleven_v3';
    return 'eleven_multilingual_v2';
  }
  function tip(t){
    var d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = 'position:fixed;left:50%;bottom:140px;transform:translateX(-50%);background:rgba(0,0,0,.82);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:14px;z-index:99;max-width:80vw;text-align:center';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 2200);
  }

  // 兜底：凡是发给 ElevenLabs 的合成请求，model_id 一律转成合法 ID
  var rawFetch = window.fetch.bind(window);
  window.fetch = function(url, opts){
    try {
      if (typeof url === 'string' && url.indexOf('/text-to-speech/') >= 0 && opts && typeof opts.body === 'string'){
        var o = JSON.parse(opts.body);
        if (o && o.model_id !== undefined && norm(o.model_id) !== o.model_id){
          o.model_id = norm(o.model_id);
          opts = Object.assign({}, opts, { body: JSON.stringify(o) });
        }
      }
    } catch(e){}
    return rawFetch(url, opts);
  };

  function decorate(){
    var p = document.getElementById('ttsPanel');
    if (!p || p.getAttribute('data-enh')) return;
    var prov = p.querySelector('#ttsProv');
    var mEl = p.querySelector('#ttsModel');
    if (!prov || !mEl) return;
    p.setAttribute('data-enh', '1');
    var isEl = prov.value === 'elevenlabs';
    if (!isEl) return;

    // 模型名纠正 + 快捷选择
    var fixed = norm(mEl.value);
    if (mEl.value !== fixed){ mEl.value = fixed; if (mEl.oninput) mEl.oninput(); }
    var chips = document.createElement('div');
    chips.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
    MODELS.forEach(function(m){
      var c = document.createElement('button');
      c.textContent = m[1];
      c.style.cssText = 'border:1px solid rgba(0,0,0,.12);background:#fff;color:#0b0b0b;border-radius:14px;padding:7px 12px;font-size:12.5px';
      c.onclick = function(){
        mEl.value = m[0];
        if (mEl.oninput) mEl.oninput();
        tip('模型：' + m[0]);
      };
      chips.appendChild(c);
    });
    if (mEl.parentNode && mEl.parentNode.parentNode) mEl.parentNode.parentNode.insertBefore(chips, mEl.parentNode.nextSibling);

    // 拉取账号里的音色
    var vEl = p.querySelector('#ttsVoice');
    if (!vEl || p.querySelector('#ttsPull')) return;
    var bar = document.createElement('div');
    bar.style.cssText = 'margin-top:12px';
    bar.innerHTML = '<button id="ttsPull" style="width:100%;border:1px solid rgba(0,0,0,.12);background:#fff;color:#0b0b0b;border-radius:18px;padding:12px;font-size:14px">拉取我的音色</button>';
    var box = document.createElement('div');
    box.id = 'ttsVoices';
    box.style.cssText = 'margin-top:6px';
    var host = vEl.parentNode && vEl.parentNode.parentNode ? vEl.parentNode.parentNode : p;
    host.insertBefore(bar, vEl.parentNode.nextSibling);
    host.insertBefore(box, bar.nextSibling);

    bar.querySelector('#ttsPull').onclick = function(){
      var cfg = read();
      var url = String(cfg.url || '').replace(/\/+$/, '') || 'https://api.elevenlabs.io';
      if (!cfg.key){ box.textContent = '先在上面把 API Key 填好'; return; }
      box.textContent = '读取中…';
      rawFetch(url + '/v1/voices?page_size=100', { headers: { 'xi-api-key': cfg.key } })
        .then(function(r){ return r.json(); })
        .then(function(j){
          var vs = (j && j.voices) || [];
          if (!vs.length){ box.textContent = '没读到音色：' + JSON.stringify(j).slice(0, 160); return; }
          box.innerHTML = '';
          vs.forEach(function(v){
            var b = document.createElement('div');
            b.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 4px;border-bottom:1px solid rgba(0,0,0,.08);font-size:13.5px';
            b.innerHTML = '<span>' + (v.name || '') + '</span><em style="font-style:normal;color:#a0a09c;font-size:11px">' + (v.voice_id || '') + '</em>';
            b.onclick = function(){
              var inp = p.querySelector('#ttsVoice');
              if (inp){
                inp.value = v.voice_id;
                if (inp.onchange) inp.onchange();
              }
              box.querySelectorAll('div').forEach(function(x){ x.style.background = ''; });
              b.style.background = 'rgba(146,163,214,.20)';
              tip('音色：' + (v.name || v.voice_id));
            };
            box.appendChild(b);
          });
        })
        .catch(function(e){ box.textContent = '拉取失败：' + ((e && e.message) || e); });
    };
  }

  var pend = 0;
  new MutationObserver(function(){
    if (pend) return;
    pend = setTimeout(function(){ pend = 0; decorate(); }, 120);
  }).observe(document.body, { childList: true, subtree: true });
})();

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
      icon: 'icon.jpeg',
      badge: 'icon.jpeg',
      data: d
    });
  })());
});


/* ===== 3. 翻译：在回复下面开一个译文框，自带朗读 ===== */
(function(){
  var KEY = 'xm_tts';
  var CACHE = {};

  function getCfg(){
    try {
      return Object.assign({ on: 1, provider: 'system', url: '', key: '', model: '', voice: '', speed: 1 },
        JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch(e){ return { on: 1, provider: 'system', speed: 1 }; }
  }
  function elId(v){
    var s = String(v || '').trim().toLowerCase().replace(/[\s\-]+/g, '_');
    if (/^eleven_[a-z0-9_]+$/.test(s)) return s;
    if (s.indexOf('multilingual') >= 0) return 'eleven_multilingual_v2';
    if (s.indexOf('turbo') >= 0) return 'eleven_turbo_v2_5';
    if (s.indexOf('flash') >= 0) return 'eleven_flash_v2_5';
    if (s.indexOf('v3') >= 0) return 'eleven_v3';
    return 'eleven_multilingual_v2';
  }

  var audio = null;
  function stopVoice(){
    try { if (audio){ audio.pause(); audio.src = ''; audio = null; } } catch(e){}
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch(e){}
  }
  function speak(raw){
    var text = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!text) return;
    stopVoice();
    var c = getCfg();
    if (!+c.on) return;
    var sp = Math.max(.5, Math.min(2, +c.speed || 1));
    if (!c.provider || c.provider === 'system'){
      try {
        var u = new SpeechSynthesisUtterance(text.slice(0, 900));
        u.rate = sp;
        u.lang = /[\u4e00-\u9fff]/.test(text) ? 'zh-CN' : 'en-US';
        var list = speechSynthesis.getVoices() || [], v = null;
        if (c.voice) v = list.filter(function(x){ return x.name === c.voice; })[0];
        if (!v) v = list.filter(function(x){ return /zh[-_]|Chinese|中文|粤|Yue/i.test(x.lang + ' ' + x.name); })[0];
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch(e){}
      return;
    }
    var url = String(c.url || '').replace(/\/+$/, '');
    if (!url || !c.key) return;
    var req;
    if (c.provider === 'elevenlabs'){
      req = fetch(url + '/v1/text-to-speech/' + encodeURIComponent(c.voice || '21m00Tcm4TlvDq8ikWAM'), {
        method: 'POST',
        headers: { 'xi-api-key': c.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 2500), model_id: elId(c.model) })
      });
    } else {
      var ep = /\/v\d+$/.test(url) ? url : url + '/v1';
      req = fetch(ep + '/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + c.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: c.model || 'gpt-4o-mini-tts', input: text.slice(0, 1500), voice: c.voice || 'alloy', response_format: 'mp3' })
      });
    }
    req.then(function(r){
      if (!r.ok) return r.text().then(function(t){ throw new Error(r.status + ' ' + String(t).slice(0, 100)); });
      return r.blob();
    }).then(function(b){
      var ou = URL.createObjectURL(b);
      audio = new Audio(ou);
      audio.playbackRate = sp;
      audio.onended = function(){ try { URL.revokeObjectURL(ou); } catch(e){} audio = null; };
      return audio.play();
    }).catch(function(){});
  }

  // 和上面那栏「播放语音」用的是同一个图标
  var SAY = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px"><path d="M4 9.4h3.3L12.2 5v14l-4.9-4.4H4z"/><path d="M15.9 9.2a4.1 4.1 0 0 1 0 5.6"/><path d="M18.3 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>';

  function makeBox(i){
    var d = document.createElement('div');
    d.className = 'xlate';
    d.setAttribute('data-for', i);
    d.style.cssText = 'margin:2px 6px 14px;background:#fff;border:1px solid rgba(0,0,0,.09);border-radius:16px;padding:12px 14px;font-size:13.5px;line-height:1.75;color:#0b0b0b';
    var t = document.createElement('div');
    t.className = 'xtxt';
    t.style.cssText = 'white-space:pre-wrap';
    t.textContent = '翻译中…';
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:16px;margin-top:9px;color:#8f8f8b';
    var say = document.createElement('button');
    say.className = 'xsay';
    say.style.cssText = 'border:0;background:none;padding:0;color:inherit;font-size:12.5px;line-height:0';
    say.innerHTML = SAY;
    var lab = document.createElement('span');
    lab.textContent = '朗读';
    lab.style.cssText = 'margin-left:6px;font-size:12.5px;vertical-align:4px';
    say.appendChild(lab);
    var del = document.createElement('button');
    del.className = 'xdel';
    del.style.cssText = 'border:0;background:none;padding:0;color:inherit;font-size:12.5px;line-height:1';
    del.textContent = '收起来';
    bar.appendChild(say); bar.appendChild(del);
    d.appendChild(t); d.appendChild(bar);
    return d;
  }

  function ask(text, cb){
    if (!S.key || !S.apiUrl || !S.apiKey){ cb('先去设置把参数填好。'); return; }
    var rid = 'tr' + Date.now() + Math.random().toString(36).slice(2, 6);
    api('/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: rid, inboxId: S.inbox,
        messages: [
          { role: 'system', content: '你是翻译。把用户发来的文本翻译成中文；如果本来就是中文，就翻译成英文。只输出译文，不要解释，不要加引号。' },
          { role: 'user', content: text }
        ],
        settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model, apiType: S.apiType || 'openai', temperature: 0.2 },
        meta: { charName: '祁砚', charId: 'kai' }
      })
    }).then(function(){
      var n = 0;
      var t = setInterval(function(){
        n++;
        if (n > 20){ clearInterval(t); cb('翻译超时了，再点一次。'); return; }
        api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0').then(function(j){
          var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
          if (!f) return;
          clearInterval(t);
          api('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
          cb(f.error ? ('翻译失败：' + f.error) : (parseReply(f.content).text || '（空）'));
        }).catch(function(){});
      }, 2000);
    }).catch(function(e){ cb('翻译失败：' + e.message); });
  }

  function place(i, text){
    var row = document.querySelector('#msgs .acts[data-x="' + i + '"]');
    var w = row ? row.previousElementSibling : document.querySelector('#msgs .wrap[data-i="' + i + '"]');
    if (!w) return null;
    var old = document.querySelector('#msgs .xlate[data-for="' + i + '"]');
    if (old) old.remove();
    var box = makeBox(i);
    box.querySelector('.xtxt').textContent = text;
    box.querySelector('.xsay').onclick = function(){ speak(box.querySelector('.xtxt').textContent); };
    box.querySelector('.xdel').onclick = function(){ box.remove(); delete CACHE[i]; };
    var host = row ? row.parentNode : w.parentNode;
    host.insertBefore(box, row ? row.nextSibling : w.nextSibling);
    return box;
  }

  function go(i){
    var w = document.querySelector('#msgs .wrap[data-i="' + i + '"]');
    if (!w) return;
    var b = w.querySelector('.bub.kai');
    var text = b ? b.textContent.trim() : '';
    if (!text) return;
    var box = place(i, '翻译中…');
    ask(text, function(res){
      CACHE[i] = res;
      var cur = document.querySelector('#msgs .xlate[data-for="' + i + '"]') || box;
      if (cur) cur.querySelector('.xtxt').textContent = res;
    });
  }

  function hijack(){
    var rows = document.querySelectorAll('#msgs .acts');
    Array.prototype.forEach.call(rows, function(row){
      var w = row.previousElementSibling;
      if (!w || !w.classList || !w.classList.contains('wrap')) return;
      var i = w.getAttribute('data-i');
      if (row.getAttribute('data-x') !== i){
        row.setAttribute('data-x', i);
        var btns = row.querySelectorAll('button');
        var tb = btns[3];
        if (tb) tb.onclick = function(ev){ ev.stopPropagation(); go(i); };
      }
      if (CACHE[i] && !document.querySelector('#msgs .xlate[data-for="' + i + '"]')) place(i, CACHE[i]);
    });
  }

  setInterval(hijack, 700);
  hijack();
})();
