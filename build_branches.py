# -*- coding: utf-8 -*-
import json, html

BASE = "https://vocaris.eu/"

LOGO = ('<span class="mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="26" height="26">'
        '<defs><linearGradient id="vlogoN" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs>'
        '<rect width="64" height="64" rx="15" fill="url(#vlogoN)"/>'
        '<path d="M16 32c0-7 11-7 11 0s11 7 11 0 11-7 11 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg></span>Vocaris')

def nav():
    return f'''<nav class="nav" id="nav"><span id="top"></span>
  <a href="index.html" class="logo" aria-label="Vocaris Startseite">{LOGO}</a>
  <div class="nav-links">
    <a href="index.html#produkt">Produkt</a><a href="index.html#branchen">Branchen</a><a href="index.html#modelle">KI-Modelle</a><a href="index.html#sicherheit">Sicherheit</a>
  </div>
  <div class="nav-right">
    <a href="demo.html" class="contact">Demo buchen</a>
    <a href="#call"><button class="btn-dark" type="button">Testanruf erhalten</button></a>
  </div>
</nav>'''

def footer():
    return f'''<footer class="foot">
  <a href="index.html" class="logo" style="font-size:18px"><span class="mark" aria-hidden="true"><svg viewBox="0 0 64 64" width="22" height="22"><defs><linearGradient id="vlogoF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#4f46e5"/></linearGradient></defs><rect width="64" height="64" rx="15" fill="url(#vlogoF)"/><path d="M16 32c0-7 11-7 11 0s11 7 11 0 11-7 11 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg></span>Vocaris</a>
  <div class="fl"><a href="index.html#produkt">Produkt</a><a href="index.html#branchen">Branchen</a><a href="index.html#modelle">KI-Modelle</a><a href="index.html#sicherheit">Sicherheit</a></div>
  <div class="fr"><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><span>© 2026 Vocaris</span></div>
</footer>'''

def callform(dark=False):
    cls = "callform dark" if dark else "callform"
    style = ' style="align-items:center"' if dark else ''
    center = ' style="justify-content:center;text-align:left"' if dark else ''
    minw = ' style="min-width:220px"' if dark else ''
    return f'''<form class="{cls}" data-callform{style}>
        <div class="callrow">
          <input type="tel" inputmode="tel" placeholder="+49 · Ihre Rufnummer" aria-label="Ihre Rufnummer" required{minw}>
          <button type="submit">Testanruf erhalten</button>
        </div>
        <label class="consent"{center}><input type="checkbox" data-consent required> Ich bin einverstanden, dass Vocaris mich einmalig zu Demozwecken anruft.</label>
      </form>
      <div class="formerr" data-err></div>'''

def render(b):
    pains = "".join(f'<div class="a"><span>→</span><span>{p}</span></div>' for p in b["pains"])
    feats = "".join(
        f'<div class="icard" style="background:#fff;border:1px solid var(--line)"><div class="tt">{f["t"]}</div><p>{f["s"]}</p></div>'
        for f in b["features"])
    faqs = "".join(
        f'''<details class="faq"><summary>{q["q"]}<span class="mk" aria-hidden="true"></span></summary><div class="ans">{q["a"]}</div></details>'''
        for q in b["faq"])
    faq_ld = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": html.unescape(q["q"]),
                        "acceptedAnswer": {"@type": "Answer", "text": html.unescape(q["a"])}} for q in b["faq"]]
    }
    stats = "".join(f'<div class="stat"><span class="n">{s["n"]}</span><span class="l">{s["l"]}</span></div>' for s in b["stats"])
    d = b["dialog"]

    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{b["title"]}</title>
<meta name="description" content="{b["desc"]}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="{BASE}{b["slug"]}">
<meta property="og:title" content="{b["title"]}">
<meta property="og:description" content="{b["desc"]}">
<meta property="og:type" content="website">
<meta property="og:url" content="{BASE}{b["slug"]}">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<script type="application/ld+json">{json.dumps(faq_ld, ensure_ascii=False)}</script>
</head>
<body>

<div class="scrollprog" id="scrollprog"></div>
{nav()}

