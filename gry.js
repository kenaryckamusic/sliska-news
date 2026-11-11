/* Śliska News – Śliskie Gry (#/gry). Gry działają w przeglądarce; rekordy zalogowanych zapisują się na koncie (Worker /gry/record),
   niezalogowanych – na urządzeniu. Słowa Ślizgli, krzyżówki i teksty Knagi może ustawiać właściciel (panel dev.sliska.pl → Gry i Knaga).
   Wywołanie: SliskieGry.mount(el, sub, { articles }). */
(function () {
  'use strict';
  var KEY = 'sn-gry';
  var API = (window.CONFIG && CONFIG.API_BASE) || (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : '/news/api');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var K = function (slug, cls) { return window.Knaga ? Knaga.svg(slug, { cls: cls || 'gk' }) : ''; };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignoruj */ } }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignoruj */ } }
  var logged = function () { try { return Readers.loggedIn() && (!Readers.hasName || Readers.hasName()); } catch (e) { return false; } };
  var uid = function () { try { return Readers.user && Readers.user.uid; } catch (e) { return ''; } };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stopFns = [];
  function stopAll() { stopFns.forEach(function (f) { try { f(); } catch (e) { /* ignoruj */ } }); stopFns = []; }
  function dayIndex() { var d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 10, 1)) / 864e5); }
  function weekIndex() { return Math.floor((dayIndex() + 6) / 7); }
  var ICO = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
    fire: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.3 1.2-3.7 2.3-4.7.3 1.6 1 2.6 2 3.1C11 8.6 11.3 5.6 12 3z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/></svg>'
  };

  /* ---------- konfiguracja właściciela (Ślizgle, krzyżówka, teksty Knagi) ---------- */
  window.SnCfg = window.SnCfg || fetch(API + '/gry/cfg', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  /* właściciel mógł wyzerować wszystko w grach: wtedy kasujemy też zakończenia, rekordy i postępy zapisane w tej przeglądarce */
  window.SnCfg.then(function (c) {
    try {
      var ep = c && c.epoch ? String(c.epoch) : ''; if (!ep) return;
      if (localStorage.getItem('sn-gry-epoch') === ep) return;
      var had = localStorage.getItem('sn-gry-epoch') !== null || localStorage.getItem('sn-gry') !== null;
      Object.keys(localStorage).forEach(function (k) { if (k !== 'sn-gry-epoch' && /^(sn-gry|sn-slizgle|sn-krzyz|sn-drama|sn-dr-fold|sn-nac)/.test(k)) localStorage.removeItem(k); });
      localStorage.setItem('sn-gry-epoch', ep);
      if (had && /#\/gry/.test(location.hash)) location.reload();
    } catch (e) { /* ignoruj */ }
  });
  function cfg() { return Promise.race([window.SnCfg, new Promise(function (res) { setTimeout(function () { res({}); }, 2500); })]); }

  /* ---------- lista gier ---------- */
  var GAMES = [
    { id: 'slizgle', name: 'Ślizgle', knaga: 'redaktor', sub: 'Codzienne kontrowersyjne słowo. 6 prób.', tag: 'Codzienna', kind: 'daily', c: ['#0b5d34', '#1fbf6b'],
      how: 'Zgadnij słowo dnia (4–7 liter, długość widać na planszy). Po każdej próbie litery zmieniają kolor: <b class="hw ok">zielony</b> – dobra litera na dobrym miejscu, <b class="hw in">żółty</b> – litera jest, ale gdzie indziej, <b class="hw no">szary</b> – nie ma jej. Masz 6 prób, nowe słowo o północy.' },
    { id: 'krzyzowka', name: 'Krzyżówka Tygodnia', knaga: 'szlafrok', sub: 'Odgadnij wyrazy i odkryj hasło tygodnia.', tag: 'Co tydzień', kind: 'weekly', c: ['#1f2470', '#5b63ff'],
      how: 'Wpisz wyrazy według podpowiedzi. Litery w złotej kolumnie czytane z góry na dół tworzą hasło tygodnia. Nowa krzyżówka w każdy poniedziałek.' },
    { id: 'krople', name: 'Łap Krople', knaga: 'kapiel', sub: 'Łap krople do wanny, unikaj pozwów.', tag: 'Zręcznościowa', unit: 'pkt', c: ['#075985', '#38bdf8'],
      how: 'Przesuwaj wannę z Knagą: myszką, palcem albo strzałkami. Kropla +1, Mocz +5, serduszko oddaje życie. Pozew zabiera życie. Co 10 złapanych kropli bez pudła – bonus.' },
    { id: 'flappy', name: 'Super Knaga', knaga: 'super', sub: 'Leć nad sceną między mikrofonami.', tag: 'Zręcznościowa', unit: 'pkt', c: ['#2b0f55', '#c0164a'],
      how: 'Spacja, kliknięcie albo stuknięcie – Super Knaga macha peleryną i podlatuje. Przelatuj między statywami z mikrofonami. Z każdym punktem robi się ciaśniej.' },
    { id: 'waz', name: 'Śliski Wąż', knaga: 'ikona', sub: 'Knaga rośnie na długość. Zbieraj mikrofony.', tag: 'Klasyk', unit: 'pkt', c: ['#3a0a33', '#ff2d77'],
      how: 'Strzałki, WASD albo przesunięcie palcem zmienia kierunek. Z każdym mikrofonem Knaga robi się dłuższa (Długość widać w cm). Złoty mikrofon +3 (znika po kilku sekundach). Nie uderzaj w ściany, kolumny ani w samą siebie.' },
    { id: 'pojedynek', name: 'Pojedynek', knaga: 'kowboj', sub: 'Kto pierwszy, ten żyje.', tag: 'Nowość', unit: 'pkt', c: ['#b45309', '#fbbf24'],
      how: 'Czekaj na napis STRZELAJ! i wtedy kliknij albo stuknij w ekran, szybciej niż rywal. Za wczesny strzał kosztuje życie. Z każdą wygraną rywal jest szybszy, a im szybciej strzelisz, tym więcej punktów.' },
    { id: 'ratunek', name: 'Ratunek', knaga: 'ratownik', sub: 'Łap Knagi i omijaj meduzy.', tag: 'Nowość', unit: 'pkt', c: ['#0284c7', '#22d3ee'],
      how: 'Przesuwaj palcem w lewo i prawo, żeby koło ratunkowe łapało spadające Knagi. Seria daje bonus. Uciekająca Knaga albo złapana meduza to utrata życia. Z czasem robi się coraz szybciej i gęściej, a Knagi zbaczają na boki.' },
    { id: 'karny', name: 'Rzut karny', knaga: 'kibic', sub: 'Pokonaj bramkarza.', tag: 'Nowość', unit: 'pkt', c: ['#15803d', '#ef4444'],
      how: 'Przeciągnij palcem od piłki w stronę bramki i puść. Kierunek to strona strzału, a długość to wysokość. Górne rogi dają najwięcej punktów, ale łatwo o pudło. Bramkarz jest coraz lepszy, a trzy nieudane karne kończą grę.' },
    { id: 'kregle', name: 'Kręgle', knaga: 'ziomek', sub: 'Machnij palcem i zbij wszystkie.', tag: 'Nowość', unit: 'pkt', c: ['#0f766e', '#f59e0b'],
      how: 'Zacznij palec tam, gdzie ma ruszyć kula, i machnij w górę. Zakręć palcem, żeby nadać kuli efekt. 10 ramek po dwa rzuty, strike i spare dają bonusy jak w prawdziwych kręglach (maksimum 300).' },
    { id: 'ukladanka', name: 'Śliska Układanka', knaga: 'detektyw', sub: 'Ułóż zdjęcie z artykułu.', tag: 'Logiczna', unit: 'ruchów', low: true, c: ['#7a3d00', '#ffae2b'],
      how: 'Przesuwaj kafelki na puste pole, aż ułożysz zdjęcie z artykułu. Rekordem jest najmniejsza liczba ruchów. „Podgląd” pokazuje całe zdjęcie.' },
    { id: 'drama', name: 'Drama Simulator', knaga: 'wsciekla', sub: 'Chwilowo niedostępny – przechodzi przebudowę.', tag: 'Przebudowa', kind: 'story', off: true, c: ['#5c0716', '#ff3b3b'],
      how: 'Jesteś reporterem Śliskiej. Zagraj pojedynczą sprawę albo cały sezon (3, 6 lub 9 spraw pod rząd). Każdy dzień to dylemat o tym, co publikujesz, wątek z redakcją (Szef, Ola, Wrona, Marta, sponsor) i losowe wydarzenia. Paski: Klikalność, Wiarygodność, Pozwy, Nerwy oraz relacje z ekipą decydują o jednym z 9 zakończeń każdej dramy (81 w całej grze) i o zakończeniu kariery. Po każdym wyborze dostajesz prawdziwy fakt ze źródłem. Ranking liczy odkryte zakończenia (max 30).' },
    { id: 'slizgawka', name: 'Ślizgawka', knaga: 'surfer', sub: 'Surfuj, skacz i rób triki.', tag: 'Nowość', unit: 'm', c: ['#b33a1a', '#ffb36b'],
      how: 'Spacja albo stuknięcie – skok (drugi raz w powietrzu = podwójny skok i salto). Strzałka w dół albo lewa strona ekranu – schylasz się pod dronami z pozwami lub nurkujesz. Fale-rampy wyrzucają Cię wysoko, za salta są bonusy. Zbieraj krople (+10 m). Co 400 m zmienia się pora: zachód, noc, neon, zorza.' }
  ];
  var G = function (id) { return GAMES.filter(function (g) { return g.id === id; })[0]; };
  var unlocked = function () { return !!load().slizgawka; };

  /* ---------- rekordy: konto (zalogowani) albo urządzenie ---------- */
  var acc = null;
  function low(g) { return !!(G(g) || {}).low; }
  function better(g, a, b) { if (!a) return false; if (!b) return true; return low(g) ? a < b : a > b; }
  function best(g) { if (acc && logged() && acc.uid === uid()) return acc.best[g] || 0; return (load().best || {})[g] || 0; }
  function fmt(g, v) {
    if (!v) return '–';
    if (g === 'slizgle') return (7 - v) + '/6';
    if (g === 'drama') return v + ' zakończeń';
    if (g === 'krzyzowka') return v + '×';
    return v + ' ' + (G(g).unit || '');
  }
  /* ---- ukończenie gry: JEDNO zgłoszenie do serwera (wynik + rekord + XP). Serwer sprawdza bilet startowy, czas i wiarygodność wyniku. ---- */
  var TICKETED = ['krople', 'flappy', 'waz', 'slizgawka', 'kregle', 'pojedynek', 'ratunek', 'karny', 'ukladanka', 'drama', 'naczelny', 'krzyzowka'];
  var TK = {}, TLS = {}, RPS = {}, RUNS = {}, lastFin = {};
  var REPLAY = { flappy: 1, waz: 1 };         // gry odtwarzane na serwerze z zapisu ruchów (ziarno losowania dostaje się razem z biletem)
  /* ---- wspólna symulacja gier (ten sam kod liczy wynik na serwerze) ---- */
/* Wspólna, deterministyczna symulacja Super Knagi (flappy) i Węża (waz).
   Ten sam kod działa w przeglądarce (rozgrywka) i w Workerze (sprawdzanie wyniku z zapisu ruchów). Zmiana tu = zmiana w obu miejscach. */
var SliskaSim = (function () {
  var DT = 1 / 60;
  /* generator liczb pseudolosowych (mulberry32): to samo ziarno = ta sama rozgrywka */
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* sinus z samych dodawań i mnożeń (IEEE 754), żeby wynik był identyczny w każdej przeglądarce i w Workerze */
  function sin(x) {
    var TP = 6.283185307179586;
    x = x - TP * Math.floor(x / TP + 0.5);
    var x2 = x * x;
    return x * (1 + x2 * (-1 / 6 + x2 * (1 / 120 + x2 * (-1 / 5040 + x2 * (1 / 362880 + x2 * (-1 / 39916800 + x2 * (1 / 6227020800)))))));
  }

  /* ---------- Super Knaga ---------- */
  function flappy(seed, W, H) {
    var R = rng(seed);
    var s = { n: 0, t: 0, score: 0, dead: false, W: W, H: H, ev: [], pipes: [], B: { x: W * 0.3, y: H * 0.42, vy: -200, shield: false, inv: 0 } };
    function crash() {
      var B = s.B; if (B.inv > 0) return;
      if (B.shield) { s.ev.push(['shieldsave']); B.shield = false; B.inv = 1.1; B.vy = -400; return; }
      s.dead = true;
    }
    s.flap = function () { s.B.vy = -340; };
    s.tick = function () {
      if (s.dead) return;
      var B = s.B, dt = DT, i, p;
      s.n++; s.t = s.n * DT;
      B.inv = Math.max(0, B.inv - dt); B.vy += 920 * dt; B.y += B.vy * dt;
      var sp = 160 + Math.min(90, s.score * 3);
      if (!s.pipes.length || s.pipes[s.pipes.length - 1].x < W - 240) {
        var gp = Math.max(138, 190 - s.score * 2), tp = 70 + R() * (H - 140 - gp - 30);
        var amp = s.score >= 12 ? 14 + R() * Math.min(34, s.score) : 0, ph = R() * 6, sh = !B.shield && R() < 0.1;
        s.pipes.push({ x: W + 50, top: tp, base: tp, gp: gp, amp: amp, ph: ph, coin: true, sh: sh });
      }
      for (i = 0; i < s.pipes.length; i++) {
        p = s.pipes[i];
        p.x -= sp * dt;
        if (p.amp) p.top = Math.max(50, Math.min(H - 46 - p.gp - 50, p.base + sin(s.t * 1.7 + p.ph) * p.amp));
        if ((p.coin || p.sh) && Math.abs(p.x - B.x) < 32 && Math.abs(B.y - (p.top + p.gp / 2)) < 44) {
          if (p.sh) { B.shield = true; s.ev.push(['shield']); } else { s.score += 2; s.ev.push(['drop']); }
          s.ev.push(['burst', p.x, p.top + p.gp / 2, p.sh ? 1 : 0]);
          p.coin = false; p.sh = false;
        }
        if (!p.pass && p.x + 30 < B.x) { p.pass = true; s.score += 1; s.ev.push(['pass']); }
        if (B.x + 22 > p.x - 26 && B.x - 22 < p.x + 26 && (B.y - 24 < p.top || B.y + 24 > p.top + p.gp)) { crash(); if (s.dead) return; }
      }
      s.pipes = s.pipes.filter(function (q) { return q.x > -70; });
      if (B.y > H - 46) { B.y = H - 46; crash(); } else if (B.y < -40) { B.y = -40; B.vy = 0; crash(); }
    };
    return s;
  }

  /* ---------- Śliski Wąż ---------- */
  var DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  function waz(seed) {
    var R = rng(seed), N = 17;
    var s = { n: 0, t: 0, score: 0, dead: false, N: N, ev: [], S: [[8, 8], [7, 8], [6, 8]], dir: [1, 0], nd: [1, 0], acc: 0, gold: null, slow: null, slowT: 0, combo: 0, comboT: 0, nextObs: 5, obst: [], food: null, comboMax: 0 };
    function same(p, q) { return p[0] === q[0] && p[1] === q[1]; }
    function free() {
      var p;
      do { p = [Math.floor(R() * N), Math.floor(R() * N)]; }
      while (s.S.some(function (q) { return same(p, q); }) || (s.food && same(p, s.food)) || s.obst.some(function (q) { return same(p, q); }) || (s.gold && same(p, s.gold.p)) || (s.slow && same(p, s.slow.p)));
      return p;
    }
    function addObs() { for (var i = 0; i < 40; i++) { var p = free(); if (Math.abs(p[0] - s.S[0][0]) + Math.abs(p[1] - s.S[0][1]) > 4) { s.obst.push(p); return; } } }
    s.food = free();
    s.turn = function (k) { var m = DIRS[k]; if (m && !(m[0] === -s.dir[0] && m[1] === -s.dir[1])) s.nd = m; };
    s.tick = function () {
      if (s.dead) return;
      var dt = DT; s.n++; s.t = s.n * DT;
      if (s.gold) { s.gold.t -= dt; if (s.gold.t <= 0) s.gold = null; }
      if (s.slow) { s.slow.t -= dt; if (s.slow.t <= 0) s.slow = null; }
      if (s.slowT > 0) s.slowT -= dt;
      if (s.comboT > 0) s.comboT -= dt;
      s.acc += dt;
      var stepT = Math.max(0.065, 0.15 - s.score * 0.0025) * (s.slowT > 0 ? 1.7 : 1);
      if (s.acc < stepT) return;
      s.acc = 0; s.dir = s.nd;
      var h = [s.S[0][0] + s.dir[0], s.S[0][1] + s.dir[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || s.S.some(function (p) { return same(p, h); }) || s.obst.some(function (o) { return same(o, h); })) { s.dead = true; return; }
      s.S.unshift(h);
      if (s.gold && same(h, s.gold.p)) {
        s.ev.push(['gold', h[0], h[1]]); s.score += 3; s.gold = null; s.S.push(s.S[s.S.length - 1]); s.S.push(s.S[s.S.length - 1]);
      } else if (same(h, s.food)) {
        s.combo = s.comboT > 0 ? s.combo + 1 : 1; if (s.combo > s.comboMax) s.comboMax = s.combo; s.comboT = 2.6;
        var add = Math.min(4, s.combo); s.score += add; s.ev.push(['mic', h[0], h[1], add]);
        s.food = free();
        if (!s.gold && R() < 0.18) s.gold = { p: free(), t: 6 };
        else if (!s.slow && R() < 0.14) s.slow = { p: free(), t: 9 };
        if (s.score >= s.nextObs && s.obst.length < 9) { s.nextObs += 5; addObs(); s.ev.push(['obs']); }
      } else if (s.slow && same(h, s.slow.p)) {
        s.ev.push(['slow', h[0], h[1]]); s.slowT = 6; s.slow = null; s.score += 1; s.S.pop();
      } else s.S.pop();
    };
    return s;
  }

  /* Odtworzenie całej rozgrywki z zapisu ruchów: zwraca { score, ticks, dead }.
     flappy: inp = numery kroków, w których gracz machnął peleryną; waz: inp = krok * 4 + kierunek (0 góra, 1 dół, 2 lewo, 3 prawo). */
  function replay(game, seed, dims, inp, ticks) {
    var s = game === 'flappy' ? flappy(seed, dims.w, dims.h) : waz(seed), j = 0;
    for (var n = 0; n < ticks && !s.dead; n++) {
      if (game === 'flappy') { while (j < inp.length && inp[j] <= n) { if (inp[j] === n) s.flap(); j++; } }
      else { while (j < inp.length && Math.floor(inp[j] / 4) <= n) { if (Math.floor(inp[j] / 4) === n) s.turn(inp[j] % 4); j++; } }
      s.tick(); s.ev.length = 0;
    }
    return { score: s.score, ticks: s.n, dead: s.dead };
  }
  return { DT: DT, rng: rng, sin: sin, flappy: flappy, waz: waz, replay: replay };
})();

  function mintRun(g) {
    if (!logged() || !window.actorApi) return Promise.resolve(null);
    return actorApi('/gry/start', { method: 'POST', body: JSON.stringify({ game: g }) }).then(function (d) { return d && d.tk && d.seed != null ? { tk: d.tk, seed: d.seed >>> 0 } : null; }).catch(function () { return null; });
  }
  function mint(g) {
    if (!logged() || !window.actorApi || TICKETED.indexOf(g) < 0 || REPLAY[g]) return Promise.resolve(null);
    return (TK[g] = actorApi('/gry/start', { method: 'POST', body: JSON.stringify({ game: g }) }).then(function (d) { return d && d.tk || null; }).catch(function () { return null; }));
  }
  function finish(g, score) {
    if (!logged() || !window.actorApi) return;
    lastFin[g] = Date.now();
    var run = RUNS[g], rp = RPS[g]; delete RUNS[g]; delete RPS[g];
    var p = REPLAY[g] ? Promise.resolve(run && rp ? run.tk : null) : (TK[g] || mint(g)); delete TK[g];
    p.then(function (tk) {
      if (!tk) return null;
      return actorApi('/gry/finish', { method: 'POST', body: JSON.stringify({ game: g, score: score, tk: tk, tl: TLS[g] || undefined, rp: rp || undefined }) }).then(function (d) {
        delete TLS[g];
        if (d && d.best != null) { if (acc) acc.best[g] = d.best; var b = $('#gry-best'); if (b) b.textContent = fmt(g, best(g)); }
        if (d && d.xp && d.xp.got && window.SnXP) SnXP.gained(d.xp);
      });
    }).catch(function () {}).then(function () { if (!REPLAY[g]) mint(g); });
  }
  function accLoad() {
    if (!logged() || !window.actorApi) { acc = null; return Promise.resolve(null); }
    var u = uid(); if (acc && acc.uid === u) return Promise.resolve(acc);
    return actorApi('/gry/me').then(function (d) {
      acc = { uid: u, best: (d && d.best) || {} }; achSync();
      /* lokalne rekordy nie są już wysyłane na konto: rekord powstaje tylko z wyniku zatwierdzonego przez serwer */
      return acc;
    }).catch(function () { return null; });
  }
  /** Zapis wyniku. Zwraca true, gdy to nowy rekord (konta albo urządzenia). */
  function submit(g, score, noPlay, localOnly) {
    var d = load(); d.best = d.best || {}; if (!noPlay) d.played = (d.played || 0) + 1;
    var nb = better(g, score, best(g));
    if (better(g, score, d.best[g])) d.best[g] = score;
    save(d);
    if (logged() && !localOnly) finish(g, score);
    var b = $('#gry-best'); if (b) b.textContent = fmt(g, best(g));
    return nb;
  }
  function played(g) { if (Date.now() - (lastFin[g] || 0) < 4000) return; try { fetch(API + '/gry/play', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game: g }), keepalive: true }).catch(function () {}); } catch (e) { /* ignoruj */ } }
  /* rola Właściciela dociąga się po zalogowaniu: gdy zmieni się widoczność GABINA, odśwież widok gier */
  var gabinSeen = window.GabinGame ? GabinGame.owner() : false;
  window.addEventListener('sn:reader', function () { setTimeout(function () { var o = window.GabinGame ? GabinGame.owner() : false; if (o !== gabinSeen) { gabinSeen = o; if (/^#\/gry(\/gabin)?$/.test(location.hash)) window.dispatchEvent(new HashChangeEvent('hashchange')); } }, 400); });
  window.addEventListener('sn:reader', function () { acc = null; accAch = null; accAchUid = ''; var cg = $('.gp[data-game]'); if (cg) mint(cg.dataset.game); accLoad().then(function () { var b = $('#gry-best'), cur = $('.gp[data-game]'); if (b && cur) b.textContent = fmt(cur.dataset.game, best(cur.dataset.game)); }); });

  /* ---------- najlepsi gracze ---------- */
  function loadTop(g) {
    fetch(API + '/gry/top?game=' + g, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var box = $('#gp-top'), t1 = $('#gry-top1'); if (!box) return;
      var top = (d && d.top) || [];
      if (t1) t1.textContent = top[0] ? fmt(g, top[0].best) : '–';
      box.innerHTML = top.length ? top.map(function (u, i) {
        return '<li' + (i < 3 ? ' class="is-' + (i + 1) + '"' : '') + '><span class="gp-pos">' + (i + 1) + '</span><a href="#/uzytkownik/' + esc(u.u) + '"><span class="avatar' + (u.lv ? ' lv-ring lv-' + u.lv : '') + '">' + (typeof readerAvatar === 'function' ? readerAvatar(u.name, u.av, u.u) : '') + '</span><b>' + esc(u.name) + '</b></a><em>' + fmt(g, u.best) + '</em></li>';
      }).join('') : '<li class="gp-empty">Nikt jeszcze nie ma rekordu. Bądź pierwszy!</li>';
    }).catch(function () { var box = $('#gp-top'); if (box) box.innerHTML = '<li class="gp-empty">Ranking chwilowo niedostępny.</li>'; });
  }
  function toast(t) { var n = document.createElement('div'); n.className = 'gry-toast'; n.textContent = t; document.body.appendChild(n); setTimeout(function () { n.classList.add('out'); }, 2200); setTimeout(function () { n.remove(); }, 2700); }
  /* Udostępnianie: tekst + obrazek-karta (jak w „Wrapped”) przez systemowe okno udostępniania – bez zapisywania w galerii. */
  function mascotImg(slug) {
    return new Promise(function (res) {
      try {
        if (!slug || !window.Knaga) return res(null);
        var svg = Knaga.svg(slug, { cls: 'gk' }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" ');
        var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); };
        im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        setTimeout(function () { res(null); }, 2500);
      } catch (e) { res(null); }
    });
  }
  function logoImg() {
    return new Promise(function (res) {
      var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); };
      im.src = 'logo-biale.svg'; setTimeout(function () { res(null); }, 2500);
    });
  }
  /* Karta do udostępniania: o.fmt 'post' = 1080×1350 (post 4:5), domyślnie 1080×1920 (relacja / stories). Treść trzymamy w bezpiecznym polu (poza górnymi ~250 px i dolnymi ~300 px). */
  function shareCard(o) {
    return Promise.all([
      (document.fonts && document.fonts.load ? Promise.race([document.fonts.load('800 80px Figtree'), new Promise(function (r) { setTimeout(r, 800); })]) : Promise.resolve()).catch(function () {}),
      mascotImg(o.knaga),
      logoImg()
    ]).then(function (pre) {
      var im = pre[1], lg = pre[2], post = o.fmt === 'post', W = 1080, H = post ? 1350 : 1920, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      var x = cv.getContext('2d'), F = 'Figtree, "Segoe UI", system-ui, -apple-system, sans-serif', c = o.c || ['#2b0f55', '#c0164a'];
      var rr = function (px, py, w, h, r) { x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.closePath(); };
      /* tło: gradient + poświaty + delikatna siatka kropek */
      var g = x.createLinearGradient(0, 0, W * 0.7, H); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); x.fillStyle = g; x.fillRect(0, 0, W, H);
      var glow = function (cx, cy, r, a) { var q = x.createRadialGradient(cx, cy, 10, cx, cy, r); q.addColorStop(0, 'rgba(255,255,255,' + a + ')'); q.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = q; x.fillRect(0, 0, W, H); };
      glow(W * 0.85, 330, 760, 0.28); glow(W * 0.1, 1500, 700, 0.12);
      var vg = x.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1300); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.42)'); x.fillStyle = vg; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(255,255,255,.07)'; for (var yy = 40; yy < H; yy += 56) for (var xx = 40 + ((yy / 56) % 2) * 28; xx < W; xx += 56) { x.beginPath(); x.arc(xx, yy, 3, 0, 6.3); x.fill(); }
      x.strokeStyle = 'rgba(255,255,255,.09)'; x.lineWidth = 46; x.beginPath(); x.arc(W + 40, 420, 380, 0, 6.3); x.stroke(); x.beginPath(); x.arc(-60, 1240, 300, 0, 6.3); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'alphabetic';
      /* logo: prawdziwe logo śliskanews (plik logo-biale.svg); gdyby się nie wczytało – napis */
      var LY = post ? 120 : 250, LH = post ? 86 : 118;
      if (lg) { var lw = LH * (lg.naturalWidth && lg.naturalHeight ? lg.naturalWidth / lg.naturalHeight : 5.7); x.shadowColor = 'rgba(0,0,0,.3)'; x.shadowBlur = 18; x.drawImage(lg, (W - lw) / 2, LY, lw, LH); x.shadowColor = 'transparent'; x.shadowBlur = 0; }
      else { x.font = '800 74px ' + F; x.textAlign = 'left'; var w1 = x.measureText('śliska').width, w2 = x.measureText('news').width, bx = (W - w1 - w2) / 2; x.fillStyle = '#fff'; x.fillText('śliskanews', bx, LY + 80); x.textAlign = 'center'; }
      var EY = LY + LH + 40;
      var eb = String(o.eyebrow || '').toUpperCase(); x.font = '800 30px ' + F; var ew = x.measureText(eb).width + 64 + eb.length * 3;
      rr((W - ew) / 2, EY, ew, 62, 31); x.fillStyle = 'rgba(0,0,0,.28)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 2; x.stroke();
      x.fillStyle = '#fff'; x.fillText(eb.split('').join(' '), W / 2, EY + 42);
      /* układ pionowy: karta z wynikiem dosunięta do stopki, maskotka dostaje całe wolne miejsce nad nią */
      var title = o.title || '', rows = o.rows && o.rows.length ? o.rows : null, n = rows ? Math.max.apply(null, rows.map(function (r) { return r.length; })) : 0;
      var gap = 12, cell = rows ? Math.min(post ? (rows.length > 4 ? 66 : 84) : (rows.length > 4 ? 86 : 104), Math.floor(640 / n) - 12) : 0;
      var cardH = rows ? 150 + rows.length * (cell + gap) + (o.lines && o.lines.length ? 84 : 28) : (post ? 500 : 560), cy = (post ? 1070 : 1590) - cardH;
      var my = EY + (post ? 74 : 100), ms = Math.min(470, cy - my - 24);
      if (im && ms >= (post ? 140 : 220)) { var gl = x.createRadialGradient(W / 2, my + ms / 2, 20, W / 2, my + ms / 2, ms * 0.7); gl.addColorStop(0, 'rgba(255,255,255,.34)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gl; x.fillRect(0, my - 60, W, ms + 120); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 50; x.shadowOffsetY = 24; x.drawImage(im, (W - ms) / 2, my, ms, ms); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0; }
      rr(90, cy, W - 180, cardH, 64); x.fillStyle = 'rgba(255,255,255,.15)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.34)'; x.lineWidth = 3; x.stroke();
      var fs = 78; do { x.font = '800 ' + fs + 'px ' + F; fs -= 4; } while (x.measureText(title).width > 800 && fs > 34);
      x.fillStyle = '#fff'; x.fillText(title, W / 2, cy + 104);
      if (rows) {
        var tw = n * cell + (n - 1) * gap, ox = (W - tw) / 2, oy = cy + 150;
        rows.forEach(function (row, ri) { row.forEach(function (col, ci) { var px = ox + ci * (cell + gap), py = oy + ri * (cell + gap); rr(px, py, cell, cell, 20); x.fillStyle = col === 'ok' ? '#22c55e' : col === 'in' ? '#f5b82e' : 'rgba(0,0,0,.28)'; x.fill(); if (col === 'ok' || col === 'in') { var hg = x.createLinearGradient(0, py, 0, py + cell); hg.addColorStop(0, 'rgba(255,255,255,.3)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = hg; rr(px, py, cell, cell, 20); x.fill(); } }); });
        (o.lines || []).forEach(function (l, i) { x.fillStyle = 'rgba(255,255,255,.9)'; x.font = '700 38px ' + F; x.fillText(l, W / 2, oy + rows.length * (cell + gap) + 44 + i * 50); });
      } else {
        var bigS = String(o.big == null ? '' : o.big); x.fillStyle = '#fff'; x.font = '800 ' + (bigS.length > 4 ? 210 : bigS.length > 3 ? 250 : 300) + 'px ' + F; x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 36; x.shadowOffsetY = 12; x.fillText(bigS, W / 2, cy + (post ? 350 : 400)); x.shadowColor = 'transparent'; x.shadowBlur = 0; x.shadowOffsetY = 0;
        if (o.unit) { x.fillStyle = 'rgba(255,255,255,.88)'; x.font = '800 52px ' + F; x.fillText(String(o.unit).toUpperCase(), W / 2, cy + (post ? 440 : 490)); }
      }
      /* stopka */
      var fy = post ? 1120 : 1640; rr(W / 2 - 340, fy, 680, 104, 52); x.fillStyle = '#fff'; x.fill();
      x.fillStyle = c[0]; x.font = '800 44px ' + F; x.fillText('news.sliska.pl/gry', W / 2, fy + 68);
      x.fillStyle = 'rgba(255,255,255,.85)'; x.font = '700 36px ' + F; x.fillText('Dasz radę lepiej?', W / 2, fy + 168);
      return new Promise(function (res) { cv.toBlob(function (b) { res(b); }, 'image/png'); });
    });
  }
  function share(text, card) {
    var copy = function () { if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Skopiowano – wklej, gdzie chcesz'); }); else if (navigator.share) navigator.share({ text: text }).catch(function () {}); };
    if (!card) { if (navigator.share) navigator.share({ text: text }).catch(function () {}); else copy(); return; }
    var send = function (blob, name) {
      var f = window.File ? new File([blob], name, { type: 'image/png' }) : null;
      if (f && navigator.canShare && navigator.canShare({ files: [f] }) && navigator.share) return navigator.share({ files: [f], text: text }).catch(function (e) { if (!e || e.name !== 'AbortError') copy(); });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      copy();
    };
    /* dwa formaty: relacja na Instagram (9:16) i post (4:5) – użytkownik wybiera po podglądzie */
    Promise.all([shareCard(card), shareCard(Object.assign({}, card, { fmt: 'post' }))]).then(function (bl) {
      if (!bl[0] || !bl[1]) throw 0;
      var urls = bl.map(function (b) { return URL.createObjectURL(b); });
      var m = document.createElement('div'); m.className = 'sh-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Wybierz format grafiki');
      m.innerHTML = '<div class="sh-box"><h3>Wybierz grafikę</h3><div class="sh-opts">'
        + '<button type="button" class="sh-opt" data-i="0"><img src="' + urls[0] + '" alt="Podgląd relacji"><b>Relacja</b><small>Instagram Story 9:16</small></button>'
        + '<button type="button" class="sh-opt" data-i="1"><img src="' + urls[1] + '" alt="Podgląd posta"><b>Post</b><small>Instagram / Facebook 4:5</small></button>'
        + '</div><button type="button" class="btn sh-x">Anuluj</button></div>';
      var close = function () { m.remove(); setTimeout(function () { urls.forEach(function (u) { URL.revokeObjectURL(u); }); }, 4000); };
      m.addEventListener('click', function (e) {
        var o = e.target.closest('.sh-opt');
        if (o) { var i = +o.dataset.i; close(); send(bl[i], i ? 'sliska-gry-post.png' : 'sliska-gry-relacja.png'); return; }
        if (e.target === m || e.target.closest('.sh-x')) close();
      });
      document.body.appendChild(m);
    }).catch(function () { if (navigator.share) navigator.share({ text: text }).catch(function () {}); else copy(); });
  }
  var LINK = 'https://news.sliska.pl/gry';

  /* ================= HUB ================= */
  function hub(el) {
    var d = load(), recs = GAMES.filter(function (g) { return best(g.id); }).length;
    var sl = slizgleState(), kz = lsGet('sn-krzyz-done-' + weekIndex());
    var tile = function (g) {
      var b = best(g.id);
      return '<a class="gh-tile' + (g.secret ? ' is-secret' : '') + (g.off ? ' is-off' : '') + '" href="#/gry/' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '">' +
        '<span class="gh-tile-k">' + K(g.knaga) + '</span><span class="gh-tag">' + g.tag + '</span><b>' + g.name + '</b><small>' + g.sub + '</small>' +
        '<em>' + (g.off ? 'Wkrótce wróci' : g.kind === 'story' ? ((d.endings || []).length + '/30 zakończeń') : g.kind === 'sim' && !b ? ((d.nacEnds || []).length + '/12 zakończeń') : b ? ICO.cup + ' ' + fmt(g.id, b) : 'Zagraj pierwszy raz') + '</em></a>';
    };
    var feat = function (g, title, meta, cta) {
      return '<a class="gh-feat" href="#/gry/' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '"><span class="gh-feat-t"><span class="gh-tag">' + title + '</span><b>' + g.name + '</b><small>' + meta + '</small><span class="gh-cta">' + cta + ' →</span></span><span class="gh-feat-k">' + K(g.knaga) + '</span></a>';
    };
    el.innerHTML = '<div class="gh">' +
      '<header class="gh-hero"><div class="gh-hero-t"><span class="gry-eyebrow">Śliska strefa</span><h1>Śliskie Gry</h1><p>Codzienne słowo, krzyżówka tygodnia, zręcznościówki i afery do rozegrania. Zalogowani zbierają XP, a rekordy zapisują się na koncie.</p>' +
      '<div class="gh-stats"><span><b>' + (d.played || 0) + '</b> rozegranych</span><span><b>' + recs + '</b> rekordów</span><a href="#/sezon">' + ICO.cup + ' Ranking sezonu</a></div></div>' +
      '<button type="button" class="gh-hero-k" id="gry-hero-k" aria-label="Knaga">' + K('imprezowa', 'gk') + '</button></header>' +
      '<div class="gh-feats">' +
      feat(G('slizgle'), 'Słowo dnia #' + (dayIndex() + 1), sl && sl.end ? (sl.win ? 'Dziś zgadnięte w ' + sl.rows.length + '/6 ✓' : 'Dziś bez trafienia – jutro nowe słowo') : 'Nowe słowo czeka. 6 prób.', sl && sl.end ? 'Zobacz wynik' : 'Zgaduj') +
      feat(G('krzyzowka'), 'Tydzień #' + weekIndex(), kz ? 'Rozwiązana ✓ – nowa w poniedziałek' : 'Hasło tygodnia czeka na odkrycie.', kz ? 'Zobacz' : 'Rozwiąż') + '</div>' +
      '<h2 class="gh-h">Zręcznościowe</h2><div class="gh-grid">' + ['krople', 'flappy', 'waz', 'slizgawka', 'kregle', 'pojedynek', 'ratunek', 'karny'].map(function (id) { return tile(G(id)); }).join('') + '</div>' +
      '<h2 class="gh-h">Na spokojnie</h2><div class="gh-grid">' + ['drama', 'ukladanka'].map(function (id) { return tile(G(id)); }).join('') + '</div>' +
      '<div id="gh-meta"></div>' +
      '<nav class="gh-more" aria-label="Śliska strefa"><a href="#/sezon">' + ICO.cup + '<span><b>Ranking sezonu</b><small>Kto zebrał najwięcej XP w tym miesiącu</small></span></a><a href="#/dramy">' + ICO.fire + '<span><b>Osie czasu dram</b><small>Afery krok po kroku</small></span></a></nav></div>';
    metaBox(); achSync();
    var clicks = 0, kb = $('#gry-hero-k', el);
    kb.addEventListener('click', function () {
      clicks++; kb.classList.remove('is-poke'); void kb.offsetWidth; kb.classList.add('is-poke');
    });
    accLoad().then(function (a) { if (a && $('.gh')) { var n = GAMES.filter(function (g) { return best(g.id); }).length; var s = el.querySelector('.gh-stats span:nth-child(2) b'); if (s) s.textContent = n; } });
  }

  /* ---------- ekran gry: nagłówek, plansza, panel boczny ---------- */
  function shell(el, g, inner, opt) {
    opt = opt || {};
    el.innerHTML = '<div class="gp" data-game="' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '">' +
      '<header class="gp-head"><a class="gp-back" href="#/gry" aria-label="Wszystkie gry">' + ICO.back + '</a><span class="gp-k">' + K(g.knaga) + '</span>' +
      '<div class="gp-t"><span class="gp-tag">' + (opt.tag || g.tag) + '</span><h1>' + g.name + '</h1></div>' +
      '<div class="gp-chips"><span class="gp-chip"><small>Twój rekord</small><b id="gry-best">' + fmt(g.id, best(g.id)) + '</b></span>' + (opt.noTop ? '' : '<span class="gp-chip"><small>Rekord Śliskiej</small><b id="gry-top1">–</b></span>') + '</div></header>' +
      '<div class="gp-main"><div class="gp-play">' + inner + '</div><aside class="gp-side">' + (opt.side || '') +
      '<section class="gp-box"><h3>Jak grać</h3><p>' + g.how + '</p></section>' +
      (opt.noTop ? '' : '<section class="gp-box"><h3>' + ICO.cup + ' Najlepsi gracze</h3><ol class="gp-top" id="gp-top"><li class="gp-empty">Ładowanie…</li></ol>' + (logged() ? '' : '<p class="gp-note">Zaloguj się, żeby rekord zapisał się na koncie i trafił na tę listę.</p>') + '</section>') +
      '</aside></div></div>';
    if (!opt.noTop) loadTop(g.id);
    accLoad().then(function () { var b = $('#gry-best'); if (b) b.textContent = fmt(g.id, best(g.id)); });
  }

  /* ============== ŚLIZGLE ============== */
  /* Słowo dnia zna wyłącznie serwer: strona wysyła próbę (POST /gry/slizgle), a w odpowiedzi dostaje kolory pól.
     Trening działa lokalnie na własnej liście słów i nie wpływa na statystyki ani XP. */
  var TRAIN_WORDS = ['AFERA', 'ZDRADA', 'WTOPA', 'SKANDAL', 'POZEW', 'HEJTER', 'ROMANS', 'PLOTKA', 'OBCIACH', 'FLIRT', 'PRZYPAŁ', 'ŚCIEMA', 'DRAMA', 'WYCIEK', 'NAGONKA', 'KŁAMCA', 'PLAGIAT', 'BLOKADA', 'ZAWIŚĆ', 'TOKSYK', 'KŁÓTNIA', 'BURDA', 'OSZUST', 'IMPREZA', 'RANDKA', 'GOLAS', 'WSTYD', 'PODRÓBA', 'ARESZT', 'MANDAT', 'HEJT', 'FEJK', 'DISS', 'BEEF', 'LANS', 'SPINA', 'BYŁA', 'BÓJKA', 'ŚLISKO', 'MOKRO'];
  var KB = ['QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫', 'ĄĆĘŁŃÓŚŹŻ'];
  var slizgleKey = function () { return 'sn-slizgle-' + dayIndex(); };
  var slizgleState = function () { return lsGet(slizgleKey()); };
  var randomTrainWord = function (not) { var w; do { w = TRAIN_WORDS[Math.floor(Math.random() * TRAIN_WORDS.length)]; } while (w === not); return w; };

  function slizgleCall(body) {
    var json = JSON.stringify(body);
    if (logged() && window.actorApi) return actorApi('/gry/slizgle', { method: 'POST', body: json });
    return fetch(API + '/gry/slizgle', { method: 'POST', headers: { 'content-type': 'application/json' }, body: json })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok) { var e = new Error(d.error || 'http'); e.status = r.status; throw e; } return d; }); });
  }
  function slizgle(el) {
    shell(el, G('slizgle'), '<div class="sz"><p class="sz-load">Ładowanie słowa dnia…</p></div>', { tag: 'Słowo dnia #' + (dayIndex() + 1), side: '<section class="gp-box" id="sz-stats-box"></section>' + achBox('slizgle') });
    cfg().then(function (c) {
      if (!$('.gp[data-game="slizgle"]')) return;
      var sl = (c && c.slizgle) || {}, len = sl.len || (sl.word || '').length;
      if (len) slizgleRun(el, len); else $('.sz').innerHTML = '<p class="sz-load">Słowo dnia chwilowo niedostępne. Odśwież stronę za chwilę.</p>';
    });
  }
  function slizgleRun(el, len, trainWord) {
    if (slizgleRun.off) slizgleRun.off();
    var train = !!trainWord, L = len, flipRow = -1, busy = false, cur = '';
    var st = train ? null : slizgleState();
    if (!st || st.len !== L) st = { len: L, rows: [], pat: [], end: false, win: false, hint: false, tok: '', ans: '' };
    var doneFlag = train ? null : lsGet('sn-slizgle-done-' + dayIndex());
    if (doneFlag && !st.end) { st.end = true; st.win = !!doneFlag.win; st.ans = doneFlag.ans || st.ans; }
    var stats = lsGet('sn-slizgle-stats') || { played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], last: -9 };
    $('.sz').innerHTML = '<div class="sz-tabs" role="tablist"><button type="button" role="tab" data-m="day" class="' + (train ? '' : 'is-on') + '" aria-selected="' + !train + '">Słowo dnia</button><button type="button" role="tab" data-m="train" class="' + (train ? 'is-on' : '') + '" aria-selected="' + train + '">Trening</button></div><div class="sz-board" id="sz-board" style="--n:' + L + '"></div><p class="sz-msg" id="sz-msg" aria-live="polite"></p><div class="sz-kb" id="sz-kb"></div><button type="button" class="btn btn-ghost btn-sm sz-hint" id="sz-hint">💡 Podpowiedź</button>';
    var msg = function (t) { $('#sz-msg').textContent = t; };
    function trainScore(w) {
      var res = Array(L).fill('no'), a = trainWord.split(''), used = Array(L).fill(false);
      w.split('').forEach(function (c, i) { if (c === a[i]) { res[i] = 'ok'; used[i] = true; } });
      w.split('').forEach(function (c, i) { if (res[i] === 'ok') return; var j = a.findIndex(function (x, k) { return x === c && !used[k]; }); if (j >= 0) { res[i] = 'in'; used[j] = true; } });
      return res;
    }
    var pattern = function (i) { return train ? trainScore(st.rows[i]) : st.pat[i]; };
    function statsHtml() {
      var mx = Math.max.apply(null, stats.dist.concat([1]));
      return '<h3>Twoje Ślizgle</h3><div class="sz-st"><span><b>' + stats.played + '</b>gier</span><span><b>' + (stats.played ? Math.round(stats.wins / stats.played * 100) : 0) + '%</b>wygranych</span><span><b>' + stats.streak + '</b>seria</span><span><b>' + stats.max + '</b>najdłuższa</span></div>' +
        '<div class="sz-dist">' + stats.dist.map(function (n, i) { return '<div><span>' + (i + 1) + '</span><i style="width:' + Math.max(8, n / mx * 100) + '%"' + (st.win && st.rows.length === i + 1 ? ' class="is-now"' : '') + '>' + n + '</i></div>'; }).join('') + '</div>';
    }
    function draw() {
      var rows = '';
      for (var r = 0; r < 6; r++) {
        var w = st.rows[r] || (r === st.rows.length && !st.end ? cur : ''), sc = st.rows[r] ? pattern(r) : null, act = r === st.rows.length && !st.end, cells = '';
        for (var i = 0; i < L; i++) cells += '<span class="sz-c' + (sc ? ' sz-' + sc[i] + (flipRow === r ? ' is-flip' : '') : w[i] ? ' sz-f' : '') + '"' + (sc && flipRow === r ? ' style="animation-delay:' + i * 120 + 'ms"' : '') + '>' + (w[i] || '') + '</span>';
        rows += '<div class="sz-row' + (act ? ' is-act' : '') + '">' + cells + '</div>';
      }
      $('#sz-board').innerHTML = rows;
      var keys = {};
      st.rows.forEach(function (w, ri) { pattern(ri).forEach(function (s, i) { var c = w[i], o = keys[c]; keys[c] = o === 'ok' || s === 'ok' ? 'ok' : o === 'in' || s === 'in' ? 'in' : 'no'; }); });
      $('#sz-kb').innerHTML = KB.map(function (row) { return '<div class="sz-kr">' + row.split('').map(function (c) { var wide = c === '⏎' || c === '⌫'; return '<button type="button" class="sz-key' + (wide ? ' is-wide' : '') + (keys[c] ? ' sz-' + keys[c] : '') + '" data-k="' + c + '" aria-label="' + (c === '⏎' ? 'Zatwierdź' : c === '⌫' ? 'Usuń' : c) + '">' + (c === '⏎' ? 'OK' : c) + '</button>'; }).join('') + '</div>'; }).join('');
      $('#sz-stats-box').innerHTML = train ? '<h3>Trening</h3><p>Ćwicz bez limitu na losowych słowach. Wyniki z treningu nie liczą się do statystyk, serii ani XP.</p>' : statsHtml();
      if (!st.end) return;
      var answer = train ? trainWord : st.ans, face = K(st.win ? 'imprezowa' : 'ratownik', 'gk');
      if (train) {
        $('#sz-msg').innerHTML = '<div class="sz-end' + (st.win ? ' is-win' : '') + '">' + face + '<div><b>' + (st.win ? 'Trafione!' : 'Tym razem sucho') + '</b><span>' + (st.win ? 'Zgadłeś w ' + st.rows.length + '/6.' : 'To było: ' + answer + '.') + '</span></div><button type="button" class="btn btn-primary btn-sm" id="sz-next">Następne słowo</button></div>';
        $('#sz-next').onclick = function () { var w = randomTrainWord(trainWord); slizgleRun(el, w.length, w); };
        return;
      }
      var shareTxt = 'Ślizgle #' + (dayIndex() + 1) + ' ' + (st.win ? st.rows.length : 'X') + '/6' + (st.hint ? ' 💡' : '') + '\n' + st.rows.map(function (_, i) { return pattern(i).map(function (s) { return s === 'ok' ? '🟩' : s === 'in' ? '🟨' : '⬛'; }).join(''); }).join('\n') + '\n' + LINK + '/slizgle';
      $('#sz-msg').innerHTML = '<div class="sz-end' + (st.win ? ' is-win' : '') + '">' + face + '<div><b>' + (st.win ? ['Geniusz!', 'Mokro!', 'Świetnie!', 'Nieźle!', 'Uff!', 'Na styk!'][st.rows.length - 1] : 'Tym razem sucho') + '</b><span>' + (st.win ? 'Zgadłeś w ' + st.rows.length + '/6.' : 'Słowo dnia: ' + answer + '.') + ' Nowe słowo o północy.</span></div><button type="button" class="btn btn-primary btn-sm" id="sz-share">Udostępnij wynik</button></div>';
      $('#sz-share').onclick = function () { share(shareTxt, { knaga: st.win ? 'imprezowa' : 'ratownik', c: G('slizgle').c, eyebrow: 'Ślizgle #' + (dayIndex() + 1), title: st.win ? 'Zgadnięte w ' + st.rows.length + '/6' : 'Tym razem sucho', rows: st.rows.map(function (_, i) { return pattern(i); }), lines: st.hint ? ['z podpowiedzią 💡'] : [] }); };
    }
    /* koniec rundy: statystyki lokalne; rekord i XP przyznał już serwer w odpowiedzi na ostatnią próbę */
    function endRound(win, reply) {
      st.end = true; st.win = win;
      if (train) return;
      var di = dayIndex();
      stats.played++;
      if (win) { stats.wins++; stats.dist[st.rows.length - 1]++; stats.streak = stats.last === di - 1 ? stats.streak + 1 : 1; stats.max = Math.max(stats.max, stats.streak); } else stats.streak = 0;
      stats.last = win ? di : -9; lsSet('sn-slizgle-stats', stats); lsSet('sn-slizgle-done-' + di, { win: win, ans: win ? st.rows[st.rows.length - 1] : st.ans });
      if (win && st.rows.length === 1) stats.first = (stats.first || 0) + 1; lsSet('sn-slizgle-stats', stats);
      achEval('slizgle', { win: win, tries: st.rows.length, streak: stats.streak, wins: stats.wins, played: stats.played, first: stats.first || 0 });
      if (win) submit('slizgle', 7 - st.rows.length, false, true); else { var d = load(); d.played = (d.played || 0) + 1; save(d); }
      if (reply && reply.xp && reply.xp.got && window.SnXP) SnXP.gained(reply.xp);
      played('slizgle'); setTimeout(zone, 0);
    }
    function shake() { var a = $('.sz-row.is-act'); if (a) { a.classList.remove('is-shake'); void a.offsetWidth; a.classList.add('is-shake'); } }
    function accept(word, reply, win, over) {
      st.rows.push(word); flipRow = st.rows.length - 1; cur = '';
      if (!train) { st.pat.push(reply.res); st.tok = reply.st; if (reply.answer) st.ans = reply.answer; }
      if (over) endRound(win, reply);
      msg(''); if (!train) lsSet(slizgleKey(), st);
      draw(); flipRow = -1;
    }
    function submitRow() {
      if (cur.length < L) { msg('Słowo ma ' + L + ' liter.'); shake(); return; }
      if (train) { var win = cur === trainWord; accept(cur, null, win, win || st.rows.length >= 5); return; }
      if (busy) return; busy = true; var word = cur;
      slizgleCall({ guess: word, st: st.tok }).then(function (d) { accept(word, d, d.win, d.over); })
        .catch(function (e) { if (e.message === 'played') { st.end = true; st.win = false; draw(); msg('Dzisiejsze Ślizgle masz już za sobą – wróć jutro po nowe słowo.'); return; } msg(e.status === 404 || e.message === 'gone' ? 'Serwer jest w trakcie aktualizacji. Spróbuj za chwilę.' : e.message === 'rate' ? 'Za dużo prób. Poczekaj chwilę.' : 'Nie udało się sprawdzić słowa. Spróbuj ponownie.'); shake(); })
        .then(function () { busy = false; });
    }
    function press(k) {
      if (st.end || busy) return;
      if (k === '⌫' || k === 'Backspace') cur = cur.slice(0, -1);
      else if (k === '⏎' || k === 'Enter') { submitRow(); return; }
      else if (/^[A-ZĄĆĘŁŃÓŚŹŻ]$/i.test(k) && cur.length < L) cur += k.toUpperCase();
      draw();
    }
    $('#sz-kb').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    var onKey = function (e) { if (e.metaKey || ((e.ctrlKey || e.altKey) && !/^[ąćęłńóśźż]$/i.test(e.key)) || /input|textarea/i.test((e.target || {}).tagName)) return; if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-ząćęłńóśźż]$/i.test(e.key)) { e.preventDefault(); press(e.key); } };
    document.addEventListener('keydown', onKey);
    slizgleRun.off = function () { document.removeEventListener('keydown', onKey); slizgleRun.off = null; };
    stopFns.push(function () { if (slizgleRun.off) slizgleRun.off(); });
    $('.sz-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]'); if (!b) return;
      if (b.dataset.m === 'train') { var w = randomTrainWord(); slizgleRun(el, w.length, w); } else slizgleRun(el, len);
    });
    $('#sz-hint').addEventListener('click', function () {
      if (st.end || busy) return;
      if (train) {
        var known = {}, left = []; st.rows.forEach(function (w) { for (var i = 0; i < L; i++) if (w[i] === trainWord[i]) known[i] = 1; });
        for (var i = 0; i < L; i++) if (!known[i]) left.push(i);
        if (left.length) { var idx = left[Math.floor(Math.random() * left.length)]; msg('Podpowiedź: litera ' + (idx + 1) + ' to „' + trainWord[idx] + '”.'); }
        return;
      }
      if (st.hint) { msg('Podpowiedź na dziś już wykorzystana.'); return; }
      busy = true;
      slizgleCall({ hint: true, st: st.tok }).then(function (d) { st.hint = true; st.tok = d.st; lsSet(slizgleKey(), st); msg('Podpowiedź: litera ' + (d.pos + 1) + ' to „' + d.ch + '”.'); })
        .catch(function () { msg('Podpowiedź chwilowo niedostępna.'); })
        .then(function () { busy = false; });
    });
    draw();
  }


  /* ---------- osiągnięcia gier zręcznościowych (Łap Krople, Super Knaga, Śliski Wąż) ---------- */
  var AICO = {
    drop: '<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z"/>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.5 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>', shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>', heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.4A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    flame: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.3 1.2-3.7 2.3-4.7.3 1.6 1 2.6 2 3.1C11 8.6 11.3 5.6 12 3z"/>', clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/>', rule: '<path d="M3 9h18v6H3zM7 9v3M11 9v2M15 9v3M19 9v2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/>', wing: '<path d="M3 15c4 0 6-2 8-6 1 3 3 4 6 4-1 3-4 6-9 6-3 0-5-1-5-4z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'
  };
  var aIcon = function (k, n) { return '<svg viewBox="0 0 24 24" width="' + (n || 18) + '" height="' + (n || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (AICO[k] || AICO.star) + '</svg>'; };
  // [id, nazwa, opis, ikona, test(statystyki)] – statystyki: s.score, s.t (s) oraz liczniki z api.ev() i maksima z api.mx()
  var ACHS = {
    krople: [
      ['k_drop', 'Pierwszy łyk', 'Złap pierwszą kroplę', 'drop', function (s) { return s.drop >= 1; }],
      ['k_gold', 'Złoty strzał', 'Złap Mocz (złotą kroplę)', 'star', function (s) { return s.gold >= 1; }],
      ['k_life', 'Dodatkowe życie', 'Złap serduszko', 'heart', function (s) { return s.life >= 1; }],
      ['k_c10', 'Kombinator', 'Złap 10 kropli z rzędu', 'bolt', function (s) { return s.combo >= 10; }],
      ['k_c25', 'Mega combo', 'Złap 25 kropli z rzędu', 'flame', function (s) { return s.combo >= 25; }],
      ['k_umb', 'Dobrze zabezpieczony', 'Gumka uratuje Cię przed pozwem', 'shield', function (s) { return s.shieldsave >= 1; }],
      ['k_set', 'Zestaw bonusów', 'Złap magnes, gumkę i saunę w jednej grze', 'star', function (s) { return s.pw_mag >= 1 && s.pw_shield >= 1 && s.pw_slow >= 1; }],
      ['k_dry', 'Bez pozwu', '40 punktów bez utraty życia', 'check', function (s) { return s.score >= 40 && !(s.lost > 0); }],
      ['k_100', 'Wanna po brzegi', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['k_200', 'Potop', 'Zdobądź 200 punktów', 'trophy', function (s) { return s.score >= 200; }],
      ['k_300', 'Potop stulecia', 'Zdobądź 300 punktów', 'trophy', function (s) { return s.score >= 300; }],
      ['k_g3', 'Złoty deszcz', 'Złap 3 złote krople w jednej grze', 'star', function (s) { return s.gold >= 3; }],
      ['k_c50', 'Niezatapialny', 'Złap 50 kropli z rzędu', 'flame', function (s) { return s.combo >= 50; }, true],
      ['k_500', 'Arka Noego', 'Zdobądź 500 punktów', 'trophy', function (s) { return s.score >= 500; }, true],
      ['k_life3', 'Serce na dłoni', 'Złap 3 serduszka w jednej grze', 'heart', function (s) { return s.life >= 3; }, true]
    ],
    flappy: [
      ['f_1', 'Pierwszy lot', 'Przeleć przez pierwszy statyw', 'wing', function (s) { return s.score >= 1; }],
      ['f_10', 'Dziesiątka', 'Zdobądź 10 punktów', 'star', function (s) { return s.score >= 10; }],
      ['f_15', 'Nowa scena', 'Dolec do drugiej sceny (15 pkt)', 'bolt', function (s) { return s.score >= 15; }],
      ['f_30', 'Super Knaga', 'Zdobądź 30 punktów', 'trophy', function (s) { return s.score >= 30; }],
      ['f_50', 'Legenda sceny', 'Zdobądź 50 punktów', 'trophy', function (s) { return s.score >= 50; }],
      ['f_sh', 'Zabezpieczony', 'Złap złotą gumkę', 'shield', function (s) { return s.shield >= 1; }],
      ['f_save', 'Twardziel', 'Gumka pęka za Ciebie przy uderzeniu', 'check', function (s) { return s.shieldsave >= 1; }],
      ['f_drop', 'Zbieracz kropli', 'Złap 5 kropli w jednym locie', 'drop', function (s) { return s.drop >= 5; }],
      ['f_t', 'Maraton', 'Leć 90 sekund bez uderzenia', 'clock', function (s) { return s.t >= 90; }],
      ['f_75', 'Ponad chmurami', 'Zdobądź 75 punktów', 'trophy', function (s) { return s.score >= 75; }],
      ['f_d12', 'Kropla w kropli', 'Złap 12 kropli w jednym locie', 'drop', function (s) { return s.drop >= 12; }],
      ['f_t180', 'Wytrzymały', 'Leć 180 sekund bez uderzenia', 'clock', function (s) { return s.t >= 180; }],
      ['f_100', 'Setka nad sceną', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }, true],
      ['f_sh3', 'Kolekcjoner gumek', 'Złap 3 gumki w jednym locie', 'shield', function (s) { return s.shield >= 3; }, true]
    ],
    slizgawka: [
      ['s_100', 'Pierwsze fale', 'Przepłyń 100 m', 'wing', function (s) { return s.dist >= 100; }],
      ['s_drop', 'Zbieracz kropli', 'Złap 10 kropli w jednym przejeździe', 'drop', function (s) { return s.drop >= 10; }],
      ['s_ramp', 'Na fali', 'Wjedź na falę-rampę', 'wing', function (s) { return s.ramp >= 1; }],
      ['s_trick', 'Pierwsze salto', 'Zrób salto w powietrzu', 'bolt', function (s) { return s.trick >= 1; }],
      ['s_dtrick', 'Podwójne salto', 'Zrób podwójne salto', 'flame', function (s) { return s.dtrick >= 1; }],
      ['s_duck', 'Pod dronem', 'Prześlizgnij się pod dronem z pozwem', 'check', function (s) { return s.duck >= 1; }],
      ['s_dive', 'Nurek', 'Nurkuj w powietrzu', 'drop', function (s) { return s.dive >= 1; }],
      ['s_save', 'Gumka ratuje', 'Gumka przyjmie za Ciebie uderzenie', 'shield', function (s) { return s.shieldsave >= 1; }],
      ['s_night', 'Nocna zmiana', 'Dopłyń do nocy (400 m)', 'star', function (s) { return s.dist >= 400; }],
      ['s_800', 'Neonowa fala', 'Dopłyń do neonu (800 m)', 'star', function (s) { return s.dist >= 800; }],
      ['s_1500', 'Legenda fali', 'Przepłyń 1500 m', 'trophy', function (s) { return s.dist >= 1500; }],
      ['s_r5', 'Skoczek', 'Wjedź na 5 fal-ramp w jednym przejeździe', 'wing', function (s) { return s.ramp >= 5; }],
      ['s_t3', 'Akrobata', 'Zrób 3 podwójne salta w jednym przejeździe', 'flame', function (s) { return s.dtrick >= 3; }],
      ['s_d5', 'Ninja pod dronami', 'Prześlizgnij się pod 5 dronami', 'check', function (s) { return s.duck >= 5; }],
      ['s_2500', 'Poza skalą', 'Przepłyń 2500 m', 'trophy', function (s) { return s.dist >= 2500; }],
      ['s_4000', 'Koniec mapy', 'Przepłyń 4000 m', 'trophy', function (s) { return s.dist >= 4000; }, true],
      ['s_t10', 'Cyrkowiec', 'Zrób 10 salt w jednym przejeździe', 'bolt', function (s) { return s.trick >= 10; }, true]
    ],
    pojedynek: [
      ['p_1', 'Pierwsza krew', 'Wygraj pierwszy pojedynek', 'star', function (s) { return s.win >= 1; }],
      ['p_early', 'Nerwowy palec', 'Strzel za wcześnie', 'check', function (s) { return s.early >= 1; }],
      ['p_fast', 'Błyskawica', 'Strzel w mniej niż 200 ms', 'bolt', function (s) { return s.fast >= 1; }],
      ['p_s5', 'Seria 5', 'Wygraj 5 pojedynków z rzędu', 'flame', function (s) { return s.streak >= 5; }],
      ['p_l8', 'Poziom 8', 'Dotrzyj do 8. rywala', 'shield', function (s) { return s.level >= 8; }],
      ['p_100', 'Setka', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['p_250', 'Legenda Zachodu', 'Zdobądź 250 punktów', 'trophy', function (s) { return s.score >= 250; }],
      ['p_w10', 'Weteran', 'Wygraj 10 pojedynków w jednej grze', 'star', function (s) { return s.win >= 10; }],
      ['p_s10', 'Seria 10', 'Wygraj 10 pojedynków z rzędu', 'flame', function (s) { return s.streak >= 10; }],
      ['p_400', 'Rewolwerowiec', 'Zdobądź 400 punktów', 'trophy', function (s) { return s.score >= 400; }],
      ['p_600', 'Duch Dzikiego Zachodu', 'Zdobądź 600 punktów', 'trophy', function (s) { return s.score >= 600; }, true],
      ['p_f3', 'Szybszy od cienia', 'Strzel w mniej niż 200 ms trzy razy w jednej grze', 'bolt', function (s) { return s.fast >= 3; }, true]
    ],
    ratunek: [
      ['r_1', 'Pierwszy ratunek', 'Złap pierwszą Knagę', 'star', function (s) { return s.catch >= 1; }],
      ['r_j', 'Meduza!', 'Złap meduzę (nie rób tego)', 'drop', function (s) { return s.jelly >= 1; }],
      ['r_c10', 'Seria 10', 'Złap 10 Knag z rzędu', 'bolt', function (s) { return s.combo >= 10; }],
      ['r_c25', 'Seria 25', 'Złap 25 Knag z rzędu', 'flame', function (s) { return s.combo >= 25; }],
      ['r_100', 'Ratownik roku', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['r_200', 'Bohater plaży', 'Zdobądź 200 punktów', 'trophy', function (s) { return s.score >= 200; }],
      ['r_300', 'Legenda plaży', 'Zdobądź 300 punktów', 'trophy', function (s) { return s.score >= 300; }],
      ['r_c50', 'Seria 50', 'Złap 50 Knag z rzędu', 'flame', function (s) { return s.combo >= 50; }],
      ['r_k50', 'Pół setki uratowanych', 'Uratuj 50 Knag w jednej grze', 'star', function (s) { return s.catch >= 50; }],
      ['r_500', 'Aqua Gwardia', 'Zdobądź 500 punktów', 'trophy', function (s) { return s.score >= 500; }, true],
      ['r_j3', 'Fan meduz', 'Złap 3 meduzy w jednej grze', 'drop', function (s) { return s.jelly >= 3; }, true]
    ],
    karny: [
      ['k_1', 'Pierwszy gol', 'Strzel pierwszą bramkę', 'star', function (s) { return s.goal >= 1; }],
      ['k_save', 'Obroniony', 'Daj się obronić bramkarzowi', 'check', function (s) { return s.save >= 1; }],
      ['k_post', 'Słupek', 'Trafij w słupek', 'drop', function (s) { return s.post >= 1; }],
      ['k_corner', 'Okienko', 'Strzel gola w górny róg', 'bolt', function (s) { return s.corner >= 1; }],
      ['k_s5', 'Seria 5', 'Strzel 5 goli z rzędu', 'flame', function (s) { return s.streak >= 5; }],
      ['k_100', 'Setka', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['k_250', 'Król jedenastek', 'Zdobądź 250 punktów', 'trophy', function (s) { return s.score >= 250; }],
      ['k_g10', 'Dziesiątka goli', 'Strzel 10 goli w jednej grze', 'star', function (s) { return s.goal >= 10; }],
      ['k_s10', 'Seria 10', 'Strzel 10 goli z rzędu', 'flame', function (s) { return s.streak >= 10; }],
      ['k_c3', 'Snajper', 'Strzel 3 gole w górny róg w jednej grze', 'bolt', function (s) { return s.corner >= 3; }],
      ['k_500', 'Złoty But', 'Zdobądź 500 punktów', 'trophy', function (s) { return s.score >= 500; }, true],
      ['k_p3', 'Pech', 'Trafij w słupek 3 razy w jednej grze', 'drop', function (s) { return s.post >= 3; }, true],
      ['k_sv5', 'Bramkarz w formie', 'Daj się obronić 5 razy w jednej grze', 'check', function (s) { return s.save >= 5; }, true]
    ],
    kregle: [
      ['g_1', 'Pierwszy rzut', 'Zbij pierwszy kręgiel', 'star', function (s) { return s.pins >= 1; }],
      ['g_spare', 'Spare', 'Zbij wszystkie kręgle w dwóch rzutach', 'check', function (s) { return s.spare >= 1; }],
      ['g_strike', 'Strike!', 'Zbij wszystkie kręgle jednym rzutem', 'bolt', function (s) { return s.strike >= 1; }],
      ['g_hook', 'Zakręcony strike', 'Strike z mocnym efektem', 'flame', function (s) { return s.hookstrike >= 1; }],
      ['g_turkey', 'Indyk', 'Trzy strike\'i z rzędu', 'trophy', function (s) { return s.turkey >= 3; }],
      ['g_gut', 'Rynna', 'Wrzuć kulę do rynny (nie szkodzi)', 'drop', function (s) { return s.gutter >= 1; }],
      ['g_100', 'Setka', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['g_150', 'Dobry wynik', 'Zdobądź 150 punktów', 'trophy', function (s) { return s.score >= 150; }],
      ['g_200', 'Mistrz toru', 'Zdobądź 200 punktów', 'trophy', function (s) { return s.score >= 200; }],
      ['g_230', 'Perfekcyjny', 'Zdobądź 230 punktów', 'trophy', function (s) { return s.score >= 230; }],
      ['g_sp3', 'Mistrz spare\'ów', 'Zrób 3 spare\'y w jednej grze', 'check', function (s) { return s.spare >= 3; }],
      ['g_st5', 'Pięć strike\'ów', 'Zrób 5 strike\'ów w jednej grze', 'bolt', function (s) { return s.strike >= 5; }],
      ['g_gut3', 'Król rynny', 'Wrzuć kulę do rynny 3 razy w jednej grze', 'drop', function (s) { return s.gutter >= 3; }, true],
      ['g_t6', 'Szóstka z rzędu', 'Zrób 6 strike\'ów z rzędu', 'flame', function (s) { return s.turkey >= 6; }, true]
    ],
    waz: [
      ['w_mic', 'Pierwszy mikrofon', 'Zjedz pierwszy mikrofon', 'mic', function (s) { return s.mic >= 1; }],
      ['w_gold', 'Złoty mikrofon', 'Zjedz złoty mikrofon', 'star', function (s) { return s.gold >= 1; }],
      ['w_slow', 'Zegarek', 'Zbierz zegar zwalniający czas', 'clock', function (s) { return s.slow >= 1; }],
      ['w_c4', 'Combo ×4', 'Zjedz mikrofony szybko pod rząd (×4)', 'bolt', function (s) { return s.combo >= 4; }],
      ['w_l10', 'Dłuższa Knaga', 'Dojdź do 20 cm', 'rule', function (s) { return s.len >= 10; }],
      ['w_l20', 'Naprawdę długa', 'Dojdź do 40 cm', 'rule', function (s) { return s.len >= 20; }],
      ['w_l35', 'Rekordzistka długości', 'Dojdź do 70 cm', 'trophy', function (s) { return s.len >= 35; }],
      ['w_obs', 'Pełna scena', 'Przeżyj, gdy na scenie stoi 5 kolumn', 'shield', function (s) { return s.obs >= 5; }],
      ['w_40', 'Lista featów', 'Zdobądź 40 punktów', 'flame', function (s) { return s.score >= 40; }],
      ['w_100', 'Setka', 'Zdobądź 100 punktów', 'trophy', function (s) { return s.score >= 100; }],
      ['w_g3', 'Złota rączka', 'Zjedz 3 złote mikrofony w jednej grze', 'star', function (s) { return s.gold >= 3; }],
      ['w_l50', 'Anakonda', 'Dojdź do 100 cm', 'rule', function (s) { return s.len >= 50; }],
      ['w_obs7', 'Labirynt', 'Przeżyj, gdy na scenie stoi 7 kolumn', 'shield', function (s) { return s.obs >= 7; }, true],
      ['w_t180', 'Wąż-maratończyk', 'Graj 180 sekund bez porażki', 'clock', function (s) { return s.t >= 180; }, true]
    ],
    meta: [
      ['m_3', 'Rozgrzewka', 'Zagraj w 3 różne gry', 'star', function (s) { return s.games >= 3; }],
      ['m_6', 'Zwiedzający', 'Zagraj w 6 różnych gier', 'star', function (s) { return s.games >= 6; }],
      ['m_all', 'Pełny zestaw', 'Zagraj we wszystkie gry z rekordem', 'trophy', function (s) { return s.games >= s.gamesAll; }],
      ['m_t1', 'Trzy gwiazdki', 'Zdobądź 3 gwiazdki w dowolnej grze', 'star', function (s) { return s.three >= 1; }],
      ['m_t5', 'Konstelacja', 'Zdobądź 3 gwiazdki w 5 grach', 'flame', function (s) { return s.three >= 5; }],
      ['m_a10', 'Kolekcjoner', 'Zdobądź 10 osiągnięć', 'trophy', function (s) { return s.total >= 10; }],
      ['m_a30', 'Kolekcjoner PRO', 'Zdobądź 30 osiągnięć', 'trophy', function (s) { return s.total >= 30; }],
      ['m_a60', 'Muzeum osiągnięć', 'Zdobądź 60 osiągnięć', 'trophy', function (s) { return s.total >= 60; }],
      ['m_p100', 'Setka partii', 'Rozegraj 100 gier', 'clock', function (s) { return s.played >= 100; }],
      ['m_h1', 'Tropiciel', 'Odkryj pierwsze ukryte osiągnięcie', 'lock', function (s) { return s.hid >= 1; }, true],
      ['m_h5', 'Łowca sekretów', 'Odkryj 5 ukrytych osiągnięć', 'lock', function (s) { return s.hid >= 5; }, true],
      ['m_night', 'Nocny marek', 'Zagraj w gry po drugiej w nocy', 'clock', function (s) { return s.night; }, true],
      ['m_tall', 'Pełne niebo', 'Zdobądź 3 gwiazdki we wszystkich grach zręcznościowych', 'trophy', function (s) { return s.three >= s.threeAll; }, true],
      ['m_p500', 'Uzależniony', 'Rozegraj 500 gier', 'flame', function (s) { return s.played >= 500; }, true]
    ],
    slizgle: [
      ['z_win', 'Pierwsza krew', 'Zgadnij słowo dnia', 'drop', function (s) { return s.win; }],
      ['z_3', 'Szybki ruch', 'Zgadnij w 3 próbach lub szybciej', 'bolt', function (s) { return s.win && s.tries <= 3; }],
      ['z_1', 'Jasnowidz', 'Zgadnij za pierwszym razem', 'star', function (s) { return s.win && s.tries === 1; }],
      ['z_6', 'Na styk', 'Wygraj w ostatniej, 6. próbie', 'shield', function (s) { return s.win && s.tries === 6; }],
      ['z_s3', 'Trzy dni z rzędu', 'Seria 3 wygranych dni', 'flame', function (s) { return s.streak >= 3; }],
      ['z_s7', 'Tydzień bez wpadki', 'Seria 7 wygranych dni', 'trophy', function (s) { return s.streak >= 7; }],
      ['z_w10', 'Słownik Śliskiej', 'Wygraj 10 razy', 'rule', function (s) { return s.wins >= 10; }],
      ['z_s14', 'Dwa tygodnie', 'Seria 14 wygranych dni', 'flame', function (s) { return s.streak >= 14; }],
      ['z_w25', 'Ćwierć setki', 'Wygraj 25 razy', 'rule', function (s) { return s.wins >= 25; }],
      ['z_p20', 'Stały bywalec', 'Zagraj 20 razy', 'clock', function (s) { return s.played >= 20; }],
      ['z_s30', 'Miesiąc słownikowca', 'Seria 30 wygranych dni', 'trophy', function (s) { return s.streak >= 30; }, true],
      ['z_w50', 'Pół setki', 'Wygraj 50 razy', 'trophy', function (s) { return s.wins >= 50; }, true],
      ['z_1h', 'Strzał w dziesiątkę', 'Zgadnij za pierwszym razem 2 razy', 'star', function (s) { return s.first >= 2; }, true]
    ],
    krzyzowka: [
      ['x_1', 'Pierwsze hasło', 'Rozwiąż krzyżówkę tygodnia', 'rule', function (s) { return s.solved >= 1; }],
      ['x_3', 'Cierpliwy detektyw', 'Rozwiąż 3 krzyżówki', 'clock', function (s) { return s.solved >= 3; }],
      ['x_10', 'Mistrz haseł', 'Rozwiąż 10 krzyżówek', 'trophy', function (s) { return s.solved >= 10; }],
      ['x_arch', 'Archeolog', 'Rozwiąż krzyżówkę z archiwum', 'star', function (s) { return s.arch >= 1; }],
      ['x_a5', 'Kolekcjoner archiwum', 'Rozwiąż 5 krzyżówek z archiwum', 'star', function (s) { return s.arch >= 5; }],
      ['x_25', 'Krzyżówkowy maniak', 'Rozwiąż 25 krzyżówek', 'trophy', function (s) { return s.solved >= 25; }, true],
      ['x_a15', 'Historyk Śliskiej', 'Rozwiąż 15 krzyżówek z archiwum', 'trophy', function (s) { return s.arch >= 15; }, true]
    ],
    ukladanka: [
      ['u_1', 'Pierwszy obrazek', 'Ułóż dowolną układankę', 'star', function (s) { return s.done; }],
      ['u_4', 'Czwórka', 'Ułóż układankę 4×4', 'rule', function (s) { return s.done && s.n >= 4; }],
      ['u_5', 'Pięć na pięć', 'Ułóż układankę 5×5', 'trophy', function (s) { return s.done && s.n >= 5; }],
      ['u_gold', 'Złoty medal', 'Ułóż w limicie ruchów na złoto', 'flame', function (s) { return s.done && s.gold; }],
      ['u_fast', 'Błyskawica', 'Ułóż w mniej niż 60 sekund', 'bolt', function (s) { return s.done && s.sec < 60; }],
      ['u_f30', 'Błysk', 'Ułóż układankę 4×4 lub większą w mniej niż 30 sekund', 'bolt', function (s) { return s.done && s.n >= 4 && s.sec < 30; }],
      ['u_f15', 'Człowiek-robot', 'Ułóż układankę 4×4 lub większą w mniej niż 15 sekund', 'bolt', function (s) { return s.done && s.n >= 4 && s.sec < 15; }, true],
      ['u_g5', 'Perfekcjonista', 'Ułóż układankę 5×5 na złoty medal', 'flame', function (s) { return s.done && s.n >= 5 && s.gold; }, true]
    ]
  };
  /* osiągnięcia zalogowanego gracza leżą na koncie (serwer); bez logowania – w przeglądarce. Przy pierwszym logowaniu lokalne przechodzą na konto. */
  var accAch = null, accAchUid = '';
  function achGot(gid) { if (logged() && accAch) return accAch[gid] || []; var d = load(); return ((d.ach || {})[gid]) || []; }
  function achAdd(gid, ids) {
    if (!ids.length) return;
    if (logged() && accAch) { accAch[gid] = (accAch[gid] || []).concat(ids.filter(function (i) { return (accAch[gid] || []).indexOf(i) < 0; })); try { actorApi('/gry/ach', { method: 'POST', body: JSON.stringify({ ids: ids.map(function (i) { return gid + ':' + i; }) }) }).catch(function () {}); } catch (e) { /* ignoruj */ } return; }
    var d = load(), got = (d.ach = d.ach || {}), arr = (got[gid] = got[gid] || []); ids.forEach(function (i) { if (arr.indexOf(i) < 0) arr.push(i); }); save(d);
  }
  function achSync() {
    if (!logged() || !window.actorApi) { accAch = null; accAchUid = ''; return Promise.resolve(); }
    var u = uid(); if (accAch && accAchUid === u) return Promise.resolve();
    return actorApi('/gry/ach').then(function (r) {
      var m = {}; ((r && r.ach) || []).forEach(function (k) { var p = k.split(':'); (m[p[0]] = m[p[0]] || []).push(p[1]); });
      var d = load(), loc = d.ach || {}, up = [];
      Object.keys(loc).forEach(function (g) { (loc[g] || []).forEach(function (i) { if (!ACHS[g] || (m[g] || []).indexOf(i) >= 0) return; (m[g] = m[g] || []).push(i); up.push(g + ':' + i); }); });
      accAch = m; accAchUid = u;
      if (up.length) { try { actorApi('/gry/ach', { method: 'POST', body: JSON.stringify({ ids: up.slice(0, 60) }) }).catch(function () {}); } catch (e) { /* ignoruj */ } }
      if (d.ach) { delete d.ach; save(d); }
      Object.keys(ACHS).forEach(function (g) { if ($('#gry-ach') && $('.gp[data-game="' + g + '"]')) achRefresh(g); });
      metaBox(); metaCheck();
    }).catch(function () {});
  }
  /* osiągnięcia ogólne (cały zestaw gier) */
  function metaStats() {
    var d = load(), s = { games: 0, gamesAll: GAMES.filter(function (g) { return !g.secret && !g.off && STARS[g.id]; }).length, three: 0, threeAll: Object.keys(STARS).length, total: 0, hid: 0, played: d.played || 0, night: false };
    GAMES.forEach(function (g) { if (STARS[g.id] && best(g.id) > 0) s.games++; });
    Object.keys(STARS).forEach(function (g) { var b = best(g); if (b && (g === 'ukladanka' ? false : b >= STARS[g][2])) s.three++; });
    Object.keys(ACHS).forEach(function (g) { if (g === 'meta') return; var got = achGot(g); got.forEach(function (id) { s.total++; var a = ACHS[g].filter(function (x) { return x[0] === id; })[0]; if (a && a[5]) s.hid++; }); });
    var h = new Date().getHours(); s.night = h >= 2 && h < 5;
    return s;
  }
  function metaCheck() {
    if (!ACHS.meta) return;
    var s = metaStats(), got = achGot('meta'), add = ACHS.meta.filter(function (a) { return got.indexOf(a[0]) < 0 && a[4](s); });
    if (!add.length) return;
    achAdd('meta', add.map(function (a) { return a[0]; }));
    add.forEach(function (a, i) { setTimeout(function () { toast('🏆 ' + a[1]); }, 1200 + i * 1800); });
    metaBox();
  }
  function metaBox() { var b = $('#gh-meta'); if (b) b.innerHTML = metaInner(); }
  function metaInner() { var all = 0, got = 0; Object.keys(ACHS).forEach(function (g) { all += ACHS[g].length; got += achGot(g).length; }); return '<h2 class="gh-h">Osiągnięcia <small>' + got + '/' + all + '</small></h2><div class="gp-box ach-box"><h3>Ogólne <small>' + achGot('meta').length + '/' + ACHS.meta.length + '</small></h3><ul class="gp-ach">' + achItems('meta') + '</ul></div>'; }
  function achItems(gid) {
    var got = achGot(gid);
    return ACHS[gid].map(function (a) { var on = got.indexOf(a[0]) >= 0, hid = a[5] && !on; return '<li class="' + (on ? 'is-on' : '') + (hid ? ' is-hidden' : '') + '"><span class="ach-i">' + aIcon(on ? a[3] : 'lock', 17) + '</span><div><b>' + (hid ? '???' : a[1]) + '</b><small>' + (hid ? 'Ukryte osiągnięcie – odkryj je grając' : a[2]) + '</small></div></li>'; }).join('');
  }
  function achBox(gid) {
    var got = achGot(gid).length;
    return '<section class="gp-box ach-box"><h3>Osiągnięcia <small id="gry-ach-c">' + got + '/' + ACHS[gid].length + '</small></h3><ul class="gp-ach" id="gry-ach">' + achItems(gid) + '</ul></section>';
  }
  /** Osiągnięcia dla gier bez silnika canvas (Ślizgle, Krzyżówka, Układanka): ocena po zakończeniu rundy. */
  function achEval(gid, s) {
    var list = ACHS[gid]; if (!list) return;
    var arr = achGot(gid), add = [];
    list.forEach(function (a) { if (arr.indexOf(a[0]) < 0 && a[4](s)) add.push(a); });
    if (!add.length) { metaCheck(); return; } achAdd(gid, add.map(function (a) { return a[0]; }));
    add.forEach(function (a, i) { setTimeout(function () { toast('🏆 ' + a[1]); }, 600 + i * 1800); }); achRefresh(gid); metaCheck();
  }
  function achRefresh(gid) { var u = $('#gry-ach'), c = $('#gry-ach-c'); if (u) u.innerHTML = achItems(gid); if (c) c.textContent = achGot(gid).length + '/' + ACHS[gid].length; }

  /* ============== wspólny silnik gier zręcznościowych (canvas) ============== */
  var STARS = { krople: [25, 130, 250], flappy: [6, 35, 60], waz: [8, 45, 80], slizgawka: [150, 1000, 2500], kregle: [90, 160, 230], pojedynek: [60, 200, 450], ratunek: [22, 80, 175], karny: [40, 130, 280] };
  var STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.2 6.1 20.4l1.2-6.5L2.5 9.3l6.6-.9z" stroke-linejoin="round" stroke-width="1.4"/></svg>';
  /* XP za ukończenie rośnie z wynikiem: 12 XP przy progu 3 gwiazdek, proporcjonalnie niżej/wyżej, 2–20 (to samo liczy serwer); gry bez progów – 5 */
  function gameXpFor(gid, sc) { var th = STARS[gid]; return th ? Math.max(2, Math.min(20, Math.round(12 * sc / th[2]))) : 5; }
  function starsHtml(gid, sc) { var th = STARS[gid]; if (!th) return ''; var n = th.filter(function (v) { return sc >= v; }).length; return '<div class="gm-stars" aria-label="' + n + ' z 3 gwiazdek">' + [0, 1, 2].map(function (i) { return '<span class="' + (i < n ? 'on' : '') + '" style="--d:' + (.25 + i * .22) + 's">' + STAR_SVG + '</span>'; }).join('') + '</div>'; }
  var imgCache = {};
  function knagaImg(slug) {
    if (imgCache[slug]) return imgCache[slug];
    var im = new Image(); var svg = K(slug).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" ');
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return (imgCache[slug] = im);
  }
  function canvasGame(el, g, opts) {
    shell(el, g, '<div class="gry-stage" style="' + (opts.ratio ? 'aspect-ratio:' + opts.ratio : '') + '"><canvas id="gry-cv" tabindex="0" aria-label="' + g.name + '"></canvas>' +
      '<div class="gry-hud"><span class="hud-p"><small>Wynik</small><b id="gry-score">0</b></span>' + (opts.lives ? '<span class="hud-p"><small>Życia</small><b id="gry-lives"></b></span>' : '') +
      '<button type="button" class="hud-btn" id="gry-pause" aria-label="Pauza">' + ICO.pause + '</button></div><div class="gry-over" id="gry-over"></div></div>', ACHS[g.id] ? { side: achBox(g.id) } : {});
    var cv = $('#gry-cv'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = 0, last = 0, running = false, paused = false, over = false, starting = false;
    function size() { var r = cv.parentNode.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!running && api.ready) { opts.draw(api); } }
    var fx = [], cd = 0, vg = null;
    var api = {
      shk: 0, get counting() { return cd > 0; }, shake: function (n) { if (!reduce) api.shk = Math.max(api.shk, n || 8); },
      ctx: ctx, get W() { return W; }, get H() { return H; }, score: 0, t: 0,
      stats: {}, newAch: [],
      ev: function (k, n) { api.stats[k] = (api.stats[k] || 0) + (n || 1); api.check(); },
      mx: function (k, v) { if (!(api.stats[k] >= v)) { api.stats[k] = v; api.check(); } },
      check: function () {
        var list = ACHS[g.id]; if (!list) return; var s = api.stats; s.score = api.score; s.t = api.t;
        var arr = achGot(g.id), add = [];
        list.forEach(function (a) { if (arr.indexOf(a[0]) < 0 && a[4](s)) add.push(a); });
        if (!add.length) return; achAdd(g.id, add.map(function (a) { return a[0]; }));
        add.forEach(function (a) { api.newAch.push(a); toast('🏆 ' + a[1]); }); achRefresh(g.id); metaCheck();
      },
      setScore: function (v) { api.score = v; $('#gry-score').textContent = v; var ms = Math.round(api.t * 1000); if (api.tl && (api.tl.length === 0 || ms - api._ls >= 400)) { api.tl.push([ms, v]); api._ls = ms; } api.check(); },
      setLives: function (n) { var l = $('#gry-lives'); if (l) l.textContent = n > 0 ? (opts.lifeIcon || '💧').repeat(n) : '—'; },
      burst: function (x, y, col, n) { if (reduce) return; for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, v = 60 + Math.random() * 160; fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .6, c: col, r: 2 + Math.random() * 3 }); } },
      pop: function (x, y, text, col) { fx.push({ x: x, y: y, vx: 0, vy: -50, life: .9, text: text, c: col || '#fff' }); },
      over: function () {
        if (over) return; over = true; running = false; cancelAnimationFrame(raf); api.check();
        var sc = api.score; if (api.tl) { api.tl.push([Math.round(api.t * 1000), sc]); TLS[g.id] = opts.replay ? undefined : api.tl; } var nb = sc > 0 && submit(g.id, sc, false, !!opts.replay && !RUNS[g.id]);
        played(g.id);
        var et = opts.endText ? opts.endText(sc) : ['', g.knaga];
        menu('<span class="gm-eye">Koniec gry</span><div class="gm-k">' + K(et[1] || g.knaga, 'gk') + '</div><p class="gm-end">' + et[0] + '</p>' + starsHtml(g.id, sc) + '<div class="gm-score">' + sc + '<small>' + (g.unit || '') + '</small></div>' +
          (nb ? '<span class="gry-new">Nowy rekord!</span>' : '<p class="gm-best">Twój rekord: <b>' + fmt(g.id, best(g.id)) + '</b></p>') +
          (api.newAch.length ? '<div class="gm-ach"><small>Nowe osiągnięcia</small>' + api.newAch.map(function (a) { return '<span>' + aIcon(a[3], 15) + a[1] + '</span>'; }).join('') + '</div>' : '') +
          (logged() ? (sc > 0 ? '<p class="gm-xp">+' + (gameXpFor(g.id, sc) + (nb ? 10 : 0)) + ' XP do sezonu</p>' : '') : '<p class="gm-note">Zaloguj się, żeby rekord zapisał się na koncie.</p>'),
        'Jeszcze raz', true);
        if (nb) loadTop(g.id);
      }
    };
    function menu(html, btn, withShare) {
      var o = $('#gry-over'); o.hidden = false;
      o.innerHTML = '<div class="gm">' + html + '<div class="gm-acts"><button type="button" class="btn btn-primary" id="gry-go">' + btn + '</button>' + (withShare ? '<button type="button" class="btn" id="gry-share">' + ICO.share + ' Udostępnij</button>' : '') + '</div></div>';
      $('#gry-go').onclick = paused ? resume : start; $('#gry-go').focus({ preventScroll: true });
      var sh = $('#gry-share'); if (sh) sh.onclick = function () { share(g.name + ' na Śliskiej: ' + api.score + ' ' + (g.unit || '') + ' 💦 Pobijesz?\n' + LINK + '/' + g.id, { knaga: g.knaga, c: g.c, eyebrow: 'Śliskie Gry', title: g.name, big: api.score, unit: g.unit || 'pkt', lines: [] }); };
    }
    function start() {
      if (!opts.replay) return begin();
      if (starting) return; starting = true;
      var fin = function (run) { if (!starting) return; starting = false; RUNS[g.id] = run; api.seed = run ? run.seed : (Math.random() * 4294967296) >>> 0; begin(); };
      mintRun(g.id).then(fin); setTimeout(function () { fin(null); }, 3500);
    }
    function begin() { mint(g.id); $('#gry-over').hidden = true; over = false; paused = false; fx = []; api.t = 0; api.stats = {}; api.newAch = []; api.tl = []; api._ls = -1; api.setScore(0); opts.reset(api); cd = reduce ? 0 : 1.8; running = true; last = performance.now(); raf = requestAnimationFrame(loop); try { cv.focus({ preventScroll: true }); } catch (e) { /* - */ } }
    function pause() { if (!running || over) return; running = false; paused = true; cancelAnimationFrame(raf); menu('<span class="gm-eye">Pauza</span><div class="gm-k">' + K('szlafrok', 'gk') + '</div><p class="gm-end">Knaga czeka. Wynik: <b>' + api.score + '</b></p>', 'Wznów'); }
    function resume() { $('#gry-over').hidden = true; paused = false; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function loop(t) {
      if (!running) return; var dt = Math.min(0.034, (t - last) / 1000); last = t;
      if (cd > 0) { cd -= dt; api.shk = 0; draw(); raf = requestAnimationFrame(loop); return; }
      api.t += dt; api.shk = Math.max(0, api.shk - dt * 30);
      opts.step(api, dt); if (!running && over) { draw(); return; } draw(); raf = requestAnimationFrame(loop);
      fx.forEach(function (p) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.text) p.vy += 400 * dt; }); fx = fx.filter(function (p) { return p.life > 0; });
    }
    function draw() {
      ctx.save(); if (api.shk > .1) ctx.translate((Math.random() - .5) * api.shk, (Math.random() - .5) * api.shk);
      opts.draw(api);
      ctx.globalCompositeOperation = 'lighter';
      fx.forEach(function (p) {
        if (p.text) return;
        var k = Math.max(0, Math.min(1, p.life / .6)); ctx.globalAlpha = k * .9; ctx.fillStyle = p.c;
        ctx.shadowColor = p.c; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(.6, p.r * (.4 + k * .8)), 0, 7); ctx.fill();
      });
      ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-over';
      fx.forEach(function (p) {
        if (!p.text) return;
        var age = .9 - p.life, sc = age < .12 ? .6 + age / .12 * .55 : age < .22 ? 1.15 - (age - .12) / .1 * .15 : 1;
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / .4)); ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sc, sc);
        ctx.font = '900 22px Figtree, Arial'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,8,30,.75)'; ctx.strokeText(p.text, 0, 0);
        ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.fillStyle = p.c; ctx.fillText(p.text, 0, 0); ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (!vg || vg.w !== W || vg.h !== H) { var gg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .78); gg.addColorStop(0, 'rgba(10,0,20,0)'); gg.addColorStop(1, 'rgba(10,0,20,.42)'); vg = { w: W, h: H, g: gg }; }
      ctx.fillStyle = vg.g; ctx.fillRect(-20, -20, W + 40, H + 40);
      if (cd > 0) {
        var n = Math.ceil(cd / .6), ph = 1 - (cd / .6 - Math.floor(cd / .6)), z = 1.5 - Math.min(1, ph) * .5;
        ctx.fillStyle = 'rgba(10,0,20,.35)'; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.globalAlpha = Math.min(1, (1 - ph) * 1.6 + .2);
        ctx.font = '900 110px Figtree, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(20,8,30,.8)'; ctx.strokeText(n, 0, 0);
        ctx.shadowColor = '#ffcf4a'; ctx.shadowBlur = 30; ctx.fillStyle = '#fff'; ctx.fillText(n, 0, 0); ctx.restore(); ctx.textBaseline = 'alphabetic';
      }
      ctx.restore();
    }
    size(); var ro = new ResizeObserver(size); ro.observe(cv.parentNode);
    $('#gry-pause').onclick = function () { if (running) pause(); };
    var onKey = function (e) { if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && running) { e.preventDefault(); pause(); } };
    var onVis = function () { if (document.hidden) pause(); };
    document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onVis);
    menu('<div class="gm-k">' + K(g.knaga, 'gk') + '</div><h2>' + g.name + '</h2><p class="gm-end">' + opts.intro + '</p>' + (opts.keys ? '<div class="gm-keys">' + opts.keys.map(function (k) { return '<span><kbd>' + k[0] + '</kbd>' + k[1] + '</span>'; }).join('') + '</div>' : ''), 'Graj');
    opts.init && opts.init(api, cv);
    opts.reset(api); api.ready = true; opts.draw(api);
    stopFns.push(function () { running = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); opts.destroy && opts.destroy(); });
    return api;
  }
  function drawK(ctx, img, x, y, s, rot) { if (!img.complete) return; ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore(); }
  var INK = '#2a1620';
  function dropPath(c, x, y, r, col, glow) {
    c.save(); if (glow) { c.shadowColor = col; c.shadowBlur = 16; }
    c.beginPath(); c.moveTo(x, y - r * 1.6); c.bezierCurveTo(x + r * .7, y - r * .6, x + r, y, x + r, y + r * .35); c.arc(x, y + r * .35, r, 0, Math.PI); c.bezierCurveTo(x - r, y, x - r * .7, y - r * .6, x, y - r * 1.6);
    c.fillStyle = col; c.fill(); c.shadowBlur = 0; c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x - r * .35, y + r * .05, r * .22, r * .42, -.4, 0, 7); c.fill(); c.restore();
  }
  function heart(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-14, -4, -8, -16, 0, -8); c.bezierCurveTo(8, -16, 14, -4, 0, 6); c.fillStyle = '#ff2d55'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.restore(); }
  /* odznaka power-upu: 'mag' magnes, 'shield' tarcza/gumka, 'slow' zegar */
  function badge(c, x, y, kind, t) {
    var col = kind === 'mag' ? '#ef4444' : kind === 'shield' ? '#f59e0b' : kind === 'gum' ? '#f59e0b' : '#14b8a6', bob = Math.sin((t || 0) * 5 + x / 30) * 3;
    c.save(); c.translate(x, y + bob); c.shadowColor = col; c.shadowBlur = 14;
    c.fillStyle = '#fff'; c.strokeStyle = col; c.lineWidth = 3.5; c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.stroke(); c.shadowBlur = 0;
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.lineCap = 'round';
    if (kind === 'mag') { c.beginPath(); c.arc(0, -1, 8, Math.PI, 0); c.lineTo(8, 8); c.moveTo(-8, -1); c.lineTo(-8, 8); c.stroke(); c.fillStyle = '#1f2937'; c.fillRect(-11, 5, 6, 5); c.fillRect(5, 5, 6, 5); }
    else if (kind === 'gum' || kind === 'shield') { c.save(); c.rotate(-.35); c.beginPath(); c.rect(-10, -7, 20, 14); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 4.6, 0, 7); c.fill(); c.strokeStyle = col; c.lineWidth = 1.8; c.stroke(); c.fillStyle = col; for (var gz = -8; gz <= 8; gz += 4) { c.fillRect(-11.5, gz - 1, 2, 2); c.fillRect(9.5, gz - 1, 2, 2); } c.restore(); }
        else { c.beginPath(); c.arc(0, 0, 9, 0, 7); c.stroke(); c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 0); c.lineTo(5, 2); c.stroke(); }
    c.restore();
  }
  /* paski aktywnych power-upów: [nazwa, pozostały czas, kolor, czas całkowity] */
  function pills(c, list, x0, y0) {
    var y = y0 || 62; list.forEach(function (q) { if (q[1] <= 0) return;
      c.save(); c.fillStyle = 'rgba(20,10,28,.72)'; c.beginPath(); c.roundRect(x0 || 12, y, 136, 24, 12); c.fill();
      c.globalAlpha = .5; c.fillStyle = q[2]; c.beginPath(); c.roundRect((x0 || 12) + 2, y + 2, Math.max(10, 132 * Math.min(1, q[1] / q[3])), 20, 10); c.fill(); c.globalAlpha = 1;
      c.fillStyle = '#fff'; c.font = '800 12px Figtree, Arial'; c.textAlign = 'left'; c.fillText(q[0] + ' ' + Math.ceil(q[1]) + 's', (x0 || 12) + 11, y + 16.5); c.restore(); y += 30; });
  }
  function paper(c, x, y, rot, label, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-14, -18); c.lineTo(7, -18); c.lineTo(14, -11); c.lineTo(14, 18); c.lineTo(-14, 18); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(7, -18); c.lineTo(7, -11); c.lineTo(14, -11); c.stroke();
    c.fillStyle = '#c9ced8'; c.fillRect(-9, -9, 14, 2); c.fillRect(-9, -4, 18, 2); c.fillRect(-9, 1, 16, 2);
    c.rotate(-.25); c.strokeStyle = col || '#d6001c'; c.lineWidth = 2; c.strokeRect(-12, 6, 24, 9); c.fillStyle = col || '#d6001c'; c.font = '900 7px Figtree, Arial'; c.textAlign = 'center'; c.fillText(label, 0, 13.5);
    c.restore();
  }

  /* ============== ŁAP KROPLE ============== */
  function krople(el) {
    var img = knagaImg('kapiel'), P, items, lives, spawn, combo, keys = {}, bub = [], rip = [], pw, lvl, PW = ['mag', 'shield', 'slow'], PN = { mag: 'Magnes!', shield: 'Gumka!', slow: 'Sauna: wolniej!' }, PB = function (t) { return .2 + Math.min(.1, t * .0015); };
    for (var i = 0; i < 16; i++) bub.push({ x: Math.random(), y: Math.random(), r: 3 + Math.random() * 9, v: .03 + Math.random() * .06 });
    canvasGame(el, G('krople'), {
      lives: true, intro: 'Przesuwaj wannę z Knagą i łap krople. Mocz +5, serduszko oddaje życie, a pozew je zabiera. Łap bonusy: magnes przyciąga krople, gumka łapie pozew, sauna zwalnia czas. Co 30 punktów nowy poziom.',
      keys: [['← →', 'ruch'], ['mysz / palec', 'przesuń'], ['Esc', 'pauza']],
      endText: function (s) { return s > 120 ? ['Wanna pełna po brzegi. Mokro jak nigdy!', 'imprezowa'] : s > 50 ? ['Porządnie się zmoczyła.', 'kapiel'] : s > 15 ? ['Ledwo wilgotno. Stać Cię na więcej.', 'sauna'] : ['Sucho jak na Saharze. Knaga się nie zmoczyła.', 'niesmiala']; },
      init: function (a, cv) {
        var mv = function (e) { var r = cv.getBoundingClientRect(); P.tx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; };
        cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', mv); cv.addEventListener('touchmove', function (e) { mv(e); e.preventDefault(); }, { passive: false });
        var kd = function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = e.type === 'keydown'; e.preventDefault(); } };
        document.addEventListener('keydown', kd); document.addEventListener('keyup', kd);
        stopFns.push(function () { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); });
      },
      reset: function (a) { P = { x: a.W / 2, tx: a.W / 2 }; items = []; rip = []; lives = 3; spawn = 0; combo = 0; pw = { mag: 0, shield: 0, slow: 0 }; lvl = 1; a.setLives(lives); },
      step: function (a, dt) {
        var t = a.t; spawn -= dt;
        if (keys.ArrowLeft) P.tx = P.x - 900 * dt; if (keys.ArrowRight) P.tx = P.x + 900 * dt;
        P.tx = Math.max(60, Math.min(a.W - 60, P.tx)); P.x += (P.tx - P.x) * Math.min(1, dt * 14);
        var speed = (160 + t * 7) * (pw.slow > 0 ? .55 : 1); PW.forEach(function (k) { pw[k] = Math.max(0, pw[k] - dt); }); var nl = 1 + Math.floor(a.score / 30); if (nl > lvl) { lvl = nl; a.pop(a.W / 2, 96, 'Poziom ' + lvl, '#ffcf4a'); }
        if (spawn <= 0) { spawn = Math.max(.26, .85 - t * .012); var r = Math.random(); items.push({ x: 30 + Math.random() * (a.W - 60), y: -24, k: r < PB(t) ? 'bad' : r < PB(t) + .1 ? 'gold' : r < PB(t) + .115 ? 'life' : r < PB(t) + .15 ? PW[Math.floor(Math.random() * 3)] : 'drop', v: speed * (.8 + Math.random() * .5), s: Math.random() * 6 }); }
        var py = a.H - 78;
        items.forEach(function (it) {
          if (pw.mag > 0 && it.k !== 'bad' && Math.abs(it.x - P.x) < 200 && it.y > 40) it.x += (P.x - it.x) * Math.min(1, dt * 5);
          it.y += it.v * dt;
          if (!it.hit && it.y > py - 26 && it.y < py + 14 && Math.abs(it.x - P.x) < 62) {
            it.hit = true; if (it.k !== 'bad') rip.push({ x: it.x, t: 0 });
            if (it.k === 'bad') { if (pw.shield <= 0) a.shake(14); if (pw.shield > 0) { pw.shield = 0; a.ev('shieldsave'); a.burst(it.x, it.y, '#f59e0b', 14); a.pop(it.x, it.y - 20, 'Gumka pękła!', '#c4b5fd'); } else { lives--; a.ev('lost'); combo = 0; a.setLives(lives); a.burst(it.x, it.y, '#d6001c', 14); a.pop(it.x, it.y - 20, '−1 życie', '#ff6b6b'); if (lives <= 0) a.over(); } }
            else if (PW.indexOf(it.k) >= 0) { a.ev('pw_' + it.k); pw[it.k] = it.k === 'shield' ? 14 : 8; a.pop(it.x, it.y - 22, PN[it.k], '#fff'); a.burst(it.x, it.y, '#ffcf4a', 12); }
            else if (it.k === 'life') { a.ev('life'); lives = Math.min(5, lives + 1); a.setLives(lives); a.pop(it.x, it.y - 20, '+1 życie', '#ff8fb0'); a.burst(it.x, it.y, '#ff2d55', 10); }
            else { var v = it.k === 'gold' ? 5 : 1; a.ev(it.k === 'gold' ? 'gold' : 'drop'); combo++; a.mx('combo', combo); if (combo % 10 === 0) { v += 5; a.pop(P.x, py - 70, 'COMBO +5', '#ffcf4a'); } a.setScore(a.score + v); a.burst(it.x, it.y, it.k === 'gold' ? '#ffcf4a' : '#5cc8ff', 8); a.pop(it.x, it.y - 18, '+' + (it.k === 'gold' ? 5 : 1), it.k === 'gold' ? '#ffcf4a' : '#fff'); }
          } else if (!it.hit && it.y > a.H && it.k !== 'bad') { it.hit = true; if (it.k !== 'life') combo = 0; }
        });
        items = items.filter(function (it) { return !it.hit && it.y < a.H + 30; });
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t;
        var wg = c.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#f2fbff'); wg.addColorStop(.6, '#d9f0fb'); wg.addColorStop(1, '#b9e0f3'); c.fillStyle = wg; c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(120,180,210,.35)'; c.lineWidth = 1.5; for (var x = 0; x < W; x += 46) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); } for (var y = 0; y < H; y += 46) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.5)'; for (x = 0; x < W; x += 46) for (y = 0; y < H; y += 46) if (((x / 46 + y / 46) | 0) % 3 === 0) c.fillRect(x + 3, y + 3, 14, 3);
        c.save(); c.globalCompositeOperation = 'lighter'; [[.18, .3], [.5, .22]].forEach(function (s2, i) { var lg2 = c.createLinearGradient(W * s2[0], 0, W * (s2[0] + s2[1]), H); lg2.addColorStop(0, 'rgba(255,248,210,' + (.06 + Math.sin(t * .6 + i) * .02) + ')'); lg2.addColorStop(1, 'rgba(255,248,210,0)'); c.fillStyle = lg2; c.beginPath(); c.moveTo(W * s2[0] - 30, 0); c.lineTo(W * s2[0] + 40, 0); c.lineTo(W * (s2[0] + s2[1]) + 120, H); c.lineTo(W * (s2[0] + s2[1]) - 80, H); c.closePath(); c.fill(); }); c.restore();
        var fg = c.createLinearGradient(0, H - 34, 0, H); fg.addColorStop(0, '#a9daf0'); fg.addColorStop(1, '#6fb2d4'); c.fillStyle = fg; c.fillRect(0, H - 34, W, 34); c.fillStyle = 'rgba(40,110,150,.35)'; for (x = 0; x < W; x += 34) c.fillRect(x, H - 34, 2, 34); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, H - 34, W, 2);
        for (var sw = 0; sw < 5; sw++) { var sx2 = (sw * .23 + .06) * W + Math.sin(t * .8 + sw * 2) * 18, sy2 = ((1 - ((t * .05 + sw * .2) % 1)) * .8 + .1) * H; c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.ellipse(sx2, sy2, 38, 14, 0, 0, 7); c.fill(); }
        bub.forEach(function (b) { var by = ((b.y - t * b.v) % 1 + 1) % 1; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(b.x * W, by * H, b.r, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); });
        items.forEach(function (it) { if (it.k === 'bad' || PW.indexOf(it.k) >= 0 || it.k === 'life') return; var sg = c.createLinearGradient(0, it.y - 70, 0, it.y); sg.addColorStop(0, 'rgba(63,182,242,0)'); sg.addColorStop(1, it.k === 'gold' ? 'rgba(255,207,74,.45)' : 'rgba(63,182,242,.4)'); c.fillStyle = sg; c.fillRect(it.x - 3, it.y - 70, 6, 66); });
        items.forEach(function (it) {
          if (it.k === 'bad') paper(c, it.x, it.y, Math.sin(it.y / 26 + it.s) * .35, 'POZEW');
          else if (it.k === 'life') heart(c, it.x, it.y, 26);
          else if (PW.indexOf(it.k) >= 0) badge(c, it.x, it.y, it.k, t);
          else dropPath(c, it.x, it.y, it.k === 'gold' ? 12 : 9.5, it.k === 'gold' ? '#ffcf4a' : '#3fb6f2', it.k === 'gold');
        });
        var bx = P.x, by2 = H - 78;
        c.fillStyle = 'rgba(30,80,110,.22)'; c.beginPath(); c.ellipse(bx, H - 26, 82, 9, 0, 0, 7); c.fill();
        rip.forEach(function (r) { r.t += .035; }); rip = rip.filter(function (r) { return r.t < 1; });
        drawK(c, img, bx, by2 - 26, 118);
        rip.forEach(function (r) { c.strokeStyle = 'rgba(255,255,255,' + (1 - r.t) * .9 + ')'; c.lineWidth = 2; c.beginPath(); c.ellipse(bx + (r.x - bx) * .5, by2 + 4, 14 + r.t * 40, 3 + r.t * 6, 0, 0, 7); c.stroke(); });
        c.fillStyle = '#7fd0f5'; c.beginPath(); c.ellipse(bx, by2 + 4, 66, 10, 0, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 74, by2); c.lineTo(bx + 74, by2); c.quadraticCurveTo(bx + 70, by2 + 46, bx + 40, by2 + 48); c.lineTo(bx - 40, by2 + 48); c.quadraticCurveTo(bx - 70, by2 + 46, bx - 74, by2); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#f2f6f9'; c.beginPath(); c.roundRect(bx - 80, by2 - 8, 160, 12, 6); c.fill(); c.stroke();
        c.fillStyle = INK; c.beginPath(); c.roundRect(bx - 50, by2 + 46, 10, 10, 3); c.roundRect(bx + 40, by2 + 46, 10, 10, 3); c.fill();
        c.fillStyle = '#fff'; [[-58, -12, 9], [-44, -16, 7], [50, -13, 8], [62, -9, 6]].forEach(function (f) { c.beginPath(); c.arc(bx + f[0], by2 + f[1], f[2], 0, 7); c.fill(); });
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.roundRect(bx - 56, by2 + 12, 40, 6, 3); c.fill();
        if (pw && pw.shield > 0) { c.strokeStyle = 'rgba(245,158,11,.9)'; c.lineWidth = 4; c.beginPath(); c.arc(bx, by2 - 10, 88, Math.PI * 1.08, Math.PI * 1.92); c.stroke(); }
        if (pw) pills(c, [['Magnes', pw.mag, '#ef4444', 8], ['Gumka', pw.shield, '#f59e0b', 14], ['Sauna', pw.slow, '#14b8a6', 8]], 12, 62);
        if (lvl) { c.font = '900 13px Figtree, Arial'; c.textAlign = 'right'; c.fillStyle = 'rgba(30,60,90,.7)'; c.fillText('POZIOM ' + lvl, W - 14, H - 44); }
      }
    });
  }

  /* ============== SUPER KNAGA (dawniej Knaga Flappy; id gry: flappy) ============== */
  function flappy(el) {
    var PAL = [['#120a2a', '#4b1450', '#b3123a'], ['#04122b', '#0b3a6b', '#1fb5c9'], ['#2a0a1a', '#a03a2f', '#ffb34a']];
    var img = knagaImg('super'), B, pipes, trail = [], city = [[], []], SIM, inp = [], acc = 0;
    for (var L = 0; L < 2; L++) { var x = 0; while (x < 2400) { var w = 40 + Math.random() * 70; city[L].push({ x: x, w: w, h: (L ? 70 : 120) + Math.random() * (L ? 90 : 150), seed: Math.random() }); x += w + (L ? 6 : 10); } }
    canvasGame(el, G('flappy'), {
      replay: true,
      intro: 'Super Knaga leci nad sceną. Machaj peleryną i przelatuj między statywami. Zbieraj krople (+2) i złotą gumkę, która wybacza jedno uderzenie (potem pęka). Od 12 punktów statywy się ruszają, a co 15 punktów zmienia się scena.',
      keys: [['Spacja', 'w górę'], ['klik / stuknięcie', 'w górę'], ['Esc', 'pauza']],
      endText: function (s) { return s >= 30 ? ['Super Knaga to Ty! Scena należy do Ciebie.', 'super'] : s >= 12 ? ['Lata całkiem sprawnie. Prawie gwiazda.', 'gwiazdor'] : s >= 4 ? ['Krótki lot, ale z klasą.', 'ziomek'] : ['Knaga opadła.', 'niesmiala']; },
      init: function (a, cv) {
        var flap = function (e) { if (e.type === 'keydown') { if (e.code !== 'Space' && e.key !== 'ArrowUp') return; e.preventDefault(); } if (SIM && !SIM.dead && !a.counting && $('#gry-over').hidden) { inp.push(SIM.n); SIM.flap(); a.burst(SIM.B.x - 20, SIM.B.y + 10, '#ffcf4a', 4); } };
        cv.addEventListener('pointerdown', flap); document.addEventListener('keydown', flap);
        stopFns.push(function () { document.removeEventListener('keydown', flap); });
      },
      reset: function (a) { SIM = SliskaSim.flappy(a.seed, Math.max(300, Math.min(1400, Math.round(a.W))), Math.max(340, Math.min(1100, Math.round(a.H)))); inp = []; acc = 0; B = SIM.B; pipes = SIM.pipes; trail = []; },
      step: function (a, dt) {
        acc += dt; var n = 0, DT = SliskaSim.DT;
        while (acc >= DT && n++ < 6 && !SIM.dead) {
          acc -= DT; var before = SIM.score; SIM.tick();
          if (SIM.score !== before) a.setScore(SIM.score);
          var b = SIM.B;
          SIM.ev.forEach(function (e) {
            if (e[0] === 'shieldsave') { a.ev('shieldsave'); a.pop(b.x, b.y - 44, 'Gumka pękła!', '#ffcf4a'); a.burst(b.x, b.y, '#ffcf4a', 18); }
            else if (e[0] === 'shield') { a.ev('shield'); a.pop(b.x, b.y - 44, 'Gumka!', '#ffcf4a'); }
            else if (e[0] === 'drop') { a.ev('drop'); a.pop(b.x, b.y - 44, '+2', '#5cc8ff'); }
            else if (e[0] === 'burst') a.burst(e[1], e[2], e[3] ? '#ffcf4a' : '#5cc8ff', 10);
            else if (e[0] === 'pass') {
              a.pop(b.x, b.y - 40, '+1', '#ffcf4a');
              [[10, 'BRĄZ', '#d19a66'], [25, 'SREBRO', '#dbe2ea'], [50, 'ZŁOTO', '#ffcf4a']].forEach(function (m) { if (before < m[0] && SIM.score >= m[0]) a.pop(a.W / 2, 130, m[1], m[2]); });
            }
          });
          SIM.ev.length = 0;
          var sp = 160 + Math.min(90, SIM.score * 3);
          trail.forEach(function (q) { q.x -= sp * DT; q.l -= DT; });
          trail.push({ x: b.x - 26, y: b.y + 6, l: .5 });
        }
        trail = trail.filter(function (q) { return q.l > 0; });
        B = SIM.B; pipes = SIM.pipes;
        if (SIM.dead) { a.shake(16); RPS.flappy = { i: inp, n: SIM.n, w: SIM.W, h: SIM.H }; a.over(); }
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t, gr = c.createLinearGradient(0, 0, 0, H);
        var pl = PAL[Math.floor(a.score / 15) % 3]; gr.addColorStop(0, pl[0]); gr.addColorStop(.55, pl[1]); gr.addColorStop(1, pl[2]); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        var mg2 = c.createRadialGradient(W * .78, H * .16, 4, W * .78, H * .16, 90); mg2.addColorStop(0, 'rgba(255,244,214,.95)'); mg2.addColorStop(.18, 'rgba(255,230,170,.9)'); mg2.addColorStop(.19, 'rgba(255,210,140,.22)'); mg2.addColorStop(1, 'rgba(255,210,140,0)'); c.fillStyle = mg2; c.fillRect(0, 0, W, H * .5);
        c.fillStyle = 'rgba(255,255,255,.7)'; for (var i = 0; i < 40; i++) { var sx = ((i * 131 - t * 8) % W + W) % W; c.fillRect(sx, (i * 57) % (H * .5), i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5); }
        c.fillStyle = 'rgba(255,255,255,.06)'; for (i = 0; i < 4; i++) { var cxx = ((i * .33 * W - t * (10 + i * 4)) % (W + 240) + W + 240) % (W + 240) - 120, cyy = H * (.14 + i * .09); c.beginPath(); c.ellipse(cxx, cyy, 90, 16, 0, 0, 7); c.ellipse(cxx + 40, cyy - 8, 56, 14, 0, 0, 7); c.fill(); }
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,230,160,.10)'; [[.2, -.25], [.8, .25]].forEach(function (s) { c.beginPath(); c.moveTo(W * s[0], H); c.lineTo(W * (s[0] + s[1]) - 60, 0); c.lineTo(W * (s[0] + s[1]) + 60, 0); c.closePath(); c.fill(); }); c.restore();
        [[0, .15, '#22102f', 'rgba(255,214,160,.10)'], [1, .4, '#160a21', 'rgba(255,214,160,.20)']].forEach(function (Lr) {
          var off = (t * 160 * Lr[1]) % 2400;
          city[Lr[0]].forEach(function (b) {
            var bx = b.x - off; if (bx < -b.w) bx += 2400; if (bx > W) return;
            var by = H - 46 - b.h; c.fillStyle = Lr[2]; c.fillRect(bx, by, b.w, b.h);
            c.fillStyle = Lr[3]; for (var wy = by + 10; wy < H - 56; wy += 16) for (var wx = bx + 8; wx < bx + b.w - 8; wx += 14) if (((wx * 7 + wy * 3) * b.seed | 0) % 5 === 0) c.fillRect(wx, wy, 5, 7);
          });
        });
        (pipes || []).forEach(function (p) {
          [[0, p.top, true], [p.top + p.gp, H - 46 - p.top - p.gp, false]].forEach(function (s) {
            var pg = c.createLinearGradient(p.x - 7, 0, p.x + 7, 0); pg.addColorStop(0, '#6b7280'); pg.addColorStop(.5, '#e5e7eb'); pg.addColorStop(1, '#4b5563');
            c.fillStyle = pg; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(p.x - 7, s[0] - 6, 14, s[1] + 12, 4); c.fill(); c.stroke();
            var hy = s[2] ? s[0] + s[1] - 44 : s[0];
            var mg = c.createLinearGradient(p.x - 26, 0, p.x + 26, 0); mg.addColorStop(0, '#2b2f3a'); mg.addColorStop(.5, '#6b7280'); mg.addColorStop(1, '#1f222b');
            c.fillStyle = mg; c.beginPath(); c.roundRect(p.x - 26, hy, 52, 44, 20); c.fill(); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.5; for (var k = 8; k < 40; k += 6) { c.beginPath(); c.moveTo(p.x - 20, hy + k); c.lineTo(p.x + 20, hy + k); c.stroke(); }
            c.fillStyle = '#d6001c'; c.fillRect(p.x - 26, s[2] ? hy : hy + 38, 52, 6);
          });
          if (p.coin) dropPath(c, p.x, p.top + p.gp / 2 + Math.sin(a.t * 5 + p.ph) * 4, 9, '#5cc8ff', true);
          if (p.sh) badge(c, p.x, p.top + p.gp / 2, 'gum', a.t);
        });
        c.fillStyle = '#140a1c'; c.fillRect(0, H - 46, W, 46); c.fillStyle = '#2a1636'; var so = (t * 200) % 40; for (var gx = -so; gx < W; gx += 40) c.fillRect(gx, H - 46, 20, 6);
        var fgd = c.createLinearGradient(0, H - 46, 0, H); fgd.addColorStop(0, 'rgba(255,207,74,.28)'); fgd.addColorStop(.35, 'rgba(255,207,74,0)'); c.fillStyle = fgd; c.fillRect(0, H - 46, W, 46);
        c.fillStyle = '#ffcf4a'; c.shadowColor = '#ffcf4a'; c.shadowBlur = 12; c.fillRect(0, H - 46, W, 2); c.shadowBlur = 0;
        trail.forEach(function (q) { c.fillStyle = 'rgba(255,61,110,' + q.l + ')'; c.beginPath(); c.arc(q.x, q.y, 6 * q.l + 2, 0, 7); c.fill(); });
        if (B && (B.inv <= 0 || Math.floor(B.inv * 12) % 2)) c.save(); c.shadowColor = 'rgba(255,61,110,.7)'; c.shadowBlur = 22; drawK(c, img, B.x, B.y, 84, Math.max(-.5, Math.min(.7, B.vy / 600))); c.restore();
        if (B && B.shield) { c.strokeStyle = 'rgba(255,207,74,.9)'; c.lineWidth = 3.5; c.beginPath(); c.arc(B.x, B.y, 50, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,207,74,.12)'; c.fill(); }
      }
    });
  }

  /* ============== ŚLISKI WĄŻ (id gry: waz) ============== */
  function waz(el) {
    var head = knagaImg('ikona'), S, dir, nd, food, gold, N = 17, obst = [], slow = null, slowT = 0, combo = 0, comboT = 0, SIM, inp = [], acc = 0;
    var DIRS4 = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    function sync() { S = SIM.S; dir = SIM.dir; nd = SIM.nd; food = SIM.food; gold = SIM.gold; obst = SIM.obst; slow = SIM.slow; slowT = SIM.slowT; combo = SIM.combo; comboT = SIM.comboT; }
    canvasGame(el, G('waz'), {
      replay: true,
      ratio: '5 / 6', intro: 'Prowadź Knagę po scenie. Z każdym mikrofonem robi się dłuższa. Zbieraj je szybko jeden po drugim, a zrobisz combo (do +4). Złoty mikrofon to 3 punkty, zegar zwalnia czas. Uważaj: co 5 punktów na scenie pojawia się nowa kolumna głośnikowa.',
      keys: [['↑ ↓ ← →', 'kierunek'], ['WASD', 'też działa'], ['przesuń palcem', 'telefon']],
      endText: function (s) { return s >= 40 ? ['Długa jak lista featów. Szacun!', 'gwiazdor'] : s >= 15 ? ['Ładnie urosła. Prawie gwiazda sceny.', 'ziomek'] : ['Knaga się zaplątała.', 'wsciekla']; },
      init: function (a, cv) {
        var K4 = { ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, w: 0, s: 1, a: 2, d: 3, W: 0, S: 1, A: 2, D: 3 };
        var turn = function (k) { var m = DIRS4[k]; if (!SIM || SIM.dead || a.counting || !m || (m[0] === -SIM.dir[0] && m[1] === -SIM.dir[1])) return false; inp.push(SIM.n * 4 + k); SIM.turn(k); return true; };
        var kd = function (e) { var k = K4[e.key]; if (k !== undefined && turn(k)) e.preventDefault(); };
        document.addEventListener('keydown', kd);
        var sx, sy; cv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        cv.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        cv.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 3 : 2) : (dy > 0 ? 1 : 0)); });
        stopFns.push(function () { document.removeEventListener('keydown', kd); });
      },
      reset: function (a) { SIM = SliskaSim.waz(a.seed); inp = []; acc = 0; sync(); },
      step: function (a, dt) {
        acc += dt; var n = 0, DT = SliskaSim.DT;
        while (acc >= DT && n++ < 6 && !SIM.dead) {
          acc -= DT; var before = SIM.score; SIM.tick();
          if (SIM.score !== before) a.setScore(SIM.score);
          var g2 = geo(a), px = function (e) { return [g2.ox + e[1] * g2.sz + g2.sz / 2, g2.oy + e[2] * g2.sz + g2.sz / 2]; };
          SIM.ev.forEach(function (e) {
            var q = e[0] === 'obs' ? null : px(e);
            if (e[0] === 'gold') { a.ev('gold'); a.burst(q[0], q[1], '#ffcf4a', 14); a.pop(q[0], q[1] - 20, '+3', '#ffcf4a'); }
            else if (e[0] === 'mic') { a.ev('mic'); a.mx('combo', SIM.combo); a.burst(q[0], q[1], '#ff2d77', 10); a.pop(q[0], q[1] - 20, '+' + e[3], e[3] > 1 ? '#ffcf4a' : '#fff'); }
            else if (e[0] === 'slow') { a.ev('slow'); a.pop(q[0], q[1] - 20, 'Zwolnienie!', '#5eead4'); a.burst(q[0], q[1], '#14b8a6', 10); }
            else if (e[0] === 'obs') a.pop(a.W / 2, 60, 'Nowa kolumna głośnikowa!', '#ff8fb0');
          });
          SIM.ev.length = 0;
          a.mx('len', SIM.S.length); a.mx('obs', SIM.obst.length);
        }
        sync();
        if (SIM.dead) { a.shake(14); RPS.waz = { i: inp, n: SIM.n }; a.over(); }
      },
      draw: function (a) {
        var c = a.ctx, t = a.t, g2 = geo(a), sz = g2.sz, ox = g2.ox, oy = g2.oy;
        c.fillStyle = '#12051a'; c.fillRect(0, 0, a.W, a.H);
        c.save(); c.shadowColor = '#ff2d77'; c.shadowBlur = 22; c.fillStyle = '#1d0a24'; c.beginPath(); c.roundRect(ox - 6, oy - 6, sz * N + 12, sz * N + 12, 18); c.fill(); c.restore();
        c.strokeStyle = '#ff2d77'; c.lineWidth = 2; c.beginPath(); c.roundRect(ox - 6, oy - 6, sz * N + 12, sz * N + 12, 18); c.stroke();
        var bgk = c.createRadialGradient(a.W / 2, a.H / 2, 10, a.W / 2, a.H / 2, sz * N * .75); bgk.addColorStop(0, '#3a1148'); bgk.addColorStop(1, '#170620'); c.fillStyle = bgk; c.beginPath(); c.roundRect(ox - 4, oy - 4, sz * N + 8, sz * N + 8, 15); c.fill();
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) % 2) { c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(ox + x * sz, oy + y * sz, sz, sz); }
        c.strokeStyle = 'rgba(255,45,119,' + (.10 + Math.sin(t * 2) * .03) + ')'; c.lineWidth = 1; for (var gi = 1; gi < N; gi++) { c.beginPath(); c.moveTo(ox + gi * sz + .5, oy); c.lineTo(ox + gi * sz + .5, oy + sz * N); c.moveTo(ox, oy + gi * sz + .5); c.lineTo(ox + sz * N, oy + gi * sz + .5); c.stroke(); }
        var sy3 = oy + ((t * .35) % 1) * sz * N; var sl = c.createLinearGradient(0, sy3 - 30, 0, sy3 + 2); sl.addColorStop(0, 'rgba(255,45,119,0)'); sl.addColorStop(1, 'rgba(255,45,119,.05)'); c.fillStyle = sl; c.fillRect(ox, sy3 - 30, sz * N, 32);
        var cx = function (p) { return ox + p[0] * sz + sz / 2; }, cy = function (p) { return oy + p[1] * sz + sz / 2; };
        mic(c, cx(food), cy(food), sz * (.9 + Math.sin(t * 6) * .06), false);
        if (gold) { c.globalAlpha = gold.t < 1.5 ? (Math.sin(t * 20) > 0 ? 1 : .35) : 1; mic(c, cx(gold.p), cy(gold.p), sz * 1.05, true); c.globalAlpha = 1; }
        obst.forEach(function (o) { var x = ox + o[0] * sz, y = oy + o[1] * sz; c.fillStyle = '#2b2f3a'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.roundRect(x + 2, y + 2, sz - 4, sz - 4, 5); c.fill(); c.stroke(); c.fillStyle = '#6b7280'; c.beginPath(); c.arc(x + sz / 2, y + sz * .62, sz * .2, 0, 7); c.fill(); c.beginPath(); c.arc(x + sz / 2, y + sz * .3, sz * .09, 0, 7); c.fill(); });
        if (slow) { c.globalAlpha = slow.t < 2 ? (Math.sin(t * 20) > 0 ? 1 : .35) : 1; badge(c, cx(slow.p), cy(slow.p), 'slow', t); c.globalAlpha = 1; }
        [food].concat(gold ? [gold.p] : []).forEach(function (fp, fi) { var rr = ((t * .9 + fi * .4) % 1); c.strokeStyle = (fi ? 'rgba(255,207,74,' : 'rgba(255,45,119,') + (1 - rr) * .55 + ')'; c.lineWidth = 2; c.beginPath(); c.arc(cx(fp), cy(fp), sz * (.5 + rr * 1.1), 0, 7); c.stroke(); });
        c.lineCap = 'round'; c.lineJoin = 'round';
        var n = S.length; c.save(); c.shadowColor = 'rgba(255,45,119,.8)'; c.shadowBlur = 16;
        for (var pass = 0; pass < 3; pass++) for (var i = n - 1; i > 0; i--) {
          var wd = sz * (.5 + .32 * (1 - i / n)); c.shadowBlur = pass === 1 && i % 3 === 0 ? 14 : 0; c.beginPath(); c.moveTo(cx(S[i]), cy(S[i])); c.lineTo(cx(S[i - 1]), cy(S[i - 1]));
          if (pass === 0) { c.strokeStyle = INK; c.lineWidth = wd + 5; } else if (pass === 1) { c.strokeStyle = i % 2 ? '#e0243f' : '#c4102a'; c.lineWidth = wd; } else { c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = wd * .24; }
          c.stroke();
        }
        c.restore(); c.fillStyle = '#ff9fb2'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(cx(S[n - 1]), cy(S[n - 1]), sz * .3, 0, 7); c.fill(); c.stroke();
        drawK(c, head, cx(S[0]), cy(S[0]), sz * 2.05, Math.atan2(dir[1], dir[0]) + Math.PI / 2);
        c.font = '900 14px Figtree, Arial'; c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('DŁUGOŚĆ: ' + (n * 2) + ' CM', ox + sz * N - 6, oy + sz * N - 8);
        if (comboT > 0 && combo > 1) { c.font = '900 15px Figtree, Arial'; c.textAlign = 'center'; c.fillStyle = '#ffcf4a'; c.fillText('COMBO ×' + Math.min(4, combo), a.W / 2, oy - 14 > 14 ? oy - 14 : 16); }
        if (slowT > 0) pills(c, [['Zwolnienie', slowT, '#14b8a6', 6]], 12, 62);
      }
    });
    function geo(a) { var top = 56, sz = Math.floor(Math.min(a.W - 20, a.H - top - 12) / N); return { sz: sz, ox: (a.W - sz * N) / 2, oy: top + (a.H - top - sz * N) / 2 }; }
    function mic(c, x, y, s, gl) {
      c.save(); c.translate(x, y); c.rotate(-.5); c.shadowColor = gl ? '#ffcf4a' : '#ff2d77'; c.shadowBlur = 14;
      c.fillStyle = gl ? '#c99400' : '#2b2f3a'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.roundRect(-s * .1, s * .05, s * .2, s * .45, 3); c.fill(); c.stroke();
      c.fillStyle = gl ? '#ffcf4a' : '#9ca3af'; c.beginPath(); c.arc(0, -s * .12, s * .26, 0, 7); c.fill(); c.shadowBlur = 0; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * .2, -s * .12); c.lineTo(s * .2, -s * .12); c.moveTo(0, -s * .34); c.lineTo(0, s * .1); c.stroke(); c.restore();
    }
  }

  /* ============== ŚLIZGAWKA v3 ============== */
  function slizgawka(el) {
    var img = knagaImg('surfer'), P, obs, drops, ups, ramps, dist, gapLeft, combo, pw, nextMs, lastBi, travel, isl = [], clouds = [], birds = [];
    var PALS = [
      { sky: ['#2b1b4a', '#c4366e', '#ffb36b'], sea: ['#37a0e6', '#174f8f'], sil: '#6b2a5e', name: 'Zachód' },
      { sky: ['#050a24', '#16275e', '#3a4f99'], sea: ['#1c4a8a', '#0a1f45'], sil: '#0f1a44', name: 'Noc' },
      { sky: ['#1a0033', '#7a1fa2', '#ff4fa3'], sea: ['#4a0f80', '#1a0540'], sil: '#2a004d', name: 'Neon' },
      { sky: ['#06141e', '#0f4a52', '#2fbf9f'], sea: ['#117286', '#06303d'], sil: '#0b2f36', name: 'Zorza' }
    ];
    var KINDS = [['POZEW', '#fff', '#d6001c'], ['DISS', '#15101c', '#fff'], ['FEJK', '#ffcf4a', '#15101c']], FLY = [['PLOTKA', '#fff', '#7c3aed'], ['CLICKBAIT', '#ffcf4a', '#15101c'], ['TAKEDOWN', '#15101c', '#ff4d6d']];
    var hx = function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; };
    var mix = function (a, b, f) { var x = hx(a), y = hx(b); return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * f) + ',' + Math.round(x[1] + (y[1] - x[1]) * f) + ',' + Math.round(x[2] + (y[2] - x[2]) * f) + ')'; };
    function biome(d) {
      var bi = d / 400, i0 = Math.floor(bi) % 4, i1 = (i0 + 1) % 4, f = Math.max(0, Math.min(1, ((bi % 1) - .8) / .2)); f = f * f * (3 - 2 * f);
      var A = PALS[i0], B = PALS[i1], w = [0, 0, 0, 0]; w[i0] += 1 - f; w[i1] += f;
      return { s0: mix(A.sky[0], B.sky[0], f), s1: mix(A.sky[1], B.sky[1], f), s2: mix(A.sky[2], B.sky[2], f), w0: mix(A.sea[0], B.sea[0], f), w1: mix(A.sea[1], B.sea[1], f), sil: mix(A.sil, B.sil, f), w: w, i: Math.floor(bi) % 4 };
    }
    for (var i = 0; i < 7; i++) clouds.push({ x: Math.random(), y: .08 + Math.random() * .3, s: .6 + Math.random() * .8 });
    for (i = 0; i < 4; i++) birds.push({ x: Math.random(), y: .12 + Math.random() * .22, p: Math.random() * 6 });
    (function () { var x = 0; while (x < 1700) { var k = Math.random(), w = 90 + Math.random() * 120; isl.push({ x: x, w: w, h: 22 + Math.random() * 40, k: k < .22 ? 'lh' : k < .6 ? 'isl' : 'city', s: Math.random() }); x += w + 60 + Math.random() * 120; } })();
    canvasGame(el, G('slizgawka'), {
      intro: 'Knaga surfuje od zachodu słońca przez noc i neon aż po zorzę. Skacz (2× = podwójny skok i salto), schylaj się pod dronami z pozwami, wjeżdżaj na fale-rampy po triki i zbieraj krople. Gumka chroni przed jednym uderzeniem, magnes przyciąga krople.',
      keys: [['Spacja / stuknięcie', 'skok (2× w powietrzu)'], ['↓ / lewa strona', 'schyl się / nurkuj']],
      endText: function (s) { return s > 1800 ? ['Legenda fali. Nawet ocean bije brawo.', 'super'] : s > 700 ? ['Ładnie się ślizga. Prawie surfer roku.', 'surfer'] : s > 250 ? ['Niezły przejazd, ale fala wygrała.', 'ziomek'] : ['Knaga się zmoczyła.', 'kapiel']; },
      init: function (a, cv) {
        var jump = function () { if (P && !a.counting && P.j < 2 && $('#gry-over').hidden) { P.vy = -540; P.j++; if (P.j === 2) P.spin = true; a.burst(a.W * .25, a.H * .74, '#fff', 6); } };
        var duck = function () { if (!P || a.counting || !$('#gry-over').hidden) return; if (P.y < -2) { P.vy = Math.max(P.vy, 1150); if (!P.dive) { P.dive = true; a.ev('dive'); } } else P.duck = Math.max(P.duck, .5); };
        var pd = function (e) { var r = cv.getBoundingClientRect(); if (e.clientX - r.left < r.width * .32) duck(); else jump(); };
        var kd = function (e) { if (e.code === 'Space' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { e.preventDefault(); duck(); } };
        cv.addEventListener('pointerdown', pd); document.addEventListener('keydown', kd);
        stopFns.push(function () { document.removeEventListener('keydown', kd); });
      },
      reset: function (a) { P = { y: 0, vy: 0, j: 0, rot: 0, spin: false, duck: 0, dive: false }; obs = []; drops = []; ups = []; ramps = []; dist = 0; travel = 0; gapLeft = 220; combo = 0; pw = { shield: 0, mag: 0 }; nextMs = 500; lastBi = 0; },
      step: function (a, dt) {
        var t = a.t, W = a.W, sp = 270 + t * 9, gy = a.H * .74, kx = W * .25;
        dist += sp * dt / 10; travel += sp * dt;
        var was = P.y; P.vy += 1550 * dt; P.y += P.vy * dt; P.duck = Math.max(0, P.duck - dt);
        if (P.y < -2 && P.spin) P.rot += 9 * dt;
        if (P.y >= 0) {
          if (was < -2) {
            a.burst(kx - 10, gy + 2, '#fff', P.dive ? 14 : 7);
            if (P.dive) { P.duck = .35; a.shake(4); }
            var fl = Math.floor(P.rot / 6.2832 + .35);
            if (fl >= 1) { var bn = fl >= 2 ? 15 : 10; dist += bn; combo++; a.ev('trick'); if (fl >= 2) a.ev('dtrick'); a.mx('combo', combo); a.pop(kx, gy - 110, fl >= 2 ? 'PODWÓJNE SALTO +' + bn : 'SALTO +' + bn, '#ffcf4a'); }
          }
          P.y = 0; P.vy = 0; P.j = 0; P.rot = 0; P.spin = false; P.dive = false;
        }
        var ky = gy + P.y - 40;
        gapLeft -= sp * dt;
        if (gapLeft <= 0) {
          var r = Math.random(), x0 = W + 50;
          if (r < .24 && dist > 40) { ramps.push({ x: x0 }); gapLeft = sp * 1.2 + 170; for (var q = 0; q < 5; q++) drops.push({ x: x0 + 90 + q * 46, y: gy - 70 - Math.sin(q / 4 * Math.PI) * 130 }); }
          else if (r < .5 && dist > 120) { obs.push({ x: x0, fly: true, k: FLY[Math.floor(Math.random() * 3)] }); gapLeft = Math.max(320, sp * (.9 + Math.random() * .6)); }
          else if (r < .62) { for (q = 0; q < 6; q++) drops.push({ x: x0 + q * 38, y: gy - 50 - Math.sin(q / 5 * Math.PI) * 70 }); gapLeft = 260; }
          else { obs.push({ x: x0, k: KINDS[Math.floor(Math.random() * 3)], h: 38 + Math.random() * 28 }); for (q = 0; q < 4; q++) drops.push({ x: x0 - 60 + q * 40, y: gy - 62 - Math.sin(q / 3 * Math.PI) * 100 }); gapLeft = Math.max(320, sp * (.85 + Math.random() * .6)); }
        }
        if (Math.random() < dt * .35) drops.push({ x: W + 20, y: gy - 60 - Math.random() * 110 });
        pw.shield = Math.max(0, pw.shield - dt); pw.mag = Math.max(0, pw.mag - dt);
        if (Math.random() < dt * .09) ups.push({ x: W + 20, y: gy - 70 - Math.random() * 90, k: Math.random() < .5 ? 'shield' : 'mag' });
        ups.forEach(function (u) { u.x -= sp * dt; if (!u.hit && Math.abs(u.x - kx) < 34 && Math.abs(u.y - ky) < 46) { u.hit = true; pw[u.k] = u.k === 'shield' ? 15 : 9; a.ev('pw_' + u.k); a.pop(u.x, u.y - 22, u.k === 'shield' ? 'Gumka!' : 'Magnes!', '#fff'); a.burst(u.x, u.y, '#ffcf4a', 10); } });
        ramps.forEach(function (rp) { rp.x -= sp * dt; if (!rp.used && P.y === 0 && Math.abs(rp.x - kx) < 30) { rp.used = true; P.vy = -830; P.j = 1; P.spin = true; a.ev('ramp'); a.pop(kx, gy - 90, 'FALA!', '#7dd3fc'); a.burst(kx, gy, '#fff', 12); } });
        if (dist >= nextMs) { a.pop(W / 2, 110, nextMs + ' m!', '#ffcf4a'); nextMs += 500; }
        var bi = Math.floor(dist / 400); if (bi > lastBi) { lastBi = bi; a.pop(W / 2, 150, PALS[bi % 4].name, '#fff'); }
        var feet = ky + 30, duckOn = P.duck > 0 && P.y === 0;
        obs.forEach(function (o) {
          o.x -= sp * dt;
          if (o.gone) return;
          var hitIt = false;
          if (o.fly) { if (Math.abs(o.x - kx) < 34 && !duckOn && feet - 74 < gy - 72 && feet > gy - 118) hitIt = true; if (!o.pass && o.x < kx - 34) { o.pass = true; if (duckOn) a.ev('duck'); } }
          else if (Math.abs(o.x - kx) < 30 && feet > gy - o.h) hitIt = true;
          if (hitIt) { if (pw.shield > 0) { pw.shield = 0; o.gone = true; a.ev('shieldsave'); a.pop(o.x, gy - 100, 'Gumka pękła!', '#c4b5fd'); a.burst(o.x, gy - 80, '#f59e0b', 14); } else { a.shake(16); a.over(); } }
        });
        drops.forEach(function (d) { d.x -= sp * dt; if (pw.mag > 0 && d.x > kx - 40 && d.x < kx + 240) { d.x += (kx - d.x) * dt * 4; d.y += (ky - d.y) * dt * 4; } if (!d.hit && Math.abs(d.x - kx) < 30 && Math.abs(d.y - ky) < 42) { d.hit = true; dist += 10; a.ev('drop'); a.pop(d.x, d.y - 16, '+10', '#5cc8ff'); a.burst(d.x, d.y, '#5cc8ff', 8); } });
        obs = obs.filter(function (o) { return o.x > -80 && !o.gone; }); drops = drops.filter(function (d) { return !d.hit && d.x > -30; }); ups = ups.filter(function (u) { return !u.hit && u.x > -30; }); ramps = ramps.filter(function (rp) { return rp.x > -200; });
        if (Math.random() < dt * 14 && P.y === 0) a.burst(kx - 34, gy + 2, '#ffffff', 1);
        a.mx('dist', Math.floor(dist)); a.setScore(Math.floor(dist));
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t, gy = H * .74, kx = W * .25, bm = biome(dist || 0), w = bm.w, sp = 270 + t * 9;
        var gr = c.createLinearGradient(0, 0, 0, gy); gr.addColorStop(0, bm.s0); gr.addColorStop(.55, bm.s1); gr.addColorStop(1, bm.s2); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        var star = Math.min(1, w[1] + w[3] * .8 + w[2] * .5);
        if (star > .02) { for (var si = 0; si < 46; si++) { c.fillStyle = 'rgba(255,255,255,' + (star * (.45 + .45 * Math.sin(t * 2 + si))) + ')'; c.fillRect((si * 97) % W, (si * 53) % (gy * .62), si % 4 ? 1.5 : 2.5, si % 4 ? 1.5 : 2.5); } }
        if (w[3] > .02) { c.save(); c.globalCompositeOperation = 'lighter'; for (var ar = 0; ar < 3; ar++) { var ag = c.createLinearGradient(0, gy * .1, 0, gy * .6); ag.addColorStop(0, 'rgba(80,255,190,0)'); ag.addColorStop(.4, ['rgba(80,255,190,', 'rgba(120,140,255,', 'rgba(60,230,230,'][ar] + (.32 * w[3]) + ')'); ag.addColorStop(1, 'rgba(80,255,190,0)'); c.fillStyle = ag; c.beginPath(); c.moveTo(0, gy * .6); for (var ax = 0; ax <= W; ax += 14) c.lineTo(ax, gy * (.22 + ar * .07) + Math.sin(ax / 70 + t * .7 + ar * 2) * 26); c.lineTo(W, gy * .6); c.closePath(); c.fill(); } c.restore(); }
        c.save(); var sx = W * .72;
        if (w[0] > .02) { c.globalAlpha = w[0]; c.shadowColor = '#ffd36b'; c.shadowBlur = 50; c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(sx, gy - 10, 54, 0, 7); c.fill(); }
        c.shadowBlur = 0;
        var mw = w[1] + w[3] * .85; if (mw > .02) { c.globalAlpha = mw; c.shadowColor = '#cfe0ff'; c.shadowBlur = 40; c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(sx, gy * .34, 34, 0, 7); c.fill(); c.shadowBlur = 0; c.fillStyle = 'rgba(160,150,120,.35)'; [[-10, -6, 8], [8, 8, 6], [10, -12, 4]].forEach(function (cr) { c.beginPath(); c.arc(sx + cr[0], gy * .34 + cr[1], cr[2], 0, 7); c.fill(); }); }
        if (w[2] > .02) { c.globalAlpha = w[2]; var ng = c.createLinearGradient(0, gy - 86, 0, gy + 20); ng.addColorStop(0, '#ffe45e'); ng.addColorStop(1, '#ff2d95'); c.shadowColor = '#ff4fd8'; c.shadowBlur = 40; c.fillStyle = ng; c.beginPath(); c.arc(sx, gy - 28, 62, 0, 7); c.fill(); c.shadowBlur = 0; c.fillStyle = bm.s2; for (var sb = 0; sb < 6; sb++) c.fillRect(sx - 64, gy - 34 + sb * 12, 128, 2 + sb); }
        c.restore();
        c.fillStyle = 'rgba(255,255,255,.4)'; clouds.forEach(function (cl) { var x = ((cl.x * W - t * 18 * cl.s) % (W + 200) + W + 200) % (W + 200) - 100, y = cl.y * H; c.beginPath(); c.ellipse(x, y, 46 * cl.s, 12 * cl.s, 0, 0, 7); c.ellipse(x + 26 * cl.s, y - 8 * cl.s, 26 * cl.s, 12 * cl.s, 0, 0, 7); c.fill(); });
        if (w[0] + w[1] > .3) { c.strokeStyle = 'rgba(30,20,40,' + (.55 * (w[0] + w[1])) + ')'; c.lineWidth = 2; birds.forEach(function (b) { var x = ((b.x * W + t * 34) % (W + 80)), y = b.y * H + Math.sin(t + b.p) * 8, f = Math.sin(t * 9 + b.p) * 4; c.beginPath(); c.moveTo(x - 8, y - f); c.quadraticCurveTo(x - 3, y - 4, x, y); c.quadraticCurveTo(x + 3, y - 4, x + 8, y - f); c.stroke(); }); }
        c.fillStyle = bm.sil; var io = (travel * .06) % 1700;
        isl.forEach(function (o) { for (var rep = -1; rep <= 1; rep++) { var x = o.x - io + rep * 1700 + 20; if (x > W + 40 || x < -o.w - 40) continue;
          if (o.k === 'isl') { c.beginPath(); c.moveTo(x, gy); c.quadraticCurveTo(x + o.w * .5, gy - o.h * 1.6, x + o.w, gy); c.fill(); c.fillRect(x + o.w * .5, gy - o.h * 1.5, 3, o.h * .7); c.beginPath(); c.ellipse(x + o.w * .5 + 1, gy - o.h * 1.5, 16, 6, 0, 0, 7); c.fill(); }
          else if (o.k === 'lh') { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + 8, gy - 62); c.lineTo(x + 22, gy - 62); c.lineTo(x + 30, gy); c.fill(); c.fillRect(x + 6, gy - 72, 18, 10); if (w[1] + w[2] + w[3] > .3) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,240,180,' + (.28 * Math.max(0, Math.sin(t * 1.5))) + ')'; c.beginPath(); c.moveTo(x + 15, gy - 67); c.lineTo(x - 130, gy - 100); c.lineTo(x - 130, gy - 40); c.fill(); c.restore(); } }
          else { var bw = 16; for (var bx2 = 0; bx2 < o.w; bx2 += bw + 2) { var bh = 20 + ((bx2 * 7 + o.s * 90) % 38); c.fillRect(x + bx2, gy - bh, bw, bh); } } } });
        var sea = c.createLinearGradient(0, gy - 6, 0, H); sea.addColorStop(0, bm.w0); sea.addColorStop(1, bm.w1); c.fillStyle = sea; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W; x += 8) c.lineTo(x, gy + Math.sin((x + t * 320) / 40) * 6); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        c.fillStyle = 'rgba(255,255,255,.06)'; for (var wl = 0; wl < 4; wl++) { c.beginPath(); c.moveTo(0, gy + 24 + wl * 26); for (x = 0; x <= W; x += 10) c.lineTo(x, gy + 24 + wl * 26 + Math.sin((x + t * (120 + wl * 60)) / (30 + wl * 12)) * (3 + wl)); c.lineTo(W, gy + 70 + wl * 26); c.lineTo(0, gy + 70 + wl * 26); c.fill(); }
        if (w[2] > .02) { c.save(); c.globalAlpha = w[2]; c.strokeStyle = '#ff4fd8'; c.shadowColor = '#ff4fd8'; c.shadowBlur = 6; c.lineWidth = 1.2; for (var gl = -8; gl <= 8; gl++) { c.beginPath(); c.moveTo(sx + gl * 6, gy + 2); c.lineTo(sx + gl * 70, H); c.stroke(); } for (gl = 0; gl < 7; gl++) { var gyy = gy + Math.pow(((gl + (t * .8) % 1) / 7), 2) * (H - gy); c.beginPath(); c.moveTo(0, gyy); c.lineTo(W, gyy); c.stroke(); } c.restore(); }
        c.fillStyle = 'rgba(255,255,255,.7)'; for (x = 0; x <= W; x += 8) c.fillRect(x, gy + Math.sin((x + t * 320) / 40) * 6 - 2, 5, 3);
        var gl2 = w[0] > .5 ? 'rgba(255,211,107,.28)' : w[2] > .5 ? 'rgba(255,100,220,.28)' : 'rgba(200,220,255,.2)'; c.fillStyle = gl2; for (var rr = 0; rr < 7; rr++) c.fillRect(sx - 50 + Math.sin(t * 3 + rr) * 8, gy + 14 + rr * 12, 100 - rr * 11, 3);
        (ramps || []).forEach(function (rp) { var x = rp.x; c.fillStyle = bm.w0; c.beginPath(); c.moveTo(x - 90, gy + 4); c.quadraticCurveTo(x - 20, gy - 4, x + 30, gy - 40); c.quadraticCurveTo(x + 60, gy - 6, x + 70, gy + 4); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 60, gy); c.quadraticCurveTo(x - 10, gy - 6, x + 30, gy - 40); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(x + 32, gy - 38, 5, 0, 7); c.arc(x + 20, gy - 32, 4, 0, 7); c.fill(); });
        (drops || []).forEach(function (d) { dropPath(c, d.x, d.y + Math.sin(t * 5 + d.x / 40) * 4, 9, '#5cc8ff', true); });
        (ups || []).forEach(function (u) { badge(c, u.x, u.y, u.k, t); });
        (obs || []).forEach(function (o) {
          if (o.fly) {
            var dy = gy - 128 + Math.sin(t * 4 + o.x / 50) * 3;
            c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(o.x - 20, dy + 8); c.lineTo(o.x - 20, dy + 34); c.moveTo(o.x + 20, dy + 8); c.lineTo(o.x + 20, dy + 34); c.stroke();
            c.fillStyle = o.k[1]; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(o.x - 34, dy + 30, 68, 30, 8); c.fill(); c.stroke(); c.fillStyle = o.k[2]; c.font = '900 11px Figtree, Arial'; c.textAlign = 'center'; c.fillText(o.k[0], o.x, dy + 50);
            c.fillStyle = '#23202e'; c.beginPath(); c.roundRect(o.x - 26, dy - 4, 52, 16, 8); c.fill(); c.stroke(); c.fillStyle = Math.sin(t * 10) > 0 ? '#ff3b5c' : '#5cff9a'; c.beginPath(); c.arc(o.x, dy + 4, 3, 0, 7); c.fill();
            c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 2.5; [-30, 30].forEach(function (rx) { var rw = 16 * Math.abs(Math.cos(t * 40 + rx)); c.beginPath(); c.moveTo(o.x + rx - rw, dy - 7); c.lineTo(o.x + rx + rw, dy - 7); c.stroke(); });
          } else {
            c.fillStyle = 'rgba(0,20,50,.25)'; c.beginPath(); c.ellipse(o.x, gy + 8, 34, 6, 0, 0, 7); c.fill();
            c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(o.x, gy + 2, 22, 8, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#d6001c'; c.fillRect(o.x - 6, gy - 5, 12, 14);
            c.fillStyle = '#5b3a1e'; c.fillRect(o.x - 3, gy - o.h + 20, 6, o.h - 10);
            c.fillStyle = o.k[1]; c.beginPath(); c.roundRect(o.x - 28, gy - o.h - 4, 56, 30, 7); c.fill(); c.stroke();
            c.fillStyle = o.k[2]; c.font = '900 12px Figtree, Arial'; c.textAlign = 'center'; c.fillText(o.k[0], o.x, gy - o.h + 16);
          }
        });
        if (P) {
          var by = gy + P.y - 40, air = P.y < -2, dk = P.duck > 0 && !air;
          c.fillStyle = 'rgba(0,15,40,' + (.3 * Math.max(.25, 1 + P.y / 260)) + ')'; c.beginPath(); c.ellipse(kx, gy + 10, 46 * Math.max(.5, 1 + P.y / 300), 7, 0, 0, 7); c.fill();
          if (!air) { c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(kx - 34, gy + 3); c.lineTo(kx - 150 - Math.sin(t * 12) * 8, gy + 14); c.lineTo(kx - 150, gy - 1); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; c.beginPath(); c.arc(kx, gy + 4, 54 + Math.sin(t * 6) * 3, .15, Math.PI - .15); c.stroke(); }
          c.save(); c.translate(kx, by + 14); c.rotate(air ? Math.atan(P.vy / 900) * .45 + P.rot : Math.sin(t * 8) * .04);
          if (dk) c.scale(1.12, .66);
          c.shadowColor = 'rgba(255,200,80,.5)'; c.shadowBlur = 14;
          var bg2 = c.createLinearGradient(0, 18, 0, 36); bg2.addColorStop(0, '#ffd75a'); bg2.addColorStop(1, '#ff9a2e'); c.fillStyle = bg2; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 28, 50, 8, 0, 0, 7); c.fill(); c.stroke(); c.shadowBlur = 0; c.fillStyle = '#d6001c'; c.fillRect(-40, 26, 80, 4); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(-36, 22, 40, 2);
          drawK(c, img, 0, -18, 92, 0);
          if (pw.shield > 0) { c.strokeStyle = 'rgba(167,139,250,.9)'; c.lineWidth = 4; c.beginPath(); c.arc(0, -22, 58, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
          c.restore();
          pills(c, [['Magnes', pw.mag, '#ef4444', 9], ['Gumka', pw.shield, '#f59e0b', 15]], 12, 62);
        }
        if (sp > 420) { c.strokeStyle = 'rgba(255,255,255,' + Math.min(.35, (sp - 420) / 1200) + ')'; c.lineWidth = 1.5; for (var sl = 0; sl < 9; sl++) { var ly = (sl * 83 + 17) % (gy - 40) + 20, lx = W - ((t * sp * 1.6 + sl * 131) % (W + 140)); c.beginPath(); c.moveTo(lx, ly); c.lineTo(lx + 70, ly); c.stroke(); } }
        c.font = '900 12px Figtree, Arial'; c.textAlign = 'left'; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText(PALS[bm.i].name.toUpperCase() + ' · ' + Math.round(sp / 2.7) + ' KM/H', 14, H - 14);
        if (combo > 1) { c.textAlign = 'right'; c.fillStyle = '#ffcf4a'; c.fillText('TRIKI ×' + combo, W - 14, H - 14); }
      }
    });
  }

  /* ============== KRĘGLE ============== */
  function kregle(el) {
    var kn = knagaImg('ziomek'), L, pins, ball, st, stT, rolls, frame, thrNo, tenth, drag, tThrow, rack0, msgT = 0, msg = '', trail = [], settle = 0, hits = 0, lastK = 0, streak = 0;
    var SLOTS = [[0, 0], [-.5, 1], [.5, 1], [-1, 2], [0, 2], [1, 2], [-1.5, 3], [-.5, 3], [.5, 3], [1.5, 3]];
    function bowlScore(r) { var t = 0, i = 0; for (var f = 0; f < 10; f++) { if (i >= r.length) break; if (r[i] === 10) { t += 10 + (r[i + 1] || 0) + (r[i + 2] || 0); i++; } else if (r[i + 1] !== undefined) { t += r[i] + r[i + 1] + (r[i] + r[i + 1] === 10 ? (r[i + 2] || 0) : 0); i += 2; } else { t += r[i]; i++; } } return t; }
    function frames(r) {
      var out = [], i = 0, cum = 0;
      for (var f = 0; f < 10; f++) {
        var fr = { a: null, b: null, c: null, t: null };
        if (i < r.length) {
          if (f < 9) { if (r[i] === 10) { fr.a = 10; if (r[i + 1] !== undefined && r[i + 2] !== undefined) fr.t = 10 + r[i + 1] + r[i + 2]; i++; } else { fr.a = r[i]; if (r[i + 1] !== undefined) { fr.b = r[i + 1]; if (fr.a + fr.b === 10) { if (r[i + 2] !== undefined) fr.t = 10 + r[i + 2]; } else fr.t = fr.a + fr.b; i += 2; } else i++; } }
          else { fr.a = r[i]; fr.b = r[i + 1]; fr.c = r[i + 2]; var n = r.length - i, full = fr.a === 10 || (fr.b !== undefined && fr.a + fr.b === 10); if (full ? n >= 3 : n >= 2) fr.t = (fr.a || 0) + (fr.b || 0) + (fr.c || 0); i = r.length; }
        }
        if (fr.t !== null && cum !== null) { cum += fr.t; fr.cum = cum; } else { cum = null; fr.cum = null; }
        out.push(fr);
      }
      return out;
    }
    function geo(a) { var W = a.W, H = a.H, laneW = Math.min(W * .64, 270), pr = laneW / 17, sx = pr * 3.4, sy = sx * .866, yBack = Math.max(136, H * .27); return { W: W, H: H, cx: W / 2, laneW: laneW, gW: laneW * .13, pr: pr, sx: sx, sy: sy, yBack: yBack, yHead: yBack + 3 * sy, br: pr * 1.75, y0: H - Math.max(64, H * .11) }; }
    function slotPos(i) { return [L.cx + SLOTS[i][0] * L.sx, L.yHead - SLOTS[i][1] * L.sy]; }
    function rackNew() { pins = SLOTS.map(function (s, i) { var p = slotPos(i); return { i: i, x: p[0], y: p[1], vx: 0, vy: 0, r: L.pr, down: false, gone: false, fade: 1, ang: 0 }; }); }
    function respot() { pins = pins.filter(function (p) { return !p.down && !p.gone; }); pins.forEach(function (p) { var q = slotPos(p.i); p.x = q[0]; p.y = q[1]; p.vx = p.vy = 0; }); }
    function newBall() { ball = { x: L.cx, y: L.y0, vx: 0, vy: 0, live: false, gut: false, hook: 0, ready: true }; trail = []; }
    function finish(a) {
      var k = pins.filter(function (p) { return p.down; }).length; lastK = k; rolls.push(k); a.ev('pins', k); a.setScore(bowlScore(rolls));
      var strike = k === 10 && rack0 === 10, spare = !strike && k === rack0 && rack0 < 10 && thrNo >= 2;
      var txt = strike ? 'STRIKE!' : (k === rack0 && rack0 > 0 && (thrNo >= 2 || frame === 10) && !strike ? 'SPARE!' : (k === 0 ? (ball.gut ? 'RYNNA…' : 'PUDŁO') : k + ' ' + (k === 1 ? 'kręgiel' : k < 5 ? 'kręgle' : 'kręgli')));
      if (strike) { a.ev('strike'); streak++; a.mx('turkey', streak); a.shake(12); a.burst(L.cx, L.yHead - L.sy * 1.5, '#ffcf4a', 26); if (Math.abs(ball.hook) > .5) a.ev('hookstrike'); } else { streak = 0; if (txt === 'SPARE!') { a.ev('spare'); a.burst(L.cx, L.yHead - L.sy * 1.5, '#7dd3fc', 16); } }
      if (k === 0 && ball.gut) a.ev('gutter');
      msg = txt; msgT = 1.3; a.pop(L.cx, L.yHead - L.sy * 3.6, txt, strike ? '#ffcf4a' : txt === 'SPARE!' ? '#7dd3fc' : '#fff');
      // następny rzut / ramka
      var next = 'aim', fresh = false, done = false;
      if (frame < 10) { if (thrNo === 1 && k < 10) { thrNo = 2; } else { frame++; thrNo = 1; fresh = true; } }
      else {
        tenth.push(k); var n = tenth.length;
        if (n === 1) { fresh = k === 10; }
        else if (n === 2) { if (tenth[0] === 10) { fresh = k === 10; } else if (tenth[0] + k === 10) { fresh = true; } else done = true; }
        else done = true;
        thrNo = n + 1;
      }
      st = done ? 'done' : 'sweep'; stT = 0; ball.fresh = fresh;
      if (frame === 10 && !done && tenth.length === 0) {}
    }
    canvasGame(el, G('kregle'), {
      ratio: '2 / 3',
      intro: 'Zacznij palec tam, gdzie ma ruszyć kula, i machnij w górę. Zakręć palcem, a kula dostanie efekt. To 10 ramek, w każdej dwa rzuty. Strike i spare dają bonusowe punkty jak w prawdziwych kręglach.',
      keys: [['machnij w górę', 'rzut'], ['zakręć palcem', 'efekt']],
      endText: function (s) { return s >= 230 ? ['Legenda toru. Pełne trybuny!', 'gwiazdor'] : s >= 150 ? ['Świetny wynik. Kręgielnia klaszcze!', 'ziomek'] : s >= 90 ? ['Całkiem nieźle jak na rozgrzewkę.', 'imprezowa'] : ['Kręgle nie lubią Knagi. Spróbuj jeszcze raz.', 'niesmiala']; },
      init: function (a, cv) {
        cv.style.touchAction = 'none';
        var pos = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
        var dn = function (e) { if (a.counting || st !== 'aim' || !$('#gry-over').hidden || !L) return; var p = pos(e); drag = { pts: [p] }; ball.x = Math.max(L.cx - L.laneW / 2 + L.br, Math.min(L.cx + L.laneW / 2 - L.br, p.x)); try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
        var mv = function (e) { if (!drag) return; var p = pos(e); drag.pts.push(p); if (drag.pts.length > 60) drag.pts.shift(); var f = drag.pts[0]; if (f.y - p.y < 14) ball.x = Math.max(L.cx - L.laneW / 2 + L.br, Math.min(L.cx + L.laneW / 2 - L.br, p.x)); };
        var upf = function (e) {
          if (!drag) return; var P = drag.pts, f = P[0], l = P[P.length - 1]; drag = null;
          if (st !== 'aim') return; if (f.y - l.y < 50) { msg = 'Machnij mocniej w górę'; msgT = 1.1; return; }
          var w = P.filter(function (q) { return l.t - q.t < 140; }), q0 = w[0], dt = Math.max(16, l.t - q0.t) / 1000, vxf = (l.x - q0.x) / dt, vyf = (l.y - q0.y) / dt;
          var spd = Math.max(520, Math.min(1000, Math.hypot(vxf, vyf) * .42)), ang = Math.max(-.4, Math.min(.4, Math.atan2(vxf, -vyf))), mid = P[Math.floor(P.length / 2)], len = Math.hypot(l.x - f.x, l.y - f.y) || 1, dev = mid.x - (f.x + l.x) / 2;
          ball.vx = spd * Math.sin(ang); ball.vy = -spd * Math.cos(ang); ball.hook = Math.max(-1, Math.min(1, dev / len * 6)); ball.live = true; ball.ready = false; st = 'roll'; tThrow = 0; settle = 0; hits = 0; rack0 = pins.length; trail = [];
        };
        cv.addEventListener('pointerdown', dn); cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', upf); cv.addEventListener('pointercancel', function () { drag = null; });
      },
      reset: function (a) { L = geo(a); rolls = []; frame = 1; thrNo = 1; tenth = []; streak = 0; rackNew(); newBall(); st = 'aim'; stT = 0; drag = null; msgT = 0; rack0 = 10; },
      step: function (a, dt) {
        if (!L || L.W !== a.W || L.H !== a.H) { L = geo(a); if (st === 'aim') { pins.forEach(function (p) { var q = slotPos(p.i); p.x = q[0]; p.y = q[1]; }); newBall(); } }
        msgT = Math.max(0, msgT - dt); stT += dt;
        if (st === 'roll') {
          tThrow += dt; var sub = 4, h = dt / sub, hit = false;
          for (var s = 0; s < sub; s++) {
            if (ball.live) {
              if (!ball.gut) { var prog = Math.max(0, Math.min(1, (L.y0 - ball.y) / (L.y0 - L.yHead))), kk = Math.max(0, (prog - .3) / .7); ball.vx += ball.hook * 300 * kk * h * (Math.abs(ball.vy) / 700); }
              ball.vx *= 1 - .04 * h; ball.vy *= 1 - .16 * h; ball.x += ball.vx * h; ball.y += ball.vy * h;
              if (!ball.gut && Math.abs(ball.x - L.cx) > L.laneW / 2 + L.br * .1) { ball.gut = true; ball.side = ball.x > L.cx ? 1 : -1; }
              if (ball.gut) { ball.x = L.cx + ball.side * (L.laneW / 2 + L.gW / 2); ball.vx = 0; ball.vy = -Math.max(Math.abs(ball.vy), 300); }
              if (ball.y < L.yBack - L.pr * 3.5) ball.live = false;
              if (ball.live && tThrow % .02 < dt) trail.push({ x: ball.x, y: ball.y, l: .35 });
            }
            var bodies = pins.filter(function (p) { return !p.gone; });
            bodies.forEach(function (p) { p.x += p.vx * h; p.y += p.vy * h; var d = Math.exp(-2.8 * h); p.vx *= d; p.vy *= d; if (p.down) p.ang += Math.hypot(p.vx, p.vy) * h * .02; });
            var pairs = [];
            if (ball.live && !ball.gut) bodies.forEach(function (p) { pairs.push([ball, p, 3.2, 1]); });
            for (var i = 0; i < bodies.length; i++) for (var j = i + 1; j < bodies.length; j++) { if (bodies[i].fade < .5 || bodies[j].fade < .5) continue; pairs.push([bodies[i], bodies[j], 1, 1]); }
            pairs.forEach(function (pr2) {
              var A = pr2[0], Bb = pr2[1], ra = A === ball ? L.br : A.r, rb = Bb.r, dx = Bb.x - A.x, dy = Bb.y - A.y, d2 = dx * dx + dy * dy, rr = ra + rb;
              if (d2 >= rr * rr || d2 < .0001) return;
              var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, ma = pr2[2], mb = 1, rvn = (Bb.vx - A.vx) * nx + (Bb.vy - A.vy) * ny;
              var ov = rr - d; if (A === ball) { Bb.x += nx * ov; Bb.y += ny * ov; } else { A.x -= nx * ov / 2; A.y -= ny * ov / 2; Bb.x += nx * ov / 2; Bb.y += ny * ov / 2; }
              if (rvn < 0) { var j2 = -(1 + .75) * rvn / (1 / ma + 1 / mb); A.vx -= j2 * nx / ma; A.vy -= j2 * ny / ma; Bb.vx += j2 * nx / mb; Bb.vy += j2 * ny / mb; if (A === ball) { hit = true; } A.hit = Bb.hit = true; }
            });
            bodies.forEach(function (p) {
              if (!p.down && (Math.hypot(p.vx, p.vy) > 26 || (p.hit && Math.hypot(p.x - slotPos(p.i)[0], p.y - slotPos(p.i)[1]) > p.r * .55))) p.down = true;
              if (Math.abs(p.x - L.cx) > L.laneW / 2 + L.gW * .5 || p.y < L.yBack - L.pr * 3.2) { p.down = true; p.gone = true; }
              if (p.down && Math.hypot(p.vx, p.vy) < 10) p.fade -= dt * .4 / sub;
            });
          }
          trail.forEach(function (q) { q.l -= dt; }); trail = trail.filter(function (q) { return q.l > 0; });
          var moving = pins.some(function (p) { return !p.gone && Math.hypot(p.vx, p.vy) > 14; });
          if (!ball.live && !moving) settle += dt; else settle = 0;
          if (settle > .45 || tThrow > 5.5) finish(a);
        } else if (st === 'sweep') {
          pins.forEach(function (p) { if (p.down) p.fade = Math.max(0, p.fade - dt * 2.2); });
          if (stT > .85) { if (ball.fresh) rackNew(); else respot(); newBall(); st = 'aim'; stT = 0; }
        } else if (st === 'done') { if (stT > 1.2) a.over(); }
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t; if (!L) L = geo(a);
        var bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#d9f7ee'); bg.addColorStop(.5, '#bdeee0'); bg.addColorStop(1, '#8fdcc8'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.5)'; for (var k = 0; k < 7; k++) { c.beginPath(); c.arc(W * (k / 6), 150 + (k % 2) * 40, 70, 0, 7); c.fill(); }
        var lx = L.cx - L.laneW / 2, rx = L.cx + L.laneW / 2, top = L.yBack - L.pr * 4.2, deck = top + L.pr * 3.2;
        // rynny
        var gtt = c.createLinearGradient(lx - L.gW, 0, lx, 0); gtt.addColorStop(0, '#9aa7b4'); gtt.addColorStop(1, '#5f6c79'); c.fillStyle = gtt; c.fillRect(lx - L.gW, deck, L.gW, H - deck);
        var gtt2 = c.createLinearGradient(rx, 0, rx + L.gW, 0); gtt2.addColorStop(0, '#5f6c79'); gtt2.addColorStop(1, '#9aa7b4'); c.fillStyle = gtt2; c.fillRect(rx, deck, L.gW, H - deck);
        c.fillStyle = '#1d2b3a'; c.fillRect(lx - L.gW - 6, deck, 6, H - deck); c.fillRect(rx + L.gW, deck, 6, H - deck);
        // tył (kolektor)
        var bk = c.createLinearGradient(0, top, 0, deck); bk.addColorStop(0, '#2a3a4a'); bk.addColorStop(1, '#1d2b3a'); c.fillStyle = bk; c.beginPath(); c.roundRect(lx - L.gW - 6, top, L.laneW + L.gW * 2 + 12, deck - top + 4, [12, 12, 0, 0]); c.fill();
        // tor
        var lg = c.createLinearGradient(lx, 0, rx, 0); lg.addColorStop(0, '#e2b06a'); lg.addColorStop(.5, '#f7d9a0'); lg.addColorStop(1, '#e2b06a'); c.fillStyle = lg; c.fillRect(lx, deck, L.laneW, H - deck);
        c.strokeStyle = 'rgba(150,90,30,.22)'; c.lineWidth = 1; for (k = 1; k < 13; k++) { c.beginPath(); c.moveTo(lx + k * L.laneW / 13, deck); c.lineTo(lx + k * L.laneW / 13, H); c.stroke(); }
        var gl = c.createLinearGradient(0, deck, 0, H); gl.addColorStop(0, 'rgba(255,255,255,.35)'); gl.addColorStop(.45, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.18)'); c.fillStyle = gl; c.fillRect(lx, deck, L.laneW, H - deck);
        c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(lx, deck, 5, H - deck); c.fillRect(rx - 5, deck, 5, H - deck);
        c.fillStyle = 'rgba(120,60,20,.5)'; for (k = -3; k <= 3; k++) { var ax = L.cx + k * L.laneW * .12, ay = L.y0 - 140 - (3 - Math.abs(k)) * 9; c.beginPath(); c.moveTo(ax, ay - 9); c.lineTo(ax - 5, ay + 5); c.lineTo(ax + 5, ay + 5); c.fill(); }
        c.fillStyle = 'rgba(120,60,20,.35)'; for (k = -2; k <= 2; k++) { c.beginPath(); c.arc(L.cx + k * L.laneW * .15, L.y0 - 56, 3, 0, 7); c.fill(); }
        c.strokeStyle = '#d6247f'; c.lineWidth = 3; c.beginPath(); c.moveTo(lx, L.y0 + L.br + 12); c.lineTo(rx, L.y0 + L.br + 12); c.stroke();
        trail.forEach(function (q) { c.fillStyle = 'rgba(255,255,255,' + q.l * .55 + ')'; c.beginPath(); c.arc(q.x, q.y, L.br * .55 * q.l / .35 + 2, 0, 7); c.fill(); });
        (pins || []).slice().sort(function (p1, p2) { return p1.y - p2.y; }).forEach(function (p) {
          if (p.fade <= .01) return; c.save(); c.globalAlpha = Math.max(0, p.fade); c.translate(p.x, p.y); var r = p.r;
          c.fillStyle = 'rgba(60,30,10,.22)'; c.beginPath(); c.ellipse(2, 3, r * (p.down ? 1.1 : .8), r * (p.down ? .75 : .55), 0, 0, 7); c.fill();
          if (p.down) { if (p.rot === undefined) p.rot = Math.atan2(p.vy, p.vx) + 1.57 + (Math.random() - .5); c.rotate(p.rot); }
          c.lineWidth = 2; c.strokeStyle = '#2a1620';
          var body = c.createLinearGradient(-r, 0, r, 0); body.addColorStop(0, '#e9eef2'); body.addColorStop(.35, '#fff'); body.addColorStop(1, '#c4ccd4');
          c.fillStyle = body; c.beginPath(); c.moveTo(-r * .38, -r * .95); c.bezierCurveTo(-r * 1.1, -r * .3, -r * 1.0, r * .9, -r * .55, r * 1.15); c.lineTo(r * .55, r * 1.15); c.bezierCurveTo(r * 1.0, r * .9, r * 1.1, -r * .3, r * .38, -r * .95); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.arc(0, -r * 1.2, r * .46, 0, 7); c.fill(); c.stroke();
          c.fillStyle = '#d6001c'; c.fillRect(-r * .62, -r * .45, r * 1.24, r * .2); c.fillRect(-r * .68, -r * .12, r * 1.36, r * .2);
          c.restore();
        });
        if (ball) {
          c.save(); c.translate(ball.x, ball.y); c.fillStyle = 'rgba(60,30,10,.25)'; c.beginPath(); c.ellipse(3, 5, L.br, L.br * .8, 0, 0, 7); c.fill();
          var b2 = c.createRadialGradient(-L.br * .35, -L.br * .4, L.br * .1, 0, 0, L.br); b2.addColorStop(0, '#ff9ccf'); b2.addColorStop(.4, '#d6247f'); b2.addColorStop(1, '#5a0a3a'); c.fillStyle = b2; c.strokeStyle = '#2a1620'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, L.br, 0, 7); c.fill(); c.stroke();
          c.fillStyle = '#2a1020'; [[-.22, -.05], [.12, -.26], [.14, .06]].forEach(function (h) { c.beginPath(); c.arc(h[0] * L.br * 1.4, h[1] * L.br * 1.4, L.br * .13, 0, 7); c.fill(); }); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-L.br * .4, -L.br * .45, L.br * .2, L.br * .12, -.6, 0, 7); c.fill(); c.restore();
        }
        if (st === 'aim' && kn.complete) { c.save(); c.translate(L.cx - L.laneW / 2 - L.gW - 2, L.y0 + 36); c.drawImage(kn, -54, -48, 108, 108); c.restore(); }
        if (drag && drag.pts.length > 1 && ball && !ball.live) { var P = drag.pts, f = P[0], l = P[P.length - 1]; if (f.y - l.y > 14) { c.save(); c.setLineDash([6, 8]); c.strokeStyle = '#d6247f'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(ball.x + (l.x - f.x) * .9, ball.y + (l.y - f.y) * .9); c.stroke(); c.restore(); } }
        // tabela wyników
        var fr = frames(rolls), cw = Math.min(W - 20, 440) / 10, x0 = (W - cw * 10) / 2, y0 = 62;
        c.fillStyle = '#fff'; c.strokeStyle = '#2a1620'; c.lineWidth = 3; c.beginPath(); c.roundRect(x0 - 4, y0 - 4, cw * 10 + 8, 58, 12); c.fill(); c.stroke();
        var sym = function (v, prev) { if (v === null || v === undefined) return ''; if (v === 10) return 'X'; if (prev !== undefined && prev !== null && prev !== 10 && prev + v === 10) return '/'; return v === 0 ? '-' : String(v); };
        fr.forEach(function (f, i) {
          var x = x0 + i * cw, cur = (i + 1 === frame) && st !== 'done'; if (cur) { c.fillStyle = 'rgba(214,36,127,.14)'; c.fillRect(x, y0, cw, 50); } c.strokeStyle = 'rgba(42,22,32,.18)'; c.lineWidth = 1; c.strokeRect(x, y0, cw, 50);
          c.fillStyle = '#2a1620'; c.font = '800 ' + Math.max(10, cw * .3) + 'px Figtree, Arial'; c.textAlign = 'center';
          var a1 = f.a !== null ? sym(f.a) : '', b1 = f.b !== null && f.b !== undefined ? sym(f.b, f.a) : '', c1 = f.c !== null && f.c !== undefined ? sym(f.c, f.b === 10 || (f.a !== 10 && f.a + f.b === 10) ? 0 : f.b) : '';
          if (i < 9) { c.fillText(f.a === 10 ? '' : a1, x + cw * .3, y0 + 15); c.fillText(f.a === 10 ? 'X' : b1, x + cw * .74, y0 + 15); } else { c.fillText(a1, x + cw * .2, y0 + 15); c.fillText(b1, x + cw * .5, y0 + 15); c.fillText(c1, x + cw * .8, y0 + 15); }
          c.font = '900 ' + Math.max(11, cw * .38) + 'px "Bricolage Grotesque", Figtree, Arial'; c.fillText(f.cum !== null ? f.cum : '', x + cw / 2, y0 + 41);
        });
        c.font = '900 12px Figtree, Arial'; c.textAlign = 'left'; c.fillStyle = '#134e4a'; c.fillText('RAMKA ' + Math.min(10, frame) + '/10 · RZUT ' + (frame < 10 ? thrNo : Math.min(3, tenth.length + 1)), 14, H - 14);
        if (msgT > 0 && st === 'aim' && msg === 'Machnij mocniej w górę') { c.textAlign = 'center'; c.fillStyle = '#134e4a'; c.font = '800 14px Figtree, Arial'; c.fillText(msg, W / 2, L.y0 - 70); }
        else if (st === 'aim' && rolls.length === 0 && !drag) { c.textAlign = 'center'; c.fillStyle = '#134e4a'; c.font = '800 13px Figtree, Arial'; c.fillText('Machnij palcem w górę od kuli', W / 2, L.y0 - 56 + Math.sin(t * 4) * 3); }
      }
    });
  }

  /* ============== POJEDYNEK ============== */
  var tintCache = {};
  function tinted(img, key, col) {
    if (tintCache[key]) return tintCache[key]; if (!img.complete || !img.naturalWidth) return img;
    var c = document.createElement('canvas'); c.width = 300; c.height = 300; var x = c.getContext('2d'); x.drawImage(img, 0, 0, 300, 300); x.globalCompositeOperation = 'source-atop'; x.fillStyle = col; x.fillRect(0, 0, 300, 300);
    var im = new Image(); im.src = c.toDataURL(); tintCache[key] = im; return im;
  }
  function pojedynek(el) {
    var img = knagaImg('kowboj'), ph, t, waitD, opp, lvl, streak, lives, rt, kind, goT, msg, flash, shot;
    function nextRound() { ph = 'wait'; t = 0; waitD = 1.2 + Math.random() * 2.4; opp = Math.max(.23, .74 - lvl * .04) + (Math.random() - .5) * .05; kind = ''; flash = 0; shot = null; }
    canvasGame(el, G('pojedynek'), {
      lives: true, lifeIcon: '❤️', ratio: '4 / 5',
      intro: 'Czekaj na napis STRZELAJ! i wtedy kliknij albo stuknij w ekran. Musisz być szybszy od rywala. Jeśli klikniesz za wcześnie, tracisz życie. Z każdą wygraną rywal robi się szybszy.',
      keys: [['Spacja / kliknięcie', 'strzał']],
      endText: function (s) { return s >= 250 ? ['Najszybszy rewolwer na Dzikim Zachodzie!', 'kowboj'] : s >= 100 ? ['Szybka ręka. Miasteczko jest Twoje.', 'ziomek'] : ['Rywal był szybszy. Rewanż?', 'niesmiala']; },
      init: function (a, cv) {
        var fire = function (e) {
          if (e && e.type === 'keydown') { if (e.code !== 'Space') return; e.preventDefault(); if (e.repeat) return; }
          if (a.counting || !$('#gry-over').hidden) return;
          if (ph === 'wait') { lives--; a.setLives(lives); a.ev('early'); streak = 0; kind = 'early'; ph = 'res'; t = 0; msg = 'ZA WCZEŚNIE!'; a.shake(8); }
          else if (ph === 'go') {
            rt = t; var w = rt < opp; ph = 'res'; t = 0; shot = w ? 'me' : 'opp';
            if (w) { var pts = 10 + Math.min(15, Math.round((opp - rt) * 40)) + Math.min(streak, 5); streak++; lvl++; a.ev('win'); a.mx('streak', streak); a.mx('level', lvl); if (rt < .2) a.ev('fast'); a.setScore(a.score + pts); a.pop(a.W * .3, a.H * .3, '+' + pts, '#ffcf4a'); a.burst(a.W * .72, a.H * .5, '#ffcf4a', 14); msg = 'TRAFIONY!'; kind = 'win'; flash = .25; }
            else { lives--; a.setLives(lives); streak = 0; a.shake(10); msg = 'ZA WOLNO!'; kind = 'lose'; flash = .25; }
          }
        };
        cv.style.touchAction = 'none'; cv.addEventListener('pointerdown', fire); document.addEventListener('keydown', fire); stopFns.push(function () { document.removeEventListener('keydown', fire); });
      },
      reset: function (a) { lvl = 1; streak = 0; lives = 3; a.setLives(lives); nextRound(); },
      step: function (a, dt) {
        t += dt;
        if (ph === 'wait' && t >= waitD) { ph = 'go'; t = 0; }
        else if (ph === 'go' && t > opp) { lives--; a.setLives(lives); streak = 0; a.shake(10); msg = 'RYWAL STRZELIŁ!'; kind = 'lose'; shot = 'opp'; flash = .25; rt = null; ph = 'res'; t = 0; }
        else if (ph === 'res' && t > 1.3) { if (lives <= 0) { a.over(); return; } nextRound(); }
        if (flash > 0) flash -= dt;
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, tt = a.t;
        var g = c.createLinearGradient(0, 0, 0, H * .62); g.addColorStop(0, '#ff7e5f'); g.addColorStop(.55, '#ffb36b'); g.addColorStop(1, '#ffe2a8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff4c9'; c.beginPath(); c.arc(W * .5, H * .4, W * .17, 0, 7); c.fill();
        c.fillStyle = '#c4553a'; [[.0, .5, .3], [.28, .5, .22], [.7, .5, .34]].forEach(function (m) { var x = W * m[0], w = W * m[2], y = H * m[1]; c.beginPath(); c.moveTo(x, y + H * .12); c.lineTo(x + w * .08, y - H * .02); c.lineTo(x + w * .45, y - H * .02); c.lineTo(x + w * .52, y + H * .12); c.fill(); });
        var gy = H * .62; var gg = c.createLinearGradient(0, gy, 0, H); gg.addColorStop(0, '#e9b872'); gg.addColorStop(1, '#c98a4a'); c.fillStyle = gg; c.fillRect(0, gy, W, H - gy);
        c.fillStyle = 'rgba(120,70,30,.18)'; for (var k = 0; k < 9; k++) c.fillRect((k * 97) % W, gy + 20 + (k * 37) % (H - gy - 30), 36, 4);
        function cactus(x, y, s) { c.fillStyle = '#3d8a4a'; c.strokeStyle = '#1f4d2a'; c.lineWidth = 3; c.beginPath(); c.roundRect(x - 9 * s, y - 70 * s, 18 * s, 70 * s, 9 * s); c.fill(); c.stroke(); c.beginPath(); c.roundRect(x - 30 * s, y - 50 * s, 14 * s, 8 * s, 4 * s); c.fill(); c.stroke(); c.beginPath(); c.roundRect(x - 30 * s, y - 62 * s, 10 * s, 20 * s, 5 * s); c.fill(); c.stroke(); c.beginPath(); c.roundRect(x + 16 * s, y - 40 * s, 14 * s, 8 * s, 4 * s); c.fill(); c.stroke(); c.beginPath(); c.roundRect(x + 20 * s, y - 56 * s, 10 * s, 22 * s, 5 * s); c.fill(); c.stroke(); }
        cactus(W * .08, gy + 26, .9); cactus(W * .93, gy + 16, .7);
        var tx = ((tt * 40) % (W + 80)) - 40; c.strokeStyle = '#8a5a2a'; c.lineWidth = 2; c.beginPath(); c.arc(tx, gy + 40, 11, 0, 7); c.moveTo(tx - 11, gy + 40); c.lineTo(tx + 11, gy + 40); c.stroke();
        var s = Math.min(W * .42, 190), py = gy + 60;
        var rec = ph === 'res' && shot === 'opp' ? 1 : 0, rec2 = ph === 'res' && shot === 'me' ? 1 : 0;
        c.fillStyle = 'rgba(80,40,10,.25)'; c.beginPath(); c.ellipse(W * .26, py + 10, s * .38, 12, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(W * .74, py + 10, s * .38, 12, 0, 0, 7); c.fill();
        var bob = Math.sin(tt * 2) * 2;
        drawK(c, img, W * .26, py - s * .45 + bob + (rec ? 14 : 0), s, rec ? -.5 : 0);
        c.save(); c.translate(W * .74, py - s * .45 + bob + (rec2 ? 14 : 0)); c.scale(-1, 1); if (rec2) c.rotate(-.5); var oi = tinted(img, 'opp', 'rgba(25,12,30,.82)'); if (oi.complete !== false) c.drawImage(oi, -s / 2, -s / 2, s, s); c.restore();
        c.font = '800 12px Figtree, Arial'; c.textAlign = 'center'; c.fillStyle = 'rgba(70,30,10,.8)'; c.fillText('TY', W * .26, py + 32); c.fillText('RYWAL · POZIOM ' + lvl, W * .74, py + 32);
        if (flash > 0) { c.fillStyle = 'rgba(255,255,255,' + flash * 2 + ')'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffcf4a'; var fx = shot === 'me' ? W * .36 : W * .64; c.beginPath(); for (var q = 0; q < 10; q++) { var an = q / 10 * 6.283, rr = q % 2 ? 14 : 34; c.lineTo(fx + Math.cos(an) * rr, gy - 40 + Math.sin(an) * rr); } c.fill(); }
        c.textAlign = 'center'; var big = ph === 'go' ? 'STRZELAJ!' : ph === 'wait' ? 'Czekaj…' : msg;
        c.font = '900 ' + (ph === 'go' ? 56 + Math.sin(tt * 40) * 4 : 36) + 'px "Bricolage Grotesque", Figtree, Arial'; c.lineWidth = 8; c.strokeStyle = '#2a1008'; c.lineJoin = 'round';
        c.strokeText(big, W / 2, H * .24); c.fillStyle = ph === 'go' ? '#ff3b30' : (kind === 'win' ? '#7dff9a' : kind ? '#fff' : '#fff'); c.fillText(big, W / 2, H * .24);
        if (ph === 'res') { c.font = '800 15px Figtree, Arial'; c.fillStyle = '#2a1008'; c.fillText((rt ? 'Twój czas ' + Math.round(rt * 1000) + ' ms · ' : '') + 'rywal ' + Math.round(opp * 1000) + ' ms', W / 2, H * .31); }
        if (streak > 1) { c.font = '900 13px Figtree, Arial'; c.fillStyle = '#7a2a0a'; c.textAlign = 'right'; c.fillText('SERIA ×' + streak, W - 14, H - 14); }
      }
    });
  }

  /* ============== RATUNEK ============== */
  function ratunek(el) {
    var img = knagaImg('ratownik'), FALL = ['ziomek', 'imprezowa', 'niesmiala', 'gwiazdor', 'redaktor'].map(knagaImg), P, items, lives, spawn, combo, tx, lvl, wave = [], keysD = {};
    function drawJelly(c, x, y, r, t) { c.save(); c.translate(x, y); c.fillStyle = '#c084fc'; c.strokeStyle = '#6d28d9'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, r, Math.PI, 0); c.quadraticCurveTo(r, r * .3, r * .6, r * .3); c.quadraticCurveTo(0, r * .5, -r * .6, r * .3); c.quadraticCurveTo(-r, r * .3, -r, 0); c.fill(); c.stroke(); c.strokeStyle = '#a855f7'; c.lineWidth = 3; c.lineCap = 'round'; for (var i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * .3, r * .3); c.bezierCurveTo(i * r * .3 + Math.sin(t * 5 + i) * 6, r * .8, i * r * .3 - Math.sin(t * 5 + i) * 6, r * 1.2, i * r * .3 + Math.sin(t * 4 + i) * 5, r * 1.6); c.stroke(); } c.fillStyle = '#fff'; c.beginPath(); c.arc(-r * .3, -r * .35, r * .15, 0, 7); c.arc(r * .3, -r * .35, r * .15, 0, 7); c.fill(); c.fillStyle = '#2a1050'; c.beginPath(); c.arc(-r * .3, -r * .33, r * .07, 0, 7); c.arc(r * .3, -r * .33, r * .07, 0, 7); c.fill(); c.restore(); }
    canvasGame(el, G('ratunek'), {
      lives: true, lifeIcon: '🛟', ratio: '5 / 6',
      intro: 'Przesuwaj palcem w lewo i prawo, żeby ratownik złapał spadające Knagi w koło ratunkowe. Każda uratowana Knaga to punkty, a seria daje bonus. Uciekająca Knaga albo meduza to utrata życia. Z czasem spada coraz szybciej i gęściej, a Knagi zaczynają zbaczać na boki.',
      keys: [['← →', 'ruch'], ['palec', 'przeciągnij']],
      endText: function (s) { return s >= 200 ? ['Bohater plaży. Medal gwarantowany!', 'ratownik'] : s >= 80 ? ['Sporo uratowanych. Dobra zmiana!', 'ziomek'] : ['Plaża była dziś wyjątkowo zdradliwa.', 'niesmiala']; },
      init: function (a, cv) {
        cv.style.touchAction = 'none'; var mv = function (e) { var r = cv.getBoundingClientRect(); tx = e.clientX - r.left; };
        cv.addEventListener('pointerdown', mv); cv.addEventListener('pointermove', mv);
        var kd = function (e) { keysD[e.code] = e.type === 'keydown'; if (/Arrow/.test(e.code)) e.preventDefault(); }; document.addEventListener('keydown', kd); document.addEventListener('keyup', kd); stopFns.push(function () { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); });
        for (var i = 0; i < 6; i++) wave.push(i);
      },
      reset: function (a) { P = { x: a.W / 2 }; tx = a.W / 2; items = []; lives = 3; spawn = .6; combo = 0; lvl = 1; a.setLives(lives); },
      step: function (a, dt) {
        var W = a.W, H = a.H; if (keysD.ArrowLeft) tx = (tx == null ? P.x : tx) - 520 * dt; if (keysD.ArrowRight) tx = (tx == null ? P.x : tx) + 520 * dt;
        tx = Math.max(40, Math.min(W - 40, tx)); P.x += (tx - P.x) * Math.min(1, dt * 12.5);
        lvl = 1 + a.score / 26; spawn -= dt;
        if (spawn <= 0) {
          spawn = Math.max(.42, 1.05 - lvl * .065) * (.78 + Math.random() * .44);
          var nSp = lvl > 5 && Math.random() < Math.min(.28, (lvl - 5) * .04) ? 2 : 1;
          for (var q0 = 0; q0 < nSp; q0++) {
            var jel = Math.random() < Math.min(.4, .17 + lvl * .025), bx0 = 36 + Math.random() * (W - 72);
            items.push({ x: bx0, bx: bx0, amp: lvl > 4 ? Math.random() * Math.min(50, (lvl - 4) * 8) : 0, ph: Math.random() * 6, y: -40 - q0 * 90, v: 170 + Math.min(200, lvl * 16) + Math.random() * 45, jel: jel, im: FALL[Math.floor(Math.random() * FALL.length)], rot: Math.random() * 6, rv: (Math.random() - .5) * 3 });
          }
        }
        var ringY = H - 78, rr = 44;
        items = items.filter(function (it) {
          it.y += it.v * dt; it.rot += it.rv * dt; if (it.amp) it.x = Math.max(30, Math.min(W - 30, it.bx + Math.sin(it.y / 70 + it.ph) * it.amp));
          if (it.y > ringY - 14 && it.y < ringY + 24 && Math.abs(it.x - P.x) < rr) {
            if (it.jel) { lives--; combo = 0; a.ev('jelly'); a.setLives(lives); a.shake(10); a.burst(it.x, it.y, '#c084fc', 16); a.pop(it.x, it.y - 24, 'AUĆ!', '#ff6b6b'); }
            else { combo++; a.ev('catch'); a.mx('combo', combo); var pts = 1 + Math.min(4, Math.floor(combo / 3)); a.setScore(a.score + pts); a.burst(it.x, it.y, '#4cc3ff', 10); a.pop(it.x, it.y - 24, '+' + pts, '#ffcf4a'); }
            if (lives <= 0) a.over(); return false;
          }
          if (it.y > H - 40) {
            if (!it.jel) { lives--; combo = 0; a.ev('lost'); a.setLives(lives); a.burst(it.x, H - 40, '#9be7ff', 12); a.pop(it.x, H - 70, 'Plusk!', '#ff6b6b'); if (lives <= 0) a.over(); }
            return false;
          }
          return true;
        });
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t;
        var g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#bfe9ff'); g.addColorStop(.45, '#7fd0ff'); g.addColorStop(1, '#2a8fd8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.55)'; [[.2, .12, 46], [.62, .08, 60], [.85, .2, 38]].forEach(function (p) { c.beginPath(); c.arc(W * p[0], H * p[1], p[2], 0, 7); c.arc(W * p[0] + p[2] * .9, H * p[1] + 8, p[2] * .75, 0, 7); c.arc(W * p[0] - p[2] * .9, H * p[1] + 10, p[2] * .65, 0, 7); c.fill(); });
        c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(W * .82, H * .1, 34, 0, 7); c.fill();
        var wy = H - 60; for (var l = 0; l < 3; l++) { c.fillStyle = ['rgba(255,255,255,.25)', 'rgba(40,140,220,.55)', '#1b6fb8'][l]; c.beginPath(); c.moveTo(0, H); for (var x = 0; x <= W; x += 12) c.lineTo(x, wy + l * 14 + Math.sin(x / 38 + t * (1.4 + l * .4) + l) * 6); c.lineTo(W, H); c.fill(); }
        c.fillStyle = '#f3d79a'; c.fillRect(0, H - 14, W, 14);
        items.forEach(function (it) { if (it.jel) drawJelly(c, it.x, it.y, 22, t); else { c.save(); c.translate(it.x, it.y); c.rotate(it.rot); c.drawImage(it.im, -30, -30, 60, 60); c.restore(); } });
        var x0 = P ? P.x : W / 2, ry = H - 78;
        drawK(c, img, x0, H - 122 + Math.sin(t * 3) * 2, 112, 0);
        c.save(); c.translate(x0, ry); c.fillStyle = 'rgba(0,40,90,.2)'; c.beginPath(); c.ellipse(0, 20, 52, 9, 0, 0, 7); c.fill();
        c.strokeStyle = '#2a1620'; c.lineWidth = 3; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, 52, 22, 0, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#e8262d'; for (var q = 0; q < 4; q++) { var a0 = q * 1.5708 + .2; c.beginPath(); c.ellipse(0, 0, 52, 22, 0, a0, a0 + .75); c.ellipse(0, 0, 26, 9, 0, a0 + .75, a0, true); c.closePath(); c.fill(); }
        c.fillStyle = '#7fd0ff'; c.strokeStyle = '#2a1620'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(0, 0, 26, 9, 0, 0, 7); c.fill(); c.stroke(); c.restore();
        if (combo > 2) { c.font = '900 12px Figtree, Arial'; c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText('SERIA ×' + combo, W - 14, 28 + 24); }
      }
    });
  }

  /* ============== RZUT KARNY ============== */
  function karny(el) {
    var img = knagaImg('kibic'), st, stT, lives, streak, goals, drag, ball, kp, res, aim, gk, G0;
    function geo(a) { var W = a.W, H = a.H, gw = Math.min(W * .74, 300); return { W: W, H: H, gw: gw, gh: gw * .42, gy: H * .36, cx: W / 2, bx: W / 2, by: H * .84 }; }
    function lvl() { return 1 + goals / 2; }
    function newKick() { st = 'aim'; stT = 0; ball = { x: G0.bx, y: G0.by, s: 1 }; gk = { x: G0.cx, d: 0, tx: G0.cx, dive: 0 }; res = null; }
    canvasGame(el, G('karny'), {
      lives: true, lifeIcon: '⚽', ratio: '5 / 6',
      intro: 'Przeciągnij palcem od piłki w stronę bramki i puść. Kierunek ruchu to kierunek strzału, a długość to wysokość: krótki strzał leci przy ziemi, długi pod poprzeczkę, a zbyt długi nad bramkę. Strzały w górne rogi są najcenniejsze. Trzy nieudane karne kończą grę.',
      keys: [['przeciągnij', 'celuj'], ['puść', 'strzał']],
      endText: function (s) { return s >= 220 ? ['Król jedenastek. Stadion śpiewa!', 'kibic'] : s >= 90 ? ['Dobra seria. Trener zadowolony.', 'ziomek'] : ['Bramkarz był dziś nie do przejścia.', 'niesmiala']; },
      init: function (a, cv) {
        cv.style.touchAction = 'none'; var pos = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
        cv.addEventListener('pointerdown', function (e) { if (a.counting || st !== 'aim' || !$('#gry-over').hidden) return; drag = { s: pos(e), e: pos(e) }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
        cv.addEventListener('pointermove', function (e) { if (drag) drag.e = pos(e); });
        cv.addEventListener('pointerup', function (e) {
          if (!drag) return; var s = drag.s, p = pos(e); drag = null; if (st !== 'aim') return;
          var dx = p.x - s.x, dy = s.y - p.y; if (dy < 40) return;
          var len = Math.hypot(dx, dy), h = (len - 90) / 190, tx = G0.bx + dx * (G0.by - G0.gy) / dy;
          kp = { tx: Math.max(G0.cx - G0.gw, Math.min(G0.cx + G0.gw, tx)), h: h, len: len }; st = 'fly'; stT = 0;
          var L = lvl(), guess = Math.random() < Math.min(.7, .3 + L * .035), side = Math.random() < .5 ? -1 : 1;
          gk.dive = 1; gk.tx = guess ? kp.tx + (Math.random() - .5) * G0.gw * .12 : G0.cx + side * G0.gw * (.15 + Math.random() * .3); gk.reach = G0.gw * Math.min(.2, .13 + L * .007);
          gk.delay = Math.max(.05, .22 - L * .012);
        });
        cv.addEventListener('pointercancel', function () { drag = null; });
      },
      reset: function (a) { G0 = geo(a); lives = 3; streak = 0; goals = 0; drag = null; a.setLives(lives); newKick(); },
      step: function (a, dt) {
        if (!G0 || G0.W !== a.W || G0.H !== a.H) { G0 = geo(a); if (st === 'aim') newKick(); }
        stT += dt; var T = .62;
        if (st === 'fly') {
          var k = Math.min(1, stT / T); ball.x = G0.bx + (kp.tx - G0.bx) * k; ball.y = G0.by + (G0.gy - Math.max(0, Math.min(1, kp.h)) * G0.gh - G0.by) * k - Math.sin(k * Math.PI) * 30; ball.s = 1 - .55 * k;
          var dk = Math.max(0, Math.min(1, (stT - gk.delay) / .42)); gk.x = G0.cx + (gk.tx - G0.cx) * (1 - Math.pow(1 - dk, 2));
          if (stT >= T) {
            var wide = Math.abs(kp.tx - G0.cx) > G0.gw / 2, post = Math.abs(Math.abs(kp.tx - G0.cx) - G0.gw / 2) < G0.gw * .04, over = kp.h > 1, low = kp.len < 90;
            var saved = !wide && !over && Math.abs(gk.x - kp.tx) < gk.reach && kp.h < .8, weak = !wide && !over && kp.h < 0 && Math.abs(gk.x - kp.tx) < gk.reach * 1.8;
            if (kp.len < 100) saved = true;
            if (!wide && !over && !saved && !weak) {
              var corner = Math.abs(kp.tx - G0.cx) > G0.gw * .3 && kp.h > .6, pts = 10 + Math.min(streak, 5) * 2 + (corner ? 5 : 0); streak++; goals++; a.ev('goal'); a.mx('streak', streak); if (corner) a.ev('corner'); a.setScore(a.score + pts); a.shake(8); a.burst(ball.x, ball.y, '#ffffff', 22); a.burst(ball.x, ball.y, '#ffcf4a', 14); a.pop(G0.cx, G0.gy + G0.gh + 30, (corner ? 'GOL W ROGU! +' : 'GOOOL! +') + pts, '#ffcf4a'); res = 'goal';
            } else { lives--; streak = 0; a.setLives(lives); var m = saved || weak ? 'OBRONIONE!' : post ? 'SŁUPEK!' : over ? 'NAD POPRZECZKĄ!' : 'OBOK!'; if (saved || weak) a.ev('save'); if (post) a.ev('post'); a.pop(G0.cx, G0.gy + G0.gh + 30, m, '#ff6b6b'); res = 'miss'; }
            st = 'res'; stT = 0;
          }
        } else if (st === 'res' && stT > 1.1) { if (lives <= 0) { a.over(); return; } newKick(); }
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t; if (!G0) G0 = geo(a);
        var g = c.createLinearGradient(0, 0, 0, H * .36); g.addColorStop(0, '#7fd0ff'); g.addColorStop(1, '#d8f1ff'); c.fillStyle = g; c.fillRect(0, 0, W, H * .4);
        for (var i = 0; i < 30; i++) { c.fillStyle = ['#ff6b9a', '#ffd23f', '#4cc9f0', '#fff', '#7bdc65'][i % 5]; c.beginPath(); c.arc((i + .5) / 30 * W, G0.gy - G0.gh - 20 - (i % 3) * 9, 6 + (i % 2), 0, 7); c.fill(); }
        c.fillStyle = '#b9c7d6'; c.fillRect(0, G0.gy - G0.gh - 14, W, 18);
        for (i = 0; i < 12; i++) { var gg = c.createLinearGradient(0, G0.gy, 0, H); } 
        var gr = c.createLinearGradient(0, G0.gy - 10, 0, H); gr.addColorStop(0, '#46b450'); gr.addColorStop(1, '#2d8c3a'); c.fillStyle = gr; c.fillRect(0, G0.gy - 10, W, H);
        for (i = 0; i < 8; i++) { c.fillStyle = i % 2 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'; c.fillRect(0, G0.gy - 10 + i * (H - G0.gy) / 8, W, (H - G0.gy) / 8); }
        c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(G0.cx - G0.gw * .9, G0.gy + 10); c.lineTo(G0.cx + G0.gw * .9, G0.gy + 10); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(G0.cx, G0.by - G0.gh * .1, 4, 0, 7); c.fill();
        var gl = G0.cx - G0.gw / 2, gt = G0.gy - G0.gh;
        c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(gl, gt, G0.gw, G0.gh); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; for (i = 1; i < 12; i++) { c.beginPath(); c.moveTo(gl + i * G0.gw / 12, gt); c.lineTo(gl + i * G0.gw / 12, G0.gy); c.stroke(); } for (i = 1; i < 6; i++) { c.beginPath(); c.moveTo(gl, gt + i * G0.gh / 6); c.lineTo(gl + G0.gw, gt + i * G0.gh / 6); c.stroke(); }
        var kx = gk ? gk.x : G0.cx, kd = gk && gk.dive ? Math.max(-1, Math.min(1, (kx - G0.cx) / (G0.gw * .4))) : 0;
        c.save(); c.translate(kx, G0.gy - G0.gh * .32); c.rotate(kd * .9); c.fillStyle = '#ffcf4a'; c.strokeStyle = '#2a1620'; c.lineWidth = 3; c.beginPath(); c.roundRect(-14, -26, 28, 54, 12); c.fill(); c.stroke(); c.fillStyle = '#f4c7a1'; c.beginPath(); c.arc(0, -34, 12, 0, 7); c.fill(); c.stroke(); c.strokeStyle = '#ffcf4a'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-14, -14); c.lineTo(-30 - (gk.dive ? 6 : 0), gk.dive ? -34 : -4); c.moveTo(14, -14); c.lineTo(30 + (gk.dive ? 6 : 0), gk.dive ? -34 : -4); c.stroke(); c.restore();
        c.strokeStyle = '#fff'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(gl, G0.gy); c.lineTo(gl, gt); c.lineTo(gl + G0.gw, gt); c.lineTo(gl + G0.gw, G0.gy); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.stroke();
        if (st === 'aim') drawK(c, img, G0.bx - 70, G0.by + 6 + Math.sin(t * 3) * 2, 104, 0);
        if (ball) { c.save(); c.translate(ball.x, ball.y); c.scale(ball.s, ball.s); c.rotate(st === 'fly' ? stT * 18 : 0); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(2, 18, 17, 5, 0, 0, 7); c.fill(); c.fillStyle = '#fff'; c.strokeStyle = '#2a1620'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 17, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#2a1620'; c.beginPath(); for (var q = 0; q < 5; q++) { var an = q / 5 * 6.283 - 1.57; c.lineTo(Math.cos(an) * 8, Math.sin(an) * 8); } c.fill(); for (q = 0; q < 5; q++) { an = q / 5 * 6.283 - 1.57; c.beginPath(); c.moveTo(Math.cos(an) * 8, Math.sin(an) * 8); c.lineTo(Math.cos(an) * 16, Math.sin(an) * 16); c.stroke(); } c.restore(); }
        if (drag && st === 'aim') { var dx = drag.e.x - drag.s.x, dy = drag.s.y - drag.e.y; if (dy > 20) { var len = Math.hypot(dx, dy), h = (len - 90) / 190, col = h > 1 ? '#ff6b6b' : h > .75 ? '#ffcf4a' : '#fff'; c.save(); c.setLineDash([7, 8]); c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(ball.x, ball.y); c.lineTo(ball.x + dx * (G0.by - G0.gy) / dy, G0.gy); c.stroke(); c.restore(); var pw = Math.min(1, len / 280); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(W - 26, H - 190, 12, 150); c.fillStyle = col; c.fillRect(W - 26, H - 40 - 150 * pw, 12, 150 * pw); } }
        else if (st === 'aim' && goals === 0 && lives === 3) { c.textAlign = 'center'; c.font = '800 13px Figtree, Arial'; c.fillStyle = '#fff'; c.fillText('Przeciągnij od piłki w stronę bramki', W / 2, G0.by + 52); }
        if (streak > 1) { c.font = '900 13px Figtree, Arial'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText('SERIA ×' + streak, 14, H - 14); }
      }
    });
  }

  /* ============== ŚLISKA UKŁADANKA ============== */
  function ukladanka(el, ctx) {
    var g = G('ukladanka'), arts = (ctx.articles || []).filter(function (a) { return a.image; }), N = 3, tiles, moves, art, t0, timer, tlU = [], tu0 = 0;
    shell(el, g, '<div class="uk"><div class="uk-bar"><div class="uk-seg" role="group" aria-label="Poziom"><button type="button" data-n="3" class="is-on">3×3</button><button type="button" data-n="4">4×4</button><button type="button" data-n="5">5×5</button></div>' +
      '<span class="uk-chip"><small>Ruchy</small><b id="uk-m">0</b></span><span class="uk-chip"><small>Czas</small><b id="uk-t">0:00</b></span><span class="uk-chip"><small>Rekord</small><b id="uk-b">–</b></span></div>' +
      '<div class="uk-frame"><div class="uk-board" id="uk-board"></div><div class="uk-ghost" id="uk-ghost" hidden></div><div class="uk-done" id="uk-done" hidden></div></div>' +
      '<div class="uk-acts"><button type="button" class="btn btn-sm" id="uk-hint">Podpowiedź</button><button type="button" class="btn btn-sm" id="uk-peek">Podgląd</button><button type="button" class="btn btn-sm" id="uk-new">Inne zdjęcie</button><button type="button" class="btn btn-sm" id="uk-mix">Wymieszaj</button></div><p class="uk-art" id="uk-art"></p></div>', { side: achBox('ukladanka') });
    function src() { return art ? art.image : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(K('ziomek').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="background:#ffe3d6" ')).replace(/'/g, '%27'); }
    function pick() { art = arts.length ? arts[Math.floor(Math.random() * Math.min(arts.length, 24))] : null; }
    function solvable(a) { var inv = 0, f = a.filter(function (x) { return x !== N * N - 1; }); for (var i = 0; i < f.length; i++) for (var j = i + 1; j < f.length; j++) if (f[i] > f[j]) inv++; if (N % 2) return inv % 2 === 0; var row = N - Math.floor(a.indexOf(N * N - 1) / N); return (inv + row) % 2 === 1; }
    function start() {
      do { tiles = Array.from({ length: N * N }, function (_, i) { return i; }).sort(function () { return Math.random() - .5; }); } while (!solvable(tiles) || tiles.every(function (v, i) { return v === i; }));
      mint('ukladanka'); moves = 0; t0 = 0; tlU = []; tu0 = Date.now(); clearInterval(timer); $('#uk-t').textContent = '0:00'; $('#uk-done').hidden = true; $('#uk-board').classList.remove('is-done'); draw();
      $('#uk-ghost').style.backgroundImage = 'url("' + src() + '")';
      $('#uk-art').innerHTML = art ? 'Zdjęcie z artykułu: <a href="#/artykul/' + encodeURIComponent(art.id) + '">' + esc(art.title) + '</a>' : 'Brak zdjęć z artykułów – układamy Knagę.';
    }
    function draw() {
      var s = src(), b = $('#uk-board'); b.style.setProperty('--n', N);
      b.innerHTML = tiles.map(function (v, i) {
        if (v === N * N - 1) return '<span class="uk-t is-empty"></span>';
        var x = v % N, y = Math.floor(v / N);
        return '<button type="button" class="uk-t' + (v === i ? ' is-ok' : '') + '" data-i="' + i + '" aria-label="Kafelek ' + (v + 1) + '" style="background-image:url(\'' + s + '\');background-size:' + N * 100 + '% ' + N * 100 + '%;background-position:' + (x * 100 / (N - 1)) + '% ' + (y * 100 / (N - 1)) + '%"><i>' + (v + 1) + '</i></button>';
      }).join('');
      $('#uk-m').textContent = moves; var bb = (load().ukBest || {})[N]; $('#uk-b').textContent = bb ? bb : '–';
    }
    var PAR = { 3: [35, 60], 4: [110, 180], 5: [240, 380] };
    $('#uk-board').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return; var i = +b.dataset.i, e0 = tiles.indexOf(N * N - 1);
      var ri = Math.floor(i / N), re = Math.floor(e0 / N); if (i === e0 || (ri !== re && i % N !== e0 % N)) return;
      var stp = ri === re ? (i > e0 ? 1 : -1) : (i > e0 ? N : -N); for (var pp = e0; pp !== i; pp += stp) tiles[pp] = tiles[pp + stp];
      tiles[i] = N * N - 1; moves++; tlU.push([Date.now() - tu0, moves]); var mvd = i;
      if (!t0) { t0 = Date.now(); timer = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); $('#uk-t').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500); }
      draw();
      if (tiles.every(function (v, k) { return v === k; })) {
        clearInterval(timer); var dd = load(); dd.ukBest = dd.ukBest || {}; var nbl = !dd.ukBest[N] || moves < dd.ukBest[N]; if (nbl) { dd.ukBest[N] = moves; save(dd); } if (N === 4) TLS.ukladanka = tlU; var nb = N === 4 ? submit('ukladanka', moves) : nbl; played('ukladanka'); var pr = PAR[N] || [999, 999]; achEval('ukladanka', { done: true, n: N, gold: moves <= pr[0], sec: Math.floor((Date.now() - t0) / 1000) }); var medal = moves <= pr[0] ? 'Złoty medal' : moves <= pr[1] ? 'Srebrny medal' : 'Ułożone';
        $('#uk-board').classList.add('is-done');
        var dn = $('#uk-done'); dn.hidden = false;
        dn.innerHTML = '<div class="gm">' + (nb ? '<span class="gry-new">Nowy rekord!</span>' : '<span class="gm-eye">' + medal + '</span>') + '<div class="gm-score">' + moves + '<small>ruchów</small></div><p class="gm-end">' + (nb ? medal + ' · ' : '') + 'Czas: ' + $('#uk-t').textContent + ' · poziom ' + N + '×' + N + (N === 4 ? ' (liczy się do rankingu)' : '') + '</p><div class="gm-acts"><button type="button" class="btn btn-primary" id="uk-again">Jeszcze raz</button>' + (art ? '<a class="btn" href="#/artykul/' + encodeURIComponent(art.id) + '">Czytaj artykuł</a>' : '') + '</div></div>';
        $('#uk-again').onclick = function () { pick(); start(); };
        if (nb) loadTop('ukladanka');
      }
    });
    el.querySelector('.uk-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; N = +b.dataset.n; [].forEach.call(this.children, function (x) { x.classList.toggle('is-on', x === b); }); start(); });
    $('#uk-new').onclick = function () { pick(); start(); };
    $('#uk-hint').onclick = function () { var e0 = tiles.indexOf(N * N - 1), best = null, bs = -9; [e0 - 1, e0 + 1, e0 - N, e0 + N].forEach(function (i) { if (i < 0 || i >= N * N || (Math.abs(i - e0) === 1 && Math.floor(i / N) !== Math.floor(e0 / N))) return; var v = tiles[i], dist = function (p) { return Math.abs(p % N - v % N) + Math.abs(Math.floor(p / N) - Math.floor(v / N)); }, gain = dist(i) - dist(e0); if (gain > bs) { bs = gain; best = i; } }); var b = best != null && $('#uk-board').querySelector('[data-i="' + best + '"]'); if (b) { b.classList.add('is-hint'); setTimeout(function () { b.classList.remove('is-hint'); }, 1600); } };
    var onArrow = function (e) { var dlt = { ArrowUp: N, ArrowDown: -N, ArrowLeft: 1, ArrowRight: -1 }[e.key]; if (!dlt || /input|textarea/i.test((e.target || {}).tagName) || !document.body.contains(el)) return; var e0 = tiles.indexOf(N * N - 1), i = e0 + dlt; if (i < 0 || i >= N * N || (Math.abs(dlt) === 1 && Math.floor(i / N) !== Math.floor(e0 / N))) return; e.preventDefault(); var b = $('#uk-board').querySelector('[data-i="' + i + '"]'); if (b) b.click(); };
    document.addEventListener('keydown', onArrow); stopFns.push(function () { document.removeEventListener('keydown', onArrow); });
    $('#uk-mix').onclick = start;
    var peek = $('#uk-peek'), gh = $('#uk-ghost');
    var on = function (e) { e.preventDefault(); gh.hidden = false; }, off = function () { gh.hidden = true; };
    peek.addEventListener('pointerdown', on); peek.addEventListener('pointerup', off); peek.addEventListener('pointerleave', off);
    peek.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') on(e); }); peek.addEventListener('keyup', off);
    stopFns.push(function () { clearInterval(timer); });
    pick(); start();
  }

  function dramaOff(el) {
    shell(el, G('drama'), '<div class="gp-off"><b>Drama Simulator jest chwilowo niedostępny</b><p>Gra przechodzi przebudowę i na razie nikt nie może w nią grać. Wróci wkrótce – zajrzyj do innych gier.</p><a class="btn" href="#/gry">Wróć do gier</a></div>', { noTop: true, side: '<style>.gp[data-game="drama"] .gp-chips,.gp[data-game="drama"] .gp-side{display:none}</style>' });
  }
  /* ============== DRAMA SIMULATOR (news/drama.js) ============== */
  function drama(el) {
    if (!window.DramaSim) { shell(el, G('drama'), '<p class="gp-empty">Nie udało się wczytać gry. Odśwież stronę.</p>'); return; }
    DramaSim.mount(el, { G: G, K: K, esc: esc, shell: shell, submit: submit, played: played, share: share, load: load, save: save, toast: toast, LINK: LINK + '/drama' });
  }

  /* ============== REDAKTOR NACZELNY (news/naczelny.js) ============== */
  function naczelny(el) {
    if (!window.NaczelnySim) { shell(el, G('naczelny'), '<p class="gp-empty">Nie udało się wczytać gry. Odśwież stronę.</p>'); return; }
    NaczelnySim.mount(el, { G: G, K: K, esc: esc, shell: shell, submit: submit, played: played, share: share, load: load, save: save, toast: toast, LINK: LINK + '/naczelny' });
  }

  /* ============== KRZYŻÓWKA TYGODNIA (krzyżówka z hasłem) ============== */
  // [wyraz, podpowiedź, pozycja litery hasła w wyrazie] – używane, gdy właściciel nie ułożył krzyżówki na dany tydzień
  var KRZ = [
    { h: 'ŚLISKA', r: [['ŚLIZG', 'Ruch po mokrej powierzchni', 0], ['ALBUM', 'Płyta z kilkoma utworami', 1], ['WINYL', 'Czarna płyta dla kolekcjonerów', 1], ['SCENA', 'Miejsce, na którym gra się koncert', 0], ['KLIP', 'Teledysk, inaczej', 0], ['AFERA', 'Głośny skandal', 0]] },
    { h: 'DRAMA', r: [['DISS', 'Utwór, w którym raper atakuje innego', 0], ['TRASA', 'Seria koncertów w różnych miastach', 1], ['FEAT', 'Gościnny udział innego artysty w numerze', 2], ['MIKROFON', 'Bez niego wokalista nic nie zdziała', 0], ['FANKA', 'Wierna słuchaczka artysty', 1]] },
    { h: 'MOKRO', r: [['MERCH', 'Koszulki i bluzy z logo artysty', 0], ['SOLO', 'Występ w pojedynkę', 1], ['SKANDAL', 'Afera, o której mówią wszyscy', 1], ['REFREN', 'Powtarzająca się część piosenki', 0], ['PODCAST', 'Audycja do słuchania w internecie', 1]] },
    { h: 'KNAGA', r: [['KONCERT', 'Występ na żywo', 0], ['NAGRODA', 'Statuetka dla najlepszych', 0], ['PLAYLISTA', 'Lista utworów w aplikacji', 2], ['GALA', 'Uroczysta impreza z wręczeniem nagród', 0], ['SAMPEL', 'Fragment cudzego utworu użyty w nowym', 1]] }
  ];
  function krzyzowka(el, ctx) {
    var g = G('krzyzowka'), arts = (ctx && ctx.articles) || [];
    shell(el, g, '<div class="kz"><p class="sz-load">Ładowanie krzyżówki…</p></div>', { tag: 'Tydzień #' + weekIndex(), side: achBox('krzyzowka') });
    cfg().then(function (c) {
      if (!$('.gp[data-game="krzyzowka"]')) return;
      if (!arts.length && typeof state !== 'undefined') arts = state.articles || [];
      var own = !!(c && c.krzyz && c.krzyz.week === weekIndex() && c.krzyz.h);
      var set = own ? c.krzyz : (window.KrzGen && KrzGen.generate(arts, weekIndex())) || KRZ[((weekIndex() % KRZ.length) + KRZ.length) % KRZ.length];
      if (own || arts.length) lsSet('sn-krzyz-set-' + weekIndex(), set);   // zapamiętany zestaw trafia potem do archiwum
      krzRun(set, own ? 'Ułożona przez redakcję' : set.gen ? 'Z artykułów tygodnia' : 'Krzyżówka z hasłem');
    });
  }
  /* archiwum: poprzednie tygodnie (najstarszy startowy zestaw: tydzień −3) */
  var wname = function (w) { return w < 0 ? 'Zestaw startowy ' + (-w) : 'Tydzień #' + w; };
  var wid = function (w) { return w < 0 ? 'n' + (-w) : String(w); };
  var weekRange = function (w) { var a = new Date(2026, 9, 26 + w * 7), b = new Date(2026, 9, 26 + w * 7 + 6), f = function (x) { return x.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }); }; return f(a) + ' – ' + f(b); };
  function krzSetFor(w, arts) {
    var c = lsGet('sn-krzyz-set-' + w); if (c && c.r && c.h) return c;
    var set = (window.KrzGen && KrzGen.generate(arts, w)) || KRZ[((w % KRZ.length) + KRZ.length) % KRZ.length];
    if (arts.length) lsSet('sn-krzyz-set-' + w, set); return set;
  }
  function krzArchive(el, ctx) {
    var g = G('krzyzowka'), arts = (ctx && ctx.articles) || []; if (!arts.length && typeof state !== 'undefined') arts = state.articles || [];
    var cur = weekIndex(), from = Math.max(1, cur - 12), cards = '';
    for (var w = cur - 1; w >= from; w--) {
      var set = krzSetFor(w, arts), done = !!lsGet('sn-krzyz-done-' + w), st = lsGet('sn-krzyz-' + w + '-' + set.h), part = !done && st && st.v && Object.keys(st.v).some(function (k) { return /\S/.test(st.v[k] || ''); });
      cards += '<a class="kza' + (done ? ' is-done' : '') + '" href="#/gry/krzyzowka-arch-' + wid(w) + '"><span class="kza-n">' + (w < 0 ? '★' : '#' + w) + '</span><span><b>' + wname(w) + '</b><small>' + weekRange(w) + ' · ' + set.r.length + ' wyrazów</small></span><em>' + (done ? aIcon('check', 14) + ' Rozwiązana' : part ? 'W trakcie' : 'Nowa') + '</em></a>';
    }
    shell(el, g, '<div class="kz-paper kza-wrap"><div class="kz-head"><div><span class="gm-eye">Archiwum</span><p>Krzyżówki z poprzednich tygodni. Rozwiązania z archiwum nie dają XP i nie liczą się do rekordu, ale możesz grać bez końca.</p></div><a class="btn btn-sm" href="#/gry/krzyzowka">Bieżąca krzyżówka</a></div><div class="kza-list">' + ((cards || '<p class="gp-empty">Archiwum jest jeszcze puste – pierwsze krzyżówki pojawią się tu po zakończeniu tygodnia.</p>') || '<p class="gp-empty">Pierwsze krzyżówki trafią tu po najbliższym poniedziałku.</p>') + '</div></div>', { tag: 'Archiwum', noTop: true });
  }
  function krzArchPlay(el, w, ctx) {
    var g = G('krzyzowka'), arts = (ctx && ctx.articles) || []; if (!arts.length && typeof state !== 'undefined') arts = state.articles || [];
    if (w >= weekIndex() || w < 1) { location.hash = '#/gry/krzyzowka-arch'; return; }
    shell(el, g, '<div class="kz"></div>', { tag: 'Archiwum · ' + (w < 0 ? 'zestaw startowy ' + (-w) : 'tydzień #' + w), noTop: true, side: achBox('krzyzowka') });
    krzRun(krzSetFor(w, arts), 'Archiwum, ' + weekRange(w), w, true);
  }
  function krzRun(set, own, week, arch) {
    var W = week == null ? weekIndex() : week;
    var L = Math.max.apply(null, set.r.map(function (r) { return r[2]; })), R = Math.max.apply(null, set.r.map(function (r) { return r[0].length - r[2]; }));
    var key = 'sn-krzyz-' + W + '-' + set.h, st = lsGet(key) || {}; st.v = st.v || {};
    var nxt = new Date(); nxt.setDate(nxt.getDate() + ((8 - nxt.getDay()) % 7 || 7));
    $('.kz').innerHTML = '<div class="kz-paper"><div class="kz-head"><div><span class="gm-eye">' + (arch ? own : own ? 'Ułożona przez redakcję' : 'Krzyżówka z hasłem') + '</span><p>Litery w <b>złotej kolumnie</b> tworzą hasło tygodnia (' + set.h.length + ' liter). ' + (arch ? 'Archiwum: bez XP i rekordu.' : 'Nowa: ' + nxt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) + '.') + '</p></div><a class="btn btn-sm" href="#/gry/krzyzowka-arch">' + (arch ? '← Archiwum' : 'Archiwum') + '</a></div>' +
      '<div class="kz-wrap"><div class="kz-grid" id="kz-grid" style="--cols:' + (L + R) + '">' + set.r.map(function (r, ri) {
        var cells = ''; for (var c = 0; c < L + R; c++) {
          var k = c - (L - r[2]);
          cells += k < 0 || k >= r[0].length ? '<span class="kz-x"></span>' : '<input class="kz-c' + (k === r[2] ? ' is-h' : '') + '" data-r="' + ri + '" data-k="' + k + '" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Wyraz ' + (ri + 1) + ', litera ' + (k + 1) + '" value="' + esc((st.v[ri] || '')[k] || '').trim() + '">';
        }
        return '<div class="kz-row" data-r="' + ri + '"><span class="kz-n">' + (ri + 1) + '</span>' + cells + '</div>';
      }).join('') + '</div></div>' +
      '<div class="kz-pass" id="kz-pass">' + set.h.split('').map(function () { return '<span></span>'; }).join('') + '</div>' +
      '<ol class="kz-clues">' + set.r.map(function (r, ri) { return '<li data-r="' + ri + '"><b>' + (ri + 1) + '</b><span>' + esc(r[1]) + ' <small>(' + r[0].length + (r[0].length < 5 ? ' litery' : ' liter') + ')</small></span></li>'; }).join('') + '</ol>' +
      '<div class="kz-act"><button type="button" class="btn btn-primary" id="kz-check">Sprawdź</button><button type="button" class="btn" id="kz-hint">Podpowiedz literę</button></div><p class="kz-msg" id="kz-msg" aria-live="polite"></p></div>';
    var grid = $('#kz-grid'), lastCell = null;
    function word(ri) { return [].map.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]'), function (i) { return (i.value || ' ').toUpperCase(); }).join(''); }
    function pass() { var sp = $('#kz-pass').children; set.r.forEach(function (r, ri) { var c = grid.querySelector('.kz-c[data-r="' + ri + '"][data-k="' + r[2] + '"]'); sp[ri].textContent = c ? c.value.toUpperCase() : ''; }); }
    function store() { set.r.forEach(function (_, ri) { st.v[ri] = word(ri); }); lsSet(key, st); pass(); }
    function cellsOf(ri) { return [].slice.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]')); }
    function focusRow(ri) { [].forEach.call(document.querySelectorAll('.kz-clues li'), function (li) { li.classList.toggle('is-on', +li.dataset.r === ri); }); [].forEach.call(grid.querySelectorAll('.kz-row'), function (r) { r.classList.toggle('is-on', +r.dataset.r === ri); }); }
    grid.addEventListener('focusin', function (e) { if (e.target.classList.contains('kz-c')) { lastCell = e.target; focusRow(+e.target.dataset.r); e.target.select(); } });
    grid.addEventListener('input', function (e) {
      var i = e.target; if (!i.classList.contains('kz-c')) return;
      var v = (i.value || '').toUpperCase().replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, ''); i.value = v.slice(-1);
      i.closest('.kz-row').classList.remove('is-bad', 'is-ok');
      if (i.value) { var cs = cellsOf(+i.dataset.r), n = cs[cs.indexOf(i) + 1]; if (n) n.focus(); }
      store();
    });
    grid.addEventListener('keydown', function (e) {
      var i = e.target; if (!i.classList.contains('kz-c')) return; var ri = +i.dataset.r, cs = cellsOf(ri), at = cs.indexOf(i);
      if (e.key === 'Backspace' && !i.value && cs[at - 1]) { e.preventDefault(); cs[at - 1].value = ''; cs[at - 1].focus(); store(); }
      else if (e.key === 'ArrowLeft' && cs[at - 1]) cs[at - 1].focus();
      else if (e.key === 'ArrowRight' && cs[at + 1]) cs[at + 1].focus();
      else if ((e.key === 'ArrowDown' || e.key === 'Enter') && ri < set.r.length - 1) { e.preventDefault(); cellsOf(ri + 1)[0].focus(); }
      else if (e.key === 'ArrowUp' && ri > 0) cellsOf(ri - 1)[0].focus();
    });
    document.querySelector('.kz-clues').addEventListener('click', function (e) { var li = e.target.closest('[data-r]'); if (li) { var c = cellsOf(+li.dataset.r).find(function (x) { return !x.value; }) || cellsOf(+li.dataset.r)[0]; c.focus(); } });
    function win() {
      grid.classList.add('is-done'); [].forEach.call(grid.querySelectorAll('.kz-c'), function (i) { i.readOnly = true; }); $('#kz-pass').classList.add('is-done'); pass();
      $('#kz-msg').innerHTML = '<div class="sz-end is-win">' + K('imprezowa', 'gk') + '<div><b>Rozwiązane!</b><span>Hasło tygodnia: ' + set.h + '. Mokra robota.' + (arch ? ' <a href="#/gry/krzyzowka-arch">Wróć do archiwum</a>' : '') + '</span></div><button type="button" class="btn btn-primary btn-sm" id="kz-share">' + ICO.share + ' Udostępnij</button></div>';
      $('#kz-share').onclick = function () { share('Rozwiązałem Krzyżówkę Tygodnia na Śliskiej 🧩 Dasz radę?\n' + LINK + '/krzyzowka', { knaga: 'szlafrok', c: G('krzyzowka').c, eyebrow: arch ? 'Krzyżówka · archiwum' : 'Krzyżówka Tygodnia #' + W, title: 'Rozwiązana', big: '✓', unit: set.r.length + ' wyrazów + hasło', lines: [] }); };
      if (!st.done) {
        st.done = 1; lsSet(key, st); lsSet('sn-krzyz-done-' + W, 1); var d = load();
        if (arch) { d.archSolved = (d.archSolved || 0) + 1; save(d); toast('Krzyżówka z archiwum rozwiązana! 🧩'); }
        else { d.solved = (d.solved || 0) + 1; save(d); submit('krzyzowka', d.solved); played('krzyzowka'); toast('Krzyżówka rozwiązana! 🧩'); }
        achEval('krzyzowka', { solved: d.solved || 0, arch: d.archSolved || 0 });
      }
    }
    $('#kz-check').onclick = function () {
      var bad = 0, empty = 0;
      set.r.forEach(function (r, ri) { var w = word(ri), row = grid.querySelector('.kz-row[data-r="' + ri + '"]'); if (w.indexOf(' ') >= 0) { empty++; row.classList.remove('is-bad', 'is-ok'); return; } var ok = w === r[0]; row.classList.toggle('is-ok', ok); row.classList.toggle('is-bad', !ok); if (!ok) bad++; });
      if (!bad && !empty) win(); else $('#kz-msg').textContent = bad ? 'Błędne wyrazy: ' + bad + '. Popraw zaznaczone na czerwono.' : 'Uzupełnij jeszcze ' + empty + (empty === 1 ? ' wyraz.' : ' wyrazy.');
    };
    $('#kz-hint').onclick = function () {
      var ri = lastCell ? +lastCell.dataset.r : -1;
      var tryRow = function (r) { var cs = cellsOf(r), w = set.r[r][0]; for (var k = 0; k < cs.length; k++) if (cs[k].value.toUpperCase() !== w[k]) { cs[k].value = w[k]; cs[k].classList.add('is-given'); cs[k].focus(); store(); return true; } return false; };
      if (ri >= 0 && tryRow(ri)) return; for (var r = 0; r < set.r.length; r++) if (tryRow(r)) return;
    };
    pass();
    if (st.done || lsGet('sn-krzyz-done-' + W)) {            // ta krzyżówka jest już rozwiązana: pokaż rozwiązanie i zablokuj
      st.done = 1; set.r.forEach(function (r, ri) { cellsOf(ri).forEach(function (c, k) { c.value = r[0][k]; }); });
      win(); [].forEach.call(document.querySelectorAll('#kz-check, #kz-hint'), function (b) { b.disabled = true; });
    }
  }

  /* sekcja „Śliska strefa” w lewym pasku: podświetlenie bieżącej strony i plakietka „Nowe słowo”, dopóki dzisiejsze Ślizgle nie są rozwiązane */
  function zone() {
    var h = location.hash || '#/', st = slizgleState(), pill = document.querySelector('.zone-pill');
    [].forEach.call(document.querySelectorAll('.zone-list a'), function (a) { var p = a.getAttribute('href'); a.classList.toggle('active', h === p || h.indexOf(p + '/') === 0 || (p === '#/dramy' && /^#\/drama\//.test(h))); });
    if (pill) pill.hidden = !!(st && st.end);
  }
  window.addEventListener('hashchange', function () { setTimeout(zone, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zone); else zone();

  var RUN = { krzyzowka: krzyzowka, slizgle: slizgle, krople: krople, flappy: flappy, waz: waz, ukladanka: ukladanka, drama: dramaOff, slizgawka: slizgawka, kregle: kregle, pojedynek: pojedynek, ratunek: ratunek, karny: karny, gabin: function (el) { if (window.GabinGame) GabinGame.mount(el); else hub(el); } };
  window.SliskieGry = {
    shareCard: shareCard,
    mount: function (el, sub, ctx) {
      stopAll();
      var am = /^krzyzowka-arch(?:-(n?\d+))?$/.exec(sub || '');
      if (am) { if (am[1] == null) krzArchive(el, ctx || {}); else krzArchPlay(el, am[1].charAt(0) === 'n' ? -Number(am[1].slice(1)) : Number(am[1]), ctx || {}); }
      else if (sub && RUN[sub]) { mint(sub); RUN[sub](el, ctx || {}); } else hub(el);
      window.scrollTo(0, 0);
    },
    stop: stopAll,
    best: best, fmt: fmt, games: GAMES, _t: window.__GRY_TEST ? { submit: submit, played: played, share: share } : null
  };
})();
