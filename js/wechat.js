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


/* ===== 块3：微信会话列表接管 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'chats';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const now = () => Date.now();

  async function allChats(){
    const db = await DB();
    const l = await db.all(ST);
    return l.sort((a,b)=>(!!b.top-!!a.top)||((b.ts||0)-(a.ts||0)));
  }
  async function putChat(c){
    const db = await DB();
    c.id = c.id || ('c_'+now()+'_'+Math.random().toString(36).slice(2,6));
    c.ts = c.ts || now();
    await db.put(ST, c);
    return c;
  }
  async function delChat(id){ const db=await DB(); await db.del(ST,id); }

  async function pushMsg(id, msg){
    const db = await DB();
    const c = await db.get(ST, id);
    if(!c) return null;
    c.msgs = c.msgs || [];
    c.msgs.push(Object.assign({ts:now()}, msg));
    c.ts = now();
    c.last = msg.text || c.last;
    if(msg.role !== 'user') c.unread = (c.unread||0) + 1;
    await db.put(ST, c);
    return c;
  }

  function tm(ts){
    if(!ts) return '';
    const d=new Date(ts), n=new Date(), p=x=>String(x).padStart(2,'0');
    if(d.toDateString()===n.toDateString()) return p(d.getHours())+':'+p(d.getMinutes());
    return (d.getMonth()+1)+'/'+d.getDate();
  }

  function row(c){
    const b = c.unread ? `<span class="wxBadge">${c.unread>99?'99+':c.unread}</span>` : '';
    return `<div class="wxRow" data-cid="${esc(c.id)}">
      <div class="wxAva"><img src="${esc(c.ava||'')}"></div>
      <div class="wxMid"><div class="wxName">${esc(c.name||'')}</div>
        <div class="wxLast">${esc(c.last||'')}</div></div>
      <div class="wxRight"><div class="wxTime">${tm(c.ts)}</div>${b}</div>
    </div>`;
  }

  async function renderList(){
    const box = document.querySelector('.wxBody') || document.querySelector('#wxBody');
    if(!box) return;
    const l = await allChats();
    box.innerHTML = l.length ? l.map(row).join('') : '<div class="wxEmpty">暂无会话</div>';
  }

  async function openChat(id){
    const db = await DB();
    const c = await db.get(ST, id);
    if(!c) return null;
    if(c.unread){ c.unread = 0; await db.put(ST, c); }
    return c;
  }

  window.XM_WX = { allChats, putChat, delChat, pushMsg, renderList, openChat };

  document.addEventListener('click', async e=>{
    const r = e.target.closest('.wxRow');
    if(!r) return;
    const c = await openChat(r.dataset.cid);
    if(c && window.XM_CHAT && XM_CHAT.load) XM_CHAT.load(c.msgs||[]);
    renderList();
  });
})();

/* ===== 块4：通讯录 + 我的 ===== */
(function(){
  const DB = () => window.__xmDB;
  const CT = 'contacts', ME = 'me';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  async function allContacts(){
    const db = await DB(); const l = await db.all(CT);
    return l.sort((a,b)=>(a.name||'').localeCompare(b.name||'','zh'));
  }
  async function putContact(c){
    const db = await DB();
    c.id = c.id || ('ct_'+Date.now()+'_'+Math.random().toString(36).slice(2,6));
    await db.put(CT, c); return c;
  }
  async function delContact(id){ const db=await DB(); await db.del(CT,id); }

  async function getMe(){ const db=await DB(); return (await db.get(ME,'me')) || {id:'me',name:'小咩',ava:''}; }
  async function saveMe(p){ const db=await DB(); const m=Object.assign(await getMe(),p,{id:'me'}); await db.put(ME,m); return m; }

  async function renderContacts(){
    const box = document.querySelector('.ctList') || document.querySelector('#ctList');
    if(!box) return;
    const l = await allContacts();
    box.innerHTML = l.length ? l.map(c=>`<div class="wxRow" data-ct="${esc(c.id)}">
      <div class="wxAva"><img src="${esc(c.ava||'')}"></div>
      <div class="wxMid"><div class="wxName">${esc(c.name||'')}</div>
        <div class="wxLast">${esc(c.sign||'')}</div></div></div>`).join('')
      : '<div class="wxEmpty">通讯录空的</div>';
  }

  async function renderMe(){
    const m = await getMe();
    const ava = document.querySelector('#meSet .meAva img, .meAva img');
    const nm  = document.querySelector('#meSet .meName, .meName');
    if(ava) ava.src = m.ava || '';
    if(nm)  nm.textContent = m.name || '';
    return m;
  }

  async function migrate(){
    const raw = localStorage.getItem('xm_contacts');
    if(raw){ let o=[]; try{o=JSON.parse(raw)||[];}catch(e){}
      for(const c of o) await putContact(c); localStorage.removeItem('xm_contacts'); }
    const ava = localStorage.getItem('xm_ava');
    if(ava){ await saveMe({ava}); }
  }

  window.XM_CT = { allContacts, putContact, delContact, getMe, saveMe, renderContacts, renderMe };

  document.addEventListener('click', async e=>{
    const r = e.target.closest('[data-ct]');
    if(r && window.XM_WX && XM_WX.openChat) return;
  });

  (async()=>{ await migrate(); renderContacts(); renderMe(); })();
})();

/* ===== 块5：朋友圈发图 + 点赞评论 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'moments';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function pickImgs(){
    return new Promise(res=>{
      const f=document.createElement('input');
      f.type='file'; f.accept='image/*'; f.multiple=true;
      f.onchange=()=>{
        const fs=[...f.files].slice(0,9); if(!fs.length) return res([]);
        let out=[], n=0;
        fs.forEach(file=>{
          const r=new FileReader();
          r.onload=()=>{
            const im=new Image();
            im.onload=()=>{
              const mx=1080, s=Math.min(1, mx/Math.max(im.width,im.height));
              const cv=document.createElement('canvas');
              cv.width=im.widths|0; cv.height=im.heights|0;
              cv.getContext('2d').drawImage(im,0,0,cv.width,cv.height);
              out.push(cv.toDataURL('image/jpeg',0.82));
              if(++n===fs.length) res(out);
            };
            im.src=r.result;
          };
          r.readAsDataURL(file);
        });
      };
      f.click();
    });
  }

  async function addMoment(text, imgs){
    const db = await DB();
    const m = {id:'m_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
      text:text||'', imgs:imgs||[], ts:Date.now(), likes:[], comments:[]};
    await db.put(ST, m); return m;
  }
  async function getMoment(id){ const db=await DB(); return db.get(ST,id); }
  async function saveMoment(m){ const db=await DB(); await db.put(ST,m); return m; }

  async function toggleLike(id, who){
    const m = await getMoment(id); if(!m) return null;
    m.likes = m.likes||[];
    const i = m.likes.indexOf(who);
    i<0 ? m.likes.push(who) : m.likes.splice(i,1);
    return saveMoment(m);
  }
  async function addComment(id, who, text){
    const m = await getMoment(id); if(!m) return null;
    m.comments = m.comments||[];
    m.comments.push({who, text, ts:Date.now()});
    return saveMoment(m);
  }
  async function delComment(id, idx){
    const m = await getMoment(id); if(!m||!m.comments) return null;
    m.comments.splice(idx,1); return saveMoment(m);
  }

  window.XM_MOM2 = { pickImgs, addMoment, getMoment, saveMoment, toggleLike, addComment, delComment };

  document.addEventListener('click', async e=>{
    if(e.target.closest('.momPick') || e.target.closest('#momPick')){
      const ta=document.querySelector('.momInput')||document.querySelector('#momInput');
      const imgs = await pickImgs();
      if(!imgs.length) return;
      await addMoment(ta?ta.value.trim():'', imgs);
      if(ta) ta.value='';
      if(window.XM_MOM && XM_MOM.render) XM_MOM.render();
      return;
    }
    const lk = e.target.closest('[data-like]');
    if(lk){ await toggleLike(lk.dataset.like, '我'); if(window.XM_MOM) XM_MOM.render(); return; }
  });
})();

/* ===== 块6：发现页 + 钱包 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'wallet';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const IC = {
    moments:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="9" r="2.2"/><path d="M7.5 17c.8-2 2.5-3 4.5-3s3.7 1 4.5 3"/></svg>',
    scan:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8V5h3M20 8V5h-3M4 16v3h3M20 16v3h-3"/><path d="M4 12h16"/></svg>',
    shake:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M3.5 8l2 2-2 2M20.5 8l-2 2 2 2"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><circle cx="17" cy="14" r="1.2"/></svg>',
    mini:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8.5" cy="8.5" r="4"/><circle cx="15.5" cy="15.5" r="4"/></svg>'
  };

  const DISCOVER = [
    {k:'moments', t:'朋友圈', i:IC.moments},
    {k:'scan',    t:'扫一扫', i:IC.scan},
    {k:'shake',   t:'摇一摇', i:IC.shake},
    {k:'wallet',  t:'钱包',   i:IC.wallet},
    {k:'mini',    t:'小程序', i:IC.mini}
  ];

  function renderDiscover(){
    const box = document.querySelector('.dcList') || document.querySelector('#dcList');
    if(!box) return;
    box.innerHTML = DISCOVER.map(d=>`<div class="wxRow" data-dc="${d.k}">
      <div class="wxAva dcIc">${d.i}</div>
      <div class="wxMid"><div class="wxName">${d.t}</div></div>
      <div class="wxRight">›</div></div>`).join('');
  }

  async function getWallet(){ const db=await DB(); return (await db.get(ST,'me')) || {id:'me', balance:0, log:[]}; }
  async function saveWallet(w){ const db=await DB(); await db.put(ST,w); return w; }
  async function tx(amount, note){
    const w = await getWallet();
    w.balance = Math.round((w.balance + amount)*100)/100;
    w.log = w.log||[];
    w.log.unshift({amount, note:note||'', ts:Date.now(), after:w.balance});
    if(w.log.length>200) w.log.length=200;
    return saveWallet(w);
  }

  async function renderWallet(){
    const box = document.querySelector('.wlBody') || document.querySelector('#wlBody');
    if(!box) return;
    const w = await getWallet();
    const rows = (w.log||[]).map(l=>`<div class="wxRow">
      <div class="wxMid"><div class="wxName">${esc(l.note||'—')}</div>
        <div class="wxLast">${new Date(l.ts).toLocaleString('zh-HK',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}</div></div>
      <div class="wxRight" style="color:${l.amount<0?'#8a8a8a':'#4a9e5c'}">${l.amount>0?'+':''}${l.amount}</div>
    </div>`).join('');
    box.innerHTML = `<div class="wlTop"><div class="wlBal">¥ ${w.balance}</div></div>
      <div class="wlList">${rows||'<div class="wxEmpty">还没有记录</div>'}</div>`;
  }

  window.XM_DC = { renderDiscover, getWallet, saveWallet, tx, renderWallet };

  document.addEventListener('click', async e=>{
    const d = e.target.closest('[data-dc]');
    if(!d) return;
    const k = d.dataset.dc;
    if(k==='wallet'){ if(window.openApp) openApp('wallet'); renderWallet(); }
    else if(k==='moments'){ if(window.openApp) openApp('moments'); }
  });

  renderDiscover();
})();

/* ===== 块7：设置 + 备份 ===== */
(function(){
  const DB = () => window.__xmDB;
  const TABLES = ['chats','moments','contacts','wallet','me'];

  async function exportAll(){
    const db = await DB();
    const out = {ver:1, ts:Date.now(), data:{}};
    for(const t of TABLES) out.data[t] = await db.all(t);
    return out;
  }

  function download(name, text){
    const b = new Blob([text], {type:'application/json'});
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(u), 3000);
  }

  async function doExport(){
    const d = await exportAll();
    const n = new Date();
    const p = x=>String(x).padStart(2,'0');
    download(xm-backup-${n.getFullYear()}${p(n.getMonth()+1)}${p(n.getDate())}.json,
      JSON.stringify(d, null, 2));
  }

  function pickFile(){
    return new Promise(res=>{
      const f=document.createElement('input');
      f.type='file'; f.accept='.json,application/json';
      f.onchange=()=>{
        const file=f.files[0]; if(!file) return res(null);
        const r=new FileReader();
        r.onload=()=>{ try{ res(JSON.parse(r.result)); }catch(e){ res({__err:e.message}); } };
        r.readAsText(file);
      };
      f.click();
    });
  }

  async function doImport(){
    const d = await pickFile();
    if(!d) return {ok:false, msg:'没选文件'};
    if(d.__err) return {ok:false, msg:'JSON 坏了：'+d.__err};
    if(!d.data) return {ok:false, msg:'不是备份文件'};
    const db = await DB();
    let n = 0;
    for(const t of TABLES){
      const arr = d.data[t] || [];
      for(const row of arr){ await db.put(t, row); n++; }
    }
    return {ok:true, msg:导入 ${n} 条};
  }

  window.XM_BAK = { exportAll, doExport, doImport };

  document.addEventListener('click', async e=>{
    if(e.target.closest('#bakOut') || e.target.closest('.bakOut')){ doExport(); return; }
    if(e.target.closest('#bakIn') || e.target.closest('.bakIn')){
      const r = await doImport();
      if(window.toast) toast(r.msg);
      if(window.XM_WX) XM_WX.renderList();
      if(window.XM_MOM) XM_MOM.render();
      return;
    }
  });
})();

