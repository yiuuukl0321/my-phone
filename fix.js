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



/* ===== 6. 键盘顶起：聊天页跟随可视视口，键盘弹出不再把页面往上顶 ===== */
(function(){
  var vv = window.visualViewport;
  var root = document.documentElement;
  var st = document.createElement('style');
  st.textContent =
    '#ov,#sh{top:var(--vvt,0px);height:var(--vvh,100%);bottom:auto}' +
    'html[data-kb="1"] .inputbar{padding-bottom:12px}';
  document.head.appendChild(st);

  var lastH = 0;
  function sync(){
    var h = vv ? vv.height : window.innerHeight;
    var t = vv ? vv.offsetTop : 0;
    root.style.setProperty('--vvh', h + 'px');
    root.style.setProperty('--vvt', t + 'px');
    var open = h < window.innerHeight - 60;
    root.dataset.kb = open ? '1' : '0';
    if (open && h < lastH - 20){
      var m = document.getElementById('msgs');
      if (m) m.scrollTop = m.scrollHeight;
    }
    lastH = h;
  }
  if (vv){ vv.addEventListener('resize', sync); vv.addEventListener('scroll', sync); }
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', function(){ setTimeout(sync, 250); });
  sync();
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

