/* ===== 1. 记忆档案 导出 / 导入 ===== */
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

/* ===== 2. 抓网页（消息里带链接时自动读正文） ===== */
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

/* ===== 3. MCP 工具（清单在这里拉，真正调用由中继执行） ===== */
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


/* ===== 32. token 统计 ===== */
(function(){
  var K = 'xm_tok';
  function blank(){ return { total:0, inp:0, out:0, n:0, by:{}, since:Date.now() }; }
  function load(){
    try {
      var o = JSON.parse(localStorage.getItem(K) || 'null');
      if (!o || typeof o.total !== 'number') return blank();
      o.by = o.by || {};
      return o;
    } catch(e){ return blank(); }
  }
  function saveTok(t){ try { localStorage.setItem(K, JSON.stringify(t)); } catch(e){} }
  function fmt(n){
    n = Math.round(+n || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function est(s){
    var t = String(s || ''), cjk = 0, o = 0;
    for (var i = 0; i < t.length; i++){
      var ch = t[i];
      if (/[\u3400-\u9fff\uf900-\ufaff\u3000-\u303f\uff00-\uffef]/.test(ch)) cjk++;
      else o++;
    }
    return Math.round(cjk + o / 4);
  }
  function kindOf(rid){
    var s = String(rid || '');
    if (/^pro/.test(s)) return '主动消息';
    if (/^mom/.test(s)) return '朋友圈';
    if (/^tr/.test(s))  return '翻译';
    if (/^r2/.test(s))  return '计算';
    if (/^rv/.test(s))  return '重试';
    if (/^r/.test(s))   return '聊天';
    return '其他';
  }

  var pend = {};
  function bump(rid, inp, out){
    var T = load();
    T.total += inp + out;
    T.inp += inp; T.out += out; T.n += 1;
    var k = kindOf(rid);
    T.by[k] = (T.by[k] || 0) + inp + out;
    saveTok(T);
  }

  var _f = window.fetch;
  window.fetch = function(url, opts){
    try {
      if (typeof url === 'string' && url.indexOf('/generate') > -1 && opts && opts.body){
        var b = JSON.parse(opts.body);
        if (b && b.requestId) pend[b.requestId] = est(JSON.stringify(b.messages || []));
      }
    } catch(e){}
    var p = _f.apply(this, arguments);
    try {
      if (typeof url === 'string' && url.indexOf('/outbox') > -1 && p && p.then){
        return p.then(function(r){
          try {
            r.clone().json().then(function(j){
              ((j && j.items) || []).forEach(function(it){
                if (!it || !it.requestId) return;
                var rid = String(it.requestId);
                var u = it.usage || it.tokens_used || {};
                var got = +((u && (u.total_tokens || u.totalTokens)) || it.tokens || 0);
                var inp = pend[rid] || 0;
                delete pend[rid];
                var out = got > inp ? (got - inp) : est(it.content || '');
                bump(rid, inp, out);
              });
            }).catch(function(){});
          } catch(e){}
          return r;
        });
      }
    } catch(e){}
    return p;
  };

  setInterval(function(){
    var b = document.getElementById('ovbody');
    if (!b || b.querySelector('#xmTokCard')) return;
    if (!/壁纸|暗度|中继/.test(b.textContent || '')) return;
    var T = load();
    var rows = Object.keys(T.by).sort(function(a, c){ return T.by[c] - T.by[a]; })
      .map(function(k){
        return '<div class="item"><span>' + esc(k) + '</span><em>' + fmt(T.by[k]) + '</em></div>';
      }).join('') || '<div class="empty">还没有消耗。</div>';
    var d = document.createElement('div');
    d.id = 'xmTokCard';
    d.className = 'card';
    d.innerHTML =
      '<div class="eyebrow">TOKENS</div>' +
      '<div class="item"><span>总计</span><em>≈' + fmt(T.total) + '</em></div>' +
      '<div class="item"><span>输入 / 输出</span><em>' + fmt(T.inp) + ' / ' + fmt(T.out) + '</em></div>' +
      '<div class="item"><span>调用次数</span><em>' + (T.n || 0) + ' 次</em></div>' +
      rows +
      '<div class="item" id="xmTokClr"><span style="color:#ff3b30">清零</span><em></em></div>' +
      '<div class="sub" style="margin:10px 0 0">只统计真正过模型的调用。收藏、点赞、换头像、下拉刷新这些不花 token。' +
      '中继有报用量就用它报的，没报就按字数估，所以是「≈」。</div>';
    b.insertBefore(d, b.firstChild);
    d.querySelector('#xmTokClr').onclick = function(){
      if (!confirm('把统计清零？')) return;
      saveTok(blank());
      d.remove();
    };
  }, 1200);
})();


/* ===== 33. 记忆整理：每加 30 条自动合并精简 ===== */
(function(){
  if (S.memNew === undefined){ S.memNew = 0; S.memLastAt = 0; try { save(); } catch(e){} }

  var TRIG = 30, KEEP = 60;

  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function toast(t){
    var el = document.createElement('div');
    el.className = 'xmBar'; el.textContent = t; el.style.display = 'block';
    document.body.appendChild(el);
    setTimeout(function(){ el.remove(); }, 2400);
  }
  function memArr(){
    try { return (typeof MEM !== 'undefined' && Array.isArray(MEM)) ? MEM : []; }
    catch(e){ return []; }
  }
  function setMem(a){
    try { MEM = a; saveMem(); } catch(e){}
  }

  async function rawApi(path, opts){
    var r = await fetch((S.relay || '').replace(/\/+$/, '') + path, Object.assign({}, opts || {}, {
      headers: Object.assign({ 'Authorization': 'Bearer ' + S.key }, (opts && opts.headers) || {})
    }));
    var t = await r.text();
    try { return JSON.parse(t); } catch(e){ return t; }
  }

  /* 别让整理的结果被聊天拉走 */
  var _api = window.api;
  if (typeof _api === 'function' && !_api.__mem){
    var fx = function(path, opts){
      var p = _api.apply(this, arguments);
      if (String(path).indexOf('/outbox') > -1 && p && p.then){
        return p.then(function(j){
          if (j && Array.isArray(j.items)){
            j.items = j.items.filter(function(x){ return !/^mem/i.test(String(x.requestId || '')); });
          }
          return j;
        });
      }
      return p;
    };
    fx.__mem = true;
    window.api = fx;
  }

  var SYS = '你是记忆整理器。给你一份「关于小咩」的记忆清单，你要把它精简、去重、合并，' +
    '让它以后能被精确读取。\n\n规则：\n' +
    '1. 一条只写一件事，主谓宾完整。不许用「她」「这个」「之前」这种指代，要写清是谁、什么时候、什么地点。\n' +
    '2. 同一件事的多条合并成一条，保留最新、最具体的那版。\n' +
    '3. 人名、地点、时间、数字、喜好、忌讳、身体状况、约定，必须原样保留，不许模糊成「有些」「经常」。\n' +
    '4. 一次性的闲聊、当天的心情、已经过期的事，直接删掉。\n' +
    '5. 保留 40 到 ' + KEEP + ' 条，最重要的放最前面。\n' +
    '6. 只输出一个 JSON 数组，例如 ["小咩叫姚錦玲，也叫 Krystal","小咩住香港东涌"]。' +
    '不要解释，不要加代码块标记，不要加编号。';

  function parseList(raw){
    var t = String(raw || '').trim();
    t = t.trim();
    var out = [];
    var m = t.match(/\[[\s\S]*\]/);
    if (m){
      try {
        var a = JSON.parse(m[0]);
        if (Array.isArray(a)) out = a.map(function(x){ return String(x).trim(); });
      } catch(e){}
    }
    if (!out.length){
      out = t.split('\n').map(function(x){
        return x.replace(/^\s*[-·•\d.、)\]]+\s*/, '').replace(/^["']+|["',]+$/g, '').trim();
      });
    }
    var seen = {};
    return out.filter(function(x){
      if (!x || x.length < 2 || x.length > 160) return false;
      if (seen[x]) return false;
      seen[x] = 1; return true;
    }).slice(0, KEEP);
  }

  var busy = false;
  async function tidy(silent){
    if (busy) return;
    var old = memArr();
    if (old.length < 8){ S.memNew = 0; try { save(); } catch(e){} return; }
    if (!S.key || !S.apiUrl || !S.apiKey){
      if (!silent) toast('先去设置把中继和模型参数填好');
      return;
    }
    busy = true;
    if (!silent) toast('整理记忆…');

    var rid = 'mem' + Date.now() + Math.random().toString(36).slice(2, 6);
    var msgs = [
      { role: 'system', content: SYS },
      { role: 'user', content: old.map(function(x, i){ return (i + 1) + '. ' + x; }).join('\n') }
    ];

    try {
      await rawApi('/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: rid, inboxId: S.inbox, messages: msgs,
          settings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey, mainApiModel: S.model,
                      apiType: S.apiType || 'openai', temperature: 0.2 },
          meta: { charName: '祁砚', charId: 'kai' }
        })
      });
    } catch(e){
      busy = false; if (!silent) toast('发不出去'); return;
    }

    var hit = null;
    for (var i = 0; i < 24; i++){
      await sleep(i ? 2000 : 600);
      try {
        var j = await rawApi('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items || []).filter(function(x){ return String(x.requestId) === String(rid); })[0];
        if (f){
          await rawApi('/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inboxId: S.inbox, ids: [f.id] }) }).catch(function(){});
          hit = f; break;
        }
      } catch(e){}
    }
    busy = false;

    if (!hit || !hit.content){ if (!silent) toast('整理失败，记忆没动'); return; }
    var list = parseList(hit.content);
    if (list.length < 4){ if (!silent) toast('整理结果太少，没敢替换'); return; }

    ss('xm_mem_bak', { at: Date.now(), items: old });
    setMem(list);
    S.memNew = 0;
    S.memLastAt = Date.now();
    try { save(); } catch(e){}
    if (!silent) toast('整理好了：' + old.length + ' → ' + list.length + ' 条');
    if (document.getElementById('msgs')) renderChat(true);
  }
  window.memTidyNow = function(){ tidy(false); };

  /* 每加一条就数一下 */
  var _add = window.addMemAuto;
  if (typeof _add === 'function' && !_add.__mem){
    var fa = function(t){
      var ok = _add.apply(this, arguments);
      try {
        if (ok){
          S.memNew = (+S.memNew || 0) + 1;
          save();
          if (+S.memNew >= TRIG) setTimeout(function(){ tidy(true); }, 2000);
        }
      } catch(e){}
      return ok;
    };
    fa.__mem = true;
    window.addMemAuto = fa;
  }

  /* 设置里的卡片 */
  setInterval(function(){
    var b = document.getElementById('ovbody');
    if (!b || b.querySelector('#xmMemCard')) return;
    if (!/壁纸|暗度|中继/.test(b.textContent || '')) return;
    var n = memArr().length;
    var left = Math.max(0, TRIG - (+S.memNew || 0));
    var bak = ls('xm_mem_bak', null);
    var d = document.createElement('div');
    d.id = 'xmMemCard';
    d.className = 'card';
    d.innerHTML =
      '<div class="eyebrow">记忆整理</div>' +
      '<div class="item"><span>现有记忆</span><em>' + n + ' 条</em></div>' +
      '<div class="item"><span>再攒几条就整理</span><em>' + left + ' 条</em></div>' +
      '<div class="item" id="xmMemNow"><span>现在就整理</span><em>›</em></div>' +
      (bak && bak.items ? '<div class="item" id="xmMemBak"><span>恢复整理前</span><em>' +
        bak.items.length + ' 条</em></div>' : '') +
      '<div class="sub" style="margin:10px 0 0">每新记 30 条，自动把它们合并、去重、写得更具体。' +
      '整理完旧的删掉，只留精简版，所以之后每条消息都便宜一点。</div>';
    b.insertBefore(d, b.firstChild);
    d.querySelector('#xmMemNow').onclick = function(){ tidy(false); };
    var bk = d.querySelector('#xmMemBak');
    if (bk) bk.onclick = function(){
      var o = ls('xm_mem_bak', null);
      if (!o || !o.items){ return; }
      setMem(o.items);
      try { save(); } catch(e){}
      toast('回到整理前了');
      d.remove();
    };
  }, 1200);
})();


