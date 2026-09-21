/* ============================================================
   咩&砚 · js/wechat.js
   微信 · 朋友圈 · 我页面 · 键盘与消息贴底
   ============================================================ */


/* ---------- 底部栏毛玻璃 ---------- */


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


/* ---------- 微信主页 / 通讯录 / 朋友圈 ---------- */


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
  var KAI_AVA = '#F6F1C9';

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
    '.wxTabs{flex:0 0 auto;display:grid;grid-template-columns:repeat(2,1fr);'+
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

  /* ---------- 存储 ---------- */
  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  var MOM = ls('xm_moments', []);
  function saveMom(){ ss('xm_moments', MOM.slice(-60)); }
    /* 清掉祁砚旧帖里的配图 */
  (function(){
    var hit = 0;
    MOM.forEach(function(m){ if (m.who === 'kai' && m.img){ m.img = ''; hit++; } });
    if (hit) saveMom();
  })();


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

  /* ---------- 中继调用（用 raw，避免和聊天 outbox 抢） ---------- */
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

  /* ---------- 他发一条 ---------- */
  async function kaiPost(){
    if (!S.key){ toastWx('先去设置填中继密钥'); return; }
    toastWx('他在写…');
    var raw = await ask('发一条朋友圈。只写正文，30 字内。不要引号，不要解释，'+
      '不要配图，不要写任何 [[ ]] 标记。');
    if (!raw){ toastWx('没写出来，再试一次'); return; }
    var txt = String(raw).split('\n')
      .map(function(x){ return x.trim(); })
      .filter(function(x){ return x && x.indexOf('[[') !== 0; })[0] || '';
    if (!txt){ toastWx('没写出来，再试一次'); return; }
    MOM.push({ who: 'kai', text: txt, img: '', t: Date.now(), likes: [], cms: [] });
    saveMom(); render();
    toastWx('他发了朋友圈');
  }

  /* ---------- 他看我的 ---------- */
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

  /* ---------- 界面 ---------- */
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

  function avaBox(url, cls){
    var c = url && url.charAt(0) === '#';
    return '<span class="' + (cls || 'wxAva') + '"' +
      (url && !c ? ' style="background-image:url(\'' + url + '\')"' : '') +
      (c ? ' style="background:' + url + '"' : '') + '></span>';
  }


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
          (m.img && m.who !== 'kai' ? '<img class="im" src="' + m.img + '">' : '') +
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
    var title = SUB === 'moments' ? '朋友圈' : TAB === 'wx' ? '聊天' : '我';
    var bd = SUB === 'moments' ? momentsPage()
      : TAB === 'wx' ? chatList() : TAB === 'book' ? bookList()
      : TAB === 'find' ? findList() : mePage();
    wx.innerHTML =
      '<div class="wxTop">' + (SUB === 'moments' ? '<span class="wxBack" id="wxBack">' + IC.back + '</span>' : '') +
        title + ((SUB === 'moments' || TAB === 'me') ? '<span class="wxPlus" id="wxNew">' + IC.plus + '</span>' : '') + '</div>' +
      '<div class="wxBody">' + bd + '</div>' +
      (SUB ? '' : '<div class="wxTabs">' +
        [['wx', IC.chat, ''], ['me', IC.me, '']].map(function(t){
          return '<div class="wxT' + (TAB === t[0] ? ' on' : '') + '" data-tab="' + t[0] + '">' +
            t[1] + '<span>' + t[2] + '</span></div>';
        }).join('') + '</div>');
    bind();
  }

  /* ---------- 发朋友圈 ---------- */
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

  /* ---------- 交互 ---------- */
  function bind(){
    wx.querySelectorAll('[data-tab]').forEach(function(el){
    el.onclick = function(){
  if (el.dataset.tab === 'find'){ TAB = 'wx'; SUB = 'moments'; }
  else { TAB = el.dataset.tab; SUB = ''; }
  render();
};

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

  /* ---------- 接管聊天入口 ---------- */
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

  /* ---------- 左边缘滑回 ---------- */
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
          if (TAB !== 'wx'){ TAB = 'wx'; SUB = ''; render(); }
          else if (SUB){ SUB = ''; render(); }
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


/* ---------- 朋友圈：下拉刷新 + 他评论/点赞了发通知 ---------- */


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
    
  function onMoments(){
    if (document.querySelector('#meSet.on')) return false;
    if (document.querySelector('#meEditBox')) return false;
    if (document.querySelector('#meFav2')) return false;
    return !!document.querySelector('#wx #wxBack') ||
           !!document.querySelector('#wx .wxT.on[data-tab="me"]');
  }


  document.addEventListener('touchstart', function(e){
    if (!onMoments() || busy) return;
    if (e.target && e.target.closest && e.target.closest('input,textarea')) return;
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
        if (typeof window.wxRefresh === 'function') window.wxRefresh();
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

/* ---------- 「我」页面改版 + 清空我的朋友圈（留备份 + 分析） ---------- */


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

  /* ---------- 自己问一次模型 ---------- */
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

  /* ---------- 我 页面 ---------- */
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

  /* ---------- 分析弹窗 ---------- */
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

  /* ---------- 清空我的朋友圈 ---------- */
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

  /* ---------- 我 的设置页 ---------- */
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
        '<div class="item" style="pointer-events:auto">' +
          '<span>隔几小时发一条</span>' +
          '<input id="meSetGap" type="number" inputmode="numeric" min="1" max="72" ' +
            'value="' + (+S.momGap || 8) + '" ' +
            'style="margin-left:auto;flex:0 0 auto;width:66px;height:34px;' +
            'border:1px solid rgba(0,0,0,.14);border-radius:10px;background:#fff;' +
            'color:#0b0b0b;font-size:15px;font-family:inherit;text-align:center;' +
            'padding:0;box-sizing:border-box;opacity:1;visibility:visible;' +
            'pointer-events:auto;-webkit-user-select:text;user-select:text;' +
            '-webkit-appearance:none;appearance:none;outline:none">' +
        '</div>' +

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
    if (q('meSetGap')){
      var g = q('meSetGap');
      g.oninput = function(){
        S.momGap = Math.max(1, Math.min(72, parseInt(this.value, 10) || 8));
        try { save(); } catch(e){}
      };
      g.onblur = function(){ this.value = (+S.momGap || 8); };
    }

    if (q('meSetNow')) q('meSetNow').onclick = function(){
      if (typeof window.kaiPostNow === 'function') window.kaiPostNow();
      else toast('要贴第 28 块才能用');
    };
    if (q('meSetClr')) q('meSetClr').onclick = function(){ clearMine(); };
  }

  /* ---------- 收藏 ---------- */
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

  /* ---------- 接管 我 页面 ---------- */
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
  window.openSet = openSet;
  setInterval(repaint, 800);
})();


/* ---------- 朋友圈升级：接着你的动态发 + 上网找图 + 自动发 ---------- */


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

  /* ---------- 上下文：人设 + 记忆 + 最近聊天 + 她最近两条朋友圈 ---------- */
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

  /* ---------- 上网找图 ---------- */
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

  /* ---------- 重绘朋友圈（正停在那页才动） ---------- */
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

  /* ---------- 他发一条 ---------- */
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

  /* ---------- 接管「让祁砚发一条」 ---------- */
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest ? e.target.closest('#wx [data-kai]') : null;
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();
    post(false);
  }, true);

  /* ---------- 自动发 ---------- */
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

  /* ---------- 设置里的卡片 ---------- */
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
      '<div class="item" style="pointer-events:auto">' +
        '<span>隔几小时发一条</span>' +
        '<input id="xmMomGap" type="number" inputmode="numeric" min="1" max="72" ' +
          'value="' + (+S.momGap || 8) + '" ' +
          'style="margin-left:auto;flex:0 0 auto;width:66px;height:34px;' +
          'border:1px solid rgba(0,0,0,.14);border-radius:10px;background:#fff;' +
          'color:#0b0b0b;font-size:15px;font-family:inherit;text-align:center;' +
          'padding:0;box-sizing:border-box;opacity:1;visibility:visible;' +
          'pointer-events:auto;-webkit-user-select:text;user-select:text;' +
          '-webkit-appearance:none;appearance:none;outline:none">' +
      '</div>' +
      '<div class="item" id="xmMomNow"><span>让他现在发一条</span><em>点一下</em></div>' +
      '<div class="sub" style="margin:10px 0 0">打开后他会在 8 点到 22 点之间自己发，隔多久由上面那个数决定。' +
      '他会先看你最近两条朋友圈，再决定是接着你说还是写自己的事。' +
      '配图去 Wikimedia Commons 搜真实照片，搜不到才退回抽象图。</div>';
    b.insertBefore(d, b.firstChild);
    var g2 = d.querySelector('#xmMomGap');
    g2.oninput = function(){
      S.momGap = Math.max(1, Math.min(72, parseInt(this.value, 10) || 8)); save();
    };
    g2.onblur = function(){ this.value = (+S.momGap || 8); };
    d.querySelector('#xmMomGap').oninput = function(){
      S.momGap = Math.max(1, Math.min(72, parseInt(this.value, 10) || 8)); save();
    };
    d.querySelector('#xmMomNow').onclick = function(){
      if (typeof window.kaiPostNow === 'function') window.kaiPostNow();
    };
  }, 1200);
})();


