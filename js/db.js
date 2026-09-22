(function(){
  if (window.db) return;

  var P = 'xmdb_';

  function load(n, d){
    try {
      var s = localStorage.getItem(P + n);
      if (s == null) return d;
      var v = JSON.parse(s);
      return (v == null) ? d : v;
    } catch(e){ return d; }
  }
  function dump(n, v){
    try { localStorage.setItem(P + n, JSON.stringify(v)); } catch(e){}
  }
  function nid(a){
    var m = 0;
    for (var i = 0; i < a.length; i++){
      var x = Number(a[i] && a[i].id);
      if (!isNaN(x) && x > m) m = x;
    }
    return m + 1;
  }

  function Table(name, opt){
    opt = opt || {};
    this.n = name;
    this.k = opt.key || null;
  }
  Table.prototype._all = function(){ return load(this.n, []); };
  Table.prototype._set = function(a){ dump(this.n, a); };

  Table.prototype.get = function(k){
    var a = this._all();
    for (var i = 0; i < a.length; i++){
      var v = this.k ? a[i][this.k] : a[i].id;
      if (String(v) === String(k)) return a[i];
    }
    return undefined;
  };

  Table.prototype.put = function(o){
    o = o || {};
    var a = this._all(), i;
    if (this.k){
      for (i = 0; i < a.length; i++){
        if (String(a[i][this.k]) === String(o[this.k])){ a[i] = o; this._set(a); return o[this.k]; }
      }
      a.push(o); this._set(a); return o[this.k];
    }
    if (o.id == null) o.id = nid(a);
    for (i = 0; i < a.length; i++){
      if (String(a[i].id) === String(o.id)){ a[i] = o; this._set(a); return o.id; }
    }
    a.push(o); this._set(a); return o.id;
  };

  Table.prototype.add = function(o){ return this.put(o); };

  Table.prototype.update = function(id, patch){
    var a = this._all();
    for (var i = 0; i < a.length; i++){
      if (String(a[i].id) === String(id)){
        for (var k in patch){
          if (Object.prototype.hasOwnProperty.call(patch, k)) a[i][k] = patch[k];
        }
        this._set(a);
        return 1;
      }
    }
    return 0;
  };

  Table.prototype.del = Table.prototype['delete'] = function(k){
    var self = this, a = this._all();
    if (this.k) a = a.filter(function(r){ return String(r[self.k]) !== String(k); });
    else a = a.filter(function(r){ return String(r.id) !== String(k); });
    this._set(a);
    return 1;
  };

  Table.prototype.toArray = function(){ return this._all(); };
  Table.prototype.count = function(){ return this._all().length; };
  Table.prototype.clear = function(){ this._set([]); };
  Table.prototype.where = function(i){ return new Q(this, i); };

  function Q(t, idx){ this.t = t; this.i = idx; this.v = []; }
  Q.prototype.equals = function(v){
    var q = new Q(this.t, this.i);
    q.v = Array.isArray(v) ? v : [v];
    return q;
  };
  Q.prototype._rows = function(){
    var a = this.t._all(), v = this.v, idx = this.i;
    var s = String(idx);
    if (s.length > 2 && s.charAt(0) === '[' && s.charAt(s.length - 1) === ']'){
      var parts = s.slice(1, -1).split('+');
      return a.filter(function(r){
        for (var j = 0; j < parts.length; j++){
          if (String(r[parts[j]]) !== String(v[j])) return false;
        }
        return true;
      });
    }
    return a.filter(function(r){ return String(r[idx]) === String(v[0]); });
  };
  Q.prototype.toArray = function(){ return this._rows(); };
  Q.prototype.first = function(){ var r = this._rows(); return r.length ? r[0] : undefined; };
  Q.prototype.count = function(){ return this._rows().length; };

  window.db = {
    config:           new Table('config', { key: 'key' }),
    characters:       new Table('chars',  { key: 'id'  }),
    finance:          new Table('finance'),
    smsConversations: new Table('smsconv'),
    smsMessages:      new Table('smsmsg')
  };

  var ME = 'me';

  if (!window.db.characters.get(ME)){
    window.db.characters.put({
      id: ME,
      name: '小咩',
      type: 'user',
      identity: { phone: '85200000000', bankCard: '6225880012348888' }
    });
  }

  if (!window.db.config.get('wechat_wallet_' + ME)){
    window.db.config.put({
      key: 'wechat_wallet_' + ME,
      value: {
        wechatBalance: 8888,
        checkingBalance: 20000,
        savingBalance: 100000,
        checkingCardNumber: '6225880012348888',
        savingCardNumber: '6225880088886666'
      }
    });
  }

  window.__bankUser = window.db.characters.get(ME);

  /* 想改钱，在 Safari 控制台里敲：
     __bankSet(零钱, checking, saving)   例：__bankSet(5000, 30000, 80000) */
  window.__bankSet = function(cash, checking, saving){
    var row = window.db.config.get('wechat_wallet_' + ME);
    if (!row) return;
    var v = row.value || {};
    if (cash     != null) v.wechatBalance   = +cash;
    if (checking != null) v.checkingBalance = +checking;
    if (saving   != null) v.savingBalance   = +saving;
    row.value = v;
    window.db.config.put(row);
    if (window.toast) window.toast('改好了，重开银行页看');
    return v;
  };
})();
