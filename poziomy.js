/* Śliska News – poziomy i sezony (XP), ranking sezonu (#/sezon), Śliskie Podsumowanie miesiąca (#/podsumowanie),
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

  /* ---------- Śliskie Podsumowanie miesiąca (#/podsumowanie) – karty w stylu „Wrapped” (grafiki 1080×1920, bez Knagi) ---------- */
  var PERSONAS = {
    nalogowy: ['Nałogowy Ślizgacz', 'Czytasz więcej niż redakcja pisze. Plotka nie ma przed Tobą tajemnic.'],
    gadula: ['Gaduła z komentarzy', 'Artykuł to dla Ciebie tylko wstęp. Prawdziwa akcja dzieje się pod spodem.'],
    gracz: ['Gracz z krwi i kości', 'Przyszedłeś po newsy, zostałeś dla rekordów. Ślizgle to Twój poranny rytuał.'],
    bywalec: ['Stały bywalec', 'Wpadasz regularnie, wiesz co w trawie piszczy i nie dajesz się nabrać na fejki.'],
    niesmialy: ['Nieśmiały czytelnik', 'Wpadasz, czytasz, znikasz. Cichy, ale wszystko widzi.']
  };
  function summary(el, m) {
    m = /^\d{4}-\d{2}$/.test(m || '') ? m : monthKey();
    var mo = m.split('-'), d0 = new Date(), prev = monthKey(new Date(d0.getFullYear(), d0.getMonth() - 1, 1)), mName = MONTHS[Number(mo[1]) - 1];
    el.innerHTML = '<div class="wr"><div class="article-top"><a class="btn btn-back" href="#/">← Strona główna</a></div>' +
      '<header class="wr-hero"><div><span class="gry-eyebrow">Śliskie Podsumowanie</span><h1>Twój ' + mName + '<br>na Śliskiej</h1><p>Twój miesiąc w liczbach – gotowe grafiki do wrzucenia na story. Pobierz pojedynczo albo wszystkie naraz.</p>' +
      '<div class="spf-seg xp-seg" role="group" aria-label="Miesiąc"><button type="button" data-m="' + monthKey() + '" class="' + (m === monthKey() ? 'is-on' : '') + '">' + monthName(monthKey()) + '</button><button type="button" data-m="' + prev + '" class="' + (m === prev ? 'is-on' : '') + '">' + monthName(prev) + '</button></div></div></header>' +
      '<div class="wr-cards" id="wr-cards"><p class="muted">Przygotowuję Twoje karty…</p></div><div class="wr-act" id="wr-act"></div></div>';
    el.querySelector('.xp-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) location.hash = '#/podsumowanie/' + b.dataset.m; });
    var loc = local()[m] || { reads: 0, cats: {} };
    var gl = (function () { try { return JSON.parse(localStorage.getItem('sn-gry')) || {}; } catch (e) { return {}; } })();
    var p = logged() ? actorApi('/xp/summary?m=' + m).catch(function () { return null; }) : Promise.resolve(null);
    p.then(function (d) {
      d = d && d.lv ? d : null;
      var cats = Object.keys(loc.cats).sort(function (a, b) { return loc.cats[b] - loc.cats[a]; });
      var reads = d ? Math.max(d.reads || 0, loc.reads) : loc.reads, comments = d ? d.comments || 0 : 0, games = d ? Math.max(d.games || 0, 0) : (gl.played || 0);
      var topArt = d && d.commented && d.commented[0] ? state.articles.find(function (a) { return a.id === d.commented[0].article; }) : null;
      var pk = reads >= 40 ? 'nalogowy' : comments >= 15 ? 'gadula' : games >= 15 ? 'gracz' : reads >= 8 ? 'bywalec' : 'niesmialy';
      var recs = window.SliskieGry ? SliskieGry.games.filter(function (g) { return SliskieGry.best(g.id); }).slice(0, 4).map(function (g) { return [g.name, SliskieGry.fmt(g.id, SliskieGry.best(g.id))]; }) : [];
      var o = { m: mName, year: mo[0], name: d ? d.name : '', lv: d ? d.lv : 0, lvName: d ? d.lvName : '', total: d ? d.total : 0, pts: d ? d.pts : 0, pos: d ? d.pos : 0, players: d ? d.players : 0,
        reads: reads, cats: cats.slice(0, 3).map(function (c) { return [c, loc.cats[c]]; }), comments: comments, topArt: topArt ? topArt.title : '', topN: d && d.commented && d.commented[0] ? d.commented[0].n : 0, games: games, recs: recs, persona: PERSONAS[pk] };
      var list = [['intro', 'Start'], ['reads', 'Czytanie']].concat(d ? [['comments', 'Komentarze']] : []).concat([['games', 'Gry']]).concat(d ? [['season', 'Sezon']] : []).concat([['persona', 'Twój typ']]);
      wrRender(list, o).then(function (imgs) {
        var box = el.querySelector('#wr-cards'); if (!box) return;
        box.innerHTML = imgs.map(function (u, i) { return '<figure class="wr-card"><img src="' + u + '" alt="Karta podsumowania: ' + list[i][1] + '" loading="lazy"><figcaption><b>' + (i + 1) + '. ' + list[i][1] + '</b><button type="button" class="btn btn-sm" data-dl="' + i + '">Pobierz</button></figcaption></figure>'; }).join('');
        el.querySelector('#wr-act').innerHTML = '<button type="button" class="btn btn-primary" id="wr-all">Pobierz wszystkie (' + imgs.length + ')</button>' + (navigator.canShare ? '<button type="button" class="btn" id="wr-share">Udostępnij na story</button>' : '') + (!d ? '<a class="btn" href="#/konto">Zaloguj się, żeby zobaczyć komentarze, XP i miejsce w sezonie</a>' : '');
        var files = function (idx) { return Promise.all(idx.map(function (i) { return fetch(imgs[i]).then(function (r) { return r.blob(); }).then(function (b) { return new File([b], 'sliskie-podsumowanie-' + (i + 1) + '.png', { type: 'image/png' }); }); })); };
        var dl = function (i) { var a = document.createElement('a'); a.href = imgs[i]; a.download = 'sliskie-podsumowanie-' + m + '-' + (i + 1) + '.png'; document.body.appendChild(a); a.click(); a.remove(); };
        box.addEventListener('click', function (e) { var b = e.target.closest('[data-dl]'); if (b) dl(+b.dataset.dl); });
        el.querySelector('#wr-all').onclick = function () { imgs.forEach(function (_, i) { setTimeout(function () { dl(i); }, i * 350); }); };
        var sh = el.querySelector('#wr-share'); if (sh) sh.onclick = function () { files(imgs.map(function (_, i) { return i; })).then(function (f) { if (navigator.canShare({ files: f })) navigator.share({ files: f, text: 'Moje Śliskie Podsumowanie 💦 news.sliska.pl' }).catch(function () {}); else el.querySelector('#wr-all').click(); }); };
      });
    });
  }
  /* rysowanie kart (styl grafik Śliskiej na Instagram: logo, ramka, kreska + nagłówek, duża typografia Figtree) */
  var logoImg = null;
  function logo() { if (logoImg) return logoImg; logoImg = new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = 'logo-biale.svg'; }); return logoImg; }
  function wrRender(list, o) {
    var fontP = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('900 120px Figtree'), document.fonts.load('600 40px Figtree')]).catch(function () {}) : Promise.resolve();
    return Promise.all([logo(), fontP]).then(function (r) { return list.map(function (it) { return wrCard(it[0], o, r[0]); }); });
  }
  var FIG = 'Figtree, "Segoe UI", Arial, sans-serif';
  function wrap(x, text, X, Y, maxW, lh, maxL) {
    var words = String(text).split(/\s+/), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); if (maxL && lines.length > maxL) { lines = lines.slice(0, maxL); lines[maxL - 1] = lines[maxL - 1].replace(/\s*\S*$/, '') + '…'; }
    lines.forEach(function (l, i) { x.fillText(l, X, Y + i * lh); }); return Y + lines.length * lh;
  }
  function fitFont(x, text, weight, max, maxW) { var s = max; do { x.font = weight + ' ' + s + 'px ' + FIG; s -= 6; } while (x.measureText(text).width > maxW && s > 40); }
  function wrCard(kind, o, lg) {
    var W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var BG = { intro: ['#140c24', '#3a1450', '#8a0b3a'], reads: ['#5a0614', '#d6001c', '#ff4d5e'], comments: ['#1b1036', '#4b1a7a', '#8b2fc9'], games: ['#0c1430', '#1f2470', '#5b63ff'], season: ['#ffcf4a', '#ffb020', '#ff8a00'], persona: ['#0b0710', '#1a0b18', '#3a0a1f'] }[kind];
    var dark = kind !== 'season', ink = dark ? '#fff' : '#1a0d14', soft = dark ? 'rgba(255,255,255,.72)' : 'rgba(26,13,20,.72)';
    var g = x.createLinearGradient(0, 0, W * .4, H); g.addColorStop(0, BG[0]); g.addColorStop(.55, BG[1]); g.addColorStop(1, BG[2]); x.fillStyle = g; x.fillRect(0, 0, W, H);
    /* kształty w tle */
    x.save(); x.globalAlpha = dark ? .18 : .25;
    x.fillStyle = kind === 'season' ? '#fff' : '#ff2d55'; x.beginPath(); x.arc(W * .95, H * .2, 360, 0, 7); x.fill();
    x.fillStyle = kind === 'season' ? '#d6001c' : '#ffcf4a'; x.beginPath(); x.arc(W * .05, H * .78, 260, 0, 7); x.fill(); x.restore();
    x.fillStyle = dark ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.04)'; for (var i = -H; i < W; i += 28) { x.save(); x.translate(i, 0); x.rotate(-Math.PI / 4); x.fillRect(0, 0, 5, 4000); x.restore(); }
    /* ramka */
    x.strokeStyle = dark ? 'rgba(255,255,255,.22)' : 'rgba(26,13,20,.25)'; x.lineWidth = 3; x.beginPath(); x.roundRect(40, 40, W - 80, H - 80, 48); x.stroke();
    /* logo + data */
    if (lg) { x.save(); if (!dark) x.filter = 'invert(1)'; var lw = 360, lh2 = lw * (lg.height / lg.width || .22); x.drawImage(lg, 96, 108, lw, lh2); x.restore(); }
    x.fillStyle = ink; x.font = '800 38px ' + FIG; x.textAlign = 'right'; x.fillText((o.m + ' ' + o.year).toUpperCase(), W - 96, 150); x.textAlign = 'left';
    var eyebrow = function (t, y) { x.fillStyle = kind === 'season' ? '#1a0d14' : '#d6001c'; if (kind === 'reads') x.fillStyle = '#ffcf4a'; x.fillRect(96, y - 14, 64, 8); x.fillStyle = ink; x.font = '800 36px ' + FIG; x.save(); x.letterSpacing = '8px'; x.fillText(t.toUpperCase(), 184, y); x.restore(); };
    var big = function (t, y, max) { x.fillStyle = ink; fitFont(x, String(t), '900', max || 360, W - 192); x.fillText(String(t), 90, y); };
    var y;
    if (kind === 'intro') {
      eyebrow('Śliskie Podsumowanie', 760);
      x.fillStyle = ink; x.font = '900 150px ' + FIG; x.fillText('Twój', 90, 940); fitFont(x, o.m, '900', 190, W - 192); x.fillText(o.m, 90, 1110); x.font = '900 150px ' + FIG; x.fillText('na Śliskiej', 90, 1260);
      x.fillStyle = soft; x.font = '600 46px ' + FIG; x.fillText(o.name ? o.name + (o.lv ? ' · poziom ' + o.lv + ' – ' + o.lvName : '') : 'Twój miesiąc w liczbach', 96, 1380);
      x.fillStyle = soft; x.font = '600 40px ' + FIG; x.fillText('Przewijaj dalej →', 96, 1500);
    } else if (kind === 'reads') {
      eyebrow('Czytanie', 560); big(o.reads, 900, 420);
      x.fillStyle = ink; x.font = '800 64px ' + FIG; y = wrap(x, o.reads === 1 ? 'artykuł przeczytany do samego końca' : 'artykułów przeczytanych do samego końca', 96, 1010, W - 192, 76, 2);
      if (o.cats.length) {
        x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.roundRect(96, y + 70, W - 192, 110 + o.cats.length * 92, 36); x.fill();
        x.fillStyle = soft; x.font = '700 36px ' + FIG; x.fillText('Najczęściej czytałeś', 140, y + 140);
        o.cats.forEach(function (ct, k) { x.fillStyle = ink; x.font = '900 60px ' + FIG; x.fillText((k + 1) + '. ' + ct[0], 140, y + 230 + k * 92); x.textAlign = 'right'; x.fillStyle = soft; x.font = '700 40px ' + FIG; x.fillText(ct[1] + '×', W - 140, y + 228 + k * 92); x.textAlign = 'left'; });
      }
    } else if (kind === 'comments') {
      eyebrow('Komentarze', 560); big(o.comments, 900, 420);
      x.fillStyle = ink; x.font = '800 64px ' + FIG; y = wrap(x, o.comments === 1 ? 'komentarz w tym miesiącu' : 'komentarzy w tym miesiącu', 96, 1010, W - 192, 76, 2);
      if (o.topArt) {
        x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(96, y + 70, W - 192, 380, 36); x.fill();
        x.fillStyle = '#ffcf4a'; x.font = '800 36px ' + FIG; x.fillText('Najwięcej pisałeś pod (' + o.topN + '×):', 140, y + 140);
        x.fillStyle = ink; x.font = '900 56px ' + FIG; wrap(x, '„' + o.topArt + '”', 140, y + 220, W - 280, 68, 3);
      }
    } else if (kind === 'games') {
      eyebrow('Śliskie Gry', 560); big(o.games, 900, 420);
      x.fillStyle = ink; x.font = '800 64px ' + FIG; y = wrap(x, o.games === 1 ? 'rozegrana gra' : 'rozegranych gier', 96, 1010, W - 192, 76, 2);
      if (o.recs.length) {
        x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(96, y + 70, W - 192, 110 + o.recs.length * 92, 36); x.fill();
        x.fillStyle = soft; x.font = '700 36px ' + FIG; x.fillText('Twoje rekordy', 140, y + 140);
        o.recs.forEach(function (r, k) { x.fillStyle = ink; x.font = '800 52px ' + FIG; x.fillText(r[0], 140, y + 230 + k * 92); x.textAlign = 'right'; x.fillStyle = '#ffcf4a'; x.font = '900 52px ' + FIG; x.fillText(r[1], W - 140, y + 230 + k * 92); x.textAlign = 'left'; });
      } else { x.fillStyle = soft; x.font = '600 44px ' + FIG; wrap(x, 'Ślizgle, krzyżówka, Łap Krople… Rekordy czekają na Ciebie.', 96, y + 100, W - 192, 58, 3); }
    } else if (kind === 'season') {
      eyebrow('Sezon ' + o.m, 560); big(o.pts, 900, 400);
      x.fillStyle = ink; x.font = '800 64px ' + FIG; x.fillText('punktów XP w sezonie', 96, 1010);
      x.fillStyle = 'rgba(26,13,20,.1)'; x.beginPath(); x.roundRect(96, 1090, W - 192, 420, 36); x.fill();
      x.fillStyle = soft; x.font = '700 36px ' + FIG; x.fillText('Miejsce w rankingu', 140, 1160);
      x.fillStyle = ink; x.font = '900 120px ' + FIG; var pt = o.pos ? o.pos + '.' : '–', pw = x.measureText(pt).width; x.fillText(pt, 140, 1290); x.font = '700 44px ' + FIG; x.fillStyle = soft; if (o.players) x.fillText('na ' + o.players + ' graczy', 140 + pw + 24, 1290);
      x.fillStyle = soft; x.font = '700 36px ' + FIG; x.fillText('Poziom ' + o.lv + ' · ' + o.lvName + ' · ' + o.total + ' XP', 140, 1380);
      var nx = LEVELS[o.lv] ? LEVELS[o.lv][0] : null, cu = LEVELS[o.lv - 1] ? LEVELS[o.lv - 1][0] : 0, pc = nx ? Math.max(.04, Math.min(1, (o.total - cu) / (nx - cu))) : 1;
      x.fillStyle = 'rgba(26,13,20,.15)'; x.beginPath(); x.roundRect(140, 1420, W - 280, 30, 15); x.fill(); x.fillStyle = '#d6001c'; x.beginPath(); x.roundRect(140, 1420, (W - 280) * pc, 30, 15); x.fill();
    } else if (kind === 'persona') {
      eyebrow('Twój typ', 760);
      x.fillStyle = ink; x.font = '700 52px ' + FIG; x.fillText('W tym miesiącu byłeś:', 96, 880);
      x.fillStyle = '#ff2d55'; x.font = '900 130px ' + FIG; y = wrap(x, o.persona[0], 90, 1040, W - 192, 140, 3);
      x.fillStyle = soft; x.font = '600 48px ' + FIG; wrap(x, o.persona[1], 96, y + 40, W - 192, 64, 4);
    }
    /* stopka */
    x.strokeStyle = dark ? 'rgba(255,255,255,.25)' : 'rgba(26,13,20,.25)'; x.lineWidth = 2; x.beginPath(); x.moveTo(96, H - 230); x.lineTo(W - 96, H - 230); x.stroke();
    x.fillStyle = ink; x.font = '700 44px ' + FIG; x.fillText('news.sliska.pl', 96, H - 150); x.textAlign = 'right'; x.fillText('#ŚliskiePodsumowanie', W - 96, H - 150); x.textAlign = 'left';
    return c.toDataURL('image/png');
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

  window.SnXP = { LEVELS: LEVELS, badge: badge, earn: earn, gained: gained, onReader: onReader, card: card, loadMe: loadMe, ranking: ranking, summary: summary, noteRead: noteRead, loadNotes: loadNotes, daily: daily, reset: function () { me = null; } };
  setInterval(function () { if (document.visibilityState === 'visible') loadNotes(); }, 120000);
})();
