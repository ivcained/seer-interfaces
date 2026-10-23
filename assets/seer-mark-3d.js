/* seer-mark-3d.js — the Seer mark as a fully 3D object.
   The brand's two forms as solid prisms on a 2D canvas, in the spirit of
   robot-heads (MIT © Fayaz Ahmed): yaw/pitch rotation, back-face culling,
   depth-sorted faces, studio shading, no WebGL, no dependencies.
   The violet form rides over the fog form at the interlock — the logo's own
   layering. Drag or arrow keys to turn it; it renders still otherwise. */

'use strict';
(function () {
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── verbatim brand vectors ─────────────────────────────────────────── */
  const D_FOG = 'M146.494 0.01L77.518 68.986C75.941 70.563 77.054 73.262 79.29 73.262L128.369 73.262C135.056 73.262 138.415 81.351 133.676 86.081L75.447 144.309C74.035 145.721 72.129 146.504 70.14 146.504L0 146.504L0 204.733C0 213.028 6.729 219.756 15.023 219.756L67.028 219.756C71.016 219.756 74.829 218.169 77.652 215.356L215.356 77.652C218.169 74.839 219.756 71.016 219.756 67.028L219.756 15.023C219.756 6.729 213.028 0 204.733 0L146.504 0L146.494 0.01Z';
  const D_VIOLET = 'M86.081 133.676L144.309 75.447C145.721 74.035 147.627 73.252 149.616 73.252L219.756 73.252L219.756 15.023C219.756 6.729 213.028 0 204.733 0L152.728 0C148.74 0 144.928 1.587 142.104 4.4L4.4 142.104C1.587 144.917 0 148.74 0 152.728L0 204.733C0 213.028 6.729 219.756 15.023 219.756L73.252 219.756L142.228 150.78C143.804 149.204 142.692 146.504 140.456 146.504L91.377 146.504C84.69 146.504 81.331 138.415 86.07 133.686L86.081 133.676Z';
  const AT_FOG = [77.394, 77.363];
  const AT_VIOLET = [4.122, 4.122];
  const CENTER = [150.636, 150.62];

  /* path → sampled ring (M / L / C, curves flattened) */
  function samplePath(d) {
    const ring = [];
    const re = /([MLC])([^MLCZ]*)/g;
    let m, cur = [0, 0];
    while ((m = re.exec(d))) {
      const n = (m[2].match(/-?\d*\.?\d+/g) || []).map(Number);
      if (m[1] === 'M' || m[1] === 'L') { for (let i = 0; i + 1 < n.length; i += 2) { cur = [n[i], n[i + 1]]; ring.push(cur); } }
      else {
        for (let i = 0; i + 5 < n.length; i += 6) {
          const [x0, y0] = cur, [x1, y1, x2, y2, x3, y3] = n.slice(i);
          for (let s = 1; s <= 10; s++) {
            const t = s / 10, u = 1 - t;
            ring.push([u*u*u*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t*t*t*x3,
                       u*u*u*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t*t*t*y3]);
          }
          cur = [x3, y3];
        }
      }
    }
    return ring;
  }

  /* Douglas–Peucker simplification */
  function simplify(pts, tol) {
    const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
    const stack = [[0, pts.length - 1]];
    while (stack.length) {
      const [a, b] = stack.pop();
      let dmax = 0, idx = -1;
      const [x1, y1] = pts[a], [x2, y2] = pts[b];
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      for (let i = a + 1; i < b; i++) {
        const d = Math.abs((pts[i][0] - x1) * dy - (pts[i][1] - y1) * dx) / len;
        if (d > dmax) { dmax = d; idx = i; }
      }
      if (dmax > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
    }
    return pts.filter((_, i) => keep[i]);
  }

  function ringOf(d, at) {
    let pts = samplePath(d);
    if (pts.length > 2 && Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]) < 0.5) pts = pts.slice(0, -1);
    /* full sampled rings — polygon simplification can self-intersect a closed concave ring */
    return pts.map(([x, y]) => [(x + at[0] - CENTER[0]), (y + at[1] - CENTER[1])]);
  }
  function signedArea(r) { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; }

  /* prism faces: bottom cap, side quads, top cap — z0..z1, outward normals */
  function prism(ring, z0, z1, form) {
    if (signedArea(ring) < 0) ring = [...ring].reverse();
    const faces = [];
    const n = ring.length;
    faces.push({ kind: 'bottom', form, n: [0, 0, -1], v: ring.map(([x, y]) => [x, y, z0]) });
    for (let i = 0; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const l = Math.hypot(ex, ey) || 1;
      faces.push({ kind: 'side', form, n: [ey / l, -ex / l, 0], v: [[a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [a[0], a[1], z1]] });
    }
    faces.push({ kind: 'top', form, n: [0, 0, 1], v: ring.map(([x, y]) => [x, y, z1]) });
    return faces;
  }

  /* the mark: fog form stands 0..32, violet form rides over it 32..64 */
  const PRISM_H = 32;
  const FACES = {
    fog: prism(ringOf(D_FOG, AT_FOG), 0, PRISM_H, 'fog'),
    violet: prism(ringOf(D_VIOLET, AT_VIOLET), PRISM_H, 2 * PRISM_H, 'violet')
  };

  /* ── rotation (robot-heads src/tv/geometry.ts) ─────────────────────── */
  function rotation(yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [cy, sy * sp, sy * cp, 0, cp, -sp, -sy, cy * sp, cy * cp];
  }
  function rot(m, x, y, z) { return [m[0]*x + m[1]*y + m[2]*z, m[3]*x + m[4]*y + m[5]*z, m[6]*x + m[7]*y + m[8]*z]; }

  /* ── studio shading: fixed key upper-left, cool fill, sky wrap ──────── */
  const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const KEY = nrm([-0.5, -0.78, 0.62]), FILL = nrm([0.85, 0.15, 0.5]), BACKL = nrm([0.55, -0.55, -0.62]);
  const VIOLET = [125, 51, 255], FOG = [214, 218, 243];
  function shade(alb, n, kind) {
    const key = Math.max(0, n[0] * KEY[0] + n[1] * KEY[1] + n[2] * KEY[2]);
    const fill = Math.max(0, n[0] * FILL[0] + n[1] * FILL[1] + n[2] * FILL[2]);
    const sky = 0.5 - 0.5 * n[1];
    const back = Math.max(0, n[0] * BACKL[0] + n[1] * BACKL[1] + n[2] * BACKL[2]);
    let l = 0.34 + 0.58 * key + 0.10 * fill + 0.08 * sky + 0.16 * back * back;
    if (kind === 'top') l += 0.08;
    if (kind === 'bottom') l *= 0.62;
    return 'rgb(' + Math.min(255, Math.round(alb[0] * l)) + ',' + Math.min(255, Math.round(alb[1] * l)) + ',' + Math.min(255, Math.round(alb[2] * l)) + ')';
  }

  function mount(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let W = 0, H = 0, dpr = 1;
    const SPEED = parseFloat(canvas.dataset.speed || '0.10');
    let yaw = parseFloat(canvas.dataset.yaw || '-0.55'), pitch = 0.62, vy = 0, vp = 0;
    let dragging = false, lastX = 0, lastY = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 10) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    }

    function draw() {
      if (!W) resize();
      if (!W) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const u = Math.min(W, H) / 2.5;
      const cx = W / 2, cy = H / 2 - u * 0.06;
      const m = rotation(yaw, pitch);
      const hScale = (u / 260) * 1.5;

      /* soft ground shadow */
      const sg = ctx.createRadialGradient(cx, cy + u * 0.66, 0, cx, cy + u * 0.66, u * 0.98);
      sg.addColorStop(0, 'rgba(12,8,22,.32)'); sg.addColorStop(1, 'rgba(12,8,22,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.ellipse(cx, cy + u * 0.66, u * 0.98, u * 0.22, 0, 0, Math.PI * 2); ctx.fill();

      /* one global face list: the forms never interpenetrate (plans tile,
         violet rides above fog), so a single depth sort is exact */
      const all = [];
      for (const faces of [FACES.fog, FACES.violet]) {
        for (const f of faces) {
          const n = rot(m, f.n[0], f.n[1], f.n[2]);
          if (n[2] <= 0.001) continue;               /* back-face cull: sides, tops, bottoms alike */
          let depth = 0;
          const pts = new Array(f.v.length);
          for (let i = 0; i < f.v.length; i++) {
            const q = rot(m, f.v[i][0], f.v[i][1], f.v[i][2] - PRISM_H);
            pts[i] = [cx + q[0] * hScale, cy + q[1] * hScale];
            depth += q[2];
          }
          all.push({ pts, depth: depth / f.v.length, form: f.form, kind: f.kind, col: shade(f.form === 'violet' ? VIOLET : FOG, n, f.kind) });
        }
      }
      all.sort((a, b) => a.depth - b.depth || (a.form === 'violet' ? 1 : -1));
      for (const f of all) {
        ctx.beginPath();
        ctx.moveTo(f.pts[0][0], f.pts[0][1]);
        for (let i = 1; i < f.pts.length; i++) ctx.lineTo(f.pts[i][0], f.pts[i][1]);
        ctx.closePath();
        ctx.fillStyle = f.col; ctx.fill();
        ctx.strokeStyle = f.col; ctx.lineWidth = Math.max(0.8, dpr * 0.9); ctx.stroke();
        if (f.kind === 'top') { ctx.strokeStyle = 'rgba(15,10,28,.28)'; ctx.lineWidth = Math.max(0.6, dpr * 0.7); ctx.stroke(); }
      }
    }

    function step(dt) {
      if (REDUCED) return;
      /* the hero mark revolves slowly on its axis (user-approved departure
         from the no-idle-loops rule); a drag adds momentum that decays back
         to the same loop. */
      if (!dragging) { yaw += (SPEED + vy) * dt; vy *= Math.exp(-dt * 2.4); pitch += vp * dt; vp *= Math.exp(-dt * 2.4); }
      pitch = Math.max(-1.0, Math.min(1.0, pitch));
      draw();
    }
    let frame = 0, last = 0, visible = true;
    function start(){ if (frame || REDUCED || !visible || document.hidden) return; last = 0; frame = requestAnimationFrame(loop); }
    function loop(now) { frame = 0; const dt = last ? Math.min(0.1, (now - last) / 1000) : 0; last = now; step(dt); frame = requestAnimationFrame(loop); }
    function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; }

    canvas.addEventListener('pointerdown', (e) => { start(); dragging = true; lastX = e.clientX; lastY = e.clientY; vy = vp = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      vy = (e.clientX - lastX) * 0.5; vp = (e.clientY - lastY) * 0.5;
      yaw += (e.clientX - lastX) * 0.008; pitch += (e.clientY - lastY) * 0.008;
      pitch = Math.max(-1.0, Math.min(1.0, pitch));
      lastX = e.clientX; lastY = e.clientY;
      if (REDUCED) draw();
    });
    const release = () => { dragging = false; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('keydown', (e) => {
      const stepA = 0.26;
      if (e.key === 'ArrowLeft') { yaw -= stepA; } else if (e.key === 'ArrowRight') { yaw += stepA; }
      else if (e.key === 'ArrowUp') { pitch = Math.max(-1.0, pitch - stepA); } else if (e.key === 'ArrowDown') { pitch = Math.min(1.0, pitch + stepA); }
      else if (e.key === 'Home') { yaw = -0.55; pitch = 0.62; } else return;
      e.preventDefault();
      draw(); /* keys repaint directly: the loop may be stopped at rest */
    });

    new ResizeObserver(() => { resize(); if (REDUCED) draw(); }).observe(canvas);
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '120px 0px' }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });

    resize(); draw(); start();
  }

  function init() { document.querySelectorAll('canvas.seer-mark-3d').forEach(mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
