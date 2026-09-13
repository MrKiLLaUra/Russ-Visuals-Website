/* ==========================================================================
   RUSSS VISUALS — About section
   One small extra on top of the free [data-reveal] scroll-reveal:
   a subtle scroll-linked parallax on the portrait image. The image is
   sized larger than its frame in about.css (height:130%, top:-15%) so
   this can shift it a few percent without ever showing an edge.
   ========================================================================== */

(function () {
  const section = document.querySelector('.about');
  const portraitImg = document.querySelector('.about__portrait img');
  if (!section || !portraitImg) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) return;

  if (window.gsap && window.ScrollTrigger) {
    gsap.fromTo(
      portraitImg,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  } else {
    /* vanilla fallback: nudge the image based on the section's
       position in the viewport, throttled to animation frames */
    let ticking = false;

    function update() {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const total = rect.height + vh;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
      const yPercent = -8 + progress * 16; // -8 -> 8
      portraitImg.style.transform = `translateY(${yPercent}%)`;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }
})();
