// Vocaris – gemeinsame Skripte für Unterseiten
(function(){
  var API='https://ki-anruf.onrender.com';
  var nav=document.getElementById('nav');
  if(nav) addEventListener('scroll',function(){nav.classList.toggle('scrolled',scrollY>8);},{passive:true});

  // Sanftes Scrollen zu Sprungmarken auf derselben Seite (rAF-getrieben,
  // damit es unabhängig von Browser-Eigenheiten zuverlässig scrollt).
  var reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function smoothTo(y){y=Math.max(0,y);
    if(reduceMotion){window.scrollTo(0,y);return;}
    var start=window.scrollY,d=y-start,t0=null,dur=Math.min(700,Math.max(280,Math.abs(d)*0.5));
    function step(ts){if(t0===null)t0=ts;var p=Math.min(1,(ts-t0)/dur),e=1-Math.pow(1-p,3);
      window.scrollTo(0,Math.round(start+d*e));if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);}
  function scrollToId(id,smooth){var el=id&&document.getElementById(id);if(!el)return false;
    var y=el.getBoundingClientRect().top+window.scrollY-80;
    if(smooth)smoothTo(y);else window.scrollTo(0,Math.max(0,y));return true;}
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click',function(e){var id=a.getAttribute('href').slice(1);
      if(scrollToId(id,true)){e.preventDefault();history.pushState(null,'','#'+id);}});
  });

  // Testanruf-Formular(e)
  document.querySelectorAll('[data-callform]').forEach(function(f){
    var err=f.parentElement.querySelector('[data-err]');
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var input=f.querySelector('input[type=tel]'), consent=f.querySelector('[data-consent]');
      var num=(input.value||'').replace(/[^\d+]/g,'');
      if(err)err.textContent='';
      if(!/^\+49\d{6,13}$/.test(num)){if(err)err.textContent='Bitte eine deutsche Nummer im Format +49… angeben.';input.focus();return;}
      if(consent&&!consent.checked){if(err)err.textContent='Bitte die Einwilligung bestätigen.';return;}
      var btn=f.querySelector('button');btn.disabled=true;var old=btn.textContent;btn.textContent='Ruft an…';
      fetch(API+'/api/demo-call',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({phone:num,consent:true})})
        .then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d};});})
        .then(function(res){
          if(!res.ok){if(err)err.textContent=(res.d&&res.d.error)||'Anruf konnte nicht gestartet werden.';btn.disabled=false;btn.textContent=old;return;}
          var s=document.createElement('div');s.className='callsuccess';
          s.innerHTML='<b>✓ Geschafft.</b> Vocaris ruft Sie in wenigen Sekunden an. Nehmen Sie einfach ab.';
          f.replaceWith(s);
        })
        .catch(function(){if(err)err.textContent='Server nicht erreichbar. Bitte später erneut.';btn.disabled=false;btn.textContent=old;});
    });
  });

  // Scroll-Reveal
  var sel='.eyebrow,.hero h1,.hero p.lede,.callform,.stat,.arrows,.grid-art,.icard,.mcard,.scard,.softcard,.dark-sec h2,.dark-sec p.lede,.step,.cta h2,.cta p,.h2-big,.faq,.faq-aside';
  var els=[].slice.call(document.querySelectorAll(sel));
  els.forEach(function(e){e.classList.add('reveal');});
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
  document.querySelectorAll('.cards-3,.cards-4,.grid-2x2,.stats').forEach(function(g){
    [].slice.call(g.children).forEach(function(c,i){ if(c.classList.contains('reveal')&&i<4) c.classList.add('d'+(i+1)); });
  });
  var io=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.14,rootMargin:'0px 0px -8% 0px'});
  els.forEach(function(e){io.observe(e);});
})();
