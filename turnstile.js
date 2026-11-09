/* Śliska – Turnstile (captcha Cloudflare). SliskaTS.token() zwraca jednorazowy token albo '' (gdy ochrona jest wyłączona lub się nie załadowała).
   Widżet jest niewidoczny; pokazuje się tylko wtedy, gdy Cloudflare uzna, że trzeba coś kliknąć. */
(function () {
  'use strict';
  if (window.SliskaTS) return;
  var API = window.SLISKA_API || (location.hostname === 'news.sliska.pl' ? 'https://api.sliska.pl' : '/news/api');
  var key = null, lib = null, host = null;
  function siteKey() {
    if (key !== null) return Promise.resolve(key);
    return fetch(API + '/auth/config').then(function (r) { return r.json(); }).then(function (d) { return (key = d && d.turnstile || ''); }).catch(function () { return ''; });
  }
  function load() {
    if (lib) return lib;
    return (lib = new Promise(function (ok, no) {
      if (window.turnstile) return ok();
      var s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true;
      s.onload = function () { ok(); }; s.onerror = function () { lib = null; no(new Error('turnstile')); };
      document.head.appendChild(s);
    }));
  }
  function box() {
    if (host && host.isConnected) return host;
    host = document.createElement('div'); host.setAttribute('aria-live', 'polite');
    host.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;';
    document.body.appendChild(host); return host;
  }
  function token() {
    return siteKey().then(function (k) {
      if (!k) return '';
      return load().then(function () {
        return new Promise(function (done) {
          var id = null, over = false;
          var end = function (t) { if (over) return; over = true; try { if (id !== null) window.turnstile.remove(id); } catch (e) { /* ignoruj */ } done(t || ''); };
          setTimeout(function () { end(''); }, 25000);
          try { id = window.turnstile.render(box(), { sitekey: k, appearance: 'interaction-only', theme: 'auto', language: 'pl', callback: end, 'error-callback': function () { end(''); }, 'timeout-callback': function () { end(''); } }); }
          catch (e) { end(''); }
        });
      });
    }).catch(function () { return ''; });
  }
  window.SliskaTS = { token: token };
})();
