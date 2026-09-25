/* ============================================================
   咩&砚 · js/core.js
   壁纸 · 锁屏比例 · 桌面图标 · 禁用缩放 · 微信皮肤样式
   ============================================================ */


/* ---------- 壁纸修复（底部白边） ---------- */


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
    de.style.setProperty('height', tall() + 'px', 'important');
    de.style.setProperty('background-color', '#ffffff', 'important');
    de.style.setProperty('background-image', 'none', 'important');
   
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


/* ---------- 锁住比例：键盘弹出不放大、双指不缩放 ---------- */


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


/* ---------- 桌面图标：极简几何 v2 ---------- */


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


/* ---------- 禁缩放 ---------- */


(function(){
  var st = document.createElement('style');
  st.textContent =
    'html{-webkit-text-size-adjust:100%!important}' +
    'input,textarea{font-size:16px!important}' +
    '*{touch-action:manipulation}';
  document.head.appendChild(st);

  ['gesturestart','gesturechange','gestureend','dblclick'].forEach(function(t){
    document.addEventListener(t, function(e){ e.preventDefault(); }, { passive: false });
  });
})();


/* ---------- 全站：关掉 iOS 长按选取文字 ---------- */


(function(){
  var st = document.createElement('style');
  st.textContent =
    'html,body,*{-webkit-user-select:none!important;user-select:none!important;' +
      '-webkit-touch-callout:none!important}' +
    'input,textarea,[contenteditable]{-webkit-user-select:text!important;user-select:text!important}';
  document.head.appendChild(st);

  function typing(t){
    return !!(t && t.closest && (t.closest('input') || t.closest('textarea') || t.closest('[contenteditable]')));
  }

  /* 长按弹出来的「拷贝 / 查询 / 翻译」全按掉 */
  document.addEventListener('contextmenu', function(e){
    if (!typing(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('selectstart', function(e){
    if (!typing(e.target)) e.preventDefault();
  }, true);

  document.addEventListener('dragstart', function(e){ e.preventDefault(); });
})();


(function(){
  if(document.getElementById('dcCss')) return;
  const s=document.createElement('style');
  s.id='dcCss';
  s.textContent='.dcIc{width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:#576b95;background:none;border-radius:0}.dcIc svg{width:22px;height:22px}';
  document.head.appendChild(s);
})();

(function(){
  function fix(){
    var h = Math.max(
      window.innerHeight || 0,
      (window.screen && screen.height) || 0,
      document.documentElement.clientHeight || 0
    );
    document.documentElement.style.setProperty('height', h + 'px', 'important');
    document.body.style.setProperty('min-height', h + 'px', 'important');
  }
  fix();
  window.addEventListener('resize', fix);
  window.addEventListener('orientationchange', function(){ setTimeout(fix, 300); });
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) fix(); });
  setInterval(fix, 1200);
})();


/* ---------- 微信皮肤 / 红包 / 语音条 / 扫码样式 ----------
   原本这段 CSS 直接裸放在文件末尾（不在任何函数里），
   浏览器会当成 JS 解析并抛语法错误，导致整个 core.js 都不执行。
   现在包进 IIFE 注入，样式不丢。                                     */


(function(){
  if (document.getElementById('xmSkinCss')) return;
  var st = document.createElement('style');
  st.id = 'xmSkinCss';
  st.textContent = `
body.wxskin #msgs{background:#ededed}
body.wxskin #msgs .msg{display:flex;margin:10px 12px}
body.wxskin #msgs .msg .bub{
  max-width:72%;padding:9px 12px;border-radius:8px;
  font-size:15px;line-height:1.45;word-break:break-word;
  box-shadow:0 1px 1px rgba(0,0,0,.03);position:relative;
}
body.wxskin #msgs .msg.user{justify-content:flex-end}
body.wxskin #msgs .msg.user .bub{background:#9c9c99;color:#fff}
body.wxskin #msgs .msg.user .bub::after{
  content:'';position:absolute;right:-5px;top:10px;
  border:5px solid transparent;border-left-color:#9c9c99;border-right:0;
}
body.wxskin #msgs .msg:not(.user){justify-content:flex-start}
body.wxskin #msgs .msg:not(.user) .bub{background:#F6F1C9;color:#2b2b2b}
body.wxskin #msgs .msg:not(.user) .bub::after{
  content:'';position:absolute;left:-5px;top:10px;
  border:5px solid transparent;border-right-color:#F6F1C9;border-left:0;
}
body.wxskin .inputbar{
  background:#ededed;border-top:1px solid #dcdcdc;
  padding:8px 10px;display:flex;align-items:center;gap:8px;
}
body.wxskin .inputbar textarea,
body.wxskin .inputbar input[type=text]{
  flex:1;background:#fff;border:none;border-radius:18px;
  padding:9px 14px;font-size:15px;outline:none;resize:none;
  max-height:96px;color:#2b2b2b;
}
body.wxskin .inputbar .send,
body.wxskin .inputbar [data-send]{
  background:#07c160;color:#fff;border:none;border-radius:6px;
  padding:8px 14px;font-size:15px;cursor:pointer;
}
body.wxskin .inputbar .send[disabled],
body.wxskin .inputbar [data-send][disabled]{background:#d5d5d5;color:#fff}
body.wxskin .inputbar .icon{color:#5a5a5a;font-size:20px;cursor:pointer}

body.wxskin #msgs .rp{
  width:212px;border-radius:6px;overflow:hidden;
  background:#f7a94b;color:#fff;cursor:pointer;
  box-shadow:0 1px 2px rgba(0,0,0,.08)
}
body.wxskin #msgs .rp.rpDone{background:#f3c39a}
body.wxskin #msgs .rpTop{display:flex;align-items:center;gap:8px;padding:14px 12px 6px}
body.wxskin #msgs .rpIco{
  width:22px;height:22px;border-radius:3px;background:#ffe6b8;position:relative;flex:none
}
body.wxskin #msgs .rpIco::after{
  content:'';position:absolute;inset:6px 5px;border:1.6px solid #f7a94b;border-radius:50%
}
body.wxskin #msgs .rpTxt{font-size:14px;line-height:1.3}
body.wxskin #msgs .rpBot{font-size:19px;font-weight:500;padding:2px 12px 10px}
body.wxskin #msgs .rpMeta{font-size:11px;opacity:.85;padding:0 12px 10px}

.xmPanelTop{font-size:12px;color:#c8a86a;letter-spacing:.06em;margin-bottom:6px}
.xmPanelBody{font-size:14.5px;line-height:1.6;white-space:pre-wrap}

.xmScanWrap{position:relative;border-radius:10px;overflow:hidden;background:#000}
.xmScanWrap video{width:100%;max-height:56vh;object-fit:cover;display:block}
.xmScanFrame{position:absolute;left:50%;top:50%;width:62%;aspect-ratio:1;
  transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,.9);
  border-radius:12px;box-shadow:0 0 0 2000px rgba(0,0,0,.28)}
.xmSBtns{display:flex;gap:10px;margin-top:16px}
.xmSBtn{flex:1;background:#07c160;color:#fff;text-align:center;padding:11px;border-radius:8px;font-size:15px}
.xmSBtn2{background:#3a3a3c}

body.wxskin #msgs .ximg{max-width:180px;max-height:240px;border-radius:6px;display:block}
body.wxskin #msgs .xaud{display:inline-flex;align-items:center;gap:8px;min-width:70px;cursor:pointer}
body.wxskin #msgs .xaud .xwav{display:flex;align-items:flex-end;gap:2px;height:16px}
body.wxskin #msgs .xaud .xwav i{width:2px;background:currentColor;border-radius:1px;opacity:.75}
body.wxskin #msgs .xaud .xlen{font-size:13px;opacity:.8}
body.wxskin #msgs .xaud.playing .xwav i{animation:xmWav .6s infinite alternate}
@keyframes xmWav{from{height:4px}to{height:16px}}
`;
  document.head.appendChild(st);
})();
