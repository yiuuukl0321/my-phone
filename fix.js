/* 咩&砚 · 补丁包



/* ===== 1. 壁纸修复（底部白边） ===== */
(function(){
  var st = document.createElement('style');
  st.textContent = 'html{overflow:hidden;background-color:#000;background-repeat:no-repeat;background-position:center top;background-size:cover}body{height:100%;overflow:hidden;background:transparent}';
  document.head.appendChild(st);
  var db = document.getElementById('dbg');
  if (db) db.remove();
  function tall(){ return Math.max(innerHeight, screen.height, document.documentElement.clientHeight); }
  var lastW = '';

   function paint(){
    if (typeof S === 'undefined' || typeof WALL_DEFAULT === 'undefined') return;
    var w = String(S.wall || '').trim() || WALL_DEFAULT;
    w = w.replace(/'/g, '');
    var dim = Math.max(0, Math.min(.6, +S.dim || 0));
    var de = document.documentElement;
    var key = w + '|' + dim;
    if (key === lastW) return;
    lastW = key;

    de.style.setProperty('height', tall() + 'px', 'important');
    de.style.setProperty('background-image',
      'linear-gradient(rgba(0,0,0,.34),rgba(0,0,0,0) 130px),' +
      'linear-gradient(rgba(0,0,0,' + dim + '),rgba(0,0,0,' + dim + ')),' +
      "url('" + w + "')", 'important');
  }
  window.applyWall = paint;
  paint();
  addEventListener('resize', paint);
  addEventListener('orientationchange', paint);
  setInterval(function(){
    if (window.applyWall !== paint) window.applyWall = paint;
    var x = document.getElementById('dbg');
    if (x) x.remove();
    var o = document.getElementById('wall');
    if (o) o.style.display = 'none';
    paint();
  }, 1500);

})();

/* ===== 2. 记忆档案 导出 / 导入 ===== */
(function(){
  function mem(){ try { return MEM; } catch(e){ return null; } }
  function save(){ try { if (typeof saveMem === 'function') saveMem(); } catch(e){} }
  function say(t){
    window.__ioMsg = t;
    var s = document.getElementById('ioMsg');
    if (s) s.textContent = t;
  }
  window.memExport = function(){
    var m = mem() || [];
    var box = document.getElementById('ioBox'); if (!box) return;
    box.value = JSON.stringify({ v: 1, at: new Date().toISOString(), mem: m }, null, 1);
    say('已导出 ' + m.length + ' 条。');
  };
  window.memCopy = function(){
    var box = document.getElementById('ioBox'); if (!box || !box.value) return;
    try { navigator.clipboard.writeText(box.value); say('复制好了。'); } catch(e){}
  };
  window.memPaste = function(){
    var box = document.getElementById('ioBox'); if (!box) return;
    try {
      navigator.clipboard.readText().then(function(t){
        if (t) box.value = t;
        say('粘进来了，点导入。');
      }).catch(function(){ say('读不到剪贴板，长按框里自己粘。'); });
    } catch(e){}
  };
  window.memImport = function(){
    var box = document.getElementById('ioBox');
    var t = ((box && box.value) || '').trim();
    if (!t){ say('先把档案粘进框里。'); return; }
    var list = [];
    try {
      var d = JSON.parse(t);
      list = (d && (d.mem || d.memory)) || (Array.isArray(d) ? d : []);
    } catch(e){
      list = t.split('\n').map(function(x){ return x.replace(/^[\s\-·•\d.、]+/, '').trim(); })
              .filter(function(x){ return x.length > 1; });
    }
    var cur = mem() || [], n = 0;
    list.forEach(function(x){
      x = String(x).replace(/\s+/g, ' ').trim();
      if (!x || cur.indexOf(x) > -1) return;
      cur.push(x); n++;
    });
    save();
    say('加了 ' + n + ' 条，现在共 ' + cur.length + ' 条。');
    if (typeof openApp === 'function') setTimeout(function(){ openApp('set'); }, 60);
  };
  function inject(){
    var body = document.getElementById('ovbody');
    if (!body || !document.getElementById('sWall')) return;
    if (document.getElementById('memIO')) return;
    var d = document.createElement('div');
    d.id = 'memIO';
    d.className = 'card';
    d.innerHTML = '<div class="eyebrow">MEMORY FILE</div>' +
      '<div class="sub" style="margin:0 0 10px">导出＝把记住的全部打包成一段文字；导入＝把档案粘进框里，重复的不会加两次。</div>' +
      '<textarea id="ioBox" placeholder="导出的档案会出现在这里；要导入就把档案粘在这里"></textarea>' +
      '<div class="item" onclick="memExport()"><span>导出档案</span><em>›</em></div>' +
      '<div class="item" onclick="memCopy()"><span>复制档案</span><em>›</em></div>' +
      '<div class="item" onclick="memPaste()"><span>从剪贴板粘贴</span><em>›</em></div>' +
      '<div class="item" onclick="memImport()"><span>导入档案</span><em>›</em></div>' +
      '<div class="st" id="ioMsg"></div>';
    body.appendChild(d);
    if (window.__ioMsg) document.getElementById('ioMsg').textContent = window.__ioMsg;
  }
  setInterval(inject, 900);
  inject();
})();

/* ===== 3. 抓网页（消息里带链接时自动读正文） ===== */
(function(){
  var CACHE = {}, LAST = [];

  function strip(html){
    var s = String(html || '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
         .replace(/<style[\s\S]*?<\/style>/gi, ' ')
         .replace(/<!--[\s\S]*?-->/g, ' ')
         .replace(/<br\s*\/?>/gi, '\n')
         .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '\n')
         .replace(/<[^>]+>/g, ' ');
    s = s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
         .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    s = s.replace(/[ \t\r\f\v]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
    return s;
  }
  function shorten(t, n){
    t = String(t || '').trim();
    return t.length <= n ? t : t.slice(0, n) + '\n…（后面截掉了）';
  }
  async function grab(url){
    if (CACHE[url]) return CACHE[url];
    var out = '';
    try {
      var r = await fetch('https://r.jina.ai/' + url, { headers: { 'Accept': 'text/plain' } });
      if (r.ok) out = await r.text();
    } catch(e){}
    if (!out || out.length < 40){
      try {
        var r2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(url));
        if (r2.ok) out = strip(await r2.text());
      } catch(e){}
    }
    out = shorten(out, 6000);
    CACHE[url] = out;
    return out;
  }

  var _send = window.sendChat;
  window.sendChat = async function(){
    var inp = document.getElementById('mIn');
    var ph = inp ? inp.placeholder : '';
    var text = inp ? inp.value : '';
    var urls = (String(text).match(/https?:\/\/[^\s，。、）)】]+/g) || []).slice(0, 3);
    LAST = [];
    if (urls.length){
      if (inp) inp.placeholder = '正在抓网页…';
      for (var i = 0; i < urls.length; i++){
        var t = await grab(urls[i]);
        if (t) LAST.push('【' + urls[i] + '】\n' + t);
      }
      if (inp) inp.placeholder = ph;
    }
    return _send.apply(this, arguments);
  };

  var _bm = window.buildMessages;
  window.buildMessages = function(){
    var m = _bm.apply(this, arguments);
    if (LAST.length && Array.isArray(m)){
      for (var i = m.length - 1; i >= 0; i--){
        if (m[i] && m[i].role === 'user'){
          m[i] = { role: 'user', content: m[i].content + '\n\n（下面是网页正文）\n' + LAST.join('\n\n') };
          break;
        }
      }
    }
    return m;
  };
})();

