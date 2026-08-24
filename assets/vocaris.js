/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Interaktionsschicht
   ══════════════════════════════════════════════════════════════════════════

   Grundregeln, an die sich alles hier hält:

   1. NICHTS hier ist für den Inhalt nötig. Jeder Text, jede Zahl, jedes
      Gesprächsprotokoll steht im HTML. Dieses Skript blendet ein, bewegt und
      rechnet — es erzeugt keine Inhalte. Ohne JavaScript sieht die Seite
      vollständig aus, nur still. Das ist nicht bloß Höflichkeit gegenüber
      alten Browsern: Suchmaschinen lesen so verlässlich mit.

   2. Wer Bewegung abbestellt hat (prefers-reduced-motion), bekommt sofort
      den Endzustand — nicht die schnelle Fassung, sondern gar keine.

   3. Keine Fremdbibliothek. Alles unten ist Standard-Browser-Technik.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var wurzel = document.documentElement;
  wurzel.classList.add('js');

  var RUHIG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Kurzschreibweisen. */
  function $(s, w) { return (w || document).querySelector(s); }
  function $$(s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); }

  /* ────────────────────────────────────────────────────────────────────────
     1. Scroll-Enthüllung
     Elemente mit data-zeig / data-staffel tauchen auf, wenn sie in Sicht
     kommen. Einmalig — nichts verschwindet beim Zurückscrollen wieder, das
     wäre nur nervig.
     ──────────────────────────────────────────────────────────────────────── */
  function enthuellen() {
    var ziele = $$('[data-zeig], [data-staffel]');
    if (!ziele.length) return;

    if (RUHIG || !('IntersectionObserver' in window)) {
      ziele.forEach(function (e) { e.classList.add('da'); });
      return;
    }
    var beob = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('da');
        beob.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    ziele.forEach(function (e) { beob.observe(e); });
  }

  /* ────────────────────────────────────────────────────────────────────────
     2. Lichtschein folgt dem Zeiger
     Setzt --mx/--my auf der Karte; das CSS macht daraus einen Radialverlauf.
     Auf Geräten ohne echten Zeiger (Touch) gar nicht erst anhängen.
     ──────────────────────────────────────────────────────────────────────── */
  function glanz() {
    if (RUHIG) return;
    if (!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches)) return;
    $$('.glanz').forEach(function (k) {
      k.addEventListener('pointermove', function (ev) {
        var r = k.getBoundingClientRect();
        k.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
        k.style.setProperty('--my', (ev.clientY - r.top) + 'px');
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     3. Lesefortschritt
     ──────────────────────────────────────────────────────────────────────── */
  function fortschritt() {
    var bal = $('.fortschritt');
    if (!bal) return;
    var laeuft = false;
    function mal() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bal.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      laeuft = false;
    }
    addEventListener('scroll', function () {
      if (laeuft) return;
      laeuft = true;
      requestAnimationFrame(mal);
    }, { passive: true });
    mal();
  }

  /* ────────────────────────────────────────────────────────────────────────
     4. Abschnittsnavigation mit Standanzeige
     Der Schieber wandert unter den aktiven Punkt. Welcher aktiv ist, sagt
     ein Observer — nicht die Scrollposition von Hand ausgerechnet, das geht
     bei unterschiedlich hohen Abschnitten regelmäßig schief.
     ──────────────────────────────────────────────────────────────────────── */
  function marke() {
    var leiste = $('.marke-inner');
    if (!leiste) return;
    var punkte = $$('a', leiste);
    var schieber = $('.schieber', leiste);
    if (!punkte.length || !schieber) return;

    function setzen(a) {
      punkte.forEach(function (p) { p.classList.toggle('hier', p === a); });
      schieber.style.width = a.offsetWidth + 'px';
      schieber.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    }

    var abschnitte = punkte.map(function (a) {
      var id = a.getAttribute('href');
      return id && id.charAt(0) === '#' ? document.getElementById(id.slice(1)) : null;
    });

    if ('IntersectionObserver' in window) {
      var sichtbar = {};
      var beob = new IntersectionObserver(function (eintraege) {
        eintraege.forEach(function (e) { sichtbar[e.target.id] = e.intersectionRatio; });
        // Den Abschnitt nehmen, der am meisten zu sehen ist.
        var besterI = -1, besterWert = 0;
        abschnitte.forEach(function (s, i) {
          if (!s) return;
          var w = sichtbar[s.id] || 0;
          if (w > besterWert) { besterWert = w; besterI = i; }
        });
        if (besterI >= 0) setzen(punkte[besterI]);
      }, { threshold: [0, .15, .35, .6, .85], rootMargin: '-16% 0px -40% 0px' });
      abschnitte.forEach(function (s) { if (s) beob.observe(s); });
    }

    setzen(punkte[0]);
    addEventListener('resize', function () {
      var a = $('a.hier', leiste) || punkte[0];
      setzen(a);
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     5. Der Gesprächssimulator — das Herzstück
     ────────────────────────────────────────────────────────────────────────
     Spielt einen Anruf ab: Wellenform bewegt sich, Sprechblasen erscheinen
     nacheinander, am Ende steht das Ergebnis.

     Die Gespräche stehen im HTML (ein <div data-gespraech="restaurant"> je
     Branche, darin die fertigen Sprechblasen). Dieses Skript blendet sie nur
     ein. Deshalb liest Google alle vier Gespräche vollständig — und wer kein
     JavaScript hat, sieht das erste Gespräch als ruhige Abschrift.

     Die Sprechdauer wird aus der Textlänge geschätzt: etwa 12 Zeichen pro
     Sekunde, gedeckelt. Das trifft die echte Sprechgeschwindigkeit gut genug
     und spart es, jede Zeile von Hand zu takten.
     ──────────────────────────────────────────────────────────────────────── */
  function simulator() {
    var sim = $('[data-sim]');
    if (!sim) return;

    var koerper   = $('.sim-koerper', sim);
    var tippt     = $('.sim-tippt', sim);
    var uhr       = $('.sim-uhr', sim);
    var ergebnis  = $('.sim-ergebnis', sim);
    var nochmal   = $('.sim-nochmal', sim);
    var wellen    = $$('.welle i', sim);
    var waehler   = $$('.sim-waehler button');
    var etikett   = $('.sim-licht .txt', sim);

    var timer = [];            // alle laufenden Zeitgeber, damit man sauber abbricht
    var wellenTimer = null;
    var sekunden = 0, uhrTimer = null;
    var aktuell = null;

    function stopp() {
      timer.forEach(clearTimeout);
      timer = [];
      clearInterval(wellenTimer); wellenTimer = null;
      clearInterval(uhrTimer);    uhrTimer = null;
      sim.classList.remove('laeuft');
      sim.removeAttribute('data-wer');
      ruheWelle();
    }
    function spaeter(fn, ms) { timer.push(setTimeout(fn, ms)); }

    function ruheWelle() {
      wellen.forEach(function (b) { b.style.height = '18%'; });
    }
    function welleAn(wer) {
      sim.setAttribute('data-wer', wer);
      if (RUHIG) { wellen.forEach(function (b) { b.style.height = '55%'; }); return; }
      clearInterval(wellenTimer);
      wellenTimer = setInterval(function () {
        wellen.forEach(function (b, i) {
          // Mitte lauter als die Ränder — sieht nach Stimme aus, nicht nach Rauschen.
          var mitte = 1 - Math.abs(i - (wellen.length - 1) / 2) / ((wellen.length - 1) / 2);
          var h = 16 + Math.random() * 70 * (0.42 + 0.58 * mitte);
          b.style.height = h.toFixed(0) + '%';
        });
      }, 90);
    }
    function welleAus() {
      clearInterval(wellenTimer); wellenTimer = null;
      sim.removeAttribute('data-wer');
      ruheWelle();
    }

    function uhrText() {
      var m = Math.floor(sekunden / 60), s = sekunden % 60;
      uhr.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    /** Ein Gespräch von vorn abspielen. */
    function spiele(name) {
      stopp();
      aktuell = name;

      // Umschalter markieren
      waehler.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-branche') === name));
      });

      // Alle Gespräche ausblenden, das gewählte vorbereiten
      var alle = $$('[data-gespraech]', koerper);
      alle.forEach(function (g) {
        g.hidden = g.getAttribute('data-gespraech') !== name;
        $$('.sim-blase', g).forEach(function (b) { b.classList.remove('da'); });
      });
      var gespraech = $('[data-gespraech="' + name + '"]', koerper);
      if (!gespraech) return;

      var blasen = $$('.sim-blase', gespraech);
      ergebnis.classList.remove('da');
      nochmal.classList.remove('da');
      var text = gespraech.getAttribute('data-ergebnis');
      if (text) $('.txt', ergebnis).textContent = text;

      if (etikett) etikett.textContent = gespraech.getAttribute('data-anlass') || 'Anruf geht ein';

      // Ohne Bewegung: alles sofort zeigen, fertig.
      if (RUHIG) {
        blasen.forEach(function (b) { b.classList.add('da'); });
        ergebnis.classList.add('da');
        nochmal.classList.add('da');
        uhr.textContent = '00:' + (blasen.length * 6 < 10 ? '0' : '') + (blasen.length * 6);
        return;
      }

      sim.classList.add('laeuft');
      sekunden = 0; uhrText();
      uhrTimer = setInterval(function () { sekunden++; uhrText(); }, 1000);

      // Die Blase erscheint zu BEGINN des Sprechens, nicht am Ende. Zuerst war
      // es umgekehrt — dadurch stand die Karte beim Laden 3,3 Sekunden leer,
      // bevor überhaupt etwas zu sehen war. So liest man mit, während
      // gesprochen wird, genau wie bei einer Live-Abschrift.
      var t = 150;
      blasen.forEach(function (blase) {
        var eingehend = blase.classList.contains('rein');
        var laenge = (blase.textContent || '').trim().length;
        var sprechen = Math.min(4200, Math.max(1100, laenge * 52));

        if (eingehend) {
          spaeter(function () {
            welleAn('anrufer');
            blase.classList.add('da');
            koerper.scrollTop = koerper.scrollHeight;
          }, t);
          spaeter(welleAus, t + sprechen);
          t += sprechen + 240;
        } else {
          // Assistent: erst kurz sichtbar „denken“, dann sprechen und zeigen.
          var denken = 420 + Math.random() * 260;
          spaeter(function () { tippt.classList.add('da'); koerper.scrollTop = koerper.scrollHeight; }, t);
          spaeter(function () {
            tippt.classList.remove('da');
            welleAn('assistent');
            blase.classList.add('da');
            koerper.scrollTop = koerper.scrollHeight;
          }, t + denken);
          spaeter(welleAus, t + denken + sprechen);
          t += denken + sprechen + 220;
        }
      });

      spaeter(function () {
        sim.classList.remove('laeuft');
        welleAus();
        clearInterval(uhrTimer); uhrTimer = null;
        ergebnis.classList.add('da');
        nochmal.classList.add('da');
        if (etikett) etikett.textContent = 'Gespräch beendet';
      }, t + 200);
    }

    waehler.forEach(function (b) {
      b.addEventListener('click', function () { spiele(b.getAttribute('data-branche')); });
    });
    nochmal.addEventListener('click', function () { spiele(aktuell); });

    // Erst starten, wenn der Simulator wirklich zu sehen ist — sonst läuft
    // das schönste Stück ungesehen ab, während jemand noch weiter unten liest.
    var start = sim.getAttribute('data-sim') || 'restaurant';
    if ('IntersectionObserver' in window && !RUHIG) {
      var los = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        los.disconnect();
        spiele(start);
      }, { threshold: .45 });
      los.observe(sim);
      // Falls er beim Laden schon sichtbar ist, greift der Observer sofort.
    } else {
      spiele(start);
    }

    // Läuft im Hintergrund weiter? Unnötig — anhalten, wenn der Tab wegfällt.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stopp();
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     6. Zahlen, die hochlaufen
     Nur einmal, beim ersten Sichtbarwerden.
     ──────────────────────────────────────────────────────────────────────── */
  function zaehler() {
    var ziele = $$('[data-zahl]');
    if (!ziele.length) return;

    function lauf(el) {
      var ziel = parseFloat(el.getAttribute('data-zahl'));
      if (isNaN(ziel)) return;
      if (RUHIG) { el.textContent = fmt(ziel, el); return; }
      var dauer = 1100, start = null;
      function schritt(t) {
        if (start === null) start = t;
        var p = Math.min(1, (t - start) / dauer);
        // Weich auslaufen (easeOutCubic) — wirkt wie ein Zählwerk, das bremst.
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(ziel * e, el);
        if (p < 1) requestAnimationFrame(schritt);
      }
      requestAnimationFrame(schritt);
    }
    function fmt(n, el) {
      var nk = parseInt(el.getAttribute('data-nk') || '0', 10);
      return n.toLocaleString('de-DE', { minimumFractionDigits: nk, maximumFractionDigits: nk });
    }

    if (!('IntersectionObserver' in window)) { ziele.forEach(lauf); return; }
    var beob = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        beob.unobserve(e.target);
        lauf(e.target);
      });
    }, { threshold: .6 });
    ziele.forEach(function (e) { beob.observe(e); });
  }

  /* ────────────────────────────────────────────────────────────────────────
     7. Verlustrechner
     Was kosten verpasste Anrufe? Bewusst zurückhaltend gerechnet — lieber
     eine Zahl, die der Betrieb wiedererkennt, als eine Schreckenszahl, die
     niemand glaubt.
     ──────────────────────────────────────────────────────────────────────── */
  function verlustrechner() {
    var box = $('[data-verlust]');
    if (!box) return;

    var eAnrufe = $('#vAnrufeWoche', box);
    var eQuote  = $('#vQuote', box);
    var eWert   = $('#vWert', box);
    if (!eAnrufe || !eQuote || !eWert) return;

    var TARIF_KLEIN = 49;   // muss zur Preisseite passen

    function eur(n, nk) {
      return n.toLocaleString('de-DE', {
        minimumFractionDigits: nk === undefined ? 0 : nk,
        maximumFractionDigits: nk === undefined ? 0 : nk
      });
    }

    function rechne() {
      var anrufe = +eAnrufe.value;          // Anrufe pro Woche
      var quote  = +eQuote.value / 100;     // Anteil, der niemanden erreicht
      var wert   = +eWert.value;            // Wert eines gewonnenen Auftrags

      var verpasstWoche = anrufe * quote;
      var verpasstJahr  = verpasstWoche * 52;
      // Nicht jeder verpasste Anruf wäre ein Auftrag geworden. Ein Drittel
      // ist eine zurückhaltende, gut vertretbare Annahme.
      var verloreneJahr = verpasstJahr / 3;
      var schaden = verloreneJahr * wert;

      $('#vAnrufeWocheV', box).textContent = eur(anrufe);
      $('#vQuoteV', box).textContent = Math.round(quote * 100) + ' %';
      $('#vWertV', box).textContent = eur(wert) + ' €';

      $('#vSumme', box).textContent = eur(Math.round(schaden));
      $('#vProWoche', box).textContent = eur(verpasstWoche, verpasstWoche < 10 ? 1 : 0);
      $('#vKosten', box).textContent = eur(TARIF_KLEIN * 12);

      // Der Vergleich wird ab einer gewissen Größe absurd: „das 590-Fache"
      // liest sich wie Marktschreierei und kostet genau die Glaubwürdigkeit,
      // um die es hier geht. Oberhalb von 25 wird deshalb nicht mehr gezählt,
      // sondern eingeordnet — und nach unten sagt der Rechner ehrlich, wenn
      // sich die Sache nicht lohnt.
      var faktor = schaden / (TARIF_KLEIN * 12);
      var s = $('#vFaktor', box);
      if (s) {
        if (faktor < 1.15) {
          s.textContent = 'In dieser Größenordnung lohnt sich Vocaris noch nicht — dann ist Ihr Telefon gut besetzt.';
        } else if (faktor <= 25) {
          s.textContent = 'Das ist das ' + eur(faktor, faktor < 10 ? 1 : 0) + '-Fache dessen, was Vocaris im Jahr kostet.';
        } else {
          s.textContent = 'Bei diesem Aufkommen fällt der Preis von Vocaris gegenüber dem Entgangenen kaum noch ins Gewicht.';
        }
      }
    }

    [eAnrufe, eQuote, eWert].forEach(function (e) { e.addEventListener('input', rechne); });
    rechne();
  }

  /* ──────────────────────────────────────────────────────────────────────── */
  function start() {
    enthuellen();
    glanz();
    fortschritt();
    marke();
    simulator();
    zaehler();
    verlustrechner();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* ══════════════════════════════════════════════════════════════════════════
   Zusatzfunktionen
   ══════════════════════════════════════════════════════════════════════════
   Drei Stücke, die etwas können — keine Effekte um ihrer selbst willen.
   Alle halten sich an dieselben Regeln wie oben: Inhalt steht im HTML, ohne
   JavaScript bleibt die Seite vollständig, prefers-reduced-motion gilt.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var RUHIG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, w) { return (w || document).querySelector(s); }
  function $$(s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); }

  /* ────────────────────────────────────────────────────────────────────────
     1. Branchенfinder
     Statt sechzehn Karten zu überfliegen, tippt man ein Stichwort und
     bekommt die passende Seite. Die Zuordnung steht als data-Attribut an der
     Karte selbst — dadurch bleibt sie beim Hinzufügen einer Branche dort, wo
     die Branche steht, statt in einer zweiten Liste im Skript zu veralten.
     ──────────────────────────────────────────────────────────────────────── */
  function branchenfinder() {
    var feld = $('[data-branchensuche]');
    if (!feld) return;
    var karten = $$('#branchen .icard');
    if (!karten.length) return;
    var zaehler = $('[data-branchentreffer]');

    function normal(s) {
      return (s || '').toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
    }
    // Suchtext je Karte einmal in Wörter zerlegen statt bei jedem Tastendruck
    // neu. Wörter statt einer langen Zeichenkette, weil nur WORTANFÄNGE zählen
    // sollen: Sonst findet „tier" auch „installiert" und „Vermittler“ — beim
    // ersten Versuch kamen auf „tier" vier Branchen statt einer.
    var index = karten.map(function (k) {
      var text = normal(k.textContent + ' ' + (k.getAttribute('data-suchwoerter') || ''));
      return { el: k, woerter: text.split(/[^a-z0-9]+/).filter(Boolean) };
    });

    function suche() {
      var q = normal(feld.value).trim();
      var treffer = 0;
      index.forEach(function (e) {
        var passt = !q || q.split(/\s+/).every(function (teil) {
          return e.woerter.some(function (w) { return w.indexOf(teil) === 0; });
        });
        e.el.hidden = !passt;
        if (passt) treffer++;
      });
      if (zaehler) {
        zaehler.textContent = !q
          ? ''
          : (treffer === 0 ? 'Keine passende Branche — Vocaris arbeitet trotzdem für Sie, sprechen wir darüber.'
             : treffer === 1 ? '1 Branche passt' : treffer + ' Branchen passen');
      }
    }
    feld.addEventListener('input', suche);
    feld.addEventListener('search', suche);
  }

  /* ────────────────────────────────────────────────────────────────────────
     2. Tastaturbedienung für den Branchenumschalter
     Pfeiltasten wechseln die Branche, wie man es von Reiterleisten erwartet.
     Kostet zehn Zeilen und macht den Simulator ohne Maus bedienbar.
     ──────────────────────────────────────────────────────────────────────── */
  function umschalterTasten() {
    var knoepfe = $$('.sim-waehler button');
    if (!knoepfe.length) return;
    knoepfe.forEach(function (b, i) {
      b.addEventListener('keydown', function (e) {
        var ziel = null;
        if (e.key === 'ArrowRight') ziel = knoepfe[(i + 1) % knoepfe.length];
        else if (e.key === 'ArrowLeft') ziel = knoepfe[(i - 1 + knoepfe.length) % knoepfe.length];
        else if (e.key === 'Home') ziel = knoepfe[0];
        else if (e.key === 'End') ziel = knoepfe[knoepfe.length - 1];
        if (!ziel) return;
        e.preventDefault();
        ziel.focus();
        ziel.click();
      });
    });
  }

  /* ────────────────────────────────────────────────────────────────────────
     3. „Klingt es wie ein Mensch?" — die Stimmprobe
     Zeigt an einem echten Satz, wie unterschiedlich schnell die drei Wege
     antworten. Die Zahlen stammen aus den eigenen Messungen und stehen im
     HTML; hier wird nur die Zeit sichtbar gemacht.
     ──────────────────────────────────────────────────────────────────────── */
  function stimmprobe() {
    var box = $('[data-probe]');
    if (!box) return;
    var reihen = $$('[data-ms]', box);
    var knopf = $('[data-probe-start]', box);
    if (!reihen.length || !knopf) return;

    var laeuft = false;
    function start() {
      if (laeuft) return;
      laeuft = true;
      knopf.disabled = true;
      var max = Math.max.apply(null, reihen.map(function (r) { return +r.getAttribute('data-ms'); }));

      reihen.forEach(function (r) {
        var balken = $('.probe-balken', r);
        var wert = $('.probe-wert', r);
        var ms = +r.getAttribute('data-ms');
        balken.style.width = '0%';
        r.classList.remove('fertig');
        if (wert) wert.textContent = '…';

        var breite = (ms / max) * 100;
        if (RUHIG) {
          balken.style.width = breite + '%';
          if (wert) wert.textContent = (ms / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' s';
          r.classList.add('fertig');
          return;
        }
        // Die Balken laufen in ECHTZEIT — 1,9 s dauern hier auch 1,9 s.
        // Genau das ist der Punkt: Man soll den Unterschied aushalten müssen.
        balken.style.transition = 'width ' + ms + 'ms linear';
        requestAnimationFrame(function () { balken.style.width = breite + '%'; });
        setTimeout(function () {
          if (wert) wert.textContent = (ms / 1000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' s';
          r.classList.add('fertig');
        }, ms);
      });

      setTimeout(function () { laeuft = false; knopf.disabled = false; }, RUHIG ? 300 : max + 400);
    }

    knopf.addEventListener('click', start);
    // Beim ersten Sichtbarwerden von selbst starten.
    if ('IntersectionObserver' in window) {
      var beob = new IntersectionObserver(function (e) {
        if (!e[0].isIntersecting) return;
        beob.disconnect();
        start();
      }, { threshold: .5 });
      beob.observe(box);
    }
  }

  function start() { branchenfinder(); umschalterTasten(); stimmprobe(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
