/* ==========================================================================
   SYSTEMS & CLOUD PORTFOLIO CONTROLLER
   - Lenis global smooth scroll + GSAP ScrollTrigger reveals
   - Theme toggle (initial theme is set by an inline script in <head>)
   - Project architecture map, stat counters, nav scroll-spy, mobile nav
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 0. Preloader — always dismisses (window.load or hard 2.4s cap) ── */
  (() => {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    const fill = document.getElementById('preloader-fill');
    const pct = document.getElementById('preloader-pct');
    let value = 0;
    let done = false;

    const paint = (v) => {
      value = Math.max(value, Math.min(100, v));
      if (fill) fill.style.width = value + '%';
      if (pct) pct.textContent = Math.round(value);
    };

    const finish = () => {
      if (done) return;
      done = true;
      paint(100);
      clearInterval(tick);
      setTimeout(() => pre.classList.add('done'), reduceMotion ? 60 : 220);
      setTimeout(() => { pre.style.display = 'none'; }, 900);
    };

    const tick = setInterval(() => paint(value + Math.random() * 14), 130);
    paint(8);
    window.addEventListener('load', () => setTimeout(finish, 180), { once: true });
    setTimeout(finish, 2400); // hard cap — never blocks
  })();

  /* ── 0b. Headline reveal safety net — never leave a masked line clipped ── */
  setTimeout(() => {
    document.documentElement.classList.add('reveal-done');
  }, 2600);

  /* ── 1. Lenis smooth scrolling ───────────────────────────── */
  let lenisInstance = null;
  if (!reduceMotion && typeof Lenis !== 'undefined') {
    lenisInstance = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.2,
      smoothWheel: true,
      smoothTouch: false,
      anchors: true,
    });

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      lenisInstance.on('scroll', ScrollTrigger.update);
      // Also catch programmatic / keyboard scrolls that bypass Lenis
      window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });
      gsap.ticker.add((time) => lenisInstance.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenisInstance.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  const scrollToEl = (el, offset = -30) => {
    if (lenisInstance) lenisInstance.scrollTo(el, { offset });
    else el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  // Smooth anchor navigation
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        scrollToEl(targetEl);
      }
    });
  });

  /* ── 1b. Navbar pill — shrinks once you scroll past the top ── */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const updateNav = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateNav();
    window.addEventListener('scroll', updateNav, { passive: true });
    if (lenisInstance) lenisInstance.on('scroll', updateNav);
  }

  /* ── 2. Theme toggle ─────────────────────────────────────── */
  const themeToggleBtn = document.getElementById('theme-toggle');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
      window.heroWorld?.setTheme();
    });
  }

  /* ── 2b. Feed scroll progress to the hero WebGL world ────── */
  if (window.heroWorld) {
    const feedProgress = () => {
      const p = window.scrollY / Math.max(1, window.innerHeight * 0.9);
      window.heroWorld.setScrollProgress(p);
    };
    if (lenisInstance) lenisInstance.on('scroll', feedProgress);
    window.addEventListener('scroll', feedProgress, { passive: true });
    feedProgress();
  }

  /* ── 3. Architecture world — node hover + click → project ── */
  const flashCard = (el) => {
    el.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
    el.style.borderColor = 'var(--accent)';
    el.style.boxShadow = '0 0 0 2px var(--accent)';
    setTimeout(() => { el.style.borderColor = ''; el.style.boxShadow = ''; }, 1600);
  };

  if (window.heroWorld) {
    const hudDetail = document.getElementById('scene-hud-detail');
    const hudDefault = hudDetail ? hudDetail.textContent : '';
    const tip = document.getElementById('scene-tooltip');
    const tipName = document.getElementById('scene-tooltip-name');
    const tipSpec = document.getElementById('scene-tooltip-spec');

    window.heroWorld.onNodeHover((data) => {
      if (data) {
        if (tipName) tipName.textContent = data.name;
        if (tipSpec) tipSpec.textContent = data.spec;
        if (tip) tip.hidden = false;
        if (hudDetail) hudDetail.textContent = data.name;
      } else {
        if (tip) tip.hidden = true;
        if (hudDetail) hudDetail.textContent = hudDefault;
      }
    });

    if (tip) {
      window.addEventListener('pointermove', (e) => {
        if (tip.hidden) return;
        tip.style.left = e.clientX + 'px';
        tip.style.top = e.clientY + 'px';
      }, { passive: true });
    }

    window.heroWorld.onNodeSelect((data) => {
      const el = document.getElementById(data.target);
      if (el) { scrollToEl(el, -70); flashCard(el); }
    });
  }

  /* ── 4. Metric counter animation ────────────────────────── */
  const countElements = document.querySelectorAll('[data-count]');
  if (countElements.length) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        const targetCount = parseInt(target.dataset.count, 10);
        const startTime = performance.now();
        const duration = 1000;
        const animate = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          target.textContent = Math.round(eased * targetCount);
          if (progress < 1) requestAnimationFrame(animate);
          else target.textContent = targetCount;
        };
        requestAnimationFrame(animate);
        countObserver.unobserve(target);
      });
    }, { threshold: 0.5 });
    countElements.forEach((el) => countObserver.observe(el));
  }

  /* ── 5. GSAP subtle reveals ─────────────────────────────── */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined' && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    const reveal = (selector, y, duration, staggerMod) => {
      gsap.utils.toArray(selector).forEach((el, i) => {
        gsap.fromTo(el, { y, opacity: 0 }, {
          y: 0, opacity: 1, duration, ease: 'power2.out',
          delay: staggerMod ? (i % staggerMod) * 0.07 : 0,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
    };

    reveal('.sec-header', 16, 0.45, 0);
    reveal('.project-card', 20, 0.45, 2);
    reveal('.recognition-box', 16, 0.45, 0);

    ScrollTrigger.refresh();

    // Safety net: never leave content stuck invisible if a trigger is missed
    setTimeout(() => {
      gsap.utils.toArray('.sec-header, .project-card, .recognition-box').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === '0') {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.3 });
        }
      });
    }, 1200);
  }

  /* ── 6. Nav scroll-spy ──────────────────────────────────── */
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const spySections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (spySections.length) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove('active'));
        const active = navLinks.find((l) => l.getAttribute('href') === '#' + entry.target.id);
        if (active) active.classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spySections.forEach((s) => spyObserver.observe(s));
  }

  /* ── 7. Mobile navigation ───────────────────────────────── */
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    const closeMenu = () => {
      navMenu.classList.remove('open');
      mobileToggle.setAttribute('aria-expanded', 'false');
    };

    mobileToggle.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 960) closeMenu();
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

});