/* ---------- 右滑时挡住后面的壁纸 ---------- */


(function(){
  var p = document.createElement('div');
  p.id = 'wxPad';
  p.style.cssText = 'position:fixed;inset:0;z-index:17;background:#f4f4f2;display:none';
  document.body.appendChild(p);
  setInterval(function(){
    var w = document.getElementById('wx');
    p.style.display = (w && w.classList.contains('on')) ? 'block' : 'none';
  }, 200);
})();


/* ---------- 「我的」页面：头像居中 + 帖子流 + Edit Profile ---------- */


(function(){
  var st = document.createElement('style');
  st.textContent =
    '#wx .meWrap{padding:24px 0 calc(env(safe-area-inset-bottom) + 44px);text-align:center}'+
    '#wx .meAva{width:92px;height:92px;border-radius:50%;margin:0 auto;'+
      'background:#e6e6e2 center/cover;border:1px solid rgba(0,0,0,.06);'+
      'box-shadow:0 3px 14px rgba(0,0,0,.07)}'+
    '#wx .meName{display:block;margin-top:15px;font-size:17px;font-weight:500;'+
      'letter-spacing:.03em;color:#0b0b0b}'+
    '#wx .meHr{height:1px;background:rgba(0,0,0,.09);margin:14px 62px}'+
    '#wx .meSign{display:inline-block;max-width:78%;font-size:14px;font-weight:300;'+
  'line-height:1.7;color:#6b6b67;padding:11px 18px;border:1px solid rgba(0,0,0,.09);'+
  'border-radius:14px;background:#fff;word-break:break-word}'+
    '#wx .meSign.ph{color:#c6c6c2}'+
    '#wx .meStar{padding:2px 0;color:#8d8d89;line-height:0}'+
    '#wx .meStar:active{color:#0b0b0b}'+
    '#wx .meBtns{display:flex;gap:8px;padding:0 20px;margin-top:-6px}'+
    '#wx .meBtn2{flex:1;padding:10px;border-radius:12px;background:#fff;'+
      'font-size:13.5px;color:#0b0b0b;border:1px solid rgba(0,0,0,.08);'+
      'box-shadow:0 1px 4px rgba(0,0,0,.03)}'+
    '#wx .meBtn2:active{background:#f2f2f0;transform:scale(.985)}'+
    '#wx .pf{display:flex;gap:11px;padding:17px 18px 15px;text-align:left;'+
      'border-top:1px solid rgba(0,0,0,.07)}'+
    '#wx .pfAva{width:38px;height:38px;border-radius:50%;flex:0 0 auto;'+
      'background:#e6e6e2 center/cover;border:1px solid rgba(0,0,0,.05)}'+
    '#wx .pfR{flex:1;min-width:0}'+
    '#wx .pfN{font-size:13.5px;font-weight:500;color:#0b0b0b}'+
    '#wx .pfT{font-size:14.5px;line-height:1.72;color:#26262a;margin-top:5px;'+
      'white-space:pre-wrap;word-break:break-word}'+
    '#wx .pfI{width:100%;border-radius:12px;margin-top:10px;display:block}'+
    '#wx .pfB{display:flex;justify-content:flex-end;gap:18px;margin-top:9px;color:#b0b0ae}'+
    '#wx .pfB b{font-weight:400;font-size:11.5px;display:flex;align-items:center;gap:4px}'+
    '#wx .pfB b.on{color:#e0525f}'+
    '#wx .pfC{margin-top:9px;background:rgba(0,0,0,.04);border-radius:12px;'+
      'padding:10px 12px;font-size:12.5px;line-height:1.75;color:#4d4d4a;text-align:left}'+
    '#wx .pfC i{font-style:normal;font-weight:500;color:#26262a}'+
    '#wx .pfC .more{color:#8b8b87;margin-top:5px}'+
    '#wx .pfEmpty{padding:44px 30px;text-align:center;font-size:13px;line-height:1.9;color:#b4b4b0}'+
    '#wx .meFeed{margin-top:4px}';
  document.head.appendChild(st);

  var KAI = '#F6F1C9';
  function ls(k, d){ try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(d)); } catch(e){ return d; } }
  function ss(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
  function MOM(){ return ls('xm_moments', []); }
  function MYAVA(){ return localStorage.getItem('xm_ava') || ''; }
  function ago(t){
    var s = (Date.now() - t) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return Math.floor(s / 86400) + '天前';
  }
  function ava(url){
    var c = url && url.charAt(0) === '#';
    return '<span class="pfAva"' +
      (url && !c ? ' style="background-image:url(\'' + url + '\')"' : '') +
      (c ? ' style="background:' + url + '"' : '') + '></span>';
  }

  var STAR = '<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8' +
    '-5.2-2.75-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z"/></svg>';
  var HEART = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linejoin="round"><path d="M12 20.2S4.4 15.4 4.4 10.4a4 4 0 0 1 7.6-1.9 ' +
    '4 4 0 0 1 7.6 1.9c0 5-7.6 9.8-7.6 9.8z"/></svg>';
  var CMT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linejoin="round"><path d="M19.6 11.6c0 3.5-3.4 6.4-7.6 6.4-.9 0-1.8-.14-2.6-.4' +
    'L5 19.6l1.2-3c-1.3-1.2-2-2.9-2-5 0-3.5 3.4-6.4 7.6-6.4s7.8 2.9 7.8 6.4z"/></svg>';

  var openCm = {};

  function feed(list){
    if (!list.length)
      return '<div class="pfEmpty">还没有帖子。<br>右上角 + 发一条，<br>或者等他来找你。</div>';
    return list.slice().reverse().map(function(m, k){
      var i = list.length - 1 - k;
      var mine = m.who === 'me';
      var likes = m.likes || [], cms = m.cms || [];
      var liked = likes.indexOf(S.name || '小咩') >= 0;
      var show = openCm[i] ? cms : cms.slice(0, 2);
      return '<div class="pf" data-i="' + i + '">' +
        ava(mine ? MYAVA() : KAI) +
        '<div class="pfR">' +
          '<div class="pfN">' + esc(mine ? (S.name || '小咩') : '祁砚') + '</div>' +
          (m.text ? '<div class="pfT">' + esc(m.text) + '</div>' : '') +
          (m.img ? '<img class="pfI" src="' + m.img + '">' : '') +
          '<div class="pfB">' +
            '<b class="' + (liked ? 'on' : '') + '" data-like="' + i + '">' + HEART +
              (likes.length ? likes.length : '') + '</b>' +
            '<b data-cm="' + i + '">' + CMT + (cms.length ? cms.length : '') + '</b>' +
          '</div>' +
          (cms.length ? '<div class="pfC">' +
            show.map(function(c){
              return '<div><i>' + esc(c.who) + '</i> ' + esc(c.text) + '</div>';
            }).join('') +
            (!openCm[i] && cms.length > 2 ?
              '<div class="more" data-more="' + i + '">展开 ' + (cms.length - 2) + ' 条评论</div>' : '') +
            '</div>' : '') +
        '</div></div>';
    }).join('');
  }

  function meHtml(){
    var sign = String(S.sign || '').trim();
    return '<div class="meWrap">' +
      '<div class="meAva" id="meAva"' +
        (MYAVA() ? ' style="background-image:url(\'' + MYAVA() + '\')"' : '') + '></div>' +
      '<div class="meName">' + esc(S.name || '小咩') + '</div>' +
      '<div class="meHr"></div>' +
      '<div class="meSign' + (sign ? '' : ' ph') + '">' + esc(sign || '还没写签名') + '</div>' +
      '<div class="meHr"></div>' +
      '<div class="meStar" id="meStar">' + STAR + '</div>' +
      '<div class="meHr"></div>' +
      '<div class="meBtns">' +
        '<div class="meBtn2" id="meEditBtn">Edit Profile</div>' +
        '<div class="meBtn2" id="meSetBtn">Settings</div>' +
      '</div>' +
      '<div class="meFeed">' + feed(MOM()) + '</div>' +
    '</div>';
  }

  /* ---------- Edit Profile ---------- */
  function editProfile(){
    var old = document.getElementById('meEditBox'); if (old) old.remove();
    var ava = MYAVA();
    var d = document.createElement('div');
    d.id = 'meEditBox';
    d.style.cssText = 'position:fixed;inset:0;z-index:150;background:#f4f4f2;display:flex;flex-direction:column';
    d.innerHTML =
      '<div style="flex:0 0 auto;padding:calc(env(safe-area-inset-top) + 12px) 16px 12px;' +
        'display:flex;align-items:center;border-bottom:1px solid rgba(0,0,0,.07)">' +
        '<span id="epBack" style="width:34px;height:34px;display:grid;place-items:center;' +
          'border-radius:50%;font-size:24px;line-height:1;color:#0b0b0b">‹</span>' +
        '<b style="font-size:16px;font-weight:600">Edit Profile</b></div>' +
      '<div style="flex:1;overflow-y:auto;padding:34px 22px calc(env(safe-area-inset-bottom) + 30px);text-align:center">' +
        '<div id="epAva" style="width:104px;height:104px;border-radius:50%;margin:0 auto;' +
          'background:#e6e6e2 center/cover;border:1px solid rgba(0,0,0,.06)' +
          (ava ? ';background-image:url(\'' + ava + '\')' : '') + '"></div>' +
        '<div style="font-size:11.5px;color:#a8a8a4;margin-top:12px">点一下换头像</div>' +
        '<div style="text-align:left;font-size:11px;letter-spacing:.18em;color:#9a9a96;' +
          'margin:30px 0 10px">自我介绍</div>' +
        '<textarea id="epBio" maxlength="60" placeholder="写点什么…" ' +
          'style="width:100%;min-height:92px;border:1px solid rgba(0,0,0,.1);border-radius:14px;' +
          'padding:13px 15px;font-size:15px;line-height:1.7;background:#fff;color:#0b0b0b;' +
          'resize:none;box-sizing:border-box">' + esc(S.sign || '') + '</textarea>' +
        '<div style="font-size:11.5px;color:#b4b4b0;margin-top:8px;text-align:right">' +
          '<span id="epNum">' + String(S.sign || '').length + '</span>/60</div>' +
      '</div>';
    document.body.appendChild(d);

    var f = document.createElement('input');
    f.type = 'file'; f.accept = 'image/*'; f.style.display = 'none';
    document.body.appendChild(f);

    d.querySelector('#epBack').onclick = function(){ f.remove(); d.remove(); };
    d.querySelector('#epAva').onclick = function(){ f.click(); };
    var bio = d.querySelector('#epBio');
    bio.oninput = function(){
      d.querySelector('#epNum').textContent = this.value.length;
    };
    f.onchange = function(){
      var file = f.files && f.files[0]; f.value = '';
      if (!file) return;
      var fr = new FileReader();
      fr.onload = function(){
        var im = new Image();
        im.onload = function(){
          var mx = 320, s = Math.min(1, mx / im.naturalWidth, mx / im.naturalHeight);
          var c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(im.naturalWidth * s));
          c.height = Math.max(1, Math.round(im.naturalHeight * s));
          c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
          var u = c.toDataURL('image/jpeg', .72);
          try { localStorage.setItem('xm_ava', u); } catch(e){}
          var box = d.querySelector('#epAva');
          box.style.backgroundImage = 'url(\'' + u + '\')';
          repaint(true);
        };
        im.onerror = function(){};
        im.src = fr.result;
      };
      fr.readAsDataURL(file);
    };
    bio.onblur = function(){
      S.sign = this.value.trim();
      try { save(); } catch(e){}
      repaint(true);
    };
  }

  /* ---------- 收藏 ---------- */
  function favSheet(){
    var old = document.getElementById('meFav2'); if (old) old.remove();
    var list = ls('xm_favs', []);
    var d = document.createElement('div');
    d.id = 'meFav2';
    d.style.cssText = 'position:fixed;inset:0;z-index:150;background:rgba(0,0,0,.3);display:flex;align-items:flex-end';
    d.innerHTML = '<div style="width:100%;max-height:70vh;overflow-y:auto;background:#f4f4f2;' +
      'border-radius:20px 20px 0 0;padding:18px 16px calc(env(safe-area-inset-bottom) + 18px)">' +
      '<div style="font-size:15px;font-weight:600;margin-bottom:8px">收藏</div>' +
      (list.length ? list.map(function(t, i){
        return '<div style="display:flex;gap:10px;align-items:flex-start;padding:12px 0;' +
          'border-bottom:1px solid rgba(0,0,0,.07);font-size:13.5px;line-height:1.65">' +
          '<span style="flex:1" data-fc="' + i + '">' + esc(t) + '</span>' +
          '<b style="color:#c2c2be;font-weight:400;font-size:17px" data-fd="' + i + '">×</b></div>';
      }).join('') : '<div style="font-size:12.5px;color:#a8a8a4;padding:16px 2px;line-height:1.7">' +
        '还没有收藏。聊天里那条回复下面点星星就有了。</div>') +
      '</div>';
    d.onclick = function(e){
      if (e.target === d){ d.remove(); return; }
      var del = e.target.closest('[data-fd]');
      if (del){
        var a = ls('xm_favs', []);
        a.splice(+del.dataset.fd, 1); ss('xm_favs', a); favSheet(); return;
      }
      var cp = e.target.closest('[data-fc]');
      if (cp){ try { navigator.clipboard.writeText(cp.textContent); } catch(err){} }
    };
    document.body.appendChild(d);
  }

  /* ---------- 接管 ---------- */
  function repaint(force){
    var box = document.getElementById('wx');
    if (!box || !box.classList.contains('on')) return;
    var on = box.querySelector('.wxT.on');
    if (!on || on.dataset.tab !== 'me') return;
    var b = box.querySelector('.wxBody');
    if (!b) return;
    if (b.dataset.me2 === '1' && !force) return;
    b.dataset.me = '1';
    b.dataset.me2 = '1';
    b.innerHTML = meHtml();

    var q = function(id){ return b.querySelector('#' + id); };
    if (q('meAva')) q('meAva').onclick = function(){ editProfile(); };
    if (q('meStar')) q('meStar').onclick = function(){ favSheet(); };
    if (q('meEditBtn')) q('meEditBtn').onclick = function(){ editProfile(); };
    if (q('meSetBtn')) q('meSetBtn').onclick = function(){
      if (typeof window.openSet === 'function') window.openSet();
    };

    b.querySelectorAll('[data-like]').forEach(function(el){
      el.onclick = function(){
        var all = MOM(), i = +el.dataset.like, m = all[i];
        if (!m) return;
        m.likes = m.likes || [];
        var n = S.name || '小咩', p = m.likes.indexOf(n);
        if (p < 0) m.likes.push(n); else m.likes.splice(p, 1);
        ss('xm_moments', all); repaint(true);
      };
    });
    b.querySelectorAll('[data-more]').forEach(function(el){
      el.onclick = function(){ openCm[+el.dataset.more] = 1; repaint(true); };
    });
    b.querySelectorAll('[data-cm]').forEach(function(el){
      el.onclick = function(){
        var all = MOM(), i = +el.dataset.cm, m = all[i];
        if (!m) return;
        var t = window.prompt('回复');
        if (!t) return;
        m.cms = m.cms || [];
        m.cms.push({ who: S.name || '小咩', text: String(t).slice(0, 120) });
        ss('xm_moments', all); openCm[i] = 1; repaint(true);
      };
    });
  }

  new MutationObserver(function(){ setTimeout(repaint, 60); })
    .observe(document.body, { childList: true, subtree: true });
  window.wxRefresh = function(){ repaint(true); };
  setInterval(repaint, 300);
})();


