/* Śliska News – automatyczna Krzyżówka Tygodnia z artykułów. Używana przez grę (#/gry/krzyzowka), gdy właściciel nie ułożył
   własnej, i przez panel (dev.sliska.pl/gry), gdzie wygenerowaną można poprawić i zapisać. Wynik jest stały przez cały tydzień:
   bierze tylko artykuły opublikowane przed poniedziałkiem danego tygodnia, a losowanie zależy od numeru tygodnia. */
(function () {
  'use strict';
  var L = 'A-ZĄĆĘŁŃÓŚŹŻ';
  var HASLA = ['AFERA', 'DRAMA', 'SKANDAL', 'PLOTKA', 'ROMANS', 'ZDRADA', 'ŚLISKO', 'MOKRO', 'WTOPA', 'PRZYPAŁ', 'KNAGA', 'SCENA', 'HEJTER', 'OBCIACH', 'FLIRT', 'IMPREZA', 'NAGONKA', 'ŚCIEMA', 'WYCIEK', 'GALA'];
  /* zapas, gdy w artykułach brakuje wyrazu z daną literą */
  var BANK = [['ALBUM', 'Płyta z kilkoma utworami'], ['AFERA', 'Głośny skandal'], ['ARESZT', 'Tam trafia się po zatrzymaniu'], ['BEAT', 'Podkład muzyczny pod rap'], ['BEEF', 'Konflikt dwóch raperów, z angielskiego'],
    ['CENZURA', 'Wycina niewygodne słowa'], ['CHÓRKI', 'Śpiewają w tle za wokalistą'], ['DISS', 'Utwór, w którym raper atakuje innego'], ['DRAMA', 'Internetowa afera'], ['ESKA', 'Popularne radio z hitami'],
    ['FANKA', 'Wierna słuchaczka artysty'], ['FEAT', 'Gościnny udział innego artysty w numerze'], ['FEJK', 'Nieprawdziwa informacja'], ['FLIRT', 'Niewinne podrywanie'], ['GALA', 'Uroczysta impreza z wręczeniem nagród'],
    ['GOLAS', 'Ktoś bez ubrania'], ['HEJT', 'Fala złych komentarzy'], ['HITY', 'Największe przeboje'], ['IMPREZA', 'Zabawa do rana'], ['INSTA', 'Potocznie: Instagram'],
    ['JURY', 'Oceniają w talent show'], ['KLIP', 'Teledysk, inaczej'], ['KONCERT', 'Występ na żywo'], ['KŁAMCA', 'Mówi nieprawdę'], ['LANS', 'Pokazywanie się dla poklasku'],
    ['LIVE', 'Transmisja na żywo'], ['ŁAPÓWKA', 'Pieniądze pod stołem'], ['MERCH', 'Koszulki i bluzy z logo artysty'], ['MIKROFON', 'Bez niego wokalista nic nie zdziała'], ['MOKRO', 'Na Śliskiej zawsze jest…'],
    ['NAGRODA', 'Statuetka dla najlepszych'], ['NUTA', 'Znak w zapisie muzycznym'], ['OBCIACH', 'Coś wstydliwego, siara'], ['OSZUST', 'Ktoś, kto naciąga innych'], ['PLAGIAT', 'Kradzież cudzego utworu'],
    ['PLOTKA', 'Niesprawdzona informacja z drugiej ręki'], ['POZEW', 'Pismo do sądu'], ['PRZYPAŁ', 'Wstydliwa wpadka, slangowo'], ['RANDKA', 'Spotkanie we dwoje'], ['RAPER', 'Artysta nawijający wersy'],
    ['REFREN', 'Powtarzająca się część piosenki'], ['ROMANS', 'Potajemny związek'], ['SAMPEL', 'Fragment cudzego utworu użyty w nowym'], ['SCENA', 'Miejsce, na którym gra się koncert'], ['SKANDAL', 'Afera, o której mówią wszyscy'],
    ['SOLÓWKA', 'Popis jednego muzyka'], ['STORY', 'Relacja znikająca po 24 godzinach'], ['ŚCIEMA', 'Kłamstewko, bajer'], ['ŚLIZG', 'Ruch po mokrej powierzchni'], ['TRASA', 'Seria koncertów w różnych miastach'],
    ['TEKST', 'Słowa piosenki'], ['TOKSYK', 'Toksyczna osoba'], ['WINYL', 'Czarna płyta dla kolekcjonerów'], ['WTOPA', 'Kompromitująca wpadka'], ['WYCIEK', 'Niekontrolowane ujawnienie informacji'],
    ['ZDRADA', 'Niewierność w związku'], ['ZŁOTA', 'Płyta za dużą sprzedaż'], ['ŹRÓDŁO', 'Skąd redakcja wie o newsie'], ['ŻART', 'Coś na śmiech'], ['ŻYCIE', 'Na scenie i poza nią – prywatne…'],
    ['DŹWIĘK', 'To, co słychać'], ['UWAGA', 'O to walczą influencerzy'], ['YOUTUBE', 'Serwis z teledyskami'], ['NIEŚMIAŁA', 'Taka bywa Knaga'], ['CIĘŻKI', 'Taki bywa bit'], ['KSIĘŻNA', 'Arystokratka'], ['GĘŚ', 'Ptak, „ni w pięć, ni w…”'], ['ŻÓŁW', 'Wolny jak…'], ['WĄŻ', 'Gra w Śliskich Grach: Śliski…']];
  var STOP = /^(KTÓRY|KTÓRA|KTÓRE|PRZEZ|TYLKO|BĘDZIE|JESZCZE|BARDZO|WSZYSTKO|DLACZEGO|PODCZAS|NOWY|NOWA|NOWE|JEST|BYŁO|ZOSTAŁ|ZOSTAŁA|ZNOWU|MOŻE|ORAZ|TAKŻE|NAWET|SWOJE|SWOJĄ|CZYLI|ALBO|TERAZ|DZIŚ|KIEDY|JAKIE|PONAD|PIERWSZY|PIERWSZA|NOWEGO|NOWEJ|WRESZCIE|WIELKI|WIELKA)$/;
  var up = function (w) { return String(w || '').toUpperCase().replace(new RegExp('[^' + L + ']', 'g'), ''); };
  function rng(seed) { var a = seed >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function weekStart(w) { return new Date(2026, 10, 1 + w * 7 - 6).getTime(); }
  /** Wyrazy z artykułów z gotowymi pytaniami: wykonawcy i tytuły z recenzji, jednowyrazowe tagi, słowa z tytułów. */
  function pool(arts) {
    var out = [], seen = {};
    var art = ''; function add(w, clue, kind) { w = up(w); if (w.length < 3 || w.length > 10 || seen[w] || STOP.test(w)) return; seen[w] = 1; out.push({ w: w, c: clue, kind: kind, a: art }); }
    (arts || []).forEach(function (a) {
      var t = '„' + a.title + '”', rv = a.review || {}; art = a.id || a.title;
      if (rv.artist && !/\s/.test(String(rv.artist).trim())) add(rv.artist, 'Wykonawca z recenzji ' + t, 'wykonawca');
      if (rv.work && !/\s/.test(String(rv.work).trim())) add(rv.work, 'Tytuł zrecenzowanego dzieła' + (rv.artist ? ' (' + rv.artist + ')' : ''), 'tytuł');
      (a.tags || []).forEach(function (g) { if (!/\s/.test(String(g).trim())) add(g, 'Bohater / temat artykułu ' + t, 'tag'); });
      String(a.title || '').split(/[\s,.:;!?„”"()–\-]+/).forEach(function (w) { if (w.length >= 5 && /^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(w)) add(w, 'Uzupełnij tytuł artykułu: „' + a.title.replace(w, '…') + '”', 'z tytułu'); });
    });
    return out;
  }
  /** Artykuły, z których powstaje krzyżówka tygodnia w (opublikowane przed jego poniedziałkiem, najnowsze 15 – tyle zawsze ma też strona). */
  function source(arts, w) {
    var t0 = weekStart(w);
    return (arts || []).filter(function (a) { return !a.quick && a.status !== 'draft' && Date.parse(a.createdAt) < t0; })
      .sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt) || String(a.id).localeCompare(String(b.id)); }).slice(0, 15);
  }
  /** Krzyżówka z artykułów: { h, r: [[wyraz, pytanie, pozycja]], gen: true, fromArts: liczba wyrazów z artykułów }. */
  function generate(arts, w) {
    var R = rng(w * 7919 + 13), P = pool(source(arts, w)), used = {};
    var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(R() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var RANK = { wykonawca: 0, tytuł: 0, tag: 1, 'z tytułu': 2 };
    var hasla = shuffle(HASLA), P2 = shuffle(P).sort(function (a, b) { return RANK[a.kind] - RANK[b.kind]; }), B2 = shuffle(BANK.map(function (b) { return { w: b[0], c: b[1], kind: 'bank' }; }));
    for (var hi = 0; hi < hasla.length; hi++) {
      var h = hasla[hi], rows = [], fromArts = 0, ok = true, perArt = {}; used = {};
      for (var i = 0; i < h.length; i++) {
        var ch = h[i], pick = null;
        var fits = function (x) { return x.w.indexOf(ch) >= 0 && !used[x.w] && x.w !== h; };
        pick = P2.filter(function (x) { return fits(x) && !perArt[x.a]; })[0] ||                       // najpierw po jednym wyrazie z artykułu
          (i % 2 ? null : P2.filter(function (x) { return fits(x) && (perArt[x.a] || 0) < 2 && x.kind !== 'z tytułu'; })[0]) || null;
        if (pick) { fromArts++; perArt[pick.a] = (perArt[pick.a] || 0) + 1; }
        else pick = B2.filter(fits)[0] || null;
        if (!pick) { ok = false; break; }
        used[pick.w] = 1; rows.push([pick.w, pick.c, pick.w.indexOf(ch)]);
      }
      if (ok) return { h: h, r: rows, gen: true, fromArts: fromArts };
    }
    return null;
  }
  window.KrzGen = { pool: pool, source: source, generate: generate, weekStart: weekStart };
})();
