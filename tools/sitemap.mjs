#!/usr/bin/env node
/**
 * Erzeugt sitemap.xml aus den HTML-Seiten im Projektstamm.
 *
 * Warum erzeugt statt handgepflegt: Eine Sitemap, die man von Hand fortschreibt,
 * veraltet beim ersten Mal, an dem jemand eine Seite anlegt und es vergisst.
 * Genau das ist hier passiert — sechs Branchenseiten existierten, ohne dass
 * Google eine davon kannte.
 *
 * DIE REGEL: Eine Seite kommt in die Sitemap, wenn sie NICHT auf "noindex"
 * steht. Damit gibt es nur einen Ort, an dem die Entscheidung getroffen wird —
 * das robots-Meta in der Seite selbst. Eine Sitemap, die eine noindex-Seite
 * auffuehrt, waere ein Widerspruch, den Google auch anmerkt.
 *
 * `lastmod` kommt aus dem letzten Git-Commit der Datei, nicht aus der
 * Dateizeit: Ein frisch geklontes Repo haette sonst ueberall das Klondatum.
 *
 * Aufruf:  node tools/sitemap.mjs        (schreibt sitemap.xml)
 *          node tools/sitemap.mjs --pruefen   (nur pruefen, nichts schreiben)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STAMM = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASIS = 'https://vocaris.eu';

/** robots-Angabe einer Seite lesen (leer = Googles Standard, also indexierbar). */
function robotsAngabe(html) {
  const m = html.match(/<meta[^>]*name=["']robots["'][^>]*>/i);
  if (!m) return '';
  return (m[0].match(/content=["']([^"']*)["']/i)?.[1] ?? '').toLowerCase();
}

/** Adresse einer Datei. Die Startseite laeuft unter "/", nicht "/index.html". */
function adresse(datei) {
  return datei === 'index.html' ? `${BASIS}/` : `${BASIS}/${datei}`;
}

function letzteAenderung(datei) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', datei], {
      cwd: STAMM, encoding: 'utf8',
    }).trim();
    if (d) return d;
  } catch { /* kein Git verfuegbar */ }
  return new Date().toISOString().slice(0, 10);
}

const seiten = readdirSync(STAMM)
  .filter((f) => f.endsWith('.html'))
  .sort()
  .map((datei) => {
    const html = readFileSync(join(STAMM, datei), 'utf8');
    const robots = robotsAngabe(html);
    return { datei, robots, indexierbar: !robots.includes('noindex') };
  });

const drin = seiten.filter((s) => s.indexierbar);
const raus = seiten.filter((s) => !s.indexierbar);

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  drin
    .map((s) => `  <url>\n    <loc>${adresse(s.datei)}</loc>\n    <lastmod>${letzteAenderung(s.datei)}</lastmod>\n  </url>\n`)
    .join('') +
  '</urlset>\n';

const ziel = join(STAMM, 'sitemap.xml');

if (process.argv.includes('--pruefen')) {
  const vorhanden = (() => { try { return readFileSync(ziel, 'utf8'); } catch { return null; } })();
  if (vorhanden === xml) { console.log('sitemap.xml ist aktuell.'); process.exit(0); }
  console.error('sitemap.xml ist NICHT aktuell — bitte "node tools/sitemap.mjs" laufen lassen.');
  process.exit(1);
}

writeFileSync(ziel, xml);
console.log(`sitemap.xml geschrieben — ${drin.length} Seiten:\n`);
for (const s of drin) console.log(`  ✓ ${adresse(s.datei)}`);
console.log(`\nBewusst nicht enthalten (${raus.length}):`);
for (const s of raus) console.log(`  – ${s.datei}  (${s.robots})`);
