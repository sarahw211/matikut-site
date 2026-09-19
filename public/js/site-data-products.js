/* ============================================================
   נתוני המוצרים — נטען חי מ-Supabase (טבלת products) במקום קובץ
   סטטי, כדי שעדכונים דרך פאנל הניהול (admin-orders.html) יופיעו
   באתר מיד. הבקשה סינכרונית בכוונה: היא רצה *לפני* קוד הרינדור
   בעמודים (shop.html/index.html/wishlist.html/site-cart.js) שמצפה
   ש-window.PRODUCTS_DATA כבר מלא כשהוא רץ — בדיוק כמו שהיה עם
   <script src="products-data.js"> הסטטי הישן. אם הבקשה נכשלת
   (בעיית רשת וכו') — מוגדר מערך ריק כדי שהעמוד לא יתרסק.
   ============================================================ */
(function(){
  'use strict';
  var SUPABASE_URL = 'https://garazmdqwdpxrpzkcneg.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_SFMWTzHxPebh1xTp_zv5tA_zh1x_Xaj';

  window.PRODUCTS_DATA = [];
  try{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/rest/v1/products?select=*&order=sort_order.asc', false);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_KEY);
    xhr.send(null);
    if(xhr.status >= 200 && xhr.status < 300){
      var rows = JSON.parse(xhr.responseText);
      window.PRODUCTS_DATA = rows.map(function(r){
        return {
          id: r.id,
          title: r.title,
          titleAccent: r.title_accent,
          titleRest: r.title_rest,
          price: Number(r.price),
          cover: r.cover,
          coverAlt: r.cover_alt,
          desc: r.description,
          link: r.link,
          framed: !!r.framed,
          pdfBuy: !!r.pdf_buy
        };
      });
    }
  }catch(e){
    window.PRODUCTS_DATA = [];
  }
})();