/* ===== 块8：微信聊天接中继 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'chats';
  const KEY = () => (window.S && S.relay) || '';

  function jpost(url, body, sig){
    return fetch(url, {
      method:'POST',
      headers:{'Content-Type':'application/json', ...(sig?{Authorization:'Bearer '+sig}:{})},
      body:JSON.stringify(body)
    }).then(r=>r.json());
  }

  async function ensureChat(cid, name){
    const db = await DB();
    let c = await db.get(ST, cid);
    if(!c){ c = {id:cid, name:name||cid, msgs:[], ts:Date.now(), unread:0, last:''}; await db.put(ST,c); }
    return c;
  }

  async function send(cid, text){
    if(!text || !text.trim()) return;
    const base = KEY();
    if(!base) return {ok:false, msg:'没配中继'};
    const c = await ensureChat(cid);
    c.msgs = c.msgs||[];
    c.msgs.push({role:'user', text, ts:Date.now()});
    c.last = text; c.ts = Date.now();
    await DB().then(d=>d.put(ST,c));
    if(window.XM_WX) XM_WX.renderList();

    try{
      await jpost(base.replace(/\/$/,'')+'/generate', {
        chat_id: cid,
        messages: c.msgs.map(m=>({role: m.role==='user'?'user':'assistant', content:m.text}))
      });
    }catch(e){ return {ok:false, msg:'发送失败'}; }
    return {ok:true};
  }

  async function poll(cid){
    const base = KEY();
    if(!base) return null;
    let res;
    try{ res = await jpost(base.replace(/\/$/,'')+'/outbox', {chat_id: cid}); }
    catch(e){ return null; }
    const list = (res && (res.messages || res.items)) || [];
    if(!list.length) return null;

    const db = await DB();
    const c = await db.get(ST, cid); if(!c) return null;
    c.msgs = c.msgs||[];
    const ids = [];
    for(const m of list){
      const text = m.text || m.content || '';
      if(!text) continue;
      c.msgs.push({role: m.role==='user'?'user':'ai', text, ts: m.ts||Date.now()});
      c.last = text;
      if(m.id) ids.push(m.id);
    }
    c.ts = Date.now();
    if(c.unread!=null) c.unread = 0;
    await db.put(ST, c);
    if(ids.length){
      try{ await jpost(base.replace(/\/$/,'')+'/ack', {chat_id: cid, ids}); }catch(e){}
    }
    if(window.XM_WX) XM_WX.renderList();
    return c.msgs;
  }

  window.XM_RELAY = { send, poll };
})();

/* ===== 块9：输入栏接管 + 轮询 + 皮肤 ===== */
(function(){
  let curCid = null, timer = null;

  function isWx(){
    const l = document.getElementById('wxLayer') || document.querySelector('#wx');
    return l && getComputedStyle(l).display !== 'none';
  }

  function applySkin(on){
    document.body.classList.toggle('wxskin', !!on);
    try{ localStorage.setItem('xm_wxskin', on?'1':'0'); }catch(e){}
  }

  function startPoll(cid){
    stopPoll();
    curCid = cid;
    if(!cid) return;
    timer = setInterval(async ()=>{
      const msgs = await window.XM_RELAY.poll(cid);
      if(msgs && window.XM_CHAT && XM_CHAT.load) XM_CHAT.load(msgs);
    }, 3000);
  }
  function stopPoll(){ if(timer){ clearInterval(timer); timer=null; } curCid=null; }

  function wireInput(){
    const bar = document.querySelector('.inputbar');
    if(!bar) return;
    const ta = bar.querySelector('textarea, input[type=text]');
    const btn = bar.querySelector('.send, #send, [data-send]');
    if(!ta || !btn) return;

    const fire = async ()=>{
      const t = (ta.value||'').trim();
      if(!t || !curCid) return;
      ta.value=''; ta.style.height='auto';
      const r = await window.XM_RELAY.send(curCid, t);
      if(!r || !r.ok){ if(window.toast) toast(r&&r.msg||'发失败'); return; }
      startPoll(curCid);
    };

    if(!btn.__xmWired){
      btn.__xmWired = true;
      btn.addEventListener('click', e=>{ e.preventDefault(); fire(); });
      ta.addEventListener('keydown', e=>{
        if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); fire(); }
      });
    }
  }

  window.XM_CHATUI = {
    open(cid){
      curCid = cid;
      startPoll(cid);
      setTimeout(wireInput, 100);
    },
    close(){ stopPoll(); },
    applySkin,
    get skin(){ return document.body.classList.contains('wxskin'); }
  };

  // 启动时读皮肤
  try{ applySkin(localStorage.getItem('xm_wxskin')==='1'); }catch(e){}

  // 微信层被点开/关闭时切换轮询
  document.addEventListener('click', e=>{
    if(e.target.closest('[data-cid]')){
      const r = e.target.closest('[data-cid]');
      setTimeout(()=>XM_CHATUI.open(r.dataset.cid), 50);
    }
    const back = e.target.closest('.ovtop .back, #ovBack, .wxBack');
    if(back) XM_CHATUI.close();
    const sk = e.target.closest('#skinToggle, .skinToggle');
    if(sk) applySkin(!XM_CHATUI.skin);
  });
})();