/* ===== 4. MCP 工具（清单在这里拉，真正调用由中继执行） ===== */
(function(){
  var MCPID = 100;
  function mcp(){ try { if (!Array.isArray(S.mcp)) S.mcp = []; } catch(e){ return []; } return S.mcp; }
  function persist(){ try { save(); } catch(e){} }
  function txt(o){ return String(o == null ? '' : o).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function find(id){ return mcp().filter(function(x){ return x.id === id; })[0]; }
  function clean(s){ return String(s || '').replace(/['"\\]/g, ''); }

  function sseFind(text, id){
    var evs = String(text || '').replace(/\r\n/g, '\n').split('\n\n');
    for (var i = 0; i < evs.length; i++){
      var dl = [];
      evs[i].split('\n').forEach(function(l){ if (l.indexOf('data:') === 0) dl.push(l.slice(5).trim()); });
      if (!dl.length) continue;
      var o; try { o = JSON.parse(dl.join('\n')); } catch(e){ continue; }
      if (o && o.id === id) return o;
    }
    return null;
  }
  async function rpc(s, method, params, sid, notify){
    var id = notify ? undefined : ++MCPID;
    var msg = { jsonrpc: '2.0', method: method, params: params || {} };
    if (!notify) msg.id = id;
    var h = { 'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream' };
    if (s.token) h['Authorization'] = 'Bearer ' + s.token;
    if (sid) h['Mcp-Session-Id'] = sid;
    var r = await fetch(s.url, { method: 'POST', headers: h, body: JSON.stringify(msg) });
    var nsid = r.headers.get('Mcp-Session-Id') || sid || null;
    if (!r.ok) throw new Error('HTTP ' + r.status);
    if (notify || r.status === 202) return { result: null, sid: nsid };
    var ct = (r.headers.get('Content-Type') || '').toLowerCase();
    var t = await r.text();
    var payload;
    if (ct.indexOf('text/event-stream') > -1) payload = sseFind(t, id);
    else { try { payload = JSON.parse(t); } catch(e){ throw new Error('返回不是 JSON'); } }
    if (!payload) throw new Error('没等到回应');
    if (payload.error) throw new Error(payload.error.message || 'MCP 报错');
    return { result: payload.result, sid: nsid };
  }
  async function handshake(s){
    var a = await rpc(s, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'mojian', version: '1.0.0' } });
    try { await rpc(s, 'notifications/initialized', {}, a.sid, true); } catch(e){}
    return a.sid;
  }
  async function listTools(s){
    var sid = await handshake(s);
    var r = await rpc(s, 'tools/list', {}, sid);
    return (r.result && r.result.tools) || [];
  }

  function spec(m){
    return {
      id: m.id,
      name: m.name || m.url,
      url: m.url,
      auth: m.token ? { type: 'bearer', value: m.token } : { type: 'none' },
      cachedTools: (m.tools || []).map(function(t){
        return { name: t.name, description: t.description || '', inputSchema: t.inputSchema || { type: 'object', properties: {} } };
      }),
      enabledTools: m.tool ? [m.tool] : [],
      triggerKeywords: ''
    };
  }
  function activeSpecs(){
    return mcp().filter(function(m){ return m.on && m.url && m.tools && m.tools.length; }).map(spec);
  }

  var _fetch = window.fetch;
  window.fetch = function(url, opts){
    try {
      if (opts && typeof url === 'string' && url.indexOf('/generate') > -1 && opts.body){
        var b = JSON.parse(opts.body);
        var specs = activeSpecs();
        if (b && b.settings && specs.length){
          b.settings.mcpToolServers = specs;
          b.settings.mcpMeta = { charId: 'kai', userId: S.inbox || 'xiaomie' };
          opts = Object.assign({}, opts, { body: JSON.stringify(b) });
        }
      }
    } catch(e){}
    return _fetch.call(this, url, opts);
  };

  window.mcpList = function(){
    var b = document.getElementById('shbody'); if (!b) return;
    var rows = mcp().map(function(m){
      var n = (m.tools && m.tools.length)
        ? m.tools.length + ' 个工具 · 用「' + (m.tool || '全部') + '」'
        : '还没连上';
      return '<div class="item"><span onclick="mcpTools(\'' + m.id + '\')">' + txt(m.name || m.url) +
        '<em style="display:block;font-size:10px;color:#a0a09c">' + txt(n) + '</em></span>' +
        '<em><span class="sw ' + (m.on ? 'on' : '') + '" onclick="mcpTgl(\'' + m.id + '\')"><i></i></span>' +
        '<b class="x" onclick="mcpDel(\'' + m.id + '\')">×</b></em></div>';
    }).join('') || '<div class="empty">还没加。点下面「新增 MCP」。</div>';
    b.innerHTML = '<div class="card"><div class="eyebrow">MCP</div>' + rows + '</div>' +
      '<div class="card"><div class="item" onclick="mcpAdd()"><span>新增 MCP</span><em>›</em></div>' +
      '<div class="item" onclick="mcpReconnect()"><span>重新连一遍</span><em>›</em></div></div>' +
      '<div class="card"><div class="sub" style="margin:0">开着的 MCP，我回复前会自己决定要不要调（在中继那边执行）。' +
      '这里只负责拉工具清单，所以服务器得允许跨域，拉不到就加不了。</div></div>' +
      '<div class="item" onclick="openChatInfo()"><span>返回</span><em>›</em></div>';
  };
  window.mcpAdd = function(){
    var b = document.getElementById('shbody'); if (!b) return;
    b.innerHTML = '<div class="card"><div class="eyebrow">新增 MCP</div>' +
      '<div class="field"><span>名字</span><input id="mcpName" placeholder="记忆库" maxlength="16"></div>' +
      '<div class="field"><span>链接</span><input id="mcpUrl" placeholder="https://…/mcp" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '<div class="field"><span>密钥</span><input id="mcpTok" placeholder="没有就空着" autocapitalize="off" autocorrect="off" spellcheck="false"></div>' +
      '</div><div class="card"><div class="item" onclick="mcpSave()"><span>连上并保存</span><em>›</em></div>' +
      '<div class="item" onclick="mcpList()"><span>返回</span><em>›</em></div>' +
      '<div class="st" id="mcpMsg"></div></div>';
  };
  window.mcpSave = async function(){
    var msg = document.getElementById('mcpMsg');
    var name = (document.getElementById('mcpName').value || '').trim();
    var url = (document.getElementById('mcpUrl').value || '').trim();
    var token = (document.getElementById('mcpTok').value || '').trim();
    if (!/^https?:\/\//i.test(url)){ if (msg) msg.textContent = '链接要以 http(s):// 开头。'; return; }
    var s = { id: 'm' + Date.now().toString(36), name: name || url.replace(/^https?:\/\//, '').slice(0, 24),
              url: url, token: token, on: 1, tool: '', tools: [] };
    if (msg) msg.textContent = '连接中…';
    try {
      var ts = await listTools(s);
      if (!ts.length) throw new Error('这个服务器没有工具');
      s.tools = ts.map(function(t){ return { name: t.name, description: t.description || '', inputSchema: t.inputSchema || null }; });
      mcp().push(s); persist();
      window.mcpList();
      var m2 = document.getElementById('mcpMsg');
      if (m2) m2.textContent = '连上了，' + s.tools.length + ' 个工具。';
    } catch(e){
      if (msg) msg.textContent = '连不上：' + (e.message || e) + '（多半是它不给跨域）';
    }
  };
  window.mcpTools = function(id){
    var s = find(id); if (!s) return;
    var b = document.getElementById('shbody'); if (!b) return;
    b.innerHTML = '<div class="card"><div class="eyebrow">用哪些工具</div>' +
      '<div class="item" onclick="mcpPick(\'' + id + '\',\'\')"><span>全部工具' + (!s.tool ? ' ✓' : '') + '</span><em>›</em></div>' +
      (s.tools || []).map(function(t){
        return '<div class="item" onclick="mcpPick(\'' + id + '\',\'' + clean(t.name) + '\')"><span>' + txt(t.name) +
          (s.tool === t.name ? ' ✓' : '') +
          '<em style="display:block;font-size:10px;color:#a0a09c">' + txt(String(t.description || '').slice(0, 70)) + '</em></span><em>›</em></div>';
      }).join('') + '</div><div class="item" onclick="mcpList()"><span>返回</span><em>›</em></div>';
  };
  window.mcpPick = function(id, name){ var s = find(id); if (!s) return; s.tool = name; persist(); window.mcpList(); };
  window.mcpTgl = function(id){ var s = find(id); if (!s) return; s.on = s.on ? 0 : 1; persist(); window.mcpList(); };
  window.mcpDel = function(id){ try { S.mcp = mcp().filter(function(x){ return x.id !== id; }); } catch(e){} persist(); window.mcpList(); };
  window.mcpReconnect = async function(){
    for (var i = 0; i < mcp().length; i++){
      var s = mcp()[i];
      try {
        var ts = await listTools(s);
        s.tools = ts.map(function(t){ return { name: t.name, description: t.description || '', inputSchema: t.inputSchema || null }; });
        if (s.tool && !s.tools.some(function(t){ return t.name === s.tool; })) s.tool = '';
      } catch(e){}
    }
    persist(); window.mcpList();
  };

  var _oci = window.openChatInfo;
  window.openChatInfo = function(){
    _oci.apply(this, arguments);
    var b = document.getElementById('shbody'); if (!b) return;
    var on = mcp().filter(function(m){ return m.on; }).length;
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="item" onclick="mcpList()"><span>MCP 工具</span><em>' +
      (mcp().length ? (on ? on + ' 个开着' : '全关了') : '') + '›</em></div>';
    b.insertBefore(card, b.firstChild);
  };
})();



/* ===== 5. 锁住比例：键盘弹出不放大、双指不缩放 ===== */
(function(){
  var vp = document.querySelector('meta[name="viewport"]');
  if (vp) vp.setAttribute('content',
    'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover,interactive-widget=resizes-content');
  var st = document.createElement('style');
  st.textContent =
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}' +
    'input,textarea,select{font-size:16px !important}' +
    'input,textarea,select,button,.item,.tile{touch-action:manipulation}';
  document.head.appendChild(st);
})();





/* ===== 6. 语音朗读：系统内置 / OpenAI 兼容 / ElevenLabs ===== */
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



/* ===== 7. 深度思考：浅军蓝圆角折叠框（收起时显示三行预览） ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '.think{margin:0 0 9px;padding:11px 14px;border:0;border-radius:16px;' +
      'background:rgba(146,163,214,.32);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '.think summary{display:flex;align-items:center;gap:7px;list-style:none;' +
      'font-size:13px;font-weight:400;color:#5c6b9b;letter-spacing:.02em}' +
    '.think summary::-webkit-details-marker{display:none}' +
    '.think summary::before{content:"✦";font-size:12px;color:#6b7aae;margin:0}' +
    '.think summary::after{content:"›";margin-left:auto;font-size:17px;line-height:1;' +
      'color:#6b7aae;transform:rotate(90deg);transition:transform .2s}' +
    '.think[open] summary::after{transform:rotate(-90deg)}' +
    '.thprev{margin-top:8px;padding-left:2px;font-size:12.5px;line-height:1.65;color:#6f7da3;' +
      'white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}' +
    '.think[open] .thprev{display:none}' +
    '.think .tb{margin-top:9px;padding-left:2px;font-size:12.5px;line-height:1.7;color:#6f7da3;' +
      'max-height:280px;overflow-y:auto;-webkit-overflow-scrolling:touch}';
  document.head.appendChild(st);

  function decorate(){
    var list = document.querySelectorAll('.think');
    for (var i = 0; i < list.length; i++){
      var d = list[i];
      if (d.querySelector('.thprev')) continue;
      var tb = d.querySelector('.tb');
      var sum = d.querySelector('summary');
      if (!tb || !sum) continue;
      var t = (tb.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      var p = document.createElement('div');
      p.className = 'thprev';
      p.textContent = t.length > 150 ? t.slice(0, 150) + '…' : t;
      sum.insertAdjacentElement('afterend', p);
    }
  }
  decorate();
  var box = document.getElementById('msgs');
  if (box) new MutationObserver(function(){ setTimeout(decorate, 80); })
    .observe(box, { childList: true, subtree: true });
})();



/* ===== 8. 深度思考：浅军蓝圆角折叠框（收起时显示三行预览） ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '.think{margin:0 0 9px;padding:11px 14px;border:0;border-radius:16px;' +
      'background:rgba(146,163,214,.32);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '.think summary{display:flex;align-items:center;gap:7px;list-style:none;' +
      'font-size:13px;font-weight:400;color:#5c6b9b;letter-spacing:.02em}' +
    '.think summary::-webkit-details-marker{display:none}' +
    '.think summary::before{content:"✦";font-size:12px;color:#6b7aae;margin:0}' +
    '.think summary::after{content:"›";margin-left:auto;font-size:17px;line-height:1;' +
      'color:#6b7aae;transform:rotate(90deg);transition:transform .2s}' +
    '.think[open] summary::after{transform:rotate(-90deg)}' +
    '.thprev{margin-top:8px;padding-left:2px;font-size:12.5px;line-height:1.65;color:#6f7da3;' +
      'white-space:pre-wrap;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}' +
    '.think[open] .thprev{display:none}' +
    '.think .tb{margin-top:9px;padding-left:2px;font-size:12.5px;line-height:1.7;color:#6f7da3;' +
      'max-height:280px;overflow-y:auto;-webkit-overflow-scrolling:touch}';
  document.head.appendChild(st);

  function decorate(){
    var list = document.querySelectorAll('.think');
    for (var i = 0; i < list.length; i++){
      var d = list[i];
      if (d.querySelector('.thprev')) continue;
      var tb = d.querySelector('.tb');
      var sum = d.querySelector('summary');
      if (!tb || !sum) continue;
      var t = (tb.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t) continue;
      var p = document.createElement('div');
      p.className = 'thprev';
      p.textContent = t.length > 150 ? t.slice(0, 150) + '…' : t;
      sum.insertAdjacentElement('afterend', p);
    }
  }
  decorate();
  var box = document.getElementById('msgs');
  if (box) new MutationObserver(function(){ setTimeout(decorate, 80); })
    .observe(box, { childList: true, subtree: true });
})();


/* ===== 9. 语音界面增强：模型名自动纠正 + 模型快捷选择 + 一键拉取 ElevenLabs 音色 ===== */
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



/* ===== 10. 每条回复下面的操作栏：复制 / 重新生成 / 播放语音 / 翻译 ===== */
(function(){
  try {
    var KEY = 'xm_tts';
    var ICON = {
      copy: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9.2" y="9.2" width="11.3" height="11.3" rx="2.6"/><path d="M6.6 15.2H5.7A2.7 2.7 0 0 1 3 12.5v-7A2.7 2.7 0 0 1 5.7 2.8h7a2.7 2.7 0 0 1 2.7 2.7v.9"/></svg>',
      regen: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 12a8.2 8.2 0 1 1-2.5-5.9"/><path d="M20.2 4.3v5.9h-5.9"/></svg>',
      play: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.4h3.3L12.2 5v14l-4.9-4.4H4z"/><path d="M15.9 9.2a4.1 4.1 0 0 1 0 5.6"/><path d="M18.3 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>',
      trans: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.2h8.2M7.1 4v2.2c0 4.2-1.7 7.4-4.1 9.6"/><path d="M4.6 12.4c1.6 2.7 3.9 4.6 6.2 5.2"/><path d="M13.2 20.4l4-10.4 4 10.4"/><path d="M14.7 16.9h5"/></svg>'
    };
    var st = document.createElement('style');
    st.textContent =
      '#msgs .spk{display:none}' +
      '#msgs .acts{display:flex;align-items:center;gap:15px;margin:2px 4px 12px;align-self:stretch;color:#b2b2ae}' +
      '#msgs .acts button{border:0;background:none;padding:2px 0;color:inherit;line-height:0}' +
      '#msgs .acts button:active{color:#0b0b0b}' +
      '#msgs .acts .meta{margin-left:auto;align-self:center}';
    document.head.appendChild(st);

    function getCfg(){
      try {
        return Object.assign({ on: 1, auto: 0, provider: 'system', url: '', key: '', model: '', voice: '', speed: 1 },
          JSON.parse(localStorage.getItem(KEY) || '{}'));
      } catch(e){ return { on: 1, auto: 0, provider: 'system', speed: 1 }; }
    }
    function tip(t){
      var d = document.createElement('div');
      d.textContent = t;
      d.style.cssText = 'position:fixed;left:50%;bottom:130px;transform:translateX(-50%);background:rgba(0,0,0,.82);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:14px;z-index:99;max-width:82vw;text-align:center';
      document.body.appendChild(d);
      setTimeout(function(){ d.remove(); }, 2200);
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
    function sysVoices(){ try { return speechSynthesis.getVoices() || []; } catch(e){ return []; } }

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
          var list = sysVoices(), v = null;
          if (c.voice) v = list.filter(function(x){ return x.name === c.voice; })[0];
          if (!v) v = list.filter(function(x){ return /zh[-_]|Chinese|中文|粤|Yue/i.test(x.lang + ' ' + x.name); })[0];
          if (v) u.voice = v;
          speechSynthesis.speak(u);
        } catch(e){ tip('这台设备的系统语音用不了'); }
        return;
      }
      var url = String(c.url || '').replace(/\/+$/, '');
      if (!url || !c.key){ tip('先去语音设置填地址和 Key'); return; }
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
      tip('合成中…');
      req.then(function(r){
        if (!r.ok) return r.text().then(function(t){ throw new Error(r.status + ' ' + String(t).slice(0, 120)); });
        return r.blob();
      }).then(function(b){
        var ou = URL.createObjectURL(b);
        audio = new Audio(ou);
        audio.playbackRate = sp;
        audio.onended = function(){ try { URL.revokeObjectURL(ou); } catch(e){} audio = null; };
        return audio.play();
      }).catch(function(e){ tip('朗读失败：' + ((e && e.message) || e)); });
    }

    function doCopy(t){
      t = String(t || '');
      if (!t) return;
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(t).then(function(){ tip('复制好了'); }, function(){ fbCopy(t); });
      } else fbCopy(t);
    }
    function fbCopy(t){
      var a = document.createElement('textarea');
      a.value = t;
      a.style.cssText = 'position:fixed;top:-200px;opacity:0';
      document.body.appendChild(a);
      a.select();
      try { document.execCommand('copy'); tip('复制好了'); } catch(e){ tip('复制失败'); }
      a.remove();
    }

    function doRegen(i){
      if (SENDING){ tip('还在生成中，等这条出来'); return; }
      if (!(i >= 0) || i >= CHAT.length){ tip('这条找不到了'); return; }
      var u = -1;
      for (var k = i; k >= 0; k--){ if (CHAT[k].role === 'user'){ u = k; break; } }
      if (u < 0){ tip('这条前面没有你说的话'); return; }
      if (i < CHAT.length - 1 && !confirm('从这条重生成？它后面的都会一起去掉。')) return;
      var text = CHAT[u].text;
      CHAT.splice(u);
      saveChat();
      renderChat(true);
      var inp = document.getElementById('mIn');
      if (!inp){ tip('聊天没开着'); return; }
      inp.value = text;
      tip('重新生成中…');
      sendChat();
    }

    function showCard(txt){
      var d = document.getElementById('transCard');
      if (!d){
        d = document.createElement('div');
        d.id = 'transCard';
        d.style.cssText = 'position:fixed;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom) + 130px);z-index:70;background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:18px;padding:14px 16px;font-size:13.5px;line-height:1.75;box-shadow:0 10px 30px rgba(0,0,0,.16);max-height:46vh;overflow-y:auto';
        d.onclick = function(){ d.remove(); };
        document.body.appendChild(d);
      }
      d.textContent = txt;
    }
    function doTrans(text){
      text = String(text || '').trim();
      if (!text) return;
      if (!S.key || !S.apiUrl || !S.apiKey){ tip('先去设置把参数填好'); return; }
      showCard('翻译中…');
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
          if (n > 20){ clearInterval(t); showCard('翻译超时了，再点一次。'); return; }
          api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0').then(function(j){
            var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
            if (!f) return;
            clearInterval(t);
            api('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
            showCard(f.error ? ('翻译失败：' + f.error) : (parseReply(f.content).text || '（空）'));
          }).catch(function(){});
        }, 2000);
      }).catch(function(e){ showCard('翻译失败：' + e.message); });
    }

    function act(kind, w){
      var i = +w.getAttribute('data-i');
      var b = w.querySelector('.bub.kai');
      var text = b ? b.textContent : '';
      if (kind === 'copy') doCopy(text);
      else if (kind === 'play') speak(text);
      else if (kind === 'regen') doRegen(i);
      else if (kind === 'trans') doTrans(text);
    }

    var lastText = '';
    function build(){
      var box = document.getElementById('msgs');
      if (!box) return;
      var wraps = box.querySelectorAll('.wrap');
      for (var i = 0; i < wraps.length; i++){
        var w = wraps[i];
        var nx = w.nextElementSibling;
        if (nx && nx.classList && nx.classList.contains('acts')) continue;
        var bub = w.querySelector('.bub.kai');
        if (!bub || bub.classList.contains('typing')) continue;
        var row = document.createElement('div');
        row.className = 'acts';
        ['copy', 'regen', 'play', 'trans'].forEach(function(k){
          var b = document.createElement('button');
          b.innerHTML = ICON[k];
          b.onclick = function(ev){ ev.stopPropagation(); act(k, w); };
          row.appendChild(b);
        });
        var meta = w.querySelector('.meta');
        if (meta) row.appendChild(meta);
        if (w.parentNode) w.parentNode.insertBefore(row, w.nextSibling);
      }
      var c = getCfg();
      if (+c.on && +c.auto){
        var els = box.querySelectorAll('.bub.kai:not(.typing)');
        var last = els[els.length - 1];
        if (last){
          var t = last.textContent.trim();
          if (t && t !== lastText){ lastText = t; speak(t); }
        }
      }
    }

    var pend = 0;
    function hook(){
      var body = document.getElementById('ovbody');
      if (!body || body.getAttribute('data-actsw')) return;
      body.setAttribute('data-actsw', '1');
      new MutationObserver(function(){
        if (pend) return;
        pend = setTimeout(function(){ pend = 0; build(); }, 90);
      }).observe(body, { childList: true, subtree: true });
      build();
    }
    hook();
    new MutationObserver(hook).observe(document.body, { childList: true, subtree: true });

    if ('serviceWorker' in navigator){
      navigator.serviceWorker.addEventListener('message', function(e){
        if (e.data && e.data.type === 'kai-new'){ try { pullOutbox(); } catch(err){} }
      });
    }
    setInterval(function(){ if (!document.hidden){ try { pullOutbox(); } catch(e){} } }, 20000);
  } catch(e){ console.warn('acts block failed', e); }
})();


