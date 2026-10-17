/* The page rail, after PdfCraft's page: a ruler down the right edge (ticks every 1% of the page, a marker with rolling
   digits, drag to scrub) and the section names riding it. The next name climbs the rail turned on its side, then
   peels off letter by letter into the top-right corner while the previous one shrinks into a dim stack above it.
   Everything is driven by scroll position, nothing runs on a timer. Wide screens only. */

const wide = matchMedia('(min-width: 64rem)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const sections = [...document.querySelectorAll('.site-nav a[href^="#"]')]
  .map((a) => ({ name: a.textContent.trim().toUpperCase(), href: a.getAttribute('href'), el: document.querySelector(a.getAttribute('href')) }))
  .filter((s) => s.el);

let TOP = 57;         // where the ruler starts: the header's bottom edge (set from the real header height each frame)
const BOTTOM = 10;
const FS = 34;        // label font size
const S_LIST = 16 / FS, S_COL = 20 / FS;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;
const make = (tag, cls, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; parent?.append(e); return e; };

let rail, tape, tickEls, thumb, marker, cols, guide, labelsRoot, labels, raf = 0, pointerY = null, dragging = false, lastH = 0;

// Real widths of the rendered letters, so the label font (stretched Archivo) lays out exactly.
function measureLabel(L) {
  L.adv = L.letters.map((sp) => { sp.style.transform = 'none'; return sp.getBoundingClientRect().width; });
  L.cum = []; L.W = 0;
  L.adv.forEach((a) => { L.cum.push(L.W); L.W += a; });
  L.last = []; // force the next frame to write every transform again
}

function build() {
  const host = document.getElementById('main') || document.body; // inside <main>, so it counts as page content
  document.documentElement.classList.add('rail-on');

  rail = make('div', 'rail', host);
  rail.setAttribute('role', 'scrollbar');
  rail.setAttribute('aria-controls', 'main');
  rail.setAttribute('aria-orientation', 'vertical');
  rail.setAttribute('aria-label', 'Page position');
  rail.setAttribute('aria-valuemin', '0');
  rail.setAttribute('aria-valuemax', '100');
  rail.tabIndex = 0;
  make('div', 'rail-bg', rail).setAttribute('aria-hidden', 'true');

  tape = make('div', 'rail-tape', rail);
  tape.setAttribute('aria-hidden', 'true');
  tickEls = [];
  for (let p = 0; p <= 100; p++) {
    const t = make('div', 'rail-tick' + (p % 5 === 0 ? ' is-major' : ''), tape);
    make('i', '', t);
    if (p % 5 === 0) make('span', '', t).textContent = String(p);
    tickEls.push(t);
  }

  thumb = make('div', 'rail-thumb', rail);
  thumb.setAttribute('aria-hidden', 'true');
  marker = make('div', 'rail-marker', rail);
  marker.setAttribute('aria-hidden', 'true');
  const readout = make('span', 'rail-readout', marker);
  const digits = make('span', 'rail-digits', readout);
  cols = [0, 1, 2].map(() => {
    const col = make('span', 'rail-col', digits);
    for (let d = 0; d < 10; d++) make('span', '', col).textContent = String(d);
    return col;
  });
  make('span', '', readout).textContent = '%';
  guide = make('div', 'rail-guide', rail);
  guide.setAttribute('aria-hidden', 'true');

  // Section names, one span per letter so each can travel on its own.
  labelsRoot = make('div', 'rail-labels', host);
  labelsRoot.setAttribute('aria-hidden', 'true');
  labels = sections.map((s) => {
    const box = make('div', 'rail-label', labelsRoot);
    const letters = [...s.name].map((ch) => { const sp = make('span', 'rail-letter', box); sp.textContent = ch; return sp; });
    const link = make('a', 'rail-link', labelsRoot);
    link.href = s.href;
    link.tabIndex = -1;
    const L = { s, box, letters, adv: [], cum: [], W: 0, link, last: [] };
    measureLabel(L);
    return L;
  });

  rail.addEventListener('pointerenter', () => rail.classList.add('is-hover'));
  rail.addEventListener('pointerleave', () => { if (!dragging) { rail.classList.remove('is-hover'); pointerY = null; schedule(); } });
  rail.addEventListener('pointermove', (e) => { pointerY = e.clientY; guide.style.top = e.clientY + 'px'; if (dragging) scrubTo(e.clientY); schedule(); });
  rail.addEventListener('pointerdown', (e) => { dragging = true; rail.setPointerCapture(e.pointerId); scrubTo(e.clientY); });
  rail.addEventListener('pointerup', (e) => { dragging = false; rail.releasePointerCapture(e.pointerId); });
  rail.addEventListener('keydown', onKey);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(document.body);
  const remeasure = () => { labels?.forEach(measureLabel); schedule(); };
  document.fonts?.load('620 34px Archivo').then(remeasure, remeasure);
  document.fonts?.ready.then(remeasure);
  schedule();
}

function teardown() {
  document.documentElement.classList.remove('rail-on');
  rail?.remove();
  labelsRoot?.remove();
  rail = labelsRoot = null;
  removeEventListener('scroll', schedule);
  removeEventListener('resize', schedule);
}

function maxScroll() { return Math.max(1, document.documentElement.scrollHeight - innerHeight); }

function scrubTo(y) {
  TOP = (header ? header.offsetHeight : 57) - 1;
  const frac = clamp((y - TOP) / (innerHeight - TOP - BOTTOM));
  scrollTo({ top: frac * maxScroll(), behavior: 'instant' });
}

function onKey(e) {
  const step = { ArrowDown: innerHeight * 0.1, ArrowUp: -innerHeight * 0.1, PageDown: innerHeight * 0.9, PageUp: -innerHeight * 0.9 }[e.key];
  if (step !== undefined) scrollBy({ top: step, behavior: 'instant' });
  else if (e.key === 'Home') scrollTo({ top: 0, behavior: 'instant' });
  else if (e.key === 'End') scrollTo({ top: maxScroll(), behavior: 'instant' });
  else return;
  e.preventDefault();
}

function schedule() { if (!raf && rail) raf = requestAnimationFrame(frame); }

function frame() {
  raf = 0;
  if (!rail) return;
  const Y = scrollY, vh = innerHeight, vw = innerWidth, H = document.documentElement.scrollHeight;
  TOP = (header ? header.offsetHeight : 57) - 1; // the 2px marker then covers the header and bar borders exactly
  const track = vh - TOP - BOTTOM;
  const prog = clamp(Y / maxScroll());

  // Ruler: ticks sit at their share of the page and slide with it.
  if (H !== lastH) { lastH = H; tickEls.forEach((t, p) => { t.style.top = (p * H) / 100 + 'px'; }); }
  tape.style.transform = 'translate3d(0,' + (TOP - Y) + 'px,0)';
  const pct = Math.round(prog * 100);
  rail.setAttribute('aria-valuenow', String(pct));
  marker.style.transform = 'translate3d(0,' + (TOP + prog * track) + 'px,0)';
  marker.classList.toggle('is-low', TOP + prog * track > vh - 24);
  const dg = [Math.floor(pct / 100), Math.floor(pct / 10) % 10, pct % 10];
  cols.forEach((c, i) => { c.style.transform = 'translateY(-' + dg[i] + 'em)'; });
  thumb.style.height = Math.max(24, (vh / H) * track) + 'px';
  thumb.style.transform = 'translate3d(0,' + (TOP + (Y / H) * track) + 'px,0)';
  // Ticks near the pointer lean out, like a dock.
  tickEls.forEach((t, p) => {
    const sy = (p * H) / 100 - Y + TOP;
    const line = t.firstChild;
    const k = pointerY === null || sy < -40 || sy > vh + 40 ? 1 : 1 + 1.2 * clamp(1 - Math.abs(sy - pointerY) / 90);
    line.style.transform = k === 1 ? '' : 'scaleX(' + k.toFixed(2) + ')';
  });

  layoutLabels(Y, vw, vh);
}

function layoutLabels(Y, vw, vh) {
  const n = labels.length;
  const R = vw - 56, cx = vw - 30;
  const topBase = (header ? header.offsetHeight : 56) + 27;
  const tops = sections.map((s, i) => (i === 0 ? 0 : s.el.getBoundingClientRect().top + Y));
  const peelStart = vh * 0.425, peelEnd = vh * 0.28;
  let active = 0;
  tops.forEach((t, i) => { if (Y >= t - 0.2 * vh) active = i; });

  labels.forEach((L, i) => {
    const yPast = topBase + 20 * i, yCur = yPast + 26, yList = vh - 36 - 20 * (n - 1 - i);
    const xSlot = (j, s) => R - s * (L.W - L.cum[j] - L.adv[j] / 2);
    const Yh = tops[i] - 0.215 * vh;
    const A = Yh + peelEnd + S_COL * (L.W - L.adv[L.adv.length - 1] / 2);
    const r = i < n - 1 ? clamp((Y - (tops[i + 1] - 0.185 * vh - 100)) / 200) : 0;
    // Sticking to the section: the name turns vertical and rides up with its section's top edge as soon as that edge
    // is 40px up the screen, finishing 160px later. Every letter shares this, so the word moves as one piece.
    const entry = i === 0 ? 1 : clamp((vh - 40 - (tops[i] - Y)) / 160);
    let cur = 0;
    const rest = { list: true, cur: false, past: false };

    L.letters.forEach((sp, j) => {
      const ycol = A - Y - S_COL * (L.cum[j] + L.adv[j] / 2);
      let p = i === 0 ? 1 : clamp((peelStart - ycol) / (peelStart - peelEnd));
      let e = i === 0 ? 1 : entry;
      let rr = r;
      if (calm.matches) { p = i === active ? 1 : 0; e = 0; rr = i < active ? 1 : 0; if (i < active) p = 1; }
      let x, y, rot, sc;
      if (p > 0) { x = lerp(cx, xSlot(j, 1), easeOut(p)); y = lerp(ycol, yCur, p); rot = -90 * (1 - p); sc = lerp(S_COL, 1, p); }
      else if (e > 0) { x = lerp(xSlot(j, S_LIST), cx, easeOut(e)); y = lerp(yList, ycol, e); rot = -90 * e; sc = lerp(S_LIST, S_COL, e); }
      else { x = xSlot(j, S_LIST); y = yList; rot = 0; sc = S_LIST; }
      if (calm.matches && p > 0 && rr < 1) { x = xSlot(j, 1); y = yCur; rot = 0; sc = 1; }
      if (rr > 0) { x = lerp(x, xSlot(j, S_LIST), rr); y = lerp(y, yPast, rr); rot = lerp(rot, 0, rr); sc = lerp(sc, S_LIST, rr); }
      const tf = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(-50%,-50%) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      if (L.last[j] !== tf) { sp.style.transform = tf; L.last[j] = tf; }
      cur = Math.max(cur, p * (1 - rr));
      if (j === 0) { rest.list = e === 0 && p === 0 && rr === 0; rest.cur = p === 1 && rr === 0; rest.past = rr === 1; }
    });

    L.box.style.color = 'color-mix(in srgb, var(--ink) ' + Math.round(cur * 100) + '%, var(--muted))';
    // The invisible link follows the name only while it sits still.
    const s = rest.cur ? 1 : S_LIST;
    const y = rest.cur ? yCur : rest.past ? yPast : yList;
    const showLink = rest.list || rest.past; // the big current name stays click-through, so it never blocks a field under it
    L.link.style.display = showLink ? 'block' : 'none';
    if (showLink) {
      L.link.style.left = R - s * L.W + 'px';
      L.link.style.top = y - (rest.cur ? 20 : 12) + 'px';
      L.link.style.width = s * L.W + 'px';
      L.link.style.height = (rest.cur ? 40 : 24) + 'px';
      L.link.setAttribute('aria-label', 'Jump to ' + L.s.name.toLowerCase());
    }
  });
}

function sync() {
  if (wide.matches && !rail) build();
  else if (!wide.matches && rail) teardown();
}
wide.addEventListener('change', sync);
sync();
