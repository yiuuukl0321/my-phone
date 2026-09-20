/* ============================================================
   咩&砚 · js/core.js
   壁纸 · 锁屏比例 · 桌面图标 · 禁用缩放
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
