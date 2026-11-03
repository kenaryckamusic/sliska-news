/* Animacje czytnika (tylko dev) – proste i lekkie:
 * html.anim-in na chwilę po wejściu na stronę i po przejściu na inną podstronę (odświeżenie listy ani zmiana ?k=… ich nie powtarza),
 * krótkie przejście kolorów przy zmianie motywu, miękkie pojawianie się doczytywanych zdjęć, małe „podskoczenie” reakcji.
 * Wszystko wyłączone przy „ogranicz ruch”. */
(function () {
  'use strict';
  var de = document.documentElement, off = null, quiet = null, lastPath = null;
  var reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignoruj */ }
  if (reduce) return;

  /* ---------- wejście strony ---------- */
  function stagger() {
    document.querySelectorAll('.grid, .related-grid, .rank-list, #quick-slot, .side-list, .tools').forEach(function (g) {
      for (var i = 0; i < g.children.length; i++) g.children[i].style.setProperty('--i', i);
    });
    var h = document.querySelector('#hero-slot .hero'); if (h) h.style.setProperty('--i', 0);
  }
  function play() {
    stagger();
    de.classList.remove('anim-in'); void de.offsetWidth; de.classList.add('anim-in');
    clearTimeout(off); off = setTimeout(function () { de.classList.remove('anim-in'); }, 1400);
  }
  function path() { return (location.hash || '#/').split('?')[0]; }
  window.addEventListener('hashchange', function () {
    var p = path();
    if (p === lastPath) return;
    lastPath = p;
    setTimeout(play, 30);
  });
  lastPath = path();
  var app = document.getElementById('app') || document.body, n = 0;
  var mo = new MutationObserver(function () {
    clearTimeout(quiet);
    quiet = setTimeout(function () { mo.disconnect(); play(); }, 120);
    if (++n > 200) mo.disconnect();
  });
  mo.observe(app, { childList: true, subtree: true });
  setTimeout(function () { mo.disconnect(); }, 6000);

  /* zmiana motywu: tylko krótkie przejście kolorów (bez efektów) */
  var themeT;
  new MutationObserver(function () {
    de.classList.add('anim-theme'); clearTimeout(themeT); themeT = setTimeout(function () { de.classList.remove('anim-theme'); }, 300);
  }).observe(de, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- zdjęcia doczytywane z opóźnieniem ---------- */
  var born = new WeakMap();
  new MutationObserver(function (list) {
    var now = performance.now();
    list.forEach(function (m) {
      m.addedNodes.forEach(function (nd) {
        if (nd.nodeType !== 1) return;
        if (nd.tagName === 'IMG') born.set(nd, now);
        else nd.querySelectorAll && nd.querySelectorAll('img').forEach(function (i) { born.set(i, now); });
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('load', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || de.classList.contains('anim-in')) return;
    var t = born.get(img);
    if (t !== undefined && performance.now() - t > 160) img.classList.add('a-ld');   // z pamięci podręcznej – bez animacji
  }, true);

  /* ---------- podskoczenie reakcji / zapisu ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.rx-btn, [data-action="save"], .share-btn');
    if (!b) return;
    b.classList.remove('a-bump'); void b.offsetWidth; b.classList.add('a-bump');
    setTimeout(function () { b.classList.remove('a-bump'); }, 600);
  });
})();
