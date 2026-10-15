/* Real glass for buttons: an SVG displacement map bends whatever is behind them at the rim, like a lens.
   Chromium only (backdrop-filter with url() is not supported elsewhere); other browsers keep the CSS blur. */

const chromium = navigator.userAgentData?.brands?.some((b) => b.brand === 'Chromium');
const NS = 'http://www.w3.org/2000/svg';

if (chromium) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.position = 'absolute';
  document.body.append(svg);

  // Red and green channels of this image tell the filter how far to push each pixel; blue and the middle stay neutral.
  const makeMap = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    const img = g.createImageData(w, h);
    const r = h / 2;
    const bezel = Math.min(r, 14);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x + 0.5;
        const vx = px - Math.min(Math.max(px, r), w - r); // distance from the pill's centre line
        const vy = y + 0.5 - r;
        const dist = Math.hypot(vx, vy);
        const depth = r - dist;
        let mx = 0, my = 0;
        if (depth < bezel && dist > 0) {
          const t = 1 - Math.max(depth, 0) / bezel;
          mx = (vx / dist) * t * t;
          my = (vy / dist) * t * t;
        }
        const i = (y * w + x) * 4;
        img.data[i] = 128 + mx * 127;
        img.data[i + 1] = 128 + my * 127;
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c.toDataURL();
  };

  let n = 0;
  document.querySelectorAll('.button:not(.button-primary), .theme-toggle, .term-chip').forEach((el) => {
    const id = 'lens-' + n++;
    const filter = document.createElementNS(NS, 'filter');
    filter.setAttribute('id', id);
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    svg.append(filter);

    const apply = () => {
      const w = Math.round(el.offsetWidth);
      const h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      filter.setAttribute('filterUnits', 'userSpaceOnUse');
      filter.setAttribute('x', '0');
      filter.setAttribute('y', '0');
      filter.setAttribute('width', w);
      filter.setAttribute('height', h);
      filter.innerHTML =
        '<feImage href="' + makeMap(w, h) + '" x="0" y="0" width="' + w + '" height="' + h + '" preserveAspectRatio="none" result="m"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="m" scale="26" xChannelSelector="R" yChannelSelector="G"/>';
      el.style.setProperty('backdrop-filter', 'url(#' + id + ') saturate(1.4) brightness(1.05)');
    };
    let timer;
    new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(apply, 80); }).observe(el);
  });
}
