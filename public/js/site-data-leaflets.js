/* ============================================================
   נתוני העלונים — נטען חי מ-Supabase (טבלאות leaflet_series +
   leaflets) במקום קובץ סטטי, כדי שעדכונים דרך פאנל הניהול יופיעו
   מיד. ראו הערה על בקשה סינכרונית בקובץ site-data-products.js.
   ============================================================ */
(function(){
  'use strict';
  var SUPABASE_URL = 'https://garazmdqwdpxrpzkcneg.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_SFMWTzHxPebh1xTp_zv5tA_zh1x_Xaj';

  function get(path){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', SUPABASE_URL + '/rest/v1/' + path, false);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('Authorization', 'Bearer ' + SUPABASE_KEY);
    xhr.send(null);
    if(xhr.status >= 200 && xhr.status < 300) return JSON.parse(xhr.responseText);
    return [];
  }

  window.LEAFLET_SERIES = [];
  window.LEAFLETS_DATA = [];
  try{
    window.LEAFLET_SERIES = get('leaflet_series?select=name&order=sort_order.asc').map(function(r){ return r.name; });
    window.LEAFLETS_DATA = get('leaflets?select=*&order=sort_order.asc').map(function(r){
      return {
        title: r.title,
        series: r.series,
        date: r.date,
        topic: r.topic,
        file: r.file,
        cover: r.cover
      };
    });
  }catch(e){
    window.LEAFLET_SERIES = [];
    window.LEAFLETS_DATA = [];
  }
})();
