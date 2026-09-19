/* ============================================================
   חיפוש פעיל + מועדפים (וישליסט) — עמותת מתיקות
   קובץ משותף לכל עמודי האתר. נטען פעם אחת בכל עמוד (script אחד),
   וטוען לבד ברקע את קבצי הנתונים (מוצרים/עלונים/שיעורים) אם עדיין
   לא נטענו באותו עמוד.
   ============================================================ */
(function(){
  'use strict';

  /* ---------- 1. טעינת קבצי הנתונים (אם עוד לא נטענו בעמוד הזה) ---------- */
  function loadScript(src){
    return new Promise(function(resolve){
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve; /* לא עוצרים את כל השאר בגלל קובץ אחד שנכשל */
      document.head.appendChild(s);
    });
  }
  var ready = Promise.all([
    window.PRODUCTS_DATA ? Promise.resolve() : loadScript('./public/js/site-data-products.js'),
    window.LEAFLETS_DATA ? Promise.resolve() : loadScript('./public/js/site-data-leaflets.js'),
    window.LESSONS_DATA  ? Promise.resolve() : loadScript('./public/js/site-data-lessons.js')
  ]);

  /* ---------- 2. וישליסט — אחסון מקומי בדפדפן ---------- */
  var WISH_KEY = 'matikut_wishlist';
  function getWishlist(){
    try{ return JSON.parse(localStorage.getItem(WISH_KEY)) || []; }
    catch(e){ return []; }
  }
  function setWishlist(list){
    try{ localStorage.setItem(WISH_KEY, JSON.stringify(list)); }catch(e){}
  }
  function isWished(id){
    return getWishlist().some(function(w){ return w.id === id; });
  }
  function toggleWish(id, type, title){
    var list = getWishlist();
    var idx = list.findIndex(function(w){ return w.id === id; });
    if(idx > -1){ list.splice(idx, 1); } else { list.push({id:id, type:type, title:title || ''}); }
    setWishlist(list);
    return idx === -1; /* true = נוסף עכשיו */
  }
  window.MatikutWishlist = { get: getWishlist, isWished: isWished, toggle: toggleWish };

  function initWishHearts(){
    /* אלמנטים שכבר חוּוְטו ידנית בעמוד עצמו (למשל כרטיסי שיעורים שנבנים
       מחדש בכל סינון/מיון) מסמנים data-wish-bound="1" כדי שלא יחוּוְטו כאן פעמיים */
    document.querySelectorAll('[data-wish-id]:not([data-wish-bound])').forEach(function(el){
      var id = el.getAttribute('data-wish-id');
      if(isWished(id)) el.classList.add('is-fav');
      el.addEventListener('click', function(){
        var type = el.getAttribute('data-wish-type') || 'item';
        var title = el.getAttribute('data-wish-title') || '';
        var added = toggleWish(id, type, title);
        el.classList.toggle('is-fav', added);
      });
    });
  }

  /* קישור אייקון הלב בהדר/בתפריט הצף — ניווט לעמוד המועדפים */
  function wireHeartNav(){
    document.querySelectorAll('.hi-heart').forEach(function(el){
      if(el.dataset.wishNavBound) return;
      el.dataset.wishNavBound = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){ window.location.href = 'wishlist.html'; });
    });
  }

  /* קישור אייקון המשתמש בהדר/בתפריט הצף — ניווט לאזור האישי */
  function wireUserNav(){
    document.querySelectorAll('.hi-user').forEach(function(el){
      if(el.dataset.userNavBound) return;
      el.dataset.userNavBound = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){ window.location.href = 'account.html'; });
    });
  }

  /* ---------- 3. חיפוש חי ---------- */
  var STYLE = ''+
  '.site-search{position:fixed;inset:0;z-index:200;display:none;align-items:flex-start;justify-content:center}'+
  '.site-search.is-open{display:flex}'+
  '.site-search__backdrop{position:absolute;inset:0;background:rgba(57,56,54,.45);backdrop-filter:blur(3px)}'+
  '.site-search__panel{position:relative;z-index:1;width:min(680px,92vw);margin-top:min(120px,10vh);background:#FEFDFC;border-radius:20px;box-shadow:0 24px 60px rgba(57,56,54,.3);overflow:hidden;font-family:"Discovery_Fs","Assistant",system-ui,sans-serif;direction:rtl}'+
  '.site-search__bar{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid rgba(57,56,54,.12)}'+
  '.site-search__bar svg{flex:none;width:22px;height:22px;color:#C16802}'+
  '.site-search__bar input{flex:1 0 0;min-width:0;border:0;outline:0;background:none;font-size:17px;font-family:inherit;color:#393836;text-align:right}'+
  '.site-search__bar input::placeholder{color:rgba(57,56,54,.45)}'+
  '.site-search__close{flex:none;border:0;background:none;font-size:22px;line-height:1;color:rgba(57,56,54,.5);cursor:pointer;padding:4px}'+
  '.site-search__close:hover{color:#393836}'+
  '.site-search__results{max-height:60vh;overflow-y:auto;padding:8px}'+
  '.site-search__empty{padding:32px 20px;text-align:center;color:rgba(57,56,54,.5);font-size:15px}'+
  '.site-search__group-label{padding:10px 14px 4px;font-size:12px;font-weight:700;color:#C16802;letter-spacing:.03em}'+
  '.site-search__item{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:12px;text-decoration:none;color:#393836;transition:background .2s}'+
  '.site-search__item:hover{background:#F3EADD}'+
  '.site-search__item-title{font-size:15px;font-weight:700}'+
  '.site-search__item-sub{font-size:12px;color:rgba(57,56,54,.55);margin-top:2px}'+
  '.site-search__item-tag{flex:none;font-size:11px;color:#ECDFCD;background:#393836;border-radius:999px;padding:4px 10px}'+
  '@media(max-width:620px){.site-search__panel{margin-top:8vh}.site-search__bar input{font-size:15px}}';

  function injectStyle(){
    if(document.getElementById('site-search-style')) return;
    var st = document.createElement('style');
    st.id = 'site-search-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  var searchIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>';

  function buildOverlay(){
    if(document.getElementById('siteSearch')) return;
    var wrap = document.createElement('div');
    wrap.className = 'site-search';
    wrap.id = 'siteSearch';
    wrap.innerHTML =
      '<div class="site-search__backdrop"></div>'+
      '<div class="site-search__panel">'+
        '<div class="site-search__bar">'+searchIcon+
          '<input type="text" id="siteSearchInput" placeholder="חיפוש מוצרים, שיעורים ועלונים...">'+
          '<button class="site-search__close" type="button" aria-label="סגירה">&times;</button>'+
        '</div>'+
        '<div class="site-search__results" id="siteSearchResults"></div>'+
      '</div>';
    document.body.appendChild(wrap);

    var input = wrap.querySelector('#siteSearchInput');
    var results = wrap.querySelector('#siteSearchResults');

    function close(){
      wrap.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    function open(){
      wrap.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function(){ input.focus(); }, 30);
      render(input.value);
    }
    wrap.querySelector('.site-search__backdrop').addEventListener('click', close);
    wrap.querySelector('.site-search__close').addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && wrap.classList.contains('is-open')) close();
    });

    function collect(){
      var items = [];
      (window.PRODUCTS_DATA || []).forEach(function(p){
        items.push({title:(p.titleAccent||'')+' '+(p.titleRest||p.title||''), sub:p.price ? (p.price+' ש”ח') : '', tag:'מוצר', link:p.link || 'shop.html'});
      });
      (window.LEAFLETS_DATA || []).forEach(function(l){
        items.push({title:l.title, sub:l.topic || '', tag:'עלון', link:'leaflets.html'});
      });
      (window.LESSONS_DATA || []).forEach(function(l){
        items.push({title:l.title, sub:l.topic || '', tag:'שיעור', link:'lessons.html'});
      });
      return items;
    }
    var all = null;

    function render(q){
      if(!all) all = collect();
      q = (q || '').trim();
      if(!q){
        results.innerHTML = '<div class="site-search__empty">הקלידו כדי לחפש בין המוצרים, העלונים והשיעורים באתר</div>';
        return;
      }
      var norm = q.toLowerCase();
      var matches = all.filter(function(it){
        return (it.title || '').toLowerCase().indexOf(norm) > -1 ||
               (it.sub || '').toLowerCase().indexOf(norm) > -1;
      }).slice(0, 30);
      if(!matches.length){
        results.innerHTML = '<div class="site-search__empty">לא נמצאו תוצאות עבור "'+q.replace(/</g,'')+'"</div>';
        return;
      }
      results.innerHTML = matches.map(function(it){
        return '<a class="site-search__item" href="'+it.link+'">'+
          '<span><span class="site-search__item-title">'+it.title+'</span>'+
          (it.sub ? '<span class="site-search__item-sub">'+it.sub+'</span>' : '')+
          '</span>'+
          '<span class="site-search__item-tag">'+it.tag+'</span>'+
        '</a>';
      }).join('');
    }
    input.addEventListener('input', function(){ render(input.value); });

    window.MatikutSearch = { open: open, close: close };
  }

  function wireSearchIcons(){
    document.querySelectorAll('.hi-search').forEach(function(el){
      if(el.dataset.searchBound) return;
      el.dataset.searchBound = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(){ window.MatikutSearch && window.MatikutSearch.open(); });
    });
  }

  /* ---------- 4. אתחול ---------- */
  ready.then(function(){
    injectStyle();
    buildOverlay();
    wireSearchIcons();
    wireHeartNav();
    wireUserNav();
    initWishHearts();
  });
})();
