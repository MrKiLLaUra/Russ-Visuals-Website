/* ==========================================================================
   RUS VISUALS — Hero section
   Splits the "Rus" / "Visuals" wordmark into a masked, staggered
   entrance instead of a plain fade, then layers two small always-on
   details on top: a slow mousemove drift on the headline, and a gentle
   idle wobble on "Visuals" (its hand-tagged flourish). Falls back to a
   plain CSS transition if GSAP didn't load, and skips all continuous
   motion for prefers-reduced-motion.
   ========================================================================== */

(function () {
  const title = document.querySelector('.hero__title');
  const hero = document.querySelector('.hero');
  if (!title || !hero) return;

  const outerSpans = Array.prototype.slice.call(title.children).filter(
    (el) => el.tagName === 'SPAN'
  );
  if (!outerSpans.length) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* reduced motion: leave the plain, already-visible spans alone —
     no wrapping, no entrance, no idle motion */
  if (prefersReducedMotion) return;

  /* wrap each span's text in an inner span: the outer span (overflow:
     hidden in hero.css) becomes the clip mask, the inner one carries
     the reveal. Left visible-by-default in CSS so nothing flashes if
     this script errors out before reaching the animation below. */
  const innerSpans = outerSpans.map((outer) => {
    const inner = document.createElement('span');
    inner.className = 'hero__title-inner';
    inner.textContent = outer.textContent;
    outer.textContent = '';
    outer.appendChild(inner);
    return inner;
  });

  const rootStyle = getComputedStyle(document.documentElement);
  const durSlow = parseFloat(rootStyle.getPropertyValue('--dur-slow')) || 1.1;
  const durMed = parseFloat(rootStyle.getPropertyValue('--dur-med')) || 0.6;

  if (window.gsap) {
    /* ---------- entrance: masked reveal, staggered between words ---------- */
    gsap.set(innerSpans, { yPercent: 115, opacity: 0 });

    const tl = gsap.timeline({ delay: 0.2 });
    tl.to(innerSpans, {
      yPercent: 0,
      opacity: 1,
      duration: durSlow,
      ease: 'power4.out',
      stagger: 0.14,
    });

    /* ---------- idle detail #1: gentle wobble on "Visuals" ---------- */
    const accent = outerSpans[1];
    if (accent) {
      gsap.to(accent, {
        rotate: '+=1.4',
        duration: 2.8,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: durSlow + 0.5,
        transformOrigin: '50% 50%',
      });
    }

    /* ---------- idle detail #2: subtle mousemove drift on the headline,
       fine-pointer devices only ---------- */
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (canHover) {
      const xTo = gsap.quickTo(title, 'x', { duration: durMed, ease: 'power3.out' });
      const yTo = gsap.quickTo(title, 'y', { duration: durMed, ease: 'power3.out' });

      hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / rect.width - 0.5;
        const relY = (e.clientY - rect.top) / rect.height - 0.5;
        xTo(relX * 14);
        yTo(relY * 8);
      });

      hero.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    }
  } else {
    /* ---------- CSS-only fallback: GSAP failed to load from the CDN ----------
       hero.css defines the hidden state under .is-fallback-pending and the
       transitioned-in state (with a built-in stagger) under
       .is-fallback-visible — swap classes a frame apart so the browser
       registers the hidden state before the transition starts. */
    title.classList.add('is-fallback-pending');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        title.classList.remove('is-fallback-pending');
        title.classList.add('is-fallback-visible');
      });
    });
  }
})();
