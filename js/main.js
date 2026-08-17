/* ==========================================================================
   CATHERINE WANG — interaction layer
   --------------------------------------------------------------------------
   Everything degrades: with JS off the site is a fully readable editorial
   document. Every motion path checks prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------------------------------------------------------------- NAV */

  const nav = $('.nav');

  function navState() {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 40);

    // Flip the stuck nav's backdrop when it sits over an espresso section
    const probe = nav.offsetHeight * 0.5;
    const overDark = $$('.invert').some((z) => {
      const r = z.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle('on-dark', overDark);
  }

  /* --------------------------------------------------- SCROLL PROGRESS */

  const bar = $('.progress');

  function progress() {
    if (!bar) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
  }

  /* ------------------------------------------------------- TIMELINE */
  /* The rail fills to a "read line" set a third of the way down the
     viewport, and the entry straddling that line is the active one.
     One pass over the items per frame, no observer per node. */

  const timelines = $$('.tl');

  function timeline() {
    const readLine = window.innerHeight * 0.34;

    timelines.forEach((tl) => {
      const items = $$('.tl__item', tl);
      const fill = $('.tl__fill', tl);
      const box = tl.getBoundingClientRect();

      if (fill) {
        const travelled = readLine - box.top;
        const pct = Math.max(0, Math.min(1, travelled / box.height));
        fill.style.height = `${pct * 100}%`;
      }

      let activeIndex = -1;
      items.forEach((item, i) => {
        const r = item.getBoundingClientRect();
        if (r.top <= readLine && r.bottom > readLine) activeIndex = i;
      });

      // Above the first entry nothing is active; below the last, the last stays lit
      if (activeIndex === -1 && box.bottom < readLine) activeIndex = items.length - 1;

      items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
    });
  }

  /* Single rAF-throttled scroll listener for all scroll-driven work */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      navState();
      progress();
      timeline();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------ MOBILE DRAWER */

  const drawer = $('.drawer');
  const openBtn = $('.nav__toggle');
  const closeBtn = $('.drawer__close');

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (openBtn) openBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const first = $('a', drawer);
      if (first) first.focus();
    } else if (openBtn) {
      openBtn.focus();
    }
  }

  if (openBtn) openBtn.addEventListener('click', () => setDrawer(true));
  if (closeBtn) closeBtn.addEventListener('click', () => setDrawer(false));
  if (drawer) $$('a', drawer).forEach((a) => a.addEventListener('click', () => setDrawer(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) setDrawer(false);
  });

  /* ------------------------------------------------------ HERO SPLIT-IN */
  /* Wraps each authored line of a display heading in a masked span so the
     type rises into place. Existing <em> markup survives. */

  function splitLines() {
    $$('[data-split]').forEach((el) => {
      const lines = $$('[data-line]', el);
      if (!lines.length) return;
      lines.forEach((line, i) => {
        const mask = document.createElement('span');
        mask.className = 'line-mask';
        mask.style.setProperty('--d', `${100 + i * 105}ms`);
        const inner = document.createElement('span');
        while (line.firstChild) inner.appendChild(line.firstChild);
        mask.appendChild(inner);
        line.replaceWith(mask);
      });
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-lit')));
    });
  }
  splitLines();

  /* ---------------------------------------------------------- REVEALS */

  const revealables = $$('[data-reveal]');

  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
    );

    revealables.forEach((el) => {
      // Stagger siblings sharing a parent, unless a delay is authored
      if (!el.style.getPropertyValue('--d')) {
        const sibs = Array.from(el.parentElement.children).filter((n) =>
          n.hasAttribute('data-reveal')
        );
        const i = sibs.indexOf(el);
        if (i > 0) el.style.setProperty('--d', `${Math.min(i, 6) * 80}ms`);
      }
      io.observe(el);
    });
  }

  /* ------------------------------------------------------- DRAG SHELVES */

  $$('.shelf').forEach((shelf) => {
    let down = false, startX = 0, startLeft = 0, moved = 0;

    shelf.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // native touch scrolling is better
      down = true;
      moved = 0;
      startX = e.clientX;
      startLeft = shelf.scrollLeft;
      shelf.setPointerCapture(e.pointerId);
    });

    shelf.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.abs(dx);
      if (moved > 4) shelf.classList.add('is-dragging');
      shelf.scrollLeft = startLeft - dx;
    });

    const end = () => { down = false; shelf.classList.remove('is-dragging'); };
    shelf.addEventListener('pointerup', end);
    shelf.addEventListener('pointercancel', end);

    // Suppress the click that follows a real drag
    shelf.addEventListener('click', (e) => {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    }, true);

    shelf.addEventListener('keydown', (e) => {
      const step = shelf.clientWidth * 0.8;
      if (e.key === 'ArrowRight') shelf.scrollBy({ left: step, behavior: 'smooth' });
      if (e.key === 'ArrowLeft')  shelf.scrollBy({ left: -step, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------ FILTERS */

  const filterBar = $('.filters');
  if (filterBar) {
    const items = $$('[data-cat]');
    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      const want = btn.dataset.filter;

      $$('.filter', filterBar).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

      items.forEach((item) => {
        const cats = (item.dataset.cat || '').split(/\s+/);
        const show = want === 'all' || cats.includes(want);
        item.hidden = !show;
        if (show) {
          item.classList.remove('is-in');
          requestAnimationFrame(() => item.classList.add('is-in'));
        }
      });

      const count = items.filter((c) => !c.hidden).length;
      const live = $('#filter-status');
      if (live) live.textContent = `${count} project${count === 1 ? '' : 's'} shown`;

      onScroll(); // timeline geometry changed
    });
  }

  /* ------------------------------------------------------- MISC DETAILS */

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });

  // Copy-email affordance
  $$('[data-copy]').forEach((el) => {
    el.addEventListener('click', async (e) => {
      if (!navigator.clipboard) return; // let the mailto: through
      e.preventDefault();
      const original = el.textContent;
      try {
        await navigator.clipboard.writeText(el.dataset.copy);
        el.textContent = 'Copied ✓';
        setTimeout(() => { el.textContent = original; }, 1600);
      } catch {
        window.location.href = `mailto:${el.dataset.copy}`;
      }
    });
  });
})();
