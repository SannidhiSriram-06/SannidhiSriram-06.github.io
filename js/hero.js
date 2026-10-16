/* A small spinning globe beside the Contact heading: dots, arcs between Hyderabad, us-east-1 and ap-south-1, and packets crossing them.
   Decorative only. Does nothing without WebGL, and holds a still frame with reduced motion. */
import * as THREE from '../assets/vendor/three.module.min.js';

const canvas = document.getElementById('globe-canvas');
const calm = matchMedia('(prefers-reduced-motion: reduce)');

const ll = (lat, lon, r = 1) => {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
};

if (canvas) {
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) { /* no WebGL: the heading simply has no globe beside it */ }

  if (renderer) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0, 4.6);
    const globe = new THREE.Group();
    scene.add(globe);

    // Dots on a sphere (Fibonacci spiral). Dot size is set in size(), so small globes get fatter dots.
    const N = 1500;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * Math.PI * (3 - Math.sqrt(5));
      pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3);
    }
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dotMat = new THREE.PointsMaterial({ size: 0.065, transparent: true, opacity: 0.8 });
    globe.add(new THREE.Points(dotGeo, dotMat));

    const places = { hyd: ll(17.39, 78.49, 1.02), iad: ll(38.9, -77.4, 1.02), bom: ll(19.08, 72.88, 1.02) };
    const markMat = new THREE.MeshBasicMaterial();
    Object.values(places).forEach((p) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), markMat);
      m.position.copy(p);
      globe.add(m);
    });
    const arcOf = (a, b, lift) => {
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.02 + lift);
      return new THREE.QuadraticBezierCurve3(a, mid, b);
    };
    const arcs = [arcOf(places.hyd, places.iad, 0.35), arcOf(places.iad, places.bom, 0.35), arcOf(places.bom, places.hyd, 0.06)];
    const lineMat = new THREE.LineBasicMaterial({ transparent: true });
    arcs.forEach((c) => globe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(50)), lineMat)));
    const packetMat = new THREE.MeshBasicMaterial();
    const packets = arcs.map((c, i) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), packetMat);
      globe.add(m);
      return { m, c, off: i / arcs.length };
    });

    const colour = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      dotMat.color.set(dark ? '#ffffff' : '#111111');
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      lineMat.color.set(accent);
      markMat.color.set(accent);
      packetMat.color.set(dark ? '#ffffff' : '#000000');
    };
    colour();
    new MutationObserver(() => { colour(); frame(performance.now()); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const size = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio || 1, 2), 3));
      renderer.setSize(w, h, false);
      dotMat.size = Math.max(0.03, (0.065 * 100) / w);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      frame(performance.now());
    };
    new ResizeObserver(size).observe(canvas);

    const tx = 0, ty = 0;

    let rot = 3.6; // starts with India facing the viewer
    let last = 0;
    function frame(t) {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!calm.matches) rot += dt * 0.25;
      globe.rotation.y = rot + tx;
      globe.rotation.x = 0.35 + ty;
      packets.forEach((p) => p.m.position.copy(p.c.getPoint(calm.matches ? 0.5 : (t / 2500 + p.off) % 1)));
      renderer.render(scene, camera);
    }

    let visible = true;
    let raf = 0;
    const loop = (t) => { frame(t); raf = visible && !document.hidden && !calm.matches ? requestAnimationFrame(loop) : 0; };
    new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }).observe(canvas);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(loop); });
    size();
    if (!calm.matches) raf = requestAnimationFrame(loop);
  }
}
