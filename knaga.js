/* Śliska News – Knaga, maskotka portalu. 21 wersji (strojów) jako SVG.
   Knaga.svg('ziomek') → '<svg …>' ; Knaga.list → [{ slug, name, bub }]. Rysowane w przeglądarce, bez plików graficznych. */
(function () {
  'use strict';

const INK = '#2a1620';
/* paleta skóry i główki */
const SKIN = { a: '#ffd8c2', b: '#f5b896', c: '#e09673' };          // jasny, średni, cień
const HEAD = { a: '#ffb3b3', b: '#f58c95', c: '#cf5c6b' };
const RED  = { a: '#ff5a6e', b: '#e3132e', c: '#a8001a' };
const REDH = { a: '#ff8090', b: '#ff3150', c: '#c2001e' };

function defs(id, s, h) {
  return pats(id) + `<defs>
    <linearGradient id="${id}sh" x1="0" x2="1"><stop offset="0" stop-color="${s.a}"/><stop offset=".55" stop-color="${s.b}"/><stop offset="1" stop-color="${s.c}"/></linearGradient>
    <radialGradient id="${id}hd" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${h.a}"/><stop offset=".6" stop-color="${h.b}"/><stop offset="1" stop-color="${h.c}"/></radialGradient>
    <radialGradient id="${id}bl" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="${s.a}"/><stop offset=".65" stop-color="${s.b}"/><stop offset="1" stop-color="${s.c}"/></radialGradient>
  </defs>`;
}
/* ciało: kule, trzon, główka (lekko pochylone o „tilt” stopni) */
function body(id, o) {
  o = o || {};
  const t = o.tilt || 0;
  return `<ellipse cx="150" cy="284" rx="78" ry="9" fill="#000" opacity=".12"/>
  <g transform="rotate(${t} 150 260)" stroke="${INK}" stroke-width="5.5" stroke-linejoin="round" stroke-linecap="round">
    <ellipse cx="119" cy="248" rx="33" ry="29" fill="url(#${id}bl)"/>
    <ellipse cx="181" cy="248" rx="33" ry="29" fill="url(#${id}bl)"/>
    <path d="M150 262 C150 252 150 246 150 240" stroke-width="4" opacity=".55" fill="none"/>
    ${o.hood ? `<path d="M117 236 C112 196 113 160 120 122 C116 96 122 74 134 60 C140 52 146 46 150 44 C154 46 160 52 166 60 C178 74 184 96 180 122 C187 160 188 196 183 236 C166 248 134 248 117 236 Z" fill="url(#${id}sh)"/>
      <path d="M142 50 C146 44 154 44 158 50 C155 56 145 56 142 50 Z" fill="${HEAD.b}" stroke-width="4"/>` :
    `<path d="M117 236 C112 196 113 160 120 120 L180 120 C187 160 188 196 183 236 C166 248 134 248 117 236 Z" fill="url(#${id}sh)"/><path d="M107 126 C96 120 96 98 104 82 C114 58 132 46 151 46 C171 46 189 59 197 80 C205 99 204 119 193 126 C181 134 165 126 150 128 C135 126 119 134 107 126 Z" fill="url(#${id}hd)"/>`}
  </g>
  <g transform="rotate(${t} 150 260)" fill="none" stroke-linecap="round">
    ${o.hood ? `<path d="M138 66 C144 62 156 62 162 66 M134 80 C142 75 158 75 166 80" stroke="${INK}" stroke-width="3.5" opacity=".45"/><path d="M128 100 C130 84 136 72 142 64" stroke="#fff" stroke-width="6" opacity=".55"/>` :
    `<path d="M151 48 C150 56 148 62 145 66" stroke="${INK}" stroke-width="4"/>
    <path d="M118 74 C124 62 134 55 144 53" stroke="#fff" stroke-width="7" opacity=".75"/>
    <circle cx="116" cy="88" r="4" fill="#fff" opacity=".7"/>`}
    <path d="M128 140 C125 170 125 196 128 222" stroke="#fff" stroke-width="6" opacity=".45"/>
    <path d="M101 252 C100 242 104 234 112 230" stroke="#fff" stroke-width="5" opacity=".45"/>
  </g>${o.wear ? `<g transform="rotate(${t} 150 260)">${o.wear(id)}</g>` : ''}`;
}
/* ---------- ciuszki na dole (majtki, buty, kapcie, łańcuchy) ---------- */
function pats(id) {
  return `<defs>
   <pattern id="${id}leo" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#f2b34a"/><path d="M4 5 c3 -3 7 -1 6 2 c-1 4 -6 4 -6 -2z M14 13 c3 -2 6 0 5 3 c-1 3 -5 3 -5 -3z M2 16 c2 -1 4 0 3 2z" fill="#3a2410"/><circle cx="16" cy="4" r="1.8" fill="#3a2410"/></pattern>
   <pattern id="${id}hrt" width="20" height="18" patternUnits="userSpaceOnUse"><rect width="20" height="18" fill="#fff"/><path transform="translate(10 9) scale(.42)" d="M0 10 C-14 0 -16 -10 -9 -14 C-4 -17 0 -13 0 -9 C0 -13 4 -17 9 -14 C16 -10 14 0 0 10Z" fill="#ff2d55"/></pattern>
   <pattern id="${id}dot" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="#ffb3c7"/><circle cx="7" cy="7" r="2.6" fill="#fff"/></pattern>
   <pattern id="${id}str" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)"><rect width="16" height="16" fill="#ffcf4a"/><rect width="16" height="6" fill="#d6001c"/></pattern>
   <pattern id="${id}sta" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="#7c5cff"/><path transform="translate(11 11) scale(.35)" d="M0 -14 C2 -4 4 -2 14 0 C4 2 2 4 0 14 C-2 4 -4 2 -14 0 C-4 -2 -2 -4 0 -14Z" fill="#ffe27a"/><circle cx="3" cy="4" r="1.3" fill="#fff"/></pattern>
   <pattern id="${id}chk" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#2f4f8f"/><rect width="8" height="16" fill="#3e64ad"/><rect width="16" height="8" fill="#3e64ad" opacity=".6"/><path d="M0 4 h16 M4 0 v16" stroke="#9fb6e6" stroke-width="1" opacity=".6"/></pattern>
   <pattern id="${id}jns" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="10" height="10" fill="#3a5f9a"/><path d="M0 0 v10" stroke="#5a80bd" stroke-width="3"/></pattern>
   <pattern id="${id}pl" width="40" height="20" patternUnits="userSpaceOnUse"><rect width="40" height="10" fill="#fff"/><rect y="10" width="40" height="10" fill="#dc143c"/></pattern>
   <linearGradient id="${id}lat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4d63"/><stop offset="1" stop-color="#9b0016"/></linearGradient>
  </defs>`;
}
/* ---------- garderoba v2: ubrania „owijają” kształt (przycinane do sylwetki) ---------- */
const BALLS = '<ellipse cx="119" cy="248" rx="33" ry="29"/><ellipse cx="181" cy="248" rx="33" ry="29"/>';
const SHAFT = 'M117 236 C112 196 113 160 120 120 L180 120 C187 160 188 196 183 236 C166 248 134 248 117 236 Z';
let GID = 0;
/* region = obszar ubrania (path); fill = kolor/wzór; inner = detale rysowane wewnątrz sylwetki */
function wrap(region, fill, inner, shade) {
  const k = 'kgw' + (GID++);
  return `<defs>
     <clipPath id="${k}b">${BALLS}<path d="${SHAFT}"/></clipPath>
     <clipPath id="${k}r"><path d="${region}"/></clipPath>
     <mask id="${k}L"><rect x="0" y="0" width="300" height="300" fill="#fff"/><path d="${SHAFT}" fill="#000"/><ellipse cx="181" cy="248" rx="31" ry="27" fill="#000"/></mask>
     <mask id="${k}R"><rect x="0" y="0" width="300" height="300" fill="#fff"/><path d="${SHAFT}" fill="#000"/><ellipse cx="119" cy="248" rx="31" ry="27" fill="#000"/></mask>
     <mask id="${k}S"><rect x="0" y="0" width="300" height="300" fill="#fff"/><ellipse cx="119" cy="248" rx="31" ry="27" fill="#000"/><ellipse cx="181" cy="248" rx="31" ry="27" fill="#000"/></mask>
     <linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${shade == null ? .28 : shade}"/></linearGradient>
     <linearGradient id="${k}x" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
   </defs>
   <g clip-path="url(#${k}b)">
     <path d="${region}" fill="${fill}"/>
     <g clip-path="url(#${k}r)">${inner || ''}<rect x="0" y="0" width="300" height="300" fill="url(#${k}s)"/><rect x="0" y="0" width="300" height="300" fill="url(#${k}x)"/></g>
     <path d="${region}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
   </g>
   <g clip-path="url(#${k}r)" fill="none" stroke="${INK}" stroke-width="5.5">
     <g mask="url(#${k}L)"><ellipse cx="119" cy="248" rx="33" ry="29"/></g><g mask="url(#${k}R)"><ellipse cx="181" cy="248" rx="33" ry="29"/></g>
     <g mask="url(#${k}S)"><path d="M117 236 C112 196 113 160 120 120"/><path d="M183 236 C188 196 187 160 180 120"/></g>
   </g>`;
}
/* slipy: wysoki stan, nogawki ścięte skośnie do środka, gumka z napisem */
const BRIEF = 'M40 208 C90 214 210 214 260 208 L260 228 L218 226 C200 240 172 262 150 280 C128 262 100 240 82 226 L40 228 Z';
const darkHex = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) < 110; };
function briefs(id, fill, band, opts) {
  opts = opts || {};
  if (!opts.logoColor && darkHex(band)) opts.logoColor = '#fff';
  const inner = `
    <path d="M40 206 C90 213 210 213 260 206 L260 222 C210 228 90 228 40 222 Z" fill="${band || '#fff'}"/>
    <path d="M40 222 C90 228 210 228 260 222" stroke="${INK}" stroke-width="3.5" fill="none"/>
    <path d="M40 209.5 C90 216 210 216 260 209.5" stroke="${INK}" stroke-width="1.2" stroke-dasharray="2.5 3.5" opacity=".35" fill="none"/>
    ${opts.logo === false ? '' : `<text x="150" y="224.2" text-anchor="middle" font-family="Figtree, 'Arial Black', Arial, sans-serif" font-weight="900" font-size="7.6" letter-spacing="1.6" fill="${opts.logoColor || INK}" opacity=".85">ŚLISKA</text>`}
    <path d="M88 232 C104 244 128 262 150 276 M212 232 C196 244 172 262 150 276" stroke="${opts.trim || 'rgba(255,255,255,.7)'}" stroke-width="5" fill="none"/>
    <path d="M94 238 C110 248 130 262 150 272 M206 238 C190 248 170 262 150 272" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 4" opacity=".45" fill="none"/>
    <path d="M150 228 C149 244 150 258 150 272" stroke="${INK}" stroke-width="2.5" opacity=".35" fill="none"/>
    <path d="M104 232 C112 228 122 228 130 232" stroke="#fff" stroke-width="5" opacity=".55" fill="none" stroke-linecap="round"/>
    <path d="M168 240 C176 236 186 236 192 240" stroke="#fff" stroke-width="4" opacity=".35" fill="none" stroke-linecap="round"/>
    ${opts.extra || ''}`;
  return wrap(BRIEF, fill, inner);
}
/* bokserki (dłuższe nogawki) */
function boxers(id, fill, band, stripe) {
  const R = 'M40 206 C90 213 210 213 260 206 L260 266 C230 270 200 272 176 268 L150 252 L124 268 C100 272 70 270 40 266 Z';
  const inner = `<path d="M40 206 C90 213 210 213 260 206 L260 224 C210 230 90 230 40 224 Z" fill="${band}"/><path d="M40 224 C90 230 210 230 260 224" stroke="${INK}" stroke-width="3.5" fill="none"/>
    <text x="150" y="224.6" text-anchor="middle" font-family="Figtree, 'Arial Black', Arial, sans-serif" font-weight="900" font-size="7.6" letter-spacing="1.6" fill="${INK}" opacity=".85">ŚLISKA</text>
    ${stripe ? `<path d="M88 232 L86 270 M212 232 L214 270" stroke="${stripe}" stroke-width="7"/>` : ''}
    <path d="M150 230 V252" stroke="${INK}" stroke-width="3" opacity=".4"/><path d="M124 268 L150 252 L176 268" stroke="${INK}" stroke-width="3" fill="none" opacity=".5"/>
    <path d="M96 240 C104 236 114 236 122 240 M180 240 C188 236 198 236 206 240" stroke="#fff" stroke-width="4" opacity=".4" fill="none" stroke-linecap="round"/>`;
  return wrap(R, fill, inner);
}
/* ręcznik owinięty w pasie, z zakładką */
function towel(id) {
  const R = 'M40 206 C90 200 210 200 260 206 L260 262 C230 268 200 262 176 266 C160 270 140 270 124 266 C100 262 70 268 40 262 Z';
  const inner = `${[220, 238, 254].map(y => `<path d="M40 ${y} C90 ${y - 6} 210 ${y - 6} 260 ${y}" stroke="#7cc8f5" stroke-width="${y === 238 ? 7 : 4}" fill="none"/>`).join('')}
    ${Array.from({ length: 70 }, (_, i) => `<circle cx="${86 + (i * 37) % 128}" cy="${208 + (i * 23) % 58}" r="1.2" fill="#c9dbe6"/>`).join('')}
    <path d="M172 206 C182 204 194 206 200 210 C198 222 192 230 184 234 C180 226 176 216 172 206 Z" fill="#eef6fb" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M178 212 C184 214 190 214 194 212" stroke="#7cc8f5" stroke-width="3" fill="none"/>
    <path d="M96 214 C110 210 124 210 134 212" stroke="#fff" stroke-width="5" opacity=".9" fill="none" stroke-linecap="round"/>`;
  return wrap(R, '#fbfdff', inner, .18);
}
/* satynowy szlafrok: dekolt V, wyłogi, pasek z kokardą, rąbek nad kulami */
function robe(id) {
  const R = 'M40 150 L122 150 L150 206 L178 150 L260 150 L260 262 C220 258 190 266 150 262 C110 266 80 258 40 262 Z';
  const inner = `<path d="M118 150 L150 210 L182 150" stroke="#ffd6e4" stroke-width="12" fill="none" stroke-linejoin="round"/><path d="M118 150 L150 210 L182 150" stroke="${INK}" stroke-width="3" fill="none" opacity=".5" transform="translate(0 7)"/>
    <path d="M40 222 C90 216 210 216 260 222 L260 234 C210 228 90 228 40 234 Z" fill="#b0124a"/><path d="M40 222 C90 216 210 216 260 222 M40 234 C90 228 210 228 260 234" stroke="${INK}" stroke-width="3" fill="none"/>
    <path d="M40 254 C80 250 110 258 150 254 C190 258 220 250 260 254" stroke="#ffd6e4" stroke-width="6" fill="none"/>
    <path d="M128 170 C126 196 128 230 132 258 M172 170 C174 196 172 230 168 258" stroke="#fff" stroke-width="5" opacity=".28" fill="none" stroke-linecap="round"/>
    <path d="M140 214 C138 236 142 250 140 262" stroke="${INK}" stroke-width="2" opacity=".25" fill="none"/>`;
  return wrap(R, '#e0457b', inner) +
    `<g stroke="${INK}" stroke-width="4" stroke-linejoin="round"><path d="M158 226 C170 214 184 216 182 228 C180 238 166 234 158 226Z" fill="#c2185b"/><path d="M158 226 C146 214 132 216 134 228 C136 238 150 234 158 226Z" fill="#c2185b"/><path d="M156 230 C152 246 146 258 140 268 L148 270 C154 258 158 246 160 230Z" fill="#b0124a"/><path d="M160 230 C164 246 172 256 180 264 L186 258 C178 250 170 242 164 228Z" fill="#b0124a"/><circle cx="158" cy="227" r="6" fill="#e0457b"/></g>`;
}
/* prochowiec: kołnierz, dwurzędowe guziki, pasek z klamrą, kieszenie */
function coat(id) {
  const R = 'M40 168 C80 172 112 176 150 200 C188 176 220 172 260 168 L260 264 C220 270 190 268 150 264 C110 268 80 270 40 264 Z';
  const inner = `<path d="M108 170 L150 206 L134 214 L104 190 Z M192 170 L150 206 L166 214 L196 190 Z" fill="#b98d55" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M150 206 V264" stroke="${INK}" stroke-width="3" opacity=".5"/>
    ${[[138, 222], [162, 222], [138, 244], [162, 244]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.2" fill="#3b2a1a" stroke="${INK}" stroke-width="2"/>`).join('')}
    <path d="M40 230 C90 226 210 226 260 230 L260 240 C210 236 90 236 40 240 Z" fill="#a37a45"/><path d="M40 230 C90 226 210 226 260 230 M40 240 C90 236 210 236 260 240" stroke="${INK}" stroke-width="2.5" fill="none"/>
    <rect x="166" y="226" width="16" height="13" rx="2" fill="none" stroke="#3b2a1a" stroke-width="3.5"/>
    <path d="M100 248 h20 M180 248 h20" stroke="${INK}" stroke-width="3" opacity=".6"/>
    <path d="M124 182 C120 200 120 222 122 260" stroke="#fff" stroke-width="5" opacity=".25" fill="none" stroke-linecap="round"/>`;
  return wrap(R, '#c9a067', inner);
}
/* sneakersy 3/4: czubek, język, sznurówki, pasek boczny, podeszwa z bieżnikiem */
function shoes(up, sole, lace, stripe) {
  const one = (x, f) => `<g transform="translate(${x} 0) scale(${f} 1)">
    <path d="M-34 262 C-34 252 -26 246 -16 246 L6 246 C12 246 16 250 22 254 C30 258 40 260 42 268 L42 274 L-34 274 Z" fill="${up}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-12 247 C-12 240 6 240 6 247" fill="${up}" stroke="${INK}" stroke-width="4"/>
    <path d="M-8 252 L4 258 M4 252 L-8 258 M-2 256 L10 262 M10 256 L-2 262" stroke="${lace || INK}" stroke-width="3" stroke-linecap="round"/>
    ${stripe ? `<path d="M-30 266 C-14 262 4 262 20 254" stroke="${stripe}" stroke-width="5" fill="none" stroke-linecap="round"/>` : ''}
    <path d="M24 262 C30 262 36 264 38 268" stroke="#fff" stroke-width="3" opacity=".6" fill="none" stroke-linecap="round"/>
    <rect x="-37" y="272" width="82" height="11" rx="5.5" fill="${sole}" stroke="${INK}" stroke-width="5"/>
    <path d="M-28 280 h6 M-16 280 h6 M-4 280 h6 M8 280 h6 M20 280 h6 M32 280 h6" stroke="${INK}" stroke-width="2" opacity=".4"/>
    <path d="M-34 258 h8" stroke="${INK}" stroke-width="3" opacity=".5"/></g>`;
  return one(112, -1) + one(188, 1);
}
/* puchate kapcie z pomponem */
const slippers = c => [[112, -1], [188, 1]].map(([x, f]) => `<g transform="translate(${x} 0) scale(${f} 1)">
  <path d="M-36 270 C-36 256 -20 250 0 250 C20 250 40 256 40 270 C40 282 -36 282 -36 270Z" fill="${c}" stroke="${INK}" stroke-width="5"/>
  ${[-30, -20, -10, 0, 10, 20, 30].map(d => `<circle cx="${d}" cy="${254 - Math.cos(d / 30) * 2}" r="7.5" fill="${c}"/>`).join('')}
  ${[-24, -12, 0, 12, 24].map(d => `<path d="M${d} 262 l-3 6 M${d + 5} 264 l-2 6" stroke="#e6c7d2" stroke-width="2" stroke-linecap="round"/>`).join('')}
  <circle cx="28" cy="256" r="9" fill="#ff7aa2" stroke="${INK}" stroke-width="3.5"/><circle cx="25" cy="253" r="3" fill="#fff" opacity=".7"/></g>`).join('');
/* kowbojki: cholewka z przeszyciem, obcas, ostroga z kółkiem */
const boots = c => [[112, -1], [188, 1]].map(([x, f]) => `<g transform="translate(${x} 0) scale(${f} 1)">
  <path d="M-28 236 L-26 266 L-30 276 L40 276 C42 266 34 262 24 258 L14 252 L14 236 Z" fill="${c}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  <path d="M-28 236 C-18 242 4 242 14 236" fill="none" stroke="${INK}" stroke-width="4"/><path d="M-26 244 h38" stroke="#e9c27a" stroke-width="3" stroke-dasharray="4 3"/>
  <path d="M-18 252 C-10 246 -4 258 4 250 C10 244 12 256 6 262" stroke="#e9c27a" stroke-width="2.5" fill="none"/>
  <rect x="-32" y="274" width="74" height="9" rx="3" fill="#3a2410" stroke="${INK}" stroke-width="4"/><rect x="-32" y="272" width="16" height="13" rx="2" fill="#3a2410" stroke="${INK}" stroke-width="4"/>
  <path d="M-32 266 h-10" stroke="#c9c9c9" stroke-width="3.5"/><g transform="translate(-46 266)"><circle r="7" fill="#e9e9e9" stroke="${INK}" stroke-width="2.5"/>${[0, 45, 90, 135].map(r => `<path d="M-7 0 h14" stroke="${INK}" stroke-width="1.6" transform="rotate(${r})"/>`).join('')}</g></g>`).join('');
const chain = `<path d="M90 238 C104 262 134 262 146 246 M154 246 C166 262 196 262 210 238" stroke="#ffcf4a" stroke-width="6" fill="none" stroke-dasharray="1 8" stroke-linecap="round"/>`;
/* rączki: ramię z obrysem + rękawiczka */
function arm(x1, y1, cx, cy, x2, y2, fill) {
  return `<path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" stroke="${INK}" stroke-width="15" fill="none" stroke-linecap="round"/>
          <path d="M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}" stroke="${fill}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
}
const glove = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0})" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round">
  <ellipse cx="0" cy="0" rx="${r}" ry="${r * .9}" fill="#fff"/><ellipse cx="${-r * .8}" cy="${-r * .35}" rx="${r * .38}" ry="${r * .5}" fill="#fff"/>
  <path d="M${-r * .2} ${r * .2} h${r * .7} M${-r * .1} ${-r * .25} h${r * .6}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/></g>`;
