/* Śliska News – Drama Simulator (#/gry/drama). Rozbudowana gra fabularna:
   postać (ksywka + typ artysty), 10 afer po 7 dni z rozgałęzieniami, losowe wydarzenia, zatrudnianie ekipy (prawnik, PR, terapeuta),
   4 paski (Hype, Szacunek, Kasa, Nerwy), obserwujący, komentarze internautów, 30 zakończeń, 13 osiągnięć, zapis gry w trakcie.
   Wywołanie z gry.js: DramaSim.mount(el, H) – H to pomocnicze funkcje gier (K, shell, submit, xp, played, share, load, save, esc, toast). */
(function () {
  'use strict';
  var RUN_KEY = 'sn-drama-run';
  var STATS = [['h', 'Hype', 'fire'], ['s', 'Szacunek', 'star'], ['k', 'Kasa', 'cash'], ['n', 'Nerwy', 'bolt']];
  var IC = {
    fire: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.3 1.2-3.7 2.3-4.7.3 1.6 1 2.6 2 3.1C11 8.6 11.3 5.6 12 3z"/>',
    star: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    play: '<path d="M8 5v14l11-7z"/>'
  };
  var ic = function (n, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; };

  /* ---------- ikonki aform i zakończeń: własne ilustracje SVG (bez Knagi) na gradiencie ---------- */
  var ART = {"wyciek": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"13\" y=\"3\" width=\"22\" height=\"31\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M18 19v2M22 14v12M26 10v20M30 16v8\"/></g><path d=\"M24 37c-2.6 3.4-4.2 5.6-4.2 7.4a4.2 4.2 0 0 0 8.4 0c0-1.8-1.6-4-4.2-7.4z\" fill=\"#ffd34d\" stroke=\"none\"/>", "romans": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 16h6l3-4h12l3 4h6a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V18a2 2 0 0 1 2-2z\" fill=\"rgba(255,255,255,.2)\"/><circle cx=\"21\" cy=\"27\" r=\"6.5\" fill=\"#fff\"/></g><path d=\"M38 20c-5-3.5-7-6-7-8.5a3.5 3.5 0 0 1 7-1 3.5 3.5 0 0 1 7 1c0 2.5-2 5-7 8.5z\" fill=\"#ffd34d\" stroke=\"none\"/>", "plagiat": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 33V11l16-4v22\"/><circle cx=\"12.5\" cy=\"33\" r=\"4.5\" fill=\"#fff\"/><circle cx=\"28.5\" cy=\"29\" r=\"4.5\" fill=\"#fff\"/></g><g fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-dasharray=\"3 3.5\" transform=\"translate(7 9)\"><path d=\"M17 33V11l16-4v22\"/><circle cx=\"12.5\" cy=\"33\" r=\"4.5\"/><circle cx=\"28.5\" cy=\"29\" r=\"4.5\"/></g>", "trasa": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"4\" y=\"11\" width=\"32\" height=\"22\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M4 21h32M13 11v10M22 11v10\"/><circle cx=\"13\" cy=\"35\" r=\"3.8\" fill=\"#fff\"/><circle cx=\"27\" cy=\"35\" r=\"3.8\" fill=\"#fff\"/></g><path d=\"M40 16h6M40 23h4M40 30h2\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "beef": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 17 37 37M31 17 11 37\" stroke-width=\"5.5\"/><circle cx=\"13\" cy=\"13\" r=\"6\" fill=\"#fff\"/><circle cx=\"35\" cy=\"13\" r=\"6\" fill=\"#fff\"/></g><path d=\"M26 14l-7 11h6l-3 10 10-14h-7z\" fill=\"#ffd34d\" stroke=\"none\"/>", "live": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"14\" y=\"4\" width=\"20\" height=\"30\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M9 15c-2.500 4-2.500 8 0 12M39 15c2.500 4 2.500 8 0 12M4 11c-3.500 6-3.500 14 0 20M44 11c3.500 6 3.500 14 0 20\" stroke-width=\"2.200\"/></g><circle cx=\"24\" cy=\"19\" r=\"4.500\" fill=\"#ffd34d\" stroke=\"none\"/><rect x=\"16\" y=\"40\" width=\"16\" height=\"6\" rx=\"3\" fill=\"#ffd34d\" stroke=\"none\"/>", "ikona": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M24 4l5.6 11.4 12.5 1.8-9 8.8 2.1 12.5L24 32.6 12.8 38.5l2.1-12.5-9-8.8 12.5-1.8z\" fill=\"#fff\"/></g><path d=\"M40 4v8M36 8h8M8 36v8M4 40h8\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "legenda": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 6h20v12a10 10 0 0 1-20 0z\" fill=\"#fff\"/><path d=\"M14 10H8v3a6 6 0 0 0 6 6M34 10h6v3a6 6 0 0 1-6 6M24 28v9M15 43h18M18.5 37h11\"/></g><path d=\"M24 10l2 4.2 4.6.7-3.3 3.2.8 4.6L24 20.5l-4.1 2.2.8-4.6-3.3-3.2 4.6-.7z\" fill=\"#ffd34d\" stroke=\"none\"/>", "krol": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 14l8 8 11-14 11 14 8-8-4 24H9z\" fill=\"#fff\"/><path d=\"M9 43h30\"/></g><circle cx=\"14\" cy=\"32\" r=\"2.6\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"24\" cy=\"32\" r=\"2.6\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"34\" cy=\"32\" r=\"2.6\" fill=\"#ffd34d\" stroke=\"none\"/>", "biznes": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"14\" width=\"38\" height=\"27\" rx=\"4.5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M17 14v-3a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M5 26h38\"/></g><circle cx=\"24\" cy=\"27\" r=\"7\" fill=\"#ffd34d\" stroke=\"none\"/><text x=\"24\" y=\"31.2\" font-size=\"11\" font-weight=\"900\" text-anchor=\"middle\" fill=\"#6b4300\" font-family=\"Figtree,Arial,sans-serif\">$</text>", "zen": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 17c8 0 13 5 17 13-9 0-15-4-17-13zM41 17c-8 0-13 5-17 13 9 0 15-4 17-13z\" fill=\"rgba(255,255,255,.55)\"/><path d=\"M24 7c6 6 6 14 0 23-6-9-6-17 0-23z\" fill=\"#fff\"/></g><path d=\"M7 38c6-3.5 11-3.5 17 0s11 3.5 17 0\" fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"2.8\" stroke-linecap=\"round\"/>", "weteran": "<path d=\"M13 3h8l3 10 3-10h8l-8 20h-6z\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"24\" cy=\"30\" r=\"12.5\" fill=\"#fff\"/></g><path d=\"M24 22l2.2 4.5 5 .7-3.6 3.5.9 4.9-4.5-2.4-4.5 2.4.9-4.9-3.6-3.5 5-.7z\" fill=\"#ffd34d\" stroke=\"none\"/>", "mem": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"24\" cy=\"24\" r=\"17\" fill=\"#fff\"/></g><path d=\"M15 19l6 2.6-6 2.6M33 19l-6 2.6 6 2.6\" fill=\"none\" stroke=\"#7a3a00\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M14 29h20c0 6-4.2 10-10 10s-10-4-10-10z\" fill=\"#7a3a00\"/><path d=\"M5 22c-2 3-1.5 6 1 7.5 2-1.5 2.5-4.5-1-7.5zM43 22c2 3 1.5 6-1 7.5-2-1.5-2.5-4.5 1-7.5z\" fill=\"#ffd34d\" stroke=\"none\"/>", "cisza": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M28 5a19 19 0 1 0 15 27A16 16 0 0 1 28 5z\" fill=\"#fff\"/></g><path d=\"M31 9h7l-7 8h7M39 22h5l-5 6h5\" fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"2.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "wtopa": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"24\" cy=\"28\" r=\"15\" fill=\"#ff5a4a\"/></g><path d=\"M24 14c-4-1-7.5-4-8-7 4 0 6.500 2 8 4.500 1.500-2.500 4-4.500 8-4.500-.5 3-4 6-8 7z\" fill=\"#7be07b\"/><path d=\"M14 24a10 10 0 0 1 5-6\" fill=\"none\" stroke=\"rgba(255,255,255,.7)\" stroke-width=\"2.4\" stroke-linecap=\"round\"/><path d=\"M5 8l3 4M43 9l-3 4M44 24h-4\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "przecietniak": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"23\" width=\"7\" height=\"17\" rx=\"2\" fill=\"#fff\"/><rect x=\"16\" y=\"21\" width=\"7\" height=\"19\" rx=\"2\" fill=\"#fff\"/><rect x=\"26\" y=\"24\" width=\"7\" height=\"16\" rx=\"2\" fill=\"#fff\"/><rect x=\"36\" y=\"22\" width=\"7\" height=\"18\" rx=\"2\" fill=\"#fff\"/></g><path d=\"M3 17h42\" stroke=\"#ffd34d\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-dasharray=\"5 5\"/>", "cancel": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 6h32a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H22l-8 8v-8H8a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z\" fill=\"rgba(255,255,255,.2)\"/></g><g fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"3.4\" stroke-linecap=\"round\"><circle cx=\"24\" cy=\"18.500\" r=\"9\"/><path d=\"M17.600 24.900l12.800-12.800\"/></g>", "bankrut": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"13\" width=\"38\" height=\"27\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M9 13l24-7 3 7\"/><path d=\"M43 22h-9a4.500 4.500 0 0 0 0 9h9z\" fill=\"#fff\"/></g><path d=\"M17 21v11M12.500 27.500 17 32l4.500-4.500\" fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "zalamanie": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M24 5C14 5 8 12 8 20c0 5 2.500 8.500 6 10.500V43h18v-8c5-1.500 8-5 8-11C40 12 33 5 24 5z\" fill=\"rgba(255,255,255,.2)\"/></g><path d=\"M26 11l-8 12h6l-2.500 10 9.500-14h-6.500z\" fill=\"#ffd34d\" stroke=\"none\"/>", "duet": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M17 40S4 31 4 21a8 8 0 0 1 13-6 8 8 0 0 1 13 6c0 10-13 19-13 19z\" fill=\"#fff\"/></g><g transform=\"translate(14 -3)\"><path d=\"M17 40S4 31 4 21a8 8 0 0 1 13-6 8 8 0 0 1 13 6c0 10-13 19-13 19z\" fill=\"#ffd34d\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linejoin=\"round\"/></g>", "slub": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"24\" cy=\"31\" r=\"12\"/><path d=\"M17 10l3-5h8l3 5-7 9z\" fill=\"#fff\"/></g><path d=\"M40 5v7M36.500 8.500h7M8 7v6M5 10h6\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "sad": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M23 21 9 36\" stroke-width=\"5\"/><rect x=\"12\" y=\"4\" width=\"22\" height=\"11\" rx=\"2.500\" transform=\"rotate(35 23 10)\" fill=\"#fff\"/></g><rect x=\"22\" y=\"38\" width=\"22\" height=\"6\" rx=\"2.500\" fill=\"#ffd34d\" stroke=\"none\"/>", "ucieczka": "<circle cx=\"11\" cy=\"11\" r=\"5.500\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M22 41c0-10 1-17 6-25\"/><path d=\"M28 16c-6-6-14-4-18 0 7-2 12 0 18 0zM28 16c2-8 9-10 14-8-6 1-10 4-14 8zM28 16c6-2 12 2 14 8-5-4-9-6-14-8zM28 16c-4 4-6 10-4 14 1-5 2-9 4-14z\" fill=\"#fff\" stroke-width=\"1.500\"/><path d=\"M5 43c6-3 12-3 19 0s13 3 19 0\"/></g>", "oktagon": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 4h16l11 11v16L32 42H16L5 31V15z\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M17 26v-6a3 3 0 0 1 6 0v-2a3 3 0 0 1 6 0v3a3 3 0 0 1 4 3v5a7 7 0 0 1-7 7h-3a6 6 0 0 1-6-6z\" fill=\"#fff\" stroke-width=\"1.800\"/></g>", "reality": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"5\" y=\"13\" width=\"38\" height=\"26\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M16 5l8 8 8-8M13 43h4M31 43h4\"/></g><path d=\"M24 19l2.400 4.900 5.400.8-3.900 3.800.9 5.400-4.800-2.500-4.800 2.500.9-5.400-3.900-3.800 5.400-.8z\" fill=\"#ffd34d\" stroke=\"none\"/>", "milioner": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 6h24l8 11-20 26L4 17z\" fill=\"rgba(255,255,255,.25)\"/><path d=\"M4 17h40M16 6l-4 11 12 26 12-26-4-11M24 17l-4-11M24 17l4-11\"/></g><path d=\"M40 4v6M37 7h6\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "diabel": "<path d=\"M9 17 7 4l11 7zM39 17l2-13-11 7z\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"24\" cy=\"28\" r=\"14\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M16 25l6 3M32 25l-6 3M17 34c4 5 10 5 14 0\"/></g>", "euro": "<circle cx=\"43.0\" cy=\"24.0\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"37.4\" cy=\"37.4\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"24.0\" cy=\"43.0\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"10.6\" cy=\"37.4\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"5.0\" cy=\"24.0\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"10.6\" cy=\"10.6\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"24.0\" cy=\"5.0\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"37.4\" cy=\"10.6\" r=\"1.9\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"19\" y=\"10\" width=\"10\" height=\"17\" rx=\"5\" fill=\"#fff\"/><path d=\"M14 22a10 10 0 0 0 20 0M24 32v6M19 38h10\"/></g>", "deepfake": "<circle cx=\"28\" cy=\"22\" r=\"14\" fill=\"none\" stroke=\"#ffd34d\" stroke-width=\"2.4\" stroke-dasharray=\"3 3.5\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"21\" cy=\"26\" r=\"14\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M15 23v.01M27 23v.01M15 31c3 3 9 3 12 0\" stroke-width=\"3.2\"/></g><rect x=\"6\" y=\"38\" width=\"14\" height=\"2.6\" rx=\"1.3\" fill=\"#ffd34d\" stroke=\"none\"/><rect x=\"26\" y=\"41\" width=\"12\" height=\"2.6\" rx=\"1.3\" fill=\"#ffd34d\" stroke=\"none\"/>", "festiwal": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 40 24 12l19 28z\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M24 12v28M15 40l9-15 9 15\"/></g><path d=\"M9 3l-2 6M19 2l-2 6M29 3l-2 6M39 2l-2 6\" stroke=\"#ffd34d\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>", "kontrakt": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M10 4h20l8 8v32H10z\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M30 4v8h8M15 18h14M15 25h14M15 32h8\"/></g><path d=\"M28 41l12-12 5 5-12 12-7 2z\" fill=\"#ffd34d\" stroke=\"none\"/>", "eurowizja": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M9 4v40\"/><path d=\"M9 7h28l-6 9 6 9H9z\" fill=\"#fff\"/></g><path d=\"M20 11l1.4 2.900 3.100.5-2.300 2.200.6 3.100-2.800-1.500-2.800 1.500.6-3.100-2.300-2.200 3.100-.5z\" fill=\"#ffd34d\" stroke=\"none\"/>", "ai": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"14\" width=\"30\" height=\"24\" rx=\"7\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M24 14V7M5 22v8M43 22v8M17 32h14\"/></g><circle cx=\"24\" cy=\"6\" r=\"2.800\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"18\" cy=\"25\" r=\"3.600\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"30\" cy=\"25\" r=\"3.600\" fill=\"#ffd34d\" stroke=\"none\"/>", "blotnik": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M14 5h13v17l12 7a4 4 0 0 1 2 4v5H11z\" fill=\"#fff\"/><path d=\"M11 38h30\"/></g><circle cx=\"8\" cy=\"43\" r=\"2.800\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"19\" cy=\"45\" r=\"2\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"35\" cy=\"44\" r=\"3.200\" fill=\"#ffd34d\" stroke=\"none\"/>", "ambasador": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M16 6 5 13l5 8 6-3v26h16V18l6 3 5-8-11-7c-1 3-4 5-8 5s-7-2-8-5z\" fill=\"rgba(255,255,255,.2)\"/></g><path d=\"M24 24l2.100 4.300 4.700.7-3.400 3.300.8 4.700-4.200-2.200-4.200 2.200.8-4.700-3.400-3.300 4.700-.7z\" fill=\"#ffd34d\" stroke=\"none\"/>", "remiks": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 20a15 15 0 0 1 27-8M41 28a15 15 0 0 1-27 8\"/><path d=\"M35 4l-1 9-9 1M13 44l1-9 9-1\"/></g><circle cx=\"24\" cy=\"24\" r=\"7\" fill=\"#ffd34d\" stroke=\"none\"/><circle cx=\"24\" cy=\"24\" r=\"1.900\" fill=\"#fff\"/>", "tabloid": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"6\" y=\"8\" width=\"36\" height=\"32\" rx=\"3.500\" fill=\"rgba(255,255,255,.2)\"/><path d=\"M12 32h24M12 37h14M32 17h4M32 23h4\"/></g><rect x=\"12\" y=\"14\" width=\"15\" height=\"12\" rx=\"2\" fill=\"#ffd34d\" stroke=\"none\"/>", "podcast": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M7 30v-6a17 17 0 0 1 34 0v6\"/><rect x=\"4\" y=\"28\" width=\"8\" height=\"13\" rx=\"3.500\" fill=\"#fff\"/><rect x=\"36\" y=\"28\" width=\"8\" height=\"13\" rx=\"3.500\" fill=\"#fff\"/></g><rect x=\"19\" y=\"15\" width=\"10\" height=\"17\" rx=\"5\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M24 36v5M19 41h10\"/></g>", "emerytura": "<circle cx=\"35\" cy=\"12\" r=\"7\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M8 16v28M40 16v28M8 22c8 14 24 14 32 0\"/><path d=\"M12 44h-8M44 44h-8\"/></g>", "talkshow": "<g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"9\" y=\"22\" width=\"24\" height=\"14\" rx=\"5\" fill=\"rgba(255,255,255,.2)\"/><rect x=\"3\" y=\"26\" width=\"9\" height=\"14\" rx=\"4.5\" fill=\"#fff\"/><rect x=\"30\" y=\"26\" width=\"9\" height=\"14\" rx=\"4.5\" fill=\"#fff\"/><path d=\"M10 42v3M32 42v3\"/></g><path d=\"M37 3h10l-2 8H39z\" fill=\"#ffd34d\" stroke=\"none\"/><g fill=\"none\" stroke=\"#fff\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M42 11v31M38 44h8\"/></g>"};
  var COL = {"wyciek": ["#ff9a62", "#c8102e"], "romans": ["#e0559f", "#4a0d3b"], "plagiat": ["#ffd34d", "#7c3aed"], "trasa": ["#5b8cff", "#1b1e5a"], "beef": ["#b3243a", "#2a0a14"], "live": ["#6fd6ff", "#0e7fb3"], "ikona": ["#ff8aa0", "#b4002a"], "legenda": ["#7aa2ff", "#4b1d9c"], "krol": ["#ffcf4a", "#7a1d6b"], "biznes": ["#8be08b", "#0f6b3d"], "zen": ["#ffd9a8", "#c9783a"], "weteran": ["#ffc4d6", "#c13c6a"], "mem": ["#ffe27a", "#f08a1c"], "cisza": ["#c9c3f5", "#5a4fa8"], "wtopa": ["#ff9d8a", "#8c1d1d"], "przecietniak": ["#e2e5ee", "#8b93a8"], "cancel": ["#6b6f7a", "#1c1e26"], "bankrut": ["#9aa3b2", "#3a4150"], "zalamanie": ["#a9b4ff", "#2a2f78"], "duet": ["#ffd36b", "#e0407a"], "slub": ["#ffe0ea", "#d4467a"], "sad": ["#cdbb9a", "#5a4528"], "ucieczka": ["#7ee0d0", "#0b7f9c"], "oktagon": ["#ff8a5c", "#7a1414"], "reality": ["#ff9ac2", "#5a1a8c"], "milioner": ["#ffe27a", "#1f7a4a"], "diabel": ["#c8102e", "#2a0a14"], "euro": ["#4f7cff", "#1b1e7a"], "deepfake": ["#8b5cf6", "#1f1b4d"], "festiwal": ["#5fbf8a", "#1b4d57"], "kontrakt": ["#b3243a", "#2a0a14"], "eurowizja": ["#6fa6ff", "#2a2f9e"], "ai": ["#38d4c6", "#17405a"], "blotnik": ["#b8864f", "#4a3018"], "ambasador": ["#ffd34d", "#c2571a"], "remiks": ["#ff6ad5", "#4b2bb0"], "tabloid": ["#ffa07a", "#8a1f3a"], "podcast": ["#7cd0ff", "#1d4f8a"], "emerytura": ["#ffe27a", "#3aa17a"], "talkshow": ["#d77bff", "#5a1a8c"]};

  /* ---------- postacie: własne portrety SVG (gracz + rozmówcy), każdy inny wygląd ---------- */
  function person(o) {
    var ink = '#2a1b33', sk = o.skin || '#f2c4a0', hc = o.hair || '#3b2417', top = o.top || '#444', hat = o.hat || '#333',
      S = 'stroke="' + ink + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"', st = o.style || 'short', h = '';
    h += '<svg class="dr-pp" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="' + o.bg + '"/><circle cx="52" cy="10" r="22" fill="#fff" opacity=".14"/>';
    if (o.ring) h += '<circle cx="32" cy="27" r="23" fill="none" stroke="#fff" stroke-width="3.2" opacity=".8"/>';
    if (st === 'long') h += '<path d="M16 30c-2-15 5-22 16-22s18 7 16 22l3 24H13z" fill="' + hc + '" ' + S + '/>';
    if (st === 'curly') [[20, 19], [26, 12], [34, 11], [41, 14], [45, 22], [18, 28], [46, 29]].forEach(function (p) { h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="' + hc + '" ' + S + '/>'; });
    h += '<path d="M6 64c0-12 10-19 26-19s26 7 26 19z" fill="' + top + '" ' + S + '/>';
    if (o.collar) h += '<path d="M24 47l8 9 8-9" fill="none" ' + S + '/>';
    if (o.chain) h += '<path d="M21 49c3 8 19 8 22 0" fill="none" stroke="#ffd34d" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="57" r="3" fill="#ffd34d" ' + S + '/>';
    if (o.tie) h += '<path d="M32 47l-3.4 4 3.4 12 3.4-12z" fill="' + o.tie + '" ' + S + '/>';
    if (o.scarf) h += '<path d="M19 45c9 6 17 6 26 0l1 7c-9 6-19 6-28 0z" fill="' + o.scarf + '" ' + S + '/><path d="M26 52l-2 9h6" fill="' + o.scarf + '" ' + S + '/>';
    h += '<rect x="27" y="38" width="10" height="10" rx="3" fill="' + sk + '" ' + S + '/>';
    h += '<circle cx="19" cy="29" r="3" fill="' + sk + '" ' + S + '/><circle cx="45" cy="29" r="3" fill="' + sk + '" ' + S + '/>';
    if (o.ear) h += '<circle cx="19" cy="34" r="2" fill="#ffd34d" ' + S + '/>';
    h += '<ellipse cx="32" cy="28" rx="13" ry="15" fill="' + sk + '" ' + S + '/>';
    if (o.beard) h += '<path d="M19 30c0 14 6 19 13 19s13-5 13-19c-3 5-7 6-13 6s-10-1-13-6z" fill="' + o.beard + '" ' + S + '/>';
    // włosy z przodu
    var F = { short: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9z', long: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9z', bun: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9z', pony: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9z', pigtails: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9z', curly: 'M20 24c2-7 7-9 12-9s10 2 12 9c-4-3-8-4-12-4s-8 1-12 4z', slick: 'M19 27c-2-14 6-19 14-19 8 0 14 5 13 19-2-6-6-10-12-10-6 0-12 2-15 10z', mohawk: 'M28 18c-1-7 1-12 4-14 3 2 5 7 4 14z', messy: 'M19 27c-2-13 5-19 13-19s15 6 13 19c-1-5-4-9-13-9s-12 4-13 9zM20 14l-3-6 6 3 2-6 4 5 4-6 3 6 5-3-1 7z' };
    if (st !== 'bald' && F[st]) h += '<path d="' + F[st] + '" fill="' + hc + '" ' + S + '/>';
    if (st === 'bun') h += '<circle cx="32" cy="6" r="5" fill="' + hc + '" ' + S + '/>';
    if (st === 'pony') h += '<path d="M44 18c9 0 11 12 5 19-1-6-3-9-5-11z" fill="' + hc + '" ' + S + '/>';
    if (st === 'pigtails') h += '<circle cx="12" cy="34" r="5.5" fill="' + hc + '" ' + S + '/><circle cx="52" cy="34" r="5.5" fill="' + hc + '" ' + S + '/>';
    // twarz
    var ey = o.eyes || 'dots', br = o.brows || (ey === 'angry' ? 'angry' : 'norm');
    if (ey === 'dots' || ey === 'angry') h += '<circle cx="26.5" cy="28" r="1.8" fill="' + ink + '"/><circle cx="37.5" cy="28" r="1.8" fill="' + ink + '"/>';
    if (ey === 'heart') h += '<path d="M26.500 31c-3-2-4-3.500-4-4.800a2 2 0 0 1 4-.4 2 2 0 0 1 4 .4c0 1.300-1 2.800-4 4.800zM37.500 31c-3-2-4-3.500-4-4.800a2 2 0 0 1 4-.4 2 2 0 0 1 4 .4c0 1.300-1 2.800-4 4.800z" fill="#e11d48"/>';
    if (ey === 'closed') h += '<path d="M23.500 28.500q3-3.500 6 0M34.500 28.500q3-3.500 6 0" fill="none" ' + S + '/>';
    if (ey === 'half') h += '<path d="M23.500 28h6M34.500 28h6" fill="none" ' + S + '/>';
    if (br === 'angry') h += '<path d="M23 22l7 3M41 22l-7 3" fill="none" ' + S + '/>'; else if (br === 'norm' && o.glasses !== 'shades') h += '<path d="M23.500 23.500h5.500M35 23.500h5.500" fill="none" ' + S + '/>';
    h += '<path d="M31 31q1 2.500 2.500.5" fill="none" stroke="' + ink + '" stroke-width="1.4" stroke-linecap="round"/>';
    if (o.blush) h += '<circle cx="22.500" cy="33" r="3" fill="#ff7a9a" opacity=".55"/><circle cx="41.500" cy="33" r="3" fill="#ff7a9a" opacity=".55"/>';
    var M = { smile: '<path d="M26.500 35.500q5.500 5.500 11 0" fill="none" ' + S + '/>', grin: '<path d="M25.500 34h13c0 6-3 8.500-6.500 8.500S25.500 40 25.500 34z" fill="#8a2335" ' + S + '/><path d="M27 34.500h10" stroke="#fff" stroke-width="2"/>', open: '<ellipse cx="32" cy="38" rx="3.200" ry="3.800" fill="#8a2335" ' + S + '/>', frown: '<path d="M26.500 39q5.500-4.500 11 0" fill="none" ' + S + '/>', smirk: '<path d="M27.500 36.500q5 2.500 10-2" fill="none" ' + S + '/>', flat: '<path d="M27.500 37.500h9" fill="none" ' + S + '/>' };
    h += M[o.mouth || 'smile'];
    if (o.stache) h += '<path d="M24.500 34.500c3-3.500 6.500-1.500 7.500-1.500s4.500-2 7.500 1.500c-2.500 3.500-5.500 1-7.500 1s-5 2.500-7.500-1z" fill="' + o.stache + '" ' + S + '/>';
    if (o.glasses === 'shades') h += '<rect x="21.500" y="24.500" width="9.500" height="7" rx="3" fill="#16101f" ' + S + '/><rect x="33" y="24.500" width="9.500" height="7" rx="3" fill="#16101f" ' + S + '/><path d="M31 27h2" ' + S + '/><path d="M23.500 26.500l3-1" stroke="#fff" stroke-width="1.200" opacity=".6"/>';
    if (o.glasses === 'round') h += '<circle cx="26.500" cy="28" r="5" fill="rgba(255,255,255,.35)" ' + S + '/><circle cx="37.500" cy="28" r="5" fill="rgba(255,255,255,.35)" ' + S + '/><path d="M31.500 28h1" ' + S + '/>';
    // nakrycia głowy i dodatki
    var Hh = {
      cap: '<path d="M19 24c0-10 6-15 13-15s13 5 13 15z" fill="' + hat + '" ' + S + '/><path d="M30 24h19c3 0 3 5 0 5H30z" fill="' + hat + '" ' + S + '/>',
      cowboy: '<ellipse cx="32" cy="21" rx="20" ry="4.500" fill="' + hat + '" ' + S + '/><path d="M23 20c0-8 3-13 9-13s9 5 9 13z" fill="' + hat + '" ' + S + '/><path d="M23 18h18" stroke="' + ink + '" stroke-width="1.800"/>',
      fedora: '<ellipse cx="32" cy="21" rx="17" ry="4" fill="' + hat + '" ' + S + '/><path d="M22 20c0-8 4-12 10-12s10 4 10 12z" fill="' + hat + '" ' + S + '/><path d="M22 17h20" stroke="' + ink + '" stroke-width="2.600"/>',
      beanie: '<path d="M19 24c0-11 6-16 13-16s13 5 13 16z" fill="' + hat + '" ' + S + '/><rect x="18" y="21" width="28" height="5.500" rx="2.500" fill="' + hat + '" ' + S + '/><circle cx="32" cy="7" r="3.200" fill="#fff" ' + S + '/>',
      party: '<path d="M23 21l9-20 9 20z" fill="' + hat + '" ' + S + '/><circle cx="29" cy="14" r="1.600" fill="#fff"/><circle cx="35" cy="17" r="1.600" fill="#ffd34d"/><circle cx="32" cy="1.500" r="2.400" fill="#ffd34d" ' + S + '/>',
      santa: '<path d="M19 23c0-11 6-16 13-16 3 0 6 1 8 3l5-3-1 7c1 3 1 6 1 9z" fill="#d6001c" ' + S + '/><rect x="18" y="21" width="28" height="5.500" rx="2.700" fill="#fff" ' + S + '/><circle cx="46" cy="7" r="3.200" fill="#fff" ' + S + '/>',
      phones: '<path d="M16 29c0-14 6-20 16-20s16 6 16 20" fill="none" stroke="' + ink + '" stroke-width="3.400" stroke-linecap="round"/><rect x="12.500" y="25" width="7" height="12" rx="3" fill="' + hat + '" ' + S + '/><rect x="44.500" y="25" width="7" height="12" rx="3" fill="' + hat + '" ' + S + '/>',
      headset: '<path d="M16 29c0-14 6-20 16-20s16 6 16 20" fill="none" stroke="' + ink + '" stroke-width="3.400" stroke-linecap="round"/><rect x="12.500" y="25" width="7" height="12" rx="3" fill="' + hat + '" ' + S + '/><rect x="44.500" y="25" width="7" height="12" rx="3" fill="' + hat + '" ' + S + '/><path d="M16 36c1 6 5 9 12 9" fill="none" stroke="' + ink + '" stroke-width="1.800"/><circle cx="29" cy="45" r="2.300" fill="' + hat + '" ' + S + '/>',
      horns: '<path d="M21 16l-5-11 11 6zM43 16l5-11-11 6z" fill="#e11d2e" ' + S + '/>',
      mask: '<path d="M19 26c4-3 8-3 13 0 5-3 9-3 13 0v5c-4 2-8 1-13-2-5 3-9 4-13 2z" fill="' + hat + '" ' + S + '/>',
      press: '<path d="M19 24c0-9 5-13 13-13s13 4 13 13z" fill="' + hat + '" ' + S + '/><path d="M24 24h16" stroke="' + ink + '" stroke-width="2"/><rect x="28" y="14" width="8" height="5" rx="1" fill="#fff" ' + S + '/>',
      towel: '<path d="M18 26c-1-10 5-17 14-17s15 7 14 17c-4-3-9-4-14-4s-10 1-14 4z" fill="' + hat + '" ' + S + '/><path d="M20 15c8 4 16 4 24 0" fill="none" stroke="#fff" stroke-width="1.600" opacity=".7"/>'
    };
    if (o.hat && Hh[o.hatk]) h += Hh[o.hatk];
    if (o.sparkle) h += '<path d="M52 8v10M47 13h10M10 40v6M7 43h6" stroke="#fff" stroke-width="2.200" stroke-linecap="round"/>';
    return h + '</svg>';
  }
  var P = {
    raper: { bg: '#7a1d2e', skin: '#b8774e', hair: '#1a1220', style: 'short', hatk: 'cap', hat: '#1f1f2b', glasses: 'shades', chain: 1, top: '#2b2b3a', mouth: 'smirk' },
    pop: { bg: '#ff8cc6', skin: '#f6d2b8', hair: '#ff5fa8', style: 'long', top: '#7c3aed', ear: 1, sparkle: 1, mouth: 'grin', eyes: 'closed', blush: 1 },
    influ: { bg: '#2fc2b0', skin: '#e9b48c', hair: '#6b3d22', style: 'bun', ring: 1, glasses: 'round', top: '#ffffff', mouth: 'smile', blush: 1 },
    disco: { bg: '#e0a21a', skin: '#efc19a', hair: '#2a1a12', style: 'short', hatk: 'fedora', hat: '#f4efe2', stache: '#2a1a12', top: '#c1272d', collar: 1, chain: 1, mouth: 'grin', ear: 1 },
    dj: { bg: '#3550ff', skin: '#c58a62', hair: '#8b3dff', style: 'curly', hatk: 'phones', hat: '#16101f', glasses: 'round', top: '#16101f', mouth: 'smirk', sparkle: 1 },
    rock: { bg: '#4a4455', skin: '#f2d2bc', hair: '#14101a', style: 'long', beard: '#14101a', top: '#1a1a22', mouth: 'open', ear: 1, brows: 'angry', eyes: 'dots', chain: 0 },
    streamer: { bg: '#17b26a', skin: '#f0c8a8', hair: '#d9732a', style: 'messy', hatk: 'headset', hat: '#222', glasses: 'round', top: '#2b3a55', mouth: 'open' },
    aktor: { bg: '#8a6a3a', skin: '#f2c9a5', hair: '#6c6a68', style: 'slick', top: '#232a44', tie: '#d6001c', collar: 1, mouth: 'smirk', stache: '#6c6a68' }
  };
  var NPC = {
    detektyw: { bg: '#7d6e4c', skin: '#efc7a2', hair: '#4a3a2a', style: 'short', hatk: 'fedora', hat: '#5a4528', glasses: 'round', top: '#8c8c82', stache: '#4a3a2a', mouth: 'flat' },
    diabelek: { bg: '#7a1020', skin: '#f0b08e', hair: '#1a1220', style: 'short', hatk: 'horns', hat: '#e11d2e', top: '#3a0b14', mouth: 'grin', brows: 'angry' },
    gwiazdor: { bg: '#b8860b', skin: '#f2c6a2', hair: '#1f1620', style: 'slick', glasses: 'shades', top: '#d4a017', mouth: 'smirk', sparkle: 1, chain: 1 },
    imprezowa: { bg: '#e0407a', skin: '#f3cdb0', hair: '#7a2bd6', style: 'pony', hatk: 'party', hat: '#35c4ff', top: '#ffffff', mouth: 'open', eyes: 'closed', blush: 1 },
    kapiel: { bg: '#2aa7d8', skin: '#efc4a4', hair: '#3b2417', style: 'bald', hatk: 'towel', hat: '#ffffff', top: '#7fd3f2', mouth: 'smile', eyes: 'closed' },
    kibic: { bg: '#c1272d', skin: '#e8b48c', hair: '#2a1a12', style: 'short', hatk: 'cap', hat: '#ffffff', scarf: '#ffffff', top: '#8c1318', mouth: 'open', brows: 'angry' },
    kowboj: { bg: '#a0652d', skin: '#e3a97c', hair: '#3a2415', style: 'short', hatk: 'cowboy', hat: '#7a4a1f', stache: '#3a2415', top: '#2e6e4a', mouth: 'smirk', collar: 1 },
    mikolaj: { bg: '#1d6b3a', skin: '#f0c4a4', hair: '#ffffff', style: 'short', hatk: 'santa', hat: '#d6001c', beard: '#ffffff', stache: '#ffffff', top: '#d6001c', mouth: 'smile', blush: 1 },
    ratownik: { bg: '#d9531e', skin: '#cf996f', hair: '#1a1220', style: 'short', hatk: 'cap', hat: '#ffd34d', glasses: 'shades', top: '#ff7a1a', mouth: 'flat' },
    redaktor: { bg: '#3558a8', skin: '#f0c6a4', hair: '#3b2417', style: 'short', hatk: 'press', hat: '#2a2a35', glasses: 'round', top: '#e8eaf5', tie: '#3558a8', mouth: 'smile', collar: 1 },
    sauna: { bg: '#c9783a', skin: '#e8b48c', hair: '#3b2417', style: 'bald', top: '#f4efe2', mouth: 'smile', eyes: 'closed', blush: 1 },
    sliska: { bg: '#3a2a6a', skin: '#efc7a2', hair: '#14101a', style: 'slick', glasses: 'round', top: '#14101a', tie: '#ff3b6b', collar: 1, mouth: 'smirk' },
    super: { bg: '#2b5bd7', skin: '#f0c4a4', hair: '#14101a', style: 'short', hatk: 'mask', hat: '#d6001c', top: '#d6001c', mouth: 'grin', sparkle: 1 },
    surfer: { bg: '#1fb5c9', skin: '#d6965f', hair: '#f2d06b', style: 'long', top: '#ffffff', mouth: 'grin', blush: 0 },
    szlafrok: { bg: '#8d7fc4', skin: '#f0c4a4', hair: '#6a4a2a', style: 'messy', top: '#c9c3f5', mouth: 'open', eyes: 'half' },
    uwodziciel: { bg: '#9c2a66', skin: '#e9b890', hair: '#1a1220', style: 'slick', stache: '#1a1220', top: '#3a0b2e', collar: 1, mouth: 'smirk', ear: 1 },
    wsciekla: { bg: '#c8102e', skin: '#f09a82', hair: '#2a1a12', style: 'short', top: '#5a0b17', mouth: 'frown', brows: 'angry', eyes: 'angry' },
    zakochana: { bg: '#ff8aa8', skin: '#f6d2b8', hair: '#c1561f', style: 'pigtails', top: '#ffffff', mouth: 'smile', eyes: 'heart', blush: 1 },
    ziomek: { bg: '#5a8f4a', skin: '#e0a880', hair: '#1a1220', style: 'short', hatk: 'cap', hat: '#2b3a55', top: '#3a4a30', mouth: 'grin' }
  };
  var AV = function (id) { return person(P[id] || NPC[id] || NPC.ziomek); };

  /* ---------- poziomy trudności: mnożnik strat (ujemne zmiany Hype/Szacunku/Kasy i dodatnie Nerwów) ---------- */
  var DIFFS = [['easy', 'Spokojny', 'Straty o 30% mniejsze'], ['norm', 'Normalny', 'Tak jak zawsze'], ['hard', 'Hardkor', 'Straty o 40% większe, +10 Nerwów na start']];
  var DMUL = { easy: .7, norm: 1, hard: 1.4 };

  /* ---------- typy artystów ---------- */
  var ROLES = [
    { id: 'raper', name: 'Raper', k: 'gwiazdor', st: { h: 50, s: 45, k: 40, n: 30 }, fol: 120000, d: 'Szacunek ulicy, mało kasy, dużo wersów.' },
    { id: 'pop', name: 'Gwiazda popu', k: 'sliska', st: { h: 60, s: 40, k: 55, n: 40 }, fol: 320000, d: 'Hity w radiu, paparazzi pod domem.' },
    { id: 'influ', name: 'Influencer', k: 'uwodziciel', st: { h: 65, s: 30, k: 50, n: 35 }, fol: 480000, d: 'Zasięgi ogromne, szacunek… do zrobienia.' },
    { id: 'disco', name: 'Gwiazdor disco polo', k: 'kowboj', st: { h: 45, s: 50, k: 60, n: 25 }, fol: 90000, d: 'Wesela, remizy i niezłe pieniądze.' },
    { id: 'dj', name: 'DJ-ka producentka', k: 'imprezowa', st: { h: 55, s: 35, k: 50, n: 35 }, fol: 210000, d: 'Bity, słuchawki i drop, który psuje głośniki.' },
    { id: 'rock', name: 'Rockman', k: 'diabelek', st: { h: 40, s: 55, k: 35, n: 30 }, fol: 130000, d: 'Gitara, garaż i legenda sprzed dwudziestu lat.' },
    { id: 'streamer', name: 'Streamer-muzyk', k: 'ziomek', st: { h: 60, s: 30, k: 45, n: 40 }, fol: 400000, d: 'Grasz na żywo dla czatu. Czat bywa okrutny.' },
    { id: 'aktor', name: 'Aktor z telenoweli', k: 'sliska', st: { h: 50, s: 40, k: 60, n: 30 }, fol: 260000, d: 'Nagle śpiewasz. Nikt nie wie, czy to żart.' }
  ];

  /* ---------- afery: 7 dni, warianty dnia zależne od wcześniejszych wyborów (when), opcje z wymaganiem (need) ----------
     opcja: [tekst, efekty {h,s,k,n}, reakcja, dodatki {set, next:'END:id', need:'prawnik'|'pr'}] */
  var SCEN = [
    { id: 'wyciek', name: 'Wyciek z koncertu', k: 'wsciekla', sub: 'Nagranie, na którym mówisz, że feat był „za kasę”, krąży po sieci.', b: [
      { k: 'wsciekla', app: 'Instagram', t: 'Budzisz się, a na telefonie 147 powiadomień. Ktoś wrzucił nagranie z koncertu: mówisz ze sceny, że ostatni feat z Wikosem „był za kasę i nawet go nie słuchałeś”. Internet płonie.', c: [
        ['Odpisuję od razu na story. Ostro.', { h: 20, s: -10, n: 10 }, 'Story ma 40 tys. wyświetleń w 10 minut. Wikos już coś nagrywa.', { set: 'ostro' }],
        ['Milczę i czekam, aż przejdzie.', { h: -10, s: 5, n: 15 }, 'Cisza. Internet nie znosi ciszy – zaczyna zgadywać, co ukrywasz.'],
        ['Dzwonię do menedżera.', { k: 5, n: -5 }, 'Menedżer: „Spokojnie, mam plan”. To nigdy nie wróży dobrze.']] },
      [{ when: 'ostro', k: 'diabelek', app: 'YouTube', t: 'Wikos wrzuca diss „Za kasę to ty oddychasz”. Milion wyświetleń w dobę, a pod Twoimi postami tylko jedno pytanie: „odpowiesz?”.', c: [
        ['Nagrywam odpowiedź jeszcze w nocy.', { h: 25, s: 5, k: -5, n: 10 }, 'Bit kradziony z TikToka, ale wersy palą. Ludzie dzielą się na dwa obozy.', { set: 'diss' }],
        ['Zapraszam go na live – pogadajmy jak ludzie.', { h: 15, s: 10, n: 5 }, 'Live ogląda 30 tysięcy osób. Po godzinie śmiejecie się razem.', { set: 'zgoda' }],
        ['Blokuję go wszędzie.', { h: -5, s: -15, n: -5 }, '„Zablokował, bo nie ma argumentów” – screeny blokady mają więcej lajków niż Twój singiel.']] },
       { k: 'zakochana', app: 'Wiadomości', t: 'Wikos pisze na priv: „Serio, stary? Myślałem, że jesteśmy ziomkami”. Wiadomość ma znaczek „przeczytano” od godziny.', c: [
        ['Odpisuję szczerze i przepraszam.', { s: 15, h: -5, n: -5 }, 'Odpisał po minucie: „Dobra, browar i gadamy”.', { set: 'zgoda' }],
        ['Screenuję rozmowę i wrzucam na story.', { h: 20, s: -20, n: 5 }, 'Kto screenuje priv, ten traci ziomków. I szacunek.', { set: 'diss' }],
        ['Zostawiam na „przeczytane”.', { s: -5, n: 10 }, 'Najbardziej toksyczne dwa słowa w internecie: „przeczytano 14:02”.']] }],
      { k: 'gwiazdor', app: 'Mail', t: 'Śliska News pisze o aferze, pod artykułem 2 tysiące komentarzy. Marka napojów energetycznych proponuje współpracę „na fali dramy”.', c: [
        ['Biorę kasę i reklamuję na story.', { k: 30, s: -15 }, 'Puszka w dłoni, uśmiech, kod rabatowy „ZAKASE”. Komentarze piszą się same.'],
        ['Odmawiam publicznie.', { s: 15, k: -5, h: 5 }, '„Nie sprzedam dramy” – cytat dnia. Szacun rośnie, konto w banku nie.'],
        ['Negocjuję podwójną stawkę.', { k: 20, h: 5, s: -5, n: 5 }, 'Menedżer płacze ze szczęścia. Ty trochę mniej, czytając komentarze.'],
        ['PR-owiec: kampania „Za kasę, ale szczerze”.', { k: 20, s: 5, h: 10 }, 'Autoironiczna reklama robi furorę. Marka zadowolona, fani też.', { need: 'pr' }]] },
      { k: 'kapiel', app: 'TikTok', t: 'Fani robią z Twojej miny z nagrania mema. Jest wszędzie: na TikToku, w grupach, nawet na tablicy w szkole Twojej kuzynki.', c: [
        ['Ustawiam mema jako zdjęcie profilowe.', { h: 15, s: 10, n: -5 }, 'Dystans do siebie? Internet to kocha. „Szacun, że się nie obraził”.'],
        ['Proszę o usuwanie mema.', { h: -5, s: -10, n: 10 }, 'Efekt Streisand w pełnej krasie. Mem ma teraz trzy nowe wersje.'],
        ['Drukuję merch z memem.', { k: 20, h: 10, s: -5 }, 'Koszulki wyprzedane w dwie godziny. Hejterzy też kupili.']] },
      { k: 'redaktor', app: 'Mail', t: 'Wytwórnia Wikosa wysyła pismo: naruszenie dóbr osobistych, żądają 50 tysięcy i przeprosin w trzech serwisach.', c: [
        ['Płacę, żeby mieć spokój.', { k: -25, n: -10 }, 'Przelew wysłany. Spokój kupiony. Konto smutne.'],
        ['Idę w zaparte.', { h: 10, n: 20, k: -10 }, 'Pozew trafia do sądu. Rozprawa za pół roku – a do tego czasu nagłówki.'],
        ['Prawnik odpisuje ripostą.', { s: 10, n: -10, k: -5 }, 'Pismo zwrotne tak zgrabne, że wytwórnia wycofuje roszczenia.', { need: 'prawnik' }]] },
      [{ when: 'diss', k: 'diabelek', app: 'Spotify', t: 'Twój diss ma 3 miliony odsłuchów. Fani domagają się części drugiej, a Wikos zapowiada odpowiedź „za 3 dni o 20:00”.', c: [
        ['Wypuszczam część drugą przed nim.', { h: 25, s: -5, n: 15 }, 'Wyprzedziłeś go o godzinę. Wojna trwa, wyświetlenia też.'],
        ['Ogłaszam koniec wojny.', { s: 15, h: -10, n: -10 }, '„Dorośli ludzie, dorośli ludzie” – piszą fani. Część zawiedziona.'],
        ['Proponuję wspólną bitwę freestyle na żywo.', { h: 20, s: 10, n: 10 }, 'Bitwę ogląda 200 tysięcy osób. Remis, ale klasa.']] },
       { when: 'zgoda', k: 'imprezowa', app: 'Wiadomości', t: 'Wikos dzwoni: „Słuchaj, zróbmy numer na zgodę. Tytuł: »Za darmo«”.', c: [
        ['Nagrywamy! Jutro w studiu.', { h: 15, s: 20 }, 'Numer powstaje w jedną noc.', { next: 'END:duet' }],
        ['Odmawiam, wolę solo.', { s: -5, h: 5 }, 'Wikos: „Spoko, Twoja strata”. I chyba miał rację.'],
        ['Proszę o czas do namysłu.', { n: -5 }, 'Czas leci. Wikos nagrywa z kimś innym.']] },
       { k: 'gwiazdor', app: 'Gala', t: 'Gala w Warszawie. Prowadzący żartuje ze sceny: „A teraz nagroda, za którą {nick} pewnie też kazał sobie zapłacić”.', c: [
        ['Śmieję się najgłośniej na sali.', { s: 10, h: 5 }, 'Kamera łapie Twój śmiech. Wygrałeś ten moment.'],
        ['Demonstracyjnie wychodzę.', { h: 10, s: -10, n: 10 }, 'Drzwi trzasnęły. Klip „wyjście {nick}a” ma milion wyświetleń.'],
        ['Wchodzę na scenę i zabieram mikrofon.', { h: 25, s: -5, n: 15 }, 'Improwizowany freestyle o prowadzącym. Sala szaleje.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Wieczór. Wszyscy czekają na Twój ostatni ruch. Redakcja Śliskiej prosi o komentarz. Co ogłaszasz?', c: [
        ['Trasę „Za Kasę Tour”.', { h: 20, k: 15 }, 'Bilety schodzą jak ciepłe bułki. Ironia zrobiła robotę.'],
        ['Szczere oświadczenie i przeprosiny.', { s: 20, h: -5, n: -10 }, 'Długi post, bez prawników. Nawet Wikos daje lajka.'],
        ['Nic. Znikam na miesiąc.', { h: -20, s: 5, n: -25 }, 'Konto milczy. Ludzie zaczynają tęsknić. Albo zapominać.']] }
    ] },
    { id: 'romans', name: 'Romans na backstage’u', k: 'uwodziciel', sub: 'Paparazzi przyłapał Cię z byłą Twojego producenta.', b: [
      { k: 'uwodziciel', app: 'Plotkarski portal', t: 'Paparazzi przyłapał Cię, jak o 4:00 wychodzisz z backstage’u z Natalią – byłą Twojego producenta Kuby. Zdjęcie jest nieostre, ale wszyscy wiedzą, że to Ty.', c: [
        ['„To tylko koleżanka.”', { s: -10, h: 5, n: 5 }, 'Koleżanka, o 4:00, w Twojej bluzie. Internet nie wierzy.', { set: 'klamstwo' }],
        ['Potwierdzam. Zakochałem się.', { h: 20, s: 5 }, 'Połowa internetu wysyła serduszka, połowa popcorn.', { set: 'para' }],
        ['Bez komentarza.', { h: 5, n: 5 }, '„Bez komentarza” to też komentarz. Plotki się mnożą.']] },
      { k: 'wsciekla', app: 'Instagram', t: 'Kuba wrzuca story: „Bitów już ode mnie nie dostaniesz. Ani niczego innego”. Masz za tydzień premierę singla.', c: [
        ['Kupuję bity z internetu.', { k: -10, s: -5 }, 'Bit brzmi jak dzwonek z 2009. Ktoś to rozpoznał w 3 minuty.'],
        ['Przepraszam Kubę prywatnie.', { s: 10, h: -5, n: -5 }, 'Odpisał „ok”. Tylko „ok”. Ale bity wysłał.'],
        ['Wrzucam nasze wspólne zdjęcie z Natalią.', { h: 25, s: -10, n: 10 }, 'Wojna na story. Śliska robi z tego serię artykułów.', { set: 'wojna' }]] },
      { k: 'sauna', app: 'Podcast', t: 'Zaproszenie do podcastu „Szczerze i mokro”. Prowadzący obiecuje, że „pytania będą lekkie”. Nigdy nie są.', c: [
        ['Idę i mówię wszystko.', { h: 20, s: 5, n: 5 }, 'Trzy godziny szczerości. Klipy z rozmowy są wszędzie.'],
        ['Idę i ściemniam.', { h: 10, s: -15 }, 'Widzowie łapią każdą sprzeczność. Ktoś zrobił kompilację.'],
        ['Odmawiam.', { h: -10 }, 'Podcast i tak o Tobie mówi. Bez Ciebie.'],
        ['PR-owiec przygotowuje odpowiedzi.', { h: 15, s: 10 }, 'Każda odpowiedź jak z podręcznika. Nikt nie wie, że ćwiczyłeś dwa dni.', { need: 'pr' }]] },
      [{ when: 'klamstwo', k: 'detektyw', app: 'Instagram', t: 'Natalia wrzuca story w Twojej bluzie z podpisem: „koleżanka, mhm 🙂”.', c: [
        ['Przyznaję się. Tak, jesteśmy razem.', { s: 5, h: 10, n: -5 }, 'Lepiej późno niż wcale. Komentarze łagodnieją.', { set: 'para' }],
        ['Dalej ściemniam.', { s: -20, n: 10 }, 'Natalia wrzuca kolejne story. Tym razem z Twoim kotem.'],
        ['Usuwam konto na tydzień.', { h: -15, n: -10 }, 'Tydzień ciszy. Plotki żyją własnym życiem.']] },
       { k: 'detektyw', app: 'Twitter', t: 'Wyciekają screeny Waszych wiadomości. Najczęściej cytowane zdanie: „mój producent nie umie nawet w bity”.', c: [
        ['Mówię, że to fejk.', { s: -15, h: 10 }, 'Ktoś pokazuje metadane. To nie fejk.'],
        ['Śmieję się z siebie na TikToku.', { h: 15, s: 10 }, 'Autoironia ratuje sytuację. Dźwięk z filmiku wiralowy.'],
        ['Prawnik każe usunąć screeny.', { s: 5, k: -5, n: -10 }, 'Screeny znikają z trzech portali. Czwarty pisze o piśmie.', { need: 'prawnik' }],
        ['Zatrudniam prawnika teraz.', { k: -15, s: 5 }, 'Drogo, ale screeny powoli znikają.']] }],
      { k: 'kapiel', app: 'Plotkarski portal', t: 'Wyciekają zdjęcia z jacuzzi na Waszych wakacjach. Zasłonięte tylko emotką brzoskwini.', c: [
        ['Skoro wyciekły – wrzucam lepsze ujęcia.', { h: 25, s: -10, n: -5 }, 'Najgorętszy post tygodnia. Babcia dzwoni.'],
        ['Mówię, że to AI.', { s: -10, n: 10, h: 5 }, 'Specjaliści od AI wyśmiewają tłumaczenie w trzech językach.'],
        ['Przepraszam rodzinę publicznie.', { s: 10, h: -5, n: 5 }, 'Mama wybaczyła. Internet – częściowo.']] },
      [{ when: 'wojna', k: 'diabelek', app: 'YouTube', t: 'Kuba nagrywa diss o Tobie i Natalii. Refren: „Weź ją sobie, i tak fałszuje”.', c: [
        ['Odpowiadamy razem z Natalią – duetem.', { h: 20, k: 5, n: 5 }, 'Duet ma więcej odsłuchów niż diss. Kuba milknie.'],
        ['Przyjmuję jego wyzwanie na freak fight.', { h: 30, k: 20, n: 20 }, 'Federacja ogłasza walkę. Bilety wyprzedane w godzinę.', { next: 'END:oktagon' }],
        ['Ignoruję. Klasa.', { s: 10, h: -10 }, 'Fani doceniają spokój. Kuba się wścieka.']] },
       { when: 'para', k: 'zakochana', app: 'Wiadomości', t: 'Natalia: „Albo jesteśmy oficjalnie, albo wcale. Masz czas do niedzieli”.', c: [
        ['Oświadczam się na Instagramie.', { h: 25, s: 10 }, 'Pierścionek, róże, 2 miliony wyświetleń.', { next: 'END:slub' }],
        ['Oficjalnie, ale bez cyrku.', { s: 10, h: 10 }, 'Jedno wspólne zdjęcie. Ludzie szanują prywatność.'],
        ['Wolę wolność.', { h: 5, s: -5, n: -10 }, 'Natalia wrzuca smutny cytat. Wiadomo, o kogo chodzi.']] },
       { k: 'ziomek', app: 'Wiadomości', t: 'Kuba pisze: „Dobra, było minęło. Ale bit za darmo już nie będzie”.', c: [
        ['Płacę za bity jak profesjonalista.', { k: -10, s: 10 }, 'Biznes to biznes. Muzyka wraca do normy.'],
        ['Proponuję mu procent od singla.', { k: -5, s: 5, h: 5 }, 'Kuba zgadza się. Single brzmią lepiej niż kiedykolwiek.'],
        ['Szukam nowego producenta.', { h: 10, n: 10 }, 'Castingi na producenta – Śliska robi z tego relację.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Minął miesiąc. Wszyscy pytają, czy to coś poważnego. Ostatni ruch:', c: [
        ['Nagrywamy razem duet.', { h: 25, k: 15, s: -5 }, 'Numer wpada na listy. Kuba… robi remix. Podobno za kasę.'],
        ['Zrywamy dla świętego spokoju.', { s: 10, h: -10, n: -10 }, 'Spokój jest. Tylko serce trochę mokre.'],
        ['Ogłaszam przerwę od social mediów.', { h: -15, s: 10, n: -20 }, 'Przerwa trwa 4 dni. Rekord.']] }
    ] },
    { id: 'plagiat', name: 'Gala i plagiat', k: 'gwiazdor', sub: 'Wygrywasz nagrodę, ale ktoś zarzuca Ci kradzież refrenu.', b: [
      { k: 'gwiazdor', app: 'Gala', t: 'Wygrywasz nagrodę za Numer Roku. Godzinę później ktoś wrzuca porównanie: Twój refren brzmi jak piosenka mało znanego Szymka z Radomia z 2019.', c: [
        ['„To była inspiracja.”', { s: -5, h: 5, n: 5 }, 'Słowo „inspiracja” staje się memem tygodnia.'],
        ['Oddaję statuetkę na scenie.', { s: 20, h: 15, k: -10 }, 'Wideo ma 2 miliony wyświetleń. Klasa – piszą nawet hejterzy.'],
        ['Ignoruję i świętuję.', { h: 5, s: -10 }, 'Zdjęcia z afterparty kontra porównanie refrenów. Nie wygląda to dobrze.']] },
      { k: 'redaktor', app: 'Mail', t: 'Szymek żąda tantiem i przeprosin. Jego jedyny numer ma teraz więcej odsłuchów niż przez 7 lat.', c: [
        ['Płacę od razu.', { k: -20, s: 15, n: -5 }, 'Sprawa zamknięta po cichu. Prawie – on o tym nagrał film.'],
        ['Idę do sądu.', { k: -10, h: 10, n: 15 }, 'Rozprawa za pół roku. Do tego czasu – darmowa promocja dla Was obu.', { set: 'sad' }],
        ['Proponuję mu feat.', { h: 15, s: 10, k: 5 }, 'Zgodził się. Internet: „najlepsze zakończenie dramy ever”.', { set: 'feat' }]] },
      { k: 'imprezowa', app: 'Instagram', t: 'Na afterparty ktoś nagrywa, jak tańczysz na stole ze statuetką na głowie. Nagranie już krąży.', c: [
        ['Tańczę dalej. To moja noc.', { h: 20, s: -5 }, 'Filmik jest wszędzie. Z dźwiękiem Twojego „inspirowanego” refrenu.'],
        ['Zabieram komuś telefon.', { h: 10, s: -20, n: 10 }, 'Teraz jest też drugie nagranie. Z innego telefonu.'],
        ['Zamawiam pizzę dla wszystkich.', { s: 10, k: -5, h: 5 }, 'Pizza dla 80 osób. Najlepszy PR za 1200 zł.']] },
      { k: 'diabelek', app: 'Zrzutka', t: 'Hejterzy zakładają zrzutkę „na lekcje oryginalności dla {nick}a”. Zebrali już 3 tysiące.', c: [
        ['Wpłacam pierwszy i dziękuję.', { h: 20, s: 15, k: -5 }, 'Dystans level master. Zrzutkę przekazujesz na schronisko.'],
        ['Zgłaszam zrzutkę.', { s: -10, h: 5, n: 5 }, 'Zrzutka zdjęta. Powstają trzy nowe.'],
        ['Nagrywam diss na hejterów.', { h: 15, s: -5 }, 'Diss jest dobry. Ale refren… brzmi znajomo.']] },
      [{ when: 'sad', k: 'detektyw', app: 'Sąd', t: 'Rozprawa. Biegły muzykolog gra oba refreny na pianinie. Na sali słychać chichot.', c: [
        ['Bronię się sam. Wiem, co robię.', { n: 20 }, 'Sędzia słucha cierpliwie. Za cierpliwie.', { next: 'END:sad' }],
        ['Prawnik wnosi o ugodę.', { k: -10, s: 5, n: -10 }, 'Ugoda z klauzulą poufności. Wychodzisz suchą stopą.', { need: 'prawnik' }],
        ['Proponuję ugodę na korytarzu.', { k: -20, s: 10 }, 'Szymek się zgadza. Uścisk dłoni dla fotoreporterów.']] },
       { when: 'feat', k: 'zakochana', app: 'Studio', t: 'Nagrywacie razem. Szymek okazuje się genialnym producentem – lepszym niż Twój.', c: [
        ['Prawa 50 na 50.', { s: 15, k: -10 }, 'Uczciwie. Szymek płacze ze wzruszenia.'],
        ['Chcę 80%. To mój zasięg.', { k: 15, s: -15 }, 'Szymek wrzuca screen umowy. Ups.'],
        ['Robimy cały album.', { h: 15, s: 10, n: 10 }, 'Album „Inspiracja” zapowiedziany. Ironia w czystej postaci.']] },
       { k: 'wsciekla', app: 'Telewizja', t: 'Media nazywają Cię „Plagiatorem roku”. Telewizja śniadaniowa zaprasza na rozmowę.', c: [
        ['Idę do TV i tłumaczę.', { h: 10, s: 5, n: 10 }, 'Pani prowadząca gra Ci oba refreny. Na żywo.'],
        ['Nagrywam satyryczny numer o sobie.', { h: 20, s: 10 }, '„Ukradłem refren (i Wasze serca)” – hit TikToka.'],
        ['Cisza medialna.', { h: -10, n: -5 }, 'Bez Ciebie temat szybko gaśnie.']] }],
      { k: 'super', app: 'Telewizja', t: 'Telewizja proponuje Ci rolę jurora w talent show. Gaża robi wrażenie.', c: [
        ['Biorę.', { k: 25, h: 15, s: -5 }, 'Siedzisz w fotelu jurora. Ironia nikogo nie omija.'],
        ['Odmawiam – najpierw muzyka.', { s: 10 }, 'Ludzie szanują wybór. Konto mniej.'],
        ['Biorę i w 1. odcinku oskarżam uczestnika o plagiat.', { h: 25, s: -10, n: 5 }, 'Najczęściej oglądany fragment sezonu.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Rok później Śliska News robi podsumowanie afery. Jaki jest Twój ostatni ruch?', c: [
        ['Remix z Szymkiem.', { s: 20, k: 15 }, 'Remix lepszy od obu wersji. Nikt nie pamięta, o co była afera.'],
        ['To była prowokacja marketingowa.', { h: 25, s: -15, k: 10 }, 'Pół internetu klaszcze, pół czuje się oszukane.'],
        ['Usuwam numer z serwisów.', { s: 5, h: -15, k: -15, n: -10 }, 'Numer znika. Tylko ludzie wciąż nucą ten refren.']] }
    ] },
    { id: 'trasa', name: 'Trasa widmo', k: 'ratownik', sub: 'Organizator uciekł z kasą za bilety. 12 koncertów odwołanych.', b: [
      { k: 'ratownik', app: 'Mail', t: 'Organizator trasy zniknął z pieniędzmi za bilety. 12 koncertów odwołanych, a fani piszą pod każdym postem: „OSZUST”.', c: [
        ['Oświadczenie: „nie wiedziałem”.', { s: 5, n: 10 }, 'Część fanów wierzy. Część pisze „łatwo powiedzieć”.'],
        ['Obiecuję zwrot z własnej kieszeni.', { s: 20, k: -25 }, 'Gest roku. Księgowa mdleje.', { set: 'zwrot' }],
        ['Piszę, że to wina fanów, że kupili za wcześnie.', { h: 15, s: -25, n: 5 }, 'Najgorszy post w historii konta. 40 tys. komentarzy.']] },
      { k: 'wsciekla', app: 'Instagram', t: 'Fan z Wrocławia przychodzi pod Twój dom z transparentem „ODDAJ 189 ZŁ”.', c: [
        ['Zapraszam go na kawę i nagrywam rozmowę.', { h: 15, s: 15 }, 'Wrocławianin wychodzi z kasą i selfie. Film robi zasięgi.'],
        ['Wzywam ochronę.', { s: -10, n: -5 }, 'Nagranie ochroniarza przepychającego fana – idealny materiał dla hejterów.'],
        ['Uciekam tylnymi drzwiami.', { h: 5, s: -5, n: 10 }, 'Ktoś nagrał, jak przeskakujesz płot. Nowy mem.']] },
      { k: 'detektyw', app: 'Twitter', t: 'Internetowy detektyw namierza organizatora: siedzi na Bali i wrzuca zdjęcia z basenu.', c: [
        ['Lecę na Bali.', { k: -15, h: 20, n: 10 }, 'Bilet w jedną stronę. Vlog z lotniska ogląda pół Polski.', { set: 'bali' }],
        ['Zgłaszam sprawę na policję.', { s: 10, n: -5 }, 'Rozsądnie. Nudno, ale rozsądnie.'],
        ['Wrzucam jego adres na story.', { h: 20, s: -15, n: 5 }, 'Internet szaleje. Prawnicy obu stron zacierają ręce.']] },
      [{ when: 'bali', k: 'surfer', app: 'Bali', t: 'Na Bali organizator wita Cię drinkiem: „Zostań, mam tu willę i nowe interesy. Polska poczeka”.', c: [
        ['Zostaję. Raj to raj.', { h: 10, n: -20 }, 'Słońce, fale i zero zasięgu.', { next: 'END:ucieczka' }],
        ['Zabieram go do Polski.', { s: 20, h: 15, n: 10 }, 'Wracacie razem. Lotnisko pełne kamer.'],
        ['Robię vloga z wakacji.', { h: 15, s: -10, k: 10 }, 'Fani: „Za nasze 189 zł?”. Wyświetlenia rekordowe.']] },
       { k: 'redaktor', app: 'Prokuratura', t: 'Prokuratura wszczyna śledztwo, a dziennikarze dzwonią co 5 minut.', c: [
        ['Współpracuję ze śledczymi.', { s: 15, n: 5 }, 'Zeznania, dokumenty, cierpliwość. Opłaca się.'],
        ['Prawnik przejmuje komunikację.', { s: 10, n: -15 }, 'Jedno zdanie dla mediów dziennie. Spokój.', { need: 'prawnik' }],
        ['Mówię, że to spisek konkurencji.', { h: 15, s: -15 }, 'Teoria spiskowa żyje własnym życiem. Konkurencja zachwycona darmową reklamą.']] }],
      { k: 'gwiazdor', app: 'Wiadomości', t: 'Konkurencyjny artysta oferuje darmowy koncert dla poszkodowanych fanów. Warunek: jego nazwisko największe na plakacie.', c: [
        ['Zgadzam się.', { s: 10, h: -5 }, 'Fani zadowoleni. Ego trochę mniej.'],
        ['Robię własny darmowy koncert.', { s: 20, k: -15, n: 10 }, 'Hala pełna, kasa pusta, serce pełne.'],
        ['Odmawiam. Sam to załatwię.', { h: 5, s: -10 }, 'Konkurent robi koncert i tak. Bez Ciebie.']] },
      [{ when: 'zwrot', k: 'mikolaj', app: 'Bank', t: 'Zwroty zjadły oszczędności. Bank dzwoni w sprawie raty za studio.', c: [
        ['Sprzedaję samochód.', { k: 15, h: 5 }, 'Jeździsz hulajnogą. Fani: „szacun”.'],
        ['Zbiórka od fanów.', { k: 20, s: -10 }, 'Zbierasz od tych, którym oddałeś. Trochę dziwne.'],
        ['PR-owiec: historia „artysty, który oddał wszystko”.', { s: 15, h: 15 }, 'Wywiad w telewizji, propozycje od sponsorów. Bank czeka spokojnie.', { need: 'pr' }]] },
       { k: 'ziomek', app: 'Facebook', t: 'Fani zakładają grupę „Oddaj kasę {nick}”. Ma już 20 tysięcy członków.', c: [
        ['Dołączam i odpowiadam na każde pytanie.', { s: 15, n: 15 }, 'Trzy noce odpisywania. Grupa zmienia nazwę na „Fani {nick}a”.'],
        ['Zgłaszam grupę.', { s: -15, n: 5 }, 'Grupa znika. Powstaje „Oddaj kasę 2”.'],
        ['Robię live z tłumaczeniem.', { h: 10, s: 5, n: 5 }, 'Dwie godziny tłumaczenia. Połowa odpada, połowa rozumie.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Sprawa cichnie. Co dalej z koncertami?', c: [
        ['Nowa trasa z uczciwym organizatorem.', { k: 15, s: 10, h: 10 }, 'Bilety z gwarancją zwrotu. Wyprzedane.'],
        ['Piszę książkę „Jak mnie okradli”.', { k: 20, h: 10 }, 'Bestseller na lotniskach. Także na Bali.'],
        ['Koniec z koncertami.', { h: -20, n: -20 }, 'Tylko studio. Spokój, cisza, kapcie.']] }
    ] },
    { id: 'beef', name: 'Beef z byłym zespołem', k: 'kibic', sub: 'Dawni koledzy z zespołu mówią, że zostawiłeś ich dla kasy.', b: [
      { k: 'kibic', app: 'YouTube', t: 'Twój były zespół „Mokre Ziomki” w wywiadzie: „{nick} zostawił nas dla kasy i nawet nie oddał mikrofonu”.', c: [
        ['Odpowiadam w wywiadzie.', { h: 10, s: 5 }, 'Rzeczowo i spokojnie. Nudne, ale skuteczne.'],
        ['Wrzucam stare zdjęcia z ich imprez.', { h: 25, s: -15, n: 5 }, 'Zdjęcia, których nikt nie powinien zobaczyć. Wszyscy zobaczyli.', { set: 'brudy' }],
        ['Wysyłam im mikrofon kurierem.', { h: 15, s: 10 }, 'Z liścikiem „oddaję z odsetkami”. Internet płacze ze śmiechu.']] },
      { k: 'diabelek', app: 'Spotify', t: 'Lider zespołu, Baton, wypuszcza diss „Mikrofon i zdrada”.', c: [
        ['Odpowiadam dissem.', { h: 25, n: 10 }, 'Wojna na wersy. Śliska robi ranking punchline’ów.', { set: 'diss' }],
        ['Zapraszam go na podcast.', { h: 10, s: 10, n: 5 }, 'Rozmowa zaczyna się od krzyków, kończy na wspomnieniach.'],
        ['Dzwonię do jego mamy.', { h: 15, s: -5 }, 'Mama Batona publikuje oświadczenie: „Chłopcy, przestańcie”.']] },
      { k: 'kibic', app: 'Mail', t: 'Federacja freak fight: „Walka w oktagonie z Batonem. 200 tysięcy dla każdego”.', c: [
        ['Wchodzę!', { k: 20, h: 20, n: 15 }, 'Konferencja prasowa za tydzień.', { set: 'walka' }],
        ['Odmawiam z klasą.', { s: 15, h: -5 }, '„Muzyki nie robi się pięściami”. Cytat tygodnia.'],
        ['Negocjuję pół miliona.', { k: 10, h: 10, n: 10 }, 'Federacja się zgadza. Teraz trzeba trenować.', { set: 'walka' }]] },
      [{ when: 'walka', k: 'wsciekla', app: 'Konferencja', t: 'Konferencja przed walką. Baton rzuca w Ciebie butelką wody.', c: [
        ['Rzucam stołem.', { h: 25, s: -15, n: 10 }, 'Ochrona rozdziela. Klip ma 5 milionów wyświetleń.'],
        ['Spokojnie wycieram twarz i się uśmiecham.', { s: 15, h: 10 }, 'Zimna krew. Fani: „psychopata, szanuję”.'],
        ['Całuję go w czoło.', { h: 30, s: 5 }, 'Nikt nie wie, co się stało. Ale wszyscy to udostępniają.']] },
       { k: 'ziomek', app: 'Instagram', t: 'Fani zespołu bombardują Twoje komentarze: „zdrajca”, „mikrofon”, „oddaj”.', c: [
        ['Odpowiadam każdemu.', { n: 20, h: 10 }, 'O 4:00 wciąż piszesz. Kciuk boli.'],
        ['Wyłączam komentarze.', { h: -10, n: -10 }, 'Cisza w komentarzach, burza w DM-ach.'],
        ['PR-owiec: kampania „Wspomnienia Mokrych Ziomków”.', { s: 15, h: 10 }, 'Stare zdjęcia, ciepłe słowa. Fani zespołu miękną.', { need: 'pr' }]] }],
      { k: 'gwiazdor', app: 'Wiadomości', t: 'Dawny menedżer zespołu proponuje reaktywację na jedną trasę. Kasa ogromna.', c: [
        ['Zgadzam się.', { k: 25, s: 10, n: 5 }, 'Ogłoszenie reaktywacji łamie internet.', { set: 'reunion' }],
        ['Nigdy.', { s: -5, n: -5 }, 'Drzwi zamknięte. Klucz wyrzucony.'],
        ['Tylko jeśli zespół przyjmie moją ksywkę w nazwie.', { h: 15, s: -15 }, '„{nick} i Mokre Ziomki”. Baton odpowiada jednym emoji.']] },
      [{ when: 'walka', k: 'kibic', app: 'Gala freak fight', t: 'Hala pełna. Gong.', c: [
        ['Walczę na serio.', { h: 20, n: 15 }, 'Pierwsza runda…', { next: 'END:oktagon' }],
        ['Poddaję się w 10. sekundzie i biorę kasę.', { k: 15, s: -20, h: 10 }, 'Najkrótsza walka gali. Najdroższe 10 sekund życia.'],
        ['Zamiast walki gram koncert w klatce.', { h: 25, s: 10 }, 'Sędzia nie wie, co robić. Publika śpiewa.']] },
       { when: 'reunion', k: 'imprezowa', app: 'Koncert', t: 'Pierwszy koncert reaktywacji. Hala pełna, Baton stoi obok Ciebie.', c: [
        ['Godzimy się na scenie.', { s: 20, h: 15, n: -10 }, 'Uścisk przy „Mokrych nocach”. Hala płacze.', { next: 'END:duet' }],
        ['Kłócimy się na scenie.', { h: 25, s: -15, n: 15 }, 'Najlepszy koncert roku. Z niewłaściwych powodów.'],
        ['Wychodzę w połowie.', { h: 10, s: -20, n: -10 }, 'Baton śpiewa Twoje zwrotki. Fałszuje.']] },
       { k: 'zakochana', app: 'Wiadomości', t: 'Baton trafia do szpitala (nic poważnego). Fani apelują: „Pogódźcie się wreszcie”.', c: [
        ['Odwiedzam go w szpitalu.', { s: 25, h: 5, n: -5 }, 'Selfie z łóżka szpitalnego. „Mikrofon oddany”.'],
        ['Wrzucam życzenia zdrowia.', { s: 10 }, 'Krótko i z klasą.'],
        ['Nic nie robię.', { s: -15 }, '„Nawet teraz?” – pytają fani.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Koniec sezonu dram. Co dalej z karierą?', c: [
        ['Wspólny numer z Mokrymi Ziomkami.', { s: 15, h: 15 }, '„Oddaję mikrofon” – numer roku.'],
        ['Solowa płyta „Bez Ziomków”.', { h: 10, k: 15 }, 'Ironiczny tytuł, świetne recenzje.'],
        ['Zakładam nowy zespół.', { h: 15, n: 10 }, '„Suche Ziomki”. Chwytliwe.']] }
    ] },
    { id: 'live', name: 'Live po imprezie', k: 'kapiel', sub: 'Zapomniałeś wyłączyć transmisję. Oglądało 40 tysięcy osób.', b: [
      { k: 'kapiel', app: 'Instagram Live', t: 'Po imprezie zapomniałeś wyłączyć live. 40 tysięcy osób oglądało, jak pod prysznicem śpiewasz hity konkurencji. Fałszując.', c: [
        ['Śmieję się i wrzucam wersję studyjną.', { h: 25, s: 5 }, 'Wersja „Prysznic Edition” ląduje w top 50.'],
        ['Mówię, że ktoś zhakował konto.', { s: -15, n: 10 }, 'Hakerzy, którzy włączają live pod prysznicem? Ciekawe.', { set: 'hack' }],
        ['Przepraszam konkurencję za fałsz.', { s: 10, h: -5 }, 'Konkurencja odpisuje: „i tak lepiej niż oryginał”.']] },
      { k: 'sliska', app: 'TikTok', t: 'Klip robi się trendem: #PrysznicChallenge. Ludzie nagrywają się, śpiewając pod prysznicem.', c: [
        ['Dołączam do challenge’u.', { h: 20, n: 5 }, 'Twoje nagranie z gumową kaczką ma 3 mln wyświetleń.'],
        ['Każę usuwać nagrania.', { h: -5, s: -10, n: 10 }, 'Zgłoszenia nie działają. Challenge rośnie.'],
        ['Sprzedaję prawa do nagrania marce żeli.', { k: 20, s: -5 }, '„Pachnie sukcesem” – reklama z Tobą w roli głównej.']] },
      [{ when: 'hack', k: 'detektyw', app: 'Twitter', t: 'Ekspert od cyberbezpieczeństwa publicznie: „Nie było żadnego hakowania. Live włączono z jego telefonu”.', c: [
        ['Przyznaję się.', { s: 5, h: 5, n: -5 }, '„Dobra, to ja. Byłem wesoły”. Ludzie odpuszczają.'],
        ['Idę w zaparte.', { s: -20, n: 15 }, 'Ekspert wrzuca kolejne dowody. I zrzuty ekranu.'],
        ['Prawnik grozi ekspertowi pozwem.', { h: 10, s: -10, k: -5 }, 'Groźba pozwu za prawdę? Internet nie wybacza.', { need: 'prawnik' }]] },
       { k: 'redaktor', app: 'Mail', t: 'Wytwórnia konkurencji pisze: „Wykonujesz nasze utwory bez licencji”.', c: [
        ['Płacę licencję.', { k: -15, s: 5 }, 'Najdroższy prysznic w historii.'],
        ['Proponuję oficjalny cover.', { h: 10, k: 5 }, 'Cover nagrany. Tym razem bez fałszu.'],
        ['Prawnik: prywatny live to nie koncert.', { s: 5, n: -10 }, 'Wytwórnia wycofuje roszczenia.', { need: 'prawnik' }]] }],
      { k: 'szlafrok', app: 'Telewizja', t: 'Program śniadaniowy zaprasza Cię… do studia, w którym zbudowano prysznic.', c: [
        ['Idę. W szlafroku.', { h: 20, s: -5, k: 10 }, 'Prowadząca prosi o bis. Mama ogląda.'],
        ['Odmawiam.', { s: 10, h: -5 }, 'Producent programu jest zawiedziony. Ty – godny.'],
        ['Idę i śpiewam swój numer.', { h: 15, s: 10, n: 5 }, 'Wreszcie ludzie słyszą Twoje piosenki. Czysto.']] },
      { k: 'wsciekla', app: 'Twitter', t: 'Ktoś wyciąga Twój tweet sprzed 8 lat: „Prysznic to najlepsza scena w Polsce”. Plus kilka gorszych.', c: [
        ['Przepraszam za stare tweety.', { s: 5, n: 5 }, 'Krótko, bez wymówek. Działa.'],
        ['„Byłem dzieckiem”.', { s: -5, h: 5 }, 'Miałeś 24 lata. Ktoś to sprawdził.'],
        ['Wrzucam jeszcze gorsze tweety innych artystów.', { h: 25, s: -20, n: 10 }, 'Wojna na stare tweety. Wszyscy przegrywają.']] },
      { k: 'imprezowa', app: 'Mail', t: 'Producent reality show: „Zamieszkaj z 6 influencerami na 30 dni. Kamery 24/7, także w łazience”.', c: [
        ['Biorę.', { h: 25, k: 20 }, 'Pakujesz walizkę. I gumową kaczkę.', { next: 'END:reality' }],
        ['Odmawiam.', { s: 10 }, 'Dość kamer w łazience.'],
        ['Negocjuję własny program.', { k: 20, h: 10, n: 10 }, '„Pod prysznicem z {nick}em” – talk show zatwierdzony.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Afera cichnie. Co zostanie po prysznicowym skandalu?', c: [
        ['Album „Pod prysznicem”.', { h: 20, k: 15 }, 'Akustyczny, intymny, mokry. Złota płyta.'],
        ['Detoks cyfrowy.', { n: -25, h: -15 }, 'Telefon w szufladzie. Pierwszy raz od lat śpisz 8 godzin.'],
        ['Własna marka żeli pod prysznic.', { k: 25, h: 5, s: -5 }, '„Śpiewaj czysto” – sprzedaje się lepiej niż płyty.']] }
    ] },
    { id: 'diabel', name: 'Pakt z diabłem', k: 'sliska', sub: 'Wytwórnia Diabeł Records oferuje kontrakt życia. Drobnym drukiem.', b: [
      { k: 'sliska', app: 'Mail', t: 'Diabeł Records: 10 lat, 7 płyt, zaliczka 500 tysięcy. Na ostatniej stronie, drobnym drukiem, kilka dziwnych punktów.', c: [
        ['Podpisuję od ręki. Zaliczka to zaliczka.', { k: 30, s: -10, n: 5 }, 'Pióro jest ciepłe i lekko pachnie siarką. Zaliczka wpływa w minutę.', { set: 'podpis' }],
        ['Czytam drobny druk. Całość.', { n: 10, s: 5 }, 'Po 40 minutach wiesz, że „prawa do wszystkiego” znaczy naprawdę wszystko.'],
        ['Prawnik sprawdza umowę.', { k: -5, s: 10, n: -5 }, 'Prawnik zakreśla 11 pułapek. Wytwórnia obiecuje je „wyjaśnić”.', { need: 'prawnik' }]] },
      [{ when: 'podpis', k: 'diabelek', app: 'Mail', t: 'Klauzula 14: wytwórnia przejmuje Twoją ksywkę. Odtąd wolno Ci używać tylko „zaproponowanej”. Brzmi: „{nick} Junior”.', c: [
        ['Akceptuję. Nowa ksywka jest chwytliwa.', { h: 10, s: -10, k: 5 }, 'Fani nie wiedzą, co to za junior. Ale klikają.'],
        ['Protestuję publicznie.', { h: 20, s: 5, n: 10 }, 'Wytwórnia: „To był żart”. Nie był.'],
        ['Prawnik wycina klauzulę.', { s: 10, k: -5 }, 'Klauzula znika. Pojawiają się trzy inne.', { need: 'prawnik' }]] },
       { k: 'redaktor', app: 'Śliska News', t: 'Branżowy portal pyta, dlaczego jeszcze nie podpisałeś umowy z Diabeł Records. Wytwórnia już ogłosiła „współpracę”.', c: [
        ['Potwierdzam współpracę.', { h: 10, k: 15, s: -5 }, 'Czyli jednak podpisujesz. Tylko później.', { set: 'podpis' }],
        ['Zaprzeczam.', { s: 5, n: 10 }, 'Wytwórnia publikuje „sprostowanie sprostowania”.'],
        ['Ogłaszam, że negocjuję.', { h: 10, s: 5 }, 'Brzmi poważnie. Brzmi też jak blef.']] }],
      { k: 'gwiazdor', app: 'Instagram', t: 'Wytwórnia szykuje Twój nowy wizerunek: czerwone soczewki, peleryna i płyta o „mroku duszy”.', c: [
        ['Wchodzę w to na 100%.', { h: 25, s: -10, k: 10 }, 'Sesja zdjęciowa trwa 11 godzin. Peleryna jest ciężka.'],
        ['Negocjuję mniej mroku.', { s: 5, h: 5, n: 5 }, 'Wytwórnia zgadza się na „mrok light”. Soczewki zostają.'],
        ['Odmawiam kostiumu.', { s: 10, h: -10, k: -5 }, 'Wytwórnia: „Brak peleryny, brak promocji”.']] },
      { k: 'detektyw', app: 'Mail', t: 'W aneksie znajdujesz klauzulę o „oddaniu pierwszego dziecka, psa lub kota”. Wytwórnia twierdzi, że to żart działu prawnego.', c: [
        ['Pytam prawnika, czy to legalne.', { s: 5, n: -5, k: -5 }, '„Legalne – nie. Ale jest podpisane”.', { need: 'prawnik' }],
        ['Wrzucam klauzulę na Twittera.', { h: 25, s: 10, n: 10 }, 'Hasło #KotDlaDiabła trenduje w całej Polsce.', { set: 'wyciek' }],
        ['Udaję, że nie widzę.', { n: 15, s: -5 }, 'Kot patrzy na Ciebie podejrzliwie.']] },
      [{ when: 'wyciek', k: 'wsciekla', app: 'Twitter', t: 'Wytwórnia grozi pozwem za ujawnienie „poufnych żartów”. Jednocześnie fani chcą Cię wykupić zbiórką.', c: [
        ['Przyjmuję zbiórkę.', { k: 20, s: 10, h: 10 }, 'Zebrano 400 tysięcy w jedną noc. Wzruszające.'],
        ['Odmawiam. Walczę sam.', { s: 15, n: 10, k: -5 }, 'Duma rośnie, konto nie.'],
        ['Prawnik odpowiada na pozew.', { s: 5, k: -10, n: -5 }, 'Pozew zostaje „zawieszony do wyjaśnienia”.', { need: 'prawnik' }]] },
       { k: 'uwodziciel', app: 'Spotkanie', t: 'Prezes wytwórni zaprasza Cię na jacht: „Podpiszesz aneks, a wszystkie problemy znikną”.', c: [
        ['Idę na jacht.', { k: 15, n: 5 }, 'Jacht jest ogromny. Menu składa się z samych deserów.'],
        ['Odmawiam uprzejmie.', { s: 5 }, 'Prezes: „Rozumiem. Na razie”.'],
        ['Przynoszę własnego prawnika.', { s: 10, k: -5 }, 'Prezes blednie. Prawnik zamawia kawior.', { need: 'prawnik' }]] }],
      { k: 'uwodziciel', app: 'Spotkanie', t: 'Prezes kładzie na stole aneks: „Dożywotni kontrakt. W zamian wszystko, czego zapragniesz”. Pióro błyszczy.', c: [
        ['Podpisuję. Jestem zmęczony walką.', { k: 25, h: 10, s: -15 }, 'Podpis złożony. Pióro zamienia się w popiół.', { next: 'END:kontrakt' }],
        ['Wstaję i wychodzę.', { s: 15, n: 10 }, 'Prezes macha na pożegnanie: „Zadzwoń, jak zgłodniejesz”.'],
        ['Proponuję własny aneks.', { h: 10, k: 10, n: 10 }, 'Prezes się uśmiecha. Czyżby to Ty rozdawał karty?']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Afera kontraktowa dobiega końca. Zostały dwie drogi: własna wytwórnia albo święty spokój.', c: [
        ['Zakładam własną wytwórnię.', { k: -5, h: 15, s: 15 }, 'Pierwsza płyta: „Bez diabła”. Okładka bez peleryny.'],
        ['Wykupuję się za zbiórkę.', { s: 15, k: 10, n: -15 }, 'Wolny jak ptak. Trochę zadłużony jak ptak.'],
        ['Gram dalej w układzie.', { k: 20, s: -10 }, 'Pieniądze są. Dusza w depozycie.']] }
    ] },
    { id: 'euro', name: 'Eurowizja po polsku', k: 'gwiazdor', sub: 'Wygrałeś krajowe eliminacje. Teraz cała Europa zobaczy Twój kostium.', b: [
      { k: 'gwiazdor', app: 'Telewizja', t: 'Wygrywasz krajowe eliminacje do Eurowizji piosenką „Jedzie pociąg”. Publiczność szaleje. Komentatorzy pytają: czy to na pewno poważne?', c: [
        ['Mówię, że to hołd dla kolei.', { s: 5, h: 10 }, 'Polskie koleje wydają oświadczenie poparcia.'],
        ['To ironia i sztuka.', { s: -5, h: 15 }, 'Krytyk: „Nie wiem, czy to ironia, ale działa”.'],
        ['Nie komentuję.', { n: 5, s: 5 }, 'Tajemniczość to też strategia.']] },
      { k: 'sliska', app: 'Mail', t: 'Stylistka proponuje kostium: 11 metrów tiulu, dwa wentylatory i światła w peruce.', c: [
        ['Biorę wszystkie wentylatory.', { h: 20, k: -10, n: 5 }, 'Peruka ma baterię na 7 minut. Piosenka trwa 3.', { set: 'tiul' }],
        ['Wybieram elegancki garnitur.', { s: 10, h: -5 }, 'Stylistka płacze. Ty wygrywasz dobrym gustem.'],
        ['Pożyczam kostium z teatru.', { k: 5, h: 10, s: -5 }, 'Pachnie naftaliną. Wygląda jak klasyka.']] },
      [{ when: 'tiul', k: 'kapiel', app: 'Próba generalna', t: 'Na próbie wentylator wyrywa Ci tiul. Widownia liczy 14 osób, wszyscy się śmieją.', c: [
        ['Śmieję się razem z nimi.', { s: 5, h: 10 }, 'Ekipa: „Dawno nikt tak nie rozładował atmosfery”.'],
        ['Wyrzucam wentylatory.', { h: -10, n: -5 }, 'Kostium cichszy, ale smutniejszy.'],
        ['Mówię, że tak miało być.', { s: -10, h: 15, n: 5 }, 'Wentylatory zostają. Tiul też.']] },
       { k: 'redaktor', app: 'Śliska News', t: 'Fani dzielą się na tych, którzy kochają Twój elegancki look, i tych, którzy wolą tiul z drugiej wersji projektu.', c: [
        ['Wrzucam sondę.', { h: 10, s: 5 }, 'Wygrywa tiul. 72 procent.'],
        ['Zostaję przy garniturze.', { s: 10, h: -5 }, 'Konsekwencja budzi szacunek.'],
        ['Zmieniam kostium w ostatniej chwili.', { n: 10, h: 10 }, 'Stylistka odchodzi. Do rana wraca.']] }],
      { k: 'kibic', app: 'Twitter', t: 'Dziennikarze z Europy pytają, co znaczy refren: „bum bum, pociąg jedzie w dal”.', c: [
        ['Tłumaczę dosłownie.', { s: -5, h: 10 }, 'Po angielsku brzmi jeszcze głupiej. I jeszcze lepiej.'],
        ['Mówię, że to metafora.', { s: 5, n: 5 }, 'Metafory są w modzie.'],
        ['Śpiewam im a cappella.', { h: 20, n: 5 }, 'Hotel wiruje. Ktoś nagrywa. Wszyscy bisują.']] },
      { k: 'imprezowa', app: 'Backstage', t: 'Delegat z sąsiedniego kraju proponuje wymianę głosów: „Wy dacie nam 12, my wam 12”.', c: [
        ['Odmawiam. Wygram uczciwie.', { s: 15, h: -5 }, 'Komisja kiwa głową. Delegat prycha.'],
        ['Biorę układ.', { h: 10, s: -20, k: 5 }, 'Układ trafia na Twittera. Cała Europa czyta.'],
        ['Proponuję pierogi za głosy.', { h: 15, s: 5 }, 'Delegat: „Zgoda, ale ruskie”.']] },
      { k: 'gwiazdor', app: 'Telewizja', t: 'Finał Eurowizji. Wchodzisz na scenę, a 180 milionów widzów czeka. Wentylatory włączone.', c: [
        ['Daję z siebie wszystko.', { h: 25, n: 15 }, 'Występ trwa 3 minuty i 7 sekund. W pamięci Europy znacznie dłużej.', { next: 'END:eurowizja' }],
        ['Stawiam na spokój.', { s: 10, n: -5 }, 'Śpiewasz czysto. Nikt nie zapamiętuje.'],
        ['Zamieniam wentylatory na confetti.', { h: 20, k: -10 }, 'Confetti wpada do mikrofonu. Wokal robi się zabawny.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Wyniki ogłoszone. Co dalej z karierą po Eurowizji?', c: [
        ['Ruszam w trasę po Europie.', { k: 15, h: 10, n: 10 }, 'Dwanaście krajów. Pociąg jedzie.'],
        ['Wracam do cichego życia.', { n: -20, h: -10 }, 'W kraju wraca moda na tiul. Ty w domu.'],
        ['Wydaję płytę „Wentylatory”.', { h: 15, k: 10, s: -5 }, 'Płyta ma jeden hit. Ten sam.']] }
    ] },
    { id: 'deepfake', name: 'Cyfrowy bliźniak', k: 'detektyw', sub: 'Ktoś wypuścił hit Twoim głosem. Problem: nigdy go nie nagrałeś.', b: [
      { k: 'detektyw', app: 'TikTok', t: 'Na TikToku wiral: piosenka „Kocham Cię jak WiFi” Twoim głosem. Problem: nie nagrywałeś jej. To sztuczna inteligencja. Hit ma 5 milionów odsłuchań.', c: [
        ['Przyznaję, że to nie ja.', { s: 15, h: -5 }, 'Uczciwość zawsze popłaca. Czasem po tygodniu.'],
        ['Mówię, że to ja.', { h: 25, s: -15, n: 5 }, 'Pół Polski pyta, kiedy koncert na żywo.', { set: 'klamstwo' }],
        ['Dzwonię do prawnika.', { k: -5, n: -5 }, 'Prawnik: „Nie wiem, kto Cię sklonował, ale mam podejrzenia”.', { need: 'prawnik' }]] },
      [{ when: 'klamstwo', k: 'kibic', app: 'Instagram', t: 'Fani proszą o występ na żywo „Kocham Cię jak WiFi”. Nie znasz słów.', c: [
        ['Uczę się piosenki na pamięć.', { n: 10, s: 5 }, 'Okazuje się, że refren to same wykrzykniki.'],
        ['Mówię, że zapomniałem tekstu.', { s: -10, h: -5 }, 'Fani robią z tego remiks.'],
        ['Gram w playbacku.', { h: 15, s: -15, n: 5 }, 'Playback gra zbyt dobrze. Podejrzenia rosną.']] },
       { k: 'redaktor', app: 'Śliska News', t: 'Redakcja prosi o oświadczenie: „Czy Twój głos został skradziony przez algorytm?”.', c: [
        ['Jestem ofiarą technologii.', { s: 10, h: 10 }, 'Strona główna: „Artysta kontra algorytm”.'],
        ['Zażartowałem. To remiks.', { h: 15, s: -5 }, 'Nikt się nie śmieje, ale klikają.'],
        ['Milczę.', { n: 10, h: -5 }, 'Cisza wygląda jak przyznanie się do winy.']] }],
      { k: 'sliska', app: 'Mail', t: 'Firma od AI proponuje: „Zarób na swojej cyfrowej kopii. 60 procent dla Ciebie, 40 dla nas”.', c: [
        ['Podpisuję. Pieniądze za nic.', { k: 25, s: -10 }, 'Kopia pracuje 24 godziny na dobę. Ty śpisz.', { set: 'kopia' }],
        ['Odmawiam.', { s: 10, n: 5 }, 'Firma wypuszcza „kopię kopii”. Brzmi gorzej.'],
        ['Pozywam firmę.', { s: 5, k: -10, n: 5 }, 'Pozew jest głośny. Sąd jeszcze głośniejszy.', { need: 'prawnik' }]] },
      { k: 'gwiazdor', app: 'Telewizja', t: 'Telewizja zaprasza Ciebie i Twojego klona do jednego studia. Na żywo.', c: [
        ['Idę, ale bez klona.', { s: 5 }, 'Prowadząca: „A gdzie ten drugi Pan?”.'],
        ['Przychodzę z klonem.', { h: 25, n: 10 }, 'Klon śpiewa lepiej. Jest też uprzejmiejszy.'],
        ['Przychodzę w masce.', { h: 15, s: -5, n: 5 }, 'Nikt nie wie, który to który. Rekord oglądalności.']] },
      [{ when: 'kopia', k: 'sliska', app: 'Mail', t: 'Twoja cyfrowa kopia wypuściła nowy singiel bez Twojej zgody. Wersja AI jest popularniejsza niż oryginał.', c: [
        ['Walczę o prawa do własnego głosu.', { s: 15, n: 10, k: -5 }, 'Fani dopingują. Wytwórnia już pisze regulamin.'],
        ['Zostawiam klonowi robotę.', { k: 15, n: -10, h: -5 }, 'Zostajesz „menedżerem swojego głosu”. Stały etat.'],
        ['Nagrywam duet z kopią.', { h: 25, s: 5 }, 'Duet jest hitem. I dziwną terapią.']] },
       { k: 'wsciekla', app: 'Twitter', t: 'Internet zaczyna fałszować Twoje wypowiedzi: „{nick} popiera ananasa na pizzy”. Kolejny deepfake.', c: [
        ['Prostuję w relacjach.', { s: 5, n: 5 }, 'Sprostowanie ma 12 tysięcy wyświetleń. Fałszywka 3 miliony.'],
        ['Robię z fałszywki mema.', { h: 20, s: -5 }, 'Ananas zostaje Twoim logo.'],
        ['Zgłaszam wszystkie.', { n: 10, s: 5 }, 'Platforma odpowiada po sześciu tygodniach.']] }],
      { k: 'detektyw', app: 'Spotkanie', t: 'Ekspert od AI mówi: „Jedyny sposób na uwolnienie się od klona to wspólna płyta. Duet z samym sobą”.', c: [
        ['Nagrywam duet z klonem.', { h: 25, s: 5, n: 5 }, 'W studiu dwa Twoje głosy kłócą się o kolejność zwrotek.', { next: 'END:ai' }],
        ['Zbieram dowody do sądu.', { s: 10, k: -10, n: 5 }, 'Sędzia uczy się, co to token.'],
        ['Wyłączam internet na tydzień.', { n: -20, h: -15 }, 'Cisza jest głośniejsza niż klon.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Debata o AI w muzyce trwa. Jaka będzie Twoja rola?', c: [
        ['Prowadzę podcast o AI w muzyce.', { s: 15, h: 5 }, 'Pierwszy odcinek: „Czy roboty czują bit?”.'],
        ['Piszę piosenkę, której AI nie zagra.', { s: 15, n: -5 }, 'Piosenka trwa 12 minut i ma cztery zmiany tempa.'],
        ['Zamawiam kolejne 100 kopii.', { k: 20, s: -15, h: 10 }, 'Cyfrowe tłumy w sieci.']] }
    ] },
    { id: 'festiwal', name: 'Festiwal w deszczu', k: 'ratownik', sub: 'Jesteś headlinerem. Pada, wieje, a scena stoi w bagnie.', b: [
      { k: 'ratownik', app: 'Backstage', t: 'Jesteś gwiazdą festiwalu „Letni Błotnik”. Od rana leje, scena tonie, a organizator mówi: „Spokojnie, mamy plan B”. Planem B jest plandeka.', c: [
        ['Idę na scenę w kaloszach.', { h: 15, s: 5 }, 'Kalosze od rana są hitem festiwalu.', { set: 'kalosze' }],
        ['Czekam w autobusie na lepszą pogodę.', { n: -5, h: -5 }, 'Autobus ma ogrzewanie i bardzo wygodne siedzenia.'],
        ['Dzwonię do menedżera.', { k: -5, n: -5 }, 'Menedżer: „Jest jedna rzecz, o której musisz wiedzieć. Nie jest dobra”.']] },
      { k: 'kowboj', app: 'Mail', t: 'Organizator: „Wypłatę dostaniesz po koncercie, bo konta są chwilowo zablokowane”. Brzmi podejrzanie.', c: [
        ['Żądam przedpłaty.', { s: 5, n: 5, k: 5 }, 'Organizator: „No dobra. Gotówką. W kopercie”.'],
        ['Ufam i gram.', { k: -10, h: 10 }, 'Koperta nigdy nie przychodzi.'],
        ['Prawnik pisze oficjalne żądanie.', { s: 10, k: 5 }, 'Organizator wypłaca w 5 minut.', { need: 'prawnik' }]] },
      [{ when: 'kalosze', k: 'ziomek', app: 'Instagram', t: 'Fani w kaloszach układają napis „{nick} w błocie”. Wygląda świetnie.', c: [
        ['Dołączam do ludzi w błocie.', { h: 25, s: 10, n: 5 }, 'Błoto sięga do kolan. Tłum szaleje.'],
        ['Robię zdjęcie z góry.', { h: 15, s: 5 }, 'Dron kręci. Mama dumna.'],
        ['Zostaję w kaloszach na zawsze.', { s: 5, n: -5 }, 'Kalosze wchodzą do słownika.']] },
       { k: 'redaktor', app: 'Śliska News', t: 'Reporterzy relacjonują: „Gwiazda festiwalu siedzi w autobusie, gdy tysiące fanów moknie”.', c: [
        ['Wychodzę do ludzi w pelerynie.', { h: 15, s: 10, n: 5 }, 'Peleryna z worka na śmieci. Szacun.'],
        ['Tłumaczę, że to kwestia bezpieczeństwa.', { s: -5, n: 5 }, 'Komentarze: „bezpieczeństwo to gwiazdorzenie”.'],
        ['Rozdaję ciepłą herbatę.', { s: 15, k: -5 }, 'Herbata za 3 złote robi robotę.']] }],
      { k: 'wsciekla', app: 'Twitter', t: 'Burza przybiera na sile. Organizator chce przerwać koncert, publiczność chce więcej.', c: [
        ['Gram dalej pod plandeką.', { h: 20, n: 10, s: -5 }, 'Prąd trzaska. Fani krzyczą. Technik też.'],
        ['Przerywam i przepraszam.', { s: 10, h: -10 }, 'Fani rozumieją. Prawie wszyscy.'],
        ['Gram bez prądu, a cappella.', { h: 20, s: 15, n: 10 }, 'Trzy tysiące osób śpiewa razem w deszczu. Wideo robi karierę.', { set: 'acappella' }]] },
      [{ when: 'acappella', k: 'gwiazdor', app: 'TikTok', t: 'Wideo z a cappella w deszczu ma 11 milionów wyświetleń. Hasło „Śpiewamy w deszczu” staje się trendem.', c: [
        ['Wydaję singiel „W deszczu”.', { k: 20, h: 10 }, 'Singiel wchodzi na listę w cztery dni.'],
        ['Zakładam fundację dla rolników.', { s: 20, k: -5 }, 'Hit sezonu: moralność.'],
        ['Sprzedaję kalosze „Śpiewam w deszczu”.', { k: 20, s: -10, h: 10 }, 'Wyprzedane w dwa dni.']] },
       { k: 'ratownik', app: 'Backstage', t: 'Woda wlewa się za scenę, scena się chwieje. Ochroniarz: „Musimy ewakuować artystów, sprzęt i Ciebie”.', c: [
        ['Zostaję do końca.', { h: 10, n: 15, s: 5 }, 'Scena nie wytrzymuje. Ty tak.'],
        ['Ewakuuję się z ekipą.', { s: 5, n: -5 }, 'Ekipa wsiada do autobusu. Autobus grzęźnie w błocie.'],
        ['Pomagam wynosić sprzęt.', { s: 15, h: 5, n: 5 }, 'Dźwiękowiec płacze ze wzruszenia.']] }],
      { k: 'ziomek', app: 'Instagram', t: 'Fan, który spadł w błoto, robi z Ciebie mema „Król Błota”. Organizator chce użyć tego jako motto festiwalu.', c: [
        ['Przyjmuję tytuł.', { h: 25, s: 5 }, 'Dostajesz koronę z błota. Jest ciężka.', { next: 'END:blotnik' }],
        ['Odmawiam. To obciach.', { s: 5, h: -5 }, 'Wszyscy i tak mówią na Ciebie „Król”.'],
        ['Sprzedaję prawa do mema.', { k: 20, s: -10 }, 'Błoto zarabia lepiej niż płyty.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Festiwal się skończył. Rachunki, sprzątanie i podsumowanie.', c: [
        ['Oddaję honorarium na sprzątanie.', { s: 20, k: -15 }, 'Organizator płacze po raz drugi.'],
        ['Biorę wypłatę i uciekam.', { k: 20, s: -10 }, 'Droga do domu jest szybka. Sumienie wolniejsze.'],
        ['Kupuję całą scenę na pamiątkę.', { h: 15, k: -20 }, 'Sceną można nakryć dom.']] }
    ] }
  ];

  /* ---------- losowe wydarzenia między dniami ---------- */
  var EVENTS = [
    { k: 'diabelek', app: 'Instagram', t: 'Hejter liczy błędy ortograficzne w Twoich storiesach. Doliczył się 37.', c: [['Poprawiam wszystkie.', { s: 5, n: 5 }, '„Szacun za pokorę” – pisze nawet hejter.'], ['Odpisuję z błędami celowo.', { h: 10 }, '„Żeby było 38” – komentarz dnia.'], ['Blokuję.', { n: -5, s: -5 }, 'Hejter zakłada drugie konto.']] },
    { k: 'redaktor', app: 'Telefon', t: 'Sponsor dzwoni: „W kontrakcie jest klauzula moralności. Ostatnio trochę ją naginasz”.', c: [['Uspokajam sponsora.', { n: 5 }, 'Kontrakt zostaje. Na razie.'], ['Zrywam kontrakt.', { k: -15, s: 10 }, '„Nie dam się kontrolować” – fani zachwyceni.'], ['Proszę o podwyżkę.', { k: 10, s: -5, n: 5 }, 'Sponsor się śmieje. Potem płaci.']] },
    { k: 'zakochana', app: 'Telefon', t: 'Mama dzwoni: „Synku/córciu, co ty wyprawiasz w tym internecie?”.', c: [['Tłumaczę spokojnie.', { n: -10 }, 'Mama: „Dobrze, tylko jedz coś”.'], ['Mówię, że to marketing.', { h: 5 }, 'Mama: „A to nowe słowo na wstyd?”.'], ['Nagrywam rozmowę na TikToka.', { h: 15, s: -10 }, 'Mama ma teraz więcej fanów niż Ty.']] },
    { k: 'sliska', app: 'Instagram', t: 'Ktoś zrobił z Twojej twarzy filtr na Instagramie. Używa go pół Polski.', c: [['Sam go używam.', { h: 10 }, 'Filtr z Tobą na Tobie. Incepcja.'], ['Zgłaszam filtr.', { s: -5, n: 5 }, 'Filtr znika. Powstają trzy podróbki.'], ['Zarabiam na nim.', { k: 10 }, 'Wersja premium z koroną: 4,99 zł.']] },
    { k: 'detektyw', app: 'Facebook', t: 'Fejkowy fanpage z Twoim zdjęciem ma więcej obserwujących niż prawdziwe konto.', c: [['Przejmuję go oficjalnie.', { h: 10, k: 5 }, 'Fejk staje się oryginałem. Admin dostaje kawę.'], ['Robię z nim beef.', { h: 15, n: 5 }, 'Beef z samym sobą. Internet zachwycony.'], ['Ignoruję.', { n: -5 }, 'Fejk publikuje Twoje zdjęcia z dzieciństwa.']] },
    { k: 'redaktor', app: 'Śliska News', t: 'Śliska News prosi o komentarz do plotki o Twoim nowym tatuażu „w intymnym miejscu”.', c: [['Pokazuję tatuaż (prawie).', { h: 15, s: -5 }, 'Zdjęcie ocenzurowane gwiazdką. Najlepiej klikający artykuł tygodnia.'], ['Dementuję.', { s: 5 }, '„Nie mam tatuażu” – zdanie, w które nikt nie wierzy.'], ['Mówię, że to logo Śliskiej.', { h: 20, s: 5 }, 'Redakcja oferuje dożywotnią prenumeratę.']] },
    { k: 'kowboj', app: 'Bazar', t: 'Podróbki Twojego merchu sprzedają się na bazarze lepiej niż oryginały.', c: [['Kupuję jedną i chwalę.', { h: 10, s: 5 }, '„Jakość lepsza niż moja” – piszesz pod zdjęciem.'], ['Zgłaszam podróbki.', { k: 5, n: 5 }, 'Bazar przenosi się trzy alejki dalej.'], ['Obniżam ceny oryginału.', { k: -10, s: 10 }, 'Fani doceniają. Księgowa nie.']] },
    { k: 'uwodziciel', app: 'Wiadomości', t: 'Znana influencerka pisze o 2:00 w nocy: „Śpisz? 😏”.', c: [['Odpisuję.', { h: 15, n: 10 }, 'Rano screen jest na plotkarskim portalu.'], ['Zostawiam na rano.', { s: 5 }, 'Rano odpisujesz „sorki, spałem”. Klasyk.'], ['Wrzucam screen na story.', { h: 20, s: -15 }, 'Influencerka wrzuca Twoje stare wiadomości. Remis.']] },
    { k: 'ratownik', app: 'Zdrowie', t: 'Trzecia noc bez snu. Ręce się trzęsą, telefon parzy.', c: [['Idę spać o 22:00.', { n: -15, h: -5 }, 'Rano świat wygląda lepiej.'], ['Kawa i dalej.', { n: 10, h: 5 }, 'Piąta kawa. Serce gra techno.'], ['Wyjeżdżam na weekend za miasto.', { n: -20, k: -5 }, 'Las, cisza, brak zasięgu. Cudownie.']] }
  ];

  /* ---------- ekipa do zatrudnienia (raz na grę, po 2. dniu) ---------- */
  var CREW = [
    ['prawnik', 'Prawnik', 20, 'Odblokowuje opcje prawne, mniejsze straty w sądzie.'],
    ['pr', 'PR-owiec', 15, 'Odblokowuje opcje PR, spadki Szacunku o 40% mniejsze.'],
    ['terapeuta', 'Terapeuta', 10, 'Od razu −25 Nerwów, później nerwy rosną o 40% wolniej.']
  ];

  /* ---------- zakończenia ---------- */
  var ENDS = [
    ['ikona', 'Ikona pokolenia', 'ikona', function (s) { return s.h >= 85 && s.s >= 60; }, 'Twoja twarz jest na billboardach, Twoje słowa na koszulkach, a dzieciaki cytują Cię na przerwach. Afera tylko dodała Ci legendy.'],
    ['legenda', 'Legenda', 'super', function (s) { return s.s >= 70 && s.h >= 65; }, 'Wychodzisz z afery silniejszy niż kiedykolwiek. Hype, szacunek i nagłówek „Comeback dekady”.'],
    ['krol', 'Król dramy', 'diabelek', function (s) { return s.h >= 75 && s.s < 40; }, 'Wszyscy Cię znają, nikt Ci nie ufa. Każdy Twój post to nowy artykuł na Śliskiej. Korona jest, tylko trochę ubrudzona.'],
    ['biznes', 'Biznesmen roku', 'kowboj', function (s) { return s.k >= 80; }, 'Z afery zrobiłeś biznes: merch, reklamy, trasa. Konto pełne. O muzyce mało kto pamięta.'],
    ['zen', 'Zen mistrz', 'sauna', function (s) { return s.n <= 15; }, 'Afera? Jaka afera? Medytujesz, pijesz zieloną herbatę i śpisz po 9 godzin. Internet się wściekał, Ty nawet nie zauważyłeś.'],
    ['weteran', 'Szanowany weteran', 'zakochana', function (s) { return s.s >= 70; }, 'Nie było fajerwerków, ale wyszedłeś z tego z klasą. Branża Cię szanuje, fani też.'],
    ['mem', 'Żywy mem', 'kapiel', function (s) { return s.h >= 65; }, 'Nie wiadomo jak, ale wszyscy Cię kochają – jako mema. Twoja mina jest na naklejkach, kubkach i w każdej grupie.'],
    ['cisza', 'Cichy przeczekiwacz', 'szlafrok', function (s) { return s.h < 30; }, 'Drama wygasła sama. Nikt już nie pamięta, o co chodziło – Ty też nie. Bezpiecznie, ale nudno.'],
    ['wtopa', 'Wtopa roku', 'ratownik', function (s) { return s.s < 25; }, 'Każdy ruch dolewał oliwy do ognia. Śliska przyznaje Ci tytuł „Wtopa roku”. Licznik dni bez wtopy: 0.'],
    ['przecietniak', 'Przeciętniak sceny', 'ziomek', function () { return true; }, 'Ani legenda, ani wtopa. Afera przeszła, Ty zostałeś – gdzieś pośrodku. Spróbuj odważniej!'],
    ['cancel', 'Scancelowany', 'wsciekla', null, 'Szacunek spadł do zera. Marki zrywają umowy, festiwale skreślają Cię z line-upu, a Twoja ksywka staje się czasownikiem: „ale się {nick}nął”.'],
    ['bankrut', 'Bankrut', 'mikolaj', null, 'Kasa się skończyła. Sprzedajesz złoty łańcuch na Vinted i grasz na weselach. Ale przynajmniej jest wesoło.'],
    ['zalamanie', 'Załamanie nerwowe', 'niesmiala', null, 'Nerwy puściły. Wrzucasz czarny kwadrat, wyłączasz telefon i wyjeżdżasz w Bieszczady. Wrócisz – ale nie szybko.'],
    ['duet', 'Najlepsi kumple', 'imprezowa', null, 'Zamiast wojny – wspólna scena. Fani płaczą ze wzruszenia, a Śliska pisze „Najpiękniejsza zgoda roku”.'],
    ['slub', 'Ślub roku', 'uwodziciel', null, 'Oświadczyny na Instagramie, ślub w transmisji live, a były producent… gra na weselu. Love is in the air.'],
    ['sad', 'Przegrana w sądzie', 'detektyw', null, 'Biegły nie miał wątpliwości. Płacisz odszkodowanie, a refren od teraz oficjalnie należy do Szymka z Radomia.'],
    ['ucieczka', 'Ucieczka na Bali', 'surfer', null, 'Zostajesz w raju. Konto w Polsce milczy, a Ty uczysz turystów surfować. Fani wciąż czekają na zwrot za bilety.'],
    ['oktagon', 'Walka w oktagonie', 'kibic', null, 'Gong, trzy rundy, jedna kontuzja ego. Wynik nieważny – oglądalność rekordowa, a Ty masz nową ksywkę: „Mokry Młot”.'],
    ['reality', 'Gwiazda reality show', 'sliska', null, '30 dni z sześcioma influencerami i kamerami w łazience. Wygrywasz program, przegrywasz resztki prywatności.'],
    ['kontrakt', 'Dożywotni kontrakt', 'detektyw', null, 'Podpis złożony. Pióro zamienia się w popiół, a Twoje piosenki od teraz pisze dział prawny. Ale pensja jest piekielnie dobra.'],
    ['eurowizja', 'Reprezentant Polski', 'gwiazdor', null, '180 milionów widzów, zero punktów od jury i dwanaście od publiczności z całej Europy. Wentylatory jeszcze długo kręcą się w pamięci.'],
    ['ai', 'Cyfrowy bliźniak', 'sliska', null, 'Nagrywasz duet z samym sobą. Klon wygrywa listę przebojów, a Ty zostajesz jego menedżerem na pół etatu.'],
    ['blotnik', 'Król błota', 'ziomek', null, 'Korona z błota ląduje na półce obok złotej płyty. Festiwal nazywa Cię Królem Błota, a Ty nawet nie próbujesz protestować.'],
    ['ambasador', 'Ambasador marki', 'kowboj', function (s) { return s.k >= 65 && s.s >= 50; }, 'Cztery marki walczą o Twoją twarz. Stałeś się reklamą, która sama pisze piosenki.'],
    ['remiks', 'Remiks roku', 'imprezowa', function (s) { return s.h >= 60 && s.n <= 35; }, 'Z afery zrobiono remiks: klubowy, taneczny i wyjątkowo lekki. DJ-e puszczają Cię co weekend.'],
    ['podcast', 'Podcaster-pokutnik', 'redaktor', function (s) { return s.s >= 50 && s.n <= 45; }, 'Zakładasz podcast „Moje największe wtopy”. Słuchalność rośnie szybciej niż Twoja pokora.'],
    ['tabloid', 'Bohater tabloidów', 'uwodziciel', function (s) { return s.h >= 55 && s.s <= 45; }, 'Codziennie jesteś na okładce. Nikt nie pamięta, kiedy ostatnio śpiewałeś, ale wszyscy wiedzą, co jadłeś na śniadanie.'],
    ['talkshow', 'Stały gość kanapy', 'szlafrok', function (s) { return s.h >= 45 && s.k >= 45 && s.s < 60; }, 'Każdy talk-show chce Cię na kanapie. Masz już tam własną poduszkę z nadrukiem.'],
    ['emerytura', 'Spokojna emerytura', 'sauna', function (s) { return s.k >= 60 && s.h < 40 && s.n <= 40; }, 'Konto pełne, hype wygasł. Kupujesz domek nad jeziorem i wędkę. Słuchasz własnych płyt, bo nikt inny już nie.'],
    ['milioner', 'Milion i jeden', 'gwiazdor', function (s, r) { return r.fol >= 1500000 && s.k >= 60; }, 'Półtora miliona obserwujących i pełne konto. Afera była najlepszą kampanią marketingową w Twoim życiu.']
  ];
  var SPECIAL = ['duet', 'slub', 'sad', 'ucieczka', 'oktagon', 'reality', 'kontrakt', 'eurowizja', 'ai', 'blotnik'];
  // kolejność sprawdzania zakończeń wynikowych (milioner przed resztą)
  var FINAL = ['milioner', 'ikona', 'legenda', 'krol', 'biznes', 'ambasador', 'zen', 'weteran', 'remiks', 'podcast', 'mem', 'tabloid', 'talkshow', 'emerytura', 'cisza', 'wtopa', 'przecietniak'];
  var END = function (id) { return ENDS.filter(function (e) { return e[0] === id; })[0]; };

  /* ---------- osiągnięcia ---------- */
  var ACH = [
    ['first', 'Pierwsza afera', 'Ukończ dowolną aferę'],
    ['all6', 'Seryjny skandalista', 'Ukończ wszystkie 10 afer'],
    ['col10', 'Kolekcjoner wtop', 'Odkryj 10 zakończeń'],
    ['col20', 'Encyklopedia dram', 'Odkryj wszystkie 30 zakończeń'],
    ['special', 'Fabularny zwrot', 'Zdobądź specjalne zakończenie afery'],
    ['rich', 'Milioner', 'Skończ z Kasą 95 lub więcej'],
    ['viral', 'Wiralowy', 'Skończ z Hype 95 lub więcej'],
    ['zero', 'Zero szacunku', 'Przetrwaj aferę z Szacunkiem 10 lub mniej'],
    ['ice', 'Stalowe nerwy', 'Skończ z Nerwami 10 lub mniej'],
    ['lawyer', 'Prawnik w zanadrzu', 'Użyj opcji prawnika'],
    ['spin', 'Spin doktor', 'Użyj opcji PR-owca'],
    ['mln', 'Milion obserwujących', 'Przekrocz 1 milion obserwujących'],
    ['hard', 'Hardkorowiec', 'Ukończ aferę na poziomie Hardkor bez przegranego zakończenia']
  ];

  /* ---------- komentarze internautów ---------- */
  var USERS = ['@mokra_ola', '@ziomek_z_bloku', '@hejter3000', '@kasia.plotkara', '@sliski_fan', '@bartek_wjazd', '@anka.drama', '@fan_nr1', '@wiecznie_offline', '@pani_basia', '@kuba.memiarz', '@tylko_popcorn'];
  var CM = {
    hype: ['KRÓL 👑', 'to jest content, którego potrzebowałem', '{nick} rozwala system', 'najlepsza drama tego roku 🍿', 'idę po popcorn', 'legenda ❤️', 'haha szanuję', 'mokro się zrobiło 💦', 'czekam na część 2'],
    hate: ['ale żenada', 'unfollow', 'kiedyś był lepszy', '{nick} skończony', 'słabe na wielu poziomach', 'pierwszy raz widzę, żeby ktoś tak się zaorał', 'PR team płacze', 'wstyd mi za ciebie', 'kto mu doradza?'],
    calm: ['ciekawe co dalej', 'czekam na drugą stronę', 'Śliska już pisze artykuł?', 'kto tu z TikToka?', 'hmm', 'dojrzale', 'ok, to było rozsądne', 'spokojnie, ludzie'],
    rich: ['ile on na tym zarobił 💰', 'kasa, kasa, kasa', 'sprzedał się? 🤔', 'biznesmen roku']
  };

  function mount(el, H) {
    var g = H.G('drama'), $ = function (s) { return el.querySelector(s); }, esc = H.esc, K = H.K;
    var run = null, R = Math.random;
    /* ikonka: Knaga w stroju + odznaka na gradiencie (id afery albo zakończenia) */
    function tile(id, kind) { var c = COL[id] || ['#ffc4a8', '#e0407a']; return '<span class="dr-ico is-' + (kind || 'sc') + '" style="--a:' + c[0] + ';--b:' + c[1] + '"><svg class="dr-art" viewBox="0 0 48 48" aria-hidden="true">' + (ART[id] || '') + '</svg></span>'; }
    H.shell(el, g, '<div class="dr" id="dr"></div>', { side: '<section class="gp-box"><h3>Zakończenia <small id="dr-ec"></small></h3><div class="dr-ends" id="dr-ends"></div></section><details class="gp-box dr-fold" id="dr-fold"><summary><h3>Osiągnięcia <small id="dr-ac"></small></h3><span class="dr-chev" aria-hidden="true"></span></summary><ul class="dr-ach" id="dr-ach"></ul></details>' });
    var d0 = H.load();
    (function () { var f = $('#dr-fold'); if (!f) return; try { f.open = localStorage.getItem('sn-dr-fold') === '1'; } catch (e) { /* - */ } f.addEventListener('toggle', function () { try { localStorage.setItem('sn-dr-fold', f.open ? '1' : '0'); } catch (e) { /* - */ } }); })();
    function data() { var d = H.load(); d.endings = d.endings || []; d.dramaAch = d.dramaAch || []; d.dramaDone = d.dramaDone || []; d.dramaNick = d.dramaNick || ''; return d; }
    function endsBox() {
      var d = data(), got = d.endings;
      $('#dr-ec').textContent = got.length + '/' + ENDS.length;
      $('#dr-ends').innerHTML = ENDS.map(function (e) { var on = got.indexOf(e[1]) >= 0; return '<span class="dr-end' + (on ? ' is-on' : '') + (SPECIAL.indexOf(e[0]) >= 0 ? ' is-sp' : '') + '" title="' + (on ? esc(e[1]) : 'Jeszcze nie odkryte') + '">' + (on ? tile(e[0], 'end') : '<i>?</i>') + '<b>' + (on ? e[1] : '???') + '</b></span>'; }).join('');
      $('#dr-ac').textContent = d.dramaAch.length + '/' + ACH.length;
      $('#dr-ach').innerHTML = ACH.map(function (a) { var on = d.dramaAch.indexOf(a[0]) >= 0; return '<li class="' + (on ? 'is-on' : '') + '"><span>' + ic(on ? 'check' : 'lock', 14) + '</span><div><b>' + a[1] + '</b><small>' + a[2] + '</small></div></li>'; }).join('');
    }
    function saveRun() { try { if (run && !run.done) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY); } catch (e) { /* - */ } }
    function loadRun() { try { var r = JSON.parse(localStorage.getItem(RUN_KEY)); return r && r.sc && !r.done ? r : null; } catch (e) { return null; } }
    var T = function (s) { return String(s).replace(/\{nick\}/g, run ? run.nick : 'Ty'); };
    var fmtFol = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' mln' : n >= 1000 ? Math.round(n / 1000) + ' tys.' : String(n); };
    var SC = function (id) { return SCEN.filter(function (s) { return s.id === id; })[0]; };
    var ROLE = function (id) { return ROLES.filter(function (r) { return r.id === id; })[0]; };

    /* ----- ekran wyboru: postać + afera ----- */
    function pick() {
      var d = data(), saved = loadRun(), role = d.dramaRole || 'raper', diff = d.dramaDiff || 'norm';
      $('#dr').innerHTML = '<div class="dr-pick">' +
        (saved ? '<button type="button" class="dr-cont" data-act="cont"><span class="dr-cont-k">' + tile(saved.sc, 'sc') + '</span><span><small>Masz niedokończoną aferę</small><b>' + esc(SC(saved.sc).name) + ' · dzień ' + Math.min(7, saved.beat + 1) + '/7</b><em>' + esc(saved.nick) + ' – ' + esc(ROLE(saved.role).name) + '</em></span><i>' + ic('play', 18) + ' Kontynuuj</i></button>' : '') +
        '<h2>Twoja postać</h2><div class="dr-who"><label class="dr-nick"><span>Ksywka</span><input type="text" id="dr-nick" maxlength="16" placeholder="np. Mokry Mati" value="' + esc(d.dramaNick) + '" autocomplete="off"></label></div>' +
        '<div class="dr-roles" role="radiogroup" aria-label="Typ artysty">' + ROLES.map(function (r) {
          return '<button type="button" class="dr-role' + (r.id === role ? ' is-on' : '') + '" data-role="' + r.id + '" role="radio" aria-checked="' + (r.id === role) + '"><span class="dr-role-k">' + AV(r.id) + '</span><b>' + r.name + '</b><small>' + r.d + '</small><span class="dr-role-st">' + STATS.map(function (s) { return '<i title="' + s[1] + '">' + ic(s[2], 12) + r.st[s[0]] + '</i>'; }).join('') + '</span></button>';
        }).join('') + '</div>' +
        '<h2>Poziom trudności</h2><div class="dr-diff" id="dr-diff" role="radiogroup" aria-label="Poziom trudności">' + DIFFS.map(function (x) { return '<button type="button" class="dr-df' + (x[0] === diff ? ' is-on' : '') + '" data-diff="' + x[0] + '" role="radio" aria-checked="' + (x[0] === diff) + '"><b>' + x[1] + '</b><small>' + x[2] + '</small></button>'; }).join('') + '</div>' +
        '<h2>Wybierz aferę</h2><p class="dr-lead">7 dni, decyzje, losowe wydarzenia i 4 paski. Jeśli Szacunek albo Kasa spadną do zera, a Nerwy dojdą do 100 – koniec gry.</p><div class="dr-sc">' +
        SCEN.map(function (s, i) { var done = d.dramaDone.indexOf(s.id) >= 0; return '<button type="button" class="dr-scb" data-sc="' + s.id + '"><span class="dr-scb-k">' + tile(s.id, 'sc') + '</span><span><b>' + (i + 1) + '. ' + s.name + (done ? ' <em>' + ic('check', 12) + ' ukończona</em>' : '') + '</b><small>' + s.sub + '</small></span></button>'; }).join('') + '</div></div>';
    }

    /* ----- gra ----- */
    function begin(scId) {
      var d = data(), roleId = (el.querySelector('.dr-role.is-on') || {}).dataset ? el.querySelector('.dr-role.is-on').dataset.role : 'raper', r = ROLE(roleId);
      var nick = ($('#dr-nick').value || '').trim().slice(0, 16) || 'Mokry Mati';
      d.dramaNick = nick; d.dramaRole = roleId; H.save(d);
      var diff = (el.querySelector('.dr-df.is-on') || {}).dataset ? el.querySelector('.dr-df.is-on').dataset.diff : 'norm'; d.dramaDiff = diff; H.save(d);
      run = { sc: scId, role: roleId, diff: diff, fol0: r.fol, lastDay: -1, st: (function (st) { if (diff === 'hard') st.n = Math.min(95, st.n + 10); return st; })(JSON.parse(JSON.stringify(r.st))), nick: nick, fol: r.fol, beat: 0, items: [], flags: [], ev: 0, shop: false, used: [], log: [], inter: null };
      phone(); day(); saveRun();
    }
    function phone() {
      var s = SC(run.sc), r = ROLE(run.role);
      $('#dr').innerHTML = '<div class="dr-phone"><div class="dr-top"><span class="dr-me"><span class="dr-me-k" id="dr-mek">' + AV(r.id) + '</span><span><b>' + esc(run.nick) + '</b><small>' + r.name + ' · <span id="dr-fol"></span> obserwujących</small></span></span><span class="dr-day" id="dr-step"></span></div>' +
        '<div id="dr-meters"></div><div class="dr-crew" id="dr-crew"></div><div class="dr-feed" id="dr-feed" aria-live="polite">' + run.log.join('') + '</div><div class="dr-ch" id="dr-ch"></div></div>' +
        '<div class="dr-bar"><span>' + esc(s.name) + '</span><button type="button" class="btn btn-sm" data-act="quit">Przerwij aferę</button></div>';
      var f = $('#dr-feed'); f.scrollTop = f.scrollHeight;
    }
    function meters(delta) {
      $('#dr-meters').innerHTML = '<div class="dr-m">' + STATS.map(function (s) { var v = run.st[s[0]], dl = delta && delta[s[0]]; return '<div class="dr-mt is-' + s[0] + (dl ? ' is-flash ' + (((dl > 0) === (s[0] !== 'n')) ? 'f-up' : 'f-dn') : '') + (s[0] === 'n' ? (v >= 75 ? ' is-warn' : '') : (v <= 20 ? ' is-warn' : '')) + '"><span>' + ic(s[2], 12) + s[1] + '<em>' + v + (dl ? '<sup class="' + ((dl > 0) === (s[0] !== 'n') ? 'up' : 'dn') + '">' + (dl > 0 ? '+' : '') + dl + '</sup>' : '') + '</em></span><i><b style="width:' + v + '%"></b></i></div>'; }).join('') + '</div>';
      $('#dr-fol').textContent = fmtFol(run.fol);
      $('#dr-crew').innerHTML = run.items.length ? 'Ekipa: ' + run.items.map(function (it) { var c = CREW.filter(function (x) { return x[0] === it; })[0]; return '<span>' + c[1] + '</span>'; }).join('') : '';
    }
    function bubble(cls, html, keep) { var f = $('#dr-feed'), b = '<div class="dr-b ' + cls + '">' + html + '</div>'; f.insertAdjacentHTML('beforeend', b); if (keep !== false) run.log.push(b); if (run.log.length > 60) run.log = run.log.slice(-60); f.scrollTop = f.scrollHeight; }
    function beatNode() { var b = SC(run.sc).b[run.beat]; if (!Array.isArray(b)) return b; return b.filter(function (v) { return !v.when || run.flags.indexOf(v.when) >= 0; })[0]; }
    function opts(node) { return node.c.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { var x = o.c[3] || {}; return !x.need || run.items.indexOf(x.need) >= 0; }); }
    function pips() { var h = '<i class="dr-pips" aria-hidden="true">'; for (var i = 0; i < 7; i++) h += '<u class="' + (i < run.beat ? 'is-done' : i === run.beat ? 'is-now' : '') + '"></u>'; return h + '</i>'; }
    var STI = { h: 'fire', s: 'star', k: 'cash', n: 'bolt' };
    function hintOf(c) { var h = ''; Object.keys(STI).forEach(function (k) { if (c[1] && c[1][k]) h += '<span title="Zmienia: ' + STATS.filter(function (x) { return x[0] === k; })[0][1] + '">' + ic(STI[k], 12) + '</span>'; }); return h ? '<span class="dr-hint">' + h + '</span>' : ''; }
    var calm = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    function show(node, kind) {
      $('#dr-step').innerHTML = kind === 'shop' ? 'Przerwa' : kind === 'event' ? '<span class="dr-dtx">Dzień ' + (run.beat + 1) + ' · niespodzianka</span>' : pips() + '<span class="dr-dtx">Dzień ' + (run.beat + 1) + '/7</span>';
      meters(); saveRun();
      if (kind === 'beat' && run.lastDay !== run.beat) { run.lastDay = run.beat; bubble('is-day', '<span>Dzień ' + (run.beat + 1) + '</span>'); }
      $('#dr-ch').innerHTML = '';
      var mine = run, render = function () {
        if (run !== mine || !$('#dr-feed')) return;
        var tp = $('#dr-typing'); if (tp) tp.remove();
        bubble('is-in' + (kind === 'event' ? ' is-ev' : ''), '<span class="dr-av">' + AV(node.k) + '</span><div><small>' + esc(node.app) + (kind === 'event' ? ' · losowe wydarzenie' : '') + '</small><p>' + esc(T(node.t)) + '</p></div>');
        $('#dr-ch').innerHTML = opts(node).map(function (o) { var x = o.c[3] || {}; return '<button type="button" class="dr-opt' + (x.need ? ' is-need' : '') + '" data-c="' + o.i + '">' + (x.need ? '<em>' + (x.need === 'prawnik' ? 'Prawnik' : 'PR') + '</em>' : '') + '<span>' + esc(T(o.c[0])) + '</span>' + hintOf(o.c) + '</button>'; }).join('');
        saveRun();
      };
      if (calm()) return render();
      var f = $('#dr-feed'); f.insertAdjacentHTML('beforeend', '<div class="dr-b is-in" id="dr-typing"><span class="dr-av">' + AV(node.k) + '</span><div class="dr-tp"><i></i><i></i><i></i></div></div>'); f.scrollTop = f.scrollHeight;
      setTimeout(render, 650);
    }
    function day() {
      if (run.inter && run.inter.type === 'event') return show(EVENTS[run.inter.i], 'event');
      if (run.inter && run.inter.type === 'shop') return shop();
      show(beatNode(), 'beat');
    }
    function shop() {
      $('#dr-step').textContent = 'Przerwa'; meters();
      bubble('is-in is-ev', '<span class="dr-av">' + AV('redaktor') + '</span><div><small>Menedżer</small><p>Mamy trochę budżetu na wsparcie. Kogo bierzemy do ekipy? Płacimy z Kasy.</p></div>');
      $('#dr-ch').innerHTML = CREW.map(function (c) { var ok = run.st.k > c[2]; return '<button type="button" class="dr-opt dr-crew-o" data-crew="' + c[0] + '"' + (ok ? '' : ' disabled') + '><b>' + c[1] + ' <em>−' + c[2] + ' Kasy</em></b><small>' + c[3] + '</small></button>'; }).join('') + '<button type="button" class="dr-opt" data-crew="none">Nikogo. Sam sobie poradzę (+5 Kasy)</button>';
      saveRun();
    }
    function hire(id) {
      run.shop = true; run.inter = null;
      if (id === 'none') { apply({ k: 5 }); bubble('is-me', '<p>Nikogo. Sam sobie poradzę.</p>'); }
      else { var c = CREW.filter(function (x) { return x[0] === id; })[0]; run.items.push(id); var e = { k: -c[2] }; if (id === 'terapeuta') e.n = -25; apply(e, true); bubble('is-me', '<p>Zatrudniam: ' + c[1] + '.</p>'); bubble('is-re', '<p>' + c[1] + ' dołącza do ekipy. ' + c[3] + '</p>'); }
      if (dead()) return; next();
    }
    /* zastosowanie efektów (z poprawkami ekipy) – zwraca faktyczne zmiany */
    function apply(e, raw) {
      var out = {};
      STATS.forEach(function (s) {
        var k = s[0], v = e[k] || 0; if (!v) return;
        if (!raw) {
          if (k === 's' && v < 0 && run.items.indexOf('pr') >= 0) v = Math.round(v * .6);
          if (k === 'n' && v > 0 && run.items.indexOf('terapeuta') >= 0) v = Math.round(v * .6);
          if (k === 'k' && v < 0 && run.items.indexOf('prawnik') >= 0 && e.legal) v = Math.round(v * .5);
        }
        if (!raw && ((k === 'n' && v > 0) || (k !== 'n' && v < 0))) v = Math.round(v * (DMUL[run.diff || 'norm'] || 1));
        var nv = Math.max(0, Math.min(100, run.st[k] + v)); out[k] = nv - run.st[k]; run.st[k] = nv;
      });
      var hd = e.h || 0; run.fol = Math.max(1000, Math.round(run.fol * (1 + hd / 90 + (R() - .4) * .04)));
      return out;
    }
    function comments(e) {
      var pool = (e.s || 0) <= -10 ? CM.hate : (e.h || 0) >= 15 ? CM.hype : (e.k || 0) >= 15 ? CM.rich : (e.s || 0) >= 10 ? CM.calm.concat(CM.hype) : CM.calm;
      var a = pool[Math.floor(R() * pool.length)], b = (R() < .5 ? CM.calm : (e.s || 0) < 0 ? CM.hate : CM.hype); b = b[Math.floor(R() * b.length)];
      var u1 = USERS[Math.floor(R() * USERS.length)], u2 = USERS[Math.floor(R() * USERS.length)];
      bubble('is-cm', '<p><b>' + u1 + '</b> ' + esc(T(a)) + '</p>' + (a !== b ? '<p><b>' + u2 + '</b> ' + esc(T(b)) + '</p>' : ''));
    }
    function choose(i) {
      var node = run.inter && run.inter.type === 'event' ? EVENTS[run.inter.i] : beatNode(), c = node.c[i], x = c[3] || {};
      bubble('is-me', '<p>' + esc(T(c[0])) + '</p>');
      if (x.need === 'prawnik') run.used.push('lawyer'); if (x.need === 'pr') run.used.push('spin');
      var dl = apply(c[1]);
      if (x.set && run.flags.indexOf(x.set) < 0) run.flags.push(x.set);
      var chips = STATS.filter(function (s) { return dl[s[0]]; }).map(function (s) { var v = dl[s[0]], good = (v > 0) === (s[0] !== 'n'); return '<span class="' + (good ? 'up' : 'dn') + '">' + ic(s[2], 11) + (v > 0 ? '+' : '') + v + '</span>'; }).join('');
      bubble('is-re', '<p>' + esc(T(c[2])) + '</p>' + (chips ? '<div class="dr-dl">' + chips + '</div>' : ''));
      comments(c[1]);
      meters(dl);
      if (dead()) return;
      if (x.next && x.next.indexOf('END:') === 0) return finish(x.next.slice(4));
      if (run.inter && run.inter.type === 'event') { run.inter = null; run.ev++; return next(true); }
      run.beat++;
      next();
    }
    function dead() { if (run.st.s <= 0) { finish('cancel'); return true; } if (run.st.k <= 0) { finish('bankrut'); return true; } if (run.st.n >= 100) { finish('zalamanie'); return true; } return false; }
    function next(afterEvent) {
      if (run.beat >= 7) return finish(null);
      if (!run.shop && run.beat === 2) { run.inter = { type: 'shop' }; return shop(); }
      if (!afterEvent && run.ev < 2 && run.beat >= 1 && run.beat <= 5 && R() < .38) {
        var used = run.evUsed || (run.evUsed = []), free = EVENTS.map(function (_, i) { return i; }).filter(function (i) { return used.indexOf(i) < 0; });
        var ei = free[Math.floor(R() * free.length)]; used.push(ei); run.inter = { type: 'event', i: ei };
        return show(EVENTS[ei], 'event');
      }
      show(beatNode(), 'beat');
    }
    function finish(id) {
      var e = id ? END(id) : null;
      if (!e) { for (var j = 0; j < FINAL.length; j++) { var x = END(FINAL[j]); if (x[3](run.st, run)) { e = x; break; } } }
      run.done = true; saveRun();
      var d = data(), fresh = d.endings.indexOf(e[1]) < 0; if (fresh) d.endings.push(e[1]);
      if (d.dramaDone.indexOf(run.sc) < 0) d.dramaDone.push(run.sc);
      d.played = (d.played || 0) + 1;
      var st = run.st, ach = [];
      var got = function (k) { if (d.dramaAch.indexOf(k) < 0) { d.dramaAch.push(k); ach.push(k); } };
      got('first'); if (d.dramaDone.length >= SCEN.length) got('all6'); if (d.endings.length >= 10) got('col10'); if (d.endings.length >= ENDS.length) got('col20');
      if (SPECIAL.indexOf(e[0]) >= 0) got('special'); if (st.k >= 95) got('rich'); if (st.h >= 95) got('viral'); if (st.s <= 10 && e[0] !== 'cancel') got('zero'); if (st.n <= 10) got('ice');
      if (run.used.indexOf('lawyer') >= 0) got('lawyer'); if (run.used.indexOf('spin') >= 0) got('spin'); if (run.fol >= 1e6) got('mln'); if (run.diff === 'hard' && ['cancel', 'bankrut', 'zalamanie'].indexOf(e[0]) < 0) got('hard');
      H.save(d);
      H.submit('drama', d.endings.length, true); H.played('drama'); endsBox();
      $('#dr-ch').innerHTML = ''; $('#dr-step').textContent = 'Koniec';
      var qb = el.querySelector('[data-act="quit"]'); if (qb) qb.style.display = 'none';
      var ac = ach.map(function (k) { var a = ACH.filter(function (x) { return x[0] === k; })[0]; return '<span>' + ic('check', 12) + a[1] + '</span>'; }).join('');
      var rl = ROLE(run.role), dfn = DIFFS.filter(function (x) { return x[0] === (run.diff || 'norm'); })[0][1];
      bubble('is-end', '<div class="dr-card"><div class="dr-card-top"><span class="dr-card-av">' + AV(rl.id) + '</span><span><b>' + esc(run.nick) + '</b><small>' + rl.name + ' · ' + esc(SC(run.sc).name) + '</small></span><em class="dr-lvl is-' + (run.diff || 'norm') + '">' + dfn + '</em></div>' +
        '<div class="dr-ek">' + tile(e[0], 'end') + '</div><span class="gm-eye">Zakończenie' + (fresh ? ' · nowe!' : '') + (SPECIAL.indexOf(e[0]) >= 0 ? ' · specjalne' : '') + '</span><h2>' + e[1] + '</h2><p>' + esc(T(e[4])) + '</p>' +
        '<div class="dr-bars">' + STATS.map(function (s) { return '<div class="dr-bar-r is-' + s[0] + '"><span>' + ic(s[2], 13) + s[1] + '</span><i><b style="width:' + st[s[0]] + '%"></b></i><em>' + st[s[0]] + '</em></div>'; }).join('') + '</div>' +
        '<div class="dr-fol"><span>Obserwujący</span><b>' + fmtFol(run.fol0 || run.fol) + ' → ' + fmtFol(run.fol) + '</b></div></div>' +
        (ac ? '<div class="dr-newach"><small>Nowe osiągnięcia</small>' + ac + '</div>' : '') +
        '<p class="dr-sum">Odkryte zakończenia: <b>' + d.endings.length + '/' + ENDS.length + '</b></p><div class="gm-acts"><button type="button" class="btn btn-primary" data-act="again">Nowa afera</button><button type="button" class="btn" data-act="share">Udostępnij</button></div>', false);
      var endName = e[1], scName = SC(run.sc).name, nick = run.nick;
      el.querySelector('[data-act="share"]').onclick = function () { H.share('Drama Simulator na Śliskiej: jako ' + nick + ' wyszedłem z afery „' + scName + '” z zakończeniem „' + endName + '” 💦 (' + d.endings.length + '/' + ENDS.length + ' zakończeń)\n' + H.LINK); };
      try { localStorage.removeItem(RUN_KEY); } catch (er) { /* - */ }
    }

    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-role]'); if (b) { [].forEach.call(el.querySelectorAll('.dr-role'), function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); return; }
      b = ev.target.closest('[data-diff]'); if (b) { [].forEach.call(el.querySelectorAll('.dr-df'), function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); return; }
      b = ev.target.closest('[data-sc]'); if (b) return begin(b.dataset.sc);
      b = ev.target.closest('[data-crew]'); if (b && !b.disabled) return hire(b.dataset.crew);
      b = ev.target.closest('[data-c]'); if (b) return choose(+b.dataset.c);
      b = ev.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'again') { run = null; pick(); el.scrollIntoView ? window.scrollTo(0, 0) : 0; }
      if (b.dataset.act === 'cont') { run = loadRun(); if (run) { phone(); day(); } }
      if (b.dataset.act === 'quit') { if (confirm('Przerwać aferę? Postęp tej rozgrywki zniknie.')) { try { localStorage.removeItem(RUN_KEY); } catch (er) { /* - */ } run = null; pick(); } }
    });
    endsBox(); pick();
  }
  window.DramaSim = { mount: mount, ENDS: ENDS.length };
})();
