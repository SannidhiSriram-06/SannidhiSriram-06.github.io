/* ==========================================================================
   HERO WORLD — live WebGL infrastructure constellation behind the hero.
   Technique borrowed from ThreeUI's SylvaHero (canvas fixed behind the hero,
   local three.min.js, rAF loop, pointer-parallax group) and KoiStudies
   (damped pointer tilt, reduced-motion / visibility / in-view gating).
   Original scene + content. Vanilla — no framework, no bundler.
   Exposes window.heroWorld = { setTheme(), refresh(), destroy() }.
   ========================================================================== */

(() => {
  'use strict';

  const canvas = document.getElementById('hero-gl');
  if (!canvas || typeof THREE === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ── palette from CSS custom properties (theme-aware) ─────── */
  const css = getComputedStyle(document.documentElement);
  const readColor = (name, fallback) => {
    const v = css.getPropertyValue(name).trim();
    try { return new THREE.Color(v || fallback); } catch (e) { return new THREE.Color(fallback); }
  };
  const palette = {
    bg: readColor('--bg', '#0d1117'),
    accent: readColor('--accent', '#38bdf8'),
    edge: readColor('--cat-edge', '#f0883e'),
    compute: readColor('--cat-compute', '#7c8cf8'),
    telemetry: readColor('--cat-telemetry', '#3fb950'),
  };
  const catColors = [palette.edge, palette.telemetry, palette.telemetry, palette.compute, palette.compute, palette.edge];

  /* ── renderer / scene / camera ───────────────────────────── */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // no WebGL — the CSS grid background stays
  }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(palette.bg.getHex(), 0.055);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
  camera.position.set(0, 0, 16);

  const world = new THREE.Group();
  scene.add(world);

  /* ── soft round sprite texture for glow points ───────────── */
  const sprite = (() => {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  })();

  /* ── primary nodes — the six pipeline services (the map) ──── */
  // Biased toward the right half / edges so nodes rarely sit over the headline.
  const NODE_DATA = [
    { pos: [-9.4, 4.2, -2.4], target: 'proj-1', cat: 'edge', name: 'AWS Client VPN & SSM', spec: 'mTLS VPN · SSM shell · Logs Insights · AWS Backup PITR' },
    { pos: [-7.8, -4.6, -1.0], target: 'proj-2', cat: 'telemetry', name: 'ECS Fargate Prometheus', spec: 'Prometheus :9090 → Grafana :3000 · alert rate > 0.5' },
    { pos: [1.6, 5.0, -3.0], target: 'proj-3', cat: 'telemetry', name: 'Jenkins & ArgoCD Helm', spec: '70% coverage gate · ECR SHA tags · ArgoCD → Minikube' },
    { pos: [5.2, -4.4, 0.4], target: 'proj-4', cat: 'compute', name: 'AWS ALB & Auto Scaling', spec: '/actuator/health · ASG 2–4 · CPU target 80%' },
    { pos: [9.6, 3.4, -1.6], target: 'proj-5', cat: 'compute', name: 'Azure App Service & OpenAI', spec: 'Linux B1 · GPT-4o triage-model · Table Storage audit' },
    { pos: [11.0, -2.2, 1.0], target: 'proj-6', cat: 'edge', name: 'AWS Lambda & API Gateway', spec: 'API GW REST → Lambda Node 20 · MongoDB Atlas M0 · $0/mo' },
  ];
  const CAT_INDEX = { edge: 0, telemetry: 1, compute: 3 }; // maps into catColors
  const nodeMeshes = [];
  const nodes = NODE_DATA.map((d, i) => {
    const color = catColors[i];
    const geo = new THREE.IcosahedronGeometry(0.28, 1);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(d.pos[0], d.pos[1], d.pos[2]);
    mesh.userData.index = i;
    world.add(mesh);
    nodeMeshes.push(mesh);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sprite, color, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    halo.scale.setScalar(1.9);
    mesh.add(halo);
    return { mesh, halo, base: mesh.position.clone(), phase: Math.random() * Math.PI * 2, data: d };
  });

  /* ── ambient field — hundreds of faint infra points ──────── */
  const AMBIENT = 280;
  const ambientGeo = new THREE.BufferGeometry();
  const ambientPos = new Float32Array(AMBIENT * 3);
  for (let i = 0; i < AMBIENT; i++) {
    ambientPos[i * 3] = (Math.random() - 0.5) * 30;
    ambientPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 22 - 4;
  }
  ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
  const ambient = new THREE.Points(ambientGeo, new THREE.PointsMaterial({
    map: sprite, color: palette.accent, size: 0.13, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  world.add(ambient);

  /* ── edges — data-flow links between consecutive nodes ───── */
  const edgePairs = [];
  for (let i = 0; i < nodes.length - 1; i++) edgePairs.push([i, i + 1]);
  edgePairs.push([0, 2], [1, 3], [3, 5]);
  const edgePos = new Float32Array(edgePairs.length * 6);
  edgePairs.forEach((pair, e) => {
    const a = nodes[pair[0]].base, b = nodes[pair[1]].base;
    edgePos.set([a.x, a.y, a.z, b.x, b.y, b.z], e * 6);
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
    color: palette.accent, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  world.add(edges);

  /* ── packets — bright motes travelling the edges ─────────── */
  const PACKETS = 14;
  const packetGeo = new THREE.BufferGeometry();
  const packetPos = new Float32Array(PACKETS * 3);
  packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPos, 3));
  const packets = new THREE.Points(packetGeo, new THREE.PointsMaterial({
    map: sprite, color: palette.accent, size: 0.34, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  world.add(packets);
  const packetState = Array.from({ length: PACKETS }, () => ({
    edge: (Math.random() * edgePairs.length) | 0,
    t: Math.random(),
    speed: 0.12 + Math.random() * 0.3,
  }));

  /* ── interaction state ───────────────────────────────────── */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  let scrollProgress = 0;   // 0 at hero top → 1 further down (set by script.js)
  let revealT = 0;          // 0→1 one-shot entry reveal
  let running = false;
  let rafId = 0;
  let inView = true;
  let lastTime = performance.now();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoverIndex = -1;
  let selectCb = null;
  let hoverCb = null;

  const pickNode = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    raycaster.params.Points = { threshold: 0 };
    const hits = raycaster.intersectObjects(nodeMeshes, false);
    return hits.length ? hits[0].object.userData.index : -1;
  };

  const onPointerMove = (e) => {
    if (!finePointer.matches) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const tx = (e.clientX / w - 0.5) * 2;
    const ty = (e.clientY / h - 0.5) * 2;
    if (Number.isFinite(tx)) pointer.tx = Math.max(-1.5, Math.min(1.5, tx));
    if (Number.isFinite(ty)) pointer.ty = Math.max(-1.5, Math.min(1.5, ty));

    // node hover — only while the hero band is on screen
    if (!inView) return;
    const overInteractive = e.target && e.target.closest &&
      e.target.closest('a, button, input, textarea, label, .hero-portrait');
    const hit = overInteractive ? -1 : pickNode(e.clientX, e.clientY);
    if (hit !== hoverIndex) {
      hoverIndex = hit;
      document.body.style.cursor = hit >= 0 ? 'pointer' : '';
      hoverCb?.(hit >= 0 ? nodes[hit].data : null);
      if (!running) renderFrame(0, false);
    }
  };

  const onClick = (e) => {
    if (!inView || e.button) return;
    if (e.target && e.target.closest && e.target.closest('a, button, input, textarea, label, .hero-portrait')) return;
    const hit = pickNode(e.clientX, e.clientY);
    if (hit >= 0) selectCb?.(nodes[hit].data);
  };

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  const setPacketPosition = (i) => {
    const s = packetState[i];
    const pair = edgePairs[s.edge];
    const a = nodes[pair[0]].base, b = nodes[pair[1]].base;
    packetPos[i * 3] = a.x + (b.x - a.x) * s.t;
    packetPos[i * 3 + 1] = a.y + (b.y - a.y) * s.t;
    packetPos[i * 3 + 2] = a.z + (b.z - a.z) * s.t;
  };

  const renderFrame = (dt, animate) => {
    const time = performance.now() * 0.001;

    // damped pointer parallax on the whole world
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    if (!Number.isFinite(pointer.x)) { pointer.x = 0; pointer.tx = 0; }
    if (!Number.isFinite(pointer.y)) { pointer.y = 0; pointer.ty = 0; }
    // entry reveal — the world scales up once on first paint
    revealT = Math.min(1, revealT + (animate ? dt * 0.9 : 1));
    const reveal = revealT * revealT * (3 - 2 * revealT);

    const sp = scrollProgress;
    world.rotation.y = pointer.x * 0.28 + (animate ? time * 0.04 : 0.3) + sp * 0.5;
    world.rotation.x = pointer.y * 0.16 + sp * 0.12;

    // scroll scene — camera flies toward the cloud, then pulls back and away
    const dolly = sp < 0.5 ? sp * 2 : 1;          // 0→1 over first half
    const recede = sp < 0.5 ? 0 : (sp - 0.5) * 2; // 0→1 over second half
    camera.position.z = 16 - dolly * 9 + recede * 15;
    camera.position.y = -recede * 4.5;
    camera.position.x = Math.sin(sp * Math.PI) * 2.2;
    world.position.y = recede * 2.6;
    world.scale.setScalar(0.6 + reveal * 0.4);

    // hover + scroll-sweep node emphasis (runs even when the loop is paused)
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const hot = i === hoverIndex;
      // each node lights as the scroll sweep passes it, left → right
      const lit = clamp01((sp * 1.35) - (i / nodes.length) * 0.85) * (1 - recede);
      n.lit = lit;
      const wob = animate ? Math.sin(time * 1.4 + n.phase) * 0.06 : 0;
      n.mesh.scale.setScalar(((hot ? 1.5 : 1) + wob + lit * 0.5) * reveal);
      n.mesh.material.opacity = (0.5 + lit * 0.42) * reveal;
      n.halo.material.opacity = ((hot ? 0.68 : 0.24) + lit * 0.4 + (animate ? Math.sin(time * 1.4 + n.phase) * 0.12 : 0.04)) * reveal;
      n.halo.scale.setScalar((hot ? 2.7 : 1.9) + lit * 1.4);
    }

    // packets speed up with scroll (data flowing through the pipeline)
    const flow = 1 + sp * 2.2;
    ambient.material.opacity = (0.5 - recede * 0.4) * reveal;
    edges.material.opacity = (0.22 + dolly * 0.16 - recede * 0.2) * reveal;
    packets.material.opacity = (0.9 - recede * 0.7) * reveal;

    if (animate) {
      for (const n of nodes) n.mesh.rotation.y += dt * 0.4;
      ambient.rotation.y = time * 0.015;
      for (let i = 0; i < PACKETS; i++) {
        const s = packetState[i];
        s.t += s.speed * dt * flow;
        if (s.t >= 1) { s.t = 0; s.edge = (Math.random() * edgePairs.length) | 0; }
        setPacketPosition(i);
      }
      packetGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
  };

  const loop = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    renderFrame(dt, true);
    rafId = requestAnimationFrame(loop);
  };

  const shouldRun = () =>
    inView && !document.hidden && !prefersReducedMotion.matches;

  const sync = () => {
    if (shouldRun()) {
      if (!running) {
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    } else if (running) {
      running = false;
      cancelAnimationFrame(rafId);
      rafId = 0;
      renderFrame(0, false); // leave a clean static frame
    }
  };

  /* ── boot ────────────────────────────────────────────────── */
  for (let i = 0; i < PACKETS; i++) setPacketPosition(i);
  packetGeo.attributes.position.needsUpdate = true;
  resize();
  // Only paint a full static frame if the animated loop won't start (hidden
  // tab / reduced motion); otherwise let the loop play the entry reveal.
  if (!shouldRun()) renderFrame(0, false);

  window.addEventListener('resize', () => { resize(); if (!running) renderFrame(0, false); }, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('click', onClick);
  document.addEventListener('visibilitychange', sync);
  prefersReducedMotion.addEventListener?.('change', sync);

  const heroSection = document.getElementById('hero');
  if (heroSection && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      sync();
    }, { rootMargin: '200px' }).observe(heroSection);
  }

  sync();

  /* ── public API for script.js ────────────────────────────── */
  window.heroWorld = {
    setScrollProgress(p) { scrollProgress = Math.max(0, Math.min(1, p)); if (!running) renderFrame(0, false); },
    getNodes() { return nodes.map((n) => ({ ...n.data })); },
    onNodeSelect(cb) { selectCb = cb; },
    onNodeHover(cb) { hoverCb = cb; },
    focusNode(index) {
      hoverIndex = (index >= 0 && index < nodes.length) ? index : -1;
      if (!running) renderFrame(0, false);
    },
    nodeScreenPos(index) {
      const n = nodes[index];
      if (!n) return null;
      const v = n.base.clone().applyMatrix4(world.matrixWorld).project(camera);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
    },
    setTheme() {
      const c = getComputedStyle(document.documentElement);
      const pick = (n, f) => { try { return new THREE.Color(c.getPropertyValue(n).trim() || f); } catch (e) { return new THREE.Color(f); } };
      palette.bg = pick('--bg', '#0d1117');
      palette.accent = pick('--accent', '#38bdf8');
      scene.fog.color = palette.bg;
      [ambient, packets].forEach((o) => o.material.color = palette.accent);
      edges.material.color = palette.accent;
      const cc = [pick('--cat-edge', '#f0883e'), pick('--cat-telemetry', '#3fb950'), pick('--cat-telemetry', '#3fb950'), pick('--cat-compute', '#7c8cf8'), pick('--cat-compute', '#7c8cf8'), pick('--cat-edge', '#f0883e')];
      nodes.forEach((n, i) => { n.mesh.material.color = cc[i]; n.halo.material.color = cc[i]; });
      if (!running) renderFrame(0, false);
    },
    destroy() {
      running = false;
      cancelAnimationFrame(rafId);
      renderer.dispose();
    },
    _debug() {
      return {
        running, inView, hidden: document.hidden,
        reducedMotion: prefersReducedMotion.matches,
        rot: [world.rotation.x.toFixed(3), world.rotation.y.toFixed(3)],
        camZ: camera.position.z.toFixed(2),
        scrollProgress: scrollProgress.toFixed(3),
        draws: renderer.info.render.calls,
      };
    },
  };
})();