const thumb = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s || 1})" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round" fill="#fff">
  <rect x="-14" y="-6" width="26" height="24" rx="9"/><path d="M-6 -6 C-8 -20 -4 -28 2 -28 C8 -28 8 -18 6 -6 Z"/><path d="M-12 4 h22 M-12 11 h22" stroke-width="3" fill="none" opacity=".5"/></g>`;
/* twarze */
function eyes(type, dy) {
  dy = dy || 0; const y = 166 + dy;
  if (type === 'wink') return `<ellipse cx="134" cy="${y}" rx="11" ry="13" fill="#fff" stroke="${INK}" stroke-width="4.5"/><circle cx="137" cy="${y + 2}" r="6" fill="${INK}"/><circle cx="139.5" cy="${y - 1}" r="2.2" fill="#fff"/>
    <path d="M156 ${y + 2} q10 -10 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M122 ${y - 20} q12 -8 24 -2" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M156 ${y - 16} q10 -6 22 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (type === 'big') return `<ellipse cx="134" cy="${y}" rx="13" ry="16" fill="#fff" stroke="${INK}" stroke-width="4.5"/><ellipse cx="166" cy="${y}" rx="13" ry="16" fill="#fff" stroke="${INK}" stroke-width="4.5"/>
    <circle cx="137" cy="${y + 3}" r="7.5" fill="${INK}"/><circle cx="169" cy="${y + 3}" r="7.5" fill="${INK}"/><circle cx="140" cy="${y - 1}" r="2.8" fill="#fff"/><circle cx="172" cy="${y - 1}" r="2.8" fill="#fff"/><circle cx="134" cy="${y + 7}" r="1.4" fill="#fff"/><circle cx="166" cy="${y + 7}" r="1.4" fill="#fff"/>
    <path d="M120 ${y - 24} q12 -9 26 -3" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M154 ${y - 27} q14 -6 26 3" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (type === 'sly') return `<path d="M122 ${y} q12 -10 24 0 q-12 8 -24 0z" fill="#fff" stroke="${INK}" stroke-width="4.5"/><path d="M155 ${y} q12 -10 24 0 q-12 8 -24 0z" fill="#fff" stroke="${INK}" stroke-width="4.5"/>
    <circle cx="137" cy="${y - 1}" r="4.5" fill="${INK}"/><circle cx="170" cy="${y - 1}" r="4.5" fill="${INK}"/>
    <path d="M120 ${y - 13} l26 5" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M180 ${y - 13} l-26 5" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  if (type === 'shy') return `<path d="M124 ${y + 4} q10 -9 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M156 ${y + 4} q10 -9 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M124 ${y - 14} q10 4 20 0 M156 ${y - 14} q10 4 20 0" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".7"/>`;
  if (type === 'angry') return `<ellipse cx="134" cy="${y + 2}" rx="11" ry="11" fill="#fff" stroke="${INK}" stroke-width="4.5"/><ellipse cx="166" cy="${y + 2}" rx="11" ry="11" fill="#fff" stroke="${INK}" stroke-width="4.5"/><circle cx="136" cy="${y + 4}" r="5.5" fill="${INK}"/><circle cx="164" cy="${y + 4}" r="5.5" fill="${INK}"/><path d="M120 ${y - 16} l28 10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M180 ${y - 16} l-28 10" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  if (type === 'hearts') return [134, 166].map(x => `<path transform="translate(${x} ${y})" d="M0 10 C-14 0 -16 -10 -9 -14 C-4 -17 0 -13 0 -9 C0 -13 4 -17 9 -14 C16 -10 14 0 0 10Z" fill="#ff2d55" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`).join('') + `<path d="M120 ${y - 24} q12 -8 26 -2 M154 ${y - 26} q14 -6 26 2" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (type === 'flirt') return `<path d="M122 ${y + 2} q12 -12 24 0" fill="#fff" stroke="${INK}" stroke-width="4.5"/><path d="M155 ${y + 2} q12 -12 24 0" fill="#fff" stroke="${INK}" stroke-width="4.5"/><path d="M122 ${y + 2} h24 M155 ${y + 2} h24" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><circle cx="138" cy="${y - 2}" r="4" fill="${INK}"/><circle cx="171" cy="${y - 2}" r="4" fill="${INK}"/><path d="M120 ${y - 18} q12 -10 26 -2" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M156 ${y - 12} q12 -2 24 -8" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M118 ${y + 4} l-6 3 M181 ${y + 4} l6 3" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (type === 'happy') return `<path d="M124 ${y + 2} q10 -13 20 0" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round"/><path d="M156 ${y + 2} q10 -13 20 0" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  return '';
}
const blush = (dy) => `<ellipse cx="121" cy="${186 + (dy || 0)}" rx="10" ry="6" fill="#ff5f7e" opacity=".45"/><ellipse cx="179" cy="${186 + (dy || 0)}" rx="10" ry="6" fill="#ff5f7e" opacity=".45"/>`;
function mouth(type, dy) {
  dy = dy || 0; const y = 194 + dy;
  if (type === 'tongue') return `<path d="M134 ${y} q16 18 32 0 z" fill="#5a1024" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M144 ${y + 9} q8 10 14 0 q-6 -4 -14 0z" fill="#ff6f8f"/>`;
  if (type === 'smirk') return `<path d="M136 ${y} q16 10 30 -6" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M163 ${y - 8} l6 2" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  if (type === 'grin') return `<path d="M130 ${y - 2} q20 22 40 0 z" fill="#fff" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M134 ${y + 1} h32" stroke="${INK}" stroke-width="2.5" opacity=".4"/>`;
  if (type === 'bite') return `<path d="M136 ${y} q16 12 30 -2" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M146 ${y + 4} l3 5 l3 -4" fill="#fff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  if (type === 'frown') return `<path d="M136 ${y + 8} q14 -12 28 0" stroke="${INK}" stroke-width="5.5" fill="none" stroke-linecap="round"/>`;
  if (type === 'shy') return `<path d="M142 ${y + 2} q8 5 16 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  if (type === 'o') return `<ellipse cx="150" cy="${y + 2}" rx="8" ry="9" fill="#5a1024" stroke="${INK}" stroke-width="4.5"/>`;
  return '';
}
const drop = (x, y, s) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -16 C7 -5 12 2 12 8 A12 12 0 0 1 -12 8 C-12 2 -7 -5 0 -16 Z" fill="#59c8ff" stroke="${INK}" stroke-width="${4 / s}"/><path transform="translate(${x} ${y}) scale(${s})" d="M-5 6 q0 -5 3 -8" stroke="#fff" stroke-width="${3 / s}" fill="none" stroke-linecap="round"/>`;
const sparkle = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -14 C2 -4 4 -2 14 0 C4 2 2 4 0 14 C-2 4 -4 2 -14 0 C-4 -2 -2 -4 0 -14Z" fill="${c || '#d6001c'}"/>`;

