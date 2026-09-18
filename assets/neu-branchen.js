/* ══════════════════════════════════════════════════════════════════════════
   Vocaris — Branchenseiten (neu-branchen.js)
   ══════════════════════════════════════════════════════════════════════════
   Zwei Module, beide nur aktiv, wenn ihr Markup auf der Seite steht:
   [data-sim-fest]        Beispielgespräch mit festem Dialog. Der Dialog steht
                          als JSON im Element, das HTML zeigt den Endzustand
                          (ohne JavaScript bleibt er stehen). Tippt sich wie
                          der Simulator der Startseite in neu.js, nur ohne
                          Auswahl von Branche und Situation.
   [data-branchen-suche]  Suchfeld der Übersicht, filtert die Kacheln.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var RUHIG = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, w) { return (w || document).querySelector(s); };
  var $$ = function (s, w) { return Array.prototype.slice.call((w || document).querySelectorAll(s)); };
  var mmss = function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  var esc = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

  /* ── 1. Beispielgespräch mit festem Dialog ──────────────────────────────── */
  function simulatorFest() {
    var sim = $('[data-sim-fest]'); if (!sim) return;
    var quelle = $('[data-sim-dialog]', sim), lauf = $('[data-sim-lauf]', sim), erg = $('[data-sim-ergebnis]', sim), uhr = $('[data-sim-uhr]', sim), nochmal = $('[data-sim-nochmal]', sim);
    if (!quelle || !lauf || !erg) return;
    var d; try { d = JSON.parse(quelle.textContent); } catch (e) { return; }
    var lauft = 0, timer = [], uhrTimer = null, sekunden = 0;
    var spaeter = function (fn, ms) { timer.push(setTimeout(fn, ms)); };
    var stopp = function () { timer.forEach(clearTimeout); timer = []; clearInterval(uhrTimer); lauft++; };

    function ergebnis(e) {
      var pille = 'pille' + (e.pille ? ' pille--' + e.pille : '');
      erg.innerHTML = '<div class="ui__kopf"><span class="' + pille + '">' + esc(e.typ) + '</span><b>' + esc(e.titel) + '</b><span class="ui__zeit">' + esc(e.zeit) + '</span></div>' +
        '<div class="ui__zeilen">' + e.zeilen.map(function (z) { return '<span>' + esc(z[0]) + '</span><span>' + esc(z[1]) + '</span>'; }).join('') + '</div>' +
        '<div class="ui__knoepfe" aria-hidden="true">' + e.knoepfe.map(function (k) { return '<span>' + esc(k) + '</span>'; }).join('') + '</div>';
    }

    function spielen() {
      stopp();
      var lauf_id = lauft;
      lauf.innerHTML = ''; erg.classList.remove('da'); if (nochmal) nochmal.hidden = true;
      sekunden = 0; if (uhr) uhr.textContent = '0:00';
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
        ergebnis(d.e); erg.classList.add('da'); if (nochmal) nochmal.hidden = false; if (uhr) uhr.textContent = mmss(stempel); return;
      }
      uhrTimer = setInterval(function () { sekunden++; if (uhr) uhr.textContent = mmss(sekunden); }, 1000);
      var t = 350;
      blasen.forEach(function (b) {
        var text = b.getAttribute('data-text'), p = b.querySelector('p'), vocaris = b.classList.contains('sim__blase--v');
        var tempo = vocaris ? 17 : 13;
        spaeter(function () { if (lauf_id !== lauft) return; lauf.appendChild(b); b.classList.add('da', 'tippt'); lauf.scrollTop = lauf.scrollHeight; }, t);
        for (var c = 1; c <= text.length; c++) {
          (function (c) { spaeter(function () { if (lauf_id !== lauft) return; p.textContent = text.slice(0, c); if (c === text.length) b.classList.remove('tippt'); lauf.scrollTop = lauf.scrollHeight; }, t + 60 + c * tempo); })(c);
        }
        t += 60 + text.length * tempo + (vocaris ? 520 : 420);
      });
      spaeter(function () { if (lauf_id !== lauft) return; clearInterval(uhrTimer); ergebnis(d.e); erg.classList.add('da'); if (nochmal) nochmal.hidden = false; lauf.scrollTop = lauf.scrollHeight; }, t + 200);
    }

    if (nochmal) nochmal.addEventListener('click', spielen);
    if (RUHIG) { if (nochmal) nochmal.hidden = false; return; }
    // Erster Lauf, sobald das Gespräch im Bild ist. Bis dahin steht der fertige Dialog aus dem HTML.
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); setTimeout(spielen, 500); } }, { threshold: 0.3 });
      io.observe(sim);
    } else setTimeout(spielen, 800);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopp(); });
  }

  /* ── 2. Suche in der Branchenübersicht ──────────────────────────────────── */
  function suche() {
    var form = $('[data-branchen-suche]'), raster = $('[data-branchen-raster]'); if (!form || !raster) return;
    var feld = $('input', form), stand = $('[aria-live]', form), leer = $('[data-suche-leer]'), kacheln = $$('.branche', raster);
    var norm = function (s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'); };
    function filtern() {
      var q = norm(feld.value).trim().split(/\s+/).filter(Boolean), n = 0;
      kacheln.forEach(function (k) {
        var text = norm(k.getAttribute('data-suche') + ' ' + k.textContent);
        var an = q.every(function (w) { return text.indexOf(w) > -1; });
        k.classList.toggle('aus', !an); if (an) n++;
      });
      if (stand) stand.textContent = q.length ? n + (n === 1 ? ' Treffer' : ' Treffer') : kacheln.length + ' Branchen';
      if (leer) leer.hidden = n > 0;
      raster.classList.add('da');
    }
    feld.addEventListener('input', filtern);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    if (feld.value) filtern();
  }

  simulatorFest(); suche();
})();