/* ===== 11. 操作栏补丁：每次重绘后直接插 + 加载自检 ===== */
(function(){
  function tip(t){
    var d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);background:rgba(0,0,0,.85);color:#fff;font-size:12.5px;padding:9px 16px;border-radius:14px;z-index:99;max-width:82vw;text-align:center';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 2600);
  }

  // 轻轻动一下 #ovbody，把第 11 块的观察器叫醒
  function poke(){
    var body = document.getElementById('ovbody');
    if (!body) return;
    var d = document.createElement('i');
    d.style.cssText = 'display:none';
    body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 40);
  }

  // 每次重绘聊天后立刻 poke 一次
  function patchRender(){
    if (typeof window.renderChat !== 'function') return false;
    if (window.renderChat.__acts) return true;
    var old = window.renderChat;
    var fn = function(){
      var r = old.apply(this, arguments);
      poke();
      return r;
    };
    fn.__acts = 1;
    window.renderChat = fn;
    return true;
  }
  var tries = 0;
  var t = setInterval(function(){
    tries++;
    if (patchRender() || tries > 40) clearInterval(t);
  }, 250);

  // 点开聊天时也 poke 一次
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('.tile') : null;
    if (el && el.dataset && el.dataset.k === 'chat') setTimeout(poke, 400);
  }, true);


  setTimeout(function(){
    var box = document.getElementById('msgs');
    if (!box) return;
    var n = box.querySelectorAll('.wrap').length;
    if (n && !box.querySelectorAll('.acts').length) tip('找到 ' + n + ' 条回复，但操作栏没插进去');
  }, 5000);
})();


/* ===== 12. 翻译：在回复下面开一个译文框，自带朗读 ===== */
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


/* ===== 13. 翻译：在回复下面开一个译文框，自带朗读 ===== */
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

  // 和上面那栏「播放语音」同一个图标
  var SAY = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.4h3.3L12.2 5v14l-4.9-4.4H4z"/><path d="M15.9 9.2a4.1 4.1 0 0 1 0 5.6"/><path d="M18.3 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>';

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
    say.style.cssText = 'border:0;background:none;padding:0;color:inherit;line-height:0';
    say.innerHTML = SAY;
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

(function(){
  function send(){var n=document.querySelectorAll('button,div,span,a');
    for(var i=0;i<n.length;i++)if((n[i].textContent||'').trim()==='Send')return n[i];return null;}
  function bar(){var s=send();if(!s)return null;var p=s;
    for(var i=0;i<3&&p.parentElement;i++)p=p.parentElement;return p;}
  var raf=0;
  function fit(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;
    var b=bar();if(!b)return;
    var vv=window.visualViewport||{height:innerHeight,offsetTop:0};
    var kb=Math.max(0,innerHeight-vv.height-vv.offsetTop);
    b.style.transform=kb?'translateY(-'+kb+'px)':'';
    b.style.zIndex='9999';});}
  function bottom(){var best=null,bh=0,all=document.querySelectorAll('div,main,section,ul');
    for(var i=0;i<all.length;i++){var e=all[i];
      if(e.scrollHeight>e.clientHeight+30&&e.clientHeight>100&&e.scrollHeight>bh){bh=e.scrollHeight;best=e;}}
    if(best)best.scrollTop=best.scrollHeight;}
  if(window.visualViewport){visualViewport.addEventListener('resize',fit);visualViewport.addEventListener('scroll',fit);}
  addEventListener('resize',fit);
  document.addEventListener('focusin',function(){setTimeout(function(){fit();bottom();},300);});
  document.addEventListener('click',function(e){
    if((e.target.textContent||'').trim()==='Send')setTimeout(bottom,400);},true);
})();



(function(){
  var hk=null;
  function go(){var b=document.getElementById('msgs');if(b)b.scrollTop=b.scrollHeight;}
  function go2(){go();setTimeout(go,120);setTimeout(go,400);setTimeout(go,900);}
  function hook(){
    var b=document.getElementById('msgs');
    if(!b||b===hk)return;
    hk=b;
    new MutationObserver(function(){setTimeout(go,60);}).observe(b,{childList:true,subtree:true});
    go2();
  }
  setInterval(hook,800);
  document.addEventListener('click',function(e){
    var t=(e.target.textContent||'').trim();
    if(t==='Send'||t==='聊天')setTimeout(go2,60);
  },true);
  document.addEventListener('focusin',function(){setTimeout(go,350);});
})();

/* ===== 桌面图标：极简几何 v2 ===== */
(function(){
  var BG='#F0EBE2', IN='#35322E', CL='#BE7F60', MA='#A9839A', BL='#7E93A6', OL='#8E9A72', YE='#C3A05C';
  var I = {
    chat:    "<rect x='126' y='131' width='260' height='196' rx='58' fill='"+CL+"'/><path d='M190 321L190 381L250 321Z' fill='"+CL+"'/><circle cx='206' cy='229' r='14' fill='"+BG+"'/><circle cx='256' cy='229' r='14' fill='"+BG+"'/><circle cx='306' cy='229' r='14' fill='"+BG+"'/>",
    netease: "<circle cx='256' cy='256' r='124' fill='"+IN+"'/><circle cx='256' cy='256' r='46' fill='"+BG+"'/><circle cx='256' cy='256' r='13' fill='"+IN+"'/>",
    douyin:  "<rect x='218' y='133' width='20' height='200' rx='10' fill='"+MA+"'/><rect x='358' y='133' width='20' height='200' rx='10' fill='"+MA+"'/><rect x='218' y='133' width='160' height='38' rx='12' fill='"+MA+"'/><ellipse cx='186' cy='333' rx='58' ry='44' fill='"+MA+"'/><ellipse cx='326' cy='333' rx='58' ry='44' fill='"+MA+"'/>",
    ig:      "<rect x='126' y='126' width='260' height='260' rx='76' fill='"+BL+"'/><circle cx='256' cy='256' r='88' fill='none' stroke='"+BG+"' stroke-width='18'/><circle cx='256' cy='256' r='34' fill='"+BG+"'/><circle cx='336' cy='176' r='15' fill='"+BG+"'/>",
    album:   "<circle cx='332' cy='172' r='42' fill='"+YE+"'/><path d='M116 372L206 244L276 336L332 276L396 372Z' fill='"+OL+"'/>",
    cal:     "<rect x='126' y='126' width='260' height='260' rx='60' fill='"+YE+"'/><rect x='154' y='192' width='204' height='20' rx='10' fill='"+BG+"'/><circle cx='196' cy='262' r='16' fill='"+BG+"'/><circle cx='256' cy='262' r='16' fill='"+BG+"'/><circle cx='316' cy='262' r='16' fill='"+BG+"'/><circle cx='196' cy='320' r='16' fill='"+BG+"'/><circle cx='256' cy='320' r='16' fill='"+BG+"'/><circle cx='316' cy='320' r='16' fill='"+BG+"'/>",
    days:    "<path d='M256 382C180 326 116 278 116 206C116 162 148 130 188 130C216 130 240 146 256 170C272 146 296 130 324 130C364 130 396 162 396 206C396 278 332 326 256 382Z' fill='"+CL+"'/>",
    drawer:  "<rect x='116' y='168' width='280' height='44' rx='22' fill='"+BL+"'/><rect x='146' y='234' width='220' height='44' rx='22' fill='"+BL+"'/><rect x='176' y='300' width='160' height='44' rx='22' fill='"+BL+"'/>",
    watch:   "<path d='M116 256C170 160 342 160 396 256C342 352 170 352 116 256Z' fill='"+IN+"'/><circle cx='256' cy='256' r='56' fill='"+BG+"'/><circle cx='256' cy='256' r='24' fill='"+IN+"'/>",
    set:     "<path d='M126 186L386 186' stroke='"+MA+"' stroke-width='18' stroke-linecap='round'/><path d='M126 256L386 256' stroke='"+MA+"' stroke-width='18' stroke-linecap='round'/><path d='M126 326L386 326' stroke='"+MA+"' stroke-width='18' stroke-linecap='round'/><circle cx='300' cy='186' r='26' fill='"+BG+"' stroke='"+MA+"' stroke-width='16'/><circle cx='196' cy='256' r='26' fill='"+BG+"' stroke='"+MA+"' stroke-width='16'/><circle cx='330' cy='326' r='26' fill='"+BG+"' stroke='"+MA+"' stroke-width='16'/>"
  };
  var U = {};
  Object.keys(I).forEach(function(k){
    U[k] = 'url("data:image/svg+xml,' + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>" +
      "<rect width='512' height='512' fill='" + BG + "'/>" + I[k] + "</svg>") + '")';
  });
  function go(){
    document.querySelectorAll('.tile').forEach(function(t){
      var u = U[t.dataset.k], e = t.querySelector('.ico');
      if (!u || !e) return;
      e.style.backgroundImage = u;
      e.style.backgroundSize = 'cover';
      e.style.backgroundPosition = 'center';
      e.style.opacity = '1';
    });
  }
  go();
  setInterval(go, 900);
})();