<!-- Hero -->
<section class="hero branch-hero" id="call">
  <div class="aurora"></div>
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <div class="eyebrow">{b["eyebrow"]}</div>
      <h1>{b["h1"]}</h1>
      <p class="lede">{b["lede"]}</p>
      {callform()}
      <div class="microcopy">Kostenlos und unverbindlich — Vocaris ruft Sie in wenigen Sekunden zurück. {b["cta_line"]}</div>
    </div>
    <div class="callcard">
      <div class="ch">
        <div class="live"><span class="dot"></span>{b["callhead"]}</div>
        <div style="font-size:13px;color:var(--ph)">00:07</div>
      </div>
      <div class="body">
        <div class="bub in">{d["in"]}</div>
        <div class="bub out">{d["out"]}</div>
      </div>
      <div class="cf"><span style="color:var(--ok);font-weight:600">{d["cf"]}</span></div>
    </div>
  </div>
</section>

<!-- Stats -->
<div class="stats">{stats}</div>

<!-- Problem -->
<section class="sec" id="problem">
  <div class="wrap sec-2">
    <div style="display:flex;flex-direction:column;gap:26px">
      <div class="eyebrow">DAS PROBLEM</div>
      <h2 class="h2-big">{b["pain_title"]}</h2>
      <div class="arrows">{pains}</div>
    </div>
    <div class="softcard">
      <div class="eyebrow">WAS DAS KOSTET</div>
      <div class="q">{b["cost"]}</div>
    </div>
  </div>
</section>

<!-- Lösung -->
<section class="sec" style="background:#fff;border-top:1px solid var(--line)">
  <div class="wrap">
    <div style="max-width:60ch;display:flex;flex-direction:column;gap:22px;margin-bottom:56px">
      <div class="eyebrow">SO ÜBERNIMMT VOCARIS</div>
      <h2 class="h2-big">{b["sol_title"]}</h2>
      <p style="font-size:17px;line-height:1.65;color:var(--t2)">{b["sol_sub"]}</p>
    </div>
    <div class="cards-3">{feats}</div>
  </div>
</section>

<!-- FAQ -->
<section class="faq-sec" id="faq">
  <div class="wrap faq-grid">
    <div class="faq-aside">
      <span class="eyebrow">HÄUFIGE FRAGEN</span>
      <h2 class="h2-big">Gut zu wissen.</h2>
      <p>Die häufigsten Fragen aus Ihrer Branche — ehrlich beantwortet. Den Rest klären wir gern in einer kurzen Demo.</p>
      <a href="demo.html" class="faq-cta">Demo buchen <span aria-hidden="true">&rarr;</span></a>
    </div>
    <div class="faq-list">{faqs}</div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="inner">
    <h2>Hören Sie selbst.</h2>
    <p style="font-size:17px;line-height:1.65;color:var(--t2)">{b["cta_sub"]}</p>
    {callform(dark=True)}
    <div class="microcopy">Lieber persönlich? <a href="demo.html" class="demolink">Demo buchen &rarr;</a> — oder zurück zur <a href="index.html" class="demolink">Übersicht</a>.</div>
  </div>
</section>

{footer()}

