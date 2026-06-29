/* ── Progress bar ─────────────────────────────────────────── */
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  bar.style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
}, { passive: true });

/* ── Nav scroll state ─────────────────────────────────────── */
const nav = document.getElementById('nav');
const heroName = document.querySelector('.hero-name');
window.addEventListener('scroll', () => {
  const threshold = heroName ? heroName.getBoundingClientRect().bottom < 80 : scrollY > 40;
  nav.classList.toggle('scrolled', threshold);
}, { passive: true });

/* ── Active nav link ──────────────────────────────────────── */
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      document.querySelectorAll('.nav-links a').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`)
      );
  });
}, { rootMargin: '-35% 0px -60% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionObs.observe(s));

/* ── Scroll reveal ────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.in)')];
    const idx = siblings.indexOf(entry.target);
    setTimeout(() => entry.target.classList.add('in'), Math.min(idx * 80, 320));
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.06 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Stat counters ────────────────────────────────────────── */
const countObs = new IntersectionObserver(entries => {
  entries.forEach(({ isIntersecting, target: el }) => {
    if (!isIntersecting) return;
    const target = +el.dataset.count;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round((1 - (1 - p) ** 3) * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObs.unobserve(el);
  });
}, { threshold: 0.7 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

/* ── Swiper 3D Coverflow carousels ────────────────────────── */
const swiperConfig = {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  loop: false,
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 100,
    modifier: 2.5,
    slideShadows: false,
  },
  pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: false },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
};

new Swiper('.proj-swiper', {
  ...swiperConfig,
  pagination: { el: '.proj-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.proj-swiper .swiper-button-next', prevEl: '.proj-swiper .swiper-button-prev' },
});

new Swiper('.cert-swiper', {
  ...swiperConfig,
  pagination: { el: '.cert-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.cert-swiper .swiper-button-next', prevEl: '.cert-swiper .swiper-button-prev' },
});

/* ── Side scroll navigation ───────────────────────────────── */
const sideItems = document.querySelectorAll('.sn-item[data-section]');
const sideObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      sideItems.forEach(item =>
        item.classList.toggle('sn-active', item.dataset.section === e.target.id)
      );
  });
}, { rootMargin: '-28% 0px -68% 0px' });
document.querySelectorAll('section[id]').forEach(s => {
  if (s.id !== 'achievement') sideObs.observe(s);
});

/* ── Mobile menu ──────────────────────────────────────────── */
const menuBtn = document.getElementById('navMenu');
const drawer  = document.getElementById('drawer');
const openMenu  = () => { menuBtn.classList.add('open'); drawer.classList.add('open'); document.body.style.overflow = 'hidden'; };
const closeMenu = () => { menuBtn.classList.remove('open'); drawer.classList.remove('open'); document.body.style.overflow = ''; };
menuBtn.addEventListener('click', () => drawer.classList.contains('open') ? closeMenu() : openMenu());
document.querySelectorAll('.drawer-links a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
