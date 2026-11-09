/* Śliska – własne logowanie (etap 3). Obiekt zgodny z Firebase Auth (signInWithEmailAndPassword, onAuthStateChanged,
 * currentUser.getIdToken()…), ale konta i sesje są w API Śliskiej (Worker → Neon). Sesja: token w localStorage, 24 h. */
(function () {
  'use strict';
  if (window.SliskaAuth) return;
  var KEY = 'sliska_session';
  var API = window.SLISKA_API || (location.hostname === 'news.sliska.pl' ? 'https://api.sliska.pl' : '/news/api');
  var subs = [], cur = null;
  function claims(t) { try { return JSON.parse(decodeURIComponent(escape(atob(String(t).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } }
  function valid(t) { var c = claims(t); return !!(c && c.sub && c.exp * 1000 > Date.now()); }
  function err(code, msg) { var e = new Error(msg || code); e.code = code; e.error = code; return e; }
  var CAPTCHA = { '/auth/login': 1, '/auth/register': 1, '/auth/reset-send': 1 };
  function call(path, body, tok) {
    var h = { 'content-type': 'application/json' }; if (tok) h.authorization = 'Bearer ' + tok;
    var pre = body && CAPTCHA[path] && window.SliskaTS ? SliskaTS.token() : Promise.resolve('');
    return pre.then(function (ts) {
      if (ts) body.ts = ts;
      return fetch(API + path, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
        .catch(function () { throw err('auth/network-request-failed'); })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw err(d.error || 'auth/internal-error'); return d; }); });
    });
  }
  function apply(u, t) {
    var c = claims(t) || {};
    u._t = t; u.uid = c.sub; u.email = c.email || ''; u.emailVerified = !!c.email_verified;
    u.metadata = { lastSignInTime: new Date((c.auth_time || 0) * 1000).toUTCString(), creationTime: '' };
    u.providerData = [{ providerId: (c.firebase && c.firebase.sign_in_provider) || 'password' }];
    return u;
  }
  function makeUser(t) {
    var u = {
      getIdToken: function () { return valid(u._t) ? Promise.resolve(u._t) : Promise.reject(err('auth/user-token-expired')); },
      getIdTokenResult: function () { var c = claims(u._t) || {}; return Promise.resolve({ token: u._t, claims: c, authTime: new Date((c.auth_time || 0) * 1000).toISOString() }); },
      reload: function () { return call('/auth/refresh', {}, u._t).then(function (d) { apply(u, d.token); store(d.token); }); },
      sendEmailVerification: function () { return call('/auth/verify-send', {}, u._t); },
      toJSON: function () { return { token: u._t, uid: u.uid, email: u.email }; }
    };
    return apply(u, t);
  }
  function store(t) { try { if (t) localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch (e) { /* ignoruj */ } }
  function emit() { subs.slice().forEach(function (cb) { try { cb(cur); } catch (e) { console.error(e); } }); }
  function setToken(t) {
    if (t && valid(t)) { if (cur && claims(t).sub === cur.uid) apply(cur, t); else cur = makeUser(t); store(t); }
    else { cur = null; store(null); }
    emit();
    return cur;
  }
  try { var saved = localStorage.getItem(KEY); if (saved && valid(saved)) cur = makeUser(saved); else if (saved) store(null); } catch (e) { /* ignoruj */ }
  window.addEventListener('storage', function (e) { if (e.key !== KEY) return; var t = e.newValue; if (t && valid(t)) { if (!cur || claims(t).sub !== cur.uid) { cur = makeUser(t); emit(); } else apply(cur, t); } else if (cur) { cur = null; emit(); } });
  setInterval(function () { if (cur && !valid(cur._t)) { cur = null; store(null); emit(); } }, 60000);

  /* Google: na komputerze okienko (popup), na telefonie i w zainstalowanej aplikacji – przekierowanie całej strony
   * (w aplikacji PWA na iPhonie okienko traci połączenie ze stroną i logowanie by się nie kończyło). */
  function googleRedirectUri() { return location.origin + (location.hostname === 'news.sliska.pl' ? '' : '/news') + '/google.html'; }
  function useRedirect() {
    var sa = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
    var mob = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return sa || mob;
  }
  function googleUrl(cid, nonce) {
    return 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + encodeURIComponent(cid) + '&redirect_uri=' + encodeURIComponent(googleRedirectUri()) +
      '&response_type=id_token&scope=' + encodeURIComponent('openid email profile') + '&nonce=' + nonce + '&state=' + nonce + '&prompt=select_account';
  }
  function googleViaRedirect(cid, nonce) {
    try { localStorage.setItem('sliska_g', JSON.stringify({ n: nonce, r: location.href, t: Date.now() })); } catch (e) { /* ignoruj */ }
    location.href = googleUrl(cid, nonce);
    return new Promise(function () { /* strona przechodzi do Google */ });
  }
  function googleLogin() {
    return call('/auth/config').then(function (cfg) {
      if (!cfg.google) throw err('google_off', 'Logowanie Google nie jest jeszcze skonfigurowane.');
      var nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
      if (useRedirect()) return googleViaRedirect(cfg.google, nonce);
      return new Promise(function (resolve, reject) {
        var w = window.open(googleUrl(cfg.google, nonce), 'sliska-google', 'width=500,height=640');
        if (!w) { googleViaRedirect(cfg.google, nonce); return; }
        var done = false;
        function finish(fn, v) { if (done) return; done = true; window.removeEventListener('message', onMsg); clearInterval(timer); fn(v); }
        function onMsg(ev) {
          if (ev.origin !== location.origin || !ev.data || ev.data.type !== 'sliska-google') return;
          if (ev.data.state !== nonce || !ev.data.id_token) { finish(reject, err('auth/cancelled-popup-request')); return; }
          call('/auth/google', { credential: ev.data.id_token }).then(function (d) { finish(resolve, { user: setToken(d.token) }); }, function (e) { finish(reject, e); });
        }
        window.addEventListener('message', onMsg);
        var timer = setInterval(function () { if (w.closed) setTimeout(function () { finish(reject, err('auth/popup-closed-by-user')); }, 800); }, 500);
      });
    });
  }

  var auth = {
    get currentUser() { return cur; },
    onAuthStateChanged: function (cb) { subs.push(cb); setTimeout(function () { cb(cur); }, 0); return function () { subs = subs.filter(function (x) { return x !== cb; }); }; },
    setPersistence: function () { return Promise.resolve(); },
    signInWithEmailAndPassword: function (email, pw) { return call('/auth/login', { email: String(email || '').trim().toLowerCase(), password: pw }).then(function (d) { return { user: setToken(d.token) }; }); },
    createUserWithEmailAndPassword: function (email, pw) { return call('/auth/register', { email: String(email || '').trim().toLowerCase(), password: pw }).then(function (d) { return { user: setToken(d.token) }; }); },
    signInWithPopup: function () { return googleLogin(); },
    signInWithGoogle: googleLogin,
    sendPasswordResetEmail: function (email) { return call('/auth/reset-send', { email: String(email || '').trim().toLowerCase() }); },
    signOut: function () { setToken(null); return Promise.resolve(); },
    useSession: function (t) { setToken(t); }
  };
  window.SliskaAuth = { auth: function () { return auth; }, api: API };
})();