/* ===== 14. 桌面日历：iOS 列表式，点日期进当天详情 ===== */
(function(){
  var CREAM='#F0EBE2', INK='#35322E', CLAY='#BE7F60', MUTE='#A79E90', LINE='#E4DCCE';
  var MNAME=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  var KEY='xm_evts', EV={}, CUR='', SAVE_TOP=0;

  try {
    var raw=JSON.parse(localStorage.getItem(KEY)||'{}')||{};
    Object.keys(raw).forEach(function(k){
      var a=raw[k]; if(!Array.isArray(a)) return;
      EV[k]=a.map(function(x){
        if(typeof x==='string') return {tm:'',t:x};
        return {tm:(x&&x.tm)||'', t:(x&&x.t)||''};
      }).filter(function(x){ return x.t; });
    });
  } catch(e){ EV={}; }

  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(EV)); }catch(e){} }
  function txt(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function pad(n){ return String(n).padStart(2,'0'); }
  function kof(y,m,d){ return y+'-'+pad(m+1)+'-'+pad(d); }
  var n0=new Date();
  var TODAY=kof(n0.getFullYear(),n0.getMonth(),n0.getDate());

var st=document.createElement('style');
  st.textContent=
    '#calWrap,.wid,.dBig,.dSub,.dRow,.dAdd,#calTodayBtn,.dBack{font-family:-apple-system,BlinkMacSystemFont,'+
      '"PingFang SC","Hiragino Sans GB","Helvetica Neue",sans-serif}'+
    '.wid{background:'+CREAM+' !important;border:1px solid rgba(0,0,0,.05) !important}'+
    '.wid .wdt{color:'+CLAY+' !important;font-weight:300 !important}'+
    '.wid .wdn{color:'+INK+' !important;font-weight:200 !important}'+
    '.wid .wds{color:'+MUTE+' !important;font-weight:300 !important}'+
    '#calWrap .mHead{font-size:30px;font-weight:200;color:'+INK+';letter-spacing:.5px;margin:28px 0 6px 2px}'+
    '#calWrap .mHead:first-child{margin-top:2px}'+
    '#calWrap .mHead span{font-size:12px;font-weight:300;color:'+MUTE+';margin-left:8px;letter-spacing:.02em}'+
    '#calWrap .wkHead{position:sticky;top:0;z-index:3;background:'+CREAM+';display:grid;'+
      'grid-template-columns:repeat(7,1fr);padding:8px 0 4px}'+
    '#calWrap .wkHead span{text-align:center;font-size:11px;font-weight:300;color:'+MUTE+'}'+
    '#calWrap .mRow{display:grid;grid-template-columns:repeat(7,1fr);border-top:1px solid #EBE4D9;min-height:60px}'+
    '#calWrap .cell{padding:6px 3px 7px;text-align:center;overflow:hidden}'+
    '#calWrap .cell .n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;'+
      'border-radius:50%;font-size:18px;font-weight:200;color:'+INK+'}'+
    '#calWrap .cell.dim .n{color:#D6CEC0}'+
    '#calWrap .cell.tod .n{background:rgba(190,127,96,.16);color:#A2653F;font-weight:400}'+
    '#calWrap .chip{display:block;box-sizing:border-box;margin:3px 0 0;max-width:100%;font-size:8.5px;'+
      'font-weight:300;line-height:1.7;padding:1px 3px;border-radius:5px;white-space:nowrap;'+
      'overflow:hidden;text-overflow:ellipsis;text-align:center}'+
    '#calWrap .more{display:block;font-size:8px;font-weight:300;color:'+MUTE+';margin-top:2px}'+
    '#calWrap .chip.c0{background:rgba(190,127,96,.12);color:#B08A72}'+
    '#calWrap .chip.c1{background:rgba(126,147,166,.12);color:#8496A6}'+
    '#calWrap .chip.c2{background:rgba(142,154,114,.12);color:#939C82}'+
    '#calWrap .chip.c3{background:rgba(169,131,154,.12);color:#A18B99}'+
    '#calWrap .chip.c4{background:rgba(195,160,92,.12);color:#B29B6E}'+
    '#calTodayBtn{position:fixed;left:16px;bottom:calc(env(safe-area-inset-bottom) + 18px);z-index:25;'+
      'background:rgba(255,255,255,.72);border:1px solid rgba(0,0,0,.06);border-radius:20px;'+
      'padding:9px 20px;font-size:13px;font-weight:300;color:'+INK+';'+
      'box-shadow:0 2px 10px rgba(0,0,0,.05);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}'+
    '.dBack{display:inline-block;font-size:13px;font-weight:300;color:#A2653F;padding:2px 0 10px}'+
    '.dBig{font-size:28px;font-weight:200;color:'+INK+';letter-spacing:.5px}'+
    '.dSub{font-size:12px;font-weight:300;color:'+MUTE+';margin:6px 0 18px}'+
    '.dRow{display:flex;align-items:center;gap:10px;padding:13px 2px;border-bottom:1px solid #EBE4D9}'+
    '.dRow .bar{width:3px;height:24px;border-radius:2px;flex:0 0 auto;opacity:.5}'+
    '.dRow b{font-size:12px;font-weight:300;color:'+MUTE+';width:44px;flex:0 0 auto}'+
    '.dRow span{flex:1;font-size:15px;font-weight:300;color:'+INK+';word-break:break-word}'+
    '.dRow em{font-style:normal;color:#D3CABC;font-size:17px;line-height:1;padding:2px 4px}'+
    '.bar.c0{background:#BE7F60}.bar.c1{background:#7E93A6}.bar.c2{background:#8E9A72}'+
    '.bar.c3{background:#A9839A}.bar.c4{background:#C3A05C}'+
    '.dEmpty{font-size:13px;font-weight:300;color:'+MUTE+';padding:18px 2px}'+
    '.dAdd{display:flex;gap:8px;margin-top:20px}'+
    '.dAdd input[type=time]{width:96px;flex:0 0 auto;font-size:15px;font-weight:300;padding:11px 8px;'+
      'border-radius:12px;border:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.7);color:'+INK+'}'+
    '.dAdd #calIn{flex:1;min-width:0;font-size:16px;font-weight:300;padding:11px 13px;border-radius:12px;'+
      'border:1px solid rgba(0,0,0,.07);background:rgba(255,255,255,.7);color:'+INK+'}'+
    '.dAdd button{flex:0 0 auto;width:46px;font-size:24px;font-weight:200;line-height:1;padding:0;'+
      'border:0;border-radius:12px;background:rgba(190,127,96,.16);color:#A2653F}';
  document.head.appendChild(st);

  function cellHtml(kk,n){
    var ev=EV[kk]||[], s='';
    for(var i=0;i<ev.length&&i<2;i++) s+='<span class="chip c'+(i%5)+'">'+txt(ev[i].t)+'</span>';
    if(ev.length>2) s+='<span class="more">+'+(ev.length-2)+'</span>';
    return '<div class="cell'+(kk===TODAY?' tod':'')+'" data-k="'+kk+'">'+
      '<span class="n">'+n+'</span>'+s+'</div>';
  }
  function monthRows(y,m){
    var first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
    var rows='', cells='', i;
    for(i=0;i<first;i++) cells+='<div class="cell dim"></div>';
    for(i=1;i<=days;i++){
      cells+=cellHtml(kof(y,m,i),i);
      if((first+i)%7===0){ rows+='<div class="mRow">'+cells+'</div>'; cells=''; }
    }
    if(cells){
      var p=(7-(first+days)%7)%7;
      for(i=0;i<p;i++) cells+='<div class="cell dim"></div>';
      rows+='<div class="mRow">'+cells+'</div>';
    }
    return rows;
  }
  function monthsHtml(){
    var n=new Date(), y=n.getFullYear(), m=n.getMonth();
    var out='<div id="calWrap">', head=false;
    for(var i=-12;i<=11;i++){
      var d0=new Date(y,m+i,1), yy=d0.getFullYear(), mm=d0.getMonth();
      out+='<div class="mHead"'+(i===0?' id="calCur"':'')+'>'+MNAME[mm]+'<span>'+yy+'</span></div>';
      if(!head){
        out+='<div class="wkHead"><span>日</span><span>一</span><span>二</span><span>三</span>'+
             '<span>四</span><span>五</span><span>六</span></div>';
        head=true;
      }
      out+=monthRows(yy,mm);
    }
    return out+'</div>';
  }

  function paintDay(){
    var box=document.getElementById('dList'); if(!box) return;
    var ev=EV[CUR]||[], s='';
    ev.forEach(function(o,i){
      s+='<div class="dRow"><i class="bar c'+(i%5)+'"></i><b>'+(o.tm||'全天')+'</b>'+
         '<span>'+txt(o.t)+'</span><em data-i="'+i+'">×</em></div>';
    });
    if(!ev.length) s+='<div class="dEmpty">这天还没有安排。</div>';
    s+='<div class="dAdd"><input id="calTm" type="time"><input id="calIn" type="text" '+
       'placeholder="写点什么…" maxlength="40"><button id="calBtn">+</button></div>';
    box.innerHTML=s;
    var b=document.getElementById('calBtn'); if(b) b.onclick=doAdd;
    var inp=document.getElementById('calIn');
    if(inp) inp.addEventListener('keydown',function(e){ if(e.key==='Enter') doAdd(); });
  }
  function doAdd(){
    var t=document.getElementById('calIn'), tm=document.getElementById('calTm');
    if(!t||!CUR) return;
    var v=t.value.trim(); if(!v) return;
    if(!EV[CUR]) EV[CUR]=[];
    EV[CUR].push({ tm:(tm&&tm.value)||'', t:v });
    EV[CUR].sort(function(a,b){ return (a.tm||'99:99').localeCompare(b.tm||'99:99'); });
    save(); paintDay();
  }
  window.calDel=function(i){
    if(!CUR||!EV[CUR]) return;
    EV[CUR].splice(i,1);
    if(!EV[CUR].length) delete EV[CUR];
    save(); paintDay();
  };
  window.calDay=function(kk){
    var body=document.getElementById('ovbody'); if(!body) return;
    SAVE_TOP=body.scrollTop;
    CUR=kk;
    var p=kk.split('-'), d=new Date(+p[0],+p[1]-1,+p[2]);
    var wd='日一二三四五六'[d.getDay()];
    body.className='';
    body.innerHTML='<div class="dBack" onclick="calBack()">‹ 日历</div>'+
      '<div class="dBig">'+(d.getMonth()+1)+'月'+d.getDate()+'日</div>'+
      '<div class="dSub">'+d.getFullYear()+' 年 · 星期'+wd+'</div><div id="dList"></div>';
    paintDay();
    body.scrollTop=0;
  };
  window.calBack=function(){
    var body=document.getElementById('ovbody'); if(!body) return;
    CUR='';
    body.innerHTML=monthsHtml()+'<div id="calTodayBtn" onclick="calToday()">今天</div>';
    body.scrollTop=SAVE_TOP;
  };
  window.calToday=function(){
    var body=document.getElementById('ovbody'); if(!body) return;
    var cur=document.getElementById('calCur'); if(!cur) return;
    var r=cur.getBoundingClientRect(), br=body.getBoundingClientRect();
    var top=body.scrollTop+(r.top-br.top)-6;
    if(body.scrollTo) body.scrollTo({ top:top, behavior:'smooth' }); else body.scrollTop=top;
  };
  window.openCal=function(){
    var ov=document.getElementById('ov'), body=document.getElementById('ovbody'),
        title=document.getElementById('ovTitle');
    if(!ov||!body||!title) return;
    title.textContent='日历';
    CUR='';
    body.className='';
    body.innerHTML=monthsHtml()+'<div id="calTodayBtn" onclick="calToday()">今天</div>';
    ov.classList.remove('hide');
    setTimeout(function(){
      var cur=document.getElementById('calCur'); if(!cur) return;
      var r=cur.getBoundingClientRect(), br=body.getBoundingClientRect();
      body.scrollTop += (r.top-br.top)-6;
    },40);
  };

  document.addEventListener('click',function(e){
    var t=e.target; if(!t||!t.closest) return;
    var bk=t.closest('.ovtop .back');
    if(bk&&document.getElementById('dList')){
      e.stopPropagation(); e.preventDefault();
      window.calBack(); return;
    }
    var de=t.closest('.dRow em');
    if(de&&de.dataset.i!=null){ window.calDel(+de.dataset.i); return; }
    var c=t.closest('#calWrap .cell');
    if(c&&c.dataset.k){ window.calDay(c.dataset.k); return; }
    if(t.closest('.wid')){
      try { if(EDIT) return; } catch(err){}
      window.openCal();
    }
  },true);
})();


/* ===== 15. 让聊天能看到日历里的事项 ===== */
(function(){
  function data(){
    try { return JSON.parse(localStorage.getItem('xm_evts') || '{}') || {}; } catch(e){ return {}; }
  }
  function rel(n){
    if (n === 0) return '今天';
    if (n === 1) return '明天';
    if (n === -1) return '昨天';
    return n > 0 ? (n + ' 天后') : (Math.abs(n) + ' 天前');
  }
  function block(){
    var EV = data(), keys = Object.keys(EV).sort();
    if (!keys.length) return '';
    var t = new Date(); t.setHours(0, 0, 0, 0), out = [];
    for (var i = 0; i < keys.length && out.length < 20; i++){
      var p = keys[i].split('-');
      if (p.length !== 3) continue;
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var n = Math.round((d - t) / 864e5);
      if (n < -3 || n > 60) continue;
      var arr = EV[keys[i]] || [];
      if (!arr.length) continue;
      out.push(keys[i] + '（' + rel(n) + '）：' + arr.join('、'));
    }
    if (!out.length) return '';
    return '\n\n【小咩日历里自己记的事】她自己在这个 app 的日历里加的。你心里有数，可以偶尔主动提一句，但别当新消息复述，也别每条都问：\n· '
      + out.join('\n· ');
  }
  var MARK = '【小咩日历里自己记的事】';
  function wrap(){
    var f = window.buildMessages;
    if (typeof f !== 'function' || f.__ev) return typeof f === 'function';
    var orig = f;
    var fn = function(){
      var msgs = orig.apply(this, arguments);
      try {
        var b = block();
        if (b && msgs && msgs[0] && msgs[0].role === 'system'
            && msgs[0].content.indexOf(MARK) < 0){
          msgs[0].content += b;
        }
      } catch(e){}
      return msgs;
    };
    fn.__ev = true;
    window.buildMessages = fn;
    return true;
  }
  if (!wrap()){ var n = 0, t = setInterval(function(){ if (wrap() || ++n > 40) clearInterval(t); }, 300); }
  setInterval(wrap, 2000);
})();

/* ===== 16. 周六日淡枣红（大日历 + 桌面日期块） ===== */
(function(){
  var WK = '#B87C7C';

  var st = document.createElement('style');
  st.textContent =
    // 大日历：第 1 列是周日、第 7 列是周六
    '#calWrap .mRow .cell:nth-child(1) .n,'+
    '#calWrap .mRow .cell:nth-child(7) .n{color:'+WK+' !important}'+
    // 今天那颗圆点还是白字，不能被盖掉
    '#calWrap .mRow .cell.tod .n{color:#fff !important}'+
    // 表头「日」「六」一起染
    '#calWrap .wkHead span:nth-child(1),'+
    '#calWrap .wkHead span:nth-child(7){color:'+WK+' !important}'+
    // 桌面那个大日期块：周六日整块跟着变
    '.wid.we .wdt{color:'+WK+' !important}';
  document.head.appendChild(st);

  function sync(){
    var w = document.querySelector('.wid');
    if (!w) return;
    var g = new Date().getDay();
    w.classList.toggle('we', g === 0 || g === 6);
  }
  sync();
  setInterval(sync, 800);
})();

