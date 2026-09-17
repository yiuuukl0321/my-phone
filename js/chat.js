/* ===== 1. 深度思考：浅军蓝圆角折叠框（收起时显示三行预览） ===== */
(function(){
  var st = document.createElement('style');
  st.textContent =
    '.think{margin:0 0 9px;padding:11px 14px;border:0;border-radius:16px;' +
      'background:rgba(146,163,214,.32);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    '.think summary{display:flex;align-items:center;gap:7px;list-style:none;' +
      'font-size:13px;font-weight:400;color:#5c6b9b;letter-spacing:.02em}' +
    '.think summary::-webkit-details-marker{display:none}' +
    '.think summary .thms{font-style:normal;font-weight:400;font-size:11.5px;color:#8b97bd;margin-left:5px}' +
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


/* ===== 2. 每条回复下面的操作栏：复制 / 重新生成 / 播放语音 / 翻译 ===== */
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


/* ===== 3. 操作栏补丁：每次重绘后直接插 + 加载自检 ===== */
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


/* ===== 4. 后台生成：切后台也照样把回复收回来 ===== */
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

/* ===== 7. 计算器：不用算就一趟，要算才两趟 ===== */
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

/* ===== 5. 暂停思考 ===== */
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

/* ===== 6. 输入栏改造：贴/说/🔍 删掉，+ 当发送 ===== */
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



 /* ===== 7. 聊天 + 面板：图片 / 拍摄 / 收藏 / 位置（照片真送进模型） ===== */
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

/* ===== 9. 回到底部按钮（不在底部时才出现） ===== */
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


/* ===== 8. 回复下面的星标 = 收藏 ===== */
(function(){
  var STAR = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+
    '<path d="M12 3.6l2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.8l5.9-.8z"/></svg>';

  var st = document.createElement('style');
  st.textContent = '#msgs .acts button.favBtn.on{color:#e0a63a}';
  document.head.appendChild(st);

  function favs(){ try { return JSON.parse(localStorage.getItem('xm_favs') || '[]'); } catch(e){ return []; } }
  function saveFavs(a){ try { localStorage.setItem('xm_favs', JSON.stringify(a.slice(0, 100))); } catch(e){} }
  function toast(t){
    var d = document.createElement('div');
    d.className = 'xmBar'; d.textContent = t; d.style.display = 'block';
    document.body.appendChild(d);
    setTimeout(function(){ d.remove(); }, 2000);
  }

  function add(){
    var rows = document.querySelectorAll('#msgs .acts');
    Array.prototype.forEach.call(rows, function(row){
      if (row.querySelector('.favBtn')) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'favBtn';
      b.innerHTML = STAR;
      b.onclick = function(ev){
        ev.stopPropagation();
        var w = row.previousElementSibling;
        var bub = w && w.querySelector ? w.querySelector('.bub.kai') : null;
        var t = bub ? bub.textContent.trim() : '';
        if (!t) return;
        var a = favs();
        if (a.indexOf(t) > -1){ toast('已经在收藏里了'); }
        else { a.unshift(t); saveFavs(a); toast('收藏了'); }
        b.classList.add('on');
      };
      row.appendChild(b);
    });
  }

  setInterval(add, 700);
  add();
})();
