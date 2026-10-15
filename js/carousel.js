/* Certifications as a 3D ring. The original list stays in the page (visually hidden) for screen readers. */
import * as sfx from './sfx.js';

const list = document.querySelector('.certs');
if (list) {
  const certs = [...list.querySelectorAll('li')].map((li) => ({
    name: li.querySelector('.cert-name').textContent.trim(),
    meta: li.querySelector('.cert-meta').textContent.trim(),
    href: li.querySelector('a').href,
  }));
  const N = certs.length;
  const step = 360 / N;
  let idx = 0;
  let drift = null;

  const root = document.createElement('div');
  root.className = 'ring';
  root.innerHTML =
    '<div class="ring-view" role="group" aria-roledescription="carousel" aria-label="Certifications, one at a time" tabindex="0"><div class="ring-spin"></div></div>' +
    '<div class="ring-controls"><button type="button" class="button" data-d="-1">Previous</button><p class="ring-count" role="status"></p><button type="button" class="button" data-d="1">Next</button></div>';
  const spin = root.querySelector('.ring-spin');
  const view = root.querySelector('.ring-view');
  const count = root.querySelector('.ring-count');

  const cards = certs.map((c, i) => {
    const card = document.createElement('article');
    card.className = 'ring-card';
    card.innerHTML = '<span class="ring-n"></span><h3 class="ring-name"></h3><p class="ring-meta"></p><a class="ring-link" target="_blank" rel="noopener">Verify credential<span class="sr-only"> (opens in a new tab)</span></a>';
    card.querySelector('.ring-n').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    card.querySelector('.ring-name').textContent = c.name;
    card.querySelector('.ring-meta').textContent = c.meta;
    card.querySelector('.ring-link').href = c.href;
    card.style.setProperty('--a', i * step + 'deg');
    spin.append(card);
    return card;
  });

  let rot = 0; // continuous angle, so going from the last card to the first keeps turning the same way
  const go = (d) => {
    idx = (idx + d + N) % N;
    rot -= d * step;
    spin.style.setProperty('--rot', rot + 'deg');
    cards.forEach((c, i) => {
      const front = i === idx;
      c.classList.toggle('is-front', front);
      c.querySelector('.ring-link').tabIndex = front ? 0 : -1;
      c.setAttribute('aria-hidden', String(!front));
    });
    count.textContent = certs[idx].name + ', ' + (idx + 1) + ' of ' + N;
  };

  root.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { stop(); go(Number(b.dataset.d)); }));
  view.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stop(); go(1); } else if (e.key === 'ArrowLeft') { stop(); go(-1); }
  });

  // Drag or swipe.
  let x0 = null;
  view.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  addEventListener('pointerup', (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) { stop(); go(dx < 0 ? 1 : -1); sfx.swoosh(); }
  });

  // Slow auto-turn, paused while hovered, focused or off screen, and never with reduced motion.
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  const stop = () => { clearInterval(drift); drift = null; };
  const start = () => { if (!still.matches && !drift) drift = setInterval(() => go(1), 3500); };
  root.addEventListener('pointerenter', stop);
  root.addEventListener('focusin', stop);
  new IntersectionObserver(([en]) => (en.isIntersecting ? start() : stop())).observe(root);

  list.classList.add('sr-only');
  list.after(root);
  // Radius so neighbouring cards just touch: half a card width over tan(half the step).
  spin.style.setProperty('--r', (cards[0].offsetWidth / 2) / Math.tan(Math.PI / N) * 1.35 + 'px');
  go(0);
}