/* ---------- 键盘弹出：只把输入栏和 + 面板抬到键盘上沿 ---------- */


(function(){
  var vv = window.visualViewport;
  if (!vv) return;
  var lastK = 0;

  function kbNow(){
    return Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
  }

  function apply(k){
    var bar = document.querySelector('#ov .inputbar');
    var pan = document.querySelector('#ov .xmPanel');
    var m   = document.getElementById('msgs');
    var dn  = document.getElementById('xmDown');
    var t   = k > 0 ? 'translateY(-' + k + 'px)' : '';
    if (bar) bar.style.transform = t;
    if (pan) pan.style.transform = t;
    if (dn)  dn.style.transform = t;
    if (m)   m.style.paddingBottom = k > 0 ? (k + 18) + 'px' : '';
  }

  function sync(){
    var k = kbNow();
    if (k) lastK = k;
    apply(k);
  }

  /* 键盘动画那几百毫秒里逐帧校正，肉眼看不出跳 */
  function burst(){
    var n = 0;
    (function step(){
      sync();
      if (++n < 60) requestAnimationFrame(step);
    })();
  }

  vv.addEventListener('resize', function(){ sync(); burst(); });
  vv.addEventListener('scroll', sync);
  addEventListener('resize', sync);
  document.addEventListener('focusin', function(){
    if (lastK) apply(lastK);   /* 先用上次量到的高度顶上，iOS 就没理由滚页面 */
    burst();
  }, true);
  document.addEventListener('focusout', function(){
    setTimeout(sync, 80); setTimeout(sync, 260);
  }, true);
  setInterval(sync, 200);
  sync();
})();


