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
    const target = +el.dataset.count, hasPlus = el.dataset.plus === 'true';
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round((1 - (1 - p) ** 3) * target) + (hasPlus ? '+' : '');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObs.unobserve(el);
  });
}, { threshold: 0.7 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

/* ── Apple carousel ───────────────────────────────────────── */
function initCarousel(trackId, prevId, nextId, dotsId) {
  const track = document.getElementById(trackId);
  const prev  = document.getElementById(prevId);
  const next  = document.getElementById(nextId);
  const dotsEl= document.getElementById(dotsId);
  if (!track) return;

  const cards = [...track.children];
  const N = cards.length;
  let cur = 0;

  const dots = cards.map((_, i) => {
    const d = document.createElement('button');
    d.className = 'c-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', `Item ${i + 1}`);
    d.addEventListener('click', () => go(i));
    dotsEl.appendChild(d);
    return d;
  });

  const padL = () => parseInt(getComputedStyle(track).paddingLeft) || 0;

  function go(idx) {
    cur = Math.max(0, Math.min(idx, N - 1));
    track.scrollTo({ left: cards[cur].offsetLeft - padL(), behavior: 'smooth' });
    dots.forEach((d, i) => d.classList.toggle('active', i === cur));
    if (prev) prev.disabled = cur === 0;
    if (next) next.disabled = cur === N - 1;
  }

  if (prev) prev.addEventListener('click', () => go(cur - 1));
  if (next) next.addEventListener('click', () => go(cur + 1));

  let st;
  track.addEventListener('scroll', () => {
    clearTimeout(st);
    st = setTimeout(() => {
      const offset = track.scrollLeft + padL();
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft - offset);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      if (closest !== cur) {
        cur = closest;
        dots.forEach((d, i) => d.classList.toggle('active', i === cur));
        if (prev) prev.disabled = cur === 0;
        if (next) next.disabled = cur === N - 1;
      }
    }, 60);
  }, { passive: true });

  // Drag-to-scroll on desktop
  let dragStart = null, scrollStart = 0, isDragging = false;
  track.addEventListener('mousedown', e => {
    dragStart = e.clientX; scrollStart = track.scrollLeft; isDragging = false;
    track.style.scrollBehavior = 'auto';
  });
  window.addEventListener('mousemove', e => {
    if (dragStart === null) return;
    const dx = dragStart - e.clientX;
    if (Math.abs(dx) > 4) { isDragging = true; track.scrollLeft = scrollStart + dx; }
  });
  window.addEventListener('mouseup', e => {
    if (isDragging) {
      e.preventDefault();
      const offset = track.scrollLeft + padL();
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft - offset);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      track.style.scrollBehavior = 'smooth';
      go(closest);
    }
    dragStart = null; isDragging = false;
  });
  track.addEventListener('click', e => { if (isDragging) e.preventDefault(); }, true);

  if (prev) prev.disabled = true;
}

initCarousel('proj-track', 'proj-prev', 'proj-next', 'proj-dots');
initCarousel('cert-track', 'cert-prev', 'cert-next', 'cert-dots');

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
