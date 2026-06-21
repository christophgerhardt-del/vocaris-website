/* ============================================================
   Vocaris — interactions
   ============================================================ */
(() => {
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Year ────────────────────────────────────────────── */
  const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());

  /* ── Nav: scroll state + burger ──────────────────────── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 12);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  burger?.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('.nav__links a, .nav__cta a').forEach(a =>
    a.addEventListener('click', () => nav.classList.remove('is-open')));

  /* ── Cursor glow ─────────────────────────────────────── */
  const glow = $('.cursor-glow');
  if (glow && !reduce) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY;
      if (!raf) raf = requestAnimationFrame(loop); });
    function loop() {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = (Math.abs(tx - cx) > .5 || Math.abs(ty - cy) > .5) ? requestAnimationFrame(loop) : 0;
    }
  }

  /* ── Reveal on scroll ────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ── Animated counters ───────────────────────────────── */
  const counters = $$('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, target = parseFloat(el.dataset.count), suffix = el.dataset.suffix || '';
      const decimals = (String(target).split('.')[1] || '').length;
      const dur = 1100, t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur), eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => cio.observe(c));

  /* ── Hero waveform (canvas) ──────────────────────────── */
  const canvas = $('#wave');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    };
    resize(); addEventListener('resize', resize);
    const N = 48; let t = 0;
    const draw = () => {
      const W = canvas.width, H = canvas.height, mid = H / 2;
      ctx.clearRect(0, 0, W, H);
      const gap = W / N;
      for (let i = 0; i < N; i++) {
        const env = Math.sin((i / N) * Math.PI);                 // taper at edges
        const a = Math.sin(t * 2 + i * 0.5) * Math.sin(t * 0.7 + i);
        const h = (8 + Math.abs(a) * env * (H * 0.42)) * dpr;
        const x = i * gap + gap / 2;
        const g = ctx.createLinearGradient(0, mid - h, 0, mid + h);
        g.addColorStop(0, '#7c3aed'); g.addColorStop(1, '#4f46e5');
        ctx.fillStyle = g;
        const w = gap * 0.42;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x - w / 2, mid - h, w, h * 2, w);
        else ctx.rect(x - w / 2, mid - h, w, h * 2);
        ctx.fill();
      }
      t += 0.05;
      requestAnimationFrame(draw);
    };
    draw();
  }

  /* ── Hero: streaming transcript + latency + timer ────── */
  const chat = $('#chat'), latbar = $('#latbar'), latval = $('#latval'), timerEl = $('#callTimer');
  const convo = [
    { who: 'ai',   label: 'Vocaris', text: 'Praxis Sonnenschein, guten Tag! Wie kann ich helfen?' },
    { who: 'user', label: 'Anrufer', text: 'Ich bräuchte einen Termin zur Kontrolle.' },
    { who: 'ai',   label: 'Vocaris', text: 'Sehr gern. Diese Woche habe ich Donnerstag um 14:30 Uhr frei — passt das?' },
    { who: 'user', label: 'Anrufer', text: 'Ja, perfekt.' },
    { who: 'ai',   label: 'Vocaris', text: 'Wunderbar, ist eingetragen. Sie bekommen gleich eine Bestätigung per SMS.' },
  ];
  if (chat && !reduce) {
    let i = 0;
    const bubble = (m) => {
      const el = document.createElement('div');
      el.className = `bubble bubble--${m.who === 'ai' ? 'ai' : 'user'}`;
      el.innerHTML = `<small>${m.label}</small>${m.text}`;
      chat.appendChild(el);
      while (chat.children.length > 3) chat.removeChild(chat.firstChild);
    };
    const setLat = () => {
      const v = 540 + Math.round(Math.random() * 320);
      if (latval) latval.textContent = v + ' ms';
      if (latbar) latbar.style.width = Math.min(100, (v / 1100) * 100) + '%';
    };
    const tick = () => {
      bubble(convo[i % convo.length]);
      setLat();
      i++;
      setTimeout(tick, 2600);
    };
    tick();
  }
  if (timerEl && !reduce) {
    let s = 7;
    setInterval(() => {
      s++; const m = String(Math.floor(s / 60)).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${ss}`;
    }, 1000);
  }

  /* ── Use case tabs ───────────────────────────────────── */
  const tabs = $$('.uc-tab'), panels = $$('.uc-panel');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    const idx = +tab.dataset.uc;
    tabs.forEach(t => t.classList.toggle('is-active', t === tab));
    panels.forEach((p, n) => p.classList.toggle('is-active', n === idx));
  }));

  /* ── Demo player (echtes Audio) ──────────────────────── */
  const playBtn = $('#demoPlay'), bars = $('#demoBars'), caption = $('#demoCaption'),
        playIcon = $('#playIcon'), chatBox = $('#demoChat');
  if (bars) for (let i = 0; i < 28; i++) bars.appendChild(document.createElement('i'));
  const barEls = $$('#demoBars i');
  const DEMO = [
    { who: 'user', text: 'Guten Tag, ich hätte gern einen Termin zur Kontrolle.' },
    { who: 'ai', text: 'Guten Tag! Sehr gerne. Diese Woche hätte ich Donnerstag um 14:30 Uhr frei — würde Ihnen das passen?', audio: 'assets/demo/voc-1.mp3' },
    { who: 'user', text: 'Donnerstag ist schlecht — geht auch Freitag?' },
    { who: 'ai', text: 'Natürlich. Am Freitag habe ich um 10 Uhr oder um 16 Uhr etwas frei.', audio: 'assets/demo/voc-2.mp3' },
    { who: 'user', text: 'Zehn Uhr klingt gut.' },
    { who: 'ai', text: 'Wunderbar, dann trage ich Sie für Freitag um 10 Uhr ein. Sie bekommen gleich eine Bestätigung per SMS. Bis dahin!', audio: 'assets/demo/voc-3.mp3' },
  ];
  let playing = false, idx = 0, barTimer = 0, stepTimer = 0, audio = null;
  const setIcon = (p) => { if (playIcon) playIcon.innerHTML = p
    ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>'
    : '<path d="M8 5v14l11-7z" fill="currentColor"/>'; };
  const animBars = (on) => {
    clearTimeout(barTimer);
    if (!on || reduce) { barEls.forEach(b => b.style.height = '20%'); return; }
    const f = () => { barEls.forEach(b => b.style.height = (15 + Math.random() * 85) + '%'); barTimer = setTimeout(f, 110); };
    f();
  };
  const addBubble = (turn) => {
    const el = document.createElement('div');
    el.className = 'demo__bubble demo__bubble--' + (turn.who === 'ai' ? 'ai' : 'user');
    el.innerHTML = `<small>${turn.who === 'ai' ? 'Vocaris' : 'Anrufer'}</small>${turn.text}`;
    chatBox.appendChild(el);
    return el;
  };
  const reset = () => {
    playing = false; clearTimeout(barTimer); clearTimeout(stepTimer);
    if (audio) { audio.pause(); audio = null; }
    animBars(false); setIcon(false);
  };
  const next = () => {
    if (!playing) return;
    if (idx >= DEMO.length) { caption.textContent = 'Termin in unter einer Minute vereinbart ✓'; reset(); idx = 0; return; }
    const turn = DEMO[idx++];
    const bubble = addBubble(turn);
    caption.textContent = turn.who === 'ai' ? 'Vocaris spricht …' : 'Anrufer …';
    if (turn.who === 'ai' && turn.audio) {
      bubble.classList.add('is-speaking');
      audio = new Audio(turn.audio);
      animBars(true);
      const done = (delay) => { bubble.classList.remove('is-speaking'); animBars(false); if (playing) stepTimer = setTimeout(next, delay); };
      audio.onended = () => done(450);
      audio.onerror = () => done(1400);
      audio.play().catch(() => done(1400));
    } else {
      stepTimer = setTimeout(next, 1500);
    }
  };
  playBtn?.addEventListener('click', () => {
    if (playing) { reset(); caption.textContent = 'Pausiert — Play drücken'; return; }
    playing = true; idx = 0; chatBox.innerHTML = ''; setIcon(true); next();
  });

  /* ── Lead form → E-Mail an Vocaris (Web3Forms) ───────── */
  const form = $('#leadForm'), hint = $('#formHint');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.elements.name.value.trim(), email = form.elements.email.value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      hint.textContent = 'Bitte Name und eine gültige E-Mail-Adresse angeben.';
      hint.style.color = '#d6453c'; return;
    }
    const btn = form.querySelector('button');
    btn.disabled = true; const original = btn.textContent; btn.textContent = 'Senden …';
    hint.style.color = ''; hint.textContent = '';
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '4f3628fc-f1a2-40ae-84fc-3458856b298f',
          subject: `Neue Demo-Anfrage: ${name}`,
          from_name: 'Vocaris Website',
          replyto: email,
          name, email,
          message: `Demo-Anfrage über die Vocaris-Website.\n\nName: ${name}\nE-Mail: ${email}`,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Senden fehlgeschlagen');
      btn.textContent = 'Danke! ✓';
      hint.textContent = `Danke, ${name.split(' ')[0]}! Wir melden uns innerhalb eines Werktags unter ${email}.`;
      form.reset();
    } catch (err) {
      btn.disabled = false; btn.textContent = original;
      hint.textContent = 'Senden hat nicht geklappt — bitte später erneut versuchen.';
      hint.style.color = '#d6453c';
    }
  });

  // ── Live-Testanruf: Besucher gibt Nummer ein, Vocaris ruft an ──
  const demoBtn = $('#demoCallBtn');
  demoBtn?.addEventListener('click', async () => {
    const phoneEl = $('#demoPhone'), consentEl = $('#demoConsent'), h = $('#demoCallHint');
    const phone = phoneEl.value.replace(/\s/g, '');
    h.className = 'demo__call-hint';
    if (!/^\+49\d{6,13}$/.test(phone)) {
      h.textContent = 'Bitte eine deutsche Nummer im Format +49… eingeben.'; h.classList.add('err'); return;
    }
    if (!consentEl.checked) {
      h.textContent = 'Bitte bestätige die Einwilligung.'; h.classList.add('err'); return;
    }
    demoBtn.disabled = true; const orig = demoBtn.textContent; demoBtn.textContent = 'Verbinde …';
    h.textContent = '';
    try {
      const res = await fetch('https://ki-anruf.onrender.com/api/demo-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, consent: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Anruf konnte nicht gestartet werden.');
      h.textContent = '📞 Wir rufen dich gleich an — bitte halte dein Telefon bereit!'; h.classList.add('ok');
      demoBtn.textContent = 'Anruf gestartet ✓';
    } catch (err) {
      demoBtn.disabled = false; demoBtn.textContent = orig;
      h.textContent = err.message; h.classList.add('err');
    }
  });
})();