/* ---------- 消息贴底：少了压在底部，多了跟着最新一条 ---------- */


(function(){
  var st = document.createElement('style');
  st.textContent = '#msgs::before{content:"";margin-top:auto}';
  document.head.appendChild(st);

  function box(){ return document.getElementById('msgs'); }
  function near(b){ return b.scrollHeight - b.scrollTop - b.clientHeight < 140; }

  var lastH = 0, wasNear = true;

  document.addEventListener('scroll', function(e){
    if (e.target && e.target.id === 'msgs') wasNear = near(e.target);
  }, true);

  function fix(){
    var b = box(); if (!b) return;
    var h = b.clientHeight;
    if (h !== lastH){
      if (!lastH || wasNear) b.scrollTop = b.scrollHeight;
      lastH = h;
    }
    wasNear = near(b);
  }

  var vv = window.visualViewport;
  if (vv) vv.addEventListener('resize', function(){
    fix(); setTimeout(fix, 40); setTimeout(fix, 160); setTimeout(fix, 420);
  });
  addEventListener('resize', fix);
  document.addEventListener('focusin', function(){
    setTimeout(fix, 60); setTimeout(fix, 260); setTimeout(fix, 520);
  }, true);

  var _rc = window.renderChat;
  if (typeof _rc === 'function' && !_rc.__pad){
    var fr = function(){
      var r = _rc.apply(this, arguments);
      setTimeout(fix, 30);
      return r;
    };
    fr.__pad = true;
    window.renderChat = fr;
  }

  setInterval(fix, 500);
  fix();
})();


