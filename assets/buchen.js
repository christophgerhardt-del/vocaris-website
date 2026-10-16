/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Online buchen (buchen.html)
   ══════════════════════════════════════════════════════════════════════════
   Ablauf: Tarif und Angaben → POST /api/buchen/start → Stripe Checkout
   (gehostet) → zurück auf buchen.html?status=ok&session_id=… → Stand per
   GET /api/buchen/status, bis der Zugang eingerichtet ist.

   Was die Seite zeigen darf, sagt der Server (GET /api/buchen/info):
     aus  → „startet in Kürze“ mit Demo und Testanruf
     test → nur mit ?buchen=test (Merker in sessionStorage), Hinweis Testmodus
     an   → Formular für alle
   Die Sperre liegt im Server; die Seite blendet nur passend ein. Preise kommen
   nie aus dem Formular, nur der Tarifschlüssel.

   Eingerichtet wird ausschließlich über das signierte Stripe-Ereignis. Die
   Erfolgsseite meldet niemanden an: Zugang gibt es nur über den Link in der
   Mail, damit ist die Adresse zugleich bestätigt.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var wurzel = document.querySelector('[data-buchen-seite]'); if (!wurzel) return;
  var API = 'https://api.vocaris.eu';
  var MERKER = 'vocaris.buchenTest';
  var KONTAKT = 'christoph.gerhardt@gmail.com';
  var $ = function (s, w) { return (w || document).querySelector(s); };
  var $$ = function (s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var eur = function (n, nk) { return Number(n).toLocaleString('de-DE', { minimumFractionDigits: nk, maximumFractionDigits: nk }) + ' €'; };
  var zahl = function (n) { return Number(n).toLocaleString('de-DE'); };
  var q = new URLSearchParams(location.search);

  // Wie preise.html: gleiche Zahlen, falls /api/buchen/info keine Tarife liefert.
  var TARIFE_VORGABE = [
    { tarif: 'klein', name: 'Klein', grundpreis: 49, inklusive_minuten: 250, mehrminute: 0.19 },
    { tarif: 'standard', name: 'Standard', grundpreis: 99, inklusive_minuten: 700, mehrminute: 0.15 },
    { tarif: 'gross', name: 'Groß', grundpreis: 249, inklusive_minuten: 2000, mehrminute: 0.11 }
  ];
  var TARIF_FUER = { klein: 'Einzelpraxen, kleine Salons, ruhiges Telefon', standard: 'Restaurants, Werkstätten, volle Praxen', gross: 'Hausverwaltungen, Pflegedienste, mehrere Standorte' };
  var BRANCHE_NAME = {
    apotheke: 'Apotheke', arztpraxen: 'Arzt- oder Zahnarztpraxis', autowerkstatt: 'Kfz und Autowerkstatt', fitnessstudio: 'Fitness und Studio',
    friseur: 'Friseur und Salon', handwerk: 'Handwerk und Bau', hausverwaltung: 'Hausverwaltung', hotel: 'Hotellerie', immobilienmakler: 'Immobilien',
    kanzlei: 'Kanzlei', onlineshop: 'Onlinehandel', pflegedienst: 'Ambulante Pflege', physiotherapie: 'Physiotherapie', restaurants: 'Gastronomie',
    software: 'Software und SaaS', tierarzt: 'Tierarztpraxis', versicherungsmakler: 'Versicherung', sonstiges: 'Andere Branche'
  };

  function merker(wert) {
    try { if (wert === undefined) return sessionStorage.getItem(MERKER) === '1'; sessionStorage.setItem(MERKER, wert ? '1' : '0'); } catch (e) { /* ohne Speicher: nur die Adresse zählt */ }
    return false;
  }
  if (q.get('buchen') === 'test') merker(true);
  var testAnsicht = q.get('buchen') === 'test' || merker();

  function zeigen(zustand) {
    $$('[data-zustand]', wurzel).forEach(function (el) { el.hidden = el.getAttribute('data-zustand') !== zustand; });
  }

  // Antwort als JSON lesen; Netzfehler werden zu { status: 0 }.
  function holen(pfad, optionen) {
    return fetch(API + pfad, Object.assign({ cache: 'no-store' }, optionen || {}))
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, ok: r.ok, d: d || {} }; }); })
      .catch(function () { return { status: 0, ok: false, d: {} }; });
  }

  /* ── Zurück von Stripe: Stand der Einrichtung ──────────────────────────── */
  var SESSION = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;
  function statusSeite(sessionId) {
    zeigen('status');
    var box = $('[data-status-inhalt]', wurzel);
    var start = Date.now(), uhr = null, letzteMail = '';
    var ICON = {
      ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
    };
    function malen(art, titel, text, extra) {
      box.innerHTML = '<div class="buchen-status__kopf buchen-status__kopf--' + art + '">' + (art === 'laeuft' ? '<span class="buchen-kreis" aria-hidden="true"></span>' : '<span class="buchen-status__icon">' + (art === 'ok' ? ICON.ok : ICON.info) + '</span>')
        + '<div><h2 tabindex="-1">' + esc(titel) + '</h2><p class="lede">' + text + '</p></div></div>' + (extra || '');
    }
    var KONTAKT_ZEILE = '<p class="buchen-klein">Fragen? Schreiben Sie uns an <a href="mailto:' + KONTAKT + '">' + KONTAKT + '</a>.</p>';
    function fertig(d) {
      letzteMail = d.email || letzteMail;
      malen('ok', 'Ihr Zugang ist unterwegs.', 'Wir haben die Zugangsdaten an <b>' + esc(letzteMail || 'Ihre E-Mail-Adresse') + '</b> geschickt. Klicken Sie in der Mail auf „Passwort festlegen“, danach öffnet sich der Kundenbereich mit dem Einrichtungs-Assistenten.',
        '<ol class="buchen-schritte buchen-schritte--gross">'
        + '<li><b>Passwort festlegen.</b> Der Link in der Mail gilt nur kurz und nur einmal.</li>'
        + '<li><b>Assistent einrichten.</b> Branche, Begrüßung und Wissen, etwa 15 Minuten.</li>'
        + '<li><b>Rufnummer.</b> Wir richten Ihre Nummer ein und schreiben Ihnen, sobald sie bereit ist. Bis dahin können Sie alles vorbereiten.</li></ol>'
        + '<div class="buchen-erneut"><p>Keine Mail bekommen? Sehen Sie bitte auch im Spam-Ordner nach.</p>'
        + '<div class="buchen-knoepfe"><button class="knopf knopf--leise" type="button" data-erneut>Zugang erneut senden</button><a class="verweis" href="app.html">Zur Anmeldung</a></div>'
        + '<p class="buchen-klein" data-erneut-stand role="status" aria-live="polite"></p></div>'
        + '<p class="buchen-klein">Rechnungen und Zahlungsbelege schickt Ihnen Stripe, unser Zahlungsdienstleister. Abo, Rechnungen und Zahlungsart finden Sie später im Kundenbereich unter „Abo &amp; Rechnungen“.</p>');
      var k = $('[data-erneut]', box);
      k.addEventListener('click', function () {
        var stand = $('[data-erneut-stand]', box);
        k.disabled = true; stand.textContent = 'Wird gesendet …';
        holen('/api/buchen/zugang-erneut', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ session_id: sessionId }) }).then(function (r) {
          k.disabled = false;
          if (r.ok) { stand.textContent = 'Eine neue Mail an ' + (r.d.email || letzteMail) + ' ist unterwegs.'; return; }
          stand.textContent = r.d.error || (r.status ? 'Die Mail konnte gerade nicht verschickt werden.' : 'Der Server ist gerade nicht erreichbar. Bitte versuchen Sie es gleich noch einmal.');
        });
      });
    }
    function abfragen() {
      holen('/api/buchen/status?session_id=' + encodeURIComponent(sessionId)).then(function (r) {
        var s = r.ok ? r.d.status : null;
        if (r.ok && r.d.email) letzteMail = r.d.email;
        if (s === 'eingerichtet') return fertig(r.d);
        if (s === 'fehler') return malen('info', 'Ihre Zahlung ist da, die Einrichtung dauert noch.', 'Beim Anlegen Ihres Zugangs hakt es gerade. Wir kümmern uns persönlich darum und melden uns heute noch bei Ihnen' + (letzteMail ? ' unter <b>' + esc(letzteMail) + '</b>' : '') + '. Sie müssen nichts weiter tun.', KONTAKT_ZEILE);
        if (s === 'konflikt') return malen('info', 'Für diese E-Mail gibt es schon einen Zugang.', 'Ihre Zahlung ist eingegangen. Weil ' + (letzteMail ? '<b>' + esc(letzteMail) + '</b>' : 'Ihre E-Mail-Adresse') + ' schon einen Vocaris-Zugang hat, ordnen wir die Buchung von Hand zu und melden uns. Es wird nichts doppelt berechnet.', '<div class="buchen-knoepfe"><a class="knopf knopf--leise" href="app.html">Zur Anmeldung</a></div>' + KONTAKT_ZEILE);
        if (s === 'abgelaufen') return malen('info', 'Die Zahlungsseite ist abgelaufen.', 'Es wurde nichts berechnet. Sie können die Buchung jederzeit neu starten.', '<div class="buchen-knoepfe"><a class="knopf" href="buchen.html' + (r.d.tarif ? '?tarif=' + encodeURIComponent(r.d.tarif) : '') + '">Neu buchen</a></div>');
        if (r.status === 404 || r.status === 400) return malen('info', 'Diese Buchung finden wir nicht.', 'Der Link ist unvollständig oder die Buchung ist älter als 30 Tage. Wenn Sie gerade bezahlt haben, schreiben Sie uns kurz, wir klären das sofort.', KONTAKT_ZEILE);
        // offen, in_arbeit oder gerade nicht erreichbar: weiter fragen, höchstens eine Minute
        if (Date.now() - start > 60000) {
          return malen('info', 'Das dauert gerade länger als sonst.', 'Ihre Zahlung ist bei Stripe eingegangen. Sobald Ihr Zugang bereit ist, kommt die Mail' + (letzteMail ? ' an <b>' + esc(letzteMail) + '</b>' : '') + '. Sie können diese Seite schließen.',
            '<div class="buchen-knoepfe"><button class="knopf knopf--leise" type="button" data-nochmal>Stand erneut prüfen</button></div>' + KONTAKT_ZEILE);
        }
        uhr = setTimeout(abfragen, 2000);
      });
    }
    box.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nochmal]')) return;
      start = Date.now(); laufend(); abfragen();
    });
    function laufend() { malen('laeuft', 'Danke für Ihre Buchung.', 'Ihre Zahlung ist eingegangen. Wir richten jetzt Ihren Zugang ein, das dauert meist nur wenige Sekunden …'); }
    laufend();
    abfragen();
    window.addEventListener('pagehide', function () { clearTimeout(uhr); });
  }

  /* ── Formular ──────────────────────────────────────────────────────────── */
  function formularSeite(info) {
    zeigen('formular');
    var form = $('#buchenForm'), err = $('[data-err]', wurzel), knopf = $('.buchen-summe__knopf', wurzel);
    var tarife = (info.tarife && info.tarife.length ? info.tarife : TARIFE_VORGABE);
    var branchen = (info.branchen && info.branchen.length ? info.branchen : Object.keys(BRANCHE_NAME));
    if (info.buchung === 'test') $('[data-testmodus]', wurzel).hidden = false;
    if (q.get('abbruch') === '1') $('[data-abbruch]', wurzel).hidden = false;

    // Tarifwahl als Karten mit Funkfeldern (echte Radios: Tastatur und Vorleser funktionieren von selbst)
    var wahl = $('[data-tarife-wahl]', wurzel);
    var gewuenscht = q.get('tarif');
    var aktiv = tarife.some(function (t) { return t.tarif === gewuenscht; }) ? gewuenscht : (tarife.some(function (t) { return t.tarif === 'standard'; }) ? 'standard' : tarife[0].tarif);
    wahl.innerHTML = tarife.map(function (t) {
      return '<label class="buchen-tarif"><input type="radio" name="tarif" value="' + esc(t.tarif) + '"' + (t.tarif === aktiv ? ' checked' : '') + '>'
        + '<span class="buchen-tarif__name">' + esc(t.name) + '</span>'
        + '<span class="buchen-tarif__preis">' + esc(zahl(t.grundpreis)) + ' €<small>im Monat</small></span>'
        + '<span class="buchen-tarif__inkl"><b>' + esc(zahl(t.inklusive_minuten)) + ' Minuten</b> inklusive, danach ' + esc(eur(t.mehrminute, 2)) + ' je Minute</span>'
        + (TARIF_FUER[t.tarif] ? '<span class="buchen-tarif__fuer">' + esc(TARIF_FUER[t.tarif]) + '</span>' : '')
        + '</label>';
    }).join('');

    var sel = $('#bBranche');
    branchen.slice().sort(function (a, b) { if (a === 'sonstiges') return 1; if (b === 'sonstiges') return -1; return (BRANCHE_NAME[a] || a).localeCompare(BRANCHE_NAME[b] || b, 'de'); })
      .forEach(function (b) { var o = document.createElement('option'); o.value = b; o.textContent = BRANCHE_NAME[b] || b; sel.appendChild(o); });

    function gewaehlt() { var r = $('input[name=tarif]:checked', wahl); return tarife.filter(function (t) { return r && t.tarif === r.value; })[0] || null; }
    function summe() {
      var t = gewaehlt(); if (!t) return;
      $('[data-summe=name]', wurzel).textContent = 'Tarif ' + t.name;
      $('[data-summe=preis]', wurzel).textContent = zahl(t.grundpreis) + ' €';
      $('[data-summe=minuten]', wurzel).textContent = zahl(t.inklusive_minuten) + ' inklusive';
      $('[data-summe=mehr]', wurzel).textContent = eur(t.mehrminute, 2) + ' je Minute';
      $('[data-summe=heute]', wurzel).textContent = eur(t.grundpreis, 2);
      $$('.buchen-tarif', wahl).forEach(function (l) { l.classList.toggle('gewaehlt', $('input', l).checked); });
      try { history.replaceState(null, '', location.pathname + '?tarif=' + encodeURIComponent(t.tarif) + (testAnsicht ? '&buchen=test' : '')); } catch (e) { /* egal */ }
    }
    wahl.addEventListener('change', function () { fehlerWeg('tarif'); summe(); });
    summe();

    // Feldfehler: Text unter dem Feld, aria-invalid, Fokus aufs erste fehlerhafte Feld
    var FELD = { tarif: null, firma: '#bFirma', branche: '#bBranche', name: '#bName', email: '#bEmail', telefon: '#bTelefon', vorwahl: '#bVorwahl', unternehmer: '#bUnternehmer', agb: '#bAgb', avv: '#bAgb', datenschutz: '#bDatenschutz' };
    function fehlerWeg(feld) {
      var p = $('[data-fehler-fuer="' + (feld === 'avv' ? 'agb' : feld) + '"]', wurzel); if (p) p.textContent = '';
      var el = FELD[feld] && $(FELD[feld]); if (el) el.removeAttribute('aria-invalid');
    }
    function fehler(feld, text, fokus) {
      var key = feld === 'avv' ? 'agb' : feld;
      var p = $('[data-fehler-fuer="' + key + '"]', wurzel);
      if (!p) { err.textContent = text; return; }
      p.textContent = text;
      var el = FELD[key] ? $(FELD[key]) : $('input[name=tarif]', wahl);
      if (el && FELD[key]) el.setAttribute('aria-invalid', 'true');
      if (fokus && el) { el.focus({ preventScroll: true }); (el.closest('.feld') || el.closest('label') || el).scrollIntoView({ block: 'center', behavior: 'smooth' }); }
    }
    $$('input, select', form).forEach(function (el) {
      el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', function () { fehlerWeg(el.name); err.textContent = ''; });
    });

    function telefonOk(t) { var z = String(t).replace(/[^\d+]/g, ''); return z.replace(/\D/g, '').length >= 6; }
    function pruefen() {
      var w = function (id) { return $(id).value.trim(); };
      var liste = [];
      if (!gewaehlt()) liste.push(['tarif', 'Bitte wählen Sie einen Tarif.']);
      if (w('#bFirma').length < 2) liste.push(['firma', 'Bitte geben Sie den Namen Ihres Unternehmens an.']);
      if (!w('#bBranche')) liste.push(['branche', 'Bitte wählen Sie Ihre Branche.']);
      if (w('#bName').length < 2) liste.push(['name', 'Bitte geben Sie Ihren Namen an.']);
      if (!/^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i.test(w('#bEmail'))) liste.push(['email', 'Bitte geben Sie eine gültige E-Mail-Adresse an.']);
      if (!telefonOk(w('#bTelefon'))) liste.push(['telefon', 'Bitte geben Sie eine Telefonnummer für Rückfragen an, z. B. 089 123456.']);
      if (w('#bVorwahl') && !/^\+?[\d\s/()-]{2,8}$/.test(w('#bVorwahl'))) liste.push(['vorwahl', 'Die Wunsch-Vorwahl besteht nur aus Ziffern, z. B. 089.']);
      if (!$('#bUnternehmer').checked) liste.push(['unternehmer', 'Die Online-Buchung ist nur für Unternehmen möglich.']);
      if (!$('#bAgb').checked) liste.push(['agb', 'Bitte stimmen Sie den AGB und dem Auftragsverarbeitungsvertrag zu.']);
      if (!$('#bDatenschutz').checked) liste.push(['datenschutz', 'Bitte bestätigen Sie, dass Sie die Datenschutzerklärung gelesen haben.']);
      return liste;
    }

    var laeuft = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault(); if (laeuft) return;
      err.textContent = '';
      Object.keys(FELD).forEach(fehlerWeg);
      var liste = pruefen();
      if (liste.length) { liste.forEach(function (f, i) { fehler(f[0], f[1], i === 0); }); err.textContent = liste.length === 1 ? 'Bitte prüfen Sie das markierte Feld.' : 'Bitte prüfen Sie die ' + liste.length + ' markierten Felder.'; return; }
      var t = gewaehlt();
      var body = {
        tarif: t.tarif, firma: $('#bFirma').value.trim(), branche: $('#bBranche').value, name: $('#bName').value.trim(),
        email: $('#bEmail').value.trim(), telefon: $('#bTelefon').value.trim(), vorwahl: $('#bVorwahl').value.trim(),
        unternehmer: $('#bUnternehmer').checked, agb: $('#bAgb').checked, avv: $('#bAgb').checked, datenschutz: $('#bDatenschutz').checked,
        website: $('#bWebsite').value
      };
      if (info.buchung === 'test') body.test = true;
      laeuft = true; knopf.disabled = true; knopf.setAttribute('aria-busy', 'true'); var alt = knopf.textContent; knopf.textContent = 'Zahlungsseite wird geöffnet …';
      var zurueck = function () { laeuft = false; knopf.disabled = false; knopf.removeAttribute('aria-busy'); knopf.textContent = alt; };
      holen('/api/buchen/start', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
        if (r.ok && r.d.url && /^https:\/\/checkout\.stripe\.com\//.test(r.d.url)) { location.assign(r.d.url); return; }
        zurueck();
        if (r.ok) { err.textContent = 'Danke, wir melden uns.'; return; }
        if (r.status === 400 && r.d.feld) { fehler(r.d.feld, r.d.error || 'Bitte prüfen Sie diese Angabe.', true); err.textContent = r.d.error || ''; return; }
        if (r.status === 409 && r.d.code === 'login_vorhanden') {
          fehler('email', 'Für diese E-Mail gibt es schon einen Zugang.', true);
          err.innerHTML = 'Für diese E-Mail gibt es schon einen Vocaris-Zugang. <a href="app.html">Melden Sie sich an</a>, den Tarif ändern Sie dort unter „Abo &amp; Rechnungen“.';
          return;
        }
        if (r.status === 503 && r.d.code === 'buchung_aus') { zeigen('bald'); window.scrollTo({ top: 0 }); return; }
        err.textContent = r.d.error || (r.status ? 'Die Buchung ist gerade nicht möglich. Bitte versuchen Sie es gleich noch einmal.' : 'Der Server ist gerade nicht erreichbar. Bitte versuchen Sie es in einem Moment noch einmal.');
      });
    });
  }

  /* ── Start ─────────────────────────────────────────────────────────────── */
  var sid = q.get('session_id') || '';
  if (q.get('status') === 'ok' && SESSION.test(sid)) { statusSeite(sid); return; }
  holen('/api/buchen/info').then(function (r) {
    var info = r.ok ? r.d : { buchung: 'aus' };
    var offen = info.buchung === 'an' || (info.buchung === 'test' && testAnsicht);
    if (!offen) { zeigen('bald'); return; }
    formularSeite(info);
  });
})();
