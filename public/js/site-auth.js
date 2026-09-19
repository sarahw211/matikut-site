/* ============================================================
   אזור אישי ללקוח — עמותת מתיקות
   קובץ משותף לכל עמודי האתר. מנהל session של לקוח (Supabase Auth,
   נפרד לגמרי מ-session המנהלת בפאנל הניהול — מפתח localStorage אחר).

   בטעינת כל עמוד, אם קיימת התחברות תקפה: שולף ברקע (בבקשה
   סינכרונית, לפני ש-site-cart.js/site-search.js קוראים את
   localStorage) את הסל/המועדפים השמורים בחשבון, וממזג אותם עם מה
   שיש בדפדפן הזה — כדי שהחוויה תהיה זהה בכל מכשיר:
   • אם בחשבון כבר יש נתונים — הם המקור האמיתי (מחליפים את המקומי).
   • אם בחשבון ריק אבל יש נתונים מקומיים (למשל פעילות כאורחת לפני
     ההתחברות) — דוחפים אותם לחשבון פעם אחת.
   ============================================================ */
(function(){
  'use strict';

  var SUPABASE_URL = 'https://garazmdqwdpxrpzkcneg.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_SFMWTzHxPebh1xTp_zv5tA_zh1x_Xaj';
  var SESSION_KEY = 'matikut_customer_session';
  var CART_KEY = 'matikut_cart';
  var WISH_KEY = 'matikut_wishlist';

  function safeParse(json){ try{ return JSON.parse(json); }catch(e){ return null; } }

  /* ---------- ניהול session (לקוח) ---------- */
  function saveSession(session){
    var expires_at = Date.now() + (session.expires_in || 3600) * 1000;
    var rec = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: expires_at,
      id: session.user && session.user.id,
      email: session.user && session.user.email
    };
    try{ localStorage.setItem(SESSION_KEY, JSON.stringify(rec)); }catch(e){}
    return rec;
  }
  function getSession(){ return safeParse(localStorage.getItem(SESSION_KEY)); }
  function clearSession(){ localStorage.removeItem(SESSION_KEY); }

  /* --- גרסה סינכרונית (רק לשימוש פנימי בזמן טעינת העמוד, למיזוג סל/מועדפים) --- */
  function refreshSync(session){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.send(JSON.stringify({ refresh_token: session.refresh_token }));
    if(xhr.status >= 200 && xhr.status < 300){
      return saveSession(JSON.parse(xhr.responseText));
    }
    clearSession();
    return null;
  }
  function validSessionSync(){
    var s = getSession();
    if(!s) return null;
    if(s.expires_at - 30000 > Date.now()) return s;
    return refreshSync(s);
  }
  function xhrJson(method, path, token, body){
    var xhr = new XMLHttpRequest();
    xhr.open(method, SUPABASE_URL + path, false);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('Prefer', 'return=representation');
    if(body) xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(body ? JSON.stringify(body) : null);
    if(xhr.status >= 200 && xhr.status < 300){
      try{ return JSON.parse(xhr.responseText); }catch(e){ return null; }
    }
    return null;
  }

  /* --- מיזוג סל/מועדפים בטעינת עמוד --- */
  function mergeOnLoad(){
    var s = validSessionSync();
    if(!s) return;
    var rows = xhrJson('GET', '/rest/v1/profiles?select=wishlist,cart', s.access_token);
    if(!rows || !rows.length) return;
    var profile = rows[0];
    var localCart = safeParse(localStorage.getItem(CART_KEY)) || [];
    var localWish = safeParse(localStorage.getItem(WISH_KEY)) || [];
    var serverCart = profile.cart || [];
    var serverWish = profile.wishlist || [];
    var pushBody = {};

    var finalCart = serverCart.length ? serverCart : localCart;
    if(!serverCart.length && localCart.length) pushBody.cart = localCart;

    var finalWish = serverWish.length ? serverWish : localWish;
    if(!serverWish.length && localWish.length) pushBody.wishlist = localWish;

    try{
      localStorage.setItem(CART_KEY, JSON.stringify(finalCart));
      localStorage.setItem(WISH_KEY, JSON.stringify(finalWish));
    }catch(e){}

    if(Object.keys(pushBody).length){
      xhrJson('PATCH', '/rest/v1/profiles?id=eq.' + s.id, s.access_token, pushBody);
    }
  }

  /* ---------- API אסינכרוני (לשימוש ב-account.html ובדפים אחרים) ---------- */
  function refreshAsync(session){
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ refresh_token: session.refresh_token })
    }).then(function(res){
      if(!res.ok){ clearSession(); throw new Error('refresh failed'); }
      return res.json();
    }).then(saveSession);
  }
  function validSessionAsync(){
    var s = getSession();
    if(!s) return Promise.reject(new Error('no session'));
    if(s.expires_at - 30000 > Date.now()) return Promise.resolve(s);
    return refreshAsync(s);
  }

  function login(email, password){
    return fetch(SUPABASE_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ email: email, password: password })
    }).then(function(res){
      return res.json().then(function(data){ return { ok: res.ok, data: data }; });
    }).then(function(r){
      if(!r.ok || !r.data.access_token) throw new Error('אימייל או סיסמה שגויים.');
      saveSession(r.data);
      mergeOnLoad();
      return getSession();
    });
  }

  function signup(email, password){
    return fetch(SUPABASE_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
      body: JSON.stringify({ email: email, password: password })
    }).then(function(res){
      return res.json().then(function(data){ return { ok: res.ok, data: data }; });
    }).then(function(r){
      if(!r.ok){
        var m = (r.data && r.data.msg) || (r.data && r.data.error_description) || 'שגיאה בהרשמה.';
        if(/already|registered|exists/i.test(m)) m = 'כבר קיים חשבון עם האימייל הזה — נסי להתחבר.';
        throw new Error(m);
      }
      if(r.data.access_token){
        saveSession(r.data);
        mergeOnLoad();
        return { confirmed: true };
      }
      return { confirmed: false };
    });
  }

  function logout(){
    clearSession();
  }

  function apiGet(path){
    return validSessionAsync().then(function(s){
      return fetch(SUPABASE_URL + '/rest/v1/' + path, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + s.access_token }
      });
    }).then(function(res){
      if(!res.ok) throw new Error('שגיאת שרת (' + res.status + ')');
      return res.json();
    });
  }
  function apiPatchProfile(fields){
    return validSessionAsync().then(function(s){
      return fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + s.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + s.access_token,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(fields)
      });
    }).then(function(res){
      if(!res.ok) throw new Error('שגיאה בשמירה.');
    });
  }

  window.MatikutAuth = {
    login: login,
    signup: signup,
    logout: logout,
    getSession: getSession,
    isLoggedIn: function(){ return !!getSession(); },
    getProfile: function(){ return apiGet('profiles?select=*').then(function(r){ return r && r[0]; }); },
    saveProfile: function(fields){ return apiPatchProfile(fields); },
    getOrders: function(){ return apiGet('orders?select=*&order=created_at.desc'); }
  };

  /* מיזוג מיידי — לפני ש-site-cart.js/site-search.js קוראים את ה-localStorage,
     לכן תגית הסקריפט הזו חייבת להיות *לפני* שתיהן בכל עמוד. */
  mergeOnLoad();
})();