/* ---------- 微信那一层：打字时整块贴住可见区域 ---------- */


(function(){
  var vv = window.visualViewport;
  if (!vv) return;

  function pin(){
    var off = Math.round(vv.offsetTop);
    var h   = Math.round(vv.height);
    var kb  = Math.max(0, window.innerHeight - h - off);
    ['wx','meSet'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      var on = el.classList.contains('on');
      if (kb > 60 && on){
        el.style.top = off + 'px';
        el.style.height = h + 'px';
      } else if (el.style.top || el.style.height){
        el.style.top = '';
        el.style.height = '';
      }
    });
  }

  vv.addEventListener('resize', pin);
  vv.addEventListener('scroll', pin);
  addEventListener('resize', pin);
  setInterval(pin, 300);
  pin();
})();


/* ---------- 打字时顶栏跟着可视区走，永远贴在屏幕最上面 ---------- */


(function(){
  var vv = window.visualViewport;
  if (!vv) return;

  function move(){
    var off = Math.round(vv.offsetTop);
    var heads = document.querySelectorAll('#ov .ovtop, #sh .ovtop');
    for (var i = 0; i < heads.length; i++){
      heads[i].style.transform = off > 0 ? 'translateY(' + off + 'px)' : '';
    }
  }

  vv.addEventListener('scroll', move);
  vv.addEventListener('resize', move);
  addEventListener('resize', move);
  document.addEventListener('focusin', function(){
    move();
    var n = 0;
    (function step(){ move(); if (++n < 60) requestAnimationFrame(step); })();
  }, true);
  document.addEventListener('focusout', function(){ setTimeout(move, 80); setTimeout(move, 260); }, true);
  setInterval(move, 200);
  move();
})();

