/* ==========================================================================
   RUSSS VISUALS — gallery section
   Scroll-in stagger for the .gallery__item figures, a subtle mouse-tilt
   micro-interaction on each frame, and the click-to-open lightbox.
   Runs after main.js (GSAP/ScrollTrigger already registered there, if
   present) — everything here degrades gracefully without GSAP.
   ========================================================================== */

(function () {
  const gallery = document.querySelector('[data-gallery]');
  const items = document.querySelectorAll('[data-gallery-item]');
  if (!gallery || !items.length) return;

  /* ---------------------------------------------------------------------
     1. Staggered scroll reveal
     GSAP + ScrollTrigger path when available (batched, editorial ease);
     plain IntersectionObserver + CSS transition-delay fallback otherwise.
     --------------------------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.set(items, { opacity: 0, y: 56 });

    ScrollTrigger.batch(items, {
      start: 'top 88%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          overwrite: true,
        });
      },
    });
  } else if ('IntersectionObserver' in window) {
    items.forEach((item, i) => {
      item.classList.add('js-reveal');
      item.style.transitionDelay = `${Math.min(i, 7) * 0.08}s`;
    });

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
    items.forEach((item) => io.observe(item));
  }

  /* ---------------------------------------------------------------------
     Photo / Video filter tabs
     Shows/hides items by their data-category; when a category has no
     matching items (Video, until real clips are added) shows the
     work__empty message instead of a blank grid.
     --------------------------------------------------------------------- */
  const tabs = document.querySelectorAll('[data-filter]');
  const emptyMsg = document.querySelector('[data-work-empty]');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      if (tab.classList.contains('is-active')) return;

      tabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      let visibleCount = 0;
      items.forEach((item) => {
        const matches = item.dataset.category === filter;
        item.hidden = !matches;
        if (matches) visibleCount += 1;
      });

      if (emptyMsg) emptyMsg.hidden = visibleCount > 0;
      gallery.hidden = visibleCount === 0;
    });
  });

  /* ---------------------------------------------------------------------
     2. Subtle mouse-position tilt on each frame
     Sets --tilt-x / --tilt-y custom properties consumed by gallery.css'
     transform on the <img>; resets smoothly on mouseleave.
     --------------------------------------------------------------------- */
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const MAX_TILT = 5; // degrees — kept subtle on purpose

  if (!isTouch) {
    items.forEach((item) => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        item.style.setProperty('--tilt-y', `${(px * MAX_TILT * 2).toFixed(2)}deg`);
        item.style.setProperty('--tilt-x', `${(-py * MAX_TILT * 2).toFixed(2)}deg`);
      });

      item.addEventListener('mouseleave', () => {
        item.style.setProperty('--tilt-x', '0deg');
        item.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

  /* ---------------------------------------------------------------------
     3. Lightbox
     --------------------------------------------------------------------- */
  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImg = document.querySelector('[data-lightbox-img]');
  const lightboxClose = document.querySelector('[data-lightbox-close]');
  if (!lightbox || !lightboxImg || !lightboxClose) return;

  let lastFocused = null;

  function openLightbox(src, alt, trigger) {
    lastFocused = trigger || document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    // force a reflow so the opacity/scale transition actually runs
    void lightbox.offsetWidth;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));

    lightboxClose.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);

    const finish = (e) => {
      if (e && e.target !== lightbox) return;
      lightbox.hidden = true;
      lightboxImg.src = '';
      lightbox.removeEventListener('transitionend', finish);
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    // if transitions are disabled (reduced motion / no CSS support) just
    // finish immediately rather than waiting on an event that won't fire
    const dur = parseFloat(getComputedStyle(lightbox).transitionDuration) || 0;
    if (dur === 0) {
      finish();
    } else {
      lightbox.addEventListener('transitionend', finish);
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  items.forEach((item) => {
    const img = item.querySelector('img');
    if (!img) return;

    // figures aren't focusable/clickable-as-buttons by default — make them so
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    const caption = item.querySelector('figcaption');
    if (caption) item.setAttribute('aria-label', `Open image — ${caption.textContent.trim()}`);

    item.addEventListener('click', () => openLightbox(img.src, img.alt, item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(img.src, img.alt, item);
      }
    });
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
})();
