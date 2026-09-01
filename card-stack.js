/* ==========================================================================
   CERTIFICATION CARD-STACK
   Interaction mechanics adapted from ThreeUI's KoiStudies (generic CSS-3D
   card stack: damped pointer tilt, drag-commit threshold, send-to-back /
   bring-to-front, keyboard nav, entry pixel-dissolve + pointer-trail reveal,
   reduced-motion / focus / in-view gating). Content, styling and the
   procedural canvas are original — no bundled assets.
   ========================================================================== */

(() => {
  'use strict';

  const scene = document.querySelector('.cert-stack-scene');
  if (!scene) return;

  const shells = [...scene.querySelectorAll('.cert-shell')];
  if (!shells.length) return;

  const status = scene.querySelector('.cert-stack-status');
  const countEl = scene.querySelector('.cert-stack-count');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ── stack geometry by depth (0 = top) ───────────────────── */
  const STACK_ROT = [0, 2.6, -3.2, 1.8, -2.4, 3.0];
  const STACK_X = [0, -3.4, 4.0, -2.2, 3.0, -1.4];
  const STACK_Y = [0, 3.4, 6.6, 9.2, 11.4, 13.2];
  const STACK_Z = [0, -46, -92, -132, -164, -190];
  const STACK_SCALE_STEP = 0.028;

  const TILE = 14;
  const ENTRY_MS = 900;
  const MAX_TRAIL = 14;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (x, y) => {
    const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };

  /* ── per-card model ──────────────────────────────────────── */
  const cards = shells.map((shell, id) => {
    const dragPlane = shell.querySelector('.cert-drag-plane');
    const cardEl = shell.querySelector('.cert-card');
    const canvas = shell.querySelector('.cert-mask');
    const ctx = canvas.getContext('2d');
    return {
      id, shell, dragPlane, cardEl, canvas, ctx,
      w: canvas.width, h: canvas.height,
      cols: Math.ceil(canvas.width / TILE), rows: Math.ceil(canvas.height / TILE),
      issuer: shell.querySelector('.cert-card-issuer').textContent.trim().toUpperCase(),
      title: shell.querySelector('.cert-card-title').textContent.trim(),
      name: shell.querySelector('.cert-card-title').textContent.trim(),
      entryStart: 0,
      trail: [],
      suppressClickUntil: 0,
    };
  });

  // pre-computed diagonal wipe order per card size (same for all — identical dims)
  const cols = cards[0].cols, rows = cards[0].rows;
  const entryOrder = new Float32Array(cols * rows);
  const edgeNoise = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const hp = c / Math.max(1, cols - 1);
      const vp = r / Math.max(1, rows - 1);
      edgeNoise[i] = hash(c, r) - 0.5;
      entryOrder[i] = clamp(hp * 0.7 + hash(c * 1.7 + 5, r * 2.3 + 9) * 0.26 + Math.abs(vp - 0.5) * 0.06, 0, 1);
    }
  }

  let order = cards.map((_, i) => i).reverse(); // last entry = top
  let activeDrag = null;
  let transitioning = false;
  let rafId = 0;
  let running = false;
  let inView = true;
  let focused = document.hasFocus();

  const topCard = () => cards[order[order.length - 1]];

  /* ── canvas painting ─────────────────────────────────────── */
  const readVar = (name, fb) => {
    const v = getComputedStyle(cards[0].cardEl).getPropertyValue(name).trim();
    return v || fb;
  };

  const paintBase = (card) => {
    const { ctx, w, h } = card;
    const panel = readVar('--card-panel', '#262d3a');
    const tint = getComputedStyle(card.cardEl).getPropertyValue('--card-tint').trim() || '#38bdf8';
    ctx.fillStyle = panel;
    ctx.fillRect(0, 0, w, h);

    // top-down light lift for a brighter, glassier surface
    const lift = ctx.createLinearGradient(0, 0, 0, h);
    lift.addColorStop(0, 'rgba(255,255,255,0.09)');
    lift.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    lift.addColorStop(1, 'rgba(0,0,0,0.06)');
    ctx.fillStyle = lift;
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w * 0.22, h * 0.26, 0, w * 0.22, h * 0.26, w * 0.95);
    g.addColorStop(0, tint + '3d');
    g.addColorStop(1, tint + '00');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // faint issuer wordmark, scaled to sit within the card
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.fillStyle = tint;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let fs = Math.round(h * 0.26);
    ctx.font = `800 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const maxW = w * 0.88;
    const measured = ctx.measureText(card.issuer).width;
    if (measured > maxW) {
      fs = Math.max(24, Math.floor(fs * maxW / measured));
      ctx.font = `800 ${fs}px "Plus Jakarta Sans", system-ui, sans-serif`;
    }
    ctx.fillText(card.issuer, w * 0.055, h * 0.6);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = tint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = TILE; x < w; x += TILE) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
    for (let y = TILE; y < h; y += TILE) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
    ctx.globalAlpha = 0.06;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = tint;
    ctx.globalAlpha = 0.42;
    ctx.font = '600 18px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(`0${card.id + 1} / 06`, w - 22, 20);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  };

  const trailCovers = (card, cx, cy, cell) => {
    for (const p of card.trail) {
      const dx = cx - p.x, dy = cy - p.y;
      const radius = p.radius * (0.34 + p.life * 0.66) + edgeNoise[cell] * 0.03;
      if (Math.sqrt(dx * dx + dy * dy) < radius) return true;
    }
    return false;
  };

  const paintCard = (card, now, isTop) => {
    paintBase(card);
    const panel = readVar('--card-panel', '#262d3a');
    const skip = reducedMotion.matches;
    const revealRaw = skip ? 1 : clamp((now - card.entryStart) / ENTRY_MS, 0, 1);
    const reveal = revealRaw * revealRaw * (3 - 2 * revealRaw);
    if (reveal >= 1 && !card.trail.length) return; // fully revealed, nothing to mask

    card.ctx.save();
    card.ctx.fillStyle = panel;
    for (let r = 0; r < card.rows; r++) {
      for (let c = 0; c < card.cols; c++) {
        const cell = r * card.cols + c;
        const entryHidden = reveal < 1 && entryOrder[cell] > reveal;
        const revealed = isTop && trailCovers(card, (c + 0.5) / card.cols, (r + 0.5) / card.rows, cell);
        if (entryHidden && !revealed) {
          card.ctx.globalAlpha = 1;
          card.ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        } else if (!entryHidden && !revealed && isTop && reveal >= 1 && card.trail.length) {
          // subtle veil that the pointer wipes away once settled
          card.ctx.globalAlpha = 0.5;
          card.ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
      }
    }
    card.ctx.restore();
  };

  /* ── stack layout ────────────────────────────────────────── */
  const setPlane = (card, x = 0, y = 0, tiltX = 0, tiltY = 0, turn = 0) => {
    const s = card.dragPlane.style;
    s.setProperty('--drag-x', `${x.toFixed(2)}px`);
    s.setProperty('--drag-y', `${y.toFixed(2)}px`);
    s.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    s.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    s.setProperty('--drag-turn', `${turn.toFixed(2)}deg`);
  };

  const resetPlane = (card) => {
    setPlane(card);
    card.dragPlane.style.opacity = '';
    card.dragPlane.style.setProperty('--release-blur', '0px');
    card.shell.classList.remove('is-dragging', 'is-tracking', 'is-releasing');
  };

  const updateStack = () => {
    const top = topCard();
    order.forEach((cardIndex, i) => {
      const card = cards[cardIndex];
      const depth = order.length - 1 - i;
      const isTop = card === top;
      const wasTop = card.shell.classList.contains('is-active');
      card.shell.style.zIndex = String(i + 1);
      card.shell.style.pointerEvents = isTop ? 'auto' : 'none';
      card.shell.tabIndex = isTop ? 0 : -1;
      card.shell.setAttribute('aria-hidden', isTop ? 'false' : 'true');
      card.shell.classList.toggle('is-active', isTop);
      card.shell.style.setProperty('--stack-x', `${STACK_X[depth] ?? 0}%`);
      card.shell.style.setProperty('--stack-y', `${STACK_Y[depth] ?? 0}%`);
      card.shell.style.setProperty('--stack-z', `${STACK_Z[depth] ?? -190}px`);
      card.cardEl.style.setProperty('--stack-rotation', `${STACK_ROT[depth] ?? 0}deg`);
      card.cardEl.style.setProperty('--stack-scale', String(1 - depth * STACK_SCALE_STEP));
      if (isTop && !wasTop) card.entryStart = performance.now();
      if (!isTop) resetPlane(card);
    });
    const num = cards.indexOf(top) + 1;
    if (countEl) countEl.textContent = `${num} / 6`;
    if (status) status.textContent = `${top.title} — card ${num} of 6.`;
    syncLoop();
  };

  /* ── render loop (only while it has something to animate) ── */
  const needsFrame = () => {
    const now = performance.now();
    return cards.some((c) => c.trail.length) ||
      (!reducedMotion.matches && now - topCard().entryStart < ENTRY_MS + 40) ||
      !!activeDrag;
  };

  const frame = () => {
    const now = performance.now();
    const top = topCard();
    for (const card of cards) {
      for (let i = card.trail.length - 1; i >= 0; i--) {
        card.trail[i].life -= 0.02;
        if (card.trail[i].life <= 0) card.trail.splice(i, 1);
      }
      paintCard(card, now, card === top);
    }
    if (needsFrame() && running) rafId = requestAnimationFrame(frame);
    else { running = false; rafId = 0; }
  };

  const syncLoop = () => {
    if (!inView || !focused) {
      if (running) { cancelAnimationFrame(rafId); running = false; rafId = 0; }
      const now = performance.now();
      cards.forEach((c) => paintCard(c, now, c === topCard()));
      return;
    }
    if (needsFrame() && !running) {
      running = true;
      rafId = requestAnimationFrame(frame);
    } else if (!running) {
      const now = performance.now();
      cards.forEach((c) => paintCard(c, now, c === topCard()));
    }
  };

  /* ── navigation ──────────────────────────────────────────── */
  const markInteracted = () => { scene.dataset.interacted = 'true'; };

  const sendToBack = (card, vx = 1, vy = 0) => {
    if (transitioning || card !== topCard()) return;
    markInteracted();
    transitioning = true;
    const dur = reducedMotion.matches ? 0 : 190;
    const mag = Math.max(1, Math.hypot(vx, vy));
    const dist = Math.max(200, scene.getBoundingClientRect().width * 0.7);
    card.shell.classList.remove('is-dragging', 'is-tracking');
    card.shell.classList.add('is-releasing');
    setPlane(card, (vx / mag) * dist, (vy / mag) * dist * 0.5, -(vy / mag) * 6, (vx / mag) * 9, (vx / mag) * 10);
    card.dragPlane.style.opacity = dur ? '0' : '';
    card.dragPlane.style.setProperty('--release-blur', dur ? '14px' : '0px');
    const finish = () => {
      const hadFocus = document.activeElement === card.shell;
      order = [card.id, ...order.filter((i) => i !== card.id)];
      card.shell.style.transition = 'none';
      card.dragPlane.style.transition = 'none';
      resetPlane(card);
      updateStack();
      void card.shell.offsetWidth;
      card.shell.style.transition = '';
      card.dragPlane.style.transition = '';
      transitioning = false;
      if (hadFocus) topCard().shell.focus({ preventScroll: true });
    };
    dur ? window.setTimeout(finish, dur) : finish();
  };

  const bringToFront = () => {
    if (transitioning) return;
    markInteracted();
    transitioning = true;
    const incoming = cards[order[0]];
    const outgoingFocused = document.activeElement === topCard().shell;
    const dur = reducedMotion.matches ? 0 : 340;
    const dist = Math.max(200, scene.getBoundingClientRect().width * 0.7);
    incoming.shell.style.transition = 'none';
    incoming.dragPlane.style.transition = 'none';
    setPlane(incoming, -dist, 0, 0, -6, -9);
    incoming.dragPlane.style.opacity = dur ? '0.1' : '';
    order = [...order.slice(1), incoming.id];
    updateStack();
    void incoming.shell.offsetWidth;
    incoming.shell.style.transition = '';
    incoming.dragPlane.style.transition = '';
    const reveal = () => { setPlane(incoming); incoming.dragPlane.style.opacity = ''; };
    const finish = () => { transitioning = false; if (outgoingFocused) incoming.shell.focus({ preventScroll: true }); };
    if (dur) { window.setTimeout(reveal, 16); window.setTimeout(finish, dur); } else { reveal(); finish(); }
  };

  /* ── pointer tilt + drag ─────────────────────────────────── */
  const commitThreshold = () => clamp(scene.getBoundingClientRect().width * 0.16, 46, 96);
  const committedDir = (x, y, t) =>
    (Math.abs(x) >= t && Math.abs(x) >= Math.abs(y) * 0.75) ? Math.sign(x) : 0;

  const onScenePointerMove = (e) => {
    if (!finePointer.matches || reducedMotion.matches || activeDrag || transitioning) return;
    const card = topCard();
    const rect = scene.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < -0.2 || x > 1.2 || y < -0.15 || y > 1.15) {
      card.shell.classList.remove('is-tracking');
      setPlane(card);
      return;
    }
    card.shell.classList.add('is-tracking');
    setPlane(card, 0, 0, clamp((0.5 - y) * 11, -5.5, 5.5), clamp((x - 0.5) * 11, -5.5, 5.5), 0);

    // pointer-trail dissolve over the canvas
    const crect = card.canvas.getBoundingClientRect();
    const nx = (e.clientX - crect.left) / crect.width;
    const ny = (e.clientY - crect.top) / crect.height;
    if (nx > -0.2 && nx < 1.2 && ny > -0.2 && ny < 1.2) {
      card.trail.unshift({ x: nx, y: ny, radius: 0.12, life: 1 });
      if (card.trail.length > MAX_TRAIL) card.trail.length = MAX_TRAIL;
      syncLoop();
    }
  };

  const onPointerDown = (card, e) => {
    if (card !== topCard() || transitioning || (e.button && e.button !== 0)) return;
    activeDrag = { card, id: e.pointerId, sx: e.clientX, sy: e.clientY, latched: 0, traveled: 0 };
    card.shell.classList.remove('is-tracking');
    card.shell.classList.add('is-dragging');
    card.shell.focus({ preventScroll: true });
    try { card.shell.setPointerCapture?.(e.pointerId); } catch { activeDrag = null; return; }
    e.preventDefault();
  };

  const onDragMove = (e) => {
    if (!activeDrag || e.pointerId !== activeDrag.id) return;
    const { card, sx, sy } = activeDrag;
    const x = e.clientX - sx, y = e.clientY - sy;
    const w = Math.max(1, scene.getBoundingClientRect().width);
    activeDrag.traveled = Math.max(activeDrag.traveled, Math.hypot(x, y));
    const dir = committedDir(x, y, commitThreshold());
    if (dir) activeDrag.latched = dir;
    setPlane(card, x, y, clamp(-y / w * 6, -6, 6), clamp(x / w * 7, -7, 7), clamp(x / w * 11, -12, 12));
    markInteracted();
    e.preventDefault();
  };

  const onPointerUp = (e) => {
    if (!activeDrag || e.pointerId !== activeDrag.id) return;
    const { card, sx, sy, latched, traveled } = activeDrag;
    const x = e.clientX - sx, y = e.clientY - sy;
    const t = commitThreshold();
    const dir = committedDir(x, y, t) || latched;
    const isTap = traveled <= 3;
    activeDrag = null;
    try { card.shell.releasePointerCapture?.(e.pointerId); } catch {}
    card.shell.classList.remove('is-dragging');
    card.suppressClickUntil = performance.now() + 340;
    if (dir < 0) sendToBack(card, -1, 0);
    else if (dir > 0) bringToFront();
    else if (isTap) sendToBack(card, x || 1, y);
    else setPlane(card);
  };

  const onKeyDown = (e) => {
    if (!inView) return;
    const tag = e.target?.tagName;
    if (e.target?.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); sendToBack(topCard(), 1, 0); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); bringToFront(); }
  };

  /* ── wiring ──────────────────────────────────────────────── */
  cards.forEach((card) => {
    card.shell.addEventListener('pointerdown', (e) => onPointerDown(card, e));
    card.shell.addEventListener('click', () => {
      if (performance.now() >= card.suppressClickUntil && card === topCard()) sendToBack(card, 1, 0);
    });
    card.shell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sendToBack(card, 1, 0); }
    });
    paintBase(card);
  });

  window.addEventListener('pointermove', (e) => {
    if (activeDrag) onDragMove(e);
    else onScenePointerMove(e);
  }, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', () => {
    if (activeDrag) { activeDrag.card.shell.classList.remove('is-dragging'); setPlane(activeDrag.card); activeDrag = null; }
  });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('blur', () => { focused = false; syncLoop(); });
  window.addEventListener('focus', () => { focused = true; syncLoop(); });
  document.addEventListener('visibilitychange', () => { focused = !document.hidden; syncLoop(); });
  window.addEventListener('mouseout', (e) => {
    if (!e.relatedTarget && !activeDrag) { topCard().shell.classList.remove('is-tracking'); setPlane(topCard()); }
  });
  reducedMotion.addEventListener?.('change', () => { updateStack(); syncLoop(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      inView = entries[0]?.isIntersecting ?? true;
      syncLoop();
    }, { rootMargin: '120px' }).observe(scene);
  }

  scene.classList.add('reveal-enabled');
  updateStack();
  topCard().entryStart = performance.now();
  syncLoop();
})();
