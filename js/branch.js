/* ==========================================================================
   THE FIG BRANCH — the hero specimen
   --------------------------------------------------------------------------
   Four behaviours, layered, in this order of authority:

     1. ambient drift   each leaf breathing on its own slow clock
     2. cursor wind     air moving past the branch, with spring lag
     3. parallax        depth between the botanical layers
     4. scroll          the branch physically leaving the composition

   The amplitudes below are the entire design. They are authored in px against
   a 1400px stage and scaled proportionally; every one of them is small enough
   that you should have to look twice to be sure anything moved. When tuning,
   reduce before you increase.

   Geometry comes from assets/branch/layers.json, baked into the markup as
   custom properties. With JS off the composition is complete and static.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.querySelector('[data-branch]');
  if (!root) return;
  const stage = root.querySelector('.branch__stage');
  const els = Array.from(root.querySelectorAll('.branch__layer'));
  if (!stage || !els.length) return;

  const SRC_RATIO = 1536 / 1024;   // aspect of the source plate
  const REF_W = 1400;              // stage width the amplitudes were authored at
  const EXIT = 0.72;               // scroll transition completes at 72vh

  const mReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mCoarse = window.matchMedia('(hover: none), (pointer: coarse)');

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (t) => t * t * (3 - 2 * t);

  /* ------------------------------------------------------------ randomness */
  /* Seeded, so a given leaf always drifts the same way between reloads. */

  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Interpolated value noise rather than a sine. A sinusoid is legible as a
     loop within a few seconds of watching; noise never quite repeats, which
     is the difference between "animated" and "alive". */
  function noise(seed) {
    const rnd = mulberry32(seed);
    const n = 64;
    const tbl = new Float32Array(n);
    for (let i = 0; i < n; i++) tbl[i] = rnd() * 2 - 1;
    return function (x) {
      const i = Math.floor(x);
      const f = x - i;
      const a = tbl[((i % n) + n) % n];
      const b = tbl[(((i + 1) % n) + n) % n];
      return a + (b - a) * smooth(f);
    };
  }

  /* ---------------------------------------------------------------- model */

  let s = 7;
  const rnd = mulberry32(99);

  const items = els.map(function (el) {
    const kind = el.dataset.kind;
    const depth = +el.dataset.depth;          // 0 back → 1 front
    const mass = +el.dataset.mass;            // leaves light, figs heavy
    const small = clamp(1 - +el.dataset.rel, 0, 1);   // 1 = the smallest leaf
    const leaf = kind === 'leaf';
    const fig = kind === 'fig';

    // centre of the layer as a fraction of the stage, derived from the
    // authored box plus the file's own aspect — no measuring required
    const nw = el.getAttribute('width') || 1;
    const nh = el.getAttribute('height') || 1;
    const xf = parseFloat(el.style.getPropertyValue('--x')) / 100;
    const yf = parseFloat(el.style.getPropertyValue('--y')) / 100;
    const wf = parseFloat(el.style.getPropertyValue('--w')) / 100;
    const hf = wf * (nh / nw) * SRC_RATIO;

    return {
      el: el,
      cx: xf + wf / 2,
      cy: yf + hf / 2,

      /* Displacement ceilings, px at REF_W. Small leaves catch more air than
         large ones; figs have visual weight and barely acknowledge the cursor;
         the woody branch only flexes. */
      windT: leaf ? 4 + 6 * small : fig ? 1.1 + 1.7 * small : 1.4,
      windR: leaf ? 1 + 3 * small : fig ? 0.34 : 0.12,
      driftT: leaf ? 1 + 2 * small : fig ? 0.5 : 0.28,
      driftR: leaf ? 0.5 + 1.5 * small : fig ? 0.16 : 0.05,

      /* Parallax follows paint depth for leaves, but a fig hangs off the
         branch — give it the leaf-like depth it sits at and it visibly comes
         unstuck from the twig it is growing on. Figs and branch travel
         together, in the middle of the range. */
      para: 3 + 6 * (fig ? 0.45 : depth),

      /* Low-to-medium stiffness, medium-high damping: the leaf arrives a beat
         after the cursor and settles without ringing. Mass does the rest. */
      k: 0.105 / (0.62 + mass * 0.66),
      c: 0.30 + 0.055 * mass,

      x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0,
      px: 0, py: 0, pvx: 0, pvy: 0,
      gust: 0, gdx: 0, gdy: 0, gtmp: 0,

      nx: noise(s++), ny: noise(s++), nr: noise(s++),
      rate: 0.09 + 0.13 * rnd(),      // every leaf on its own clock
      phase: rnd() * 60,
      near: null
    };
  });

  // three nearest neighbours, so a gust can travel through the foliage
  items.forEach(function (a) {
    const d = (b) => (b.cx - a.cx) * (b.cx - a.cx) + (b.cy - a.cy) * (b.cy - a.cy);
    a.near = items.filter((b) => b !== a).sort((b, c) => d(b) - d(c)).slice(0, 3);
  });

  /* ----------------------------------------------------------- the stage */

  function scrollPhase() {
    return smooth(clamp(window.scrollY / (window.innerHeight * EXIT), 0, 1));
  }

  /* Between 0 and 72vh the branch scales down, drifts toward the right margin
     and swings its tapered end down toward the timeline. It is still fully
     drawn when it goes — it leaves the frame rather than dissolving in it. */
  function paintStage(p, gentle) {
    stage.style.transform = gentle
      ? 'translate3d(' + (p * 3).toFixed(2) + '%,0,0) scale(' + (1 - 0.06 * p).toFixed(4) + ')'
      : 'translate3d(' + (p * 11).toFixed(2) + '%,' + (p * -3.5).toFixed(2) + '%,0)' +
        ' scale(' + (1 - 0.18 * p).toFixed(4) + ')' +
        ' rotate(' + (p * 2.2).toFixed(3) + 'deg)';
    stage.style.opacity = (1 - (gentle ? 0.2 : 0.48) * p).toFixed(3);
  }

  /* --------------------------------------------------------- reduced motion */
  /* No cursor physics, no drift, no parallax. The composition is preserved
     exactly as drawn; only the scroll hand-off survives, and gently. */

  if (mReduce.matches) {
    let queued = false;
    const upd = function () { queued = false; paintStage(scrollPhase(), true); };
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(upd); }
    }, { passive: true });
    window.addEventListener('resize', upd, { passive: true });
    upd();
    return;
  }

  /* --------------------------------------------------------------- input */

  const touch = mCoarse.matches;
  let pointerX = 0, pointerY = 0, hasPointer = false;
  let lastX = 0, lastY = 0, velX = 0, velY = 0;

  if (!touch) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      if (!hasPointer) { lastX = e.clientX; lastY = e.clientY; hasPointer = true; }
      pointerX = e.clientX;
      pointerY = e.clientY;
    }, { passive: true });

    window.addEventListener('pointerleave', function () { hasPointer = false; }, { passive: true });
  }

  /* ---------------------------------------------------------------- loop */

  const DRIFT = touch ? 0.6 : 1;    // mobile keeps the breath, loses the wind
  let raf = 0, prev = 0, running = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);

    const dt = prev ? Math.min(now - prev, 50) : 16.7;
    prev = now;
    const step = dt / 16.667;        // springs are authored per 60fps frame
    const t = now / 1000;

    paintStage(scrollPhase(), false);

    /* .branch is never transformed, so this geometry stays honest even while
       the stage inside it is being scaled and rotated. */
    const box = root.getBoundingClientRect();
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const sx = box.left + stage.offsetLeft;
    const sy = box.top + stage.offsetTop;
    const scale = sw / REF_W;        // motion stays proportionate to the object
    const reach = Math.max(sw * 0.42, 240);

    velX = velX * 0.72 + (pointerX - lastX) * 0.28;
    velY = velY * 0.72 + (pointerY - lastY) * 0.28;
    lastX = pointerX;
    lastY = pointerY;
    const speed = Math.hypot(velX, velY);
    const vxn = clamp(velX / 34, -1, 1);
    const vyn = clamp(velY / 34, -1, 1);

    const wind = !touch && hasPointer;
    // parallax reads the cursor's place in the viewport, not on the branch
    const ox = wind ? (pointerX / window.innerWidth - 0.5) * -2 : 0;
    const oy = wind ? (pointerY / window.innerHeight - 0.5) * -2 : 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      let tx = 0, ty = 0, tr = 0;

      if (wind) {
        const lx = sx + it.cx * sw;
        const ly = sy + it.cy * sh;
        let dx = lx - pointerX;
        let dy = ly - pointerY;
        const d = Math.hypot(dx, dy) || 1;
        const q = d / reach;
        const f = Math.exp(-q * q * 2.1);      // proximity falloff

        if (f > 0.002) {
          dx /= d; dy /= d;
          // pushed away from the cursor, then dragged along its travel
          tx = (dx * 0.72 + vxn * 0.5) * f * it.windT;
          ty = (dy * 0.72 + vyn * 0.5) * f * it.windT;
          tr = (vxn * 0.78 + dx * 0.34) * f * it.windR;

          // a fast sweep deposits a gust, which then spreads to neighbours
          const inj = f * clamp(speed / 85, 0, 1) * 0.30 * step;
          if (inj > it.gust * 0.02) { it.gdx = vxn; it.gdy = vyn; }
          it.gust += inj;
        }
      }

      if (it.gust > 0.0004) {
        tx += it.gdx * it.gust * it.windT * 0.85;
        ty += it.gdy * it.gust * it.windT * 0.85;
        tr += it.gdx * it.gust * it.windR * 0.90;
      }

      /* Hard ceiling on the air. Push, drag and gust can otherwise stack on a
         fast diagonal sweep and overshoot the budget; capping the vector keeps
         the direction intact and only takes the excess. */
      const mag = Math.hypot(tx, ty);
      if (mag > it.windT) {
        tx = tx / mag * it.windT;
        ty = ty / mag * it.windT;
      }
      if (tr > it.windR) tr = it.windR;
      else if (tr < -it.windR) tr = -it.windR;

      if (DRIFT) {
        const u = t * it.rate + it.phase;
        tx += it.nx(u) * it.driftT * DRIFT;
        ty += it.ny(u * 0.83 + 11) * it.driftT * DRIFT;
        tr += it.nr(u * 1.17 + 23) * it.driftR * DRIFT;
      }

      // wind + drift, on the layer's own spring
      it.vx += ((tx - it.x) * it.k - it.vx * it.c) * step;
      it.vy += ((ty - it.y) * it.k - it.vy * it.c) * step;
      it.vr += ((tr - it.r) * it.k - it.vr * it.c) * step;
      it.x += it.vx * step;
      it.y += it.vy * step;
      it.r += it.vr * step;

      // parallax, on a slower and heavier one so depth never feels twitchy
      const ptx = ox * it.para;
      const pty = oy * it.para * 0.62;
      it.pvx += ((ptx - it.px) * 0.045 - it.pvx * 0.34) * step;
      it.pvy += ((pty - it.py) * 0.045 - it.pvy * 0.34) * step;
      it.px += it.pvx * step;
      it.py += it.pvy * step;

      const X = (it.x + it.px) * scale;
      const Y = (it.y + it.py) * scale;
      it.el.style.transform =
        'translate3d(' + X.toFixed(2) + 'px,' + Y.toFixed(2) + 'px,0) rotate(' + it.r.toFixed(3) + 'deg)';
    }

    /* Let the gust travel a little way outward, then settle. This is what
       makes a quick sweep read as one movement passing through the foliage
       rather than as each leaf reacting on its own. */
    for (let i = 0; i < items.length; i++) items[i].gtmp = items[i].gust;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      let sum = 0;
      for (let j = 0; j < it.near.length; j++) sum += it.near[j].gtmp;
      it.gust += (sum / it.near.length - it.gtmp) * 0.09 * step;
      it.gust *= Math.pow(0.94, step);
      if (it.gust < 1e-4) it.gust = 0;
    }
  }

  function start() {
    if (running) return;
    running = true;
    prev = 0;
    root.classList.add('is-live');
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    root.classList.remove('is-live');
    cancelAnimationFrame(raf);
  }

  /* Nothing runs while the hero is off screen or the tab is in the background */
  const hero = root.closest('.hero') || root;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting && !document.hidden ? start() : stop();
    }, { threshold: 0 }).observe(hero);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (hero.getBoundingClientRect().bottom > 0) start();
  });
})();
