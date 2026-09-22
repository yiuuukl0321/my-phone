(function(){
  if (window.__xmSkin) return;
  window.__xmSkin = 1;

  function hex(c){
    c = String(c || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(c)) return c;
    if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
    return '';
  }
  function ink(bg){
    var c = hex(bg) || '#ffffff';
    var r = parseInt(c.slice(1,3),16), g = parseInt(c.slice(3,5),16), b = parseInt(c.slice(5,7),16);
    return (0.299*r + 0.587*g + 0.114*b) / 255 > 0.62 ? '#0b0b0b' : '#ffffff';
  }

  /* 直接写在元素身上，带 important —— 只有它自己能盖自己 */
  function set(el, bg, isKai){
    if (!el || el.classList.contains('typing')) return;
    var tag = (bg || '') + (isKai ? '|k' : '|m');
    if (el.getAttribute('data-skin') === tag) return;
    el.setAttribute('data-skin', tag);
    if (!bg){
      el.style.removeProperty('background');
      el.style.removeProperty('color');
      el.style.removeProperty('border-color');
      return;
    }
    el.style.setProperty('background', bg, 'important');
    el.style.setProperty('color', ink(bg), 'important');
    if (isKai) el.style.setProperty('border-color', 'rgba(0,0,0,.12)', 'important');
  }

  function paint(){
    var box = document.getElementById('msgs');
    if (!box) return;
    var kb = hex(S.bubKai), mb = hex(S.bubMe);
    var els = box.querySelectorAll('.bub');
    for (var i = 0; i < els.length; i++){
      var el = els[i];
      if (el.classList.contains('kai')) set(el, kb, true);
      else if (el.classList.contains('me')) set(el, mb, false);
    }
  }
  window.xmBubPaint = paint;

  /* 聊天重绘后立刻补一遍 */
  function hook(){
    var rc = window.renderChat;
    if (typeof rc !== 'function' || rc.__skin) return;
    var fn = function(){
      var r = rc.apply(this, arguments);
      try { paint(); } catch(e){}
      return r;
    };
    fn.__skin = 1;
    window.renderChat = fn;
  }
  hook();

  var box = document.getElementById('msgs');
  if (box) new MutationObserver(function(){ setTimeout(paint, 40); })
    .observe(box, { childList: true, subtree: true });
  setInterval(function(){ hook(); paint(); }, 700);
  paint();

  /* ---------- 我 → Settings 里的卡片 ---------- */
  function card(){
    var b = document.querySelector('#meSet .mbody');
    if (!b || b.querySelector('#xmBubCard')) return;
    var d = document.createElement('div');
    d.className = 'card';
    d.id = 'xmBubCard';
    d.innerHTML =
      '<div class="eyebrow">气泡颜色</div>' +
      '<div class="item"><span>祁砚的气泡</span><em>' +
        '<input id="xmBubK" type="color" value="' + (hex(S.bubKai) || '#ffffff') + '" style="width:46px;' +
        'height:30px;padding:0;border:1px solid rgba(0,0,0,.14);border-radius:8px;background:#fff"></em></div>' +
      '<div class="item"><span>我的气泡</span><em>' +
        '<input id="xmBubM" type="color" value="' + (hex(S.bubMe) || '#111111') + '" style="width:46px;' +
        'height:30px;padding:0;border:1px solid rgba(0,0,0,.14);border-radius:8px;background:#fff"></em></div>' +
      '<div class="item" id="xmBubR"><span>恢复默认</span><em>›</em></div>' +
      '<div class="sub">字色自动跟着深浅走，改完立刻生效，不用重开。</div>';
    b.insertBefore(d, b.firstChild);

    d.querySelector('#xmBubK').oninput = function(){ S.bubKai = this.value; save(); paint(); };
    d.querySelector('#xmBubM').oninput = function(){ S.bubMe  = this.value; save(); paint(); };
    d.querySelector('#xmBubR').onclick = function(){
      S.bubKai = ''; S.bubMe = ''; save(); paint();
      d.querySelector('#xmBubK').value = '#ffffff';
      d.querySelector('#xmBubM').value = '#111111';
    };
  }

  var _os = window.openSet;
  if (typeof _os === 'function' && !_os.__skin){
    var fo = function(){ var r = _os.apply(this, arguments); try { card(); } catch(e){} return r; };
    fo.__skin = 1;
    window.openSet = fo;
  }
  setInterval(card, 800);
})();
