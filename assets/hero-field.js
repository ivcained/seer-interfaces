/* Hero flow field — particles riding a noise field, echoing Seer's idea:
   many independent views flowing into one signal. Ambient background only;
   never competes with the mark. Reduced-motion safe, pauses offscreen. */
(function(){
  const hero = document.querySelector('.hero');
  if(!hero) return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-field';
  canvas.setAttribute('aria-hidden', 'true');
  hero.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, dpr = 1;
  let ground = '#101013', ink = '#7D33FF';
  function readTheme(){
    const cs = getComputedStyle(document.documentElement);
    ground = cs.getPropertyValue('--ground').trim() || ground;
    ink = cs.getPropertyValue('--accent').trim() || ink;
  }
  readTheme();
  window.addEventListener('seer-theme-change', readTheme);

  function size(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
  }
  size();
  window.addEventListener('resize', size);

  // cheap layered trig noise — smooth, no library
  function angle(x, y, t){
    return Math.sin(x * 0.0038 + t * 0.13) * 1.7
         + Math.cos(y * 0.0046 - t * 0.11) * 1.9
         + Math.sin((x + y) * 0.0021 + t * 0.07) * 1.1;
  }

  const N = 170;
  const parts = [];
  function spawn(p){
    p.x = Math.random() * W; p.y = Math.random() * H;
    p.life = 60 + Math.random() * 160;
    p.speed = 0.45 + Math.random() * 0.6;
    return p;
  }
  for(let i = 0; i < N; i++) parts.push(spawn({}));

  let running = true, t = 0, visible = true;
  function frame(){
    if(!running){ return; }
    if(visible && !document.hidden){
      t += 0.016;
      // trails: fade previous frame with a translucent wash of the ground colour
      ctx.globalAlpha = 0.055;
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for(const p of parts){
        const a = angle(p.x, p.y, t);
        const nx = p.x + Math.cos(a) * p.speed;
        const ny = p.y + Math.sin(a) * p.speed * 0.85;
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.10;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny;
        if(--p.life <= 0 || p.x < -4 || p.x > W + 4 || p.y < -4 || p.y > H + 4) spawn(p);
      }
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(hero);
  requestAnimationFrame(frame);
})();
