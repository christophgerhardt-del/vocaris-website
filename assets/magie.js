// Vocaris — Interaktionen der Startseite, nach dem Vorbild von presio.eu.
// Jedes Stück aktiviert sich nur, wenn sein Element auf der Seite steht.
// Inhalte stehen im HTML; hier wird nur bewegt, gezählt und geschaltet.
(() => {
  const ruhig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Navigation: nach dem Kopfbereich auf Weiß ──
  const nav = document.getElementById('nav');
  if (nav) {
    const umschalten = () => nav.classList.toggle('fest', window.scrollY > 40);
    window.addEventListener('scroll', umschalten, { passive: true });
    umschalten();
  }

  // ── Ausklappmenüs (öffnen bei Zeiger UND Klick, schließen bei Wegklick/Escape) ──
  document.querySelectorAll('.hat-menue').forEach((m) => {
    const knopf = m.querySelector('.hat-pfeil') || m.querySelector('button');
    if (!knopf) return;
    let zu = null;
    const auf = () => { clearTimeout(zu); m.classList.add('offen'); knopf.setAttribute('aria-expanded', 'true'); };
    const dicht = () => { m.classList.remove('offen'); knopf.setAttribute('aria-expanded', 'false'); };
    m.addEventListener('mouseenter', auf);
    m.addEventListener('mouseleave', () => { zu = setTimeout(dicht, 160); });
    knopf.addEventListener('click', () => (m.classList.contains('offen') ? dicht() : auf()));
    document.addEventListener('click', (e) => { if (!m.contains(e.target)) dicht(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dicht(); });
  });

  // ── Mobiles Menü ──
  const burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', () => {
      const offen = document.body.classList.toggle('menue-offen');
      burger.setAttribute('aria-expanded', String(offen));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menue-offen')) {
        document.body.classList.remove('menue-offen'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
      }
    });
    document.querySelectorAll('.mobil-menue a').forEach((a) => a.addEventListener('click', () => {
      document.body.classList.remove('menue-offen'); burger.setAttribute('aria-expanded', 'false');
    }));
  }

  // ── Einblenden beim Scrollen ──
  if (!ruhig && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add('da'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach((n) => io.observe(n));
  } else {
    document.querySelectorAll('.reveal').forEach((n) => n.classList.add('da'));
  }

  // ── Zähler ──
  document.querySelectorAll('[data-zaehl]').forEach((z) => {
    const ziel = parseFloat(z.dataset.zaehl); const suffix = z.dataset.suffix || ''; const prefix = z.dataset.prefix || '';
    const nk = parseInt(z.dataset.nk || '0', 10);
    const fmt = (v) => prefix + v.toLocaleString('de-DE', { minimumFractionDigits: nk, maximumFractionDigits: nk }) + suffix;
    if (ruhig || !('IntersectionObserver' in window)) { z.textContent = fmt(ziel); return; }
    const io2 = new IntersectionObserver((es) => {
      if (!es.some((e) => e.isIntersecting)) return;
      io2.disconnect();
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / 900);
        z.textContent = fmt(ziel * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io2.observe(z);
  });

  // ── Der Browser-Rahmen folgt dem Zeiger ein wenig ──
  const bild = document.getElementById('heroBild');
  if (bild && !ruhig && matchMedia('(pointer: fine)').matches) {
    const hero = bild.closest('.hero-band');
    hero.addEventListener('mousemove', (ev) => {
      const r = hero.getBoundingClientRect();
      bild.style.transform = `translate(${((ev.clientX - r.left) / r.width - 0.5) * -8}px, ${((ev.clientY - r.top) / r.height - 0.5) * -6}px)`;
    });
    hero.addEventListener('mouseleave', () => { bild.style.transform = ''; });
  }


  // ── Der Anruf zum Anhören (echte Aufnahmen aus dem Produkt) ──
  // Anrufer-Zeilen erscheinen als Text, Vocaris-Zeilen spielen die Aufnahme.
  // Es gibt genau EINEN Ton auf der Seite: Startet hier etwas, stoppt die
  // Stimmenprobe — und umgekehrt.
  const player = document.querySelector('[data-player]');
  let aktuellerTon = null;
  const stoppeTon = () => { if (aktuellerTon) { aktuellerTon.pause(); aktuellerTon.currentTime = 0; aktuellerTon = null; } document.dispatchEvent(new Event('vocaris:ton-aus')); };
  if (player) {
    const play = player.querySelector('[data-play]'), bars = player.querySelector('[data-bars]'), zeit = player.querySelector('[data-zeit]');
    const status = player.querySelector('[data-status]'), ergebnis = player.querySelector('[data-ergebnis]');
    const schritte = [...player.querySelectorAll('[data-schritt]')];
    for (let i = 0; i < 18; i++) bars.appendChild(document.createElement('i'));
    const balken = [...bars.children];
    let laeuft = false, timer = [], barTimer = 0, sek = 0, uhr = 0, ton = null;
    const icon = (p) => { play.innerHTML = p ? '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>' : '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>'; play.setAttribute('aria-label', p ? 'Anruf anhalten' : 'Anruf abspielen'); };
    const welle = (an) => { clearTimeout(barTimer); player.classList.toggle('spricht', an); if (!an || ruhig) { balken.forEach((b) => b.style.height = '20%'); return; } const f = () => { balken.forEach((b, i) => { const m = 1 - Math.abs(i - 8.5) / 8.5; b.style.height = (15 + Math.random() * 85 * (0.4 + 0.6 * m)) + '%'; }); barTimer = setTimeout(f, 95); }; f(); };
    const zurueck = () => { laeuft = false; timer.forEach(clearTimeout); timer = []; clearInterval(uhr); welle(false); icon(false); play.classList.remove('laeuft'); if (ton) { ton.pause(); ton = null; } schritte.forEach((z) => z.classList.remove('aktiv')); };
    const reset = () => { zurueck(); sek = 0; zeit.textContent = '0:00'; schritte.forEach((z) => z.classList.remove('da')); ergebnis.classList.remove('da'); status.textContent = 'Vocaris vergibt einen Kontrolltermin — hören Sie selbst.'; };
    const spiele = async (i) => {
      if (!laeuft) return;
      if (i >= schritte.length) { zurueck(); ergebnis.classList.add('da'); status.textContent = 'Fertig — Termin vergeben, Bestätigung per SMS.'; return; }
      const z = schritte[i]; schritte.forEach((x) => x.classList.remove('aktiv')); z.classList.add('da', 'aktiv'); z.scrollIntoView({ block: 'nearest' });
      const src = z.dataset.audio;
      if (src) {
        status.textContent = 'Vocaris spricht …'; welle(true);
        ton = new Audio(src); aktuellerTon = ton;
        try { await ton.play(); } catch (e) { welle(false); timer.push(setTimeout(() => spiele(i + 1), 1400)); return; }
        ton.onended = () => { welle(false); if (laeuft) timer.push(setTimeout(() => spiele(i + 1), 500)); };
      } else {
        status.textContent = 'Anrufer spricht …';
        timer.push(setTimeout(() => spiele(i + 1), 1700));
      }
    };
    play.addEventListener('click', () => {
      if (laeuft) { zurueck(); status.textContent = 'Angehalten.'; return; }
      document.dispatchEvent(new Event('vocaris:ton-aus'));
      if (schritte[schritte.length - 1].classList.contains('da')) reset();
      laeuft = true; icon(true); play.classList.add('laeuft');
      uhr = setInterval(() => { sek++; zeit.textContent = Math.floor(sek / 60) + ':' + String(sek % 60).padStart(2, '0'); }, 1000);
      spiele(0);
    });
    document.addEventListener('vocaris:ton-aus', () => { if (laeuft) zurueck(); });
  }

  // ── Stimmenprobe: echte Aufnahmen der wählbaren Stimmen ──
  const stimmen = document.querySelectorAll('[data-stimme]');
  if (stimmen.length) {
    let ton = null, aktiv = null;
    const aus = () => { if (ton) { ton.pause(); ton = null; } if (aktiv) { aktiv.classList.remove('laeuft'); aktiv = null; } };
    stimmen.forEach((k) => k.addEventListener('click', () => {
      if (aktiv === k) { aus(); return; }
      document.dispatchEvent(new Event('vocaris:ton-aus')); aus();
      ton = new Audio(k.dataset.stimme); aktiv = k; k.classList.add('laeuft');
      ton.onended = aus; ton.play().catch(aus);
    }));
    document.addEventListener('vocaris:ton-aus', () => { if (aktiv) aus(); });
  }

  // ── Vorher/Nachher-Regler ──
  document.querySelectorAll('.vergleich').forEach((v) => {
    const setzen = (x) => {
      const r = v.getBoundingClientRect();
      v.style.setProperty('--pos', Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100)) + '%');
    };
    let zieht = false;
    v.addEventListener('pointerdown', (e) => { zieht = true; v.setPointerCapture(e.pointerId); setzen(e.clientX); });
    v.addEventListener('pointermove', (e) => { if (zieht) setzen(e.clientX); });
    const stopp = () => { zieht = false; };
    v.addEventListener('pointerup', stopp); v.addEventListener('pointercancel', stopp);
    v.setAttribute('tabindex', '0');
    v.addEventListener('keydown', (e) => {
      const cur = parseFloat(getComputedStyle(v).getPropertyValue('--pos')) || 50;
      if (e.key === 'ArrowLeft') { v.style.setProperty('--pos', Math.max(0, cur - 4) + '%'); e.preventDefault(); }
      if (e.key === 'ArrowRight') { v.style.setProperty('--pos', Math.min(100, cur + 4) + '%'); e.preventDefault(); }
    });
    // Kleiner Anstupser beim ersten Sichtbarwerden: hier kann man ziehen.
    if (!ruhig && 'IntersectionObserver' in window) {
      new IntersectionObserver((es, io) => {
        if (!es.some((x) => x.isIntersecting)) return;
        io.disconnect();
        let t = 0;
        const anim = setInterval(() => {
          t++; v.style.setProperty('--pos', (50 + Math.sin(t / 6) * 9) + '%');
          if (t > 36) { clearInterval(anim); v.style.setProperty('--pos', '50%'); }
        }, 40);
        v.addEventListener('pointerdown', () => clearInterval(anim), { once: true });
      }, { threshold: 0.5 }).observe(v);
    }
  });

})();

