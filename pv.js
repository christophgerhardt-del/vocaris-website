// Anonymer Seitenaufruf-Zähler → Supabase-Tabelle page_views.
// Erfasst pro Aufruf nur: Seite, Herkunft (?src=…), Referrer, Zeitpunkt —
// dazu grob Gerätetyp, Browser, System und Sprache (Kategorien, kein User-Agent-String).
// Zusätzlich: geklickte Links und Knöpfe (Ziel + sichtbare Beschriftung) in der Tabelle klicks.
// Keine Cookies, keine IDs, keine personenbezogenen Daten (DSGVO-unkritisch).
// Der anon-Key ist öffentlich; RLS erlaubt ihm ausschließlich INSERT.
(function () {
  // Lokale Prüfläufe (Playwright gegen 127.0.0.1) zählen nicht mit – am 18.09. standen
  // sonst 694 eigene Aufrufe in der Statistik.
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver) return;
  var SB = 'https://nocsjyzmnskbyccrjayx.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3NqeXptbnNrYnljY3JqYXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDI4ODgsImV4cCI6MjA5NzI3ODg4OH0.RnIq-jbr6JKz_Z3etwc2rX1O6RXh5cidwm9mkRFrnw4';
  var page = location.pathname.replace(/^\/+/, '').replace(/\.html$/, '');
  if (page === '' || page === 'index') page = 'home';
  var src = new URLSearchParams(location.search).get('src');
  // Grobe Kategorien statt Kennung: nicht rückverfolgbar, ohne Einwilligung zulässig.
  var ua = navigator.userAgent || '';
  var geraet = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? 'tablet' : /Mobi|iPhone|Android/i.test(ua) ? 'mobil' : 'desktop';
  var browser = /Edg\//.test(ua) ? 'Edge' : /SamsungBrowser/.test(ua) ? 'Samsung' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\/|CriOS/.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Sonstige';
  var system = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Sonstige';
  var sprache = (navigator.language || '').slice(0, 2) || null;
  try {
    fetch(SB + '/rest/v1/page_views', {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: KEY,
        authorization: 'Bearer ' + KEY,
        'content-type': 'application/json',
        prefer: 'return=minimal'
      },
      body: JSON.stringify({ page: page, src: src, referrer: document.referrer || null, geraet: geraet, browser: browser, system: system, sprache: sprache })
    }).catch(function () {});
  } catch (e) { /* Zähler darf die Seite nie stören */ }

  // ── Klicks auf Links und Knöpfe ──────────────────────────────────────────
  // Gespeichert wird nur, was ohnehin sichtbar auf der Seite steht: Linkziel
  // und Beschriftung. Keine Eingaben, keine Formularinhalte, keine Kennungen.
  function senden(tabelle, daten) {
    try {
      fetch(SB + '/rest/v1/' + tabelle, {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, authorization: 'Bearer ' + KEY, 'content-type': 'application/json', prefer: 'return=minimal' },
        body: JSON.stringify(daten)
      }).catch(function () {});
    } catch (e) { /* darf die Seite nie stören */ }
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[href], button') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var art, ziel;
    if (el.tagName === 'BUTTON') {
      art = 'knopf';
      ziel = el.getAttribute('id') || el.getAttribute('name') || el.getAttribute('aria-label') || '';
    } else if (/^mailto:/i.test(href)) {
      art = 'mail'; ziel = href.split('?')[0];
    } else if (/^tel:/i.test(href)) {
      art = 'telefon'; ziel = href;
    } else if (href.charAt(0) === '#') {
      art = 'anker'; ziel = href;
    } else {
      try {
        var u = new URL(href, location.href);
        art = u.hostname === location.hostname ? 'intern' : 'extern';
        ziel = art === 'intern'
          ? (u.pathname.replace(/^\/+/, '').replace(/\.html$/, '').replace(/\/$/, '') || 'home')
          : u.origin + u.pathname;
      } catch (err) { return; }
    }
    var text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    senden('klicks', {
      page: page, ziel: String(ziel).slice(0, 200), beschriftung: text || null, art: art,
      geraet: geraet, browser: browser, system: system, sprache: sprache
    });
  }, true);
})();
