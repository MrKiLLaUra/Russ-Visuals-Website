/* ==========================================================================
   RUSSS VISUALS — shared core
   Generic scroll-reveal, nav toggle, footer year, magnetic hover,
   GSAP/ScrollTrigger registration. Section-specific files
   (hero.js, gallery.js, about.js) rely on GSAP + ScrollTrigger already
   being registered by the time they run — load order in each page matters.
   ========================================================================== */

(function () {
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

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

  /* ---------- back to top ---------- */
  document.querySelectorAll('.footer-bottom span').forEach((span) => {
    if (span.textContent.includes('Back to top')) {
      span.style.cursor = 'pointer';
      span.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  });

  /* ---------- magnetic hover ----------
     Nudges any [data-magnetic] element toward the cursor on mousemove,
     easing back to rest on mouseleave. Lives here (not a page-specific
     script) since it's now used on more than just the Contact page
     (e.g. the Home hero CTA). */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const magnets = document.querySelectorAll('[data-magnetic]');

  if (magnets.length && !isTouch && !prefersReducedMotion) {
    const STRENGTH = 16; // max px pull

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

  /* ---------- footer infinite marquee ----------
     Lives here (not a page-specific script) since the footer is shared
     chrome present on every page. The HTML only contains ONE copy of
     the phrase (.footer-marquee__set) — here we clone it into two
     identical halves, each wide enough on its own to fully cover the
     visible strip, then translate the track by exactly one half
     (xPercent:-50). Because both halves are identical and neither is
     narrower than the viewport, the loop point is invisible — a fixed
     "2 copies" in the HTML could leave a visible blank gap on wide
     screens instead of connecting seamlessly.

     Measuring text width has to wait for the Anton web font to finish
     loading — measuring against the fallback font first (whatever the
     browser paints before the @import'd font arrives) undercounts how
     many copies are needed once Anton swaps in and the text gets
     wider, which is exactly the kind of thing that reintroduces a gap
     at the loop point. */
  const marqueeTrack = document.querySelector('[data-marquee]');
  if (marqueeTrack && !prefersReducedMotion) {
    const originalSetHTML = (marqueeTrack.querySelector('.footer-marquee__set') || {}).outerHTML;

    const buildMarquee = () => {
      let copiesPerHalf = 1;
      if (originalSetHTML) {
        marqueeTrack.innerHTML = originalSetHTML;
        const originalSet = marqueeTrack.querySelector('.footer-marquee__set');
        const container = marqueeTrack.parentElement;
        const containerWidth = (container && container.getBoundingClientRect().width) || window.innerWidth;
        const setWidth = originalSet.getBoundingClientRect().width || 1;
        copiesPerHalf = Math.max(1, Math.ceil(containerWidth / setWidth));
        marqueeTrack.innerHTML = originalSetHTML.repeat(copiesPerHalf * 2);
      }

      if (window.gsap) {
        gsap.killTweensOf(marqueeTrack);
        gsap.set(marqueeTrack, { xPercent: 0 });
        gsap.to(marqueeTrack, { xPercent: -50, duration: copiesPerHalf * 24, repeat: -1, ease: 'none' });
      } else {
        marqueeTrack.classList.add('footer-marquee__track--css-fallback');
      }
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(buildMarquee);
    } else {
      buildMarquee();
    }
  }
})();