/* ===== 块 1A：本地数据库（原生 IndexedDB，不依赖任何库） ===== */
var WXDB = (function () {
  var NAME = 'xm_wx_v1', VER = 1, _p = null;
  var SCHEMA = {
    chats:      { key: 'id' },
    messages:   { key: 'id', ai: true, ix: [['byChatAt', ['chatId', 'createdAt']]] },
    groups:     { key: 'id' },
    moments:    { key: 'id', ai: true, ix: [['byTime', 'createdAt']] },
    comments:   { key: 'id', ai: true, ix: [['byMoment', 'momentId']] },
    likes:      { key: 'key' },
    finance:    { key: 'id', ai: true, ix: [['byTime', 'createdAt']] },
    redpackets: { key: 'id' },
    calls:      { key: 'id', ai: true, ix: [['byChat', 'chatId']] },
    memories:   { key: 'id', ai: true },
    thoughts:   { key: 'id', ai: true },
    config:     { key: 'key' },
    blobs:      { key: 'key' }
  };

  function open() {
    if (_p) return _p;
    _p = new Promise(function (res, rej) {
      var req;
      try { req = indexedDB.open(NAME, VER); } catch (e) { rej(e); return; }
      req.onupgradeneeded = function () {
        var db = req.result;
        Object.keys(SCHEMA).forEach(function (n) {
          if (db.objectStoreNames.contains(n)) return;
          var c = SCHEMA[n];
          var st = db.createObjectStore(n, c.ai ? { keyPath: c.key, autoIncrement: true } : { keyPath: c.key });
          (c.ix || []).forEach(function (i) { st.createIndex(i[0], i[1], { unique: false }); });
        });
      };
      req.onsuccess = function () {
        var db = req.result;
        db.onclose = function () { _p = null; };
        db.onversionchange = function () { try { db.close(); } catch (e) {} _p = null; };
        res(db);
      };
      req.onerror = function () { _p = null; rej(req.error || new Error('idb_open_failed')); };
      req.onblocked = function () { _p = null; rej(new Error('idb_blocked')); };
    });
    return _p;
  }

  function ask(r) {
    return new Promise(function (res, rej) {
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }

  function once(stores, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(stores, mode), out;
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error); };
        t.onabort = function () { rej(t.error || new Error('idb_abort')); };
        try { out = fn(t, ask); } catch (e) { try { t.abort(); } catch (_) {} rej(e); }
      });
    });
  }

  /* iOS 会把闲置连接回收，报错就重开一次再试 */
  function run(stores, mode, fn) {
    return once(stores, mode, fn).catch(function (err) {
      _p = null;
      return once(stores, mode, fn);
    });
  }

  function page(store, index, range, dir, limit) {
    return run([store], 'readonly', function (t) {
      return new Promise(function (res, rej) {
        var out = [], src = index ? t.objectStore(store).index(index) : t.objectStore(store);
        var r = src.openCursor(range || null, dir || 'prev');
        r.onsuccess = function () {
          var c = r.result;
          if (!c || out.length >= limit) return res(out);
          out.push(c.value); c.continue();
        };
        r.onerror = function () { rej(r.error); };
      });
    });
  }

  var API = {
    open: open, run: run, page: page,
    get: function (s, k) { return run([s], 'readonly', function (t) { return ask(t.objectStore(s).get(k)); }); },
    put: function (s, v) { return run([s], 'readwrite', function (t) { return ask(t.objectStore(s).put(v)); }); },
    del: function (s, k) { return run([s], 'readwrite', function (t) { return ask(t.objectStore(s).delete(k)); }); },
    all: function (s) { return run([s], 'readonly', function (t) { return ask(t.objectStore(s).getAll()); }); },
    count: function (s, q) { return run([s], 'readonly', function (t) { return ask(t.objectStore(s).count(q || null)); }); },
    cfg: function (k, d) { return API.get('config', k).then(function (r) { return r && 'value' in r ? r.value : d; }); },
    setCfg: function (k, v) { return API.put('config', { key: k, value: v }); }
  };
  return API;
})();
window.WXDB = WXDB;

