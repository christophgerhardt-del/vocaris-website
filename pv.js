// Anonymer Seitenaufruf-Zähler → Supabase-Tabelle page_views.
// Erfasst pro Aufruf nur: Seite, Herkunft (?src=…), Referrer, Zeitpunkt.
// Keine Cookies, keine IDs, keine personenbezogenen Daten (DSGVO-unkritisch).
// Der anon-Key ist öffentlich; RLS erlaubt ihm ausschließlich INSERT.
(function () {
  var SB = 'https://nocsjyzmnskbyccrjayx.supabase.co';
  var KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vY3NqeXptbnNrYnljY3JqYXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDI4ODgsImV4cCI6MjA5NzI3ODg4OH0.RnIq-jbr6JKz_Z3etwc2rX1O6RXh5cidwm9mkRFrnw4';
  var page = location.pathname.replace(/^\/+/, '').replace(/\.html$/, '');
  if (page === '' || page === 'index') page = 'home';
  var src = new URLSearchParams(location.search).get('src');
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
      body: JSON.stringify({ page: page, src: src, referrer: document.referrer || null })
    }).catch(function () {});
  } catch (e) { /* Zähler darf die Seite nie stören */ }
})();