/* ===== 17. 周六日淡枣红：日历 app ===== */
(function(){
  var WK = '#B87C7C';

  var st = document.createElement('style');
  st.textContent =
    '.cal .wd.we{color:'+WK+' !important}'+
    '.cal .d.we{color:'+WK+' !important}'+
    '.cal .d.now{color:#fff !important}';
  document.head.appendChild(st);

  function nv(){
    var d = new Date(), y = d.getFullYear(), m = d.getMonth();
    var first = new Date(y, m, 1).getDay(), n = new Date(y, m+1, 0).getDate();
    var c = '日一二三四五六'.split('').map(function(w, i){
      return '<div class="wd' + (i === 0 || i === 6 ? ' we' : '') + '">' + w + '</div>';
    }).join('');
    for (var i = 0; i < first; i++) c += '<div></div>';
    for (var j = 1; j <= n; j++){
      var g = (first + j - 1) % 7;
      c += '<div class="d' + (j === d.getDate() ? ' now' : '') +
           (g === 0 || g === 6 ? ' we' : '') + '">' + j + '</div>';
    }
    return '<div class="card"><div class="eyebrow">' + y + '</div>' +
      '<div class="big" style="margin-bottom:16px">' + (m + 1) + ' 月</div>' +
      '<div class="cal">' + c + '</div></div>';
  }

  window.vCal = nv;
  try { if (typeof APPS !== 'undefined' && APPS.cal) APPS.cal.v = nv; } catch(e){}
})();

/* ===== 18. 去描边 · 星期栏半透明 · 顶栏喇叭图标 · 日历 app 同步大日历 ===== */
(function(){
  var SAY = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M4 9.4h3.3L12.2 5v14l-4.9-4.4H4z"/>'+
    '<path d="M15.9 9.2a4.1 4.1 0 0 1 0 5.6"/>'+
    '<path d="M18.3 6.8a7.5 7.5 0 0 1 0 10.4"/></svg>';

  var st = document.createElement('style');
  st.textContent =
    // 图标去掉深色描边
    '.ico{border:0 !important;box-shadow:0 1px 5px rgba(0,0,0,.04) !important}'+
    // 星期栏半透明 + 毛玻璃
    '#calWrap .wkHead{background:rgba(240,235,226,.68) !important;'+
      'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}'+
    // 只有聊天页顶栏有 ··· ，用这个当开关
    '#ov .ovtop .ttsTop{display:none}'+
    '#ov .ovtop:has(.ovact) .ttsTop{display:flex;align-items:center;color:#0b0b0b}';
  document.head.appendChild(st);

  // 把顶栏那个 🔊 换成喇叭图标
  function skin(){
    var b = document.querySelector('#ov .ovtop .ttsTop');
    if (!b || b.dataset.svg) return;
    b.dataset.svg = '1';
    b.textContent = '';
    b.innerHTML = SAY;
    b.style.fontSize = '0';
    b.style.lineHeight = '0';
    b.style.opacity = '.55';
    b.style.padding = '2px 8px';
  }
  skin();
  setInterval(skin, 500);

  // 点「日历」这个 app，直接走大日历那套渲染
  var _oa = window.openApp;
  if (typeof _oa === 'function' && !_oa.__cal){
    var fn = function(k){
      var r = _oa.apply(this, arguments);
      if (k === 'cal' && typeof window.openCal === 'function') window.openCal();
      return r;
    };
    fn.__cal = true;
    window.openApp = fn;
  }
})();

/* ===== 19. 后台生成：切后台也照样把回复收回来 ===== */
(function(){
  // ① 清掉僵尸「···」。SENDING 为真说明是正在等的那个，别动
  function cleanTyping(){
    try {
      if (typeof SENDING !== 'undefined' && SENDING) return;
      if (!Array.isArray(CHAT) || !CHAT.length) return;
      var last = CHAT[CHAT.length - 1];
      if (last && last.typing){
        CHAT.pop(); saveChat();
        if (typeof renderChat === 'function') renderChat(true);
      }
    } catch(e){}
  }
  cleanTyping();

  // ② 推送到了 / 点了通知 → 立刻去拉
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.addEventListener('message', function(e){
      var d = e.data || {};
      if (d.type === 'kai-new' || d.type === 'open-chat'){
        setTimeout(function(){
          try { if (typeof pullOutbox === 'function') pullOutbox(); } catch(err){}
        }, 400);
      }
    });
  }

  // ③ 回到前台：先清僵尸，再拉
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) return;
    cleanTyping();
    setTimeout(function(){
      try { if (typeof pullOutbox === 'function') pullOutbox(); } catch(e){}
    }, 500);
  });

  // ④ 前台每 25 秒兜底拉一次
  setInterval(function(){
    if (document.hidden) return;
    try {
      if (typeof SENDING !== 'undefined' && SENDING) return;
      if (typeof pullOutbox === 'function') pullOutbox();
    } catch(e){}
  }, 25000);

  // ⑤ 拉回来真回复时，把之前那句「没等到回复」抹掉
  var _po = window.pullOutbox;
  if (typeof _po === 'function' && !_po.__bg){
    var fn = async function(){
      var before = Array.isArray(CHAT) ? CHAT.length : 0;
      var r = await _po.apply(this, arguments);
      try {
        if (Array.isArray(CHAT) && CHAT.length > before){
          for (var i = CHAT.length - 2; i >= 0; i--){
            var m = CHAT[i];
            if (m && m.role === 'assistant' && m.text && m.text.indexOf('没等到回复') > -1){
              CHAT.splice(i, 1);
            }
          }
          saveChat();
          if (typeof renderChat === 'function') renderChat(true);
        }
      } catch(e){}
      return r;
    };
    fn.__bg = true;
    window.pullOutbox = fn;
  }
})();

/* ===== 20. 计算器：不用算就一趟，要算才两趟 ===== */
(function(){
  var TAG = /\[\[\s*(?:算|calc)\s*\]\]([\s\S]?)\[\[\s\/\s*(?:算|calc)\s*\]\]/g;

  /* ---------- 引擎 ---------- */
  function fmt(n){
    if (typeof n !== 'number' || !isFinite(n)) return String(n);
    if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
    var s = n.toPrecision(12);
    if (s.indexOf('e') < 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return String(parseFloat(s));
  }
  function fact(n){
    if (n < 0 || n !== Math.floor(n) || n > 170) throw new Error('bad');
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  var OK = ['sqrt','cbrt','abs','sin','cos','tan','asin','acos','atan','atan2','ln','log','log2','log10',
            'exp','pow','floor','ceil','round','min','max','sign','sgn','fact','pi','PI','e','E'];
  function ev(src){
    var s = String(src).replace(/[，,\s]/g,'').replace(/×/g,'*').replace(/÷/g,'/')
      .replace(/−/g,'-').replace(/（/g,'(').replace(/）/g,')').replace(/π/g,'pi')
      .replace(/(\d)[eE]([+-]?\d)/g,'$1*10**$2').replace(/\^/g,'**');
    if (!/^[0-9a-zA-Z_+\-*/%.()!<>=]+$/.test(s)) throw new Error('bad');
    var names = s.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    for (var i = 0; i < names.length; i++) if (OK.indexOf(names[i]) < 0) throw new Error('bad');
    s = s.replace(/(\d+(?:\.\d+)?)!/g, 'fact($1)');
    var v = Function(
      'var fact=arguments[0],PI=Math.PI,pi=Math.PI,E=Math.E,e=Math.E,'+
      'sqrt=Math.sqrt,cbrt=Math.cbrt,abs=Math.abs,sign=Math.sign,sgn=Math.sign,'+
      'sin=Math.sin,cos=Math.cos,tan=Math.tan,asin=Math.asin,acos=Math.acos,'+
      'atan=Math.atan,atan2=Math.atan2,ln=Math.log,exp=Math.exp,pow=Math.pow,'+
      'floor=Math.floor,ceil=Math.ceil,round=Math.round,min=Math.min,max=Math.max,'+
      'log=function(a,b){return b===undefined?Math.log10(a):Math.log(b)/Math.log(a)},'+
      'log2=Math.log2,log10=Math.log10;return ('+s+');'
    )(fact);
    if (typeof v !== 'number' || !isFinite(v)) throw new Error('bad');
    return v;
  }
  function hasTag(t){ return /\[\[\s*(?:算|calc)\s*\]\]/.test(String(t || '')); }
  function exprsIn(t){
    var out = [], m; TAG.lastIndex = 0;
    while ((m = TAG.exec(String(t)))) out.push(m[1]);
    return out;
  }
  function fixText(t){
    if (!t || !hasTag(t)) return t;
    return String(t).replace(TAG, function(all, e){
      try { return fmt(ev(e)); } catch(err){ return '（算不了）'; }
    });
  }

  /* ---------- 渲染兜底：把残留标签就地换成数字 ---------- */
  var _rc = window.renderChat;
  if (typeof _rc === 'function' && !_rc.__calc){
    var fr = function(){
      try {
        if (Array.isArray(CHAT)){
          var hit = false;
          CHAT.forEach(function(m){
            if (!m || m.role !== 'assistant') return;
            var a = fixText(m.text);  if (a !== m.text){  m.text = a;  hit = true; }
            var b = fixText(m.think); if (b !== m.think){ m.think = b; hit = true; }
          });
          if (hit) saveChat();
        }
      } catch(e){}
      return _rc.apply(this, arguments);
    };
    fr.__calc = true;
    window.renderChat = fr;
  }

  /* ---------- 第一趟：告诉模型两种写法 ---------- */
  var MARK = '【计算器 · 两种用法】';
  var _bm = window.buildMessages;
  if (typeof _bm === 'function' && !_bm.__calc){
    var fb = function(){
      var m = _bm.apply(this, arguments);
      try {
        if (m && m[0] && m[0].role === 'system' && m[0].content.indexOf(MARK) < 0){
          m[0].content += '\n\n' + MARK + '\n'
            + '要算数就写成 [[算]]算式[[/算]]，程序会算好。两种写法，按需要选：\n'
            + 'A. 只是报个数字 → 照常写句子，标签嵌在中间。\n'
            + '   例：一共 [[算]]3128.5+289.9[[/算]] 元。\n'
            + 'B. 算出来的数你后面还要用（要比较、要判断、要接着算）→ '
            + '整条回复只写算式标签，一行一个，别的什么都不要写。'
            + '程序算完会把结果发回来，你再写正式回复。\n'
            + '   例：[[算]]3.5*42[[/算]]\n'
            + '拿不准就用 B。不要自己心算，也不要猜结果。\n'
            + '支持 + - * / % ^ ! 和括号；函数 sqrt cbrt abs sin cos tan asin acos atan '
            + 'ln log log2 log10 exp pow floor ceil round min max sgn；常量 pi e。log(base, value)。';
        }
      } catch(e){}
      return m;
    };
    fb.__calc = true;
    window.buildMessages = fb;
  }

  /* ---------- 第二趟：带着算好的数再问一次 ---------- */
  async function pass2(){
    var last = CHAT[CHAT.length - 1];
    if (!last || last.role !== 'assistant' || !hasTag(last.text)) return;
    var exprs = exprsIn(last.text);
    if (!exprs.length) return;

    var lines = exprs.map(function(e){
      try { return '· ' + String(e).trim() + ' = ' + fmt(ev(e)); }
      catch(err){ return '· ' + String(e).trim() + ' = （算不了）'; }
    });

    var keep = last.text, msgs;
    try {
      last.typing = true;
      saveChat();
      if (document.getElementById('msgs')) renderChat(true);
      msgs = buildMessages();
      msgs.push({ role: 'assistant', content: keep });
      msgs.push({ role: 'user', content: '【程序算好的结果】\n' + lines.join('\n')
        + '\n\n现在用这些数写正式回复。已经算好了，别再写 [[算]] 标签。' });
    } catch(e){ delete last.typing; return; }

    SENDING = true;
    var rid = 'r2' + Date.now() + Math.random().toString(36).slice(2, 7);
    try {
      await api('/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rid, inboxId: S.inbox, messages: msgs,
          settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model,
                      apiType: S.apiType || 'openai', temperature: 0.9 },
          meta: { charName: '祁砚', charId: 'kai' }
        })
      });
      var hit = null;
      for (var i = 0; i < 24; i++){
        await sleep(i ? 2000 : 400);
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
      if (CHAT[CHAT.length - 1] === last && hit && hit.content){
        var r = parseReply(hit.content);
        last.text = r.text || keep;
        last.think = r.think || last.think;
        if (S.autoMem) r.mems.forEach(function(m){ addMemAuto(m); });
        if (r.alarms.length){
          r.alarms.forEach(function(a){ addAlarmLocal(a.hh, a.mm, a.label); });
          pushAlarmsToCloud(r.alarms);
        }
      }
    } catch(e){
    } finally {
      delete last.typing;
      SENDING = false;
      saveChat();
      if (document.getElementById('msgs')) renderChat(true);
    }
  }

  /* ---------- 挂在 sendChat 后面 ---------- */
  var _send = window.sendChat;
  if (typeof _send === 'function' && !_send.__calc){
    var fs = async function(){
      var r = await _send.apply(this, arguments);
      try { await pass2(); } catch(e){}
      return r;
    };
    fs.__calc = true;
    window.sendChat = fs;
  }
})();

