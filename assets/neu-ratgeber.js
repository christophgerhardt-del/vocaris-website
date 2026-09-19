/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Ratgeber (neu-ratgeber.js)
   ══════════════════════════════════════════════════════════════════════════
   Ergänzt neu.js auf den Ratgeberseiten. Jedes Modul startet nur, wenn sein
   Element auf der Seite steht: Lesefortschritt, Inhaltsverzeichnis (mitlaufend
   auf dem Schreibtisch, ausklappbar auf dem Handy), Checklisten mit Gedächtnis,
   Suche und Filter der Übersicht.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var $ = function (s, w) { return (w || document).querySelector(s); };
  var $$ = function (s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); };
  var SCHMAL = window.matchMedia ? window.matchMedia('(max-width: 1000px)') : { matches: false, addEventListener: function () {} };

  /* ── 1. Lesefortschritt: Leiste füllt sich über die Länge des Artikels ───── */
  function fortschritt() {
    var leiste = $('[data-fortschritt]'), art = $('[data-artikel]'); if (!leiste || !art) return;
    var balken = $('i', leiste), letzter = -1;
    var mal = function () {
      var r = art.getBoundingClientRect(), oben = r.top + scrollY, hoehe = r.height - innerHeight * 0.6;
      var p = hoehe > 0 ? (scrollY - oben + innerHeight * 0.2) / hoehe : 1;
      p = Math.max(0, Math.min(1, p)); if (p === letzter) return; letzter = p;
      balken.style.setProperty('--p', p.toFixed(3));
    };
    addEventListener('scroll', mal, { passive: true }); addEventListener('resize', mal); mal();
  }

  /* ── 2. Inhaltsverzeichnis: offen auf dem Schreibtisch, klappbar auf dem Handy,
         aktueller Abschnitt markiert ──────────────────────────────────────── */
  function inhalt() {
    var box = $('[data-inhalt]'), art = $('[data-artikel]'); if (!box || !art) return;
    var links = $$('a[href^="#"]', box);
    var ziele = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    var anpassen = function () { box.open = !SCHMAL.matches; };
    anpassen();
    if (SCHMAL.addEventListener) SCHMAL.addEventListener('change', anpassen);
    // auf dem Handy nach dem Sprung wieder einklappen
    links.forEach(function (a) { a.addEventListener('click', function () { if (SCHMAL.matches) box.open = false; }); });
    if (!('IntersectionObserver' in window) || !ziele.length) return;
    var aktiv = function (id) { links.forEach(function (a) { var an = a.getAttribute('href') === '#' + id; if (an) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); };
    var sichtbar = {};
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { sichtbar[e.target.id] = e.isIntersecting; });
      var erster = ziele.filter(function (z) { return sichtbar[z.id]; })[0];
      if (erster) { aktiv(erster.id); return; }
      // nichts im Fenster: der letzte Abschnitt, der über dem Fenster liegt
      var oben = ziele.filter(function (z) { return z.getBoundingClientRect().top < 120; });
      if (oben.length) aktiv(oben[oben.length - 1].id);
    }, { rootMargin: '-96px 0px -60% 0px', threshold: 0 });
    ziele.forEach(function (z) { io.observe(z); });
  }

  /* ── 3. Checklisten merken sich ihre Haken (nur in diesem Browser) ──────── */
  function checklisten() {
    var art = $('[data-artikel]'); if (!art) return;
    var haken = $$('[data-haken]', art); if (!haken.length) return;
    var schluessel = 'vocaris-ratgeber-' + (art.getAttribute('data-slug') || location.pathname);
    var lesen = function () { try { return JSON.parse(localStorage.getItem(schluessel) || '{}'); } catch (e) { return {}; } };
    var stand = lesen();
    haken.forEach(function (h, i) {
      h.checked = !!stand[i];
      h.addEventListener('change', function () {
        stand[i] = h.checked; if (!h.checked) delete stand[i];
        try { localStorage.setItem(schluessel, JSON.stringify(stand)); } catch (e) {}
      });
    });
  }

  /* ── 4. Übersicht: Suche im Titel und in der Beschreibung, Filter nach Kategorie */
  function filter() {
    var leiste = $('[data-filter]'); if (!leiste) return;
    var eingabe = $('[data-suche]', leiste), chips = $$('[data-kategorie]', leiste), stand = $('[data-stand]', leiste);
    var karten = $$('.artikelkarte[data-kategorie]', $('[data-kategorien]')), abschnitte = $$('[data-kategorie-abschnitt]'), leer = $('[data-leer]');
    var kategorie = 'alle', gesamt = karten.length, timer;
    var norm = function (s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim(); };
    var anwenden = function () {
      var q = norm(eingabe.value), n = 0;
      karten.forEach(function (k) {
        var passt = (kategorie === 'alle' || k.getAttribute('data-kategorie') === kategorie) && (!q || (k.getAttribute('data-suche') || '').indexOf(q) >= 0);
        k.hidden = !passt; if (passt) n++;
      });
      abschnitte.forEach(function (s) { s.hidden = !$$('.artikelkarte:not([hidden])', s).length; });
      if (leer) leer.hidden = n > 0;
      if (stand) stand.textContent = n === gesamt ? gesamt + ' Artikel' : n === 1 ? '1 Artikel gefunden' : n + ' Artikel gefunden';
      var url = new URL(location.href);
      if (kategorie !== 'alle') url.searchParams.set('k', kategorie); else url.searchParams.delete('k');
      if (q) url.searchParams.set('q', eingabe.value.trim()); else url.searchParams.delete('q');
      history.replaceState(null, '', url.pathname + (url.search || ''));
    };
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        kategorie = c.getAttribute('data-kategorie');
        chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
        anwenden();
      });
    });
    eingabe.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(anwenden, 120); });
    eingabe.addEventListener('search', anwenden);
    var zurueck = $('[data-zuruecksetzen]'); if (zurueck) zurueck.addEventListener('click', function () { eingabe.value = ''; chips[0].click(); eingabe.focus(); });
    // Zustand aus der Adresse übernehmen (?k=…&q=…)
    var p = new URLSearchParams(location.search), k = p.get('k'), q = p.get('q');
    if (q) eingabe.value = q;
    var chip = k && chips.filter(function (c) { return c.getAttribute('data-kategorie') === k; })[0];
    if (chip) chip.click(); else if (q) anwenden();
  }

  /* ── 5. Breite Tabellen: Schatten am rechten Rand, solange noch etwas verdeckt ist */
  function tabellen() {
    $$('.kasten--tabelle').forEach(function (k) {
      var t = $('.tabelle', k); if (!t) return;
      var mal = function () { k.classList.toggle('scrollt', t.scrollWidth > t.clientWidth + 1); k.classList.toggle('am-ende', t.scrollLeft + t.clientWidth >= t.scrollWidth - 2); };
      t.addEventListener('scroll', mal, { passive: true }); addEventListener('resize', mal); mal();
    });
  }

  fortschritt(); inhalt(); checklisten(); filter(); tabellen();
})();