const V = [
 { n: 'Ziomek', bg: 'radial-gradient(120% 90% at 30% 20%,#fff6ef,#ffd9c4)', d: 'Główna, „domyślna” Knaga: macha na powitanie, puszcza oko, unosi kciuk. Ciepła, pewna siebie, z błyskiem – dobra do dymków i powitań.', bub: 'Siema, mokro dziś!',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 170, 92, 150, 80, 112, SKIN.b) + arm(182, 172, 214, 176, 226, 150, SKIN.b) + body(id, { wear: id => boxers(id, '#1b1b22', '#d6001c', '#d6001c'),  tilt: -3 }) + `<g transform="rotate(-3 150 260)">` + eyes('wink') + mouth('smirk') + blush() + `</g>` + glove(78, 106, 15, -20) + thumb(228, 146, 1) + sparkle(250, 70, 1) + sparkle(54, 210, .55, '#ffb000') },
 { n: 'Śliska', bg: 'radial-gradient(120% 90% at 30% 20%,#ffe8ec,#ffb9c4)', d: 'W kolorze marki, błyszcząca i cała mokra – kapie z niej, a ona się z tego cieszy. Język na wierzchu, oczy jak spodki. Najbardziej „Śliska News”.', bub: 'Ale się poślizgnęłam!',
   svg: id => defs(id, RED, REDH) + arm(118, 170, 90, 182, 74, 168, RED.b) + arm(182, 170, 210, 182, 226, 168, RED.b) + body(id, { wear: id => briefs(id, `url(#${id}lat)`, '#ff8090', { extra: `<path d="M104 252 C110 244 118 240 128 240" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>` }),  tilt: 0 }) + eyes('big', -2) + mouth('tongue', 0) + blush() + glove(70, 164, 15, 30) + glove(230, 164, 15, -30 + 180) + drop(150, 22, 1) + drop(214, 96, .8) + drop(86, 118, .7) + drop(236, 236, .9) + drop(64, 250, .75) },
 { n: 'Redaktor', bg: 'radial-gradient(120% 90% at 30% 20%,#f4f5f7,#d9dde4)', d: 'Okulary na nosie, gazeta „Śliska News” pod pachą, ołówek za uchem. Knaga, która „pisze” newsy – idealna do Studia, powiadomień i stopki.', bub: 'Mam gorący temat…',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 172, 96, 196, 104, 214, SKIN.b) + arm(182, 172, 212, 160, 222, 132, SKIN.b) + body(id, { wear: id => boxers(id, `url(#${id}chk)`, '#fff'),  tilt: 2 }) +
     `<g transform="rotate(2 150 260)"><circle cx="134" cy="166" r="15" fill="rgba(255,255,255,.35)" stroke="${INK}" stroke-width="4.5"/><circle cx="166" cy="166" r="15" fill="rgba(255,255,255,.35)" stroke="${INK}" stroke-width="4.5"/><path d="M149 164 h2" stroke="${INK}" stroke-width="4.5"/>` + eyes('happy') + mouth('smirk', 2) + blush(2) +
     `<g transform="translate(196 92) rotate(32)"><rect x="-4" y="-26" width="8" height="40" rx="2" fill="#ffc94a" stroke="${INK}" stroke-width="3.5"/><path d="M-4 14 L0 24 L4 14 Z" fill="#f5d3a8" stroke="${INK}" stroke-width="3"/></g></g>` +
     `<g transform="translate(66 196) rotate(-12)" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"><rect x="0" y="0" width="64" height="48" rx="5" fill="#fff"/><rect x="6" y="6" width="52" height="9" rx="2" fill="#d6001c" stroke="none"/><path d="M8 24 h22 M8 31 h22 M8 38 h18" stroke-width="3" opacity=".5"/><rect x="36" y="21" width="20" height="19" rx="2" fill="#ffd0c0" stroke-width="3"/></g>` + glove(104, 214, 14, 10) + glove(222, 128, 14, -30) },
 { n: 'Gwiazdor', bg: 'radial-gradient(120% 90% at 30% 20%,#3a2a4f,#130d1c)', d: 'Okulary, złoty łańcuch z gwiazdką Śliskiej i mikrofon w dłoni. Pewna siebie gwiazda sceny – do rankingów, dram i Drama Simulatora.', bub: 'Zero wtop od 3 dni.',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 172, 92, 184, 84, 154, SKIN.b) + arm(182, 172, 214, 196, 232, 186, SKIN.b) + body(id, { wear: id => briefs(id, '#15101c', '#ffcf4a', { logo: false, extra: `<path transform="translate(150 240) scale(.7)" d="M0 -14 l4 9 l10 1 l-8 7 l3 10 l-9 -5 l-9 5 l3 -10 l-8 -7 l10 -1z" fill="#ffcf4a"/>` }),  tilt: -4 }) +
     `<g transform="rotate(-4 150 260)"><path d="M116 156 h32 q4 0 4 4 v6 q0 14 -16 14 h-6 q-14 0 -14 -14 v-6 q0 -4 0 -4z M152 156 h32 q4 0 4 4 v6 q0 14 -16 14 h-6 q-14 0 -14 -14 v-6 q0 -4 0 -4z" fill="#15101c" stroke="#ffcf4a" stroke-width="3.5"/><path d="M122 162 l12 0" stroke="#fff" stroke-width="3" opacity=".75" stroke-linecap="round"/>` + mouth('grin', 4) +
     `<path d="M116 214 C130 236 170 236 184 214" stroke="#ffcf4a" stroke-width="7" fill="none" stroke-dasharray="1 8" stroke-linecap="round"/><path d="M150 226 l5 10 l11 1 l-8 7 l3 11 l-11 -6 l-11 6 l3 -11 l-8 -7 l11 -1z" fill="#ffcf4a" stroke="${INK}" stroke-width="2.5"/></g>` +
     `<g transform="translate(82 140) rotate(-24)"><rect x="-5" y="0" width="10" height="34" rx="4" fill="#3b3446" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-4" r="13" fill="#9aa3b2" stroke="${INK}" stroke-width="4.5"/><path d="M-8 -8 h16 M-9 -2 h18" stroke="${INK}" stroke-width="2" opacity=".5"/></g>` + glove(84, 160, 14, 0) + glove(234, 188, 14, 160) + sparkle(242, 62, 1, '#ffcf4a') + sparkle(60, 70, .6, '#ffcf4a') },
 { n: 'Ikona', bg: 'linear-gradient(160deg,#ffffff,#f1eef3)', d: 'Uproszczony znak do małych rozmiarów: jeden kolor, zero obrysów, gwiazdka Śliskiej. Na odznaki, ikonki gier, favicon strefy gier.', bub: 'Psst…',
   svg: id => `<g transform="rotate(-8 150 160)"><ellipse cx="119" cy="242" rx="34" ry="30" fill="#d6001c"/><ellipse cx="181" cy="242" rx="34" ry="30" fill="#d6001c"/><path d="M117 236 C112 196 113 160 120 118 L180 118 C187 160 188 196 183 236 Z" fill="#d6001c"/><path d="M105 124 C94 118 94 96 102 80 C112 56 132 44 151 44 C171 44 190 57 198 78 C206 97 205 118 194 124 C182 132 165 124 150 126 C135 124 118 132 105 124 Z" fill="#a8001a"/><path d="M120 72 C126 60 136 53 146 51" stroke="#fff" stroke-width="7" opacity=".5" fill="none" stroke-linecap="round"/><circle cx="136" cy="168" r="9" fill="#fff"/><circle cx="166" cy="168" r="9" fill="#fff"/><path d="M137 190 q14 10 28 0" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/></g>` + sparkle(238, 62, 1.3) },
 { n: 'Surfer (gry)', bg: 'linear-gradient(180deg,#bfe7ff 0%,#7cc8f5 62%,#2f8fd8 100%)', d: 'Na desce, w goglach, w środku fali – bohater Ślizgawki, Łap Krople i Knagi Flappy. Ta sama postać co główna, tylko w trybie gry.', bub: 'Jedziemy!',
   svg: id => defs(id, SKIN, HEAD) + `<path d="M0 262 C40 244 70 276 110 258 C150 240 180 276 220 258 C250 246 280 262 300 252 L300 300 L0 300Z" fill="#fff" opacity=".55"/>` +
     `<g transform="rotate(-12 150 250)"><path d="M48 276 C90 262 210 262 254 276 C210 292 90 292 48 276 Z" fill="#ffcf4a" stroke="${INK}" stroke-width="5"/><path d="M60 276 H240" stroke="#d6001c" stroke-width="6"/></g>` +
     arm(118, 170, 86, 160, 66, 136, SKIN.b) + arm(182, 170, 214, 160, 236, 132, SKIN.b) + `<g transform="translate(0 -14)">` + body(id, { wear: id => boxers(id, `url(#${id}str)`, '#d6001c'),  tilt: -8 }) + `<g transform="rotate(-8 150 260)"><rect x="110" y="140" width="80" height="16" rx="8" fill="#2a1620"/><circle cx="134" cy="164" r="16" fill="#9be7ff" stroke="${INK}" stroke-width="5"/><circle cx="166" cy="164" r="16" fill="#9be7ff" stroke="${INK}" stroke-width="5"/><circle cx="137" cy="166" r="5.5" fill="${INK}"/><circle cx="169" cy="166" r="5.5" fill="${INK}"/><path d="M127 158 l6 -4 M159 158 l6 -4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>` + mouth('grin', 4) + `</g></g>` + glove(64, 130, 14, -30) + glove(238, 126, 14, 210) + drop(40, 222, .8) + drop(262, 210, .7) + drop(100, 236, .55) },

 { n: 'Nieśmiała', bg: 'radial-gradient(120% 90% at 30% 20%,#fff3f6,#ffd3dc)', d: 'Jeszcze „schowana” – zawstydzona, zasłania się rączkami. Pokazuje się nowym osobom, dopóki nie przeczytają pierwszego artykułu; potem odsłania się i zostaje Ziomkiem.', bub: 'Przeczytaj coś, to się pokażę…',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 112, 196, 128, 198, SKIN.b) + arm(182, 176, 188, 196, 172, 198, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}dot)`, '#ff7aa2'),  tilt: 4, hood: true }) + `<g transform="rotate(4 150 260)">` + eyes('shy') + mouth('shy', 0) + `<ellipse cx="121" cy="184" rx="13" ry="8" fill="#ff5f7e" opacity=".6"/><ellipse cx="179" cy="184" rx="13" ry="8" fill="#ff5f7e" opacity=".6"/><path d="M114 178 l6 -4 M120 182 l6 -4 M174 178 l6 -4 M180 182 l6 -4" stroke="#ff2d55" stroke-width="2.5" stroke-linecap="round"/></g>` + glove(130, 200, 13, 20) + glove(170, 200, 13, 160) + `<text x="226" y="96" font-size="34" font-weight="900" fill="#ff2d55" font-family="Arial">?</text><text x="64" y="120" font-size="24" font-weight="900" fill="#ff2d55" opacity=".7" font-family="Arial">!</text>` },
 { n: 'Wściekła (drama)', bg: 'radial-gradient(120% 90% at 30% 20%,#ffe3d6,#ff9a7a)', d: 'Czerwona ze złości, para z uszu, zaciśnięte pięści. Wyskakuje przy dramach, „Alarmie” i rekordach komentarzy.', bub: 'CO ON ZNOWU ZROBIŁ?!',
   svg: id => defs(id, { a: '#ffb39a', b: '#f2876a', c: '#c95b45' }, { a: '#ff8a8a', b: '#ef4a5a', c: '#b81d33' }) + arm(118, 178, 96, 196, 92, 216, '#f2876a') + arm(182, 178, 204, 196, 208, 216, '#f2876a') + body(id, { wear: id => boxers(id, '#d6001c', '#fff', '#fff'),  tilt: 0 }) + eyes('angry') + mouth('frown', 0) + glove(92, 218, 14, 90) + glove(208, 218, 14, 90) +
     `<g fill="#fff" stroke="${INK}" stroke-width="4"><path d="M82 84 c-10 -6 -6 -18 4 -16 c0 -10 14 -10 14 0 c10 -2 12 10 4 14 z"/><path d="M218 84 c-10 -6 -6 -18 4 -16 c0 -10 14 -10 14 0 c10 -2 12 10 4 14 z"/></g><path d="M236 40 l-6 14 h10 l-8 16" stroke="#d6001c" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 40 l6 14 h-10 l8 16" stroke="#d6001c" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` },
 { n: 'Zakochana', bg: 'radial-gradient(120% 90% at 30% 20%,#fff0f6,#ffc6dc)', d: 'Serduszka w oczach, przytula ogromne serce. Na reakcje „💖”, Walentynki i ulubione artykuły czytelnika.', bub: 'Kocham ten news.',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 178, 104, 200, 116, 214, SKIN.b) + arm(182, 178, 196, 200, 184, 214, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}hrt)`, '#ff2d55'),  tilt: -2 }) + `<g transform="rotate(-2 150 260)">` + eyes('hearts') + mouth('grin', 2) + blush(2) + `</g>` +
     `<path transform="translate(150 222)" d="M0 26 C-34 6 -40 -16 -24 -26 C-12 -33 0 -24 0 -14 C0 -24 12 -33 24 -26 C40 -16 34 6 0 26Z" fill="#ff2d55" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path transform="translate(150 222)" d="M-22 -16 c4 -6 10 -7 14 -4" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>` + glove(118, 214, 13, 30) + glove(182, 214, 13, 150) +
     [[70, 80, .8], [238, 66, 1], [246, 150, .6], [56, 170, .55]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 10 C-14 0 -16 -10 -9 -14 C-4 -17 0 -13 0 -9 C0 -13 4 -17 9 -14 C16 -10 14 0 0 10Z" fill="#ff5f8a"/>`).join('') },
 { n: 'Diabełek (kontrowersje)', bg: 'radial-gradient(120% 90% at 30% 20%,#3b1020,#120509)', d: 'Rogi, ogonek, widły i cwany uśmiech. Patron kontrowersyjnych tematów, „Prowokacji Dnia” i nocnych plotek.', bub: 'Napiszmy coś mocnego…',
   svg: id => defs(id, SKIN, HEAD) + `<path d="M196 250 C236 250 250 220 236 198 C248 194 254 186 252 176" stroke="${INK}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M196 250 C236 250 250 220 236 198 C248 194 254 186 252 176" stroke="#d6001c" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M252 162 l12 16 l-20 2 z" fill="#d6001c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
     arm(118, 176, 96, 168, 84, 146, SKIN.b) + arm(182, 176, 206, 190, 218, 204, SKIN.b) + body(id, { wear: id => briefs(id, '#b8001b', '#2a1620', { extra: `<path d="M140 240 l10 -8 l10 8" stroke="#2a1620" stroke-width="4" fill="none" stroke-linejoin="round"/>` }),  tilt: -3 }) +
     `<g transform="rotate(-3 150 260)"><path d="M112 82 C100 64 104 46 112 38 C114 54 122 64 132 66 Z" fill="#d6001c" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M188 82 C200 64 196 46 188 38 C186 54 178 64 168 66 Z" fill="#d6001c" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` + eyes('sly') + mouth('smirk') + blush() + `</g>` +
     `<g transform="translate(80 150) rotate(-14)"><rect x="-3.5" y="-6" width="7" height="110" rx="3" fill="#3b3446" stroke="${INK}" stroke-width="3.5"/><path d="M-16 -6 v-18 M0 -6 v-24 M16 -6 v-18 M-16 -6 h32" stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none"/></g>` + glove(84, 146, 14, -10) + glove(218, 206, 14, 120) },
 { n: 'Imprezowa', bg: 'radial-gradient(120% 90% at 30% 20%,#fff8d6,#ffd36b)', d: 'Czapeczka, trąbka, konfetti. Na nowy poziom, wygrane w grach, urodziny konta i „Śliskie Podsumowanie miesiąca”.', bub: 'Nowy poziom! 🎉',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 92, 160, 78, 128, SKIN.b) + arm(182, 176, 208, 160, 222, 128, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}sta)`, '#ffcf4a'),  tilt: 3 }) +
     `<g transform="rotate(3 150 260)"><path d="M132 52 L160 2 L176 54 Z" fill="#7c5cff" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M140 40 l26 -4 M146 26 l18 -3" stroke="#ffcf4a" stroke-width="5" stroke-linecap="round"/><circle cx="160" cy="2" r="8" fill="#ff2d55" stroke="${INK}" stroke-width="4"/>` + eyes('happy') + mouth('tongue', 2) + blush(2) + `</g>` + glove(78, 124, 14, -20) + glove(222, 124, 14, 200) +
     [['#ff2d55', 60, 60, 20], ['#4cc3ff', 236, 52, -30], ['#7c5cff', 250, 120, 40], ['#16a34a', 46, 130, -10], ['#ff2d55', 230, 210, 60], ['#ffcf4a', 64, 214, 20], ['#4cc3ff', 108, 30, 70]].map(([c, x, y, r]) => `<rect x="${x}" y="${y}" width="14" height="7" rx="2" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`).join('') },
 { n: 'Detektyw (plotki)', bg: 'radial-gradient(120% 90% at 30% 20%,#eef0e6,#c9c6a8)', d: 'Kapelusz, prochowiec i lupa. Węszy plotki – do „Zgłoś temat”, przecieków i Śliskiego Detektora Ściemy.', bub: 'Coś tu śmierdzi…',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 96, 190, 104, 210, '#b9925a') + arm(182, 176, 214, 168, 220, 138, '#b9925a') + body(id, { wear: id => coat(id),  tilt: 0 }) +
     `<path d="M92 92 C92 80 208 80 208 92 C208 100 92 100 92 92Z" fill="#6b5233" stroke="${INK}" stroke-width="5"/><path d="M114 88 C114 54 186 54 186 88 Z" fill="#7d6040" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M116 80 h68" stroke="#2a1620" stroke-width="7"/>` + eyes('sly', 0) + mouth('smirk') +
     `<g transform="translate(232 112)"><circle r="22" fill="rgba(180,230,255,.45)" stroke="${INK}" stroke-width="6"/><path d="M-10 -8 a12 12 0 0 1 10 -6" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-14 18 L-30 40" stroke="${INK}" stroke-width="10" stroke-linecap="round"/></g>` + glove(220, 140, 14, -40) + glove(104, 210, 13, 30) },

 { n: 'Uwodziciel', bg: 'radial-gradient(120% 90% at 30% 20%,#3a0b1c,#12040a)', d: 'Muszka, mankiety, uwodzicielskie spojrzenie spod brwi i ślady szminki. Pojawia się wieczorem i przy tekstach o romansach gwiazd.', bub: 'Czytasz mnie jak otwartą księgę…',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 92, 186, 100, 210, SKIN.b) + arm(182, 176, 210, 160, 222, 132, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}leo)`, '#15101c'),  tilt: -6 }) + `<g transform="rotate(-6 150 260)">` + eyes('flirt') + mouth('bite') + blush() +
     `<path d="M128 214 l-18 -10 v20 z M172 214 l18 -10 v20 z" fill="#15101c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><circle cx="150" cy="214" r="7" fill="#15101c" stroke="${INK}" stroke-width="4"/>` + `<g transform="translate(170 168) rotate(-20)" opacity="1"><path d="M-12 0 C-8 -9 -2 -8 0 -4 C2 -8 8 -9 12 0 C6 2 -6 2 -12 0Z" fill="#e3002a"/><path d="M-12 0 C-6 9 6 9 12 0 C6 2 -6 2 -12 0Z" fill="#c4001f"/></g><g transform="translate(126 214) rotate(15)" opacity="0.85"><path d="M-12 0 C-8 -9 -2 -8 0 -4 C2 -8 8 -9 12 0 C6 2 -6 2 -12 0Z" fill="#e3002a"/><path d="M-12 0 C-6 9 6 9 12 0 C6 2 -6 2 -12 0Z" fill="#c4001f"/></g><g transform="translate(176 236) rotate(-10)" opacity="0.8"><path d="M-12 0 C-8 -9 -2 -8 0 -4 C2 -8 8 -9 12 0 C6 2 -6 2 -12 0Z" fill="#e3002a"/><path d="M-12 0 C-6 9 6 9 12 0 C6 2 -6 2 -12 0Z" fill="#c4001f"/></g>` + `</g>` +
     `<rect x="92" y="212" width="18" height="9" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5"/><rect x="214" y="138" width="18" height="9" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5" transform="rotate(-30 223 142)"/>` + glove(100, 210, 13, 60) + glove(224, 128, 13, -40) + `<path d="M232 60 q8 -14 18 -4 q10 -10 18 4 q-6 14 -18 20 q-12 -6 -18 -20z" fill="#ff2d55" opacity=".9"/>` },
 { n: 'Szlafrok', bg: 'radial-gradient(120% 90% at 30% 20%,#ffe9f0,#f3b6c8)', d: 'Satynowy szlafrok, kieliszek bąbelków i mina „było grubo”. Na niedzielne podsumowania i teksty „po imprezie”.', bub: 'Co tam było wczoraj…?',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 178, 98, 196, 92, 168, '#c2185b') + arm(182, 178, 206, 196, 210, 214, '#c2185b') + body(id, { wear: id => robe(id),  tilt: 3 }) +
     `<g transform="rotate(3 150 260)"><path d="M112 162 C104 206 104 236 110 254 L190 254 C196 236 196 206 188 162 C176 176 160 186 150 214 C140 186 124 176 112 162 Z" fill="#e0457b" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M112 162 C124 176 140 186 150 214 C160 186 176 176 188 162" stroke="#ffd0de" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M110 226 C130 220 170 220 190 226" stroke="#c2185b" stroke-width="7" stroke-linecap="round"/><path d="M146 226 l-12 18 M154 226 l10 18" stroke="#c2185b" stroke-width="6" stroke-linecap="round"/>` + eyes('flirt', -4) + mouth('smirk', -4) + blush(-6) + `</g>` +
     `<g transform="translate(88 150) rotate(-8)"><path d="M-12 -20 L12 -20 L4 2 L4 18 L12 22 L-12 22 L-4 18 L-4 2 Z" fill="rgba(255,240,200,.6)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M-9 -14 L9 -14 L3 0 L-3 0 Z" fill="#ffcf4a"/><circle cx="-2" cy="-24" r="2.5" fill="#ffcf4a"/><circle cx="5" cy="-30" r="2" fill="#ffcf4a"/></g>` + glove(92, 166, 13, -10) + glove(210, 216, 13, 120) },
 { n: 'Sauna', bg: 'radial-gradient(120% 90% at 30% 20%,#fff3e0,#e8b98a)', d: 'Ręczniczek, para, kropelki potu i zadowolona mina. Gorąca i mokra – na upały, „Termometr” i gorące tematy dnia.', bub: 'Gorąco tu, czy to ten news?',
   svg: id => defs(id, { a: '#ffc9b0', b: '#f5a07c', c: '#d17552' }, { a: '#ff9c9c', b: '#f36b78', c: '#c53f55' }) + arm(118, 176, 96, 156, 86, 130, '#f5a07c') + arm(182, 176, 204, 156, 214, 130, '#f5a07c') + body(id, { wear: id => towel(id), tilt: 0 }) + eyes('happy') + mouth('tongue', 0) + `<ellipse cx="121" cy="186" rx="12" ry="7" fill="#ff3b5c" opacity=".55"/><ellipse cx="179" cy="186" rx="12" ry="7" fill="#ff3b5c" opacity=".55"/>` + glove(86, 126, 13, -30) + glove(214, 126, 13, 210) +
     drop(112, 108, .6) + drop(192, 140, .55) + drop(130, 230, .5) + `<g stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".85"><path d="M56 110 c-12 -14 12 -22 0 -38 c-10 -14 8 -22 4 -34"/><path d="M246 120 c-12 -14 12 -22 0 -38 c-10 -14 8 -22 4 -34"/><path d="M238 250 c-10 -12 10 -18 0 -30"/></g>` },
 { n: 'Kąpiel', bg: 'radial-gradient(120% 90% at 30% 20%,#e6fbff,#9fdcf2)', d: 'W wannie pełnej piany, z gumową kaczką. Relaks i „mokry czwartek” – świetna jako ekran ładowania i do gier wodnych.', bub: 'Wskakuj, woda ciepła!',
   svg: id => defs(id, SKIN, HEAD) + `<g transform="translate(0 -46)">` + arm(118, 176, 92, 160, 74, 140, SKIN.b) + body(id, { tilt: 8 }) + `<g transform="rotate(8 150 260)">` + eyes('flirt', 0) + mouth('smirk') + blush() + `</g>` + glove(74, 136, 13, -30) + `</g>` +
     `<path d="M30 214 H270 V236 C270 270 240 284 210 284 H90 C60 284 30 270 30 236 Z" fill="#fff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/><path d="M56 284 l-6 12 M244 284 l6 12" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
     [[60, 210, 20], [92, 200, 26], [128, 206, 22], [170, 200, 28], [210, 206, 22], [244, 210, 20], [150, 214, 18]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#bfe6f5" stroke-width="4"/>`).join('') +
     `<g transform="translate(228 178)"><ellipse cx="0" cy="8" rx="20" ry="13" fill="#ffcf4a" stroke="${INK}" stroke-width="4.5"/><circle cx="-8" cy="-8" r="11" fill="#ffcf4a" stroke="${INK}" stroke-width="4.5"/><path d="M-20 -8 l-10 3 l10 3" fill="#ff8a00" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="-10" cy="-11" r="2.4" fill="${INK}"/></g>` + [[70, 150, 7], [252, 120, 9], [90, 120, 5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(255,255,255,.7)" stroke="#7cc8f5" stroke-width="2.5"/>`).join('') },
 { n: 'Kowboj', bg: 'radial-gradient(120% 90% at 30% 20%,#fff1d6,#e9b36b)', d: 'Kapelusz, chusta, lasso i mina „jeźdźca”. Dziki zachód Śliskiej – do rankingów, wyzwań i Typera.', bub: 'Siodłaj, jedziemy z tematem.',
   svg: id => defs(id, SKIN, HEAD) + `<path d="M210 120 C250 100 276 130 252 156 C236 172 210 160 222 140" stroke="#b07a3c" stroke-width="7" fill="none" stroke-linecap="round"/>` + arm(118, 176, 98, 196, 104, 214, SKIN.b) + arm(182, 176, 206, 150, 214, 128, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}jns)`, '#6b4423', { logo: false, trim: '#e9c27a', extra: `<rect x="140" y="208" width="20" height="14" rx="3" fill="#e9c27a" stroke="#2a1620" stroke-width="3"/><path d="M146 215 h8" stroke="#2a1620" stroke-width="2.5"/>` }),  tilt: -4 }) +
     `<g transform="rotate(-4 150 260)"><path d="M84 92 C84 78 112 84 150 84 C188 84 216 78 216 92 C216 104 84 104 84 92 Z" fill="#8a5a2b" stroke="${INK}" stroke-width="5"/><path d="M112 90 C110 62 124 46 136 52 C142 56 158 56 164 52 C176 46 190 62 188 90 Z" fill="#a46c35" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M112 84 h76" stroke="${INK}" stroke-width="7"/>` + eyes('sly') + mouth('smirk') + blush() +
     `<path d="M114 210 C130 222 170 222 186 210 L172 236 L150 226 L128 236 Z" fill="#d6001c" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><circle cx="138" cy="218" r="2.5" fill="#fff"/><circle cx="160" cy="220" r="2.5" fill="#fff"/></g>` + glove(214, 126, 13, 200) + glove(104, 214, 13, 30) },
 { n: 'Ratownik', bg: 'linear-gradient(180deg,#ffe9b0 0%,#ffd06a 55%,#4cc3ff 56%,#2f8fd8 100%)', d: 'Czerwone kąpielówki na kulach, gwizdek, koło ratunkowe. Pilnuje porządku – do moderacji komentarzy i ostrzeżeń „Za mokro!”.', bub: 'Fiuuu! Za mokro w komentarzach!',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 96, 168, 92, 146, SKIN.b) + arm(182, 176, 214, 190, 224, 214, SKIN.b) + body(id, { wear: id => briefs(id, '#e3132e', '#fff'),  tilt: 0 }) +
     '' + eyes('big', -2) + `<g transform="translate(150 196)"><rect x="-4" y="-4" width="24" height="12" rx="6" fill="#ffcf4a" stroke="${INK}" stroke-width="4"/><circle cx="-6" cy="2" r="8" fill="#ffcf4a" stroke="${INK}" stroke-width="4"/></g><path d="M150 200 C140 196 128 180 124 166" stroke="#d6001c" stroke-width="3" fill="none"/>` +
     `<g transform="translate(232 222)"><circle r="30" fill="none" stroke="${INK}" stroke-width="20"/><circle r="30" fill="none" stroke="#fff" stroke-width="13"/><circle r="30" fill="none" stroke="#e3132e" stroke-width="13" stroke-dasharray="23.5 23.5"/></g>` + glove(92, 142, 13, -20) + `<text x="40" y="70" font-size="30" font-weight="900" fill="#d6001c" font-family="Arial" transform="rotate(-12 40 70)">FIUU!</text>` },

 { n: 'Mikołaj', bg: 'radial-gradient(120% 90% at 30% 20%,#fff1f1,#ffc0c0)', d: 'Czapka z pomponem, broda z waty i aksamitne czerwone slipki z białym futerkiem. Na grudzień, kalendarz adwentowy i świąteczne odznaki.', bub: 'Byłeś grzeczny? Bo ja nie.',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 176, 94, 160, 82, 130, SKIN.b) + arm(182, 176, 212, 192, 224, 210, SKIN.b) + body(id, { wear: id => briefs(id, '#c8102e', '#fff', { logo: false, trim: '#fff', extra: `${Array.from({ length: 26 }, (_, i) => `<circle cx="${44 + i * 8.5}" cy="${214 + (i % 2) * 3}" r="6" fill="#fff"/>`).join('')}` }), tilt: -3 }) +
     `<g transform="rotate(-3 150 260)"><path d="M104 96 C100 54 150 26 196 60 C212 72 224 86 230 100" stroke="${INK}" stroke-width="5" fill="#c8102e" stroke-linejoin="round"/><path d="M100 98 C120 84 180 84 200 98 C204 108 96 108 100 98Z" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="232" cy="104" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/>` + eyes('wink') +
     `<path d="M116 182 C116 222 184 222 184 182 C176 196 164 192 150 196 C136 192 124 196 116 182Z" fill="#fff" stroke="${INK}" stroke-width="4.5"/><path d="M134 186 q16 10 32 0" stroke="${INK}" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>` + glove(82, 126, 13, -20) +
     `<g transform="translate(232 214)"><rect x="-16" y="-14" width="32" height="28" rx="4" fill="#16a34a" stroke="${INK}" stroke-width="4.5"/><path d="M0 -14 v28 M-16 0 h32" stroke="#ffcf4a" stroke-width="5"/><path d="M0 -14 c-10 -12 -18 -2 -8 2 M0 -14 c10 -12 18 -2 8 2" stroke="#ffcf4a" stroke-width="4" fill="none"/></g>` + glove(224, 210, 13, 140) + sparkle(56, 70, .7, '#ffcf4a') + sparkle(250, 50, .9, '#fff') },
 { n: 'Super Knaga', bg: 'radial-gradient(120% 90% at 30% 20%,#e5f0ff,#8fb6ff)', d: 'Peleryna, maska i slipki z wielkim „Ś” – jak u prawdziwego superbohatera. Na ratowanie dnia: odznaki, rekordy i powitanie nowych kont.', bub: 'Spokojnie, już lecę z newsem!',
   svg: id => defs(id, SKIN, HEAD) + `<path d="M118 150 C80 170 60 230 40 276 C90 262 120 268 150 262 C180 268 210 262 260 276 C240 230 220 170 182 150 Z" fill="#d6001c" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M70 250 C100 244 120 250 150 246" stroke="#a8001a" stroke-width="4" fill="none"/>` +
     arm(118, 172, 96, 150, 78, 108, SKIN.b) + arm(182, 176, 206, 192, 196, 214, SKIN.b) + body(id, { wear: id => briefs(id, '#1f4fd6', '#ffcf4a', { logo: false, trim: '#ffcf4a', extra: `<path d="M150 228 L170 238 L150 262 L130 238 Z" fill="#ffcf4a" stroke="#2a1620" stroke-width="3" stroke-linejoin="round"/><text x="150" y="252" text-anchor="middle" font-family="Arial Black, Arial" font-weight="900" font-size="16" fill="#d6001c">Ś</text>` }), tilt: 4 }) +
     `<g transform="rotate(4 150 260)"><path d="M114 152 C126 144 174 144 186 152 C190 168 178 176 166 172 C160 168 156 164 150 164 C144 164 140 168 134 172 C122 176 110 168 114 152Z" fill="#d6001c" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><ellipse cx="134" cy="160" rx="7" ry="6" fill="#fff"/><ellipse cx="166" cy="160" rx="7" ry="6" fill="#fff"/><circle cx="135" cy="161" r="3.5" fill="${INK}"/><circle cx="167" cy="161" r="3.5" fill="${INK}"/>` + mouth('grin', 0) + `</g>` + glove(78, 104, 14, -30) + glove(196, 214, 13, 60) },
 { n: 'Kibic', bg: 'radial-gradient(120% 90% at 30% 20%,#ffffff,#ffd0d6)', d: 'Biało-czerwony szalik, malowane policzki i slipki w barwach narodowych. Na mecze, rankingi, Wojnę Fandomów i Typera.', bub: 'Polska gola! I Śliska też!',
   svg: id => defs(id, SKIN, HEAD) + arm(118, 172, 92, 150, 84, 112, SKIN.b) + arm(182, 172, 210, 150, 218, 112, SKIN.b) + body(id, { wear: id => briefs(id, `url(#${id}pl)`, '#fff', { logo: false }), tilt: 0 }) +
     eyes('big', -4) + mouth('grin', -2) + `<rect x="114" y="176" width="16" height="8" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="114" y="184" width="16" height="8" fill="#dc143c" stroke="${INK}" stroke-width="2"/><rect x="170" y="176" width="16" height="8" fill="#fff" stroke="${INK}" stroke-width="2"/><rect x="170" y="184" width="16" height="8" fill="#dc143c" stroke="${INK}" stroke-width="2"/>` +
     `<path d="M110 200 C130 210 170 210 190 200 L192 214 C170 222 130 222 108 214 Z" fill="url(#${id}pl)" stroke="${INK}" stroke-width="4.5"/><path d="M176 212 L184 250 L200 248 L190 210 Z" fill="url(#${id}pl)" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/><path d="M186 250 l-2 8 M192 249 l0 8 M198 248 l2 8" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
     glove(84, 108, 14, -20) + glove(218, 108, 14, 200) + `<text x="40" y="66" font-size="24" font-weight="900" fill="#dc143c" font-family="Arial" transform="rotate(-10 40 66)">GOOL!</text>` },
];

  const SLUG = {"Ziomek": "ziomek", "Śliska": "sliska", "Redaktor": "redaktor", "Gwiazdor": "gwiazdor", "Ikona": "ikona", "Surfer (gry)": "surfer", "Nieśmiała": "niesmiala", "Wściekła (drama)": "wsciekla", "Zakochana": "zakochana", "Diabełek (kontrowersje)": "diabelek", "Imprezowa": "imprezowa", "Detektyw (plotki)": "detektyw", "Uwodziciel": "uwodziciel", "Szlafrok": "szlafrok", "Sauna": "sauna", "Kąpiel": "kapiel", "Kowboj": "kowboj", "Ratownik": "ratownik", "Mikołaj": "mikolaj", "Super Knaga": "super", "Kibic": "kibic"};
  let n = 0;
  window.Knaga = {
    list: V.map(v => ({ slug: SLUG[v.n] || v.n, name: v.n.replace(/ \(.*\)$/, ''), bub: v.bub, d: v.d })),
    /** svg(slug, { cls, title }) – unikalne id gradientów dla każdej kopii */
    svg(slug, o) {
      o = o || {};
      const v = V.find(x => (SLUG[x.n] || x.n) === slug) || V[0];
      const id = 'kg' + (n++) + '_';
      return `<svg viewBox="0 0 300 300" class="${o.cls || 'knaga'}" role="img" aria-label="${o.title || 'Knaga'}">${v.svg(id)}</svg>`;
    }
  };
})();
