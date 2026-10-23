/* Landing effects: Lenis smooth scroll, scroll reveals, number tickers.
   Everything respects prefers-reduced-motion. No network calls. */
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Silk-smooth scrolling (Lenis, vendored). Anchors + sticky keep working.
  if(!reduced && window.Lenis){
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        const el = document.querySelector(a.getAttribute('href'));
        if(el){ e.preventDefault(); lenis.scrollTo(el, { offset: -20 }); el.focus?.(); }
      });
    });
  }

  // 2. Scroll reveals
  const targets = document.querySelectorAll('.fx-reveal');
  if(reduced || !('IntersectionObserver' in window)){
    targets.forEach(t=>t.classList.add('fx-in'));
  } else {
    const io = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){ en.target.classList.add('fx-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(t=>io.observe(t));
  }

  // 3. Number tickers — count up when the numbers grid enters view
  const nums = document.querySelectorAll('.numbers-grid .num');
  const runTicker = el=>{
    const target = parseInt(el.textContent, 10);
    if(!Number.isFinite(target)) return;
    const t0 = performance.now(), dur = 900;
    (function tick(t){
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(target * eased));
      if(k < 1) requestAnimationFrame(tick);
    })(t0);
  };
  if(nums.length){
    if(reduced || !('IntersectionObserver' in window)){ /* leave static */ }
    else{
      const nio = new IntersectionObserver(entries=>{
        entries.forEach(en=>{ if(en.isIntersecting){ nums.forEach(runTicker); nio.disconnect(); } });
      }, { threshold: 0.4 });
      nio.observe(nums[0].closest('.numbers-grid') || nums[0]);
    }
  }
})();
