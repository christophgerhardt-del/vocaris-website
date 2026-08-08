/* Vocaris Reservierungs-Widget — Einbettung in eine beliebige Website.
   Nutzung:  <script src="https://vocaris.eu/embed.js" data-token="DEIN_TOKEN" async></script>
   Erzeugt an dieser Stelle ein responsives iframe mit automatischer Höhe. */
(function () {
  var self = document.currentScript;
  if (!self) {
    var ss = document.querySelectorAll('script[data-token]');
    self = ss[ss.length - 1];
  }
  if (!self) return;
  var token = self.getAttribute('data-token') || self.getAttribute('data-restaurant') || '';
  if (!token) { console.error('Vocaris-Widget: data-token fehlt.'); return; }

  var iframe = document.createElement('iframe');
  iframe.src = 'https://vocaris.eu/reservieren.html?embed=1&r=' + encodeURIComponent(token);
  iframe.title = 'Tisch reservieren';
  iframe.loading = 'lazy';
  iframe.setAttribute('scrolling', 'no');
  iframe.style.cssText = 'width:100%;border:0;overflow:hidden;min-height:520px;display:block';
  self.parentNode.insertBefore(iframe, self);

  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.type === 'vocaris:height' && d.token === token && typeof d.height === 'number') {
      iframe.style.height = (d.height + 8) + 'px';
    }
  });
})();
