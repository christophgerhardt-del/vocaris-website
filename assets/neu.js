/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Module der neuen Website (neu.js)
   ══════════════════════════════════════════════════════════════════════════
   Reines Browser-JavaScript, keine Bibliothek. Jedes Modul startet nur, wenn
   sein Element auf der Seite steht. Inhalte stehen im HTML (der Simulator
   trägt einen Beispiel-Dialog im Markup), hier wird bewegt, gezählt,
   getippt und gerechnet. Wer Bewegung abbestellt hat (prefers-reduced-
   motion), bekommt den Endzustand sofort.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var API = 'https://ki-anruf.onrender.com';
  var RUHIG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, w) { return (w || document).querySelector(s); };
  var $$ = function (s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); };
  var de = function (n, nk) { return Number(n).toLocaleString('de-DE', { minimumFractionDigits: nk || 0, maximumFractionDigits: nk || 0 }); };
  var mmss = function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ── 1. Kopfzeile: fest nach dem Held, Flyout, Vollbildmenü ─────────────── */
  function kopf() {
    var k = $('#kopf'); if (!k) return;
    var fest = function () { k.classList.toggle('fest', window.scrollY > 24); };
    addEventListener('scroll', fest, { passive: true }); fest();

    $$('[data-flyout]').forEach(function (d) {
      var zu;
      if (window.matchMedia('(hover: hover)').matches) {
        d.addEventListener('mouseenter', function () { clearTimeout(zu); d.open = true; });
        d.addEventListener('mouseleave', function () { zu = setTimeout(function () { d.open = false; }, 260); });
      }
      document.addEventListener('click', function (e) { if (!d.contains(e.target)) d.open = false; });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && d.open) { d.open = false; d.querySelector('summary').focus(); } });
    });

    var knopf = $('[data-menueknopf]'), menue = $('#mobilmenue');
    if (!knopf || !menue) return;
    var setzen = function (offen) {
      document.body.classList.toggle('menue-offen', offen);
      menue.hidden = !offen;
      knopf.setAttribute('aria-expanded', String(offen));
      knopf.setAttribute('aria-label', offen ? 'Menü schließen' : 'Menü öffnen');
    };
    knopf.addEventListener('click', function () { setzen(!document.body.classList.contains('menue-offen')); });
    $$('a', menue).forEach(function (a) { a.addEventListener('click', function () { setzen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.body.classList.contains('menue-offen')) { setzen(false); knopf.focus(); } });
    addEventListener('resize', function () { if (innerWidth > 900) setzen(false); });
  }

  /* ── 2. Enthüllung beim Scrollen ────────────────────────────────────────── */
  function zeigen() {
    var ziele = $$('[data-zeig], [data-staffel]');
    if (!ziele.length) return;
    if (RUHIG || !('IntersectionObserver' in window)) { ziele.forEach(function (e) { e.classList.add('da'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
    ziele.forEach(function (e) { io.observe(e); });
  }

  /* ── 3. Zahlen zählen hoch ──────────────────────────────────────────────── */
  function zaehlen(el, ziel, nk, dauer) {
    var start = performance.now(), von = 0;
    if (RUHIG) { el.textContent = de(ziel, nk); return; }
    var t = function (now) {
      var p = Math.min(1, (now - start) / (dauer || 900)), e = 1 - Math.pow(1 - p, 3);
      el.textContent = de(von + (ziel - von) * e, nk);
      if (p < 1) requestAnimationFrame(t); else el.textContent = de(ziel, nk);
    };
    requestAnimationFrame(t);
  }
  function zaehler() {
    var ziele = $$('[data-zaehl]'); if (!ziele.length) return;
    var los = function (el) { zaehlen(el, parseFloat(el.getAttribute('data-zaehl')), parseInt(el.getAttribute('data-nk') || '0', 10), 1100); };
    if (!('IntersectionObserver' in window)) { ziele.forEach(los); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { los(e.target); io.unobserve(e.target); } }); }, { threshold: 0.5 });
    ziele.forEach(function (e) { io.observe(e); });
  }

  /* ── 4. Anruf-Simulator ─────────────────────────────────────────────────── */
  // 5 Branchen × 4 Situationen. a = Anrufer, v = Vocaris. Das Ergebnis ist die
  // Kachel, die danach im Kundenbereich steht (Nachricht, Termin, Vorgang).
  var DIALOGE = {
    praxis: {
      name: 'Praxis',
      termin: { z: [['a', 'Guten Tag, ich hätte gern einen Termin zur Kontrolle.'], ['v', 'Guten Tag! Sehr gerne. Diese Woche hätte ich Donnerstag um 14:30 Uhr frei. Würde Ihnen das passen?'], ['a', 'Donnerstag ist schlecht. Geht auch Freitag?'], ['v', 'Natürlich. Am Freitag habe ich um 10 Uhr oder um 16 Uhr etwas frei.'], ['a', 'Zehn Uhr passt.'], ['v', 'Wunderbar, dann trage ich Sie für Freitag um 10 Uhr ein. Sie bekommen gleich eine Bestätigung per SMS.']],
        e: { typ: 'Termin', titel: 'Kontrolle', zeit: 'Fr, 10:00', zeilen: [['Anrufer', '+49 170 1234567'], ['Bestätigt', 'per SMS']], knoepfe: ['Im Kalender öffnen', 'Verschieben'] } },
      notfall: { z: [['a', 'Mein Vater hat seit einer Stunde starke Schmerzen in der Brust.'], ['v', 'Das klingt nach einem Notfall. Bitte legen Sie auf und wählen Sie sofort die 112. Soll ich zusätzlich die Praxis informieren?'], ['a', 'Ja, bitte.'], ['v', 'Die Praxis ist benachrichtigt, Frau Dr. Sommer sieht die Nachricht sofort. Bitte rufen Sie jetzt die 112.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#17 Notfall: Brustschmerz, auf 112 verwiesen', zeit: 'jetzt', zeilen: [['Priorität', 'hoch'], ['SMS an', 'Dr. Sommer, gesendet']], knoepfe: ['Zurückrufen', 'Erledigt'] } },
      frage: { z: [['a', 'Haben Sie am Freitagnachmittag Sprechstunde?'], ['v', 'Freitags ist die Praxis von 8 bis 13 Uhr geöffnet, nachmittags geschlossen. Möchten Sie einen Termin am Vormittag?'], ['a', 'Nein danke, ich wollte nur kurz fragen. Und Folgerezepte?'], ['v', 'Folgerezepte bestellen Sie telefonisch oder über die Website, abholbereit sind sie am nächsten Werktag ab 10 Uhr.'], ['a', 'Super, danke.']],
        e: { typ: 'Anruf', pille: 'grau', titel: 'Öffnungszeiten, Rezepte', zeit: '0:41 Min', zeilen: [['Beantwortet', 'aus der Wissensdatenbank'], ['Stimmung', 'positiv']], knoepfe: ['Transkript', 'Nummer sperren'] } },
      nachts: { z: [['a', 'Guten Abend, ich habe seit gestern starke Ohrenschmerzen und brauche dringend einen Termin.'], ['v', 'Die Praxis ist gerade geschlossen, morgen ab 8 Uhr wieder erreichbar. Ich kann Sie für morgen um 8:20 Uhr als Akutfall eintragen. Wird es unerträglich, erreichen Sie den Bereitschaftsdienst unter 116 117.'], ['a', '8:20 Uhr ist gut, bitte eintragen.'], ['v', 'Erledigt. Ich habe Sie unter dem Namen Kern für morgen 8:20 Uhr notiert, die Praxis sieht es morgen früh als Erstes.']],
        e: { typ: 'Termin', titel: 'Akutfall, Ohrenschmerzen', zeit: 'morgen, 08:20', zeilen: [['Anrufer', 'Kern, +49 151 2345678'], ['Angenommen', '22:47 Uhr, außerhalb der Zeiten']], knoepfe: ['Im Kalender öffnen', 'Zurückrufen'] } }
    },
    handwerk: {
      name: 'Handwerk',
      termin: { z: [['a', 'Ich bräuchte jemanden für die Wartung unserer Gastherme.'], ['v', 'Gerne. Um welche Adresse geht es, und passt es Ihnen eher vormittags oder nachmittags?'], ['a', 'Lindenweg 12 in Augsburg, am liebsten vormittags.'], ['v', 'Nächste Woche Dienstag zwischen 8 und 10 Uhr ist noch frei. Soll ich das eintragen?'], ['a', 'Ja, passt.'], ['v', 'Eingetragen. Herr Maier meldet sich am Montag kurz zur Bestätigung.']],
        e: { typ: 'Vorgang', titel: '#31 Wartung Gastherme, Lindenweg 12', zeit: 'Di, 8–10 Uhr', zeilen: [['Zuständig', 'Maier'], ['Kategorie', 'Wartung']], knoepfe: ['Anrufen', 'In Arbeit'] } },
      notfall: { z: [['a', 'Bei uns läuft Wasser aus der Decke, direkt auf den Sicherungskasten!'], ['v', 'Bitte schalten Sie, wenn gefahrlos möglich, den Hauptschalter aus und drehen Sie den Haupthahn zu. Ich verbinde Sie sofort mit dem Notdienst. Wie lautet die Adresse?'], ['a', 'Gartenstraße 4, Erdgeschoss.'], ['v', 'Danke. Ich stelle jetzt zu Herrn Berger durch, bleiben Sie bitte dran.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#32 Wasserschaden, Gartenstraße 4', zeit: 'jetzt', zeilen: [['Priorität', 'hoch'], ['Durchgestellt', 'Bereitschaft Berger, 0:38']], knoepfe: ['Zurückrufen', 'SMS an Anrufer'] } },
      frage: { z: [['a', 'Machen Sie auch Wärmepumpen?'], ['v', 'Ja, wir planen und installieren Wärmepumpen und beraten zur Förderung. Möchten Sie ein unverbindliches Beratungsgespräch vor Ort?'], ['a', 'Erst mal nur die Frage: Was kostet so eine Beratung?'], ['v', 'Die Erstberatung vor Ort ist kostenlos. Soll ich Ihre Nummer für einen Rückruf notieren?'], ['a', 'Ja, gern.']],
        e: { typ: 'Nachricht', titel: 'Rückruf: Beratung Wärmepumpe', zeit: '14:32', zeilen: [['Anrufer', '+49 821 987654'], ['Thema', 'Wärmepumpe, Förderung']], knoepfe: ['Zurückrufen', 'Vorgang anlegen'] } },
      nachts: { z: [['a', 'Hallo, ist da noch jemand? Unsere Heizung ist ausgefallen.'], ['v', 'Sie sprechen mit dem Assistenten von Sanitär Maier, das Büro ist bis morgen 7 Uhr geschlossen. Ist die Heizung komplett aus, oder wird sie nur nicht warm?'], ['a', 'Komplett aus, und draußen sind es minus zwei Grad.'], ['v', 'Verstanden. Bei einem Totalausfall bei Frost gebe ich das an den Notdienst weiter, er ruft Sie innerhalb von 30 Minuten zurück. Wie lautet Ihre Adresse?'], ['a', 'Bergstraße 7 in Friedberg.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#33 Heizungsausfall bei Frost, Bergstraße 7', zeit: '23:08', zeilen: [['Priorität', 'hoch, Notdienst per SMS'], ['Rückruf', 'zugesagt binnen 30 Min']], knoepfe: ['Anrufen', 'In Arbeit'] } }
    },
    restaurant: {
      name: 'Restaurant',
      termin: { z: [['a', 'Ich möchte für Samstag einen Tisch für sechs Personen reservieren.'], ['v', 'Gerne. Um wie viel Uhr möchten Sie kommen?'], ['a', 'So gegen halb acht.'], ['v', 'Um 19:30 Uhr habe ich für sechs Personen noch einen Tisch im Wintergarten. Auf welchen Namen darf ich reservieren?'], ['a', 'Berger.'], ['v', 'Reserviert: Samstag, 19:30 Uhr, sechs Personen, Berger. Die Bestätigung kommt per SMS. Wir freuen uns auf Sie!']],
        e: { typ: 'Reservierung', titel: 'Berger, 6 Personen', zeit: 'Sa, 19:30', zeilen: [['Tisch', '12, Wintergarten'], ['Bestätigt', 'per SMS']], knoepfe: ['Im Tischplan', 'Ändern'] } },
      notfall: { z: [['a', 'Wir haben eben bei Ihnen gegessen, meine Frau hat eine Nussallergie, und jetzt schwillt ihr Hals an.'], ['v', 'Wenn Atemnot besteht, rufen Sie bitte sofort die 112. Ich gebe die Information umgehend an die Küche weiter. Welches Gericht war es?'], ['a', 'Die Tagliatelle mit Pesto.'], ['v', 'Danke. Die Küche ist informiert, das Team meldet sich bei Ihnen. Bitte kümmern Sie sich jetzt um Ihre Frau.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#8 Allergie-Meldung: Tagliatelle Pesto', zeit: 'jetzt', zeilen: [['Priorität', 'hoch, an Küche'], ['SMS an', 'Inhaber, gesendet']], knoepfe: ['Zurückrufen', 'Erledigt'] } },
      frage: { z: [['a', 'Haben Sie auch vegane Gerichte?'], ['v', 'Ja, aktuell drei: Risotto mit Pilzen, Gemüselasagne und die Pasta all’arrabbiata. Die Karte wechselt wöchentlich.'], ['a', 'Und kann man draußen sitzen?'], ['v', 'Ja, die Terrasse ist bei gutem Wetter geöffnet, Sie können dafür auch reservieren.'], ['a', 'Prima, dann komme ich vorbei.']],
        e: { typ: 'Anruf', pille: 'grau', titel: 'Speisekarte, Terrasse', zeit: '0:52 Min', zeilen: [['Beantwortet', 'aus der Wissensdatenbank'], ['Stimmung', 'positiv']], knoepfe: ['Transkript', 'Gast anlegen'] } },
      nachts: { z: [['a', 'Hallo, ich wollte für morgen Mittag reservieren.'], ['v', 'Gerne, auch jetzt noch. Für wie viele Personen und um welche Uhrzeit?'], ['a', 'Zwei Personen, 12:30 Uhr.'], ['v', 'Morgen um 12:30 Uhr ist für zwei Personen frei. Auf welchen Namen darf ich reservieren?'], ['a', 'Weidner.'], ['v', 'Reserviert, Frau Weidner. Bis morgen um 12:30 Uhr, die Bestätigung schicke ich per SMS.']],
        e: { typ: 'Reservierung', titel: 'Weidner, 2 Personen', zeit: 'morgen, 12:30', zeilen: [['Angenommen', '23:14 Uhr, nach Feierabend'], ['Bestätigt', 'per SMS']], knoepfe: ['Im Tischplan', 'Ändern'] } }
    },
    kanzlei: {
      name: 'Kanzlei',
      termin: { z: [['a', 'Ich brauche einen Termin wegen einer Kündigung, die ich gestern bekommen habe.'], ['v', 'Das ist eilig, bei Kündigungen gilt eine Frist von drei Wochen. Frau Berger hat am Donnerstag um 11 Uhr einen Termin frei. Passt das?'], ['a', 'Ja, das geht.'], ['v', 'Bitte bringen Sie die Kündigung und Ihren Arbeitsvertrag mit. Ihren Namen und Ihre Nummer habe ich notiert, die Bestätigung kommt per E-Mail.']],
        e: { typ: 'Termin', titel: 'Erstberatung Arbeitsrecht', zeit: 'Do, 11:00', zeilen: [['Bei', 'RAin Berger'], ['Mitbringen', 'Kündigung, Arbeitsvertrag']], knoepfe: ['Im Kalender öffnen', 'Akte anlegen'] } },
      notfall: { z: [['a', 'Mein Sohn wurde gerade festgenommen, ich brauche sofort einen Anwalt.'], ['v', 'Ich verstehe. Ich verbinde Sie direkt mit dem Notfall-Handy von Herrn Dr. Lindner. Sagen Sie mir bitte kurz, in welcher Stadt und auf welcher Wache.'], ['a', 'München, Polizeiinspektion 14.'], ['v', 'Danke, ich stelle jetzt durch. Bleiben Sie bitte dran.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#5 Strafrecht: Festnahme, PI 14 München', zeit: 'jetzt', zeilen: [['Priorität', 'hoch'], ['Durchgestellt', 'Dr. Lindner, 0:29']], knoepfe: ['Zurückrufen', 'Akte anlegen'] } },
      frage: { z: [['a', 'Was kostet bei Ihnen eine Erstberatung?'], ['v', 'Die Erstberatung kostet 190 Euro netto und dauert bis zu 45 Minuten. Mit Rechtsschutzversicherung klären wir vorher die Deckung.'], ['a', 'Und in welchen Rechtsgebieten?'], ['v', 'Arbeitsrecht, Mietrecht und Familienrecht. Soll ich Ihnen einen Termin vorschlagen?'], ['a', 'Ich melde mich noch einmal, danke.']],
        e: { typ: 'Anruf', pille: 'grau', titel: 'Erstberatung, Rechtsgebiete', zeit: '0:58 Min', zeilen: [['Beantwortet', 'aus der Wissensdatenbank'], ['Termin', 'nicht gewünscht']], knoepfe: ['Transkript', 'Nachfassen'] } },
      nachts: { z: [['a', 'Guten Abend, ich hätte eine Frage zu meinem Mietvertrag.'], ['v', 'Die Kanzlei ist bis morgen 9 Uhr geschlossen. Ich nehme Ihr Anliegen gern auf, damit Sie morgen früh zurückgerufen werden. Worum geht es?'], ['a', 'Mein Vermieter will die Miete um 20 Prozent erhöhen.'], ['v', 'Notiert: Mieterhöhung um 20 Prozent, Rückruf gewünscht. Unter welcher Nummer erreichen wir Sie morgen ab 9 Uhr?'], ['a', 'Unter dieser Nummer.']],
        e: { typ: 'Nachricht', titel: 'Rückruf: Mieterhöhung 20 %', zeit: '20:41', zeilen: [['Rechtsgebiet', 'Mietrecht'], ['Rückruf', 'morgen ab 9 Uhr']], knoepfe: ['Zurückrufen', 'Akte anlegen'] } }
    },
    hausverwaltung: {
      name: 'Hausverwaltung',
      termin: { z: [['a', 'Ich bin neuer Mieter in der Hauptstraße 3 und brauche einen Termin zur Schlüsselübergabe.'], ['v', 'Gerne. Die Übergabe macht Herr Wolf, er ist dienstags und donnerstags vor Ort. Passt Ihnen Donnerstag um 15 Uhr?'], ['a', 'Ja, Donnerstag ist gut.'], ['v', 'Eingetragen: Schlüsselübergabe Hauptstraße 3, Donnerstag 15 Uhr. Bitte bringen Sie Ihren Ausweis mit.']],
        e: { typ: 'Termin', titel: 'Schlüsselübergabe, Hauptstraße 3', zeit: 'Do, 15:00', zeilen: [['Zuständig', 'Wolf'], ['Objekt', 'Hauptstraße 3, 2. OG']], knoepfe: ['Im Kalender öffnen', 'Verschieben'] } },
      notfall: { z: [['a', 'In unserem Keller steht das Wasser zehn Zentimeter hoch!'], ['v', 'Welches Objekt, und ist der Strom im Keller noch eingeschaltet?'], ['a', 'Hauptstraße 3, ja, alles an.'], ['v', 'Bitte betreten Sie den Keller nicht, solange der Strom an ist. Ich alarmiere jetzt den Notdienst und verbinde Sie direkt. Einen Moment.']],
        e: { typ: 'Vorgang', pille: 'weh', titel: '#41 Wasser im Keller, Hauptstraße 3', zeit: 'jetzt', zeilen: [['Priorität', 'hoch'], ['Durchgestellt', 'Notdienst, SMS an Verwalter']], knoepfe: ['Zurückrufen', 'In Arbeit'] } },
      frage: { z: [['a', 'Wann kommt die Nebenkostenabrechnung für letztes Jahr?'], ['v', 'Die Abrechnung wird bis Ende Oktober verschickt, per Post und im Mieterportal. Soll ich Ihre Frage trotzdem als Nachricht hinterlegen?'], ['a', 'Nein, das reicht mir. Danke.']],
        e: { typ: 'Anruf', pille: 'grau', titel: 'Nebenkostenabrechnung', zeit: '0:34 Min', zeilen: [['Beantwortet', 'aus der Wissensdatenbank'], ['Objekt', 'Gartenweg 8']], knoepfe: ['Transkript', 'Nummer sperren'] } },
      nachts: { z: [['a', 'Hallo, die Haustür im Gartenweg 8 ist kaputt, sie schließt nicht mehr.'], ['v', 'Das Büro ist bis morgen 8 Uhr geschlossen. Eine Haustür, die nicht schließt, nehme ich als dringend auf. In welchem Stockwerk wohnen Sie, falls der Hausmeister Rückfragen hat?'], ['a', 'Erdgeschoss links.'], ['v', 'Danke. Die Meldung geht an die Verwaltung, der Hausmeister wird morgen früh als Erstes informiert. Sie bekommen eine Rückmeldung per SMS.']],
        e: { typ: 'Vorgang', titel: '#42 Haustür schließt nicht, Gartenweg 8', zeit: '21:52', zeilen: [['Priorität', 'normal, morgen früh'], ['Zuständig', 'Hausmeister']], knoepfe: ['Zurückrufen', 'In Arbeit'] } }
    }
  };
  var SITUATION = { termin: 'Termin', notfall: 'Notfall', frage: 'Frage', nachts: 'Außerhalb der Zeiten' };

  function simulator() {
    var sim = $('[data-sim]'); if (!sim) return;
    var lauf = $('[data-sim-lauf]', sim), erg = $('[data-sim-ergebnis]', sim), titel = $('[data-sim-titel]', sim), uhr = $('[data-sim-uhr]', sim), nochmal = $('[data-sim-nochmal]', sim);
    var branche = 'praxis', situation = 'termin', lauft = 0, timer = [], uhrTimer = null, sekunden = 0;
    var spaeter = function (fn, ms) { timer.push(setTimeout(fn, ms)); };
    var stopp = function () { timer.forEach(clearTimeout); timer = []; clearInterval(uhrTimer); lauft++; };
    var esc = function (s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

    function ergebnis(e) {
      var pille = 'pille' + (e.pille ? ' pille--' + e.pille : '');
      erg.innerHTML = '<div class="ui__kopf"><span class="' + pille + '">' + esc(e.typ) + '</span><b>' + esc(e.titel) + '</b><span class="ui__zeit">' + esc(e.zeit) + '</span></div>' +
        '<div class="ui__zeilen">' + e.zeilen.map(function (z) { return '<span>' + esc(z[0]) + '</span><span>' + esc(z[1]) + '</span>'; }).join('') + '</div>' +
        '<div class="ui__knoepfe" aria-hidden="true">' + e.knoepfe.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>';
    }

    function spielen() {
      stopp();
      var lauf_id = lauft, d = DIALOGE[branche][situation];
      titel.textContent = DIALOGE[branche].name + ' · ' + SITUATION[situation];
      lauf.innerHTML = ''; erg.classList.remove('da'); nochmal.hidden = true;
      sekunden = 0; uhr.textContent = '0:00';
      var stempel = 0;
      var blasen = d.z.map(function (z) {
        stempel += Math.max(2, Math.round(z[1].length / 18));
        var b = document.createElement('div');
        b.className = 'sim__blase' + (z[0] === 'v' ? ' sim__blase--v' : '');
        b.innerHTML = '<p></p><small>' + mmss(stempel) + ' · ' + (z[0] === 'v' ? 'Vocaris' : 'Anrufer') + '</small>';
        b.setAttribute('data-text', z[1]);
        return b;
      });
      if (RUHIG) {
        blasen.forEach(function (b) { b.querySelector('p').textContent = b.getAttribute('data-text'); b.classList.add('da'); lauf.appendChild(b); });
        ergebnis(d.e); erg.classList.add('da'); nochmal.hidden = false; uhr.textContent = mmss(stempel); return;
      }
      uhrTimer = setInterval(function () { sekunden++; uhr.textContent = mmss(sekunden); }, 1000);
      var t = 350;
      blasen.forEach(function (b, i) {
        var text = b.getAttribute('data-text'), p = b.querySelector('p'), vocaris = b.classList.contains('sim__blase--v');
        var tempo = vocaris ? 17 : 13;
        spaeter(function () { if (lauf_id !== lauft) return; lauf.appendChild(b); b.classList.add('da', 'tippt'); lauf.scrollTop = lauf.scrollHeight; }, t);
        for (var c = 1; c <= text.length; c++) {
          (function (c) { spaeter(function () { if (lauf_id !== lauft) return; p.textContent = text.slice(0, c); if (c === text.length) b.classList.remove('tippt'); lauf.scrollTop = lauf.scrollHeight; }, t + 60 + c * tempo); })(c);
        }
        t += 60 + text.length * tempo + (vocaris ? 520 : 420);
      });
      spaeter(function () { if (lauf_id !== lauft) return; clearInterval(uhrTimer); ergebnis(d.e); erg.classList.add('da'); nochmal.hidden = false; lauf.scrollTop = lauf.scrollHeight; }, t + 200);
    }

    $$('[data-branche]', sim).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-branche]', sim).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); branche = b.getAttribute('data-branche'); spielen();
      });
    });
    $$('[data-situation]', sim).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('[data-situation]', sim).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true'); situation = b.getAttribute('data-situation'); spielen();
      });
    });
    nochmal.addEventListener('click', spielen);

    // Erster Lauf, sobald der Simulator im Bild ist. Der Beispiel-Dialog aus
    // dem HTML bleibt stehen, bis es losgeht.
    if (RUHIG) return;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); setTimeout(spielen, 500); } }, { threshold: 0.3 });
      io.observe(sim);
    } else setTimeout(spielen, 800);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopp(); });
  }

  /* ── 5. Player mit gezeichneter Wellenform ──────────────────────────────── */
  function player() {
    var spuren = $$('[data-spur]'); if (!spuren.length) return;
    var N = 44;
    spuren.forEach(function (spur, idx) {
      var audio = $('audio', spur), knopf = $('.spur__play', spur), welle = $('.welle', spur), zeit = $('[data-zeit]', spur);
      if (!audio || !knopf) return;
      var balken = [];
      for (var i = 0; i < N; i++) {
        var b = document.createElement('i');
        // Ruhige, aber lebendige Höhen: zwei überlagerte Wellen plus ein wenig Streuung, deterministisch je Spur.
        var h = 28 + 34 * Math.abs(Math.sin(i * 0.55 + idx * 1.3)) + 22 * Math.abs(Math.sin(i * 1.7 + idx)) + ((i * 7 + idx * 13) % 11);
        b.style.setProperty('--h', Math.min(100, Math.round(h)) + '%');
        welle.appendChild(b); balken.push(b);
      }
      var raf = null;
      var malen = function () {
        var d = audio.duration || 0, p = d ? audio.currentTime / d : 0, n = Math.round(p * N);
        balken.forEach(function (b, i) { b.classList.toggle('an', i < n); });
        zeit.textContent = mmss(audio.currentTime) + (d ? ' / ' + mmss(d) : '');
        if (!audio.paused) raf = requestAnimationFrame(malen);
      };
      audio.addEventListener('loadedmetadata', function () { zeit.textContent = '0:00 / ' + mmss(audio.duration); });
      audio.addEventListener('play', function () {
        spuren.forEach(function (s) { var a = $('audio', s); if (a !== audio && !a.paused) a.pause(); });
        spur.classList.add('laeuft'); knopf.setAttribute('aria-label', 'Aufnahme ' + (idx + 1) + ' anhalten'); cancelAnimationFrame(raf); malen();
      });
      audio.addEventListener('pause', function () { spur.classList.remove('laeuft'); knopf.setAttribute('aria-label', 'Aufnahme ' + (idx + 1) + ' abspielen'); cancelAnimationFrame(raf); malen(); });
      audio.addEventListener('ended', function () { audio.currentTime = 0; malen(); });
      knopf.addEventListener('click', function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
      welle.addEventListener('click', function (e) {
        var r = welle.getBoundingClientRect(); if (!audio.duration) return;
        audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration; malen();
      });
    });
  }

  /* ── 6. Produkt-Tour: Reiter, auf dem Handy wischbar ────────────────────── */
  function tour() {
    var reiter = $('[data-tour-reiter]'), tour = $('[data-tour]'); if (!reiter || !tour) return;
    var tabs = $$('[role=tab]', reiter), buehne = $('.tour__buehne', tour), figuren = $$('figure', buehne), texte = $$('[data-tour-text]', tour);
    var mobil = function () { return window.matchMedia('(max-width: 640px)').matches; };
    var still = false;
    function waehlen(id, scrollen) {
      tabs.forEach(function (t) { var an = t.getAttribute('aria-controls') === id; t.setAttribute('aria-selected', String(an)); t.tabIndex = an ? 0 : -1; if (an && !mobil()) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
      figuren.forEach(function (f) { f.classList.toggle('da', f.id === id); });
      texte.forEach(function (t) { t.classList.toggle('da', t.getAttribute('data-tour-text') === id); });
      var f = document.getElementById(id);
      if (scrollen && mobil() && f) { still = true; buehne.scrollTo({ left: f.offsetLeft - (buehne.clientWidth - f.clientWidth) / 2, behavior: RUHIG ? 'auto' : 'smooth' }); setTimeout(function () { still = false; }, 600); }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { waehlen(t.getAttribute('aria-controls'), true); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (j < 0) return; e.preventDefault(); j = (j + tabs.length) % tabs.length; tabs[j].focus(); waehlen(tabs[j].getAttribute('aria-controls'), true);
      });
    });
    // Beim Wischen folgt der Reiter dem sichtbaren Bild.
    var t;
    buehne.addEventListener('scroll', function () {
      if (!mobil() || still) return;
      clearTimeout(t);
      t = setTimeout(function () {
        var mitte = buehne.scrollLeft + buehne.clientWidth / 2, best = null, abstand = 1e9;
        figuren.forEach(function (f) { var d = Math.abs(f.offsetLeft + f.clientWidth / 2 - mitte); if (d < abstand) { abstand = d; best = f; } });
        if (best) waehlen(best.id, false);
      }, 80);
    }, { passive: true });
  }

  /* ── 7. Rechner: Was kostet ein verpasster Anruf ────────────────────────── */
  function rechner() {
    var r = $('[data-rechner]'); if (!r) return;
    var f = { anrufe: $('#rAnrufe', r), verpasst: $('#rVerpasst', r), wert: $('#rWert', r), quote: $('#rQuote', r) };
    var aus = function (n) { return $('[data-aus="' + n + '"]', r); };
    var balken = function (n) { return $('[data-balken="' + n + '"]', r); };
    var TARIF = 49, TAGE = 22, letzter = null, raf = null;
    function fuellung(e) { var min = +e.min, max = +e.max; e.style.setProperty('--p', ((e.value - min) / (max - min) * 100) + '%'); }
    function rechne(animiert) {
      var a = +f.anrufe.value, v = +f.verpasst.value, w = +f.wert.value, q = +f.quote.value;
      var verpasstMonat = Math.round(a * TAGE * v / 100);
      var umsatz = Math.round(a * TAGE * (v / 100) * (q / 100) * w);
      aus('anrufe').textContent = de(a); aus('verpasst').textContent = v + ' %'; aus('wert').textContent = de(w) + ' €'; aus('quote').textContent = q + ' %';
      aus('verpasstMonat').textContent = de(verpasstMonat);
      var ziel = aus('umsatz');
      if (animiert && !RUHIG && letzter !== null) {
        cancelAnimationFrame(raf); var von = letzter, start = performance.now();
        var schritt = function (now) { var p = Math.min(1, (now - start) / 420), e = 1 - Math.pow(1 - p, 3); ziel.textContent = de(von + (umsatz - von) * e); if (p < 1) raf = requestAnimationFrame(schritt); };
        raf = requestAnimationFrame(schritt);
      } else ziel.textContent = de(umsatz);
      letzter = umsatz;
      var anteil = umsatz > 0 ? TARIF / umsatz * 100 : 100;
      balken('verpasst').style.setProperty('--w', (umsatz > 0 ? 100 : 0) + '%');
      balken('vocaris').style.setProperty('--w', Math.max(1.5, Math.min(100, anteil)) + '%');
      var fazit = aus('fazit');
      if (umsatz <= 0) fazit.textContent = 'Ohne verpasste Anrufe entgeht nichts. Vocaris lohnt sich dann für die Erreichbarkeit außerhalb Ihrer Zeiten.';
      else if (umsatz <= TARIF) fazit.textContent = 'Bei diesen Werten kostet der Tarif Klein mehr als der entgangene Umsatz. Der Nutzen liegt dann bei Erreichbarkeit und Entlastung, nicht beim Geld.';
      else if (anteil < 1) fazit.textContent = 'Der Tarif Klein kostet weniger als ein Prozent des Umsatzes, der hier verloren geht.';
      else fazit.textContent = 'Der Tarif Klein kostet ' + de(anteil, anteil < 10 ? 1 : 0) + ' Prozent des Umsatzes, der hier verloren geht. Es reicht, wenn Vocaris ' + de(Math.ceil(TARIF / (w * q / 100)), 0) + ' Aufträge im Monat rettet.';
    }
    Object.keys(f).forEach(function (k) { fuellung(f[k]); f[k].addEventListener('input', function () { fuellung(f[k]); rechne(true); }); });
    rechne(false);
  }

  /* ── 8. Schritte: Zeitleiste füllt sich beim Scrollen ───────────────────── */
  function schritte() {
    var liste = $('[data-schritte]'); if (!liste) return;
    var schritte = $$('.schritt', liste), letzter = -1;
    function mal() {
      var r = liste.getBoundingClientRect(), mitte = innerHeight * 0.6;
      var p = Math.max(0, Math.min(1, (mitte - r.top) / r.height));
      liste.style.setProperty('--fortschritt', p.toFixed(3));
      schritte.forEach(function (s) { s.classList.toggle('aktiv', s.getBoundingClientRect().top < mitte); });
    }
    addEventListener('scroll', mal, { passive: true }); addEventListener('resize', mal); mal();
  }

  /* ── 9. Testanruf: Formular, exakt wie bisher (POST /api/demo-call) ─────── */
  function testanruf() {
    $$('[data-callform]').forEach(function (f) {
      var err = $('[data-err]', f) || (f.parentElement && f.parentElement.querySelector('[data-err]'));
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = f.querySelector('input[type=tel]'), consent = f.querySelector('[data-consent]');
        var num = (input.value || '').replace(/[^\d+]/g, '');
        if (err) err.textContent = '';
        if (!/^\+49\d{6,13}$/.test(num)) { if (err) err.textContent = 'Bitte eine deutsche Nummer im Format +49… angeben.'; input.focus(); return; }
        if (consent && !consent.checked) { if (err) err.textContent = 'Bitte die Einwilligung bestätigen.'; return; }
        var btn = f.querySelector('button[type=submit]'); btn.disabled = true; var old = btn.textContent; btn.textContent = 'Ruft an…';
        fetch(API + '/api/demo-call', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: num, consent: true }) })
          .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (!res.ok) { if (err) err.textContent = (res.d && res.d.error) || 'Anruf konnte nicht gestartet werden.'; btn.disabled = false; btn.textContent = old; return; }
            var s = document.createElement('div'); s.className = 'formerfolg'; s.setAttribute('role', 'status');
            s.innerHTML = '<b>Geschafft.</b><span>Vocaris ruft Sie in wenigen Sekunden an. Nehmen Sie einfach ab.</span>';
            f.replaceWith(s);
          })
          .catch(function () { if (err) err.textContent = 'Server nicht erreichbar. Bitte später erneut.'; btn.disabled = false; btn.textContent = old; });
      });
    });
  }

  /* ── 10. Live-Status: echte Messung, keine Behauptung ───────────────────── */
  function status() {
    var zeile = $('[data-systemstatus]'); if (!zeile || !('fetch' in window)) return;
    var text = $('[data-status-text]', zeile), mess = $('[data-status-mess]', zeile);
    var messen = function () {
      var start = performance.now(), ctrl = new AbortController(), timer = setTimeout(function () { ctrl.abort(); }, 6000);
      fetch(API + '/api/status', { signal: ctrl.signal, cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(new Error('status ' + r.status)); })
        .then(function (d) {
          clearTimeout(timer);
          var ms = Math.max(10, Math.round((performance.now() - start) / 10) * 10);
          if (d && d.ok) { text.textContent = 'Alle Systeme laufen'; mess.textContent = ' · Antwort in ' + ms + ' ms, gerade geprüft'; }
          else { zeile.classList.add('gestoert'); text.textContent = 'Eingeschränkter Betrieb'; mess.textContent = ' · wir arbeiten daran'; }
          zeile.hidden = false;
        })
        .catch(function () { clearTimeout(timer); });
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); messen(); } }, { rootMargin: '600px 0px' }).observe(zeile);
    else messen();
  }

  /* ── 11. Feste CTA-Leiste auf dem Handy ─────────────────────────────────── */
  function ctaleiste() {
    var leiste = $('[data-ctaleiste]'), held = $('.held'), ziel = $('#testanruf'); if (!leiste || !held || !ziel) return;
    var heldWeg = false, zielDa = false;
    var setzen = function () { var an = heldWeg && !zielDa && innerWidth <= 640; leiste.classList.toggle('da', an); leiste.setAttribute('aria-hidden', String(!an)); $$('a', leiste).forEach(function (a) { a.tabIndex = an ? 0 : -1; }); };
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) { heldWeg = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; setzen(); }, { threshold: 0 }).observe(held);
    new IntersectionObserver(function (es) { zielDa = es[0].isIntersecting; setzen(); }, { threshold: 0.15 }).observe(ziel);
    addEventListener('resize', setzen);
  }

  kopf(); zeigen(); zaehler(); simulator(); player(); tour(); rechner(); schritte(); testanruf(); status(); ctaleiste();
})();
