/* Śliska News – „Wyślij reklamę” jako podstrona aplikacji (#/spot), tak samo jak „Zgłoś temat” (#/zglos).
   Wczytanie grafik, kadrowanie, kompresja, podgląd u czytelników i wysyłka do właściciela.
   Wywołanie: SpotForm.mount(element, { api, user: () => ({ name, email }) | null }). */
(function () {
  'use strict';
  var MAX_IN = 20 * 1024 * 1024;       // największy plik, który w ogóle wczytujemy
  var MAX_OUT = 500 * 1024;            // limit po kompresji (taki sam w Workerze)
  var QUAL = [0.95, 0.92, 0.89, 0.86, 0.82, 0.78, 0.74];
  var F = {
    long: { name: 'Długi pasek', css: [728, 90], out: [1456, 180], where: 'Góra strony, środek artykułu, koniec list', short: 'pasek' },
    box:  { name: 'Okienko', css: [300, 250], out: [600, 500], where: 'Okienko w rogu ekranu i popup na środku', short: 'okienko' },
    card: { name: 'Kafelek', css: [450, 500], out: [900, 1000], where: 'Kafelek między artykułami na stronie głównej', short: 'kafelek' }
  };
  var ORDER = ['long', 'box', 'card'];
  var TABS = [
    { id: 'top', name: 'Góra strony', f: 'long' }, { id: 'art', name: 'W artykule', f: 'long' }, { id: 'box', name: 'Okienko w rogu', f: 'box' },
    { id: 'popup', name: 'Popup', f: 'box' }, { id: 'card', name: 'Kafelek', f: 'card' }
  ];
  var ERR = { endpoint: 'Serwer reklam jeszcze nie został zaktualizowany. Spróbuj później.', server: 'Błąd po stronie serwera. Spróbuj za chwilę.', rate: 'Z tej sieci wysłano już sporo zgłoszeń. Spróbuj za godzinę.', full: 'Skrzynka właściciela jest chwilowo pełna. Spróbuj za kilka dni.', too_big: 'Zgłoszenie jest za duże. Usuń jeden z formatów i spróbuj ponownie.', img_dim: 'Jedna z grafik ma zły rozmiar. Wgraj ją jeszcze raz.', img_size: 'Jedna z grafik jest za ciężka. Wgraj ją jeszcze raz.', img: 'Jedna z grafik jest uszkodzona. Wgraj ją jeszcze raz.', email: 'Podaj poprawny adres e-mail.', link: 'Podaj poprawny link (zaczynający się od https://).', fields: 'Wpisz imię i nazwisko.', accept: 'Zaznacz zgodę.', method: 'Nie można wysłać z tej strony.' };
  /* miniaturki „gdzie się pokaże” – szkic strony z zaznaczonym miejscem */
  var WHERE = {
    long: '<rect x="1" y="1" width="46" height="34" rx="4" class="w-pg"/><rect x="5" y="5" width="38" height="5" rx="1.5" class="w-ad"/><rect x="5" y="14" width="26" height="3" rx="1.5" class="w-ln"/><rect x="5" y="20" width="38" height="2.5" rx="1.25" class="w-ln"/><rect x="5" y="25" width="32" height="2.5" rx="1.25" class="w-ln"/>',
    box: '<rect x="1" y="1" width="46" height="34" rx="4" class="w-pg"/><rect x="5" y="6" width="26" height="3" rx="1.5" class="w-ln"/><rect x="5" y="12" width="36" height="2.5" rx="1.25" class="w-ln"/><rect x="5" y="17" width="30" height="2.5" rx="1.25" class="w-ln"/><rect x="29" y="20" width="15" height="12" rx="2" class="w-ad"/>',
    card: '<rect x="1" y="1" width="46" height="34" rx="4" class="w-pg"/><rect x="5" y="6" width="11" height="25" rx="2" class="w-ln"/><rect x="18.5" y="6" width="11" height="25" rx="2" class="w-ad"/><rect x="32" y="6" width="11" height="25" rx="2" class="w-ln"/>'
  };

  var S, root, opts, tab = 'top', dev = 'desktop', C = null, born = 0;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var kb = function (b) { return b < 1048576 ? Math.round(b / 1024) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB'; };
  var validLink = function (v) { return /^https?:\/\/[^\s]+\.[^\s]{2,}$/i.test(v); };
  var validMail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
  var ICO = {
    up: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>',
    ok: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    gift: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    back: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>'
  };

  /* ---------- szkielet strony ---------- */
  function shell() {
    return '<div class="article-top"><a class="btn btn-back" href="#/">' + (typeof ICON === 'function' ? ICON('back', 17) : ICO.back) + '<span>Powrót do strony głównej</span></a></div>' +
      '<header class="spf-hero">' +
        '<span class="spf-eyebrow">Dla reklamodawców</span>' +
        '<h1>Wyślij reklamę</h1>' +
        '<p>Niech wielka Knaga smyra Twój ekran! Reklama w Śliskiej News jest <b>całkowicie darmowa</b>. Zgłoszenie trafia <b>wyłącznie do właściciela serwisu</b> – jeśli się spodoba, odpiszemy na podany e-mail i ustalimy szczegóły.</p>' +
        '<ul class="spf-perks"><li>' + ICO.gift + 'Za darmo</li><li>' + ICO.lock + 'Widzi tylko właściciel</li><li>' + ICO.mail + 'Odpowiedź mailem</li></ul>' +
      '</header>' +
      '<ol class="spf-progress" id="spf-progress"><li data-s="1"><i>1</i><span>Grafiki</span></li><li data-s="2"><i>2</i><span>Podgląd</span></li><li data-s="3"><i>3</i><span>Wysyłka</span></li></ol>' +
      '<div class="spf-layout">' +
        '<section class="panel spf-card spf-g" aria-labelledby="spf-h1"><h2 id="spf-h1"><i>1</i>Grafiki</h2>' +
          '<p class="spf-sub">Wystarczy jeden format – im więcej, tym więcej miejsc, w których pokaże się reklama. JPG, PNG lub WebP do 20 MB. Złe proporcje poprawisz tu sam, a my dopasujemy rozmiar i skompresujemy grafikę (maks. 500 KB) bez widocznej straty jakości.</p>' +
          '<div class="spf-slots" id="spf-slots"></div></section>' +
        '<section class="panel spf-card spf-p" aria-labelledby="spf-h2"><div class="spf-head"><h2 id="spf-h2"><i>2</i>Podgląd u czytelników</h2>' +
          '<div class="spf-seg" role="group" aria-label="Urządzenie"><button type="button" class="is-on" data-dev="desktop">Komputer</button><button type="button" data-dev="phone">Telefon</button></div></div>' +
          '<div class="spf-tabs" id="spf-tabs" role="tablist"></div><div class="pv pv-desktop" id="spf-pv"></div><p class="spf-note" id="spf-note"></p></section>' +
        '<section class="panel spf-card spf-d" aria-labelledby="spf-h3"><h2 id="spf-h3"><i>3</i>Dane i wysyłka</h2>' +
          '<form id="spf-form" novalidate>' +
            '<p class="spf-acct" id="spf-acct" hidden></p>' +
            '<div class="spf-grid">' +
              '<label class="field"><span class="field-label">Imię i nazwisko *</span><input type="text" id="spf-name" maxlength="80" autocomplete="name"></label>' +
              '<label class="field"><span class="field-label">E-mail do odpowiedzi *</span><input type="text" inputmode="email" id="spf-email" maxlength="120" autocomplete="email"></label>' +
            '</div>' +
            '<label class="field"><span class="field-label">Dokąd ma prowadzić reklama? *</span><input type="text" inputmode="url" id="spf-link" maxlength="300" placeholder="https://" autocomplete="off"></label>' +
            '<label class="field"><span class="field-label">Uwagi (opcjonalnie)</span><textarea id="spf-note-in" rows="3" maxlength="600" placeholder="Np. na jaki czas i w jakich miejscach najchętniej"></textarea><small class="hint"><span id="spf-note-n">0</span>/600</small></label>' +
            '<label class="check spf-check"><input type="checkbox" id="spf-ok"><span>Mam prawa do tej grafiki i treści reklamy, nie jest ona nielegalna ani wprowadzająca w błąd. Rozumiem, że zgłoszenie nie gwarantuje publikacji, a właściciel może je odrzucić bez podania powodu. Zgadzam się, by moje dane (imię, e-mail) posłużyły wyłącznie do odpowiedzi na to zgłoszenie. *</span></label>' +
            '<ul class="spf-todo" id="spf-todo" aria-label="Co jeszcze trzeba uzupełnić"></ul>' +
            '<p class="form-error" id="spf-err" role="alert" hidden></p>' +
            '<div class="spf-actions"><button type="submit" class="btn btn-primary" id="spf-send" disabled>Wyślij reklamę</button></div>' +
          '</form>' +
          '<div class="spf-done" id="spf-done" hidden><div class="spf-done-ic">' + ICO.ok + '</div><h3>Poszło!</h3><p>Twoja reklama trafiła do właściciela serwisu. Jeśli będzie pasować, odpiszemy na <b id="spf-done-mail"></b>.</p><button type="button" class="btn" id="spf-again">Wyślij kolejną reklamę</button></div>' +
        '</section>' +
      '</div>' +
      '<p class="spf-foot">Zasady: bez treści nielegalnych, wprowadzających w błąd i nawołujących do nienawiści. Reklamy są oznaczane jako „Sponsorowane”.</p>';
  }

  /* okno kadrowania – jedno na całą aplikację */
  function cropModal() {
    if (document.getElementById('spf-crop')) return;
    var m = document.createElement('div');
    m.className = 'spf-modal'; m.id = 'spf-crop'; m.hidden = true;
    m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'spf-crop-t');
    m.innerHTML = '<div class="spf-modal-box"><h3 id="spf-crop-t">Przytnij grafikę</h3><p class="spf-sub" id="spf-crop-info"></p>' +
      '<div class="spf-stage"><canvas id="spf-cv"></canvas></div>' +
      '<label class="spf-zoom"><span>Przybliżenie</span><input type="range" id="spf-zoom" min="1" max="4" step="0.01" value="1"></label>' +
      '<p class="spf-warn" id="spf-crop-warn" hidden></p>' +
      '<p class="spf-hint">Przeciągnij grafikę, by ustawić kadr. Kółkiem myszy, dwoma palcami lub suwakiem zmienisz przybliżenie.</p>' +
      '<div class="spf-modal-act"><button type="button" class="btn" id="spf-crop-cancel">Anuluj</button><button type="button" class="btn" id="spf-crop-reset">Dopasuj</button><button type="button" class="btn btn-primary" id="spf-crop-ok">Zapisz kadr</button></div></div>';
    document.body.appendChild(m);
    bindCrop(m);
  }

  /* ---------- sloty na grafiki ---------- */
  function slotHtml(f) {
    var d = F[f], s = S[f], o = d.out, c = d.css, body = '';
    var head = '<div class="spf-slot-h"><svg class="spf-where" viewBox="0 0 48 36" aria-hidden="true">' + WHERE[f] + '</svg>' +
      '<div class="spf-slot-t"><b>' + d.name + '</b><small>' + d.where + '</small></div>' +
      '<span class="spf-badge' + (s.res ? ' is-ok' : '') + '">' + (s.res ? ICO.ok + 'Gotowe' : o[0] + '×' + o[1]) + '</span></div>';
    if (s.err) body += '<p class="spf-err">' + esc(s.err) + '</p>';
    if (s.res) {
      var r = s.res, warn = r.q < 0.8 || r.soft;
      body += '<div class="spf-res"><div class="spf-thumb" style="aspect-ratio:' + o[0] + '/' + o[1] + '"><img src="' + r.dataUrl + '" alt="Podgląd: ' + d.name + '"></div>' +
        '<div class="spf-meta"><span class="spf-chip' + (warn ? ' is-warn' : '') + '">' + o[0] + '×' + o[1] + ' · ' + kb(r.bytes) + '</span>' +
        '<span>jakość ' + Math.round(r.q * 100) + '%' + (s.bytes > r.bytes * 1.15 ? ' · z ' + kb(s.bytes) : '') + '</span>' +
        (r.soft ? '<span class="spf-soft">niższa rozdzielczość – na ekranach Retina nieco mniej ostra</span>' : '') + '</div>' +
        '<div class="spf-btns"><button type="button" class="btn btn-sm" data-act="crop" data-f="' + f + '">Przytnij</button><label class="btn btn-sm">Zmień plik<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-f="' + f + '" hidden></label><button type="button" class="btn btn-sm btn-danger" data-act="remove" data-f="' + f + '">Usuń</button></div></div>';
    } else {
      body += '<label class="spf-drop" data-f="' + f + '"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-f="' + f + '" hidden>' +
        '<span class="spf-drop-ic">' + ICO.up + '</span><span class="spf-drop-t"><b>Wybierz plik</b><span class="spf-drop-dd"> lub przeciągnij go tutaj</span></span>' +
        '<small>Zalecane ' + o[0] + '×' + o[1] + ' px · minimum ' + c[0] + '×' + c[1] + ' px</small></label>';
      var from = ORDER.filter(function (g) { return g !== f && S[g].src; })[0];
      if (from) body += '<button type="button" class="spf-reuse" data-act="reuse" data-f="' + f + '" data-from="' + from + '">Użyj grafiki z formatu „' + F[from].name + '” i przytnij →</button>';
    }
    return '<div class="spf-slot' + (s.res ? ' is-set' : '') + '" data-f="' + f + '">' + head + body + '</div>';
  }
  function renderSlots() { $('#spf-slots').innerHTML = ORDER.map(slotHtml).join(''); preview(); check(); }

  /* ---------- wczytanie pliku ---------- */
  function viaImg(file) {
    return new Promise(function (ok, no) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { URL.revokeObjectURL(u); ok(im); }; im.onerror = function () { URL.revokeObjectURL(u); no(); }; im.src = u; });
  }
  function decode(file) { return window.createImageBitmap ? createImageBitmap(file).catch(function () { return viaImg(file); }) : viaImg(file); }
  var dimsOf = function (im) { return { w: im.width || im.naturalWidth, h: im.height || im.naturalHeight }; };

  function onFile(f, file) {
    var s = S[f], d = F[f];
    if (!file) return;
    s.err = '';
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) { s.err = 'To nie jest obsługiwany plik graficzny. Użyj JPG, PNG lub WebP.'; return renderSlots(); }
    if (file.size > MAX_IN) { s.err = 'Plik ma ' + kb(file.size) + ' – to za dużo, maksimum to 20 MB.'; return renderSlots(); }
    decode(file).then(function (im) {
      var m = dimsOf(im);
      if (m.w < d.css[0] || m.h < d.css[1]) { s.err = 'Ta grafika ma ' + m.w + '×' + m.h + ' px – za mało. Minimum dla formatu „' + d.name + '” to ' + d.css[0] + '×' + d.css[1] + ' px (zalecane ' + d.out[0] + '×' + d.out[1] + ').'; return renderSlots(); }
      s.src = im; s.name = file.name; s.bytes = file.size; s.res = null;
      var ratioOk = Math.abs(m.w / m.h - d.out[0] / d.out[1]) / (d.out[0] / d.out[1]) < 0.01;
      if (ratioOk) finish(f, { sx: 0, sy: 0, sw: m.w, sh: m.h }); else openCrop(f, true);
    }).catch(function () { s.err = 'Nie udało się odczytać tej grafiki. Zapisz ją jako JPG lub PNG.'; renderSlots(); });
  }

  /* ---------- kompresja ---------- */
  function finish(f, r) {
    var d = F[f], s = S[f], cv = document.createElement('canvas'); cv.width = d.out[0]; cv.height = d.out[1];
    var ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(s.src, r.sx, r.sy, r.sw, r.sh, 0, 0, cv.width, cv.height);
    var soft = r.sw < d.out[0] || r.sh < d.out[1], i = 0;
    (function next() {
      cv.toBlob(function (blob) {
        if (!blob) { s.err = 'Nie udało się przetworzyć grafiki w tej przeglądarce.'; s.res = null; return renderSlots(); }
        if (blob.size > MAX_OUT && i < QUAL.length - 1) { i++; return next(); }
        if (blob.size > MAX_OUT) { s.err = 'Po kompresji grafika nadal waży ' + kb(blob.size) + ' (limit ' + kb(MAX_OUT) + '). Uprość tło albo usuń ziarno i szum, i wgraj ją jeszcze raz.'; s.res = null; return renderSlots(); }
        var fr = new FileReader();
        fr.onload = function () { s.err = ''; s.res = { dataUrl: fr.result, bytes: blob.size, q: QUAL[i], soft: soft }; renderSlots(); };
        fr.readAsDataURL(blob);
      }, 'image/jpeg', QUAL[i]);
    })();
  }

  /* ---------- kadrowanie ---------- */
  var M = function (id) { return document.getElementById(id); };
  function openCrop(f, fresh) {
    cropModal();
    var d = F[f], s = S[f], im = s.src, m = dimsOf(im), cv = M('spf-cv'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    M('spf-crop').hidden = false; document.body.classList.add('spf-lock');
    var maxW = Math.min(690, window.innerWidth - 64), maxH = Math.max(160, Math.min(430, window.innerHeight * 0.46));
    var cw = maxW, ch = cw * d.out[1] / d.out[0];
    if (ch > maxH) { ch = maxH; cw = ch * d.out[0] / d.out[1]; }
    cw = Math.round(cw); ch = Math.round(ch);
    cv.width = cw * dpr; cv.height = ch * dpr; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    C = { f: f, im: im, iw: m.w, ih: m.h, cw: cw, ch: ch, dpr: dpr, min: Math.max(cw / m.w, ch / m.h), z: 1, ox: 0, oy: 0 };
    M('spf-crop-t').textContent = 'Przytnij: ' + d.name + ' (' + d.out[0] + '×' + d.out[1] + ')';
    M('spf-crop-info').textContent = (fresh ? 'Grafika ma inne proporcje (' + m.w + '×' + m.h + ' px), więc ustaw kadr. ' : '') + 'Obszar w czerwonej ramce zobaczą czytelnicy.';
    reset();
  }
  function clamp() { var s = C.min * C.z; C.ox = Math.min(0, Math.max(C.cw - C.iw * s, C.ox)); C.oy = Math.min(0, Math.max(C.ch - C.ih * s, C.oy)); }
  function reset() { C.z = 1; M('spf-zoom').value = 1; var s = C.min; C.ox = (C.cw - C.iw * s) / 2; C.oy = (C.ch - C.ih * s) / 2; draw(); }
  function rect() { var s = C.min * C.z; return { sx: -C.ox / s, sy: -C.oy / s, sw: C.cw / s, sh: C.ch / s }; }
  function draw() {
    clamp();
    var cv = M('spf-cv'), ctx = cv.getContext('2d'), s = C.min * C.z;
    ctx.setTransform(C.dpr, 0, 0, C.dpr, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, C.cw, C.ch);
    ctx.imageSmoothingQuality = 'high'; ctx.drawImage(C.im, C.ox, C.oy, C.iw * s, C.ih * s);
    var r = rect(), d = F[C.f], tooSmall = r.sw < d.css[0] || r.sh < d.css[1], soft = !tooSmall && (r.sw < d.out[0] || r.sh < d.out[1]), w = M('spf-crop-warn');
    w.hidden = !(tooSmall || soft);
    w.textContent = tooSmall ? 'Za mocne przybliżenie – wycinek ma tylko ' + Math.round(r.sw) + '×' + Math.round(r.sh) + ' px, a minimum to ' + d.css[0] + '×' + d.css[1] + ' px. Oddal grafikę.' : soft ? 'Wycinek ma ' + Math.round(r.sw) + '×' + Math.round(r.sh) + ' px (zalecane ' + d.out[0] + '×' + d.out[1] + '). Zadziała, ale na ekranach Retina będzie lekko miękki.' : '';
    M('spf-crop-ok').disabled = tooSmall;
  }
  function zoomTo(z, px, py) {
    var old = C.min * C.z; C.z = Math.min(4, Math.max(1, z)); var n = C.min * C.z;
    px = px == null ? C.cw / 2 : px; py = py == null ? C.ch / 2 : py;
    C.ox = px - (px - C.ox) / old * n; C.oy = py - (py - C.oy) / old * n; M('spf-zoom').value = C.z; draw();
  }
  function closeCrop() { M('spf-crop').hidden = true; document.body.classList.remove('spf-lock'); C = null; }
  function bindCrop(m) {
    var cv = M('spf-cv'), drag = null, pts = {}, pinch = 0;
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); pts[e.pointerId] = [e.clientX, e.clientY]; if (Object.keys(pts).length === 1) drag = { x: e.clientX, y: e.clientY, ox: C.ox, oy: C.oy }; pinch = 0; });
    cv.addEventListener('pointermove', function (e) {
      if (!C || !pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
      var k = Object.keys(pts);
      if (k.length === 2) { var a = pts[k[0]], b = pts[k[1]], dist = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) zoomTo(C.z * dist / pinch); pinch = dist; return; }
      if (drag) { C.ox = drag.ox + (e.clientX - drag.x); C.oy = drag.oy + (e.clientY - drag.y); draw(); }
    });
    function up(e) { delete pts[e.pointerId]; drag = null; pinch = 0; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { if (!C) return; e.preventDefault(); var b = cv.getBoundingClientRect(); zoomTo(C.z * (e.deltaY < 0 ? 1.08 : 1 / 1.08), e.clientX - b.left, e.clientY - b.top); }, { passive: false });
    M('spf-zoom').addEventListener('input', function () { if (C) zoomTo(parseFloat(this.value)); });
    M('spf-crop-reset').addEventListener('click', function () { if (C) reset(); });
    M('spf-crop-cancel').addEventListener('click', function () { var f = C && C.f; closeCrop(); if (f && !S[f].res) S[f].src = null; if (root && root.isConnected) renderSlots(); });
    M('spf-crop-ok').addEventListener('click', function () { if (!C) return; var f = C.f, r = rect(); closeCrop(); finish(f, r); });
    m.addEventListener('click', function (e) { if (e.target === m) M('spf-crop-cancel').click(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && C) M('spf-crop-cancel').click(); });
  }

  /* ---------- podgląd ---------- */
  var lines = function () { return '<div class="pv-line"></div><div class="pv-line m"></div><div class="pv-line"></div><div class="pv-line s"></div>'; };
  function creative() {
    var c = { id: 'preview', group: 'preview', link: '#', alt: ($('#spf-name').value || 'Twoja reklama'), img: {} };
    ORDER.forEach(function (f) { if (S[f].res) c.img[f] = S[f].res.dataUrl; }); return c;
  }
  function preview() {
    var t = TABS.filter(function (x) { return x.id === tab; })[0], c = creative(), pv = $('#spf-pv'), A = window.SliskaSpot, note = '';
    $('#spf-tabs').innerHTML = TABS.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (x.id === tab) + '" class="' + (x.id === tab ? 'is-on' : '') + (S[x.f].res ? ' has' : '') + '" data-tab="' + x.id + '">' + x.name + '</button>'; }).join('');
    pv.className = 'pv pv-' + dev; pv.style.minHeight = '';
    if (!A || !A.html) { pv.innerHTML = '<div class="pv-miss">Nie udało się wczytać podglądu.</div>'; return; }
    if (!S[t.f].res) { pv.innerHTML = '<div class="pv-miss"><svg viewBox="0 0 48 36" class="spf-where" aria-hidden="true">' + WHERE[t.f] + '</svg>Dodaj grafikę „' + F[t.f].name + '”, żeby zobaczyć to miejsce.</div>'; $('#spf-note').textContent = ''; return; }
    var h = '<div class="pv-bar"></div>';
    if (tab === 'top') { h += '<div class="pv-top"><div class="sp-slot sp-slot-long">' + A.html('top', c) + '</div><div class="sp-slot sp-slot-short">' + A.html('top', A.house[1]) + '</div></div><div class="pv-h"></div>' + lines(); note = dev === 'phone' ? 'Na telefonie w górnym rzędzie jest jedna reklama.' : 'Na komputerze w górnym rzędzie są dwie reklamy obok siebie, zmieniają się co 10 sekund.'; }
    else if (tab === 'art') { h += '<div class="pv-h"></div>' + lines() + '<div class="sp-inline">' + A.html('strip', c) + '</div>' + lines(); note = 'Pojawia się w połowie tekstu w części artykułów.'; }
    else if (tab === 'box') { if (dev === 'phone') { h = '<div class="pv-miss">Na telefonie okienko w rogu się nie pokazuje (brak miejsca). Zobacz podgląd na komputerze.</div>'; } else { h += '<div class="pv-h"></div>' + lines() + lines() + '<div class="sp-dock sp-dock-r">' + A.html('box', c) + '</div>'; pv.style.minHeight = '400px'; note = 'Wyskakuje w rogu po kilkudziesięciu sekundach i potem co kilka minut. Czytelnik może je zamknąć.'; } }
    else if (tab === 'popup') { h += '<div class="pv-h"></div>' + lines() + '<div class="sp-overlay">' + A.html('popup', c) + '</div>'; pv.style.minHeight = '420px'; note = 'Pojawia się na środku po kilku sekundach. Zamknąć można po 3 sekundach.'; }
    else { h += '<div class="pv-grid"><div class="pv-skel"></div>' + A.html('card', c) + '<div class="pv-skel"></div></div>'; note = 'Kafelek stoi w siatce artykułów na stronie głównej.'; }
    pv.innerHTML = h; $('#spf-note').textContent = note;
  }

  /* ---------- formularz ---------- */
  var ids = ['name', 'email', 'link'];
  function saveDraft() { try { var o = {}; ids.forEach(function (k) { var el = $('#spf-' + k); if (!el.readOnly) o[k] = el.value; }); localStorage.setItem('sliska_ad_draft', JSON.stringify(o)); } catch (e) { /* ignoruj */ } }
  function fixLink() { var el = $('#spf-link'), v = el.value.trim(); if (v && !/^https?:\/\//i.test(v)) el.value = 'https://' + v; }
  function todo() {
    var l = $('#spf-link').value.trim(); if (l && !/^https?:\/\//i.test(l)) l = 'https://' + l;
    return [
      ['Co najmniej jedna grafika', ORDER.some(function (f) { return S[f].res; })],
      ['Imię i nazwisko', $('#spf-name').value.trim().length >= 2],
      ['Poprawny e-mail', validMail($('#spf-email').value.trim())],
      ['Link reklamy', validLink(l)],
      ['Zgoda', $('#spf-ok').checked]
    ];
  }
  function check() {
    var t = todo(), left = t.filter(function (x) { return !x[1]; }).length, hasImg = t[0][1];
    $('#spf-send').disabled = left > 0;
    $('#spf-todo').innerHTML = left ? t.map(function (x) { return '<li class="' + (x[1] ? 'is-ok' : '') + '">' + (x[1] ? ICO.ok : '<i></i>') + x[0] + '</li>'; }).join('') : '';
    $('#spf-todo').hidden = !left;
    var p = $('#spf-progress');
    if (p) { [].forEach.call(p.children, function (li) { var n = +li.dataset.s; li.classList.toggle('is-done', n === 1 ? hasImg : n === 2 ? hasImg : left === 0); }); }
  }
  function fill(id, v) {
    var el = $('#' + id); if (!el) return false;
    if (!v) { if (el.readOnly) { el.readOnly = false; el.classList.remove('is-locked'); el.removeAttribute('title'); } return false; }
    el.value = v; el.readOnly = true; el.classList.add('is-locked'); el.title = 'Dane z Twojego konta';
    return true;
  }
  function account() {
    var u = null; try { u = opts.user && opts.user(); } catch (e) { /* ignoruj */ }
    var box = $('#spf-acct'); box.hidden = false;
    if (!u) { fill('spf-name', ''); fill('spf-email', ''); box.innerHTML = 'Masz konto? <a href="#/konto">Zaloguj się</a>, a wypełnimy imię i e-mail za Ciebie.'; return; }
    var a = fill('spf-name', u.name || ''), b = fill('spf-email', u.email || '');
    box.innerHTML = '<span class="spf-dot"></span>Zalogowano jako <b>' + esc(u.name || u.email || 'czytelnik') + '</b>' + (a || b ? ' · imię i e-mail pochodzą z konta' : '');
  }
  function submit(e) {
    e.preventDefault(); fixLink();
    if (todo().some(function (x) { return !x[1]; })) return check();
    var btn = $('#spf-send'), er = $('#spf-err'); er.hidden = true; btn.disabled = true; btn.textContent = 'Wysyłam…';
    var imgs = {}; ORDER.forEach(function (f) { if (S[f].res) imgs[f] = S[f].res.dataUrl; });
    fetch(opts.api + '/spot/submit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: $('#spf-name').value, email: $('#spf-email').value, link: $('#spf-link').value, note: $('#spf-note-in').value, accept: $('#spf-ok').checked, age: Date.now() - born, imgs: imgs }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || d.error) throw new Error(ERR[d.error] || 'Nie udało się wysłać. Spróbuj za chwilę.'); }); })
      .then(function () {
        $('#spf-done-mail').textContent = $('#spf-email').value.trim(); $('#spf-form').hidden = true; $('#spf-done').hidden = false;
        var p = $('#spf-progress'); if (p) [].forEach.call(p.children, function (li) { li.classList.add('is-done'); });
        $('#spf-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
      })
      .catch(function (ex) { er.textContent = ex && ex.message && !/Failed to fetch|NetworkError|Load failed/i.test(ex.message) ? ex.message : 'Brak połączenia z serwerem. Spróbuj za chwilę.'; er.hidden = false; })
      .then(function () { btn.textContent = 'Wyślij reklamę'; check(); });
  }

  function bind() {
    var slots = $('#spf-slots');
    slots.addEventListener('change', function (e) { var t = e.target; if (t.type === 'file' && t.dataset.f) { onFile(t.dataset.f, t.files[0]); t.value = ''; } });
    slots.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var f = b.dataset.f, a = b.dataset.act;
      if (a === 'remove') { S[f] = {}; renderSlots(); }
      else if (a === 'crop') openCrop(f, false);
      else if (a === 'reuse') { var g = S[b.dataset.from]; S[f] = { src: g.src, name: g.name, bytes: g.bytes, err: '' }; openCrop(f, true); }
    });
    ['dragenter', 'dragover'].forEach(function (n) { slots.addEventListener(n, function (e) { var z = e.target.closest('.spf-slot'); if (z) { e.preventDefault(); z.classList.add('is-over'); } }); });
    slots.addEventListener('dragleave', function (e) { var z = e.target.closest('.spf-slot'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('is-over'); });
    slots.addEventListener('drop', function (e) { var z = e.target.closest('.spf-slot'); if (!z) return; e.preventDefault(); z.classList.remove('is-over'); onFile(z.dataset.f, e.dataTransfer.files[0]); });
    $('#spf-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; preview(); } });
    $('.spf-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-dev]'); if (!b) return; dev = b.dataset.dev; [].forEach.call(this.children, function (x) { x.classList.toggle('is-on', x === b); }); preview(); });
    $('#spf-pv').addEventListener('click', function (e) { if (e.target.closest('a, button')) e.preventDefault(); });
    var form = $('#spf-form');
    form.addEventListener('input', function (e) { saveDraft(); if (e.target.id === 'spf-note-in') $('#spf-note-n').textContent = e.target.value.length; if (e.target.id === 'spf-name') preview(); check(); });
    form.addEventListener('change', check);
    form.addEventListener('submit', submit);
    $('#spf-link').addEventListener('blur', function () { fixLink(); check(); });
    $('#spf-again').addEventListener('click', function () {
      ORDER.forEach(function (f) { S[f] = {}; }); $('#spf-note-in').value = ''; $('#spf-note-n').textContent = '0'; $('#spf-ok').checked = false;
      $('#spf-form').hidden = false; $('#spf-done').hidden = true; renderSlots(); root.scrollIntoView({ behavior: 'smooth' });
    });
  }

  window.SpotForm = {
    mount: function (el, o) {
      root = el; opts = o || {}; S = { long: {}, box: {}, card: {} }; tab = 'top'; dev = 'desktop'; born = Date.now();
      el.innerHTML = '<div class="spf">' + shell() + '</div>';
      try { var dr = JSON.parse(localStorage.getItem('sliska_ad_draft') || '{}'); ids.forEach(function (k) { if (dr[k]) $('#spf-' + k).value = dr[k]; }); } catch (e) { /* ignoruj */ }
      bind(); account(); renderSlots();
    },
    /** po zalogowaniu / wylogowaniu – odśwież dane z konta, nie ruszając grafik */
    refreshUser: function () { if (root && root.isConnected && $('#spf-acct')) { account(); check(); } }
  };
  /* upuszczenie pliku obok pola nie otwiera grafiki w przeglądarce */
  window.addEventListener('dragover', function (e) { if (location.hash.indexOf('#/spot') === 0) e.preventDefault(); });
  window.addEventListener('drop', function (e) { if (location.hash.indexOf('#/spot') === 0) e.preventDefault(); });
})();
