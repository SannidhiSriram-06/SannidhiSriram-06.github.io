/* Hero: a dotted globe with the three places my work lives (Hyderabad, us-east-1, ap-south-1) and packets crossing between them.
   Decorative only. Falls back to nothing without WebGL, and to a still frame with reduced motion. */
import * as THREE from '../assets/vendor/three.module.min.js';

const intro = document.getElementById('about');
const canvas = document.getElementById('hero-canvas');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const ll = (lat, lon, r = 1) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

if (intro && canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    renderer = null; // no WebGL: the page is fine without it
  }

  if (renderer) {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0.2, 5.4);
    const globe = new THREE.Group();
    scene.add(globe);

    // Dots on a sphere (Fibonacci spiral).
    const N = 2400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dotMat = new THREE.PointsMaterial({ size: 0.014, transparent: true, opacity: 0.55 });
    globe.add(new THREE.Points(dotGeo, dotMat));

    // Places and arcs.
    const places = { hyd: ll(17.39, 78.49, 1.02), iad: ll(38.9, -77.4, 1.02), bom: ll(19.08, 72.88, 1.02) };
    const markMat = new THREE.MeshBasicMaterial();
    Object.values(places).forEach((p) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), markMat);
      m.position.copy(p);
      globe.add(m);
    });
    const arcOf = (a, b, lift) => {
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.02 + lift);
      return new THREE.QuadraticBezierCurve3(a, mid, b);
    };
    const arcs = [arcOf(places.hyd, places.iad, 0.55), arcOf(places.iad, places.bom, 0.55), arcOf(places.bom, places.hyd, 0.08)];
    const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.8 });
    arcs.forEach((c) => globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), lineMat)));
    const packetMat = new THREE.MeshBasicMaterial();
    const packets = arcs.map((c, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), packetMat);
      globe.add(m);
      return { m, c, off: i / arcs.length };
    });

    const colour = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      dotMat.color.set(dark ? '#ffffff' : '#111111');
      const a = css('--accent');
      lineMat.color.set(a);
      markMat.color.set(a);
      packetMat.color.set(dark ? '#ffffff' : '#000000');
    };
    colour();
    new MutationObserver(() => { colour(); frame(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const size = () => {
      const w = intro.clientWidth, h = intro.clientHeight;
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Wide screens: globe sits right of centre, behind the portrait. Narrow: centred, behind the text.
      const wide = w > 820;
      camera.setViewOffset(w, h, wide ? -w * 0.24 : 0, 0, w, h);
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(size).observe(intro);
    size();

    let tx = 0, ty = 0;
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 0.4;
      ty = (e.clientY / innerHeight - 0.5) * 0.25;
    }, { passive: true });

    let rot = 3.6; // starts with India facing the viewer
    let last = 0;
    function frame(t) {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!calm.matches) rot += dt * 0.12;
      globe.rotation.y = rot + tx;
      globe.rotation.x = 0.35 + ty;
      packets.forEach((p) => p.m.position.copy(p.c.getPoint(calm.matches ? 0.5 : ((t / 3500 + p.off) % 1))));
      renderer.render(scene, camera);
    }

    let visible = true;
    let raf = 0;
    const loop = (t) => { frame(t); raf = visible && !document.hidden && !calm.matches ? requestAnimationFrame(loop) : 0; };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(intro);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });
    frame(performance.now());
    if (!calm.matches) raf = requestAnimationFrame(loop);
  }
}