/* ===== 块 1B：数据接口（会话 / 消息 / 迁移） ===== */
var WXStore = (function () {
  var SELF = 'user';
  function cid(charId) { return 'c_' + String(charId || 'kai'); }
  function head(m) { return String(m.text || '').replace(/\s+/g, ' ').slice(0, 40); }
  function rng(chatId, from, to) { return IDBKeyRange.bound([chatId, from], [chatId, to]); }

  async function ensureChat(charId, patch) {
    var id = cid(charId), cur = await WXDB.get('chats', id);
    var row = Object.assign({
      id: id, charId: String(charId || 'kai'), name: '祁砚', avatar: '', type: 'private',
      groupId: '', pinned: 0, muted: 0, unread: 0, draft: '', lastText: '', lastAt: 0
    }, cur || {}, patch || {});
    await WXDB.put('chats', row);
    return row;
  }

  async function listChats() {
    var rows = await WXDB.all('chats');
    return rows.sort(function (a, b) {
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.lastAt || 0) - (a.lastAt || 0);
    });
  }

  async function addMessage(chatId, m) {
    var row = Object.assign({
      chatId: chatId, role: SELF, kind: 'text', text: '', quote: '',
      createdAt: Date.now(), status: 'ok'
    }, m || {});
    var id = await WXDB.put('messages', row);
    var chat = await WXDB.get('chats', chatId);
    if (chat) {
      chat.lastText = head(row); chat.lastAt = row.createdAt;
      if (row.role !== SELF && !chat.muted) chat.unread = (chat.unread || 0) + 1;
      await WXDB.put('chats', chat);
    }
    return id;
  }

  async function recentMessages(chatId, limit) {
    var rows = await WXDB.page('messages', 'byChatAt', rng(chatId, -Infinity, Infinity), 'prev', limit || 60);
    return rows.reverse();
  }
  async function messagesBefore(chatId, createdAt, limit) {
    var rows = await WXDB.page('messages', 'byChatAt', rng(chatId, -Infinity, createdAt - 1), 'prev', limit || 60);
    return rows.reverse();
  }
  function hasEarlier(chatId, createdAt) {
    return WXDB.count('messages', rng(chatId, -Infinity, createdAt - 1)).then(function (n) { return n > 0; });
  }

  async function setDraft(chatId, text) {
    var chat = await WXDB.get('chats', chatId);
    if (!chat) return; chat.draft = String(text || ''); await WXDB.put('chats', chat);
  }
  async function markRead(chatId) {
    var chat = await WXDB.get('chats', chatId);
    if (!chat) return; chat.unread = 0; await WXDB.put('chats', chat);
  }
  async function togglePin(chatId) {
    var chat = await WXDB.get('chats', chatId);
    if (!chat) return 0; chat.pinned = chat.pinned ? 0 : 1; await WXDB.put('chats', chat); return chat.pinned;
  }
  async function toggleMute(chatId) {
    var chat = await WXDB.get('chats', chatId);
    if (!chat) return 0; chat.muted = chat.muted ? 0 : 1; await WXDB.put('chats', chat); return chat.muted;
  }

  /* 旧数据搬家：朋友圈 + 当前聊天记录，只跑一次 */
  async function migrate() {
    if (await WXDB.cfg('migrated_v1', false)) return { skipped: true };
    var out = { moments: 0, messages: 0 };
    try {
      var moms = JSON.parse(localStorage.getItem('xm_moments') || '[]');
      for (var i = 0; i < (moms || []).length; i++) {
        var m = moms[i] || {};
        await WXDB.put('moments', {
          id: String(m.id || ('legacy_' + i)), text: String(m.text || m.content || ''),
          img: m.img || '', createdAt: Number(m.at || m.createdAt) || Date.now(),
          likes: m.likes || [], comments: m.comments || [], pinned: m.pinned ? 1 : 0
        });
        out.moments++;
      }
    } catch (e) {}
    try {
      var id = cid('kai');
      await ensureChat('kai');
      var list = (typeof CHAT !== 'undefined' && Array.isArray(CHAT)) ? CHAT : [];
      for (var j = 0; j < list.length; j++) {
        var c = list[j] || {};
        if (c.typing || !c.text) continue;
        await WXDB.put('messages', {
          chatId: id, role: c.role === 'user' ? 'user' : 'assistant', kind: 'text',
          text: String(c.text), createdAt: Number(c.at || c.time) || (Date.now() + j), status: 'ok'
        });
        out.messages++;
      }
      var last = await recentMessages(id, 1);
      if (last.length) await ensureChat('kai', { lastText: head(last[0]), lastAt: last[0].createdAt });
    } catch (e) {}
    await WXDB.setCfg('migrated_v1', true);
    return out;
  }

  return {
    cid: cid, ensureChat: ensureChat, listChats: listChats, addMessage: addMessage,
    recentMessages: recentMessages, messagesBefore: messagesBefore, hasEarlier: hasEarlier,
    setDraft: setDraft, markRead: markRead, togglePin: togglePin, toggleMute: toggleMute,
    migrate: migrate, range: rng
  };
})();
window.WXStore = WXStore;

