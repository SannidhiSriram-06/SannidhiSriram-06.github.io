/* Scroll story for the Infosys deployment: the page pins, and each of the five defects flips from broken to fixed.
   The words come from the existing <dl class="defects">, which stays in the page for screen readers. */

const dl = document.querySelector('.defects');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

if (dl && !calm.matches) {
  const items = [...dl.querySelectorAll(':scope > div')].map((d) => ({
    term: d.querySelector('dt').textContent.trim(),
    text: d.querySelector('dd').textContent.replace(/\s+/g, ' ').trim(),
  }));

  // One drawing per defect: [broken, fixed]. Classes only, because the CSP forbids style attributes.
  const box = (x, y, label, sub) =>
    '<g class="s-box"><rect x="' + x + '" y="' + y + '" width="150" height="56" rx="9"/><text x="' + (x + 12) + '" y="' + (y + 24) + '" class="s-t">' + label + '</text><text x="' + (x + 12) + '" y="' + (y + 42) + '" class="s-s">' + sub + '</text></g>';
  const arrow = (x1, y1, x2, y2, cls = '') => '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="s-line ' + cls + '"/>';
  const note = (x, y, t, cls) => '<text x="' + x + '" y="' + y + '" class="s-note ' + cls + '">' + t + '</text>';
  const base = box(20, 20, 'Frontend', 'React on S3') + box(235, 20, 'Node.js API', 'EC2') + box(450, 20, 'Flask ML', 'EC2, 3 GNN models');

  const scenes = [
    [ // request path
      base + arrow(170, 48, 235, 48) + arrow(385, 48, 450, 48) + '<path d="M95 76 C95 140 525 140 525 76" class="s-line bad"/>' + note(215, 168, 'frontend calls ML directly: auth and CORS bypassed', 'bad'),
      base + arrow(170, 48, 235, 48, 'ok') + arrow(385, 48, 450, 48, 'ok') + note(215, 120, 'everything goes through one backend endpoint', 'ok'),
    ],
    [ // bind address
      base + arrow(170, 48, 235, 48, 'bad') + '<text x="203" y="40" class="s-x">x</text>' + note(215, 120, 'API listens on 127.0.0.1: refuses outside connections', 'bad'),
      base + arrow(170, 48, 235, 48, 'ok') + note(215, 120, 'bound to 0.0.0.0: reachable from outside', 'ok'),
    ],
    [ // cors
      base + arrow(170, 48, 235, 48, 'bad') + '<text x="203" y="40" class="s-x">x</text>' + note(215, 120, 'allowed origin: localhost:5173 only. The S3 site is blocked.', 'bad'),
      base + arrow(170, 48, 235, 48, 'ok') + note(215, 120, 'the S3 origin is added to the allow list', 'ok'),
    ],
    [ // pm2
      base + box(450, 120, 'PM2', 'system Python') + arrow(525, 120, 525, 76, 'bad') + note(215, 168, 'crash: numpy is missing from system Python', 'bad'),
      base + box(450, 120, 'PM2', 'venv interpreter') + arrow(525, 120, 525, 76, 'ok') + note(215, 168, 'PM2 points at the virtual environment: models load', 'ok'),
    ],
    [ // uploads
      base + arrow(170, 48, 235, 48) + arrow(385, 48, 450, 48) + note(215, 120, 'a random non-KYC image crashes the flow', 'bad'),
      base + arrow(170, 48, 235, 48, 'ok') + arrow(385, 48, 450, 48, 'ok') + note(215, 120, 'new result path: "Non-KYC Document"', 'ok'),
    ],
  ];

  const wrap = document.createElement('div');
  wrap.className = 'story';
  wrap.setAttribute('aria-hidden', 'true'); // the <dl> carries the same words for assistive tech
  wrap.style.setProperty('--steps', items.length);
  wrap.innerHTML =
    '<div class="story-stage">' +
    '<ol class="story-steps">' + items.map((it, i) => '<li><span class="story-n">' + (i + 1) + '</span><span class="story-term"></span><span class="story-text"></span></li>').join('') + '</ol>' +
    '<div class="story-fig"><svg viewBox="0 0 640 190" class="story-svg"></svg><p class="story-state"></p></div>' +
    '</div>';
  const lis = [...wrap.querySelectorAll('.story-steps li')];
  lis.forEach((li, i) => {
    li.querySelector('.story-term').textContent = items[i].term;
    li.querySelector('.story-text').textContent = items[i].text;
  });
  dl.after(wrap);
  dl.classList.add('sr-only');

  const svg = wrap.querySelector('.story-svg');
  const state = wrap.querySelector('.story-state');
  let shown = '';
  const update = () => {
    const r = wrap.getBoundingClientRect();
    const total = r.height - innerHeight * 0.6;
    const p = Math.min(0.9999, Math.max(0, (-r.top + innerHeight * 0.2) / total));
    const f = p * items.length;
    const i = Math.min(items.length - 1, Math.floor(f));
    const fixed = f - i > 0.5;
    const key = i + (fixed ? 'a' : 'b');
    if (key === shown) return;
    shown = key;
    svg.innerHTML = scenes[i][fixed ? 1 : 0];
    state.textContent = fixed ? 'After: ' + items[i].term + ' fixed' : 'Before: ' + items[i].term + ' broken';
    state.className = 'story-state ' + (fixed ? 'ok' : 'bad');
    lis.forEach((li, k) => li.classList.toggle('is-on', k === i));
  };
  let raf = 0;
  addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
}