/* ===== 块10：群聊 + 红包 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'chats';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const rid = p => p+''+Date.now()+''+Math.random().toString(36).slice(2,6);

  async function createGroup(name, members){
    const db = await DB();
    const g = {id:rid('g'), name:name||'群聊', members:members||[], msgs:[], ts:Date.now(), unread:0, last:'', group:true};
    await db.put(ST, g);
    if(window.XM_WX) XM_WX.renderList();
    return g;
  }

  async function addMember(gid, name){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.members = g.members||[];
    if(!g.members.includes(name)) g.members.push(name);
    await db.put(ST, g); return g;
  }
  async function delMember(gid, name){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.members = (g.members||[]).filter(m=>m!==name);
    await db.put(ST, g); return g;
  }

  async function pushGroupMsg(gid, sender, text){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.msgs = g.msgs||[];
    g.msgs.push({role: sender==='我'?'user':'ai', sender, text, ts:Date.now()});
    g.last = (g.members.length>2 && sender!=='我' ? sender+'：' : '')+text;
    g.ts = Date.now();
    await db.put(ST, g);
    if(window.XM_WX) XM_WX.renderList();
    return g;
  }

  // —— 红包 ——
  async function sendPacket(cid, amount, note, count){
    const db = await DB(); const c = await db.get(ST, cid); if(!c) return null;
    c.msgs = c.msgs||[];
    c.msgs.push({role:'user', type:'rp', ts:Date.now(),
      rp:{id:rid('rp'), amount:Math.round(amount*100)/100, note:note||'恭喜发财', total:count||1, got:[], open:false}});
    c.last = '[红包] '+ (note||'恭喜发财'); c.ts = Date.now();
    await db.put(ST, c);
    if(window.XM_WX) XM_WX.renderList();
    return c;
  }

  async function openPacket(cid, msgTs, who){
    const db = await DB(); const c = await db.get(ST, cid); if(!c) return null;
    const m = (c.msgs||[]).find(x=>x.ts===msgTs && x.rp); if(!m) return null;
    const rp = m.rp;
    if(rp.got.includes(who)) return {ok:false, msg:'已经领过了'};
    if(rp.got.length >= rp.total) return {ok:false, msg:'红包被抢光了'};
    const left = rp.total - rp.got.length;
    let amt;
    if(left<=1) amt = Math.round((rp.amount - rp.got.reduce((s,g)=>s+g.amount,0))*100)/100;
    else{
      const avg = (rp.amount - rp.got.reduce((s,g)=>s+g.amount,0)) / left;
      amt = Math.round(avg * (0.5 + Math.random()) * 100)/100;
      const rest = rp.amount - rp.got.reduce((s,g)=>s+g.amount,0);
      if(amt > rest - (left-1)*0.01) amt = Math.round((rest - (left-1)*0.01)*100)/100;
      if(amt < 0.01) amt = 0.01;
    }
    rp.got.push({who, amount:amt, ts:Date.now()});
    if(rp.got.length >= rp.total) rp.open = true;
    await db.put(ST, c);
    if(window.XM_DC && who==='我') await XM_DC.tx(amt, '收到红包');
    return {ok:true, amount:amt, rp};
  }

  window.XM_GROUP = { createGroup, addMember, delMember, pushGroupMsg, sendPacket, openPacket };

  document.addEventListener('click', async e=>{
    const rp = e.target.closest('[data-rp]');
    if(rp){
      const ts = Number(rp.dataset.rp);
      const box = rp.closest('[data-cid]');
      const cid = box ? box.dataset.cid : (window.__curCid||null);
      const res = await openPacket(cid, ts, '我');
      if(window.toast) toast(res && res.ok ? 抢到 ¥${res.amount} : (res&&res.msg||'打不开'));
      if(window.XM_MOM) {}
    }
  });
})();

/* ===== 块10：群聊 + 红包 ===== */
(function(){
  const DB = () => window.__xmDB;
  const ST = 'chats';
  const rid = p => p+''+Date.now()+''+Math.random().toString(36).slice(2,6);

  async function createGroup(name, members){
    const db = await DB();
    const g = {id:rid('g'), name:name||'群聊', members:members||[],
      msgs:[], ts:Date.now(), unread:0, last:'', group:true};
    await db.put(ST, g);
    if(window.XM_WX) XM_WX.renderList();
    return g;
  }
  async function addMember(gid, name){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.members = g.members||[];
    if(!g.members.includes(name)) g.members.push(name);
    await db.put(ST, g); return g;
  }
  async function delMember(gid, name){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.members = (g.members||[]).filter(m=>m!==name);
    await db.put(ST, g); return g;
  }
  async function pushGroupMsg(gid, sender, text){
    const db = await DB(); const g = await db.get(ST, gid); if(!g) return null;
    g.msgs = g.msgs||[];
    g.msgs.push({role: sender==='我'?'user':'ai', sender, text, ts:Date.now()});
    g.last = (g.members.length>2 && sender!=='我' ? sender+'：' : '')+text;
    g.ts = Date.now();
    await db.put(ST, g);
    if(window.XM_WX) XM_WX.renderList();
    return g;
  }

  async function sendPacket(cid, amount, note, count){
    const db = await DB(); const c = await db.get(ST, cid); if(!c) return null;
    const id = rid('rp');
    c.msgs = c.msgs||[];
    c.msgs.push({role:'user', type:'rp', text:'[[RP:'+id+']]', ts:Date.now(),
      rp:{id, amount:Math.round(amount*100)/100, note:note||'恭喜发财',
          total:count||1, got:[], open:false}});
    c.last = '[红包] '+(note||'恭喜发财');
    c.ts = Date.now();
    await db.put(ST, c);
    if(window.XM_WX) XM_WX.renderList();
    return c;
  }

  async function openPacket(rpId, who){
    const db = await DB();
    for(const c of await db.all(ST)){
      const m = (c.msgs||[]).find(x=>x.rp && x.rp.id===rpId);
      if(!m) continue;
      const rp = m.rp;
      if(rp.got.some(g=>g.who===who)) return {ok:false, msg:'已经领过了'};
      if(rp.got.length >= rp.total) return {ok:false, msg:'红包被抢光了'};
      const rest = Math.round((rp.amount - rp.got.reduce((s,g)=>s+g.amount,0))*100)/100;
      const left = rp.total - rp.got.length;
      let amt;
      if(left <= 1) amt = rest;
      else{
        const avg = rest/left;
        amt = Math.round(avg*(0.5+Math.random())*100)/100;
        if(amt > rest-(left-1)*0.01) amt = Math.round((rest-(left-1)*0.01)*100)/100;
        if(amt < 0.01) amt = 0.01;
      }
      rp.got.push({who, amount:amt, ts:Date.now()});
      if(rp.got.length >= rp.total) rp.open = true;
      await db.put(ST, c);
      if(who==='我' && window.XM_DC) await XM_DC.tx(amt, '收到红包');
      return {ok:true, amount:amt, rp};
    }
    return {ok:false, msg:'找不到这个红包'};
  }

  window.XM_GROUP = { createGroup, addMember, delMember, pushGroupMsg, sendPacket, openPacket };

  document.addEventListener('click', async e=>{
    const el = e.target.closest('[data-rp]');
    if(!el) return;
    const res = await openPacket(el.dataset.rp, '我');
    if(window.toast) toast(res && res.ok ? ('抢到 ¥'+res.amount) : ((res&&res.msg)||'打不开'));
    if(res && res.ok && window.XM_RPUI) XM_RPUI.scan();
  });
})();


/* ===== 块11：红包气泡替换 ===== */
(function(){
  const DB = () => window.__xmDB;
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function rpHTML(rp){
    const got = rp.got||[];
    const left = Math.max(0,(rp.total||1)-got.length);
    const mine = got.find(g=>g.who==='我');
    const face = left===0 ? '已领完' : (mine ? '¥'+mine.amount : '¥ '+rp.amount);
    return `<div class="rp${left===0?' rpDone':''}" data-rp="${esc(rp.id)}">
      <div class="rpTop"><span class="rpIco"></span><span class="rpTxt">${esc(rp.note||'恭喜发财')}</span></div>
      <div class="rpBot">${face}</div>
      <div class="rpMeta">${got.length}/${rp.total||1} 已领</div>
    </div>`;
  }

  async function findRp(id){
    const db = await DB();
    for(const c of await db.all('chats'))
      for(const m of (c.msgs||[]))
        if(m.rp && m.rp.id===id) return m.rp;
    return null;
  }

  function scan(){
    document.querySelectorAll('body *').forEach(el=>{
      if(el.dataset && el.dataset.rpDone) return;
      if(el.children.length) return;
      const t = el.textContent||'';
      const i = t.indexOf('[[RP:'); if(i<0) return;
      const j = t.indexOf(']]', i); if(j<0) return;
      const id = t.slice(i+5, j);
      const host = el.closest('.bub,.msg,.bubble') || el.parentElement || el;
      findRp(id).then(rp=>{
        if(!rp || !host) return;
        host.dataset.rpDone = '1';
        host.innerHTML = rpHTML(rp);
      });
    });
  }

  window.XM_RPUI = { scan, rpHTML };

  new MutationObserver(()=>scan()).observe(document.body,{childList:true,subtree:true});
  scan();
})();