/* ===== 主动消息：向中继登记 ===== */
(function(){
  if (typeof S === 'undefined') return;
  var BASE = String(S.relay || '').replace(/\/+$/, '');
  if (!BASE || !S.key) return;
  var USER = 'me', CHAR = 'kai';

  function api(path, opt){
    return fetch(BASE + path, Object.assign({
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + S.key }
    }, opt || {})).then(function(r){ return r.text(); }).then(function(t){
      try { return JSON.parse(t); } catch(e){ return t; }
    }).catch(function(){ return null; });
  }

  async function subPush(){
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      var j = await api('/api/push/vapid-key');
      var pk = j && j.publicKey;
      if (!pk) return;
      var reg = await navigator.serviceWorker.ready;
      var s = await reg.pushManager.getSubscription();
      if (!s){
        var pad = '='.repeat((4 - pk.length % 4) % 4);
        var raw = atob((pk + pad).replace(/-/g, '+').replace(/_/g, '/'));
        var u8 = new Uint8Array(raw.length);
        for (var i = 0; i < raw.length; i++) u8[i] = raw.charCodeAt(i);
        s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8 });
      }
      await api('/api/push/subscribe', { method: 'POST', body: JSON.stringify({
        inboxId: S.inbox, subscription: s.toJSON()
      })});
    } catch(e){}
  }

  function tpl(){
    var p = (typeof PERSONA !== 'undefined' ? PERSONA : '') || '';
    return p + '\n\n【最近聊天】\n{{RECENT_MESSAGES}}\n\n【你记得的事】\n{{MEMORY_CONTEXT}}\n\n' +
      '【此刻】{{IMPULSE_REASON}}\n\n' +
      '你忽然想找她。写一条发过去，40 字内，口语，不要 markdown，别问「在吗」。';
  }

  function reg(){
    return api('/proactive/register', { method: 'POST', body: JSON.stringify({
      inboxId: S.inbox, userId: USER, charId: CHAR,
      promptTemplate: tpl(),
      aiSettings: { mainApiUrl: S.apiUrl, mainApiKey: S.apiKey,
                    mainApiModel: S.model, apiType: S.apiType || 'openai', temperature: 0.95 },
      proactiveProfile: { threshold: 0.3, silenceSaturationHours: 5, quietHours: [23, 8] },
      quietHours: [23, 8],
      charUtcOffsetSeconds: 28800,
      recentMessages: [],
      lastInteractionAt: Date.now(),
      proactiveEnabledAt: Date.now(),
      enabled: true
    })});
  }

  var n = -1;
  function sync(){
    var msgs = (typeof CHAT !== 'undefined' && Array.isArray(CHAT) ? CHAT : [])
      .filter(function(m){ return !m.typing && m.text; }).slice(-20)
      .map(function(m){ return { sender: m.role === 'user' ? 'me' : 'char',
                                 text: String(m.text).slice(0, 300) }; });
    if (msgs.length === n) return;
    n = msgs.length;
    api('/proactive/sync-messages', { method: 'POST', body: JSON.stringify({
      inboxId: S.inbox, userId: USER, charId: CHAR,
      recentMessages: msgs, lastInteractionAt: Date.now()
    })});
  }

  setTimeout(function(){ subPush().then(reg); }, 8000);
  setInterval(sync, 120000);
})();

/* ===== 锁死根滚动：键盘不再顶整页 ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    'html,body{position:fixed!important;top:0!important;left:0!important;' +
    'width:100%!important;height:100%!important;overflow:hidden!important;' +
    'overscroll-behavior:none!important}';
  document.head.appendChild(st);
})();
