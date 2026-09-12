/* ==========================================================================
   RUS VISUALS — Contact page
   Magnetic pull on every [data-magnetic] element (the email link + the
   3 social links) — they nudge toward the cursor on mousemove and ease
   back to rest on mouseleave. (The footer marquee lives in main.js now,
   since the footer is shared chrome on every page, not just this one.)
   ========================================================================== */

(function () {
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ---------- magnetic hover ---------- */
  const magnets = document.querySelectorAll('[data-magnetic]');

  if (magnets.length && !isTouch && !prefersReducedMotion) {
    const STRENGTH = 16; // max px pull, per brief (12–16px)

    magnets.forEach((el) => {
      function handleMove(e) {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        const x = (relX / (rect.width / 2)) * STRENGTH;
        const y = (relY / (rect.height / 2)) * STRENGTH;

        if (window.gsap) {
          gsap.to(el, { x, y, duration: 0.4, ease: 'power3.out', overwrite: true });
        } else {
          el.style.transition = `transform ${getComputedStyle(document.documentElement).getPropertyValue('--dur-fast') || '.25s'} ease-out`;
          el.style.transform = `translate(${x}px, ${y}px)`;
        }
      }

      function handleLeave() {
        if (window.gsap) {
          gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)', overwrite: true });
        } else {
          el.style.transition = 'transform .5s cubic-bezier(0.16, 1, 0.3, 1)';
          el.style.transform = 'translate(0, 0)';
        }
      }

      el.addEventListener('mousemove', handleMove);
      el.addEventListener('mouseleave', handleLeave);
    });
  }
})();
