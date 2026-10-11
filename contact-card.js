/* Contact card: flip interaction + optional liquid-glass layer.
   Flip works without the CDN; React + liquid-glass load afterwards and only add the glass. */

const card = document.getElementById('contact-card');
const toggle = document.querySelector('.flip-toggle');

if (card && toggle) {
  const front = card.querySelector('.flip-front');
  const back = card.querySelector('.flip-back');

  const setFlipped = (flipped) => {
    card.classList.toggle('is-flipped', flipped);
    toggle.setAttribute('aria-pressed', String(flipped));
    // keep the hidden face out of tab order and the accessibility tree
    front.inert = flipped;
    back.inert = !flipped;
  };

  toggle.addEventListener('click', () => setFlipped(!card.classList.contains('is-flipped')));
  card.addEventListener('click', (e) => {
    if (e.target.closest('a')) return; // links on the back stay clickable
    setFlipped(!card.classList.contains('is-flipped'));
  });

  mountGlass();
}

async function mountGlass() {
  try {
    const [{ createElement }, { createRoot }, { Glass }] = await Promise.all([
      import('react'),
      import('react-dom/client'),
      import('@samasante/liquid-glass'),
    ]);
    // tint must contrast with the card text, so follow the site theme
    const tint = () => (document.documentElement.getAttribute('data-theme') === 'light'
      ? 'rgba(255, 255, 255, 0.55)'
      : 'rgba(16, 16, 20, 0.62)');
    const render = (layer) => {
      const width = Math.round(layer.clientWidth);
      const height = Math.round(layer.clientHeight);
      if (!width || !height) return;
      layer._glassRoot ??= createRoot(layer);
      layer._glassRoot.render(
        createElement(Glass, {
          width,
          height,
          radius: 14,
          style: { width: '100%', height: '100%', borderRadius: 14, background: tint() },
        })
      );
      card.classList.add('has-glass');
    };
    const layers = card.querySelectorAll('.glass-layer');
    // the contact slide is display:none until visited, so render whenever a layer gets a size
    const observer = new ResizeObserver((entries) => entries.forEach(({ target }) => render(target)));
    new MutationObserver(() => layers.forEach(render))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    layers.forEach((layer) => observer.observe(layer));
  } catch (err) {
    // CDN blocked or offline: the CSS frosted face is the fallback
    console.info('liquid-glass unavailable, using CSS fallback', err?.message);
  }
}