/* ===== 块12：心声 / 情诗 / 翻译 ===== */
(function(){
  const KEY = () => (window.S && S.relay) || '';
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  async function ask(prompt){
    const base = KEY(); if(!base) return '';
    const r = await fetch(base.replace(/\/$/,'')+'/generate', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({chat_id:'__util__', messages:[{role:'user', content:prompt}]})
    }).then(r=>r.json()).catch(()=>null);
    if(!r) return '';
    const m = (r.messages||r.items||[])[0] || r;
    return (m && (m.text||m.content)) || '';
  }

  async function heart(msgText){
    return ask(以第一人称写一段祁砚此刻的「心声」，不要引号、不要前缀，只写正文，40字内。上下文：${msgText});
  }
  async function poem(msgText){
    return ask(写一首很短的中文情诗给恋人小咩，四行以内，不要标题、不要引号。主题：${msgText});
  }
  async function translate(text, lang){
    return ask(把下面这段翻译成${lang||'英文'}，只输出译文，不要解释：\n${text});
  }

  function panel(title, body){
    document.querySelectorAll('.xmPanel').forEach(e=>e.remove());
    const d = document.createElement('div');
    d.className='xmPanel';
    d.innerHTML = `<div class="xmPanelTop">✦ ${esc(title)}</div>
      <div class="xmPanelBody">${esc(body||'…')}</div>`;
    document.body.appendChild(d);
    d.addEventListener('click', ()=>d.remove());
    setTimeout(()=>{ if(d.parentNode) d.remove(); }, 20000);
  }

  window.XM_UTIL = { ask, heart, poem, translate, panel };

  document.addEventListener('click', async e=>{
    const b = e.target.closest('[data-xm]');
    if(!b) return;
    const act = b.dataset.xm;
    const src = b.dataset.text || '';
    if(act==='heart'){ panel('心声', '…'); panel('心声', await heart(src)); }
    if(act==='poem'){ panel('情诗', '…'); panel('情诗', await poem(src)); }
    if(act==='trans'){ panel('翻译', '…'); panel('翻译', await translate(src, '英文')); }
  });
})();


