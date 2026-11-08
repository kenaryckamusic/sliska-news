/* Śliska News – „Knaga mówi”: maskotka w rogu ekranu z dymkami.
   Nowa osoba widzi Nieśmiałą (schowaną) Knagę, dopóki nie przeczyta pierwszego artykułu do końca – wtedy Knaga się odsłania.
   Wyłączanie: × na dymku → „Wyłącz Knagę” (zapamiętane); włączanie/wyłączanie też w stopce („Knaga: wyłącz/włącz”). */
(function () {
  'use strict';
  var KEY = 'sn-knaga';
  function st() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function put(o) { try { var s = st(); for (var k in o) s[k] = o[k]; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignoruj */ } }
  var el, bub, cur = '', hideT = 0, said = {}, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* teksty: [strój, tekst] – domyślne z knaga-teksty.js, właściciel może je podmienić w panelu (Worker /gry/cfg) */
  var LINES = window.KNAGA_LINES || { shy: [['niesmiala', 'Cześć, jestem Knaga.']], home: [['ziomek', 'Siema!']] };
  function applyCfg(c) { if (c && c.knaga) Object.keys(c.knaga).forEach(function (k) { if (c.knaga[k] && c.knaga[k].length) LINES[k] = c.knaga[k]; }); }
  if (window.SnCfg) window.SnCfg.then(applyCfg).catch(function () {});
  var pick = function (arr) { arr = arr && arr.length ? arr : LINES.home; var free = arr.filter(function (l) { return !said[l[1]]; }); var l = (free.length ? free : arr)[Math.floor(Math.random() * (free.length ? free : arr).length)]; said[l[1]] = 1; return l; };
  var hour = function () { return new Date().getHours(); };

  function build() {
    if (el) return;
    el = document.createElement('div'); el.className = 'kgm'; el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="kgm-bub" hidden><p class="kgm-t"></p><button type="button" class="kgm-x" aria-label="Zamknij dymek">×</button><div class="kgm-menu" hidden><button type="button" data-a="later">Schowaj na teraz</button><button type="button" data-a="off">Wyłącz Knagę</button></div></div><button type="button" class="kgm-k" aria-label="Knaga – maskotka Śliskiej News"></button>';
    document.body.appendChild(el); bub = el.querySelector('.kgm-bub');
    el.querySelector('.kgm-k').addEventListener('click', function () { if (!bub.hidden) { hideBub(); return; } say(randomFor(), 7000); poke(); });
    el.querySelector('.kgm-x').addEventListener('click', function (e) { e.stopPropagation(); var m = el.querySelector('.kgm-menu'); m.hidden = !m.hidden; });
    el.querySelector('.kgm-menu').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'off') { put({ off: 1 }); el.remove(); el = null; if (window.toast) window.toast('Knaga schowana. Włączysz ją z powrotem w stopce strony.'); syncFoot(); }
      else { hideBub(); el.classList.add('is-away'); setTimeout(function () { if (el) el.classList.remove('is-away'); }, 10 * 60e3); }
    });
  }
  function poke() { var k = el.querySelector('.kgm-k'); k.classList.remove('is-poke'); void k.offsetWidth; k.classList.add('is-poke'); }
  function setLook(slug) { if (slug === cur) return; cur = slug; el.querySelector('.kgm-k').innerHTML = window.Knaga ? Knaga.svg(slug, { cls: 'kgm-svg', title: 'Knaga' }) : ''; }
  function say(line, ms) {
    if (!el) return; setLook(line[0]);
    var m = el.querySelector('.kgm-menu'); m.hidden = true;
    el.querySelector('.kgm-t').textContent = line[1]; bub.hidden = false; el.classList.add('has-bub');
    clearTimeout(hideT); if (ms) hideT = setTimeout(hideBub, ms);
  }
  function hideBub() { if (!bub) return; bub.hidden = true; el.classList.remove('has-bub'); }
  function shy() { return !st().revealed; }
  function ctxName() { var h = location.hash || '#/'; return /^#\/artykul\//.test(h) ? 'article' : /^#\/gry/.test(h) ? 'games' : /^#\/zglos/.test(h) ? 'tip' : /^#\/spot/.test(h) ? 'spot' : /^#\/(dramy|drama\/|kategoria\/Dramy)/.test(h) ? 'drama' : /^#\/(sezon|podsumowanie)/.test(h) ? 'level' : 'home'; }
  function inComments() { var c = document.getElementById('comments'); if (!c || c.hidden) return false; var r = c.getBoundingClientRect(); return r.top < innerHeight * .7 && r.bottom > 0; }
  function randomFor() {
    if (shy()) return pick(LINES.shy); var c = ctxName(), h = hour();
    if ((h >= 23 || h < 5) && Math.random() < .5) return pick(LINES.night);
    if (h >= 5 && h < 10 && Math.random() < .4) return pick(LINES.morning);
    if (c === 'article' && inComments()) return pick(LINES.comments);
    return pick(LINES[c] || LINES.home);
  }

  /* odsłonięcie po pierwszym przeczytanym artykule (przewinięty do końca) */
  var readT = 0, readFn = null;
  function watchRead() {
    clearTimeout(readT); if (readFn) window.removeEventListener('scroll', readFn); readFn = null;
    if (!/^#\/artykul\//.test(location.hash)) return;
    var t0 = Date.now(), fired = false;
    function chk() {
      if (fired || !/^#\/artykul\//.test(location.hash)) return;
      var body = document.querySelector('#view-article .article-body, #view-article article') || document.querySelector('#view-article');
      if (!body) return;
      var r = body.getBoundingClientRect();
      if (r.bottom < window.innerHeight + 40 && Date.now() - t0 > 15000) {
        fired = true; window.removeEventListener('scroll', chk);
        var n = (st().read || 0) + 1; put({ read: n });
        try { window.dispatchEvent(new CustomEvent('sn:read', { detail: { id: decodeURIComponent(location.hash.split('/')[2] || '') } })); } catch (e) { /* stare przeglądarki */ }
        if (shy()) { put({ revealed: 1 }); reveal(); try { window.dispatchEvent(new CustomEvent('sn:reveal')); } catch (e) { /* - */ } } else if (el && !st().off && Math.random() < .5) say(pick(LINES.done), 6000);
      }
    }
    readFn = chk; window.addEventListener('scroll', chk, { passive: true });
    readT = setTimeout(chk, 15500);
  }
  function reveal() {
    if (!el) return;
    el.classList.add('is-reveal');
    setTimeout(function () { say(pick(LINES.reveal), 9000); setTimeout(function () { el && el.classList.remove('is-reveal'); }, 1200); }, reduce ? 0 : 450);
  }

  var lastCtx = '', timer = 0;
  function onRoute() {
    watchRead();   // czytanie liczy się zawsze (XP), nawet gdy Knaga jest wyłączona
    if (st().off) return;
    build();
    el.classList.toggle('is-hidden', /^#\/gry\/./.test(location.hash));   // w trakcie gry Knaga nie zasłania planszy
    var c = ctxName();
    setLook(shy() ? 'niesmiala' : (hour() >= 23 || hour() < 5) ? 'szlafrok' : c === 'games' ? 'surfer' : 'ziomek');
    if (c !== lastCtx) {
      lastCtx = c; clearTimeout(timer);
      var first = !st().seen; put({ seen: 1 });
      timer = setTimeout(function () { if (Math.random() < (first ? 1 : .35)) say(randomFor(), 7000); }, first ? 2500 : 9000);
    }
  }
  var cmtSaid = {}, cmtT = 0;
  window.addEventListener('scroll', function () {
    if (cmtT || !el || st().off || shy()) return;
    cmtT = setTimeout(function () { cmtT = 0; var h = location.hash; if (ctxName() === 'article' && !cmtSaid[h] && inComments()) { cmtSaid[h] = 1; if (Math.random() < .6) say(pick(LINES.comments), 6500); } }, 400);
  }, { passive: true });
  window.KnagaMowi = {
    on: function () { put({ off: 0 }); onRoute(); },
    off: function () { put({ off: 1 }); if (el) { el.remove(); el = null; } },
    isOn: function () { return !st().off; },
    reset: function () { localStorage.removeItem(KEY); }
  };
  function syncFoot() { var a = document.getElementById('knaga-toggle'); if (a) a.textContent = st().off ? 'Knaga: włącz' : 'Knaga: wyłącz'; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#knaga-toggle'); if (!a) return; e.preventDefault();
    if (st().off) window.KnagaMowi.on(); else window.KnagaMowi.off(); syncFoot();
  });
  window.addEventListener('hashchange', function () { onRoute(); syncFoot(); });
  setTimeout(syncFoot, 1500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(onRoute, 1200); }); else setTimeout(onRoute, 1200);
})();