<script src="assets/site.js"></script>
</body>
</html>'''

BRANCHES = [
 {
  "slug":"restaurants.html","eyebrow":"GASTRONOMIE","callhead":"Reservierung geht ein",
  "title":"Vocaris für Restaurants — KI nimmt Reservierungen am Telefon an",
  "desc":"Während Sie im Service stehen, geht Vocaris ans Telefon: reserviert Tische, erkennt Stammgäste, führt Warteliste. In der EU gehostet, in 15 Minuten startklar.",
  "h1":"Volles Haus,<br>klingelndes Telefon?",
  "lede":"Im Service kann niemand ans Telefon — genau dann gehen Reservierungen verloren. Vocaris nimmt jeden Anruf an, reserviert Tische im Gespräch, erkennt Stammgäste an der Nummer und führt bei vollem Haus die Warteliste.",
  "cta_line":"So klingt Ihr nächstes Reservierungsgespräch.",
  "dialog":{"in":"„Guten Abend, haben Sie heute um acht noch einen Tisch für vier?“","out":"„Um 20 Uhr wird es eng — 20:30 Uhr hätte ich einen Vierertisch. Passt Ihnen das?“","cf":"✓ Tisch reserviert · Bestätigung per SMS"},
  "stats":[{"n":"0","l":"verpasste Reservierungen"},{"n":"24/7","l":"auch nach Feierabend"},{"n":"SMS","l":"Bestätigung & Erinnerung"},{"n":"live","l":"gepflegter Tischplan"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Das Telefon klingelt mitten im Ansturm</strong> — und niemand kann ran.","Reservierungen landen auf Zetteln, Doppelbuchungen inklusive.","Anrufe nach Feierabend oder am Ruhetag gehen komplett verloren.","Absagen kommen zu spät — der Tisch bleibt am Abend leer."],
  "cost":"Ein voller Vierertisch, der nicht durchkommt, sind schnell <b>150–250&thinsp;€ Umsatz</b> — an einem einzigen Abend. Bei nur zwei verpassten Anrufen pro Woche summiert sich das aufs Jahr zu einem fünfstelligen Betrag.",
  "sol_title":"Reserviert, während Sie servieren.","sol_sub":"Vocaris nimmt jeden Anruf sofort an und pflegt Ihren Tischplan — Sie sehen jede Reservierung live im Dashboard.",
  "features":[{"t":"Reserviert im Gespräch","s":"Vocaris prüft den Tischplan live und trägt die Reservierung direkt ein — mit Personenzahl, Uhrzeit und Sonderwünschen."},{"t":"Erkennt Stammgäste","s":"An der Rufnummer erkennt Vocaris wiederkehrende Gäste, begrüßt mit Namen und kennt Vorlieben."},{"t":"Warteliste & Erinnerung","s":"Ist alles voll, nimmt Vocaris auf die Warteliste und meldet sich, sobald frei wird. Die SMS-Erinnerung senkt No-Shows."}],
  "faq":[{"q":"Ersetzt Vocaris mein Reservierungsbuch?","a":"Nein — er füllt es. Vocaris pflegt Ihren digitalen Tischplan, und Sie sehen jede Reservierung sofort im Dashboard."},{"q":"Was ist bei Sonderwünschen wie Geburtstag oder Allergien?","a":"Vocaris fragt aktiv nach Anlass und Unverträglichkeiten und hinterlegt sie bei der Reservierung."},{"q":"Und große Gruppen oder Feiern?","a":"Für Gruppen und Feiern nimmt Vocaris die Anfrage auf oder verbindet direkt an Sie — die planen Sie lieber persönlich."}],
  "cta_sub":"Ein Testanruf sagt mehr als jede Funktionsliste. Preise besprechen wir persönlich — zugeschnitten auf Ihr Anrufvolumen.",
 },
 {
  "slug":"arztpraxen.html","eyebrow":"ARZT- & ZAHNARZTPRAXEN","callhead":"Anruf zur Sprechstunde",
  "title":"Vocaris für Arztpraxen — das Telefon ist nie mehr besetzt",
  "desc":"Morgens ist die Leitung dicht, das Team am Limit. Vocaris nimmt Anrufe an, vergibt Termine, nimmt Rezept- und Rückrufwünsche auf — DSGVO-konform, in der EU gehostet.",
  "h1":"Morgens besetzt.<br>Patienten verzweifelt.",
  "lede":"Zur Sprechstunde stehen alle Leitungen still, das Team ist am Anschlag. Vocaris nimmt jeden Anruf sofort an, vergibt Termine, nimmt Rezept- und Rückrufwünsche auf und entlastet Ihren Empfang — DSGVO-konform.",
  "cta_line":"So klingt ein typischer Praxisanruf mit Vocaris.",
  "dialog":{"in":"„Guten Morgen, ich bräuchte ein Folgerezept und möglichst einen Termin diese Woche.“","out":"„Das Rezept notiere ich für die Praxis. Für einen Termin hätte ich Donnerstag 9:40 Uhr — passt das?“","cf":"✓ Termin vergeben · Rezeptwunsch notiert"},
  "stats":[{"n":"0","l":"Besetztzeichen"},{"n":"24/7","l":"erreichbar"},{"n":"DSGVO","l":"EU-Hosting & AV-Vertrag"},{"n":"Rückruf","l":"statt Warteschleife"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Zur Sprechstunde sind alle Leitungen belegt</strong> — Patienten kommen nicht durch.","Der Empfang jongliert Telefon, Tresen und Wartezimmer gleichzeitig.","Rezept- und Überweisungswünsche gehen im Trubel unter.","Nach Feierabend hört niemand die dringenden Anliegen."],
  "cost":"Jeder nicht angenommene Anruf bindet Ihr Team später doppelt — Rückrufe, Mailbox abhören, verärgerte Patienten am Tresen. <b>Zeit, die im Sprechzimmer fehlt.</b>",
  "sol_title":"Nimmt ab, wenn Ihr Team keine Hand frei hat.","sol_sub":"Vocaris fängt Routineanrufe ab und legt jedes Anliegen strukturiert vor — Ihr Empfang gewinnt den Kopf zurück.",
  "features":[{"t":"Termine im Gespräch","s":"Vocaris vergibt und verschiebt Termine nach Ihren Regeln und schickt eine Erinnerung — das senkt Ausfälle."},{"t":"Rezepte & Anliegen","s":"Rezept-, Überweisungs- und Rückrufwünsche nimmt Vocaris strukturiert auf und legt sie der Praxis vor."},{"t":"Entlastet den Empfang","s":"Routineanrufe fängt Vocaris ab — Ihr Team kümmert sich um die Patienten vor Ort."}],
  "faq":[{"q":"Ist das mit dem Datenschutz vereinbar?","a":"Ja. Verarbeitung und Hosting in der EU, verschlüsselt, mit Auftragsverarbeitungsvertrag. Auf Wunsch führt ein rein europäisches Modell die Anrufe."},{"q":"Stellt Vocaris Diagnosen?","a":"Nein. Vocaris organisiert Termine und Anliegen — medizinische Fragen bleiben bei Ihrem Team."},{"q":"Kann er dringende Fälle erkennen?","a":"Vocaris ordnet die Dringlichkeit ein und kann Notfälle direkt an Ihr Team weiterleiten oder eine klare Ansage geben."}],
  "cta_sub":"Ein Testanruf zeigt mehr als jede Broschüre. Datenschutz und Abläufe klären wir persönlich mit Ihnen.",
 },
 {
  "slug":"handwerk.html","eyebrow":"HANDWERK & BAU","callhead":"Anruf von der Baustelle",
  "title":"Vocaris für Handwerker — kein verpasster Anruf mehr auf der Baustelle",
  "desc":"Auf dem Dach, unter der Spüle, im Auto — Sie können nicht ans Telefon. Vocaris nimmt Anrufe an, qualifiziert Aufträge, erkennt Notfälle und ruft für Sie zurück.",
  "h1":"Hände voll.<br>Telefon klingelt.",
  "lede":"Auf der Baustelle oder unter der Spüle kann niemand rangehen — und jeder verpasste Anruf ist ein verlorener Auftrag. Vocaris nimmt an, erfasst das Anliegen, erkennt Notfälle und legt Ihnen alles sortiert vor.",
  "cta_line":"So nimmt Vocaris einen Notfall-Anruf für Sie an.",
  "dialog":{"in":"„Hallo, bei uns läuft Wasser aus der Heizung — können Sie heute noch kommen?“","out":"„Das klingt dringend. Ich nehme Adresse und Nummer auf und markiere es als Notfall — der Chef ruft in Kürze zurück.“","cf":"✓ Notfall erfasst · Rückruf ausgelöst"},
  "stats":[{"n":"0","l":"verpasste Aufträge"},{"n":"24/7","l":"auch nach Feierabend"},{"n":"Notfall","l":"sofort erkannt"},{"n":"Rückruf","l":"automatisch ausgelöst"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Beide Hände voll</strong> — das Telefon klingelt ungehört durch.","Neukunden rufen einmal an, erreichen niemanden und nehmen den Nächsten.","Notfälle und Routine landen im selben unsortierten Anruf-Chaos.","Abends und am Wochenende ist niemand erreichbar."],
  "cost":"Ein Neukunde, der niemanden erreicht, ruft <b>kein zweites Mal</b> an — er wählt die nächste Nummer. Jeder verpasste Auftrag ist Umsatz, der direkt zur Konkurrenz wandert.",
  "sol_title":"Nimmt jeden Anruf an, während Sie arbeiten.","sol_sub":"Vocaris qualifiziert Aufträge und Notfälle und legt Ihnen alles sortiert vor — Sie rufen nur zurück, was sich lohnt.",
  "features":[{"t":"Qualifiziert Aufträge","s":"Vocaris fragt Gewerk, Ort und Dringlichkeit ab und legt jeden Auftrag sortiert vor — Sie rufen gezielt zurück."},{"t":"Erkennt Notfälle","s":"Rohrbruch oder Heizungsausfall markiert Vocaris als dringend und löst sofort einen Rückruf aus."},{"t":"Ruft selbst zurück","s":"Vocaris kann Rückrufe und Terminerinnerungen auch aktiv rausrufen — Sie bleiben am Werk."}],
  "faq":[{"q":"Muss ich während der Arbeit etwas tun?","a":"Nein. Vocaris nimmt alles auf; Sie sehen die sortierten Anrufe später im Dashboard und rufen gezielt zurück."},{"q":"Erkennt er echte Notfälle?","a":"Ja, Vocaris ordnet die Dringlichkeit ein und kann Notfälle sofort per Anruf an Sie durchstellen."},{"q":"Kann er Angebote oder Preise nennen?","a":"Vocaris nennt nur, was Sie hinterlegen. Preise und Angebote bleiben bei Ihnen — er bereitet die Anfrage vor."}],
  "cta_sub":"Ein Testanruf zeigt in 30 Sekunden, wie kein Auftrag mehr verloren geht. Preise nach Anrufvolumen.",
 },
 {
  "slug":"autowerkstatt.html","eyebrow":"KFZ & AUTOWERKSTATT","callhead":"Terminanfrage geht ein",
  "title":"Vocaris für Autowerkstätten — Termine annehmen, ohne die Hebebühne zu verlassen",
  "desc":"In der Werkstatt kann niemand ans Telefon. Vocaris nimmt Serviceanfragen an, vergibt Werkstatttermine und beantwortet Statusfragen — rund um die Uhr.",
  "h1":"Unter der Haube,<br>nicht am Hörer.",
  "lede":"Wer schraubt, geht nicht ans Telefon — und Kunden mit Panne oder TÜV-Frist rufen einfach den Nächsten an. Vocaris nimmt jeden Anruf an, vergibt Werkstatttermine und beantwortet Statusfragen.",
  "cta_line":"So nimmt Vocaris eine Terminanfrage für Ihre Werkstatt an.",
  "dialog":{"in":"„Guten Tag, ich brauche einen Termin für Inspektion und TÜV, am besten nächste Woche.“","out":"„Gern. Dienstag oder Donnerstag hätte ich morgens frei — welcher Tag passt Ihnen?“","cf":"✓ Werkstatttermin gebucht"},
  "stats":[{"n":"0","l":"verpasste Terminanfragen"},{"n":"24/7","l":"Annahme"},{"n":"Termin","l":"direkt vergeben"},{"n":"Status","l":"beantwortet"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Das Werkstatt-Telefon klingelt</strong>, alle Hände sind ölig.","Kunden mit Panne oder ablaufendem TÜV wollen sofort jemanden erreichen.","Terminanfragen kommen, während der Meister am Fahrzeug steht.","Rückfragen zum Reparaturstatus binden ständig Zeit."],
  "cost":"Ein Kunde mit dringender Reparatur, der niemanden erreicht, ist beim nächsten Betrieb — <b>und kommt selten zurück</b>. Volle Auftragsbücher fangen am Telefon an.",
  "sol_title":"Vergibt Termine, während Sie schrauben.","sol_sub":"Vocaris kennt Ihre freien Zeiten, bucht Termine und beantwortet Statusfragen — Stoßzeiten inklusive.",
  "features":[{"t":"Vergibt Werkstatttermine","s":"Vocaris kennt Ihre freien Zeiten und bucht Inspektion, TÜV oder Reparatur direkt ein."},{"t":"Beantwortet Statusfragen","s":"„Ist mein Auto fertig?“ beantwortet Vocaris aus Ihren hinterlegten Infos oder nimmt einen Rückruf auf."},{"t":"Fängt Stoßzeiten ab","s":"Morgens bei der Annahme und abends bei der Abholung nimmt Vocaris parallel Anrufe an, statt sie verhallen zu lassen."}],
  "faq":[{"q":"Kann Vocaris Kostenvoranschläge machen?","a":"Nein — er nimmt die Anfrage strukturiert auf und legt sie Ihnen vor. Preise bleiben bei Ihnen."},{"q":"Kennt er meine Auslastung?","a":"Vocaris bucht nur in die von Ihnen freigegebenen Zeiten und vergibt keine Termine, die nicht frei sind."},{"q":"Was ist mit Abschlepp- oder Notfällen?","a":"Dringende Fälle erkennt Vocaris und kann direkt an Sie durchstellen oder einen sofortigen Rückruf auslösen."}],
  "cta_sub":"Ein Testanruf zeigt, wie keine Terminanfrage mehr verhallt. Preise nach Anrufvolumen.",
 },
 {
  "slug":"friseur.html","eyebrow":"FRISEUR, KOSMETIK & SALON","callhead":"Terminwunsch geht ein",
  "title":"Vocaris für Friseure & Salons — Termine annehmen, während Sie am Kunden sind",
  "desc":"Schere in der Hand, Telefon klingelt: Vocaris nimmt Terminbuchungen und Absagen an, füllt Lücken aus der Warteliste und erinnert Kunden per SMS.",
  "h1":"Schere in der Hand.<br>Termin am Telefon.",
  "lede":"Während Sie am Kunden sind, klingelt das Telefon ungehört — und Terminanfragen wandern zur Konkurrenz. Vocaris nimmt Buchungen und Absagen an, füllt frei werdende Slots und erinnert per SMS.",
  "cta_line":"So nimmt Vocaris eine Terminbuchung für Ihren Salon an.",
  "dialog":{"in":"„Hallo, ich hätte gern einen Termin zum Schneiden und Färben, diese Woche nachmittags.“","out":"„Donnerstag 15 Uhr wäre frei — für Schneiden und Färben plane ich zwei Stunden ein. Passt das?“","cf":"✓ Termin gebucht · Erinnerung per SMS"},
  "stats":[{"n":"0","l":"verpasste Terminanrufe"},{"n":"24/7","l":"Buchung"},{"n":"SMS","l":"Erinnerung gegen No-Shows"},{"n":"Warteliste","l":"füllt Lücken"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Beide Hände am Kunden</strong> — das Telefon läutet ins Leere.","Kurzfristige Absagen hinterlassen teure Leerlauf-Slots.","No-Shows, weil die Erinnerung fehlt.","Anrufe nach Ladenschluss gehen verloren."],
  "cost":"Ein leerer Stuhl durch eine verpasste Buchung oder einen No-Show ist <b>direkt verlorene Arbeitszeit</b> — und die holen Sie an einem vollen Tag nicht mehr auf.",
  "sol_title":"Bucht Termine, während Sie am Stuhl stehen.","sol_sub":"Vocaris kennt Ihre Leistungen und Dauer, vergibt passende Slots und hält Ihren Kalender voll.",
  "features":[{"t":"Bucht & verschiebt Termine","s":"Vocaris kennt Ihre Leistungen und Dauer, vergibt passende Slots und verschiebt auf Wunsch."},{"t":"Füllt Lücken automatisch","s":"Sagt jemand ab, bietet Vocaris den Slot der Warteliste an — Ihr Kalender bleibt voll."},{"t":"Erinnert per SMS","s":"Die automatische Terminerinnerung senkt No-Shows spürbar."}],
  "faq":[{"q":"Kennt Vocaris meine Leistungen und deren Dauer?","a":"Ja. Sie hinterlegen Leistungen samt Dauer, Vocaris plant den passenden Zeitblock ein."},{"q":"Kann er Stammkunden erkennen?","a":"An der Rufnummer erkennt Vocaris wiederkehrende Kunden und begrüßt sie mit Namen."},{"q":"Was passiert bei Absagen?","a":"Vocaris trägt die Absage ein und bietet den frei gewordenen Termin aktiv der Warteliste an."}],
  "cta_sub":"Ein Testanruf zeigt, wie Ihr Kalender voll bleibt. Preise nach Anrufvolumen.",
 },
 {
  "slug":"kanzlei.html","eyebrow":"ANWALTS- & STEUERKANZLEIEN","callhead":"Mandantenanruf geht ein",
  "title":"Vocaris für Kanzleien — jeder Mandantenanruf professionell angenommen",
  "desc":"Anwalts- und Steuerkanzleien: Vocaris nimmt Mandantenanrufe an, qualifiziert Anliegen, vergibt Termine und nimmt vertrauliche Nachrichten auf — DSGVO-konform in der EU.",
  "h1":"Kein Mandant<br>in der Warteschleife.",
  "lede":"Konzentrierte Arbeit verträgt keine Dauerklingel — aber jeder verpasste Mandantenanruf wirkt unprofessionell. Vocaris nimmt an, ordnet das Anliegen ein, vergibt Termine und nimmt vertrauliche Nachrichten auf.",
  "cta_line":"So nimmt Vocaris einen Mandantenanruf für Ihre Kanzlei an.",
  "dialog":{"in":"„Guten Tag, es geht um eine Kündigung, die ich erhalten habe — bekomme ich einen Termin?“","out":"„Selbstverständlich. Ich nehme Ihr Anliegen auf und schlage einen Termin vor — Donnerstag 11 Uhr wäre möglich. Passt Ihnen das?“","cf":"✓ Termin vorgeschlagen · Anliegen notiert"},
  "stats":[{"n":"0","l":"verpasste Mandantenanrufe"},{"n":"24/7","l":"erreichbar"},{"n":"DSGVO","l":"EU-Hosting & AV-Vertrag"},{"n":"Termin","l":"direkt vorgeschlagen"}],
  "pain_title":"Kennen Sie das?",
  "pains":["<strong>Konzentrierte Fallarbeit und ständiges Klingeln</strong> vertragen sich nicht.","Mandanten in der Warteschleife wirken schnell unprofessionell.","Erstanfragen kommen zur Unzeit und gehen verloren.","Nach Bürozeiten erreicht niemand die Kanzlei."],
  "cost":"Ein potenzieller Mandant, der in der Warteschleife hängt oder auf der Mailbox landet, ist morgen bei der nächsten Kanzlei. <b>Der erste Eindruck entscheidet.</b>",
  "sol_title":"Nimmt jeden Mandanten professionell an.","sol_sub":"Vocaris ordnet das Anliegen ein und vergibt Termine — ohne Rechtsberatung, vertraulich und konform.",
  "features":[{"t":"Qualifiziert Anliegen","s":"Vocaris erfragt Rechtsgebiet bzw. Anliegen und Dringlichkeit und legt es strukturiert vor — ohne Rechtsberatung."},{"t":"Vergibt Termine","s":"Erstberatung oder Rückruf — Vocaris schlägt passende Termine vor und trägt sie ein."},{"t":"Vertraulich & konform","s":"Verschlüsselt, EU-gehostet, mit AV-Vertrag. Auf Wunsch führt ein europäisches Modell die Gespräche."}],
  "faq":[{"q":"Gibt Vocaris Rechtsauskünfte?","a":"Nein. Vocaris nimmt Anliegen und Termine auf — die Beratung bleibt ausschließlich bei Ihnen."},{"q":"Wie steht es um die Vertraulichkeit?","a":"Verschlüsselte Verbindung, Verarbeitung und Hosting in der EU, Auftragsverarbeitungsvertrag inklusive."},{"q":"Erkennt er dringende Fristsachen?","a":"Vocaris ordnet die Dringlichkeit ein und kann eilige Anliegen sofort an Sie weiterleiten."}],
  "cta_sub":"Ein Testanruf zeigt, wie jeder Mandant professionell empfangen wird. Vertraulichkeit klären wir persönlich.",
 },
]

for b in BRANCHES:
    open(b["slug"], "w", encoding="utf-8").write(render(b))
    print("geschrieben:", b["slug"])
print("Fertig:", len(BRANCHES), "Branchen-Seiten")
