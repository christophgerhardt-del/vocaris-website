// Anonymer Seitenaufruf-Zähler → Supabase-Tabelle page_views.
// Erfasst pro Aufruf nur: Seite, Herkunft (?src=…), Referrer, Zeitpunkt —
// dazu grob Gerätetyp, Browser, System und Sprache (Kategorien, kein User-Agent-String).
// Keine Cookies, keine IDs, keine personenbezogenen Daten (DSGVO-unkritisch).
// Der anon-Key ist öffentlich; RLS erlaubt ihm ausschließlich INSERT.
(function () {
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
})();
