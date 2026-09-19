/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Module der Produkt- und Rechtsseiten (neu-seiten.js)
   ══════════════════════════════════════════════════════════════════════════
   Reines Browser-JavaScript, keine Bibliothek, lädt nach neu.js. Jedes Modul
   startet nur, wenn sein Element auf der Seite steht:
   [data-filter] Filter-Chips · [data-preisrechner] Preisrechner ·
   [data-tarife] Schalter monatlich/Jahr · [data-vgl] Vergleich als Karten ·
   [data-datenweg] Datenweg-Grafik · [data-probe] Antwortzeit ·
   [data-doku] Kopieren, curl/JavaScript · .seitennav Scrollspy ·
   [data-suche] FAQ-Suche · [data-demoform] Demo-Anfrage ·
   [data-nf-suche] Seitensuche der 404 · CTA-Leiste auf Seiten ohne Held.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var API = 'https://ki-anruf.onrender.com';
  var RUHIG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, w) { return (w || document).querySelector(s); };
  var $$ = function (s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); };
  var de = function (n, nk) { return Number(n).toLocaleString('de-DE', { minimumFractionDigits: nk || 0, maximumFractionDigits: nk || 0 }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (s) { return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); };
  var merken = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };

  /* ── 1. Filter-Chips: blenden Gruppen ein und aus ───────────────────────── */
  function filter() {
    $$('[data-filter]').forEach(function (leiste) {
      var chips = $$('.chip[data-zeigt]', leiste), zahl = $('[data-filter-zahl]', leiste);
      var wurzel = leiste.getAttribute('data-filter') ? $(leiste.getAttribute('data-filter')) : document;
      var gruppen = $$('[data-gruppe]', wurzel || document);
      if (!chips.length || !gruppen.length) return;
      function setzen(wahl, scrollen) {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.getAttribute('data-zeigt') === wahl)); });
        var n = 0;
        gruppen.forEach(function (g) { var an = wahl === 'alle' || g.getAttribute('data-gruppe') === wahl; g.hidden = !an; if (an) n += $$('.karte, [data-eintrag]', g).length; });
        if (zahl) zahl.textContent = wahl === 'alle' ? zahl.getAttribute('data-alle') || '' : n + (n === 1 ? ' Eintrag' : ' Einträge');
        if (scrollen) { var erste = gruppen.filter(function (g) { return !g.hidden; })[0]; if (erste && erste.getBoundingClientRect().top < 0) erste.scrollIntoView({ behavior: RUHIG ? 'auto' : 'smooth', block: 'start' }); }
      }
      chips.forEach(function (c) { c.addEventListener('click', function () { setzen(c.getAttribute('data-zeigt'), true); }); });
      // Sprungmarke aus der Adresse (#wissen) wählt die Gruppe vor.
      var h = location.hash.replace('#', '');
      if (h && gruppen.some(function (g) { return g.getAttribute('data-gruppe') === h; })) setzen(h, false); else setzen('alle', false);
    });
  }

  /* ── 2. Preisrechner: Tarife stehen hier und nur hier ───────────────────── */
  var TARIFE = [{ id: 'klein', name: 'Klein', preis: 49, minuten: 250, extra: 0.19 }, { id: 'standard', name: 'Standard', preis: 99, minuten: 700, extra: 0.15 }, { id: 'gross', name: 'Groß', preis: 249, minuten: 2000, extra: 0.11 }];
  var SMS_PREIS = 0.09;
  function fuellung(e) { var min = +e.min, max = +e.max; e.style.setProperty('--p', ((e.value - min) / (max - min) * 100) + '%'); }
  function preisrechner() {
    var r = $('[data-preisrechner]'); if (!r) return;
    var eAnrufe = $('#pAnrufe', r), eDauer = $('#pDauer', r), eSms = $('#pSms', r);
    var aus = function (n) { return $('[data-aus="' + n + '"]', r); };
    var letzter = null, raf = null;
    function eur(n) { return de(n, 2); }
    function rechne(animiert) {
      var anrufe = +eAnrufe.value, dauer = +eDauer.value / 10, smsAnteil = +eSms.value / 100;
      var minuten = Math.round(anrufe * dauer), smsZahl = Math.round(anrufe * smsAnteil);
      aus('anrufe').textContent = de(anrufe);
      aus('dauer').textContent = eur(dauer).replace(',00', '') + ' Min';
      aus('sms').textContent = smsAnteil ? Math.round(smsAnteil * 100) + ' %' : 'aus';
      var beste = null;
      TARIFE.forEach(function (t) { var ueber = Math.max(0, minuten - t.minuten), summe = t.preis + ueber * t.extra; if (!beste || summe < beste.summe) beste = { t: t, summe: summe, ueber: ueber }; });
      var sms = smsZahl * SMS_PREIS, gesamt = beste.summe + sms;
      aus('tarif').textContent = 'Tarif ' + beste.t.name;
      var ziel = aus('summe');
      if (animiert && !RUHIG && letzter !== null) {
        cancelAnimationFrame(raf); var von = letzter, start = performance.now();
        var schritt = function (now) { var p = Math.min(1, (now - start) / 380), e = 1 - Math.pow(1 - p, 3); ziel.textContent = eur(von + (gesamt - von) * e).replace(',00', ''); if (p < 1) raf = requestAnimationFrame(schritt); };
        raf = requestAnimationFrame(schritt);
      } else ziel.textContent = eur(gesamt).replace(',00', '');
      letzter = gesamt;
      var z = [['Grundpreis ' + beste.t.name, eur(beste.t.preis) + ' €'], [de(minuten) + ' Gesprächsminuten', beste.ueber ? de(beste.t.minuten) + ' inklusive' : 'im Tarif enthalten']];
      if (beste.ueber) z.push([de(beste.ueber) + ' Minuten darüber, je ' + eur(beste.t.extra) + ' €', eur(beste.ueber * beste.t.extra) + ' €']);
      if (smsZahl) z.push([de(smsZahl) + ' SMS, je ' + eur(SMS_PREIS) + ' €', eur(sms) + ' €']);
      aus('zeilen').innerHTML = z.map(function (x) { return '<div><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('');
      aus('fuss').textContent = 'Schätzung auf Basis Ihrer Angaben, netto zuzüglich Umsatzsteuer. Bei ' + de(anrufe) + ' Anrufen sind das rund ' + eur(gesamt / anrufe) + ' € je Anruf. Den verbindlichen Preis nennen wir im Angebot.';
      $$('[data-tarif-karte]').forEach(function (k) { k.classList.toggle('tarif--hl', k.getAttribute('data-tarif-karte') === beste.t.id); });
    }
    [eAnrufe, eDauer, eSms].forEach(function (e) { fuellung(e); e.addEventListener('input', function () { fuellung(e); rechne(true); }); });
    rechne(false);
  }

  /* ── 3. Tarifkarten: monatlich oder Jahresüberblick ─────────────────────── */
  function tarifschalter() {
    var t = $('[data-tarife]'), s = $('[data-tarif-schalter]'); if (!t || !s) return;
    var knoepfe = $$('button', s);
    function setzen(jahr) { t.classList.toggle('jahr', jahr); knoepfe.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-zeitraum') === 'jahr') === jahr)); }); }
    knoepfe.forEach(function (b) { b.addEventListener('click', function () { setzen(b.getAttribute('data-zeitraum') === 'jahr'); }); });
    setzen(false);
  }

  /* ── 4. Vergleich: Tabelle wird auf dem Handy zu Karten je Weg ──────────── */
  function vergleich() {
    var sec = $('[data-vgl]'); if (!sec) return;
    var tabelle = $('table', sec), ziel = $('[data-vgl-karten]', sec); if (!tabelle || !ziel) return;
    var koepfe = $$('thead th', tabelle).slice(1).map(function (th) { return th.textContent.trim(); });
    var zeilen = $$('tbody tr', tabelle).map(function (tr) { return { k: $('th', tr).textContent.trim(), w: $$('td', tr).map(function (td) { return td.innerHTML; }) }; });
    var wahl = koepfe.length - 1;
    var leiste = document.createElement('div'); leiste.className = 'filter'; leiste.setAttribute('role', 'group'); leiste.setAttribute('aria-label', 'Weg wählen');
    var karte = document.createElement('div'); karte.className = 'kachel vgl-karte'; karte.setAttribute('aria-live', 'polite');
    koepfe.forEach(function (k, i) { var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = k; b.setAttribute('aria-pressed', String(i === wahl)); b.addEventListener('click', function () { wahl = i; malen(); }); leiste.appendChild(b); });
    function malen() {
      $$('.chip', leiste).forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === wahl)); });
      karte.classList.toggle('vgl-karte--voc', wahl === koepfe.length - 1);
      karte.innerHTML = zeilen.map(function (z) { return '<div><b>' + esc(z.k) + '</b><span>' + z.w[wahl] + '</span></div>'; }).join('');
    }
    ziel.appendChild(leiste); ziel.appendChild(karte); malen();
    sec.classList.add('hat-karten');
  }

  /* ── 5. Datenweg: fünf Knoten, je Sprachweg anders ──────────────────────── */
  var IK = {
    anrufer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.7 2z"/></svg>',
    netz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg>',
    server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/></svg>',
    modell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></svg>',
    bereich: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 21h8M12 18v3M6 9h5M6 13h8"/></svg>'
  };
  var WEGE = {
    realtime: { name: 'OpenAI GPT-Realtime', knoten: [
      ['anrufer', 'Anrufer', 'ruft Ihre Nummer an', ''], ['netz', 'Telnyx', 'Telefonnetz, verschlüsselt', 'EU / USA', 'eu'], ['server', 'Vocaris-Server', 'Frankfurt: nimmt das Audio entgegen, führt Regeln, Wissen und Werkzeuge', 'EU', 'eu'], ['modell', 'OpenAI', 'verarbeitet das Gesprächsaudio in Echtzeit', 'USA', 'us'], ['bereich', 'Kundenbereich', 'Mitschrift, Nachrichten, Termine liegen in Frankfurt', 'EU', 'eu']],
      text: 'Unser Server in Frankfurt nimmt das Gesprächsaudio entgegen und übermittelt es zur Verarbeitung an OpenAI in den USA. Wissensdatenbank, Transkripte und Nachrichten bleiben in Frankfurt. Grundlage der Übermittlung sind die EU-Standardvertragsklauseln beziehungsweise das EU-US Data Privacy Framework.' },
    grok: { name: 'xAI Grok Voice', knoten: [
      ['anrufer', 'Anrufer', 'ruft Ihre Nummer an', ''], ['netz', 'Telnyx', 'Telefonnetz, verschlüsselt', 'EU / USA', 'eu'], ['server', 'Vocaris-Server', 'Frankfurt: nimmt das Audio entgegen, führt Regeln, Wissen und Werkzeuge', 'EU', 'eu'], ['modell', 'xAI', 'verarbeitet das Gesprächsaudio in Echtzeit', 'USA', 'us'], ['bereich', 'Kundenbereich', 'Mitschrift, Nachrichten, Termine liegen in Frankfurt', 'EU', 'eu']],
      text: 'Wie bei GPT-Realtime: Der Vocaris-Server in Frankfurt nimmt das Audio entgegen und reicht es an xAI in den USA weiter. Datenhaltung in Frankfurt, Übermittlung auf Grundlage der EU-Standardvertragsklauseln.' },
    gemini: { name: 'Google Gemini Live', knoten: [
      ['anrufer', 'Anrufer', 'ruft Ihre Nummer an', ''], ['netz', 'Telnyx', 'Telefonnetz, verschlüsselt', 'EU / USA', 'eu'], ['server', 'Vocaris-Server', 'Frankfurt: nimmt das Audio entgegen, führt Regeln, Wissen und Werkzeuge', 'EU', 'eu'], ['modell', 'Google', 'verarbeitet das Gesprächsaudio in Echtzeit, erkennt die Sprache des Anrufers', 'USA', 'us'], ['bereich', 'Kundenbereich', 'Mitschrift, Nachrichten, Termine liegen in Frankfurt', 'EU', 'eu']],
      text: 'Der Vocaris-Server in Frankfurt nimmt das Audio entgegen und reicht es an Google in den USA weiter. Gemini erkennt die Sprache des Anrufers selbst. Datenhaltung in Frankfurt, Übermittlung auf Grundlage der EU-Standardvertragsklauseln.' },
    mistral: { name: 'Mistral (europäischer Weg)', knoten: [
      ['anrufer', 'Anrufer', 'ruft Ihre Nummer an', ''], ['netz', 'Telnyx', 'Telefonnetz, verschlüsselt', 'EU / USA', 'eu'], ['server', 'Vocaris-Server', 'Frankfurt: wandelt Sprache in Text, führt Regeln, Wissen und Werkzeuge', 'EU', 'eu'], ['modell', 'Mistral AI', 'versteht und antwortet, Verarbeitung in der EU', 'EU', 'eu'], ['bereich', 'Kundenbereich', 'Mitschrift, Nachrichten, Termine liegen in Frankfurt', 'EU', 'eu']],
      text: 'Voreinstellung für neue Firmen: Sprachverarbeitung und Datenhaltung bleiben in der EU. Die Strecke braucht etwas länger, weil sie Sprache erst in Text wandelt, dann denkt, dann wieder spricht. Dafür verlässt kein Ton die EU.' },
    live: { name: 'OpenAI GPT-Live', knoten: [
      ['anrufer', 'Anrufer', 'ruft Ihre Nummer an', ''], ['netz', 'Telnyx', 'übergibt den Anruf per SIP über TLS, Audio als SRTP', 'EU / USA', 'eu'], ['modell', 'OpenAI', 'verarbeitet das Gesprächsaudio direkt, hört und spricht gleichzeitig', 'USA', 'us'], ['server', 'Vocaris-Server', 'Frankfurt: Kontrollkanal für Anweisung, Wissen, Werkzeuge und Mitschrift', 'EU', 'eu'], ['bereich', 'Kundenbereich', 'Mitschrift, Nachrichten, Termine liegen in Frankfurt', 'EU', 'eu']],
      text: 'Bei GPT-Live wandert der Anruf per verschlüsseltem SIP direkt zu OpenAI, statt als Tonstrom über den Vocaris-Server zu laufen. Anweisung, Wissen und Stimme kommen weiterhin von Vocaris; Mitschrift und Verbrauch kommen über einen Kontrollkanal zurück und werden in Frankfurt gespeichert. Sie wählen diesen Weg je Rufnummer bewusst dazu.' }
  };
  function datenweg() {
    $$('[data-datenweg]').forEach(function (box) {
      var grafik = $('[data-datenweg-grafik]', box), text = $('[data-datenweg-text]', box), titel = $('[data-datenweg-titel]', box), knoepfe = $$('[data-weg]', box);
      if (!grafik) return;
      function malen(id) {
        var w = WEGE[id]; if (!w) return;
        knoepfe.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-weg') === id)); });
        grafik.innerHTML = w.knoten.map(function (k) {
          var pille = k[3] ? '<span class="pille">' + esc(k[3]) + '</span>' : '';
          return '<div class="knoten' + (k[4] ? ' knoten--' + k[4] : '') + '">' + IK[k[0]] + '<b>' + esc(k[1]) + '</b><span>' + esc(k[2]) + '</span>' + pille + '</div>';
        }).join('');
        if (titel) titel.textContent = w.name;
        if (text) text.textContent = w.text;
      }
      knoepfe.forEach(function (b) { b.addEventListener('click', function () { malen(b.getAttribute('data-weg')); }); });
      malen(box.getAttribute('data-datenweg') || 'mistral');
    });
  }

  /* ── 6. Antwortzeit: Balken laufen in Echtzeit ──────────────────────────── */
  function probe() {
    var box = $('[data-probe]'); if (!box) return;
    var reihen = $$('[data-ms]', box), start = $('[data-probe-start]', box), timer = [];
    function los() {
      timer.forEach(clearTimeout); timer = [];
      var max = Math.max.apply(null, reihen.map(function (r) { return +r.getAttribute('data-ms'); }));
      reihen.forEach(function (r) {
        var ms = +r.getAttribute('data-ms'), balken = $('.probe__balken', r), wert = $('.probe__wert', r);
        balken.style.transition = 'none'; balken.style.width = '0'; wert.textContent = '…';
        if (RUHIG) { balken.style.width = (ms / max * 100) + '%'; wert.textContent = de(ms / 1000, 1) + ' s'; return; }
        timer.push(setTimeout(function () { balken.style.transition = 'width ' + ms + 'ms linear'; balken.style.width = (ms / max * 100) + '%'; }, 60));
        timer.push(setTimeout(function () { wert.textContent = de(ms / 1000, 1) + ' s'; }, ms + 80));
      });
    }
    if (start) start.addEventListener('click', los);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); los(); } }, { threshold: 0.4 }).observe(box);
    else los();
  }

  /* ── 7. API-Doku: Kopieren, curl → JavaScript, Scrollspy ────────────────── */
  function curlZuJs(curl) {
    var t = curl.replace(/\\\n\s*/g, ' ').trim();
    if (!/^curl\b/.test(t)) return null;
    var methode = (t.match(/-X\s+([A-Z]+)/) || [])[1] || 'GET';
    var url = (t.match(/https?:\/\/[^\s"']+/) || [])[0]; if (!url) return null;
    var koepfe = []; t.replace(/-H\s+"([^"]+)"/g, function (m, h) { var i = h.indexOf(':'); koepfe.push([h.slice(0, i).trim(), h.slice(i + 1).trim()]); return m; });
    var body = (t.match(/-d\s+'([\s\S]*?)'\s*$/) || t.match(/-d\s+'([\s\S]*?)'/) || [])[1];
    var zeilen = ['const antwort = await fetch("' + url + '", {'];
    if (methode !== 'GET') zeilen.push('  method: "' + methode + '",');
    var h = koepfe.filter(function (k) { return k[0].toLowerCase() !== 'content-type' || body; });
    if (h.length) zeilen.push('  headers: {' + h.map(function (k) { return ' "' + k[0] + '": "' + k[1] + '"'; }).join(',') + ' },');
    if (body) { var js = body; try { js = JSON.stringify(JSON.parse(body)); } catch (e) {} zeilen.push('  body: JSON.stringify(' + js + '),'); }
    zeilen.push('});', 'const daten = await antwort.json();');
    return zeilen.join('\n');
  }
  function doku() {
    var doku = $('[data-doku]'); if (!doku) return;
    var sprache = merken('vocaris.api.sprache') || 'curl', umschalter = [];
    var IK_KOPIE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    function alleSetzen(s) {
      sprache = s; merken('vocaris.api.sprache', s);
      umschalter.forEach(function (u) { u(); });
    }
    $$('pre.code', doku).forEach(function (pre) {
      var wrap = document.createElement('div'); wrap.className = 'codeblock'; pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre);
      var leiste = document.createElement('div'); leiste.className = 'codeblock__leiste'; wrap.appendChild(leiste); wrap.classList.add('codeblock--leiste');
      var curl = pre.textContent, js = pre.hasAttribute('data-curl') ? curlZuJs(curl) : null, preJs = null;
      if (js) {
        preJs = document.createElement('pre'); preJs.className = 'code'; preJs.hidden = true; var c = document.createElement('code'); c.textContent = js; preJs.appendChild(c); wrap.appendChild(preJs);
        var bCurl = document.createElement('button'), bJs = document.createElement('button');
        [bCurl, bJs].forEach(function (b) { b.type = 'button'; b.className = 'codeblock__sprache'; });
        bCurl.textContent = 'curl'; bJs.textContent = 'JavaScript';
        bCurl.addEventListener('click', function () { alleSetzen('curl'); }); bJs.addEventListener('click', function () { alleSetzen('js'); });
        leiste.appendChild(bCurl); leiste.appendChild(bJs);
        umschalter.push(function () { var j = sprache === 'js'; pre.hidden = j; preJs.hidden = !j; bCurl.setAttribute('aria-pressed', String(!j)); bJs.setAttribute('aria-pressed', String(j)); });
      }
      var k = document.createElement('button'); k.type = 'button'; k.className = 'codeblock__kopieren'; k.innerHTML = IK_KOPIE + '<span>Kopieren</span>'; k.setAttribute('aria-label', 'Code kopieren');
      k.addEventListener('click', function () {
        var text = (preJs && !preJs.hidden ? preJs : pre).textContent;
        var fertig = function () { k.classList.add('ok'); k.lastChild.textContent = 'Kopiert'; setTimeout(function () { k.classList.remove('ok'); k.lastChild.textContent = 'Kopieren'; }, 1600); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(fertig, fertig);
        else { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); try { document.execCommand('copy'); } catch (e) {} fertig(); }
      });
      leiste.appendChild(k);
    });
    $$('[data-sprache]', doku).forEach(function (b) {
      b.addEventListener('click', function () { alleSetzen(b.getAttribute('data-sprache')); });
      umschalter.push(function () { b.setAttribute('aria-pressed', String(b.getAttribute('data-sprache') === sprache)); });
    });
    umschalter.forEach(function (u) { u(); });
  }

  /* ── 8. Seitennavigation: markiert den sichtbaren Abschnitt ─────────────── */
  function seitennav() {
    var nav = $('.seitennav'); if (!nav) return;
    var links = $$('a[href^="#"]', nav), ziele = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if (!ziele.length) return;
    var aktiv = null;
    function setzen(id) {
      if (id === aktiv) return; aktiv = id;
      links.forEach(function (a) { var an = a.getAttribute('href') === '#' + id; a.classList.toggle('aktiv', an); if (an) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      var a = $('a.aktiv', nav); if (a && window.matchMedia('(max-width: 900px)').matches) { var r = a.getBoundingClientRect(), n = nav.getBoundingClientRect(); if (r.left < n.left || r.right > n.right) nav.scrollTo({ left: nav.scrollLeft + r.left - n.left - 16, behavior: RUHIG ? 'auto' : 'smooth' }); }
    }
    function mal() {
      var grenze = Math.min(260, innerHeight * 0.32), best = ziele[0];
      ziele.forEach(function (z) { if (z.getBoundingClientRect().top <= grenze) best = z; });
      setzen(best.id);
    }
    addEventListener('scroll', mal, { passive: true }); addEventListener('resize', mal); mal();
  }

  /* ── 9. FAQ-Suche: filtert Frage und Antwort ────────────────────────────── */
  function fragenSuche() {
    var feld = $('[data-suche]'); if (!feld) return;
    var wurzel = $(feld.getAttribute('data-suche')) || document, stand = $('[data-such-stand]'), leer = $('[data-such-leer]'), leeren = $('[data-such-leeren]');
    var eintraege = $$('.fragen details', wurzel).map(function (d) { return { el: d, text: norm(d.textContent) }; });
    var gruppen = $$('.fragen-gruppe', wurzel);
    function suchen() {
      var w = norm(feld.value.trim()), woerter = w.split(/\s+/).filter(function (x) { return x.length > 1; }), n = 0;
      eintraege.forEach(function (e) { var an = !woerter.length || woerter.every(function (x) { return e.text.indexOf(x) > -1; }); e.el.hidden = !an; if (an) n++; if (woerter.length && an) e.el.open = true; else if (!woerter.length) e.el.open = false; });
      gruppen.forEach(function (g) { g.hidden = !$$('.fragen details', g).some(function (d) { return !d.hidden; }); });
      if (stand) stand.textContent = woerter.length ? (n ? n + (n === 1 ? ' Antwort' : ' Antworten') + ' zu „' + feld.value.trim() + '“' : '') : '';
      if (leer) leer.hidden = !(woerter.length && !n);
      if (leeren) leeren.hidden = !feld.value;
    }
    feld.addEventListener('input', suchen);
    if (leeren) leeren.addEventListener('click', function () { feld.value = ''; suchen(); feld.focus(); });
    var q = new URLSearchParams(location.search).get('q'); if (q) feld.value = q;
    suchen();
  }

  /* ── 10. Demo-Anfrage: exakt wie bisher (POST /api/demo-request) ────────── */
  function demoformular() {
    var f = $('[data-demoform]'); if (!f) return;
    var err = $('[data-err]', f), btn = $('button[type=submit]', f);
    f.addEventListener('submit', function (e) {
      e.preventDefault(); err.textContent = '';
      var wert = function (id) { var el = $('#' + id, f); return el ? el.value.trim() : ''; };
      var data = { name: wert('name'), company: wert('company'), email: wert('email'), phone: wert('phone'), message: wert('message') };
      var emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email), phoneOk = data.phone.replace(/[^\d]/g, '').length >= 6;
      if (!emailOk && !phoneOk) { err.textContent = 'Bitte geben Sie eine E-Mail-Adresse oder eine Telefonnummer an.'; ($('#email', f) || {}).focus && $('#email', f).focus(); return; }
      btn.disabled = true; var old = btn.textContent; btn.textContent = 'Wird gesendet…';
      fetch(API + '/api/demo-request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok) { err.textContent = (res.d && res.d.error) || 'Konnte nicht gesendet werden.'; btn.disabled = false; btn.textContent = old; return; }
          var s = document.createElement('div'); s.className = 'formerfolg formerfolg--gross'; s.setAttribute('role', 'status');
          s.innerHTML = '<b>Vielen Dank.</b><span>Ihre Anfrage ist bei uns. Wir melden uns in Kürze, meist noch am selben Werktag.</span>';
          f.replaceWith(s);
        })
        .catch(function () { err.textContent = 'Server gerade nicht erreichbar. Bitte in einem Moment erneut versuchen.'; btn.disabled = false; btn.textContent = old; });
    });
  }

  /* ── 11. Seite nicht gefunden: kleine Seitensuche ───────────────────────── */
  function nichtGefunden() {
    var q = $('[data-nf-suche]'), out = $('[data-nf-treffer]'); if (!q || !out) return;
    var S = [
      ['/', 'Startseite', 'KI-Telefonassistent, Testanruf, Preise'], ['/funktionen.html', 'Funktionen', 'Termine, Weiterleitung, E-Mail nach jedem Anruf, Datenschutz'], ['/preise.html', 'Preise', 'Ab 49 € im Monat, Preisrechner, Tarife'], ['/vergleich.html', 'Vergleich', 'Anrufbeantworter, Telefonservice, Telefonanlage, KI-Assistent'], ['/branchen.html', 'Branchen', 'Alle 17 Branchen'], ['/fragen.html', 'Häufige Fragen', 'Antworten vor der Entscheidung'], ['/ki-modelle.html', 'KI-Modelle', 'Sprachmodelle, Sprachen, europäische Option'], ['/sicherheit.html', 'Sicherheit', 'DSGVO, EU-Hosting, AV-Vertrag'], ['/schnittstellen.html', 'Schnittstellen', 'Ticketsystem, CRM, Kalender, Teamchat'], ['/api.html', 'API', 'Endpunkte, Webhooks, curl-Beispiele'], ['/demo.html', 'Demo buchen', 'Persönliche Einrichtung, Kontakt'], ['/ratgeber.html', 'Ratgeber', 'Erreichbarkeit und Telefon im Betrieb'],
      ['/restaurants.html', 'Gastronomie', 'Restaurant, Tisch, Reservierung'], ['/arztpraxen.html', 'Arztpraxen', 'Praxis, Zahnarzt, Patienten, Termine'], ['/handwerk.html', 'Handwerk & Bau', 'Baustelle, Notfall, Auftrag'], ['/autowerkstatt.html', 'Kfz & Autowerkstatt', 'Werkstatt, Auto, Termin'], ['/friseur.html', 'Friseur & Salon', 'Salon, Kosmetik, Termine'], ['/kanzlei.html', 'Kanzleien', 'Anwalt, Steuerberater, Mandanten'], ['/hotel.html', 'Hotellerie', 'Hotel, Rezeption, Zimmer'], ['/hausverwaltung.html', 'Hausverwaltung', 'Mieter, Schaden, Notdienst'], ['/immobilienmakler.html', 'Immobilien', 'Makler, Besichtigung, Objekt'], ['/pflegedienst.html', 'Ambulante Pflege', 'Pflegedienst, Angehörige'], ['/apotheke.html', 'Apotheke', 'Notdienst, Vorbestellung'], ['/versicherungsmakler.html', 'Versicherung', 'Schaden, Makler'], ['/software.html', 'Software & SaaS', 'Support, Helpdesk'], ['/onlineshop.html', 'Onlinehandel', 'Shop, Bestellung, Retoure'], ['/physiotherapie.html', 'Physiotherapie', 'Rezept, Therapie'], ['/tierarzt.html', 'Tierarztpraxis', 'Tierarzt, Notfall'], ['/fitnessstudio.html', 'Fitness & Studio', 'Probetraining, Mitglieder'],
      ['/impressum.html', 'Impressum', 'Anbieter, Kontakt'], ['/datenschutz.html', 'Datenschutz', 'Datenschutzerklärung'], ['/agb.html', 'AGB', 'Vertragsbedingungen']
    ];
    function zeig() {
      var w = norm(q.value.trim()); out.innerHTML = '';
      if (w.length < 2) return;
      var woerter = w.split(/\s+/).filter(function (x) { return x.length > 1; });
      var t = S.filter(function (s) { var tx = norm(s[1] + ' ' + s[2]); return woerter.some(function (x) { return tx.indexOf(x) > -1; }); }).slice(0, 6);
      if (!t.length) { out.innerHTML = '<li class="leer">Nichts gefunden. Versuchen Sie es mit der Startseite oder einer Branche.</li>'; return; }
      t.forEach(function (s) { var li = document.createElement('li'); var a = document.createElement('a'); a.className = 'kachel kachel--hebt'; a.href = s[0]; a.textContent = s[1]; var sm = document.createElement('small'); sm.textContent = s[2]; a.appendChild(sm); li.appendChild(a); out.appendChild(li); });
    }
    q.addEventListener('input', zeig);
    var teil = decodeURIComponent(location.pathname.replace(/^\/|\.html$/g, '').replace(/[-_\/]+/g, ' ')).trim();
    if (teil && teil.length > 1 && teil.length < 40 && teil !== '404') { q.value = teil; zeig(); }
  }

  /* ── 12. CTA-Leiste auf Seiten ohne dunklen Held ────────────────────────── */
  function ctaleiste() {
    var leiste = $('[data-ctaleiste]'), kopf = $('[data-seitenkopf]'); if (!leiste || !kopf || $('.held')) return;
    var ziel = $('#testanruf'), kopfWeg = false, zielDa = false;
    var setzen = function () { var an = kopfWeg && !zielDa && innerWidth <= 640 && !document.body.classList.contains('menue-offen'); leiste.classList.toggle('da', an); leiste.setAttribute('aria-hidden', String(!an)); $$('a', leiste).forEach(function (a) { a.tabIndex = an ? 0 : -1; }); };
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) { kopfWeg = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; setzen(); }, { threshold: 0 }).observe(kopf);
    if (ziel) new IntersectionObserver(function (es) { zielDa = es[0].isIntersecting; setzen(); }, { threshold: 0.15 }).observe(ziel);
    addEventListener('resize', setzen);
  }

  filter(); preisrechner(); tarifschalter(); vergleich(); datenweg(); probe(); doku(); seitennav(); fragenSuche(); demoformular(); nichtGefunden(); ctaleiste();
})();
