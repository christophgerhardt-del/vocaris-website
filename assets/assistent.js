/* Vocaris — Website-Assistent unten rechts, nach dem Vorbild von presio.eu.
   Nach kurzer Zeit meldet sich eine Sprechblase; wer bleibt, bekommt den Chat
   einmal von selbst geöffnet. Abweisungen werden je Sitzung gemerkt.
   Backend: /api/site-chat (öffentlich, Streaming, feste Website-Fakten). */
(function () {
  var ENDPOINT = window.VOCARIS_CHAT_ENDPOINT || 'https://ki-anruf.onrender.com/api/site-chat';
  var S_KEY = 'vocaris.assistent';
  var zustand = {};
  try { zustand = JSON.parse(sessionStorage.getItem(S_KEY) || '{}'); } catch (e) {}
  function merken(k, v) { zustand[k] = v; try { sessionStorage.setItem(S_KEY, JSON.stringify(zustand)); } catch (e) {} }

  var L = {
    panel: 'Vocaris-Assistent', online: 'Online · antwortet sofort', teaserTitel: 'Wir sind online!', teaserSub: 'Fragen zu Preisen oder Einstieg?',
    gruss: 'Hallo! Ich beantworte Fragen zu Vocaris — Funktionen, Preise, Branchen, Datenschutz. Was möchten Sie wissen?',
    platzhalter: 'Fragen Sie etwas über Vocaris …', senden: 'Senden',
    chips: ['Was kostet Vocaris?', 'Für welche Branchen?', 'Wie schnell bin ich startklar?', 'Bleiben Daten in der EU?'],
    disclaimer: 'KI-Assistent · Antworten können Fehler enthalten · bitte keine personenbezogenen Daten eingeben',
    rate: 'Für heute ist das Kontingent erreicht. Schreiben Sie uns gern über die Demo-Seite.',
    fehler: 'Gerade klappt es nicht. Versuchen Sie es gleich noch einmal oder buchen Sie eine Demo.',
  };

  var LOGO = '<svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><path d="M16 2C8.3 2 2 7.6 2 14.5c0 3.9 2 7.4 5.2 9.7v5.1c0 .6.7 1 1.2.6l5-3.6c.8.1 1.7.2 2.6.2 7.7 0 14-5.6 14-12.5S23.7 2 16 2z" fill="#fff"/><g fill="#5c5aee"><rect x="8.6" y="12" width="2.8" height="5" rx="1.4"/><rect x="13" y="8.8" width="2.8" height="11.4" rx="1.4"/><rect x="17.4" y="10.6" width="2.8" height="7.8" rx="1.4"/><rect x="21.8" y="12.6" width="2.8" height="3.8" rx="1.4"/></g></svg>';

  var css = document.createElement('style');
  css.textContent = '\
.pa-wurzel{position:fixed;right:20px;bottom:44px;z-index:70;font-family:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif}\
.pa-knopf{width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;padding:3px;background:linear-gradient(135deg,#5c5aee,#7c3aed 60%,#f59e0b);box-shadow:0 10px 26px -8px rgba(10,37,64,.5);transition:transform .18s ease;position:relative}\
.pa-knopf:hover{transform:scale(1.07)} .pa-knopf:focus-visible{outline:2px solid #5c5aee;outline-offset:2px}\
.pa-knopf .pa-innen{width:100%;height:100%;border-radius:50%;background:#0a2540;display:flex;align-items:center;justify-content:center}\
.pa-punkt{position:absolute;right:2px;bottom:4px;width:13px;height:13px;border-radius:50%;background:#16a34a;border:2.5px solid #fff}\
.pa-teaser{position:absolute;right:70px;bottom:6px;background:#fff;border-radius:14px 14px 4px 14px;box-shadow:0 13px 27px -5px rgba(50,50,93,.25),0 8px 16px -8px rgba(0,0,0,.3);padding:12px 34px 12px 16px;width:max-content;max-width:240px;cursor:pointer;opacity:0;transform:translateY(8px);transition:opacity .25s ease,transform .25s ease;pointer-events:none}\
.pa-teaser.da{opacity:1;transform:none;pointer-events:auto} .pa-teaser b{display:block;color:#0a2540;font-size:14.5px} .pa-teaser span{color:#425466;font-size:13px}\
.pa-teaser .pa-zu{position:absolute;top:6px;right:8px;border:0;background:none;color:#8898aa;cursor:pointer;font-size:15px;line-height:1;padding:4px}\
.pa-panel{position:fixed;right:20px;bottom:44px;z-index:71;width:min(370px,calc(100vw - 32px));height:min(540px,calc(100vh - 120px));background:#fff;border-radius:16px;display:flex;flex-direction:column;box-shadow:0 30px 60px -12px rgba(10,37,64,.4),0 18px 36px -18px rgba(10,37,64,.45),0 0 0 1px #e6ebf1;opacity:0;transform:translateY(14px) scale(.98);pointer-events:none;transition:opacity .22s ease,transform .22s ease;font-family:-apple-system,"SF Pro Text","Segoe UI",system-ui,sans-serif}\
.pa-panel.offen{opacity:1;transform:none;pointer-events:auto}\
.pa-kopf{background:#0a2540;border-radius:16px 16px 0 0;padding:14px 16px;display:flex;gap:11px;align-items:center}\
.pa-kopf .pa-mini{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#5c5aee,#7c3aed);display:flex;align-items:center;justify-content:center;flex:none}\
.pa-kopf b{color:#fff;font-size:15px;display:block;letter-spacing:-.2px} .pa-kopf small{color:#a3b6cc;font-size:11.5px;display:flex;align-items:center;gap:5px}\
.pa-kopf small::before{content:"";width:7px;height:7px;border-radius:50%;background:#4ade80}\
.pa-kopf .pa-schliessen{margin-left:auto;background:rgba(255,255,255,.12);border:0;color:#fff;width:30px;height:30px;border-radius:8px;cursor:pointer;font-size:15px;line-height:1}\
.pa-lauf{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:9px;background:#f6f9fc}\
.pa-msg{max-width:86%;border-radius:13px;padding:9px 13px;font-size:14px;line-height:1.5;overflow-wrap:break-word}\
.pa-msg.bot{align-self:flex-start;background:#fff;color:#0a2540;border:1px solid #e6ebf1;border-bottom-left-radius:4px}\
.pa-msg.user{align-self:flex-end;background:#5c5aee;color:#fff;border-bottom-right-radius:4px}\
.pa-msg a{color:#4340c9} .pa-msg.user a{color:#fff}\
.pa-chips{display:flex;flex-wrap:wrap;gap:7px;padding:0 14px 10px;background:#f6f9fc}\
.pa-chip{border:1px solid #cdd6e0;background:#fff;color:#4340c9;border-radius:99px;padding:6px 13px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s ease}\
.pa-chip:hover{border-color:#5c5aee;background:#eff0ff}\
.pa-fuss{border-top:1px solid #e6ebf1;padding:10px;display:flex;gap:8px;align-items:flex-end;background:#fff}\
.pa-fuss textarea{flex:1;border:1px solid #e6ebf1;border-radius:10px;padding:9px 12px;font-family:inherit;font-size:14px;line-height:1.45;resize:none;max-height:110px;color:#0a2540;background:#fff}\
.pa-fuss textarea:focus{outline:2px solid #5c5aee;outline-offset:-1px}\
.pa-fuss button{border:0;background:#5c5aee;color:#fff;border-radius:10px;padding:9px 14px;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer} .pa-fuss button:disabled{opacity:.5;cursor:default}\
.pa-hinweis{font-size:10.5px;color:#8898aa;text-align:center;padding:0 12px 8px;background:#fff;border-radius:0 0 16px 16px}\
.pa-dots span{display:inline-block;width:6px;height:6px;border-radius:50%;background:#8898aa;margin-right:3px;animation:pa-hop 1s infinite}\
.pa-dots span:nth-child(2){animation-delay:.15s} .pa-dots span:nth-child(3){animation-delay:.3s}\
@keyframes pa-hop{0%,60%,100%{transform:none;opacity:.5}30%{transform:translateY(-4px);opacity:1}}\
@media (max-width:480px){.pa-panel{right:8px;bottom:40px}.pa-wurzel{right:14px}}';
  document.head.appendChild(css);

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(s) {
    return esc(s)
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/(^|\s)(vocaris\.eu\/[a-z0-9./-]*)/g, '$1<a href="https://$2" target="_blank" rel="noopener">$2</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/^\s*[-*]\s+(.+)$/gm, '• $1')
      .replace(/\n/g, '<br>');
  }

  var wurzel = document.createElement('div'); wurzel.className = 'pa-wurzel';
  wurzel.innerHTML = '<div class="pa-teaser" role="button" tabindex="0"><button class="pa-zu" aria-label="Hinweis schließen">×</button><b>' + L.teaserTitel + '</b><span>' + L.teaserSub + '</span></div>' +
    '<button class="pa-knopf" aria-label="Assistent öffnen"><span class="pa-innen">' + LOGO + '</span><span class="pa-punkt"></span></button>';
  document.body.appendChild(wurzel);
  var panel = document.createElement('div'); panel.className = 'pa-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', L.panel);
  panel.innerHTML = '<div class="pa-kopf"><span class="pa-mini">' + LOGO + '</span><span><b>' + L.panel + '</b><small>' + L.online + '</small></span><button class="pa-schliessen" aria-label="Schließen">×</button></div>' +
    '<div class="pa-lauf"></div><div class="pa-chips"></div>' +
    '<div class="pa-fuss"><textarea rows="1" placeholder="' + L.platzhalter + '" aria-label="Nachricht"></textarea><button type="button">' + L.senden + '</button></div>' +
    '<div class="pa-hinweis">' + L.disclaimer + '</div>';
  document.body.appendChild(panel);

  var teaser = wurzel.querySelector('.pa-teaser'), knopf = wurzel.querySelector('.pa-knopf');
  var lauf = panel.querySelector('.pa-lauf'), chips = panel.querySelector('.pa-chips'), ta = panel.querySelector('textarea'), sendBtn = panel.querySelector('.pa-fuss button');
  var history = [], streaming = false, begruesst = false;

  function addMsg(rolle, text) { var d = document.createElement('div'); d.className = 'pa-msg ' + rolle; d.innerHTML = fmt(text); lauf.appendChild(d); lauf.scrollTop = lauf.scrollHeight; return d; }
  function zeigeChips() {
    chips.innerHTML = '';
    L.chips.forEach(function (c) { var b = document.createElement('button'); b.className = 'pa-chip'; b.type = 'button'; b.textContent = c; b.addEventListener('click', function () { senden(c); }); chips.appendChild(b); });
  }
  function oeffnen() {
    panel.classList.add('offen'); teaser.classList.remove('da'); merken('geoeffnet', 1);
    if (!begruesst) { begruesst = true; addMsg('bot', L.gruss); zeigeChips(); }
    setTimeout(function () { ta.focus(); }, 80);
  }
  function schliessen() { panel.classList.remove('offen'); merken('zu', 1); }

  async function senden(text) {
    text = (text || ta.value).trim(); if (!text || streaming) return;
    ta.value = ''; chips.innerHTML = '';
    addMsg('user', text); history.push({ role: 'user', content: text });
    streaming = true; sendBtn.disabled = true;
    var botEl = addMsg('bot', ''); botEl.innerHTML = '<span class="pa-dots"><span></span><span></span><span></span></span>';
    var acc = '';
    try {
      var res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-20), lang: document.documentElement.lang || 'de', page: location.pathname }) });
      if (res.status === 429) { botEl.innerHTML = fmt(L.rate); throw new Error('rate'); }
      if (!res.ok || !res.body) throw new Error('http ' + res.status);
      var reader = res.body.getReader(), dec = new TextDecoder(), buf = '';
      while (true) {
        var r = await reader.read(); if (r.done) break;
        buf += dec.decode(r.value, { stream: true });
        var zeilen = buf.split('\n'); buf = zeilen.pop();
        for (var i = 0; i < zeilen.length; i++) {
          var ln = zeilen[i]; if (ln.indexOf('data:') !== 0) continue;
          var payload = ln.slice(5).trim(); if (!payload || payload === '[DONE]') continue;
          try { var ev = JSON.parse(payload); if (ev.type === 'content_block_delta' && ev.delta && ev.delta.type === 'text_delta') { acc += ev.delta.text; botEl.innerHTML = fmt(acc); lauf.scrollTop = lauf.scrollHeight; } } catch (e) {}
        }
      }
      if (acc) history.push({ role: 'assistant', content: acc }); else botEl.innerHTML = fmt(L.fehler);
    } catch (e) {
      if (e.message !== 'rate') botEl.innerHTML = fmt(L.fehler);
    }
    streaming = false; sendBtn.disabled = false;
  }

  knopf.addEventListener('click', function () { panel.classList.contains('offen') ? schliessen() : oeffnen(); });
  teaser.addEventListener('click', function (e) { if (e.target.classList.contains('pa-zu')) return; oeffnen(); });
  teaser.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); oeffnen(); } });
  wurzel.querySelector('.pa-zu').addEventListener('click', function (e) { e.stopPropagation(); teaser.classList.remove('da'); merken('teaserZu', 1); });
  panel.querySelector('.pa-schliessen').addEventListener('click', schliessen);
  sendBtn.addEventListener('click', function () { senden(); });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); senden(); } });
  ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(110, ta.scrollHeight) + 'px'; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('offen')) schliessen(); });

  // Proaktiv, aber höflich: erst die Sprechblase, dann — nur einmal, nur wenn
  // jemand wirklich bleibt — der geöffnete Chat. Wer abgewinkt hat, hat Ruhe.
  if (!zustand.teaserZu && !zustand.geoeffnet && !zustand.zu) {
    setTimeout(function () { teaser.classList.add('da'); }, 9000);
    setTimeout(function () { if (!zustand.geoeffnet && !zustand.zu && !zustand.teaserZu && !document.hidden && window.scrollY > 600) oeffnen(); }, 45000);
  }
})();