/* ===== 块13：扫一扫 / 摇一摇 / 小程序 ===== */
(function(){
  const DB = () => window.__xmDB;
  const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function sheet(html){
    document.querySelectorAll('.xmSheet').forEach(e=>e.remove());
    const d = document.createElement('div');
    d.className='xmSheet';
    d.innerHTML = <div class="xmSheetIn">${html}</div>;
    document.body.appendChild(d);
    d.addEventListener('click', e=>{ if(e.target===d) d.remove(); });
    return d;
  }

  function loadJSQR(){
    if(window.jsQR) return Promise.resolve(true);
    if(window.__jsqrP) return window.__jsqrP;
    window.__jsqrP = new Promise(res=>{
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      s.onload = ()=>res(!!window.jsQR);
      s.onerror = ()=>res(false);
      document.head.appendChild(s);
    });
    return window.__jsqrP;
  }

  let scanStop = null;

  async function scan(){
    const s = sheet(`<div class="xmST">扫一扫</div>
      <div class="xmScanWrap"><video id="xmScanV" playsinline muted></video>
        <div class="xmScanFrame"></div></div>
      <div class="xmSHint" id="xmScanHint">对准二维码</div>`);
    const v = s.querySelector('#xmScanV');
    const hint = s.querySelector('#xmScanHint');

    let stream;
    try{
      stream = await navigator.mediaDevices.getUserMedia({
        video:{ facingMode:{ideal:'environment'}, width:{ideal:1280}, height:{ideal:720} }
      });
    }catch(e){ hint.textContent='拿不到摄像头权限'; return; }

    v.srcObject = stream;
    try{ await v.play(); }catch(e){}

    const stop = ()=>{
      if(stream) stream.getTracks().forEach(t=>t.stop());
      if(scanStop) scanStop = null;
    };
    scanStop = stop;
    s.addEventListener('click', e=>{ if(e.target===s) stop(); });

    const ok = await loadJSQR();
    if(!ok){ hint.textContent='解码库没加载上，检查网络'; return; }

    const cv = document.createElement('canvas');
    const ctx = cv.getContext('2d', {willReadFrequently:true});
    let dead = false, last = 0;

    const tick = (t)=>{
      if(dead || !v.isConnected){ stop(); return; }
      if(t - last > 180 && v.readyState === 4){
        last = t;
        const w = v.videoWidth, h = v.videoHeight;
        if(w && h){
          cv.width = w; cv.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          try{
            const img = ctx.getImageData(0, 0, w, h);
            const code = window.jsQR(img.data, w, h, {inversionAttempts:'attemptBoth'});
            if(code && code.data){
              dead = true;
              stop();
              if(navigator.vibrate) navigator.vibrate(50);
              showResult(code.data);
              return;
            }
          }catch(e){}
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function showResult(text){
    const isUrl = /^https?:\/\//i.test(text);
    sheet(`<div class="xmST">扫到了</div>
      <div class="xmSHint" style="margin-top:0">${esc(text)}</div>
      <div class="xmSBtns">
        ${isUrl ? <div class="xmSBtn" data-open="${esc(text)}">打开链接</div> : ''}
        <div class="xmSBtn xmSBtn2" data-copy="${esc(text)}">复制内容</div>
      </div>`);
  }

  /* —— 摇一摇 —— */
  async function shake(){
    const db = await DB();
    const cs = await db.all('contacts');
    if(!cs.length) return sheet('<div class="xmST">摇一摇</div><div class="xmSHint">通讯录还是空的</div>');
    const c = cs[Math.floor(Math.random()*cs.length)];
    sheet(`<div class="xmST">摇到一个人</div>
      <div class="xmSRow"><img src="${esc(c.ava||'')}">
        <div><div class="xmSN">${esc(c.name||'')}</div>
        <div class="xmSHint" style="text-align:left;margin-top:2px">${esc(c.sign||'')}</div></div></div>
      <div class="xmSBtn" data-shake-add="${esc(c.id)}">打个招呼</div>`);
    if(navigator.vibrate) navigator.vibrate(60);
  }

  /* —— 小程序 —— */
  const MINI = [
    {k:'calc', t:'计算器'},
    {k:'note', t:'备忘录'},
    {k:'dice', t:'掷骰子'},
    {k:'coin', t:'抛硬币'}
  ];
  function mini(){
    sheet('<div class="xmST">小程序</div>' +
      MINI.map(m=><div class="xmSItem" data-mini="${m.k}">${m.t}</div>).join(''));
  }
  function runMini(k){
    if(k==='dice') return sheet(<div class="xmST">${1+Math.floor(Math.random()*6)}</div><div class="xmSHint">掷骰子</div>);
    if(k==='coin') return sheet(<div class="xmST">${Math.random()<0.5?'正':'反'}</div><div class="xmSHint">抛硬币</div>);
    if(k==='note') return sheet('<div class="xmST">备忘录</div><div class="xmSHint">在抽屉里打开</div>');
    if(k==='calc') return sheet('<div class="xmST">计算器</div><div class="xmSHint">在抽屉里打开</div>');
  }

  window.XM_TOOL = { scan, shake, mini, runMini, sheet };

  document.addEventListener('click', async e=>{
    const d = e.target.closest('[data-dc]');
    if(d){
      const k = d.dataset.dc;
      if(k==='scan') return scan();
      if(k==='shake') return shake();
      if(k==='mini') return mini();
    }
    const mi = e.target.closest('[data-mini]');
    if(mi) return runMini(mi.dataset.mini);

    const op = e.target.closest('[data-open]');
    if(op){ window.open(op.dataset.open, '_blank'); document.querySelectorAll('.xmSheet').forEach(x=>x.remove()); return; }

    const cp = e.target.closest('[data-copy]');
    if(cp){ try{ await navigator.clipboard.writeText(cp.dataset.copy); if(window.toast) toast('已复制'); }catch(e){} 
      document.querySelectorAll('.xmSheet').forEach(x=>x.remove()); return; }

    const add = e.target.closest('[data-shake-add]');
    if(add && window.XM_WX){
      const cid = add.dataset.shakeAdd;
      await XM_WX.putChat({id:cid, name:cid, msgs:[], ts:Date.now(), last:''});
      XM_WX.renderList();
      document.querySelectorAll('.xmSheet').forEach(x=>x.remove());
    }
  });
})();

/* ===== 块14：图片 + 语音消息 ===== */
(function(){
  var esc2 = function(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };

  /* ---------- 读图：和 wechat.js 里同一套 pick ---------- */
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

  function fImg(){
    var f = document.getElementById('xmImgIn');
    if(!f){
      f = document.createElement('input');
      f.id = 'xmImgIn'; f.type = 'file'; f.accept = 'image/*';
      f.style.display = 'none';
      document.body.appendChild(f);
    }
    return f;
  }

  /* 发图：进 CHAT，thumb 存 dataURL */
  function sendImage(file){
    if(!file) return;
    pick(file, 1280, function(url){
      if(!url) return;
      CHAT.push({ role:'user', text:'', thumb:url, t:Date.now() });
      saveChat();
      renderChat(true);
      if(window.XM_RELAY) XM_RELAY.send('', '[图片]');
    });
  }

  window.XM_MEDIA = Object.assign(window.XM_MEDIA || {}, {
    pick: pick,
    sendImage: sendImage,
    openPicker: function(){ fImg().click(); }
  });

  fImg().onchange = function(){ if(this.files[0]) sendImage(this.files[0]); };

  /* ---------- 语音 ---------- */
  var rec = null, chunks = [], t0 = 0, mime = '';
  function pickMime(){
    var c = ['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg'];
    for(var i=0;i<c.length;i++){ if(window.MediaRecorder && MediaRecorder.isTypeSupported(c[i])) return c[i]; }
    return '';
  }
  function startRec(){
    if(rec) return;
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(st){
      mime = pickMime();
      rec = new MediaRecorder(st, mime ? {mimeType:mime} : undefined);
      chunks = [];
      rec.ondataavailable = function(e){ if(e.data.size) chunks.push(e.data); };
      rec.start(); t0 = Date.now();
      if(navigator.vibrate) navigator.vibrate(30);
      if(window.toast) toast('松开发送');
    }).catch(function(){ if(window.toast) toast('拿不到麦克风'); });
  }
  function stopRec(){
    if(!rec) return;
    var dur = Math.round((Date.now() - t0) / 1000);
    var r = rec; rec = null;
    r.onstop = function(){
      r.stream.getTracks().forEach(function(t){ t.stop(); });
      if(dur < 1 || !chunks.length) return;
      var blob = new Blob(chunks, {type: mime || 'audio/mp4'});
      var fr = new FileReader();
      fr.onload = function(){
        CHAT.push({ role:'user', text:'', aud:fr.result, dur:dur, t:Date.now() });
        saveChat(); renderChat(true);
      };
      fr.readAsDataURL(blob);
    };
    try{ r.stop(); }catch(e){}
  }

  window.XM_MEDIA.startRec = startRec;
  window.XM_MEDIA.stopRec = stopRec;

  /* 消息里的图/音，画出来 */
  function paint(){
    var box = document.getElementById('msgs');
    if(!box) return;
    box.querySelectorAll('.wrap').forEach(function(w){
      if(w.getAttribute('data-media')) return;
      var i = +w.getAttribute('data-i');
      var m = (typeof CHAT !== 'undefined' && CHAT[i]) || null;
      if(!m || (!m.thumb && !m.aud)) return;
      var bub = w.querySelector('.bub');
      if(!bub) return;
      w.setAttribute('data-media','1');
      if(m.thumb){
        bub.innerHTML = '<img class="ximg" src="'+m.thumb+'">';
        bub.style.padding = '4px';
      } else {
        var bars = '';
        for(var k=0;k<9;k++) bars += '<i style="height:'+(4+Math.round(Math.random()*10))+'px"></i>';
        bub.innerHTML = '<span class="xaud" data-play="'+i+'"><span class="xwav">'+bars+
          '</span><span class="xlen">'+m.dur+'"</span></span>';
        bub.style.padding = '9px 12px';
      }
    });
  }
  new MutationObserver(function(){ setTimeout(paint, 60); })
    .observe(document.body, {childList:true, subtree:true});
  setTimeout(paint, 800);

  document.addEventListener('click', function(e){
    var p = e.target.closest && e.target.closest('[data-play]');
    if(!p) return;
    var m = CHAT[+p.dataset.play];
    if(!m || !m.aud) return;
    var a = new Audio(m.aud);
    p.classList.add('playing');
    a.onended = function(){ p.classList.remove('playing'); };
    a.play().catch(function(){});
  });
})();

/* ===== 块15：语音通话 ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '#xmCall{position:fixed;inset:0;z-index:80;display:none;flex-direction:column;'+
      'align-items:center;justify-content:space-between;background:#101012;color:#f2f2f2;'+
      'padding:calc(env(safe-area-inset-top) + 46px) 0 calc(env(safe-area-inset-bottom) + 44px)}'+
    '#xmCall.on{display:flex}'+
    '.xmCAva{width:104px;height:104px;border-radius:50%;background:#F6F1C9 center/cover;'+
      'position:relative;z-index:2;box-shadow:0 8px 40px rgba(0,0,0,.5)}'+
    '.xmCName{font-size:20px;font-weight:500;margin-top:18px;position:relative;z-index:2}'+
    '.xmCTime{font-size:13px;color:#9a9a9e;margin-top:6px;position:relative;z-index:2}'+
    '.xmCCap{font-size:14px;line-height:1.7;color:#e8e8e8;max-width:80vw;text-align:center;'+
      'margin-top:22px;position:relative;z-index:2;white-space:pre-wrap}'+
    '.xmCBtns{display:flex;gap:52px;position:relative;z-index:2}'+
    '.xmCBtn{width:64px;height:64px;border-radius:50%;display:flex;align-items:center;'+
      'justify-content:center;background:rgba(255,255,255,.16)}'+
    '.xmCBtn.hang{background:#e5484d}'+
    '.xmCBtn svg{width:26px;height:26px}'+
    '.xmCBtn.hang svg{transform:rotate(135deg)}';
  document.head.appendChild(st);

  var PHONE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7.4 3.8 9.6 8l-2 1.7c.9 1.9 2.4 3.4 4.3 4.3l1.7-2 4.2 2.2-.6 3c-.2.9-1 1.5-1.9 1.4C9.6 17.8 5.6 13.8 4.4 8.1c-.1-.9.4-1.7 1.3-2z"/></svg>';

  var layer = document.createElement('div');
  layer.id = 'xmCall';
  layer.innerHTML =
    '<div style="position:relative;z-index:2;display:flex;flex-direction:column;align-items:center">'+
      '<div class="xmCAva" id="xmCAva"></div>'+
      '<div class="xmCName" id="xmCName">祁砚</div>'+
      '<div class="xmCTime" id="xmCTime">正在呼叫…</div>'+
      '<div class="xmCCap" id="xmCCap"></div>'+
    '</div>'+
    '<div class="xmCBtns"><div class="xmCBtn hang" id="xmCHang">'+PHONE+'</div></div>';
  document.body.appendChild(layer);

  var timer = null, sec = 0, talk = null;

  function fmt(n){ var m = Math.floor(n/60), s = n%60;
    return (m<10?'0':'')+m+':'+(s<10?'0':'')+s; }

  function speak(text){
    if(!text) return;
    var cfg = {};
    try{ cfg = JSON.parse(localStorage.getItem('xm_tts') || '{}'); }catch(e){}
    if(!+cfg.on) return;
    try{
      var u = new SpeechSynthesisUtterance(String(text).slice(0,300));
      u.rate = Math.max(.5, Math.min(2, +cfg.speed || 1));
      u.lang = 'zh-CN';
      var vs = speechSynthesis.getVoices() || [];
      var v = vs.filter(function(x){ return /zh[-_]|Chinese|中文/i.test(x.lang + ' ' + x.name); })[0];
      if(v) u.voice = v;
      speechSynthesis.speak(u);
    }catch(e){}
  }

  async function line(kind, n){
    if(!S.key || !S.apiUrl) return '';
    var rid = 'call' + Date.now() + Math.random().toString(36).slice(2,6);
    var prompt = kind === 'open'
      ? '小咩打给你了。写一句接起电话时说的话，25 字内，只写说的内容，不要引号。'
      : '通话中，你已经说了 ' + n + ' 句。再自然说一句，25 字内，只写说的内容，不要引号。';
    try{
      await api('/generate', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ requestId: rid, inboxId: S.inbox,
          messages:[{role:'system',content:PERSONA},{role:'user',content:prompt}],
          settings:{ mainApiUrl:S.apiUrl, mainApiKey:S.apiKey, mainApiModel:S.model,
                     apiType:S.apiType||'openai', temperature:0.95 },
          meta:{ charName:'祁砚', charId:'kai' } }) });
    }catch(e){ return ''; }
    for(var i=0;i<14;i++){
      await new Promise(function(r){ setTimeout(r, i?1800:700); });
      try{
        var j = await api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items||[]).filter(function(x){ return String(x.requestId)===String(rid); })[0];
        if(f){
          api('/ack', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ inboxId:S.inbox, ids:[f.id] }) }).catch(function(){});
          var t = String(f.content||'').replace(/\[\[[\s\S]*?\]\]/g,'').trim();
          return t.split('\n').filter(function(x){ return x.trim(); })[0] || '';
        }
      }catch(e){}
    }
    return '';
  }

  async function start(){
    layer.classList.add('on');
    document.getElementById('xmCCap').textContent = '';
    document.getElementById('xmCTime').textContent = '正在呼叫…';
    document.getElementById('xmCAva').style.backgroundImage =
      "url('" + (localStorage.getItem('xm_kai_ava') || '') + "')";

    sec = 0;
    timer = setInterval(function(){
      sec++;
      document.getElementById('xmCTime').textContent = fmt(sec);
    }, 1000);

    var t = await line('open', 0);
    document.getElementById('xmCCap').textContent = t || '喂？';
    if(t) speak(t);

    var n = 1;
    talk = setInterval(async function(){
      if(!layer.classList.contains('on')) return;
      var s = await line('talk', n);
      if(s){ document.getElementById('xmCCap').textContent = s; speak(s); n++; }
    }, 14000);
  }

  function hang(){
    layer.classList.remove('on');
    if(timer){ clearInterval(timer); timer = null; }
    if(talk){ clearInterval(talk); talk = null; }
    try{ speechSynthesis.cancel(); }catch(e){}
    CHAT.push({ role:'assistant', text:'（通话结束，'+fmt(sec)+'）', t:Date.now() });
    saveChat(); renderChat(true);
  }

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    var v = e.target.closest('[data-call]');
    if(v && v.dataset.call === 'voice'){ start(); return; }
    if(e.target.closest('#xmCHang')) hang();
  });

  window.XM_CALL = { start: start, hang: hang };
})();

/* ===== 块16：位置共享 ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '#msgs .xloc{width:200px;border-radius:8px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.08)}'+
    '#msgs .xloc .hd{padding:8px 10px;font-size:13px;color:#2b2b2b}'+
    '#msgs .xloc .mp{height:96px;background:#e8e8e4 center/cover;position:relative}'+
    '#msgs .xloc .mp::after{content:"";position:absolute;left:50%;top:50%;width:10px;height:10px;'+
      'margin:-9px 0 0 -5px;background:#e5484d;border-radius:50% 50% 50% 0;transform:rotate(-45deg);'+
      'box-shadow:0 2px 6px rgba(0,0,0,.3)}';
  document.head.appendChild(st);

  function send(){
    if(!navigator.geolocation){ if(window.toast) toast('这台设备不给定位'); return; }
    if(window.toast) toast('定位中…');
    navigator.geolocation.getCurrentPosition(function(p){
      var lat = +p.coords.latitude.toFixed(6), lng = +p.coords.longitude.toFixed(6);
      CHAT.push({ role:'user', text:'', loc:{lat:lat, lng:lng}, t:Date.now() });
      saveChat(); renderChat(true);
      reply(lat, lng);
    }, function(){ if(window.toast) toast('定位失败'); }, {enableHighAccuracy:true, timeout:8000});
  }

  async function reply(lat, lng){
    if(!S.key || !S.apiUrl) return;
    var rid = 'loc' + Date.now() + Math.random().toString(36).slice(2,6);
    api('/generate', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ requestId: rid, inboxId: S.inbox,
        messages:[{role:'system',content:PERSONA},
          {role:'user',content:'小咩把位置发给你了：'+lat+','+lng+'。用一句话回她，25 字内。'}],
        settings:{ mainApiUrl:S.apiUrl, mainApiKey:S.apiKey, mainApiModel:S.model,
                   apiType:S.apiType||'openai', temperature:0.95 },
        meta:{ charName:'祁砚', charId:'kai' } }) }).catch(function(){ return; });
    for(var i=0;i<12;i++){
      await new Promise(function(r){ setTimeout(r, i?1800:700); });
      try{
        var j = await api('/outbox?inboxId=' + encodeURIComponent(S.inbox) + '&since=0');
        var f = (j.items||[]).filter(function(x){ return String(x.requestId)===String(rid); })[0];
        if(f){
          api('/ack', { method:'POST', headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ inboxId:S.inbox, ids:[f.id] }) }).catch(function(){});
          CHAT.push({ role:'assistant', text: String(f.content||'').replace(/\[\[[\s\S]*?\]\]/g,'').trim(),
                      t:Date.now() });
          saveChat(); renderChat(true); return;
        }
      }catch(e){}
    }
  }

  function paint(){
    var box = document.getElementById('msgs'); if(!box) return;
    box.querySelectorAll('.wrap').forEach(function(w){
      if(w.getAttribute('data-loc')) return;
      var i = +w.getAttribute('data-i');
      var m = (typeof CHAT !== 'undefined' && CHAT[i]) || null;
      if(!m || !m.loc) return;
      var bub = w.querySelector('.bub'); if(!bub) return;
      w.setAttribute('data-loc','1');
      bub.innerHTML = '<div class="xloc" data-map="'+m.loc.lat+','+m.loc.lng+'">'+
        '<div class="hd">我的位置</div>'+
        '<div class="mp" style="background-image:url(https://staticmap.openstreetmap.de/staticmap.php?center='+
        m.loc.lat+','+m.loc.lng+'&zoom=15&size=400x200&markers='+m.loc.lat+','+m.loc.lng+',red-pushpin)"></div>'+
        '</div>';
      bub.style.padding = '4px';
    });
  }
  new MutationObserver(function(){ setTimeout(paint, 60); }).observe(document.body,{childList:true,subtree:true});
  setTimeout(paint, 900);

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    var b = e.target.closest('[data-loc-send]');
    if(b){ send(); return; }
    var mp = e.target.closest('[data-map]');
    if(mp){ window.open('https://maps.apple.com/?ll='+mp.dataset.map, '_blank'); }
  });

  window.XM_LOC = { send: send };
})();
/* ===== 块17：转账 + 收付款 ===== */
(function(){
  var KEY = 'xm_pay';
  function get(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{"balance":0,"log":[]}'); }
    catch(e){ return {balance:0, log:[]}; } }
  function set(v){ try{ localStorage.setItem(KEY, JSON.stringify(v)); }catch(e){} }
  function tx(amount, note){
    var w = get();
    w.balance = Math.round((w.balance + amount)*100)/100;
    w.log.unshift({ amount:amount, note:note||'', t:Date.now(), after:w.balance });
    if(w.log.length > 200) w.log.length = 200;
    set(w); return w;
  }

  var st = document.createElement('style');
  st.textContent =
    '#msgs .xpay{width:200px;border-radius:8px;background:#f7a94b;color:#fff;padding:12px 14px}'+
    '#msgs .xpay .n{font-size:22px;font-weight:500;margin-top:6px}'+
    '#msgs .xpay .s{font-size:11.5px;opacity:.85;margin-top:6px}'+
    '#xmPayBox{position:fixed;inset:0;z-index:75;background:rgba(0,0,0,.35);display:flex;align-items:flex-end}'+
    '#xmPayBox .in{width:100%;background:#f4f4f2;border-radius:20px 20px 0 0;'+
      'padding:20px 18px calc(env(safe-area-inset-bottom) + 20px)}'+
    '#xmPayBox .am{font-size:34px;font-weight:600;letter-spacing:.02em}'+
    '#xmPayBox .am small{font-size:16px;margin-right:4px}'+
    '#xmPayBox input{width:100%;border:0;background:none;font-size:34px;font-weight:600;outline:none}'+
    '#xmPayBox .nt{width:100%;border:0;background:#fff;border-radius:10px;padding:11px 13px;'+
      'font-size:14px;margin-top:12px;outline:none}'+
    '#xmPayBox .go{margin-top:16px;background:#07c160;color:#fff;text-align:center;'+
      'padding:12px;border-radius:10px;font-size:16px}'+
    '#xmPayBox .qr{margin-top:12px;background:#fff;border-radius:14px;padding:22px;text-align:center}'+
    '#xmPayBox .qr canvas{width:190px;height:190px}';
  document.head.appendChild(st);

  function sheet(html, id){
    var old = document.getElementById(id); if(old) old.remove();
    var d = document.createElement('div');
    d.id = id; d.innerHTML = '<div class="in">'+html+'</div>';
    d.onclick = function(e){ if(e.target === d) d.remove(); };
    document.body.appendChild(d);
    return d;
  }

  /* 转账 */
  function transfer(){
    var d = sheet('<div style="font-size:13px;color:#8a8a86">转账给 祁砚</div>'+
      '<div class="am"><small>¥</small><input id="xmPayAmt" inputmode="decimal" placeholder="0.00"></div>'+
      '<input class="nt" id="xmPayNote" placeholder="添加备注">'+
      '<div class="go" id="xmPayGo">转账</div>', 'xmPayBox');
    d.querySelector('#xmPayAmt').focus();
    d.querySelector('#xmPayGo').onclick = function(){
      var a = parseFloat(d.querySelector('#xmPayAmt').value);
      if(!(a > 0)){ if(window.toast) toast('金额不对'); return; }
      var note = d.querySelector('#xmPayNote').value.trim();
      tx(-a, '转账给祁砚' + (note ? ' · '+note : ''));
      CHAT.push({ role:'user', text:'', pay:{ amount:a, note:note, dir:'out' }, t:Date.now() });
      saveChat(); renderChat(true); d.remove();
      setTimeout(function(){
        CHAT.push({ role:'assistant', text:'（已收款 ¥'+a.toFixed(2)+'）', t:Date.now() });
        saveChat(); renderChat(true);
      }, 1200);
    };
  }

  /* 收付款码 */
  function qr(){
    var bal = get().balance.toFixed(2);
    var d = sheet('<div style="text-align:center;font-size:15px;font-weight:500">收付款</div>'+
      '<div class="qr"><canvas id="xmQrC" width="380" height="380"></canvas>'+
      '<div style="font-size:12.5px;color:#8a8a86;margin-top:10px">余额 ¥'+bal+'</div></div>', 'xmPayBox');
    var c = d.querySelector('#xmQrC'), g = c.getContext('2d');
    var n = 25, cell = 380 / n;
    g.fillStyle = '#fff'; g.fillRect(0,0,380,380);
    g.fillStyle = '#111';
    var seed = 'kai-' + bal;
    var r = 0; for(var i=0;i<seed.length;i++) r = (r*31 + seed.charCodeAt(i)) % 99991;
    for(var y=0;y<n;y++) for(var x=0;x<n;x++){
      r = (r*1103515245 + 12345) & 0x7fffffff;
      if((r >> 8) & 1) g.fillRect(x*cell, y*cell, cell, cell);
    }
    function eye(px, py){
      g.fillStyle = '#fff'; g.fillRect(px*cell, py*cell, cell*7, cell*7);
      g.fillStyle = '#111'; g.fillRect(px*cell, py*cell, cell*7, cell*7);
      g.fillStyle = '#fff'; g.fillRect((px+1)*cell, (py+1)*cell, cell*5, cell*5);
      g.fillStyle = '#111'; g.fillRect((px+2)*cell, (py+2)*cell, cell*3, cell*3);
    }
    eye(0,0); eye(n-7,0); eye(0,n-7);
  }

  function paint(){
    var box = document.getElementById('msgs'); if(!box) return;
    box.querySelectorAll('.wrap').forEach(function(w){
      if(w.getAttribute('data-pay')) return;
      var i = +w.getAttribute('data-i');
      var m = (typeof CHAT !== 'undefined' && CHAT[i]) || null;
      if(!m || !m.pay) return;
      var bub = w.querySelector('.bub'); if(!bub) return;
      w.setAttribute('data-pay','1');
      bub.innerHTML = '<div class="xpay"><div style="font-size:12.5px;opacity:.9">'+
        (m.pay.dir==='out'?'转账给祁砚':'收款')+'</div>'+
        '<div class="n">¥ '+Number(m.pay.amount).toFixed(2)+'</div>'+
        (m.pay.note?'<div class="s">'+String(m.pay.note).replace(/[<>]/g,'')+'</div>':'')+'</div>';
      bub.style.padding = '4px';
    });
  }
  new MutationObserver(function(){ setTimeout(paint, 60); }).observe(document.body,{childList:true,subtree:true});
  setTimeout(paint, 900);

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    if(e.target.closest('[data-pay-send]')) return transfer();
    if(e.target.closest('[data-pay-qr]')) return qr();
  });

  window.XM_PAY = { tx: tx, get: get, transfer: transfer, qr: qr };
})();
/* ===== 块18：会话置顶 / 免打扰 / 删除 ===== */
(function(){
  var KEY = 'xm_chatcfg';
  function all(){ try{ return JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ return {}; } }
  function one(cid){ return all()[cid] || { top:0, mute:0 }; }
  function put(cid, o){ var a = all(); a[cid] = Object.assign(one(cid), o); 
    try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }
  function del(cid){ var a = all(); delete a[cid];
    try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} }

  var st = document.createElement('style');
  st.textContent =
    '.wxRow .xmTag{font-size:10px;background:#f0f0ee;color:#8a8a86;border-radius:4px;padding:1px 5px;margin-left:6px}'+
    '#xmCtxMenu{position:fixed;z-index:90;background:#fff;border-radius:12px;overflow:hidden;'+
      'box-shadow:0 10px 34px rgba(0,0,0,.18);min-width:150px}'+
    '#xmCtxMenu div{padding:13px 18px;font-size:14.5px;border-bottom:1px solid #f0f0ee}'+
    '#xmCtxMenu div:last-child{border-bottom:0}'+
    '#xmCtxMenu div:active{background:#f6f6f4}'+
    '#xmCtxMenu .rd{color:#e5484d}';
  document.head.appendChild(st);

  function menu(x, y, cid){
    var old = document.getElementById('xmCtxMenu'); if(old) old.remove();
    var c = one(cid);
    var d = document.createElement('div');
    d.id = 'xmCtxMenu';
    d.innerHTML = '<div data-a="top">'+(c.top?'取消置顶':'置顶该聊天')+'</div>'+
      '<div data-a="mute">'+(c.mute?'取消免打扰':'消息免打扰')+'</div>'+
      '<div class="rd" data-a="del">删除该聊天</div>';
    d.style.left = Math.min(x, innerWidth - 170) + 'px';
    d.style.top = y + 'px';
    document.body.appendChild(d);
    d.onclick = function(e){
      var t = e.target.closest('[data-a]'); if(!t) return;
      var a = t.dataset.a;
      if(a === 'top') put(cid, {top: one(cid).top ? 0 : 1});
      if(a === 'mute') put(cid, {mute: one(cid).mute ? 0 : 1});
      if(a === 'del'){
        if(!confirm('删掉这个会话？聊天记录一起没。')) return;
        del(cid);
        try{
          if(typeof CHAT !== 'undefined' && Array.isArray(CHAT)){ CHAT.length = 0; saveChat(); renderChat(true); }
        }catch(e){}
      }
      d.remove();
      if(typeof render === 'function') render();
    };
    setTimeout(function(){
      document.addEventListener('click', function h(ev){
        if(!d.contains(ev.target)){ d.remove(); document.removeEventListener('click', h); }
      });
    }, 0);
  }

  /* 长按 .wxRow */
  var lt = null;
  document.addEventListener('touchstart', function(e){
    var r = e.target.closest && e.target.closest('.wxRow[data-go]');
    if(!r) return;
    lt = setTimeout(function(){
      var rect = r.getBoundingClientRect();
      menu(rect.left + 20, rect.top, r.dataset.go);
      if(navigator.vibrate) navigator.vibrate(20);
    }, 550);
  }, {passive:true});
  ['touchend','touchmove','touchcancel','scroll'].forEach(function(ev){
    document.addEventListener(ev, function(){ if(lt){ clearTimeout(lt); lt = null; } }, {passive:true});
  });

  window.XM_CFG = { one: one, put: put, del: del, menu: menu };
})();
/* ===== 块19：消息搜索 ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '#xmSearch{position:fixed;inset:0;z-index:78;background:#f4f4f2;display:flex;flex-direction:column}'+
    '#xmSearch .tp{padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;display:flex;gap:10px;align-items:center}'+
    '#xmSearch input{flex:1;border:0;background:#fff;border-radius:10px;padding:10px 13px;'+
      'font-size:14.5px;outline:none}'+
    '#xmSearch .cl{font-size:14px;color:#5b6b8c}'+
    '#xmSearch .bd{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}'+
    '#xmSearch .hit{padding:13px 16px;background:#fff;border-bottom:1px solid #f0f0ee}'+
    '#xmSearch .hit b{color:#e5484d;font-weight:500}'+
    '#xmSearch .hit .w{font-size:12px;color:#a3a39f;margin-bottom:3px}'+
    '#xmSearch .hit .t{font-size:14.5px;line-height:1.6;color:#2b2b2b}'+
    '#xmSearch .no{text-align:center;color:#b4b4b0;font-size:13.5px;padding:70px 30px}';
  document.head.appendChild(st);

  var d = null;
  function esc2(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function run(q){
    q = String(q||'').trim();
    var bd = d.querySelector('.bd');
    if(!q){ bd.innerHTML = ''; return; }
    var hits = [];
    (typeof CHAT !== 'undefined' ? CHAT : []).forEach(function(m, i){
      var t = String(m.text || (m.thumb ? '[图片]' : m.aud ? '[语音]' : ''));
      if(t.toLowerCase().indexOf(q.toLowerCase()) > -1) hits.push({ i:i, m:m, t:t });
    });
    if(!hits.length){ bd.innerHTML = '<div class="no">没找到「'+esc2(q)+'」</div>'; return; }
    bd.innerHTML = hits.reverse().map(function(h){
      var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'ig');
      var body = esc2(h.t).replace(re, '<b>$1</b>');
      var dt = new Date(h.m.t || Date.now());
      var w = (h.m.role === 'user' ? '我' : '祁砚') + ' · ' +
        (dt.getMonth()+1) + '/' + dt.getDate() + ' ' +
        ('0'+dt.getHours()).slice(-2) + ':' + ('0'+dt.getMinutes()).slice(-2);
      return '<div class="hit" data-jump="'+h.i+'"><div class="w">'+w+'</div><div class="t">'+body+'</div></div>';
    }).join('');
  }

  function open(){
    if(d) d.remove();
    d = document.createElement('div');
    d.id = 'xmSearch';
    d.innerHTML = '<div class="tp"><input id="xmSQ" placeholder="搜索聊天记录">'+
      '<span class="cl" id="xmSC">取消</span></div><div class="bd"></div>';
    document.body.appendChild(d);
    d.querySelector('#xmSQ').focus();
    d.querySelector('#xmSQ').oninput = function(){ run(this.value); };
    d.querySelector('#xmSC').onclick = function(){ d.remove(); d = null; };
    d.querySelector('.bd').onclick = function(e){
      var h = e.target.closest('[data-jump]'); if(!h) return;
      var i = +h.dataset.jump;
      d.remove(); d = null;
      var box = document.getElementById('msgs');
      var w = box && box.querySelector('.wrap[data-i="'+i+'"]');
      if(w){
        w.scrollIntoView({block:'center', behavior:'smooth'});
        var bub = w.querySelector('.bub');
        if(bub){
          bub.style.transition = 'box-shadow .3s';
          bub.style.boxShadow = '0 0 0 2px #07c160';
          setTimeout(function(){ bub.style.boxShadow = ''; }, 1600);
        }
      }
    };
  }

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    if(e.target.closest('[data-search]')) open();
  });

  window.XM_SEARCH = { open: open };
})();
/* ===== 块20：语音转文字 ===== */
(function(){
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function tip(t){
    if(window.toast) return toast(t);
    var d = document.createElement('div');
    d.textContent = t;
    d.style.cssText = 'position:fixed;left:50%;bottom:150px;transform:translateX(-50%);'+
      'background:rgba(0,0,0,.84);color:#fff;font-size:12.5px;padding:9px 16px;'+
      'border-radius:14px;z-index:99;max-width:82vw;text-align:center';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 2400);
  }

  /* 对着麦克风听一句，转成文字塞进输入框 */
  function listen(cb){
    if(!SR){ tip('这台设备不支持语音识别'); return null; }
    var r = new SR();
    r.lang = 'zh-CN';
    r.interimResults = true;
    r.continuous = false;
    var done = '';
    r.onresult = function(e){
      var t = '';
      for(var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      done = t;
      if(cb) cb(t, false);
    };
    r.onerror = function(){ tip('没听清'); if(cb) cb('', true); };
    r.onend = function(){ if(cb) cb(done, true); };
    try{ r.start(); }catch(e){}
    return r;
  }

  /* 长按说话时同时转写 */
  function hold(){
    var inp = document.getElementById('mIn');
    if(!inp){ tip('聊天没开着'); return; }
    var base = inp.value || '';
    var r = listen(function(t, end){
      inp.value = base + t;
      if(end) inp.dispatchEvent(new Event('input'));
    });
    if(!r) return;
    var stop = function(){
      try{ r.stop(); }catch(e){}
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
    };
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
  }

  /* 已有语音消息 → 转文字（走中继，模型自己听不了就只留提示） */
  function fromMsg(i){
    var m = (typeof CHAT !== 'undefined' && CHAT[i]) || null;
    if(!m || !m.aud){ tip('这条不是语音'); return; }
    if(m.asr){ tip(m.asr); return; }
    tip('实时转写只支持录制时说，旧语音转不了');
  }

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    if(e.target.closest('[data-asr]')) return hold();
    var a = e.target.closest('[data-asr-msg]');
    if(a) return fromMsg(+a.dataset.asrMsg);
  });

  window.XM_ASR = { listen: listen, hold: hold, supported: !!SR };
})();
/* ===== 块21：朋友圈视频 ===== */
(function(){
  var DB = 'xm_media_v1', ST = 'media';
  function openDB(){
    return new Promise(function(res, rej){
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function(){ r.result.createObjectStore(ST, {keyPath:'id'}); };
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    });
  }
  function put(id, blob){ return openDB().then(function(db){
    return new Promise(function(res){
      var t = db.transaction(ST,'readwrite');
      t.objectStore(ST).put({ id:id, blob:blob, t:Date.now() });
      t.oncomplete = function(){ res(true); };
    });
  }); }
  function get(id){ return openDB().then(function(db){
    return new Promise(function(res){
      var t = db.transaction(ST,'readonly');
      var q = t.objectStore(ST).get(id);
      q.onsuccess = function(){ res(q.result && q.result.blob); };
      q.onerror = function(){ res(null); };
    });
  }); }

  var st = document.createElement('style');
  st.textContent = '.mom .vd{width:100%;border-radius:8px;margin-top:8px;display:block;background:#000}';
  document.head.appendChild(st);

  function fVid(){
    var f = document.getElementById('xmVidIn');
    if(!f){
      f = document.createElement('input');
      f.id = 'xmVidIn'; f.type = 'file'; f.accept = 'video/*';
      f.style.display = 'none';
      document.body.appendChild(f);
    }
    return f;
  }

  fVid().onchange = function(){
    var file = this.files[0]; if(!file) return;
    if(file.size > 60 * 1024 * 1024){ if(window.toast) toast('视频太大，挑 60MB 以内的'); return; }
    var id = 'v' + Date.now();
    put(id, file).then(function(){
      var MOM = [];
      try{ MOM = JSON.parse(localStorage.getItem('xm_moments') || '[]'); }catch(e){}
      MOM.push({ who:'me', text:'', vid:id, t:Date.now(), likes:[], cms:[] });
      try{ localStorage.setItem('xm_moments', JSON.stringify(MOM.slice(-60))); }catch(e){}
      if(window.XM_MOM && XM_MOM.render) XM_MOM.render();
      else if(typeof render === 'function') render();
    });
  };

  /* 把朋友圈里的 vid 画成 video */
  function paint(){
    var list = document.querySelectorAll('.mom[data-vid]:not([data-vid-done])');
    list.forEach(function(el){
      var id = el.getAttribute('data-vid');
      el.setAttribute('data-vid-done','1');
      get(id).then(function(b){
        if(!b) return;
        var u = URL.createObjectURL(b);
        var bd = el.querySelector('.bd'); if(!bd) return;
        var v = document.createElement('video');
        v.className = 'vd'; v.src = u; v.controls = true; v.playsInline = true;
        var im = bd.querySelector('.im'); if(im) im.replaceWith(v); else bd.appendChild(v);
      });
    });
  }
  new MutationObserver(function(){ setTimeout(paint, 80); }).observe(document.body,{childList:true,subtree:true});
  setTimeout(paint, 900);

  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('[data-vid-pick]')) fVid().click();
  });

  window.XM_VID = { put: put, get: get, pick: function(){ fVid().click(); } };
})();
/* ===== 块22：表情面板 + 表情包 ===== */
(function(){
  var EMO = ('😀 😄 😊 🙂 😉 😍 🥰 😘 😗 😙 😚 😋 😜 🤪 😝 🤗 🤔 🤨 😐 😑 😶 🙄 '+
    '😏 😣 😥 😮 🤐 😯 😴 😌 😔 😪 😢 😭 😤 😠 😡 🤬 😳 🥺 😞 😟 😰 😨 😱 😖 😓 '+
    '😫 😩 🥱 😮‍💨 😬 😵 🤯 🤠 😎 🤓 🧐 😕 😲 😦 😧 😮 😱 🙁 😒 😷 🤒 🤕 🥳 '+
    '🥹 😇 🤍 💛 💔 ❤️‍🔥 💗 💓 💞 💕 ✨ ⭐️ 🌙 ☀️ 🌧 ❄️ 🍀 🌸 🌷 🎀 🫶 🤲').split(/\s+/);

  var KEY = 'xm_stickers';
  function stk(){ try{ return JSON.parse(localStorage.getItem(KEY) || '[]'); }catch(e){ return []; } }
  function saveStk(a){ try{ localStorage.setItem(KEY, JSON.stringify(a.slice(-40))); }catch(e){} }

  var st = document.createElement('style');
  st.textContent =
    '#xmEmo{position:fixed;left:0;right:0;bottom:0;z-index:70;background:#f4f4f2;'+
      'border-top:1px solid rgba(0,0,0,.08);display:none;flex-direction:column;'+
      'padding-bottom:calc(env(safe-area-inset-bottom) + 6px)}'+
    '#xmEmo.on{display:flex}'+
    '#xmEmo .tabs{display:flex;gap:16px;padding:8px 14px 4px;font-size:13px;color:#8a8a86}'+
    '#xmEmo .tabs b{font-weight:500;color:#0b0b0b}'+
    '#xmEmo .grid{height:214px;overflow-y:auto;-webkit-overflow-scrolling:touch;'+
      'display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:6px 10px}'+
    '#xmEmo .grid span{display:flex;align-items:center;justify-content:center;'+
      'font-size:24px;height:42px;border-radius:8px}'+
    '#xmEmo .grid span:active{background:rgba(0,0,0,.06)}'+
    '#xmEmo .grid img{width:100%;height:42px;object-fit:cover;border-radius:8px}'+
    '#xmEmo .add{grid-column:span 2;font-size:13px;color:#5b6b8c;border:1px dashed #d0d0cc}';
  document.head.appendChild(st);

  var p = document.createElement('div');
  p.id = 'xmEmo';
  document.body.appendChild(p);
  var TAB = 'e';

  function render(){
    var list = TAB === 'e' ? EMO.map(function(x){ return '<span data-e="'+x+'">'+x+'</span>'; }).join('')
      : stk().map(function(s, i){ return '<span data-s="'+i+'"><img src="'+s+'"></span>'; }).join('') +
        '<span class="add" data-add-stk>+ 加表情包</span>';
    p.innerHTML = '<div class="tabs"><b data-t="e">表情</b><span data-t="s">表情包</span></div>'+
      '<div class="grid">'+list+'</div>';
  }
  render();

  function ins(t){
    var inp = document.getElementById('mIn'); if(!inp) return;
    var s = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    inp.value = inp.value.slice(0, s) + t + inp.value.slice(inp.selectionEnd == null ? s : inp.selectionEnd);
    inp.focus();
    inp.selectionStart = inp.selectionEnd = s + t.length;
    inp.dispatchEvent(new Event('input'));
  }

  var fStk = document.createElement('input');
  fStk.type = 'file'; fStk.accept = 'image/*'; fStk.style.display = 'none';
  document.body.appendChild(fStk);
  fStk.onchange = function(){
    var file = this.files[0]; if(!file) return;
    if(!window.XM_MEDIA || !XM_MEDIA.pick) return;
    XM_MEDIA.pick(file, 320, function(url){
      if(!url) return;
      var a = stk(); a.push(url); saveStk(a);
      TAB = 's'; render();
    });
  };

  document.addEventListener('click', function(e){
    if(!e.target.closest) return;
    var tog = e.target.closest('[data-emo]');
    if(tog){ p.classList.toggle('on'); if(p.classList.contains('on')) render(); return; }
    if(!p.contains(e.target)) return;
    var t = e.target.closest('[data-t]');
    if(t){ TAB = t.dataset.t; render(); return; }
    var em = e.target.closest('[data-e]');
    if(em){ ins(em.dataset.e); return; }
    var sk = e.target.closest('[data-s]');
    if(sk){ var u = stk()[+sk.dataset.s]; if(u) sendSticker(u); return; }
    if(e.target.closest('[data-add-stk]')) fStk.click();
  });

  function sendSticker(url){
    CHAT.push({ role:'user', text:'', thumb:url, t:Date.now() });
    saveChat(); renderChat(true);
    p.classList.remove('on');
  }

  window.XM_EMO = { open: function(){ p.classList.add('on'); render(); }, ins: ins };
})();
