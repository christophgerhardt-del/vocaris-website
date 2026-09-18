# Gestaltungssystem 2026 (neu.css)

Gilt für alle Seiten, die auf das neue Design umgestellt sind. Eine Seite lädt nur
`schriften.css`, `tokens.css`, `neu.css` und `neu.js` (defer) sowie `/pv.js`.
Alte Stylesheets (vocaris.css, presio.css, site.css, home.css) werden nicht geladen.

## Grundregeln

- Abstände auf dem 8-px-Raster: `--r1` (8) … `--r16` (128). Abschnitte: `.abschnitt` (96 px), `.abschnitt--eng` (64 px), `.abschnitt--grau` (heller Grund).
- Radien nur aus Tokens (`--rund-s`, `--rund`, `--rund-l`, `--rund-xl`, `--rund-voll`).
- Ein Schatten: `--schatten` (schwebende Karten), `--schatten-tief` (Held-Elemente, Flyout).
- Knöpfe: `.knopf` (Elektroblau) und `.knopf--leise` (weiß mit Kante). Zusatz `.knopf--klein`. Auf dunklem Grund (`.dunkel`) kehrt sich `.knopf--leise` um.
- Eine Karte: `.kachel`, dazu `.kachel--hebt` (hebt sich beim Zeiger), `.kachel--voll` (Innenabstand).
- Überschriften: `h1` (`--t-held`), `h2` (`--t-h2`), `h3`; Vorzeile `.vorzeile`, Einleitung `.lede`, Abschnittskopf `.kopfzeile`.
- Dunkle Flächen nur `.held` und `.abschluss` (Klasse `.dunkel`), Elektroblau `--akzent` ist der einzige Akzent.
- Bewegung: `data-zeig` (Element erscheint beim Scrollen), `data-staffel` (Kinder gestaffelt), `data-zaehl="49"` (Zahl zählt hoch). `prefers-reduced-motion` schaltet alles ab.

## Kopfzeile

```html
<header class="kopf" id="kopf">                 <!-- auf dunklem Held: class="kopf kopf--auf-dunkel" -->
  <div class="huelle kopf__innen">
    <a class="marke" href="index.html" aria-label="Vocaris, zur Startseite"><svg …Pegelkugel…></svg>Vocaris</a>
    <nav class="hauptnav" aria-label="Hauptnavigation">
      <a href="funktionen.html">Funktionen</a>
      <a href="preise.html">Preise</a>
      <details class="flyout" data-flyout>
        <summary aria-haspopup="true">Branchen <svg …Pfeil…></svg></summary>
        <div class="flyout__feld">…17 Links…<a class="flyout__alle" href="branchen.html">Alle 17 Branchen im Überblick →</a></div>
      </details>
      <a href="vergleich.html">Vergleich</a>
      <a href="ratgeber.html">Ratgeber</a>
    </nav>
    <div class="kopf__rechts">
      <a class="anmelden" href="app.html">Anmelden</a>
      <a class="knopf knopf--klein" href="index.html#testanruf">Testanruf</a>
      <button class="menueknopf" type="button" aria-expanded="false" aria-controls="mobilmenue" aria-label="Menü öffnen" data-menueknopf>…zwei SVGs (.auf/.zu)…</button>
    </div>
  </div>
</header>
<div class="mobilmenue" id="mobilmenue" hidden>
  <nav class="mobilmenue__gross" aria-label="Menü">…große Links, Branchen als <details>…</nav>
  <div class="mobilmenue__knoepfe"><a class="knopf" href="index.html#testanruf">Kostenloser Testanruf</a><a class="knopf knopf--leise" href="app.html">Anmelden</a></div>
  <div class="mobilmenue__fuss">…kleine Links…</div>
</div>
```

Auf Unterseiten ohne dunklen Held: `kopf--auf-dunkel` weglassen, die Seite beginnt normal unter der
Kopfzeile (kein negativer Rand). Aktive Seite: `aria-current="page"` auf dem Link.
`neu.js` macht die Kopfzeile ab 24 px Scrollhöhe fest (`.fest`), öffnet das Flyout bei Zeiger und Klick,
schließt es bei Escape und Wegklick, schaltet das Vollbildmenü (`body.menue-offen`).

## Fußzeile

```html
<footer class="fuss">
  <div class="huelle">
    <div class="fuss__oben">
      <div class="fuss__marke"><a class="marke" href="index.html">…Pegelkugel… Vocaris</a><p>Kurztext, EU-Hosting.</p><p>Rheinstr. 26<br>80803 München</p></div>
      <div><h4>Produkt</h4><ul><li><a href="funktionen.html">Funktionen</a></li>…</ul></div>
      <div><h4>Branchen</h4><ul>…</ul></div>
      <div><h4>Kontakt</h4><ul>…</ul></div>
    </div>
    <div class="fuss__unten">
      <span class="eu"><svg …Schild…></svg>Verarbeitung und Hosting in der EU</span>
      <span>© 2026 Vocaris · Christoph Gerhardt, München <a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="agb.html">AGB</a></span>
    </div>
  </div>
</footer>
<div class="ctaleiste" data-ctaleiste aria-hidden="true"><a class="knopf" href="index.html#testanruf" tabindex="-1">Testanruf</a><a class="knopf knopf--leise" href="demo.html" tabindex="-1">Demo</a></div>
```

Die feste CTA-Leiste erscheint nur auf dem Handy (≤ 640 px), sobald der Held aus dem Bild ist, und
verschwindet, wenn das Testanruf-Formular (`#testanruf`) sichtbar ist. Auf Unterseiten ohne Held
genügt ein Element mit Klasse `held` (z. B. der Seitenkopf), sonst bleibt die Leiste aus.

## Module (neu.js), je nach Markup aktiv

`[data-sim]` Anruf-Simulator · `[data-spur]` Player mit gezeichneter Welle · `[data-tour-reiter]` + `[data-tour]`
Produkt-Tour · `[data-rechner]` Verlustrechner · `[data-schritte]` Zeitleiste · `[data-callform]` Testanruf
(POST `https://ki-anruf.onrender.com/api/demo-call`, `{phone, consent:true}`) · `[data-systemstatus]` Live-Messung
gegen `/api/status`.

## Bilder

Echte Ansichten des Kundenbereichs liegen als WebP in `assets/produkt/` (jeweils `name.webp` in doppelter
und `name-k.webp` in einfacher Auflösung, per `srcset`). Erzeugt mit
`~/Projects/vocaris-tools/produkt-fotos-neu.mjs` aus dem Testkonto, Name im Foto: „Trattoria da Vinci“.
Geräterahmen: `.geraet` (Browser) und `.geraet--handy` (Telefon), beide reines CSS.
