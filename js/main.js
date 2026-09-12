/* ==========================================================================
   RUS VISUALS — shared core
   Cursor follower, film grain, generic scroll-reveal, nav toggle, footer
   year, GSAP/ScrollTrigger registration. Section-specific files (hero.js,
   gallery.js, about.js, contact.js) rely on GSAP + ScrollTrigger already
   being registered by the time they run — load order in index.html matters.
   ========================================================================== */

(function () {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- mobile nav toggle: circular reveal ----------
     A black circle grows from the toggle button's corner (100% 0%) to
     cover the screen via an animated clip-path; the nav links fade in
     only once that circle is ~90% of the way to full size. Closing
     mirrors it: links fade out first, then the circle shrinks back
     into the corner. */
  const navToggle = document.querySelector('[data-nav-toggle]');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    const navLinkEls = navLinks.querySelectorAll('.nav-link');
    const origin = '100% 0%';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isAnimating = false;

    function maxRadius() {
      return Math.ceil(Math.hypot(window.innerWidth, window.innerHeight));
    }

    function openMenu() {
      if (isAnimating) return;
      navLinks.classList.add('is-open');
      navToggle.textContent = 'Close';

      if (window.gsap && !reduceMotion) {
        isAnimating = true;
        gsap.set(navLinks, { clipPath: `circle(0px at ${origin})` });
        gsap.set(navLinkEls, { opacity: 0, y: 16 });
        gsap
          .timeline({ onComplete: () => { isAnimating = false; } })
          .to(navLinks, {
            clipPath: `circle(${maxRadius()}px at ${origin})`,
            duration: 0.85,
            ease: 'power3.inOut',
          })
          // starts while the circle tween is still ~10% from done, so
          // the text lands right as the black covers ~90% of the screen
          .to(navLinkEls, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07, ease: 'power2.out' }, '-=0.12');
      } else {
        // GSAP failed to load — skip the reveal animation entirely
        // rather than leaving the menu stuck clipped to nothing
        navLinks.style.clipPath = 'none';
        navLinkEls.forEach((a) => { a.style.opacity = '1'; });
      }
    }

    function closeMenu() {
      if (isAnimating) return;
      navToggle.textContent = 'Menu';

      if (window.gsap && !reduceMotion) {
        isAnimating = true;
        gsap
          .timeline({
            onComplete: () => {
              navLinks.classList.remove('is-open');
              isAnimating = false;
            },
          })
          .to(navLinkEls, { opacity: 0, y: -12, duration: 0.25, stagger: 0.04, ease: 'power2.in' })
          .to(navLinks, { clipPath: `circle(0px at ${origin})`, duration: 0.6, ease: 'power3.inOut' }, '-=0.05');
      } else {
        navLinks.classList.remove('is-open');
      }
    }

    navToggle.addEventListener('click', () => {
      if (navLinks.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    navLinkEls.forEach((a) =>
      a.addEventListener('click', () => {
        if (navLinks.classList.contains('is-open')) closeMenu();
      })
    );
  }

  /* ---------- generic scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- custom cursor ---------- */
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const dot = document.querySelector('[data-cursor-dot]');
  const ring = document.querySelector('[data-cursor-ring]');

  if (!isTouch && dot && ring) {
    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { x: pos.x, y: pos.y };

    window.addEventListener('mousemove', (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
    });

    function tickRing() {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px) translate(-50%, -50%)`;
      requestAnimationFrame(tickRing);
    }
    requestAnimationFrame(tickRing);

    const hoverables = 'a, button, [data-magnetic], [data-gallery-item]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) ring.classList.remove('is-hover');
    });
  }

  /* ---------- animated film grain ---------- */
  const canvas = document.getElementById('grain');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h;
    const scale = 0.5; // render grain at half-res, upscaled, for perf

    function resize() {
      w = canvas.width = Math.floor(window.innerWidth * scale);
      h = canvas.height = Math.floor(window.innerHeight * scale);
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
    }
    resize();
    window.addEventListener('resize', resize);

    const imageData = () => ctx.createImageData(w, h);

    function drawGrain() {
      const id = imageData();
      const buffer = id.data;
      for (let i = 0; i < buffer.length; i += 4) {
        const shade = Math.random() * 255;
        buffer[i] = shade;
        buffer[i + 1] = shade;
        buffer[i + 2] = shade;
        buffer[i + 3] = 255;
      }
      ctx.putImageData(id, 0, 0);
    }

    let last = 0;
    function loop(t) {
      if (t - last > 60) {
        drawGrain();
        last = t;
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- back to top ---------- */
  document.querySelectorAll('.footer-bottom span').forEach((span) => {
    if (span.textContent.includes('Back to top')) {
      span.style.cursor = 'pointer';
      span.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  });

  /* ---------- footer infinite marquee ----------
     lives here (not a page-specific script) since the footer is shared
     chrome present on every page. Track's content is already duplicated
     2x in the HTML, so translating -50% loops seamlessly. */
  const marqueeTrack = document.querySelector('[data-marquee]');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (marqueeTrack && !prefersReducedMotion) {
    if (window.gsap) {
      gsap.to(marqueeTrack, { xPercent: -50, duration: 24, repeat: -1, ease: 'none' });
    } else {
      marqueeTrack.classList.add('footer-marquee__track--css-fallback');
    }
  }
})();