/* ===== 21. 暂停思考 ===== */
(function(){
  var ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M9.4 5.5v13"/><path d="M14.6 5.5v13"/></svg>';

  var st = document.createElement('style');
  st.textContent =
    '.bub.kai.typing{display:inline-flex;align-items:center;gap:11px}'+
    '.pauseBtn{border:0;background:transparent;padding:0;margin:0;display:flex;align-items:center;'+
      'justify-content:center;color:inherit;opacity:.42;transition:opacity .15s;'+
      '-webkit-tap-highlight-color:transparent}'+
    '.pauseBtn:active{opacity:.85}';
  document.head.appendChild(st);

  /* 暂停后把还在等的长延时压掉，让那条链子两秒内收尾 */
  var _st = window.setTimeout, fastOn = false;
  function fast(on){
    if (on && !fastOn){
      fastOn = true;
      window.setTimeout = function(fn, ms){
        return _st(fn, (window.__pauseHit && ms >= 300) ? 0 : ms);
      };
    } else if (!on && fastOn){
      fastOn = false;
      window.setTimeout = _st;
    }
  }

  function pauseThink(){
    window.__pauseHit = true;
    fast(true);
    try {
      if (Array.isArray(CHAT)){
        var last = CHAT[CHAT.length - 1];
        if (last && last.typing) last.hidden = true;
      }
      if (document.getElementById('msgs')) renderChat(true);
    } catch(e){}
    _st(function(){ fast(false); }, 20000);
  }
  window.pauseThink = pauseThink;

  function decorate(){
    var box = document.getElementById('msgs');
    if (!box) return;
    var ty = box.querySelector('.bub.kai.typing');
    if (!ty) return;
    var last = Array.isArray(CHAT) ? CHAT[CHAT.length - 1] : null;
    if (last && last.typing && last.hidden){ ty.remove(); return; }
    if (ty.querySelector('.pauseBtn')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pauseBtn';
    b.setAttribute('aria-label', '暂停思考');
    b.innerHTML = ICON;
    b.onclick = function(e){ e.preventDefault(); e.stopPropagation(); pauseThink(); };
    ty.appendChild(b);
  }

  var _rc = window.renderChat;
  if (typeof _rc === 'function' && !_rc.__pause){
    var fr = function(){
      var r = _rc.apply(this, arguments);
      try { decorate(); } catch(e){}
      return r;
    };
    fr.__pause = true;
    window.renderChat = fr;
  }

  var _send = window.sendChat;
  if (typeof _send === 'function' && !_send.__pause){
    var fs = async function(){
      window.__pauseHit = false;
      var r = await _send.apply(this, arguments);
      if (window.__pauseHit){
        try {
          var last = CHAT[CHAT.length - 1];
          if (last && last.role === 'assistant' && !last.typing) CHAT.pop();
          for (var i = CHAT.length - 1; i >= 0; i--){
            if (CHAT[i] && CHAT[i].hidden){ CHAT.splice(i, 1); break; }
          }
          saveChat();
          if (document.getElementById('msgs')) renderChat(true);
        } catch(e){}
      }
      window.__pauseHit = false;
      fast(false);
      return r;
    };
    fs.__pause = true;
    window.sendChat = fs;
  }

  try { if (document.getElementById('msgs')) decorate(); } catch(e){}
})();

/* ===== 22. 输入栏改造：贴/说/🔍 删掉，+ 当发送 ===== */
(function(){
  var WAVE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.8" stroke-linecap="round"><path d="M4 10.5v3"/><path d="M8 7.5v9"/>'+
    '<path d="M12 5v14"/><path d="M16 8v8"/><path d="M20 10.5v3"/></svg>';
  var PLUS = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.9" stroke-linecap="round"><path d="M12 5.6v12.8"/><path d="M5.6 12h12.8"/></svg>';

  var st = document.createElement('style');
  st.textContent =
    '.inputbar{gap:9px;padding:11px 13px calc(env(safe-area-inset-bottom) + 15px);'+
      'background:transparent;border-top:0}'+
    '.inputbar .ibField{flex:1;min-width:0;display:flex;align-items:center;gap:9px;'+
      'background:#fff;border-radius:24px;padding:0 13px;height:46px}'+
    '.inputbar .ibField .wave{color:#b9b9b5;display:flex;flex:0 0 auto}'+
    '.inputbar .ibField input{flex:1;min-width:0;border:0;background:transparent;padding:0;'+
      'font-size:16px;font-weight:200;letter-spacing:.02em;'+
      'font-family:"Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif}'+
    '.inputbar .ibField input::placeholder{color:#c4c4c0;font-weight:200}'+
    '.inputbar .ibField .ibPlus{border:0;background:transparent;color:#8f8f8b;padding:4px;'+
      'display:flex;align-items:center}'+
    '.inputbar button.send{width:46px;height:46px;min-width:46px;padding:0;border-radius:50%;'+
      'background:#111;color:#fff;display:flex;align-items:center;justify-content:center;font-size:0}';
  document.head.appendChild(st);

  function build(){
    var bar = document.querySelector('.inputbar');
    if (!bar || bar.dataset.xm) return;
    var inp = document.getElementById('mIn');
    if (!inp) return;
    bar.dataset.xm = '1';

    if (inp.parentNode) inp.parentNode.removeChild(inp);   // 保住输入框本身
    bar.innerHTML = '';

    inp.placeholder = '愛してる';
    inp.setAttribute('autocapitalize', 'off');
    inp.setAttribute('autocorrect', 'off');

    var field = document.createElement('div');
    field.className = 'ibField';

    var w = document.createElement('span');
    w.className = 'wave';
    w.innerHTML = WAVE;

    var plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'ibPlus';
    plus.innerHTML = PLUS;
    plus.onclick = function(e){ e.preventDefault(); sendChat(); };

    field.appendChild(w);
    field.appendChild(inp);
    field.appendChild(plus);

    var send = document.createElement('button');
    send.type = 'button';
    send.className = 'send';
    send.innerHTML = PLUS;
    send.onclick = function(e){ e.preventDefault(); sendChat(); };

    bar.appendChild(field);
    bar.appendChild(send);

    inp.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); sendChat(); }
    });
  }

  build();
  setInterval(build, 900);
})();

 /* ===== 23. 聊天 + 面板：图片 / 拍摄 / 收藏 / 位置（照片真送进模型） ===== */
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

/* 暗度归零 */
if (+S.dim !== 0){ S.dim = 0; save(); }
setTimeout(function(){ if (typeof applyWall === 'function') applyWall(); }, 400);

/* ===== 24. 底部栏毛玻璃 ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '.dock{background:rgba(255,255,255,.34)!important;'+
      'backdrop-filter:blur(32px) saturate(180%)!important;'+
      '-webkit-backdrop-filter:blur(32px) saturate(180%)!important;'+
      'border:1px solid rgba(255,255,255,.5)!important;'+
      'box-shadow:0 8px 28px rgba(0,0,0,.08)!important}';
  document.head.appendChild(st);
})();

/* ===== 25. 输入栏微调：加号贴右、发送改上箭头、placeholder 锁住 ===== */
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

