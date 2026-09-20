/* ============================================================
   咩&砚 · js/calendar.js
   日历 · 日程进聊天上下文 · 周末配色
   ============================================================ */


/* ---------- 桌面日历：iOS 列表式，点日期进当天详情 ---------- */


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


/* ---------- 让聊天能看到日历里的事项 ---------- */


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

/* ---------- 周六日淡枣红（大日历 + 桌面日期块） ---------- */


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

/* ---------- 周六日淡枣红：日历 app ---------- */


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


/* ---------- 去描边 · 星期栏半透明 · 顶栏喇叭图标 · 日历 app 同步大日历 ---------- */


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
