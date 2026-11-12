/* Śliska News – słownik kategorii i tagów (wspólny dla czytnika i edytora; studio wczytuje /news/taxonomy.js).
 * Tagi mają jeden styl: małe litery, bez spacji i polskich znaków, tylko a–z i cyfry (np. „tamarakenarycka”, „singiel”).
 * Edytor sam poprawia tagi (normTag), łączy synonimy, usuwa tagi powtarzające kategorię
 * i rozpoznaje osoby z tekstu w każdej odmianie (PEOPLE). */
(function () {
  'use strict';
  var CATEGORIES = ['Muzyka', 'Recenzje', 'Dramy', 'Gwiazdy', 'Polityka', 'Inne'];
  var INFO = {
    Muzyka: 'Premiery, single, płyty, koncerty, wywiady i wieści z wytwórni.',
    Recenzje: 'Oceny płyt, EP-ek i singli – z Miernikiem i rankingiem.',
    Dramy: 'Konflikty, afery, zdrady, beefy – wszystko, co wybucha.',
    Gwiazdy: 'Życie prywatne gwiazd: związki, imprezy, zdjęcia i plotki.',
    Polityka: 'Śliska polityka – satyra na władzę i „ważne decyzje państwowe”.',
    Inne: 'Sprawy redakcji i to, co nie pasuje do żadnego działu.'
  };
  /** Stare nazwy kategorii → nowe (artykuły sprzed zmiany i stare linki #/kategoria/…). */
  var CAT_ALIAS = { Kontrowersje: 'Dramy' };

  /** Osoby, wytwórnie, miejsca: tag + nazwa do wyświetlania + rdzenie do rozpoznania w tekście (po złożeniu znaków). */
  var PEOPLE = [
    ['tamarakenarycka', 'Tamara Kenarycka', ['kenaryck', 'kanaryck', 'tamara k']],
    ['fionafikunova', 'Fiona Fikunova', ['fikunov', 'fiona', 'fiony', 'fionie', 'fione']],
    ['lucynakredka', 'Lucyna Kredka', ['kredk']],
    ['pornolamariola', 'PornolaMariola', ['pornolamariol', 'pornola mariol']],
    ['szmatkalolka', 'Szmatka Lolka', ['szmatka lolk', 'szmata lolk', 'szmatkalolk']],
    ['lysaszprotka', 'Łysa Szprotka', ['szprotk']],
    ['elizkasztos', 'Elizka Sztos', ['elizk']],
    ['biancabzykalewska', 'Bianca Bzykalewska', ['bzykalewsk', 'bianca', 'bianci', 'biance', 'biancy', 'bianke']],
    ['jessjessica', 'Jess Jessica', ['jess jessic', 'jessica rosa', 'jessiki', 'jessici']],
    ['ladyrafaella', 'Lady Rafaella', ['rafaell']],
    ['lejdiluna', 'Lejdi Luna', ['lejdi lun']],
    ['suziedealdough', 'Suzie Dealdough', ['dealdough']],
    ['eronaqueen', 'Erona Queen', ['erona queen', 'erone queen', 'erony queen', 'eroną queen']],
    ['gaenovefa', 'GAENOVEFA', ['gaenovef', 'gaeanovef']],
    ['klamediablue', 'Klamedia Blue', ['klamedi']],
    ['shemrel', 'Shemrel', ['shemrel']],
    ['texasbeau', 'Texas Beau', ['texas']],
    ['alinamodelina', 'Alina Modelina', ['modelin']],
    ['dorotaswierkwcipie', 'Dorota Świerkwcipie', ['swierkwcipi']],
    ['donaldtusk', 'Donald Tusk', ['tusk']],
    ['sandrakret', 'Sandra Kret', ['sandra kret', 'sandry kret', 'sandrze kret']],
    ['juliavonpierdol', 'Julia Von Pierdol', ['von pierdol']],
    ['crackrecordings', 'CRACK Recordings', ['crack record']],
    ['sliska10', 'Śliska 10', ['sliska 10', 'sliskiej 10', 'spotted sliska']]
  ];
  /** Synonimy i warianty → jeden tag. */
  var SYN = {
    wesele: 'slub', milosc: 'zwiazek', zwiazki: 'zwiazek', para: 'zwiazek',
    epka: 'ep', epki: 'ep', minialbum: 'ep', single: 'singiel', utwor: 'singiel', piosenka: 'singiel',
    plyta: 'album', albumy: 'album', klip: 'teledysk', wideoklip: 'teledysk', koncert: 'trasa', koncerty: 'trasa', trasakoncertowa: 'trasa',
    rozmowa: 'wywiad', exposed: 'exposing', ujawnienie: 'exposing', rp: 'rzeczpospolita', polska: 'rzeczpospolita',
    zerwanie: 'rozstanie', skandal: 'afera', kontrowersyjne: 'afera',
    tamarakanarycka: 'tamarakenarycka', gaeanovefa: 'gaenovefa', szmatalolka: 'szmatkalolka', jessicarosa: 'jessjessica',
    crackrecording: 'crackrecordings', crack: 'crackrecordings'
  };
  /** Tagi, które tylko powtarzają kategorię albo nic nie mówią – usuwane. */
  var DROP = ['muzyka', 'recenzja', 'recenzje', 'drama', 'dramy', 'kontrowersja', 'kontrowersje', 'inne', 'gwiazdy', 'gwiazda',
    'polityka', 'sliska', 'sliskanews', 'news', 'newsy', 'showbiznes', 'plotki', 'artykul', 'nowinka', 'nowinki'];
  /** Słownik tematów – podpowiadany w edytorze, gdy pasuje do tekstu. */
  var TOPICS = [
    ['premiera', ['premiera', 'premiery', 'premierze', 'premiere', 'zadebiut', 'debiut', 'ukaze sie', 'trafi na platformy']],
    ['zapowiedz', ['zapowiad', 'zapowiedzial', 'zapowiedz nowe', 'zapowiedz albumu', 'zapowiedz singla']],
    ['album', ['album', 'plyt', 'krazek']],
    ['ep', ['ep ', 'ep-k', 'epk', 'epce']],
    ['singiel', ['singl', 'singiel']],
    ['teledysk', ['teledysk', 'klip']],
    ['trasa', ['trase koncert', 'trasa koncert', 'trasy koncert', 'koncert']],
    ['wywiad', ['wywiad', 'w rozmowie z']],
    ['wytwornia', ['wytworni', 'label', 'recordings', 'recording']],
    ['zwiazek', ['zwiazk', 'chlopak', 'partner', 'czulosci', 'romans']],
    ['zdrada', ['zdrada', 'zdrady', 'zdrade', 'zdradzie', 'romans']],
    ['slub', ['slub', 'wesel', 'pan mlody', 'oltarz']],
    ['rozstanie', ['rozstan', 'zerwal', 'rozpad']],
    ['afera', ['afer', 'skandal', 'awantur', 'konflikt', 'oskarzen']],
    ['exposing', ['exposing', 'akta', 'przeszlosc', 'przeswietlil']],
    ['halloween', ['halloween']],
    ['instagram', ['instagram', 'instastories']],
    ['satyra', ['premier ', 'konstytuc', 'sejm', 'oredzi', 'prezydent', 'tusk']],
    ['redakcja', ['dolacza do redakcji', 'odchodzi z redakcji', 'w redakcji pojawi', 'nowa redaktor', 'nowy redaktor']]
  ];

  var fold = function (s) { return String(s || '').toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var DROPS = {}; DROP.forEach(function (t) { DROPS[t] = 1; });
  var PEOPLE_BY_TAG = {}; PEOPLE.forEach(function (p) { PEOPLE_BY_TAG[p[0]] = p; });

  /** „Tamara Kenarycka” / „#Tamara_Kenarycka” / „tamarakenarycka” → „tamarakenarycka”; '' = do usunięcia. */
  function normTag(t) {
    var k = fold(String(t || '').replace(/^#+/, '')).replace(/[^a-z0-9]+/g, '').slice(0, 40);
    if (!k || k.length < 2) return '';
    if (SYN[k]) k = SYN[k];
    if (DROPS[k]) return '';
    return k;
  }
  /** Lista tagów: poprawione, bez duplikatów i bez śmieci (bez limitu). */
  function normTags(list) {
    var seen = {}, out = [];
    (list || []).forEach(function (t) { var k = normTag(t); if (k && !seen[k]) { seen[k] = 1; out.push(k); } });
    return out;
  }
  /** Kategorie artykułu po zmianie nazw (stare „Kontrowersje” → „Dramy”), bez duplikatów. */
  function normCats(list) {
    var seen = {}, out = [];
    (list || []).forEach(function (c) { c = CAT_ALIAS[c] || c; if (c && !seen[c]) { seen[c] = 1; out.push(c); } });
    return out;
  }
  function folded(text) { return ' ' + fold(text).replace(/[^a-z0-9]+/g, ' ') + ' '; }
  /** Osoby i tematy wykryte w tekście → tagi (osoby najpierw). */
  function detect(text) {
    var f = folded(text), people = [], topics = [];
    PEOPLE.forEach(function (p) { if (p[2].some(function (a) { return f.indexOf(' ' + fold(a).replace(/[^a-z0-9]+/g, ' ')) >= 0; })) people.push(p[0]); });
    TOPICS.forEach(function (t) { if (t[1].some(function (a) { return f.indexOf(' ' + fold(a).replace(/[^a-z0-9 -]+/g, ' ').replace(/-/g, ' ')) >= 0; })) topics.push(t[0]); });
    return { people: people, topics: topics };
  }
  /** Ładna nazwa tagu do wyświetlania (np. w podpowiedziach): „tamarakenarycka” → „Tamara Kenarycka”. */
  function label(tag) { var p = PEOPLE_BY_TAG[tag]; return p ? p[1] : tag; }
  /** Propozycja kategorii z treści (do Nowinek i jako podpowiedź). */
  function guessCats(text) {
    var f = folded(text), out = [];
    var has = function (arr) { return arr.some(function (a) { return f.indexOf(' ' + a) >= 0; }); };
    if (has(['tusk', 'premier ', 'sejm', 'konstytuc', 'oredzi', 'prezydent', 'sedzi', 'rzad', 'referend'])) out.push('Polityka');
    if (has(['singl', 'singiel', 'album', 'plyt', 'ep ', 'epk', 'utwor', 'trase koncert', 'koncert', 'premiera', 'premiery', 'premierz', 'teledysk', 'wytworni', 'recording', 'zadebiut', 'muzyk'])) out.push('Muzyka');
    if (has(['awantur', 'afer', 'skandal', 'zdrada', 'zdrady', 'bojk', 'konflikt', 'oskarz', 'cancel', 'jebac', 'beef'])) out.push('Dramy');
    if (has(['przylapan', 'czulosci', 'zdjeci', 'synami', 'chlopak', 'imprez', 'sex', 'kulinar', 'wakacj', 'halloween'])) out.push('Gwiazdy');
    if (!out.length) out.push(has(['redakcj']) ? 'Inne' : 'Gwiazdy');
    return out.slice(0, 2);
  }
  window.SliskaTax = { CATEGORIES: CATEGORIES, INFO: INFO, CAT_ALIAS: CAT_ALIAS, PEOPLE: PEOPLE, TOPICS: TOPICS,
    fold: fold, normTag: normTag, normTags: normTags, normCats: normCats, detect: detect, label: label, guessCats: guessCats };
})();
