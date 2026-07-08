/* ═══════════════════════════════════════════════════════════
   MASUM — Portfolio
   Vanilla JS, no dependencies. Loaded with `defer`.

   Each concern lives in its own init function and is registered
   at the bottom. Any one throwing is caught so a single failure
   can never take the rest of the page down with it.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canHover      = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* Coalesce high-frequency events (scroll, mousemove) into one frame. */
  function raf(fn) {
    let ticking = false;
    return function (...args) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    };
  }

  /* ── Animated floating squares ── */
  function initBgSquares() {
    if (reducedMotion.matches) return;
    const canvas = document.getElementById('bgSquares');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const squares = [];
    const COUNT = 20;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', raf(resize), { passive: true });

    for (let i = 0; i < COUNT; i++) {
      squares.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 20 + Math.random() * 80,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.003,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        opacity: 0.015 + Math.random() * 0.04,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        borderOnly: Math.random() > 0.4,
        color: Math.random() > 0.8
          ? 'rgba(61,130,255,'   // blue accent
          : 'rgba(14,211,150,'  // emerald accent
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of squares) {
        s.x += s.vx;
        s.y += s.vy;
        s.rotation += s.rotSpeed;
        s.pulsePhase += s.pulseSpeed;

        const pulsed = s.opacity * (0.5 + 0.5 * Math.sin(s.pulsePhase));

        if (s.x < -s.size)              s.x = canvas.width  + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size)              s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        const r = s.size * 0.12;

        if (s.borderOnly) {
          ctx.strokeStyle = s.color + pulsed + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-s.size / 2, -s.size / 2, s.size, s.size, r);
          ctx.stroke();
        } else {
          ctx.fillStyle = s.color + pulsed + ')';
          ctx.beginPath();
          ctx.roundRect(-s.size / 2, -s.size / 2, s.size, s.size, r);
          ctx.fill();
        }
        ctx.restore();
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ── Sticky nav + mobile drawer ── */
  function initNav() {
    const nav    = $('#nav');
    const menu   = $('#navMenu');
    const toggle = $('#navToggle');

    const onScroll = raf(() => nav.classList.toggle('is-stuck', window.scrollY > 12));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.classList.toggle('is-locked', open);
    };

    toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));

    // Tapping a link inside the drawer should close it.
    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });

    // Reset drawer state when resizing back up to desktop.
    window.addEventListener('resize', raf(() => {
      if (window.innerWidth > 900 && menu.classList.contains('is-open')) setOpen(false);
    }), { passive: true });
  }

  /* ── Scroll progress bar ── */
  function initProgress() {
    const bar = $('#scrollProgress');
    const update = raf(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${Math.min(pct, 1)})`;
    });
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  }

  /* ── Scroll reveal ──
     Sets window.__revealReady so the inline failsafe in <head> knows the
     reveal system came up. If this function never completes, that failsafe
     strips html.js after 2s and every .reveal element becomes visible. */
  function initReveal() {
    const items = $$('.reveal');
    if (!items.length) { window.__revealReady = true; return; }

    const showAll = () => items.forEach((el) => el.classList.add('is-visible'));

    // No IntersectionObserver, or the visitor asked for less motion:
    // skip the choreography and just show the content.
    if (!('IntersectionObserver' in window) || reducedMotion.matches) {
      showAll();
      window.__revealReady = true;
      return;
    }

    items.forEach((el) => {
      const d = el.dataset.delay;
      if (d) el.style.setProperty('--d', d);
    });

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);   // reveal once, then stop watching
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach((el) => io.observe(el));
    window.__revealReady = true;
  }

  /* ── Animated stat counters ── */
  function initCounters() {
    const nums = $$('.stats__num');
    if (!nums.length) return;

    const run = (el) => {
      const target = Number(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';

      if (reducedMotion.matches) {
        el.textContent = target + suffix;
        return;
      }

      const duration = 1500;
      const start = performance.now();

      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);           // easeOutCubic
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    nums.forEach((el) => io.observe(el));
  }

  /* ── Pointer sheen on service cards ── */
  function initCardSheen() {
    if (!canHover.matches) return;

    $$('.card').forEach((card) => {
      card.addEventListener('mousemove', raf((e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      }));
    });
  }

  /* ── Cursor glow ── */
  function initCursorGlow() {
    if (!canHover.matches || reducedMotion.matches) return;

    const glow = $('#cursorGlow');
    let shown = false;

    document.addEventListener('mousemove', raf((e) => {
      glow.style.translate = `${e.clientX}px ${e.clientY}px`;
      // The element is centred with a -50%/-50% translate in CSS; using the
      // `translate` property here composes with that transform rather than
      // overwriting it.
      glow.style.transform = 'translate(-50%, -50%)';
      if (!shown) { glow.classList.add('is-on'); shown = true; }
    }));

    document.addEventListener('mouseleave', () => glow.classList.remove('is-on'));
    document.addEventListener('mouseenter', () => glow.classList.add('is-on'));
  }

  /* ── Showreel ──
     The <video> already carries `controls` and `preload="none"`, so it plays
     without this module and downloads nothing until asked. All this adds is the
     branded cover, which retracts on first play. */
  function initShowreel() {
    const reel  = $('.reel');
    const video = $('#reelVideo');
    const cover = $('#reelCover');
    const play  = $('#reelPlay');
    if (!reel || !video || !cover || !play) return;

    const start = () => {
      // Retract the cover regardless of whether play() resolves — a rejected
      // promise (autoplay policy, decode error) must not strand the visitor
      // behind a dead cover with the native controls unreachable underneath.
      reel.classList.add('is-playing');
      video.play().catch(() => {});
    };

    play.addEventListener('click', (e) => { e.stopPropagation(); start(); });
    cover.addEventListener('click', start);

    // Keep the cover retracted for the rest of the visit, including on pause,
    // so the native scrubber stays reachable.
    video.addEventListener('play', () => reel.classList.add('is-playing'));
  }

  /* ── Work cards: hover preview + lightbox ── */
  function initWork() {
    const cards    = $$('.work-card');
    const lightbox = $('#lightbox');
    const panel    = $('#lightboxPanel');
    const video    = $('#lightboxVideo');
    const closeBtn = $('#lightboxClose');
    if (!cards.length || !lightbox) return;

    /* Hover previews — only where hovering is meaningful and motion is welcome.
       The <video> src stays empty until first hover, so nothing downloads
       until the visitor actually shows interest in that card. */
    if (canHover.matches && !reducedMotion.matches) {
      cards.forEach((card) => {
        const preview = $('.work-card__preview', card);
        if (!preview) return;

        const start = () => {
          if (!preview.src && preview.dataset.src) preview.src = preview.dataset.src;
          card.classList.add('is-previewing');
          // play() rejects if the browser blocks autoplay; that's harmless here.
          preview.play().catch(() => {});
        };
        const stop = () => {
          card.classList.remove('is-previewing');
          preview.pause();
        };

        card.addEventListener('mouseenter', start);
        card.addEventListener('mouseleave', stop);
        card.addEventListener('focus', start);
        card.addEventListener('blur', stop);
      });
    }

    /* Lightbox */
    let lastFocused = null;

    const open = (card) => {
      lastFocused = document.activeElement;

      // Never let the showreel keep playing underneath the lightbox.
      const reel = $('#reelVideo');
      if (reel && !reel.paused) reel.pause();

      lightbox.dataset.orient = card.dataset.orient || 'wide';
      video.src = card.dataset.video;
      lightbox.hidden = false;

      // Force a reflow so the transition runs from the hidden state.
      void lightbox.offsetWidth;
      lightbox.classList.add('is-open');
      document.body.classList.add('is-locked');

      video.play().catch(() => {});
      closeBtn.focus();
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      video.pause();

      const finish = () => {
        lightbox.hidden = true;
        video.removeAttribute('src');   // release the buffer
        video.load();
      };

      if (reducedMotion.matches) finish();
      else setTimeout(finish, 350);     // matches --t-mid

      if (lastFocused) lastFocused.focus();
    };

    cards.forEach((card) => {
      card.addEventListener('click', () => open(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(card);
        }
      });
    });

    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close')) close();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;

      if (e.key === 'Escape') { close(); return; }

      // Keep focus inside the dialog while it's open.
      if (e.key === 'Tab') {
        const focusables = $$('button, [href], video[controls]', panel);
        if (!focusables.length) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ── FAQ accordion ──
     <details> can't transition its own height, so we drive the panel
     manually and only flip the `open` attribute at the right moment. */
  function initFaq() {
    $$('.faq__item').forEach((item) => {
      const summary = $('summary', item);
      const body    = $('.faq__body', item);
      if (!summary || !body) return;

      let animating = false;

      summary.addEventListener('click', (e) => {
        e.preventDefault();
        if (animating) return;

        if (reducedMotion.matches) {
          item.open = !item.open;
          return;
        }

        animating = true;
        const opening = !item.open;

        if (opening) {
          item.open = true;                       // must be open to measure
          const h = body.scrollHeight;
          body.animate(
            [{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }],
            { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' }
          ).onfinish = () => { animating = false; };
        } else {
          const h = body.scrollHeight;
          const anim = body.animate(
            [{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
            { duration: 240, easing: 'cubic-bezier(.16,1,.3,1)' }
          );
          anim.onfinish = () => {
            item.open = false;                    // close only after collapsing
            animating = false;
          };
        }
      });
    });
  }

  /* ── Scrollspy: highlight the nav link for the section in view ── */
  function initScrollSpy() {
    const links = $$('.nav__link');
    if (!links.length) return;

    const map = new Map();
    links.forEach((link) => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;
      const section = $(id);
      if (section) map.set(section, link);
    });
    if (!map.size) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = map.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    map.forEach((_, section) => io.observe(section));
  }

  /* ── Back to top ── */
  function initToTop() {
    const btn = $('#toTop');
    const onScroll = raf(() => btn.classList.toggle('is-on', window.scrollY > 700));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? 'auto' : 'smooth'
      });
    });
  }

  /* ── Footer year ── */
  function initYear() {
    const el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ── Boot ── */
  const modules = [
    initBgSquares, initNav, initProgress, initReveal, initCounters, initCardSheen,
    initCursorGlow, initShowreel, initWork, initFaq, initScrollSpy, initToTop, initYear
  ];

  modules.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      // One broken module must never blank the page.
      console.error(`[masum] ${fn.name} failed:`, err);
    }
  });
})();
window.addEventListener("load", () => {
  setTimeout(() => {

    let direction = 1;
    let pause = false;

    const speed = 0.15;

    const timer = setInterval(() => {

      if (pause) return;

      window.scrollBy(0, direction * speed);

      if (
        direction === 1 &&
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 5
      ) {
        pause = true;

        setTimeout(() => {
          direction = -1;
          pause = false;
        }, 3000);
      }

      if (direction === -1 && window.scrollY <= 0) {
        clearInterval(timer);
      }

    }, 16);

  }, 5000);
});
