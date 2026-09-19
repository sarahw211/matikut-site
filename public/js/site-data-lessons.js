/* ============================================================
   נתוני שיעורי התורה — נטען חי מ-Supabase (טבלת lessons) במקום
   קובץ סטטי, כדי שעדכונים דרך פאנל הניהול יופיעו מיד. ראו הערה על
   בקשה סינכרונית בקובץ site-data-products.js.
   ============================================================ */
(function(){
  'use strict';
  var SUPABASE_URL = 'https://garazmdqwdpxrpzkcneg.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_SFMWTzHxPebh1xTp_zv5tA_zh1x_Xaj';

  window.LESSONS_DATA = [];
  try{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/rest/v1/lessons?select=*&order=sort_order.asc', false);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_KEY);
    xhr.send(null);
    if(xhr.status >= 200 && xhr.status < 300){
      var rows = JSON.parse(xhr.responseText);
      window.LESSONS_DATA = rows.map(function(r){
        return { title: r.title, topic: r.topic, date: r.date, file: r.file };
      });
    }
  }catch(e){
    window.LESSONS_DATA = [];
  }
})();