/* ===== 块 1C：IDB 版会话列表（开关：localStorage.xm_wxlist = 'idb'） ===== */
var WXList = (function () {
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function ago(t) {
    if (!t) return '';
    var s = (Date.now() - t) / 1000;
    if (s < 60) return '刚刚';
    if (s < 3600) return Math.floor(s / 60) + '分钟前';
    if (s < 86400) return Math.floor(s / 3600) + '小时前';
    return Math.floor(s / 86400) + '天前';
  }
  function rowHTML(c) {
    return '<div class="wxRow" data-wx-chat="' + esc(c.id) + '">' +
      '<span class="wxAva"' + (c.avatar ? ' style="background-image:url(\'' + esc(c.avatar) + '\')"' : '') + '></span>' +
      '<div class="wxMid"><b>' + esc(c.name) + (c.pinned ? ' ·置顶' : '') + (c.muted ? ' ·免打扰' : '') + '</b>' +
      '<span>' + esc(c.draft ? '[草稿] ' + c.draft : (c.lastText || '')) + '</span></div>' +
      '<em>' + ago(c.lastAt) + (c.unread ? ' · ' + c.unread : '') + '</em></div>';
  }
  async function render(body) {
    if (!body) return 0;
    var rows = await WXStore.listChats();
    body.innerHTML = rows.length ? rows.map(rowHTML).join('') : '<div class="wxHead">还没有会话</div>';
    return rows.length;
  }
  function mount() {
    if (localStorage.getItem('xm_wxlist') !== 'idb') return;
    var wx = document.getElementById('wx');
    var body = wx && wx.querySelector('.wxBody');
    if (!body) return;
    render(body);
    new MutationObserver(function () {
      if (!body.querySelector('[data-wx-chat]')) render(body);
    }).observe(body, { childList: true });
  }
  document.addEventListener('DOMContentLoaded', function () { setTimeout(mount, 900); });
  return { render: render, mount: mount, rowHTML: rowHTML };
})();
window.WXList = WXList;


/* ===== 块2：朋友圈 IDB + 渲染 ===== */
(function(){
  const DB = () => window.__xmDB;
  const store = 'moments';

  async function putMoment(m){
    const db = await DB();
    m.id = m.id || ('m_'+Date.now()+'_'+Math.random().toString(36).slice(2,7));
    m.ts = m.ts || Date.now();
    await db.put(store, m);
    return m;
  }
  async function allMoments(){
    const db = await DB();
    const list = await db.all(store);
    return list.sort((a,b)=>b.ts-a.ts);
  }
  async function delMoment(id){
    const db = await DB();
    await db.del(store, id);
  }

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  function card(m){
    const ava = (window.S && S.ava) || '';
    const imgs = (m.imgs||[]).map(u=><img class="momImg" src="${esc(u)}">).join('');
    return `<div class="mom" data-id="${esc(m.id)}">
      <div class="momAva"><img src="${esc(m.ava||ava)}"></div>
      <div class="momMain">
        <div class="momName">${esc(m.name||'我')}</div>
        <div class="momText">${esc(m.text||'')}</div>
        ${imgs?<div class="momImgs">${imgs}</div>:''}
        <div class="momFoot"><span class="momTime">${fmt(m.ts)}</span>
          <span class="momDel" data-del="${esc(m.id)}">删除</span></div>
      </div></div>`;
  }
  function fmt(t){
    const d=new Date(t), n=new Date(), p=x=>String(x).padStart(2,'0');
    if(d.toDateString()===n.toDateString()) return 今天 ${p(d.getHours())}:${p(d.getMinutes())};
    return ${d.getMonth()+1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())};
  }

  async function render(){
    const box = document.querySelector('.momList') || document.querySelector('#momList');
    if(!box) return;
    const list = await allMoments();
    box.innerHTML = list.length ? list.map(card).join('') : '<div class="momEmpty">还没有动态</div>';
  }

  async function migrate(){
    const raw = localStorage.getItem('xm_moments');
    if(!raw) return;
    let old=[]; try{ old=JSON.parse(raw)||[]; }catch(e){}
    if(!old.length) return;
    for(const m of old) await putMoment(m);
    localStorage.removeItem('xm_moments');
  }

  async function addFromInput(){
    const ta = document.querySelector('.momInput') || document.querySelector('#momInput');
    if(!ta) return;
    const text = (ta.value||'').trim();
    if(!text) return;
    await putMoment({text});
    ta.value='';
    render();
  }

  window.XM_MOM = { putMoment, allMoments, delMoment, render, migrate };

  document.addEventListener('click', async e=>{
    const del = e.target.closest('[data-del]');
    if(del){ await delMoment(del.dataset.del); render(); return; }
    if(e.target.closest('.momSend') || e.target.closest('#momSend')) addFromInput();
  });

  (async()=>{ await migrate(); render(); })();
})();
