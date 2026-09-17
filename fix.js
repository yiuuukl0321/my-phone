/* 咩&砚 · 补丁包
   之前误把中继的代码粘进了 index.html 的脚本块里，那段有 import，浏览器会整块报错，
   同一块里的「壁纸修复 / 记忆档案 / 抓网页」就全都不执行了。
   这个文件把这三块 + MCP 重新装一遍，index.html 只要在末尾加一行
   <script src="fix.js"></script> 就恢复了。
   以后有空在电脑上把 index.html 里那段以「// 服务端 AI 调用」开头的死代码删掉，
   这个文件就可以不要了。 */

/* ===== 1. 壁纸修复（底部白边） ===== */
(function(){
  var st = document.createElement('style');
  st.textContent = 'html{overflow:hidden;background-color:#eceae5;background-repeat:no-repeat;background-position:center top;background-size:cover}body{height:100%;overflow:hidden;background:transparent}';
  document.head.appendChild(st);
  var db = document.getElementById('dbg');
  if (db) db.remove();
  function tall(){ return Math.max(innerHeight, screen.height, document.documentElement.clientHeight); }
  function paint(){
    if (typeof S === 'undefined' || typeof WALL_DEFAULT === 'undefined') return;
    var w = String(S.wall || '').trim() || WALL_DEFAULT;
    w = w.replace(/'/g, '');
    var dim = Math.max(0, Math.min(.6, +S.dim || 0));
    var de = document.documentElement;
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





/* ===== 7. 语音朗读：系统内置 / OpenAI 兼容 / ElevenLabs ===== */
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



/* ===== 11. 每条回复下面的操作栏：复制 / 重新生成 / 播放语音 / 翻译 ===== */
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


/* ===== 12. 操作栏补丁：每次重绘后直接插 + 加载自检 ===== */
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
  function fix(){
    var d=document.documentElement;
    var h=Math.max(window.innerHeight||0,screen.height||0,d.clientHeight||0);
    d.style.setProperty('height',h+'px','important');
    d.style.setProperty('min-height',h+'px','important');
    d.style.setProperty('background-size','cover','important');
    d.style.setProperty('background-position','center top','important');
    d.style.setProperty('background-repeat','no-repeat','important');
    if(typeof window.applyWall==='function')try{window.applyWall();}catch(e){}
  }
  fix();addEventListener('resize',fix);addEventListener('orientationchange',fix);
  setTimeout(fix,300);setTimeout(fix,1200);setInterval(fix,3000);
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