// ── Live-Status: eine echte Messung gegen das Backend, keine Behauptung ──────
// Zeigt die Zeile nur, wenn /api/status antwortet. Antwortzeit = gemessene
// Rundlaufzeit aus dem Browser des Besuchers, gerundet auf 10 ms.
(() => {
  const zeile = document.querySelector('[data-systemstatus]');
  if (!zeile || !('fetch' in window)) return;
  const text = zeile.querySelector('[data-status-text]');
  const mess = zeile.querySelector('[data-status-mess]');
  const start = performance.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  fetch('https://ki-anruf.onrender.com/api/status', { signal: ctrl.signal, cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('status ' + r.status))))
    .then((d) => {
      clearTimeout(timer);
      const ms = Math.max(10, Math.round((performance.now() - start) / 10) * 10);
      if (d && d.ok) {
        text.textContent = 'Alle Systeme laufen';
        mess.textContent = '· Antwort in ' + ms + ' ms · gerade geprüft';
      } else {
        zeile.classList.add('gestoert');
        text.textContent = 'Eingeschränkter Betrieb';
        mess.textContent = '· wir arbeiten daran';
      }
      zeile.hidden = false;
    })
    .catch(() => { clearTimeout(timer); /* nichts anzeigen: keine erfundene Verfügbarkeit */ });
})();