/* ===== 26. 微信主页 / 通讯录 / 朋友圈 ===== */
(function(){
  var W = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
  function sv(p, s){ return '<svg width="'+(s||24)+'" height="'+(s||24)+'" viewBox="0 0 24 24" '+W+'>'+p+'</svg>'; }
  var IC = {
    chat: sv('<path d="M20.4 12.4c0 3.9-3.8 7-8.4 7-1 0-2-.15-2.9-.42L4.2 20.4l1.3-3.3C4.1 15.9 3.6 14.2 3.6 12.4c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7z"/>',25),
    book: sv('<circle cx="12" cy="8.4" r="3.7"/><path d="M4.8 20.2c.7-3.6 3.7-5.9 7.2-5.9s6.5 2.3 7.2 5.9"/>',25),
    find: sv('<circle cx="12" cy="12" r="8.4"/><path d="M14.8 9.2 13 13l-3.8 1.8L11 11z"/>',25),
    me:   sv('<circle cx="12" cy="8.2" r="3.8"/><path d="M4.6 20.3c.6-3.7 3.7-6 7.4-6s6.8 2.3 7.4 6"/>',25),
    back: sv('<path d="M14.6 5.4 8 12l6.6 6.6"/>',22),
    plus: sv('<path d="M12 5.6v12.8"/><path d="M5.6 12h12.8"/>',20),
    heart: sv('<path d="M12 20.2S4.4 15.4 4.4 10.4a4 4 0 0 1 7.6-1.9 4 4 0 0 1 7.6 1.9c0 5-7.6 9.8-7.6 9.8z"/>',16),
    cmt: sv('<path d="M19.6 11.6c0 3.5-3.4 6.4-7.6 6.4-.9 0-1.8-.14-2.6-.4L5 19.6l1.2-3c-1.3-1.2-2-2.9-2-5 0-3.5 3.4-6.4 7.6-6.4s7.8 2.9 7.8 6.4z"/>',16),
    cam: sv('<path d="M3.4 8.8a2.6 2.6 0 0 1 2.6-2.6h1.4l1.3-2h6.6l1.3 2H18a2.6 2.6 0 0 1 2.6 2.6v7.8a2.6 2.6 0 0 1-2.6 2.6H6a2.6 2.6 0 0 1-2.6-2.6z"/><circle cx="12" cy="12.7" r="3.5"/>',19)
  };
  var KAI_AVA = 'PICs/icon.jpeg';

  var st = document.createElement('style');
  st.textContent =
    '#wx{position:fixed;inset:0;z-index:18;background:#f4f4f2;display:none;flex-direction:column}'+
    '#wx.on{display:flex}'+
    '.wxTop{flex:0 0 auto;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;text-align:center;'+
      'font-size:16px;font-weight:600;position:relative}'+
    '.wxBack,.wxPlus{position:absolute;top:calc(env(safe-area-inset-top) + 6px);width:36px;height:36px;'+
      'display:flex;align-items:center;justify-content:center;border-radius:50%}'+
    '.wxBack{left:8px}.wxPlus{right:8px}'+
    '.wxBack:active,.wxPlus:active{background:rgba(0,0,0,.06)}'+
    '.wxBody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}'+
    '.wxTabs{flex:0 0 auto;display:grid;grid-template-columns:repeat(4,1fr);'+
      'padding:8px 0 calc(env(safe-area-inset-bottom) + 8px);background:rgba(255,255,255,.42);'+
      'backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);'+
      'border-top:1px solid rgba(0,0,0,.06)}'+
    '.wxT{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:#9a9a96}'+
    '.wxT.on{color:#0b0b0b}'+
    '.wxRow{display:flex;align-items:center;gap:11px;padding:12px 14px;background:#fff;'+
      'border-bottom:1px solid var(--line)}'+
    '.wxRow:active{background:#f7f7f5}'+
    '.wxAva{width:46px;height:46px;border-radius:9px;background:#e6e6e2 center/cover;flex:0 0 auto;overflow:hidden}'+
    '.wxAva img{width:100%;height:100%;object-fit:cover;display:block}'+
    '.wxMid{flex:1;min-width:0}'+
    '.wxMid b{display:block;font-size:15.5px;font-weight:500}'+
    '.wxMid span{display:block;font-size:12.5px;color:#a3a39f;margin-top:2px;overflow:hidden;'+
      'text-overflow:ellipsis;white-space:nowrap}'+
    '.wxRow em{font-style:normal;font-size:11px;color:#b4b4b0;align-self:flex-start;margin-top:3px}'+
    '.wxHead{font-size:11px;color:#9a9a96;padding:8px 16px 6px;letter-spacing:.08em}'+
    '.momCover{height:210px;background:#ddd center/cover;position:relative}'+
    '.momAva{position:absolute;right:14px;bottom:-24px;width:66px;height:66px;border-radius:9px;'+
      'background:#e6e6e2 center/cover;border:2.5px solid #f4f4f2;box-shadow:0 2px 8px rgba(0,0,0,.12)}'+
    '.momPad{height:36px}'+
    '.momName{text-align:right;padding:0 16px 10px;font-size:14.5px;font-weight:500;color:#fff;'+
      'position:absolute;right:90px;bottom:-18px;text-shadow:0 1px 4px rgba(0,0,0,.35)}'+
    '.mom{display:flex;gap:11px;padding:14px;border-bottom:1px solid var(--line)}'+
    '.mom .av{width:40px;height:40px;border-radius:7px;background:#e6e6e2 center/cover;flex:0 0 auto}'+
    '.mom .bd{flex:1;min-width:0}'+
    '.mom .nm{font-size:14px;color:#5b6b8c;font-weight:500}'+
    '.mom .tx{font-size:14.5px;line-height:1.6;margin-top:4px;white-space:pre-wrap;word-break:break-word}'+
    '.mom .im{width:100%;border-radius:8px;margin-top:8px;display:block}'+
    '.mom .tm{font-size:11px;color:#b4b4b0;margin-top:8px;display:flex;align-items:center;gap:12px}'+
    '.mom .op{margin-left:auto;display:flex;gap:14px;color:#8a8a86}'+
    '.mom .likes{background:#f6f6f4;border-radius:6px;padding:6px 9px;font-size:12.5px;color:#5b6b8c;margin-top:8px}'+
    '.mom .cms{background:#f6f6f4;border-radius:6px;padding:6px 9px;font-size:12.5px;margin-top:4px;line-height:1.7}'+
    '.mom .cms b{color:#5b6b8c;font-weight:500}'+
    '.wxEmpty{text-align:center;color:#b4b4b0;font-size:13px;padding:70px 30px;line-height:1.9}'+
    '.momBox{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.3);display:flex;align-items:flex-end}'+
    '.momBox>div{width:100%;background:#f4f4f2;border-radius:20px 20px 0 0;padding:18px 16px calc(env(safe-area-inset-bottom) + 18px)}'+
    '.momBox textarea{width:100%;min-height:90px;border:0;background:transparent;font-size:15px;'+
      'line-height:1.6;color:var(--ink);resize:none;outline:none}'+
    '.momBox .row{display:flex;align-items:center;gap:10px;margin-top:8px}'+
    '.momBox .go{margin-left:auto;background:#111;color:#fff;border:0;border-radius:16px;'+
      'padding:8px 18px;font-size:13.5px}'+
    '.momBox .go:disabled{opacity:.35}'+
    '.momBox .pick{width:38px;height:38px;border-radius:11px;background:#fff;display:flex;'+
      'align-items:center;justify-content:center;color:#3a3a37;border:1px solid var(--line)}'+
    '.momBox .pv{width:38px;height:38px;border-radius:11px;background:center/cover;border:1px solid var(--line)}';
  document.head.appendChild(st);

  /* ---- 存储 ---- */
  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  var MOM = ls('xm_moments', []);
  function saveMom(){ ss('xm_moments', MOM.slice(-60)); }
  var COVER = function(){ return localStorage.getItem('xm_cover') || ''; };
  var MYAVA = function(){ return localStorage.getItem('xm_ava') || ''; };

  function hhmm(t){
    var d = new Date(t || Date.now());
    return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' + (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
  }
  function ago(t){
    var s = (Date.now() - t) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return Math.floor(s / 86400) + '天前';
  }

  /* ---- 中继调用（用 raw，避免和聊天 outbox 抢） ---- */
  async function rawApi(path, opts){
    var r = await fetch((S.relay || '').replace(/\/+$/, '') + path, Object.assign({}, opts || {}, {
      headers: Object.assign({ 'Authorization': 'Bearer ' + S.key }, (opts && opts.headers) || {})
    }));
    var t = await r.text();
    try { return JSON.parse(t); } catch(e){ return t; }
  }
  async function ask(user, temp){
    var msgs = [{ role: 'system', content: PERSONA }, { role: 'user', content: user }];
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
  /* 别让朋友圈的返回被聊天拉走 */
  var _api = window.api;
  if (typeof _api === 'function' && !_api.__mom){
    var fa = function(path, opts){
      var p = _api.apply(this, arguments);
      if (String(path).indexOf('/outbox') > -1 && p && p.then){
        return p.then(function(j){
          if (j && Array.isArray(j.items)){
            j.items = j.items.filter(function(x){ return !/^mom/i.test(String(x.requestId || '')); });
          }
          return j;
        });
      }
      return p;
    };
    fa.__mom = true;
    window.api = fa;
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

  /* ---- 他发一条 ---- */
  async function kaiPost(){
    if (!S.key){ toastWx('先去设置填中继密钥'); return; }
    toastWx('他在写…');
    var raw = await ask('发一条朋友圈。第一行只写正文，30 字内，不要引号不要解释。'+
      '想配图就在第二行写 [[图]]，不想就不写。');
    if (!raw){ toastWx('没写出来，再试一次'); return; }
    var lines = String(raw).split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    var txt = '', pic = '';
    lines.forEach(function(l){
      if (/^\[\[\s图\s\]\]$/.test(l)) pic = makePic();
      else if (!txt) txt = l.replace(/^\[\[\s文\s\]\]/, '');
    });
    MOM.push({ who: 'kai', text: txt, img: pic, t: Date.now(), likes: [], cms: [] });
    saveMom(); render();
    toastWx('他发了朋友圈');
  }

  /* ---- 他看我的 ---- */
  async function kaiSee(m){
    if (!S.key) return;
    var raw = await ask('小咩刚发了一条朋友圈：\n「' + String(m.text || '（图片）') + '」\n\n'+
      '写一句评论，20 字内，第一行以 [[评]] 开头。想点赞就另起一行写 [[赞]]。'+
      '如果想私聊她一句，再另起一行写 [[私]] 加上那句话，不想就别写。', 0.95);
    if (!raw) return;
    var lines = String(raw).split('\n').map(function(x){ return x.trim(); }).filter(Boolean);
    var liked = false, cmt = '', dm = '';
    lines.forEach(function(l){
      if (/^\[\[\s赞\s\]\]/.test(l)) liked = true;
      else if (/^\[\[\s评\s\]\]/.test(l)) cmt = l.replace(/^\[\[\s评\s\]\]/, '').trim();
      else if (/^\[\[\s私\s\]\]/.test(l)) dm = l.replace(/^\[\[\s私\s\]\]/, '').trim();
    });
    if (liked) m.likes.push('祁砚');
    if (cmt) m.cms.push({ who: '祁砚', text: cmt });
    saveMom(); render();
    if (dm && Math.random() < 0.75) dmLater(dm);
  }
  function dmLater(t){
    setTimeout(function(){
      CHAT.push({ role: 'assistant', text: t, t: Date.now() });
      saveChat();
      if (document.getElementById('msgs')) renderChat(true);
      notify('祁砚', t);
    }, 9000 + Math.random() * 20000);
  }
  function notify(title, body){
    try {
      if ('Notification' in window && Notification.permission === 'granted'){
        navigator.serviceWorker.ready.then(function(r){
          r.showNotification(title, { body: body, tag: 'kai-wx' });
        }).catch(function(){});
      }
    } catch(e){}
  }

  /* ---- 界面 ---- */
  var wx = document.createElement('div');
  wx.id = 'wx';
  document.body.appendChild(wx);
  var TAB = 'wx', SUB = '';

  var tEl = null, tT = 0;
  function toastWx(t){
    if (!tEl){ tEl = document.createElement('div'); tEl.className = 'xmBar'; document.body.appendChild(tEl); }
    tEl.textContent = t; tEl.style.display = 'block';
    clearTimeout(tT);
    tT = setTimeout(function(){ tEl.style.display = 'none'; }, 2400);
  }

  function avaBox(url, cls){ return '<span class="' + (cls || 'wxAva') + '"' +
    (url ? ' style="background-image:url(\'' + url + '\')"' : '') + '></span>'; }

  function chatList(){
    var last = CHAT.filter(function(x){ return !x.typing; }).slice(-1)[0] || {};
    var t = last.text || (last.thumb ? '[图片]' : '');
    return '<div class="wxRow" data-go="chat">' + avaBox(KAI_AVA) +
      '<div class="wxMid"><b>祁砚</b><span>' + esc(String(t).slice(0, 26)) + '</span></div>' +
      '<em>' + (last.t ? hhmm(last.t) : '') + '</em></div>';
  }
  function bookList(){
    return '<div class="wxHead">K</div><div class="wxRow" data-go="chat">' + avaBox(KAI_AVA) +
      '<div class="wxMid"><b>祁砚</b><span>Kai · 哥哥</span></div></div>';
  }
  function findList(){
    var n = MOM.filter(function(m){ return m.who === 'kai'; }).length;
    return '<div class="wxRow" data-go="moments">' + avaBox('') +
      '<div class="wxMid"><b>朋友圈</b><span>' +
      (MOM.length ? MOM.length + ' 条动态' : '还没有动态') + '</span></div></div>';
  }
  function mePage(){
    return '<div class="wxRow" style="padding:22px 14px">' + avaBox(MYAVA(), 'wxAva') +
      '<div class="wxMid"><b>' + esc(S.name || '小咩') + '</b><span>点这里换头像</span></div>' +
      '<em><b class="momAvaBtn" style="color:#5b6b8c;font-size:12px">更换</b></em></div>' +
      '<div class="wxRow" data-go="moments">' + avaBox('') +
      '<div class="wxMid"><b>我的朋友圈</b><span>' + MOM.filter(function(m){ return m.who === 'me'; }).length +
      ' 条</span></div></div>' +
      '<div class="wxRow" data-kai="1">' + avaBox(KAI_AVA) +
      '<div class="wxMid"><b>让祁砚发一条</b><span>他随手拍的那种</span></div></div>';
  }
  function momentsPage(){
    var list = MOM.slice().reverse();
    return '<div class="momCover" id="wxCover"' +
      (COVER() ? ' style="background-image:url(\'' + COVER() + '\')"' : '') + '>' +
      '<div class="momAva" id="wxAva"' +
      (MYAVA() ? ' style="background-image:url(\'' + MYAVA() + '\')"' : '') + '></div>' +
      '<div class="momName">' + esc(S.name || '小咩') + '</div></div>' +
      '<div class="momPad"></div>' +
      (list.length ? list.map(function(m, i){
        var idx = MOM.length - 1 - i;
        return '<div class="mom">' + avaBox(m.who === 'me' ? MYAVA() : KAI_AVA, 'av') +
          '<div class="bd"><div class="nm">' + (m.who === 'me' ? esc(S.name || '小咩') : '祁砚') + '</div>' +
          (m.text ? '<div class="tx">' + esc(m.text) + '</div>' : '') +
          (m.img ? '<img class="im" src="' + m.img + '">' : '') +
          '<div class="tm">' + ago(m.t) +
            '<span class="op"><span data-like="' + idx + '">' + IC.heart + '</span>' +
            '<span data-cm="' + idx + '">' + IC.cmt + '</span></span></div>' +
          ((m.likes && m.likes.length) ? '<div class="likes">' + m.likes.join('、') + '</div>' : '') +
          ((m.cms && m.cms.length) ? '<div class="cms">' + m.cms.map(function(c){
            return '<b>' + esc(c.who) + '</b>：' + esc(c.text);
          }).join('<br>') + '</div>' : '') +
          '</div></div>';
      }).join('') : '<div class="wxEmpty">还没有动态。<br>点右上角 + 发一条，<br>或者去「我」让祁砚发一条。</div>');
  }

  function render(){
    var title = SUB === 'moments' ? '朋友圈'
      : TAB === 'wx' ? '微信' : TAB === 'book' ? '通讯录' : TAB === 'find' ? '发现' : '我';
    var bd = SUB === 'moments' ? momentsPage()
      : TAB === 'wx' ? chatList() : TAB === 'book' ? bookList()
      : TAB === 'find' ? findList() : mePage();
    wx.innerHTML =
      '<div class="wxTop">' + (SUB === 'moments' ? '<span class="wxBack" id="wxBack">' + IC.back + '</span>' : '') +
        title + (SUB === 'moments' ? '<span class="wxPlus" id="wxNew">' + IC.plus + '</span>' : '') + '</div>' +
      '<div class="wxBody">' + bd + '</div>' +
      (SUB ? '' : '<div class="wxTabs">' +
        [['wx', IC.chat, '微信'], ['book', IC.book, '通讯录'],
         ['find', IC.find, '发现'], ['me', IC.me, '我']].map(function(t){
          return '<div class="wxT' + (TAB === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' +
            t[1] + '<span>' + t[2] + '</span></div>';
        }).join('') + '</div>');
    bind();
  }

  /* ---- 发朋友圈 ---- */
  var fPost = document.createElement('input');
  fPost.type = 'file'; fPost.accept = 'image/*'; fPost.style.display = 'none';
  document.body.appendChild(fPost);
  var fCover = document.createElement('input');
  fCover.type = 'file'; fCover.accept = 'image/*'; fCover.style.display = 'none';
  document.body.appendChild(fCover);
  var fAva = document.createElement('input');
  fAva.type = 'file'; fAva.accept = 'image/*'; fAva.style.display = 'none';
  document.body.appendChild(fAva);

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

  var draft = { text: '', img: '' };
  function composer(){
    var old = document.getElementById('momBox'); if (old) old.remove();
    var d = document.createElement('div');
    d.id = 'momBox';
    d.className = 'momBox';
    d.innerHTML = '<div><textarea id="momTx" placeholder="这一刻的想法…">' + esc(draft.text) + '</textarea>' +
      '<div class="row">' +
        '<span class="pick" id="momPick">' + IC.cam + '</span>' +
        (draft.img ? '<span class="pv" style="background-image:url(\'' + draft.img + '\')"></span>' : '') +
        '<button class="go" id="momGo">发表</button></div></div>';
    d.onclick = function(e){ if (e.target === d) d.remove(); };
    document.body.appendChild(d);
    d.querySelector('#momTx').oninput = function(){ draft.text = this.value; };
    d.querySelector('#momPick').onclick = function(){ fPost.click(); };
    d.querySelector('#momGo').onclick = function(){
      var t = String(draft.text || '').trim();
      if (!t && !draft.img) return;
      var m = { who: 'me', text: t, img: draft.img, t: Date.now(), likes: [], cms: [] };
      MOM.push(m);
      var withImg = MOM.filter(function(x){ return x.img; });
      if (withImg.length > 12) withImg[0].img = '';
      saveMom();
      draft = { text: '', img: '' };
      d.remove(); render();
      kaiSee(m);
    };
  }

  /* ---- 交互 ---- */
  function bind(){
    wx.querySelectorAll('[data-tab]').forEach(function(el){
      el.onclick = function(){ TAB = el.dataset.tab; SUB = ''; render(); };
    });
    wx.querySelectorAll('[data-go]').forEach(function(el){
      el.onclick = function(){
        if (el.dataset.go === 'chat'){ openChatReal(); }
        else { SUB = 'moments'; render(); }
      };
    });
    var b = wx.querySelector('#wxBack');
    if (b) b.onclick = function(){ SUB = ''; render(); };
    var n = wx.querySelector('#wxNew');
    if (n) n.onclick = function(){ draft = { text: '', img: '' }; composer(); };
    var cv = wx.querySelector('#wxCover');
    if (cv) cv.onclick = function(){ fCover.click(); };
    var av = wx.querySelector('#wxAva');
    if (av) av.onclick = function(e){ e.stopPropagation(); fAva.click(); };
    var ab = wx.querySelector('.momAvaBtn');
    if (ab) ab.parentNode.parentNode.onclick = function(){ fAva.click(); };
    var kk = wx.querySelector('[data-kai]');
    if (kk) kk.onclick = kaiPost;

    wx.querySelectorAll('[data-like]').forEach(function(el){
      el.onclick = function(){
        var m = MOM[+el.dataset.like];
        if (!m) return;
        m.likes = m.likes || [];
        var i = m.likes.indexOf(S.name || '小咩');
        if (i < 0) m.likes.push(S.name || '小咩'); else m.likes.splice(i, 1);
        saveMom(); render();
      };
    });
    wx.querySelectorAll('[data-cm]').forEach(function(el){
      el.onclick = function(){
        var m = MOM[+el.dataset.cm];
        if (!m) return;
        var t = window.prompt('评论');
        if (!t) return;
        m.cms = m.cms || [];
        m.cms.push({ who: S.name || '小咩', text: String(t).slice(0, 120) });
        saveMom(); render();
      };
    });
  }

  fPost.onchange = function(){
    var f = fPost.files && fPost.files[0];
    fPost.value = '';
    if (!f) return;
    pick(f, 900, function(u){ draft.img = u; composer(); });
  };
  fCover.onchange = function(){
    var f = fCover.files && fCover.files[0];
    fCover.value = '';
    if (!f) return;
    pick(f, 1000, function(u){
      try { localStorage.setItem('xm_cover', u); } catch(e){ toastWx('图太大，存不下'); }
      render();
    });
  };
  fAva.onchange = function(){
    var f = fAva.files && fAva.files[0];
    fAva.value = '';
    if (!f) return;
    pick(f, 320, function(u){
      try { localStorage.setItem('xm_ava', u); } catch(e){}
      render();
    });
  };

  /* ---- 接管聊天入口 ---- */
  var _oa = window.openApp;
  function openChatReal(){ if (typeof _oa === 'function') _oa.call(window, 'chat'); }
  if (typeof _oa === 'function' && !_oa.__wx){
    var fo = function(k){
      if (k === 'chat'){ openWx(); return; }
      return _oa.apply(this, arguments);
    };
    fo.__wx = true;
    window.openApp = fo;
  }
  function openWx(){ wx.classList.add('on'); TAB = 'wx'; SUB = ''; render(); }
  window.openWx = openWx;

  /* ---- 左边缘滑回 ---- */
  (function(){
    var live = false, x0 = 0, y0 = 0, dx = 0;
    wx.addEventListener('touchstart', function(e){
      if (!wx.classList.contains('on')) return;
      var t = e.touches[0];
      if (t.clientX > 40) return;
      live = true; x0 = t.clientX; y0 = t.clientY; dx = 0;
      wx.style.transition = 'none';
    }, { passive: true });
    wx.addEventListener('touchmove', function(e){
      if (!live) return;
      var t = e.touches[0];
      var mx = t.clientX - x0, my = t.clientY - y0;
      if (my > 30 && Math.abs(my) > Math.abs(mx)){ live = false; wx.style.transform = ''; return; }
      dx = Math.max(0, mx);
      e.preventDefault();
      wx.style.transform = 'translateX(' + dx + 'px)';
    }, { passive: false });
    wx.addEventListener('touchend', function(){
      if (!live) return;
      live = false;
      wx.style.transition = 'transform .22s ease-out';
      if (dx > 80){
        wx.style.transform = 'translateX(100%)';
        setTimeout(function(){
          if (SUB === 'moments'){ SUB = ''; render(); }
          else wx.classList.remove('on');
          wx.style.transition = 'none'; wx.style.transform = '';
          requestAnimationFrame(function(){ wx.style.transition = ''; });
        }, 220);
      } else {
        wx.style.transform = '';
        setTimeout(function(){ wx.style.transition = ''; }, 220);
      }
      dx = 0;
    }, { passive: true });
  })();
})();

/* ===== 26. 主动消息（带人设 + 记忆 + 最近聊天） ===== */
(function(){
  if (S.lastAct === undefined){
    S.lastAct = Date.now(); S.asleep = 0; S.wakeH = 7; S.proOn = 1; S.lastPro = '';
    try { save(); } catch(e){}
  }

  /* 睡觉 / 醒来信号 */
  var _pr = window.parseReply;
  if (typeof _pr === 'function' && !_pr.__pro){
    var fp = function(raw){
      var r = _pr.apply(this, arguments);
      try {
        var s = String(raw || '');
        if (/\[\[\s睡\s\]\]/.test(s)){ S.asleep = 1; S.sleepAt = Date.now(); save(); }
        if (/\[\[\s醒\s\]\]/.test(s)){ S.asleep = 0; S.wakeH = new Date().getHours(); save(); }
        r.text = String(r.text || '').replace(/\[\[\s*(睡|醒)\s*\]\]/g, '').trim();
      } catch(e){}
      return r;
    };
    fp.__pro = true;
    window.parseReply = fp;
  }

  /* 每次收发都刷新活跃时间；隔了很久再来就当成醒了 */
  var _send = window.sendChat;
  if (typeof _send === 'function' && !_send.__pro){
    var fs = async function(){
      var gap = Date.now() - (S.lastAct || 0);
      if (S.asleep && gap > 4 * 3600e3){ S.asleep = 0; S.wakeH = new Date().getHours(); }
      if (gap > 5 * 3600e3 && new Date().getHours() >= 4 && new Date().getHours() <= 14){
        S.wakeH = new Date().getHours();
      }
      S.lastAct = Date.now();
      try { save(); } catch(e){}
      return _send.apply(this, arguments);
    };
    fs.__pro = true;
    window.sendChat = fs;
  }

  function inWindow(){
    var h = new Date().getHours();
    var w = Math.max(0, Math.min(12, +S.wakeH || 7));
    return h >= w - 1 && h <= 22;
  }
  function hhmm(t){
    var d = new Date(t || Date.now());
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

  /* ---- 拼上下文：人设 + 长期记忆 + 最近对话 + 最近几条她发的 ---- */
  function buildCtx(){
    var sys = PERSONA;
    sys += '\n\n【现在】' + hhmm() + '，' + partOfDay() + '。';
    var gapMin = Math.round((Date.now() - (S.lastAct || 0)) / 60000);
    sys += gapMin >= 60
      ? '你们已经 ' + Math.floor(gapMin / 60) + ' 小时 ' + (gapMin % 60) + ' 分钟没说话了。'
      : '你们刚刚还在说话。';
    if (+S.asleep) sys += '她睡着了。';
    sys += '\n你要主动找她说话。可以提到你们之前聊过的具体事、她提过的烦恼或约定，' +
      '别泛泛地问「在干嘛」。不要问她为什么不回，不要解释你在等她，不要提这是自动发送。' +
      '一句话，30 字内，口语，不要 markdown。';

    if (MEM && MEM.length){
      sys += '\n\n【你记得关于她的事】\n' +
        MEM.slice(-40).map(function(x){ return '· ' + x; }).join('\n');
    }
    if (S.lastPro) sys += '\n\n【你上次主动说的是】' + S.lastPro + '\n这次别重复。';

    var hist = CHAT.filter(function(m){ return !m.typing && (m.text || m.thumb); }).slice(-24)
      .map(function(m){
        var t = String(m.text || '').trim();
        if (!t && m.thumb) t = '（发了张照片）';
        if (!t) return null;
        return { role: m.role === 'user' ? 'user' : 'assistant', content: t.slice(0, 400) };
      })
      .filter(Boolean);

    return [{ role: 'system', content: sys }].concat(hist);
  }

  async function fire(test){
    if (!S.key){ if (test) alert('先去设置填中继密钥'); return; }
    var msgs = buildCtx();
    msgs.push({ role: 'user', content: '（现在轮到你主动开口。只写你要说的那一句话。）' });

    var rid = 'pro' + Date.now() + Math.random().toString(36).slice(2, 6);
    try {
      await api('/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rid, inboxId: S.inbox, messages: msgs,
          settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model,
                      apiType: S.apiType || 'openai', temperature: 1.0 },
          meta: { charName: '祁砚', charId: 'kai' }
        })
      });
    } catch(e){ return; }

    for (var i = 0; i < 22; i++){
      await sleep(i ? 2000 : 600);
      try {
        var j = await api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
        if (!f) continue;
        await api('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
        var r = parseReply(f.content);
        var t = String(r.text || '').trim();
        if (!t) return;
        CHAT.push({ role: 'assistant', text: t, think: r.think, t: Date.now() });
        S.lastAct = Date.now();
        S.lastPro = t;
        try { save(); saveChat(); } catch(e){}
        if (document.getElementById('msgs')) renderChat(true);
        var box = document.getElementById('msgs');
        if (box) box.scrollTop = box.scrollHeight;
        popup(t);
        return;
      } catch(e){}
    }
  }

  function popup(t){
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 10px);'+
      'z-index:130;background:rgba(255,255,255,.9);backdrop-filter:blur(24px) saturate(180%);'+
      '-webkit-backdrop-filter:blur(24px) saturate(180%);border-radius:18px;padding:13px 16px;'+
      'box-shadow:0 8px 30px rgba(0,0,0,.16);transition:transform .3s,opacity .3s;'+
      'transform:translateY(-140%);opacity:0';
    d.innerHTML = '<div style="font-size:12px;color:#8f8f8b;margin-bottom:3px">祁砚</div>' +
      '<div style="font-size:14.5px;line-height:1.5">' + esc(t) + '</div>';
    document.body.appendChild(d);
    requestAnimationFrame(function(){ d.style.transform = 'translateY(0)'; d.style.opacity = '1'; });
    var kill = function(){
      d.style.transform = 'translateY(-140%)'; d.style.opacity = '0';
      setTimeout(function(){ d.remove(); }, 320);
    };
    d.onclick = function(){
      kill();
      try { if (typeof window.openWx === 'function') window.openWx(); } catch(e){}
      try { if (typeof window.openApp === 'function') window.openApp('chat'); } catch(e){}
    };
    setTimeout(kill, 7000);
    try {
      if ('Notification' in window && Notification.permission === 'granted'){
        navigator.serviceWorker.ready.then(function(r){
          r.showNotification('祁砚', { body: t, tag: 'kai-pro' });
        }).catch(function(){});
      }
    } catch(e){}
    try { if (navigator.vibrate) navigator.vibrate(40); } catch(e){}
  }

  /* ---- 轮询 ---- */
  setInterval(function(){
    if (!+S.proOn) return;
    if (SENDING) return;
    if (document.hidden) return;
    if (+S.asleep) return;
    if (!inWindow()) return;
    var gap = Date.now() - (S.lastAct || 0);
    var test = !!+S.testPro;
    var need = test ? 30000 : 60 * 60 * 1000;
    if (gap < need) return;
    if (test){ S.testPro = 0; try { save(); } catch(e){} }
    fire(test);
  }, 15000);

  /* ---- 设置里的卡片 ---- */
  setInterval(function(){
    var b = document.getElementById('ovbody');
    if (!b || b.querySelector('#xmProCard')) return;
    if (!/壁纸|暗度|中继/.test(b.textContent || '')) return;
    var d = document.createElement('div');
    d.id = 'xmProCard';
    d.className = 'card';
    d.innerHTML =
      '<div class="eyebrow">主动消息</div>' +
      '<div class="item"><span>他主动找我</span><em><span class="sw ' + (+S.proOn ? 'on' : '') +
        '" id="xmProSw"><i></i></span></em></div>' +
      '<div class="item"><span>我通常几点醒</span><em><input id="xmWake" value="' + (+S.wakeH || 7) +
        '" style="width:46px;text-align:right;border:0;background:transparent;font-size:14px"></em></div>' +
      '<div class="item" id="xmProTest"><span>测试（30 秒后弹）</span><em>点一下</em></div>' +
      '<div class="sub" style="margin:10px 0 0">超过 60 分钟没消息他会主动说话，' +
      '会带着人设、长期记忆和最近 24 条聊天记录一起发，所以能接着之前的话题。' +
      '睡着后不发，醒来那阵子发得最勤。网页在后台时 iOS 不跑 JS，' +
      '所以只在 app 开着的时候会触发。</div>';
    b.insertBefore(d, b.firstChild);
    d.querySelector('#xmProSw').onclick = function(){
      S.proOn = +S.proOn ? 0 : 1; save(); this.classList.toggle('on', !!+S.proOn);
    };
    d.querySelector('#xmWake').oninput = function(){
      S.wakeH = Math.max(0, Math.min(23, parseInt(this.value, 10) || 7)); save();
    };
    d.querySelector('#xmProTest').onclick = function(){
      S.testPro = 1; S.lastAct = Date.now() - 31000; S.asleep = 0;
      try { save(); } catch(e){}
      alert('好，30 秒后他会来找你。别关屏幕。');
    };
  }, 1200);
})();

