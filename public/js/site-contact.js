/* ============================================================
   טופס "צרו איתנו קשר" — עמותת מתיקות
   קובץ משותף לכל עמודי האתר. מחווט את כל טפסי .contact__form שבעמוד,
   שולח את הפרטים (שם/טלפון/אימייל) לטבלת contact_messages ב-Supabase,
   ומציג הודעת הצלחה/שגיאה בתוך אותו פס הטופס (בלי לשבור את העיצוב הקיים).
   ============================================================ */
(function(){
  'use strict';

  var SUPABASE_URL = 'https://garazmdqwdpxrpzkcneg.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_SFMWTzHxPebh1xTp_zv5tA_zh1x_Xaj';

  var STYLE = ''+
  '.contact__done{width:100%;height:100%;display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(255,255,255,.75);border-radius:999px;font-family:var(--font-body,inherit);font-size:16px;color:#393836;text-align:center;padding:0 24px;direction:rtl}'+
  '.contact__done svg{flex:none;width:20px;height:20px;color:#C16802}'+
  '.contact__error-msg{position:absolute;margin-top:8px;font-size:13px;color:#B3261E;direction:rtl}';

  function injectStyle(){
    if(document.getElementById('site-contact-style')) return;
    var st = document.createElement('style');
    st.id = 'site-contact-style';
    st.textContent = STYLE;
    document.head.appendChild(st);
  }

  var checkIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';

  function wireForm(form){
    if(form.dataset.contactBound) return;
    form.dataset.contactBound = '1';
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var oldError = form.querySelector('.contact__error-msg');
      if(oldError) oldError.remove();

      var nameEl = form.querySelector('[name="name"]');
      var phoneEl = form.querySelector('[name="phone"]');
      var emailEl = form.querySelector('[name="email"]');
      var name = nameEl ? nameEl.value.trim() : '';
      var phone = phoneEl ? phoneEl.value.trim() : '';
      var email = emailEl ? emailEl.value.trim() : '';

      if(!name || !phone){
        var msg = document.createElement('div');
        msg.className = 'contact__error-msg';
        msg.textContent = 'נא למלא שם וטלפון';
        form.appendChild(msg);
        (name ? phoneEl : nameEl).focus();
        return;
      }

      var sendBtn = form.querySelector('.contact__send');
      if(sendBtn){ sendBtn.setAttribute('disabled', 'disabled'); sendBtn.style.opacity = '.6'; }

      fetch(SUPABASE_URL + '/rest/v1/contact_messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          name: name,
          phone: phone,
          email: email || null,
          source_page: window.location.pathname.split('/').pop() || 'index.html'
        })
      }).then(function(res){
        if(!res.ok) throw new Error('bad status ' + res.status);
        form.innerHTML = '<div class="contact__done">'+checkIcon+'<span>תודה! קיבלנו את הפרטים ונחזור אליכם בהקדם.</span></div>';
      }).catch(function(){
        if(sendBtn){ sendBtn.removeAttribute('disabled'); sendBtn.style.opacity = ''; }
        var msg2 = document.createElement('div');
        msg2.className = 'contact__error-msg';
        msg2.textContent = 'אירעה שגיאה בשליחה. נסו שוב בעוד רגע.';
        form.appendChild(msg2);
      });
    });
  }

  function init(){
    injectStyle();
    document.querySelectorAll('.contact__form').forEach(wireForm);
  }

  document.addEventListener('DOMContentLoaded', init);
  if(document.readyState !== 'loading'){ init(); }
})();
