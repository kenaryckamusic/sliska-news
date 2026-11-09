/* Śliska News – poziomy i sezony (XP), ranking sezonu (#/sezon),
   powiadomienia czytelnika (@wzmianki, odpowiedzi). XP liczy Worker (z dziennymi limitami), strona tylko zgłasza zdarzenia.
   Wymaga z app.js: CONFIG, actorApi, Readers, state, Utils, readerAvatar, toast. */
(function () {
  'use strict';
  var LEVELS = [[0, 'Suchar'], [50, 'Lekko Wilgotny'], [120, 'Spocony'], [250, 'Mokry od Plotek'], [450, 'Ociekający'], [700, 'Napalony na Dramy'], [1000, 'Śliski Typ'], [1400, 'Król Przypału'], [1900, 'Chodząca Afera'], [2600, 'Mokra Elita'], [3500, 'Mokry Sen Redakcji'], [5000, 'Legenda Śliskiej']];
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var K = function (s, c) { return window.Knaga ? Knaga.svg(s, { cls: c || 'gk' }) : ''; };
  var logged = function () { try { return Readers.loggedIn() && Readers.hasName && Readers.hasName(); } catch (e) { return false; } };
  var MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  var MONTHS_G = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function monthName(m) { var p = m.split('-'); return MONTHS[Number(p[1]) - 1] + ' ' + p[0]; }

  /** plakietka poziomu przy nicku */
  function badge(lv, big) {
    lv = Number(lv) || 0; if (!lv) return '';
    return '<span class="lv-b lv-' + lv + (big ? ' is-big' : '') + '" title="Poziom ' + lv + ': ' + LEVELS[lv - 1][1] + '">' + (big ? 'Poziom ' + lv + ' · ' : 'Lv ' + lv + ' ') + (big ? LEVELS[lv - 1][1] : '') + '</span>';
  }

  /* ---------- lokalne statystyki (kategorie czytanych tekstów – do podsumowania) ---------- */
  var LKEY = 'sn-czytam';
  function local() { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } }
  function noteRead(a) {
    try {
      var d = local(), m = monthKey(); d[m] = d[m] || { reads: 0, cats: {}, ids: [] };
      if (d[m].ids.indexOf(a.id) >= 0) return false;
      d[m].ids.push(a.id); d[m].reads++;
      (a.categories || [a.category]).filter(Boolean).forEach(function (c) { d[m].cats[c] = (d[m].cats[c] || 0) + 1; });
      localStorage.setItem(LKEY, JSON.stringify(d)); return true;
    } catch (e) { return false; }
  }

  /* ---------- zdobywanie XP ---------- */
  var queue = Promise.resolve();
  function earn(kind) {
    if (!logged()) return Promise.resolve(null);
    queue = queue.then(function () {
      return actorApi('/xp/earn', { method: 'POST', body: JSON.stringify({ kind: kind }) }).then(function (d) {
        gained(d);
        return d;
      }).catch(function () { return null; });
    });
    return queue;
  }
  function pop(t) {
    var n = document.createElement('div'); n.className = 'xp-pop'; n.textContent = t; document.body.appendChild(n);
    setTimeout(function () { n.classList.add('out'); }, 1600); setTimeout(function () { n.remove(); }, 2100);
  }
  function levelUp(lv) {
    var m = document.createElement('div'); m.className = 'xp-up'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Nowy poziom');
    m.innerHTML = '<div class="xp-up-box">' + K('imprezowa', 'gk xp-up-k') + '<span class="gry-new">Nowy poziom!</span><h2>Poziom ' + lv + '</h2><p>Jesteś teraz: <b>' + LEVELS[lv - 1][1] + '</b>' + (LEVELS[lv] ? '. Następny: ' + LEVELS[lv][1] + ' od ' + LEVELS[lv][0] + ' XP.' : '. Wyżej się nie da – szacun!') + '</p><button type="button" class="btn btn-primary">Mokro!</button></div>';
    document.body.appendChild(m); m.querySelector('button').onclick = function () { m.remove(); }; m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
  }
  var me = null;
  function loadMe() { if (!logged()) return Promise.resolve(null); if (me) return Promise.resolve(me); return actorApi('/xp/me').then(function (d) { me = d; return d; }).catch(function () { return null; }); }

  /* dzienny bonus za wizytę */
  function daily() { if (!logged()) return; var k = 'sn-daily-' + new Date().toDateString(); try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; } earn('daily'); }

  /* ---------- karta poziomu (konto, profil) ---------- */
  function card(d, own) {
    if (!d) return '';
    var cur = LEVELS[d.lv - 1][0], next = LEVELS[d.lv] ? LEVELS[d.lv][0] : null, total = d.total != null ? d.total : d.xp || 0;
    var pct = next ? Math.max(3, Math.min(100, (total - cur) / (next - cur) * 100)) : 100;
    return '<section class="panel xp-card lv-' + d.lv + '"><div class="xp-card-h"><span class="xp-num">' + d.lv + '</span><div><b>' + LEVELS[d.lv - 1][1] + '</b><small>' + total + ' XP' + (next ? ' · do poziomu ' + (d.lv + 1) + ': ' + (next - total) + ' XP' : ' · najwyższy poziom') + '</small></div>' +
      (own ? '<a class="btn btn-sm" href="#/sezon">Ranking sezonu</a>' : '') + '</div><div class="xp-bar"><i style="width:' + pct + '%"></i></div>' +
      (own ? '<p class="xp-how">Punkty za: czytanie artykułów do końca (+3), komentarze (+5), gry (+5, rekord +10, Ślizgle +15), codzienną wizytę (+5). Dzienne limity – nie da się nabić w nieskończoność.' + (d.pts != null ? ' W tym sezonie (' + monthName(d.month) + '): <b>' + d.pts + ' XP</b>' + (d.pos ? ', miejsce <b>' + d.pos + '</b> z ' + d.players : '') + '. <a href="#/podsumowanie">Twoje podsumowanie miesiąca →</a>' : '') + '</p>' : '') + '</section>';
  }

  /* ---------- ranking sezonu (#/sezon) ---------- */
  function ranking(el, m) {
    m = /^\d{4}-\d{2}$/.test(m || '') ? m : monthKey();
    var d0 = new Date(); var prev = monthKey(new Date(d0.getFullYear(), d0.getMonth() - 1, 1));
    el.innerHTML = '<div class="xp-page"><div class="article-top"><a class="btn btn-back" href="#/gry">← Śliskie Gry</a></div>' +
      '<header class="gry-hero xp-hero"><div class="gry-hero-t"><span class="gry-eyebrow">Sezon</span><h1>Ranking Ślizgaczy</h1><p>Sezon trwa miesiąc. Punkty XP zbierasz czytając, komentując i grając. Na koniec miesiąca ranking startuje od zera – poziomy zostają na zawsze.</p>' +
      '<div class="spf-seg xp-seg" role="group" aria-label="Sezon"><button type="button" data-m="' + monthKey() + '" class="' + (m === monthKey() ? 'is-on' : '') + '">' + monthName(monthKey()) + '</button><button type="button" data-m="' + prev + '" class="' + (m === prev ? 'is-on' : '') + '">' + monthName(prev) + '</button></div></div>' +
      '<div class="gry-hero-k">' + K('kibic', 'gk gk-hero') + '</div></header><div id="xp-me"></div><div id="xp-list"><p class="muted">Ładowanie…</p></div>' +
      '<section class="panel xp-levels"><h2>Poziomy</h2><ol>' + LEVELS.map(function (l, i) { return '<li>' + badge(i + 1) + '<b>' + l[1] + '</b><span>od ' + l[0] + ' XP</span></li>'; }).join('') + '</ol></section></div>';
    el.querySelector('.xp-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) location.hash = '#/sezon/' + b.dataset.m; });
    if (logged()) loadMe().then(function (d) { var b = el.querySelector('#xp-me'); if (b && d) { b.innerHTML = card(d, true); var x = b.querySelector('.xp-card-h .btn'); if (x) x.remove(); } });
    else el.querySelector('#xp-me').innerHTML = '<p class="cmt-note">Zaloguj się, żeby zbierać XP i trafić do rankingu. <a href="#/konto">Zaloguj się →</a></p>';
    fetch(CONFIG.API_BASE + '/xp/ranking?m=' + m, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var box = el.querySelector('#xp-list'); if (!box) return;
      if (!d.top || !d.top.length) { box.innerHTML = '<div class="panel xp-empty">' + K('niesmiala', 'gk') + '<p>W tym sezonie nikt jeszcze nie zdobył XP. Pierwsze miejsce czeka na Ciebie!</p></div>'; return; }
      var medal = ['🥇', '🥈', '🥉'];
      box.innerHTML = '<p class="xp-players">' + d.players + ' ' + (d.players === 1 ? 'gracz' : 'graczy') + ' w sezonie ' + monthName(d.month) + '</p><ol class="xp-list">' + d.top.map(function (u, i) {
        return '<li class="' + (i < 3 ? 'is-top is-' + (i + 1) : '') + '"><span class="xp-pos">' + (medal[i] || i + 1) + '</span><a class="xp-u" href="#/uzytkownik/' + esc(u.u) + '"><span class="avatar lv-ring lv-' + u.lv + '">' + readerAvatar(u.name, u.av, u.u) + '</span><b>' + esc(u.name) + '</b>' + badge(u.lv) + '</a><span class="xp-pts">' + u.pts + ' XP</span></li>';
      }).join('') + '</ol>';
    }).catch(function () { var box = el.querySelector('#xp-list'); if (box) box.innerHTML = '<p class="cmt-note">Nie udało się wczytać rankingu.</p>'; });
  }

  /* ---------- powiadomienia czytelnika (dzwonek przy profilu) ---------- */
  var notes = { items: [], unread: 0 };
  function loadNotes() {
    if (!logged()) { paintBell(); return; }
    actorApi('/notes').then(function (d) { notes = d || notes; paintBell(); }).catch(function () {});
  }
  function paintBell() {
    var acc = document.getElementById('btn-account'), b = document.getElementById('nt-bell');
    if (!logged() || !acc) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'nt-bell'; b.className = 'btn btn-icon nt-bell'; b.setAttribute('aria-label', 'Wzmianki i odpowiedzi'); b.title = 'Wzmianki i odpowiedzi na Twoje komentarze';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/></svg><i></i>';
      acc.parentNode.insertBefore(b, acc); b.addEventListener('click', openNotes);
    }
    b.querySelector('i').textContent = notes.unread > 9 ? '9+' : notes.unread || '';
    b.classList.toggle('has', notes.unread > 0);
  }
  function openNotes() {
    var old = document.getElementById('nt-panel'); if (old) { old.remove(); return; }
    var p = document.createElement('div'); p.id = 'nt-panel'; p.className = 'nt-panel';
    p.innerHTML = '<h3>Wzmianki i odpowiedzi</h3>' + (notes.items.length ? '<ul>' + notes.items.map(function (n) { return '<li class="' + (n.rd ? '' : 'is-new') + '"><a href="' + esc(n.url) + '"><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span><time>' + new Date(n.at).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</time></a></li>'; }).join('') + '</ul>' : '<p class="muted">Nic nowego. Gdy ktoś Cię oznaczy (@' + esc(Readers.me && Readers.me.name || 'nick') + ') albo odpowie na komentarz – zobaczysz to tutaj.</p>');
    document.body.appendChild(p);
    p.addEventListener('click', function (e) { if (e.target.closest('a')) p.remove(); });
    setTimeout(function () { document.addEventListener('click', function off(e) { if (!p.contains(e.target) && e.target.id !== 'nt-bell' && !e.target.closest('#nt-bell')) { p.remove(); document.removeEventListener('click', off); } }); }, 0);
    if (notes.unread) { actorApi('/notes/read', { method: 'POST', body: '{}' }).catch(function () {}); notes.unread = 0; notes.items.forEach(function (n) { n.rd = 1; }); paintBell(); }
  }

  function gained(d) { if (!d || !d.got) return; pop('+' + d.got + ' XP'); if (d.up) levelUp(d.lv); me = null; }
  var lastUid = null;
  function onReader() {
    var uid = logged() ? (Readers.user && Readers.user.uid) || 'x' : null;
    if (uid === lastUid) return; lastUid = uid; me = null;
    try { window.dispatchEvent(new CustomEvent('sn:reader')); } catch (e) { /* - */ }
    loadNotes(); if (uid) daily();
  }
  window.addEventListener('sn:read', function (e) {
    var id = e.detail && e.detail.id, a = id && (state.articles || []).find(function (x) { return x.id === id; });
    if (a && noteRead(a)) earn('read');
  });
  window.addEventListener('sn:reveal', function () { earn('reveal'); });

  window.SnXP = { LEVELS: LEVELS, badge: badge, earn: earn, gained: gained, onReader: onReader, card: card, loadMe: loadMe, ranking: ranking, noteRead: noteRead, loadNotes: loadNotes, daily: daily, reset: function () { me = null; } };
  setInterval(function () { if (document.visibilityState === 'visible') loadNotes(); }, 120000);
})();
