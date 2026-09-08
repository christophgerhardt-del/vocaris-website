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

  // ── Schreibmaschinen-Überschrift ──
  // Der volle Text bleibt unsichtbar stehen und hält die Fläche exakt fest;
  // getippt wird in eine Überlagerung. So springt keine Zeile.
  const tippEl = document.querySelector('[data-tippen]');
  if (tippEl && !ruhig) {
    const zeilen = tippEl.dataset.tippen.split('|');
    tippEl.style.position = 'relative';
    tippEl.innerHTML = '<span style="visibility:hidden">' + zeilen.join('<br>') + '</span><span class="tippt-ebene" style="position:absolute;inset:0"></span>';
    const ebene = tippEl.querySelector('.tippt-ebene');
    const caret = '<span class="tippt-caret"></span>';
    let z = 0, i = 0, out = '';
    const tick = () => {
      if (z >= zeilen.length) { ebene.innerHTML = out.replace(/<br>$/, ''); return; }
      i++;
      if (i > zeilen[z].length) { out += zeilen[z] + '<br>'; z++; i = 0; setTimeout(tick, 260); }
      else { ebene.innerHTML = out + zeilen[z].slice(0, i) + caret; setTimeout(tick, 55 + Math.random() * 45); }
    };
    setTimeout(tick, 350);
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

  // ── Angebots-Karte: einmal je Sitzung, wenn tiefer gescrollt wird ──
  if (document.querySelector('.vergleich') && !sessionStorage.getItem('vocaris.angebot.zu')) {
    const k = document.createElement('div');
    k.className = 'angebot'; k.setAttribute('role', 'dialog'); k.setAttribute('aria-label', 'Testanruf');
    k.innerHTML = '<button class="zu" aria-label="Schließen">×</button>' +
      '<h3>Lieber selbst hören?</h3>' +
      '<p>Rufnummer eintragen — Vocaris ruft Sie in wenigen Sekunden zurück. Kostenlos, unverbindlich, ohne Anmeldung.</p>' +
      '<div class="knoepfe"><a class="btn hell" href="#testanruf">Testanruf erhalten</a><a class="btn glas" href="demo.html">Persönliche Demo</a></div>';
    document.body.appendChild(k);
    k.querySelector('.zu').addEventListener('click', () => { k.classList.remove('da'); try { sessionStorage.setItem('vocaris.angebot.zu', '1'); } catch (e) {} });
    let gezeigt = false;
    window.addEventListener('scroll', () => {
      if (gezeigt) return;
      if (window.scrollY > window.innerHeight * 1.6) { gezeigt = true; k.classList.add('da'); }
    }, { passive: true });
  }
})();