/* ===== 27. 回到底部按钮（不在底部时才出现） ===== */
(function(){
  var DOWN = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M7 7.8 12 12.8l5-5"/><path d="M7 13.6 12 18.6l5-5"/></svg>';

  var st = document.createElement('style');
  st.textContent = '#ovbody{position:relative}'+
    '#xmDown:active{transform:scale(.9)!important}';
  document.head.appendChild(st);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'xmDown';
  btn.innerHTML = DOWN;
  btn.style.cssText =
    'position:absolute;right:16px;width:38px;height:38px;padding:0;border:0;border-radius:50%;'+
    'background:rgba(0,0,0,.42);color:#fff;display:flex;align-items:center;justify-content:center;'+
    'backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);'+
    'box-shadow:0 4px 16px rgba(0,0,0,.18);z-index:12;'+
    'opacity:0;transform:scale(.7);pointer-events:none;transition:opacity .18s,transform .18s';

  function box(){ return document.getElementById('msgs'); }
  function atBottom(){
    var b = box();
    if (!b) return true;
    return b.scrollHeight - b.scrollTop - b.clientHeight < 90;
  }
  function place(){
    var bar = document.querySelector('.inputbar');
    var panel = document.querySelector('.xmPanel');
    var h = (bar ? bar.offsetHeight : 62) +
            (panel && panel.classList.contains('on') ? panel.offsetHeight : 0);
    btn.style.bottom = (h + 14) + 'px';
  }
  function sync(){
    var b = box(), ob = document.getElementById('ovbody');
    if (!b || !ob || !ob.classList.contains('ovchat')) return;
    if (btn.parentNode !== ob) ob.appendChild(btn);
    place();
    var show = !atBottom();
    btn.style.opacity = show ? '1' : '0';
    btn.style.transform = show ? 'scale(1)' : 'scale(.7)';
    btn.style.pointerEvents = show ? 'auto' : 'none';
  }

  btn.onclick = function(e){
    e.preventDefault(); e.stopPropagation();
    var b = box();
    if (b) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' });
  };

  var _rc = window.renderChat;
  if (typeof _rc === 'function' && !_rc.__dn){
    var fr = function(){
      var r = _rc.apply(this, arguments);
      try { sync(); } catch(e){}
      return r;
    };
    fr.__dn = true;
    window.renderChat = fr;
  }

  document.addEventListener('scroll', function(e){
    if (e.target && e.target.id === 'msgs') sync();
  }, true);
  setInterval(sync, 900);
})();

/* ===== 28. 朋友圈升级：接着你的动态发 + 上网找图 + 自动发 ===== */
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
