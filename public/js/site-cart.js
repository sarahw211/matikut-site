/* ============================================================
   סל קניות — עמותת מתיקות
   קובץ משותף לכל עמודי האתר (נטען פעם אחת בכל עמוד, לפני site-search.js
   או אחריו — הסדר לא משנה, שני הקבצים עצמאיים).
   שומר את הסל ב-localStorage, מציג ספירה חיה על אייקון העגלה בכל עמוד,
   מספק API כללי (window.MatikutCart), מחווט אוטומטית כפתורי "הוספה לסל"
   עם data-cart-id, ומציג סל קניות צף (mini-cart) שנפתח ליד אייקון העגלה
   בלחיצה עליו — כולל אנימציית "טיסה לסל" כשמוסיפים מוצר.
   ============================================================ */
(function(){
  'use strict';

  var CART_KEY = 'matikut_cart';

  function getCart(){
    try{ return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch(e){ return []; }
  }
  function setCart(list){
    try{ localStorage.setItem(CART_KEY, JSON.stringify(list)); }catch(e){}
    paintBadge();
    renderMiniCart();
    document.dispatchEvent(new CustomEvent('matikut:cart-change'));
  }
  function addToCart(id, title, price, qty){
    qty = qty || 1;
    var list = getCart();
    var row = list.find(function(r){ return r.id === id; });
    if(row){ row.qty += qty; } else { list.push({id:id, title:title || '', price:Number(price) || 0, qty:qty}); }
    setCart(list);
  }
  function setQty(id, qty){
    var list = getCart();
    if(qty <= 0){ list = list.filter(function(r){ return r.id !== id; }); }
    else {
      var row = list.find(function(r){ return r.id === id; });
      if(row) row.qty = qty;
    }
    setCart(list);
  }
  function removeFromCart(id){
    setCart(getCart().filter(function(r){ return r.id !== id; }));
  }
  function clearCart(){ setCart([]); }
  function count(){ return getCart().reduce(function(sum, r){ return sum + r.qty; }, 0); }
  function total(){ return getCart().reduce(function(sum, r){ return sum + r.qty * r.price; }, 0); }

  window.MatikutCart = {
    get: getCart,
    add: addToCart,
    setQty: setQty,
    remove: removeFromCart,
    clear: clearCart,
    count: count,
    total: total
  };

  function fmt(n){ return Number(n).toLocaleString('he-IL') + ' ש”ח'; }

  /* ---------- ספירה חיה על כל אייקוני העגלה (.hi-cart) שבעמוד ---------- */
  function paintBadge(){
    var n = count();
    document.querySelectorAll('.hi-cart .count').forEach(function(el){ el.textContent = n; });
    document.querySelectorAll('.hi-cart').forEach(function(el){ el.classList.toggle('is-empty', n === 0); });
  }

  /* חשוב: יש גם עותק שלישי, לא-אינטראקטיבי, של .hi-cart בתוך תפריט הנייד הנגלל
     (.menu__icons) — הוא מוסתר עם opacity/visibility ולא עם display:none, ולכן
     getBoundingClientRect שלו עדיין מחזיר גודל אמיתי ומיקום (אמצע המסך בערך).
     לכן פונים ישירות לשני העוגנים ה"אמיתיים" בלבד — ההדר והתפריט הצף במובייל —
     ולא סורקים את כל ה-.hi-cart שבעמוד. */
  function visibleCartIcon(){
    var candidates = [
      document.querySelector('.header__icons .hi-cart'),
      document.querySelector('.tabbar .hi-cart')
    ];
    for(var i=0;i<candidates.length;i++){
      var el = candidates[i];
      if(!el) continue;
      var r = el.getBoundingClientRect();
      if(r.width > 0 && r.height > 0) return el;
    }
    return document.querySelector('.hi-cart');
  }

  /* ---------- עיצוב הסל הצף + חלונית החיפוש (מוזרק פעם אחת) ---------- */
  var STYLE = ''+
  '.mc-panel{position:fixed;z-index:210;width:340px;max-width:calc(100vw - 24px);background:rgba(254,253,252,.86);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);border:1px solid rgba(255,255,255,.5);border-radius:18px;box-shadow:0 24px 60px rgba(57,56,54,.22);font-family:"Discovery_Fs","Assistant",system-ui,sans-serif;direction:rtl;opacity:0;transform:translateY(-6px) scale(.98);pointer-events:none;transition:opacity .32s cubic-bezier(.22,.61,.36,1), transform .32s cubic-bezier(.22,.61,.36,1);overflow:hidden}'+
  '.mc-panel.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto}'+
  '.mc-panel__head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid rgba(57,56,54,.08)}'+
  '.mc-panel__head span{font-weight:700;font-size:16px;color:#393836}'+
  '.mc-panel__close{border:0;background:none;font-size:20px;line-height:1;color:rgba(57,56,54,.4);cursor:pointer;padding:2px 4px;transition:color .2s}'+
  '.mc-panel__close:hover{color:#393836}'+
  '.mc-panel__items{max-height:320px;overflow-y:auto;padding:6px 10px}'+
  '.mc-item{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px;transition:background .2s}'+
  '.mc-item:hover{background:rgba(243,234,221,.6)}'+
  '.mc-item__img{width:44px;height:56px;object-fit:cover;border-radius:8px;flex:none;background:rgba(243,234,221,.6)}'+
  '.mc-item__text{flex:1 0 0;min-width:0}'+
  '.mc-item__title{margin:0;font-size:13.5px;font-weight:700;color:#393836;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'+
  '.mc-item__meta{margin:6px 0 0;display:flex;align-items:center;gap:6px;font-size:12.5px;color:rgba(57,56,54,.55)}'+
  '.mc-item__qbtn{width:18px;height:18px;border-radius:50%;border:1px solid rgba(57,56,54,.3);background:none;display:grid;place-items:center;font-size:12px;line-height:1;cursor:pointer;color:#393836;padding:0;transition:background .2s,color .2s,border-color .2s}'+
  '.mc-item__qbtn:hover{background:#393836;color:#ECDFCD;border-color:#393836}'+
  '.mc-item__remove{flex:none;border:0;background:none;cursor:pointer;color:rgba(57,56,54,.3);font-size:18px;line-height:1;padding:2px 4px;transition:color .2s}'+
  '.mc-item__remove:hover{color:#C16802}'+
  '.mc-panel__empty{padding:34px 18px;text-align:center;color:rgba(57,56,54,.5);font-size:14px}'+
  '.mc-panel__foot{padding:14px 18px 18px;border-top:1px solid rgba(57,56,54,.08)}'+
  '.mc-panel__total{display:flex;align-items:center;justify-content:space-between;font-size:14px;color:#393836;margin-bottom:12px}'+
  '.mc-panel__total strong{font-size:19px}'+
  '.mc-panel__cta{display:block;text-align:center;background:rgba(193,104,2,.92);color:#ECDFCD;border-radius:999px;padding:12px 0;font-size:14.5px;font-weight:700;text-decoration:none;transition:background .3s}'+
  '.mc-panel__cta:hover{background:#393836}'+
  '.mc-fly{position:fixed;z-index:999;pointer-events:none;border-radius:12px;box-shadow:0 12px 28px rgba(57,56,54,.22);opacity:.94}'+
  '.hi-cart.pop{animation:mcHiCartPop .6s cubic-bezier(.22,.61,.36,1)}'+
  '@keyframes mcHiCartPop{0%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(193,104,2,0))}40%{transform:scale(1.12);filter:drop-shadow(0 0 6px rgba(193,104,2,.45))}100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(193,104,2,0))}}'+
  '@media(max-width:480px){.mc-panel{width:calc(100vw - 20px)}}';

  function injectStyle(){
    if(document.getElementById('site-cart-style')) return;
    var st = document.createElement('style');
    st.id = 'site-cart-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  /* ---------- בניית הפאנל הצף ---------- */
  var panelEl = null, itemsEl = null, emptyEl = null, footEl = null, totalEl = null;
  var isOpen = false;

  function buildMiniCart(){
    if(panelEl) return;
    panelEl = document.createElement('div');
    panelEl.className = 'mc-panel';
    panelEl.id = 'matikutMiniCart';
    panelEl.innerHTML =
      '<div class="mc-panel__head"><span>הסל שלי</span><button type="button" class="mc-panel__close" aria-label="סגירה">&times;</button></div>'+
      '<div class="mc-panel__items" id="mcItems"></div>'+
      '<p class="mc-panel__empty" id="mcEmpty" style="display:none">הסל שלך ריק כרגע</p>'+
      '<div class="mc-panel__foot" id="mcFoot">'+
        '<div class="mc-panel__total"><span>סה”כ</span><strong id="mcTotal">0 ש”ח</strong></div>'+
        '<a class="mc-panel__cta" href="cart.html">מעבר לסל ותשלום</a>'+
      '</div>';
    /* מוצמד ל-<html> ולא ל-<body>: ל-body יש container-type:inline-size (למען מערכת
       ה--u), וזה הופך אותו ל-containing block עבור position:fixed — מה שגרם לפאנל
       להתמקם ביחס לגובה המסמך כולו (וזז עם הגלילה) במקום ביחס לחלון התצוגה. */
    document.documentElement.appendChild(panelEl);
    itemsEl = panelEl.querySelector('#mcItems');
    emptyEl = panelEl.querySelector('#mcEmpty');
    footEl = panelEl.querySelector('#mcFoot');
    totalEl = panelEl.querySelector('#mcTotal');

    panelEl.querySelector('.mc-panel__close').addEventListener('click', closeMiniCart);
    document.addEventListener('click', function(e){
      if(!isOpen) return;
      if(panelEl.contains(e.target) || e.target.closest('.hi-cart')) return;
      closeMiniCart();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen) closeMiniCart();
    });
    window.addEventListener('resize', function(){ if(isOpen) positionMiniCart(); });
  }

  function coverFor(id){
    var list = window.PRODUCTS_DATA || [];
    var p = list.filter(function(x){ return x.id === id; })[0];
    return p ? p.cover : null;
  }

  function renderMiniCart(){
    if(!itemsEl) return;
    var list = getCart();
    if(!list.length){
      itemsEl.innerHTML = '';
      emptyEl.style.display = 'block';
      footEl.style.display = 'none';
      return;
    }
    emptyEl.style.display = 'none';
    footEl.style.display = 'block';
    itemsEl.innerHTML = list.map(function(r){
      var cover = coverFor(r.id);
      var img = cover ? '<img class="mc-item__img" src="'+cover+'" alt="">' : '<span class="mc-item__img"></span>';
      return '<div class="mc-item" data-id="'+r.id.replace(/"/g,'')+'">'+
        img+
        '<div class="mc-item__text">'+
          '<p class="mc-item__title">'+r.title+'</p>'+
          '<p class="mc-item__meta">'+
            '<button type="button" class="mc-item__qbtn" data-act="dec" aria-label="הפחתה">−</button>'+
            '<span>'+r.qty+'</span>'+
            '<button type="button" class="mc-item__qbtn" data-act="inc" aria-label="הוספה">+</button>'+
            '<span>· '+fmt(r.price * r.qty)+'</span>'+
          '</p>'+
        '</div>'+
        '<button type="button" class="mc-item__remove" aria-label="הסרה מהסל">&times;</button>'+
      '</div>';
    }).join('');
    totalEl.textContent = fmt(total());

    itemsEl.querySelectorAll('.mc-item').forEach(function(row){
      var id = row.getAttribute('data-id');
      row.querySelector('[data-act="inc"]').addEventListener('click', function(){
        var r = getCart().filter(function(x){ return x.id === id; })[0];
        setQty(id, (r ? r.qty : 0) + 1);
      });
      row.querySelector('[data-act="dec"]').addEventListener('click', function(){
        var r = getCart().filter(function(x){ return x.id === id; })[0];
        setQty(id, (r ? r.qty : 0) - 1);
      });
      row.querySelector('.mc-item__remove').addEventListener('click', function(){ removeFromCart(id); });
    });
  }

  function positionMiniCart(anchor){
    if(!panelEl) return;
    anchor = anchor || panelEl._anchor || visibleCartIcon();
    if(!anchor) return;
    panelEl._anchor = anchor;
    var r = anchor.getBoundingClientRect();
    var vh = window.innerHeight, vw = window.innerWidth;
    var panelWidth = Math.min(340, vw - 24);
    var openUpward = (vh - r.bottom) < 400 && r.top > 400;
    if(openUpward){
      panelEl.style.top = '';
      panelEl.style.bottom = Math.max(12, vh - r.top + 12) + 'px';
    } else {
      panelEl.style.bottom = '';
      panelEl.style.top = (r.bottom + 12) + 'px';
    }
    /* מיושר לאייקון עצמו (לא ממורכז מתחתיו) — כמו רוב חלוניות הסל הצפות */
    var left = r.left - 6;
    if(left + panelWidth > vw - 12) left = vw - panelWidth - 12;
    if(left < 12) left = 12;
    panelEl.style.left = left + 'px';
  }

  function openMiniCart(anchor){
    buildMiniCart();
    renderMiniCart();
    positionMiniCart(anchor);
    panelEl.classList.add('is-open');
    isOpen = true;
  }
  function closeMiniCart(){
    if(panelEl) panelEl.classList.remove('is-open');
    isOpen = false;
  }
  function toggleMiniCart(anchor){
    if(isOpen) closeMiniCart(); else openMiniCart(anchor);
  }

  /* קליק על אייקון העגלה בכל עמוד -> פתיחה/סגירה של הסל הצף */
  function wireCartNav(){
    document.querySelectorAll('.hi-cart').forEach(function(el){
      if(el.dataset.cartNavBound) return;
      el.dataset.cartNavBound = '1';
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e){
        e.stopPropagation();
        toggleMiniCart(el);
      });
    });
  }

  /* ---------- אנימציית "טיסה לסל" בהוספת מוצר ---------- */
  function flyToCart(startEl){
    var icon = visibleCartIcon();
    if(!icon || !startEl){ return; }
    var startRect = startEl.getBoundingClientRect();
    var endRect = icon.getBoundingClientRect();
    if(startRect.width === 0){ return; }

    var sourceImg = startEl.closest('.product-card, .cart-item, article');
    sourceImg = sourceImg ? sourceImg.querySelector('img.product-card__cover, .cart-item__img, img') : null;

    var size = 48;
    var fly = document.createElement(sourceImg ? 'img' : 'span');
    if(sourceImg) fly.src = sourceImg.src;
    else fly.style.background = 'var(--brand, #C16802)';
    fly.className = 'mc-fly';

    var startX = startRect.left + startRect.width/2 - size/2;
    var startY = startRect.top + startRect.height/2 - size/2;
    var endX = endRect.left + endRect.width/2 - 10;
    var endY = endRect.top + endRect.height/2 - 10;
    fly.style.left = startX + 'px';
    fly.style.top = startY + 'px';
    fly.style.width = size + 'px';
    fly.style.height = size + 'px';
    fly.style.objectFit = 'cover';
    /* מוצמד ל-<html> ולא ל-body מאותה סיבה של הפאנל — כדי שהטיסה תתמקם נכון ביחס לחלון התצוגה */
    document.documentElement.appendChild(fly);

    /* קשת עדינה ורגועה — בלי סיבוב, עם שקיפות הדרגתית לתחושה אלגנטית ולא "קפצנית" */
    var arcX = (startX + endX)/2;
    var arcY = Math.min(startY, endY) - 60;

    var anim = fly.animate([
      {transform:'translate(0px,0px) scale(1)', opacity:.95, offset:0},
      {transform:'translate('+(arcX-startX)+'px,'+(arcY-startY)+'px) scale(.72)', opacity:.75, offset:.6},
      {transform:'translate('+(endX-startX)+'px,'+(endY-startY)+'px) scale(.18)', opacity:0, offset:1}
    ], {duration:780, easing:'cubic-bezier(.35,.7,.3,1)'});

    anim.onfinish = function(){
      fly.remove();
      icon.classList.remove('pop'); void icon.offsetWidth; icon.classList.add('pop');
      openMiniCart(icon);
    };
  }

  /* חיווט כללי לכפתורי "הוספה לסל" — <button data-cart-id="..." data-cart-title="..." data-cart-price="..."> */
  function wireAddButtons(){
    document.querySelectorAll('[data-cart-id]:not([data-cart-bound])').forEach(function(el){
      el.setAttribute('data-cart-bound', '1');
      el.addEventListener('click', function(e){
        e.preventDefault();
        var id = el.getAttribute('data-cart-id');
        var title = el.getAttribute('data-cart-title') || '';
        var price = el.getAttribute('data-cart-price') || 0;
        addToCart(id, title, price, 1);
        el.classList.remove('is-added');
        void el.offsetWidth;
        el.classList.add('is-added');
        flyToCart(el);
      });
    });
  }

  function init(){
    injectStyle();
    buildMiniCart();
    paintBadge();
    wireCartNav();
    wireAddButtons();
  }

  document.addEventListener('DOMContentLoaded', init);
  if(document.readyState !== 'loading'){ init(); }

  /* חשיפה כדי שדפים דינמיים (למשל עמוד החנות שמרנדר כרטיסים ב-JS)
     יוכלו לקרוא מחדש לחיווט אחרי שהם מוסיפים אלמנטים חדשים ל-DOM */
  window.matikutWireCartButtons = wireAddButtons;
})();
