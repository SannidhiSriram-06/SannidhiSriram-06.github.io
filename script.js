/* ==========================================================================
   RHEL ENTERPRISE & MACOS SONOMA HYBRID DECK CONTROLLER
   with Faceted WebGL Prism Sweep Transitions (Zero Purple / AI-slop)
   - Faceted WebGL Caustic Prism Wavefront Shader Controller
   - Midpoint DOM Slide Swap under Refractive Crest (50% progress)
   - Sliding macOS Segmented Dock Indicator Pill
   - Keyboard Navigation (←, →, Space, 1-7, M, T)
   - Mobile Touch Swiping (Horizontal Gesture Detection)
   - Dual-Mode Switcher: Deck Mode vs Scroll Mode
   - Interactive Docker Workbench Tab Switching
   - Theme Toggle (Dark / Light)
   - Formspree AJAX Submission
   ========================================================================== */

/* ── WEBGL FACETED PRISM SWEEP CONTROLLER ── */
class PrismSweepController {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.uniforms = {};
    this.isAnimating = false;
    this.animFrameId = null;
    this.supported = false;

    this.initWebGL();
  }

  initWebGL() {
    try {
      this.gl = this.canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false
      }) || this.canvas.getContext('experimental-webgl');

      if (!this.gl) {
        console.warn('[PrismSweep] WebGL not supported, graceful fallback active.');
        return;
      }

      const gl = this.gl;

      const vsSource = `
        attribute vec2 aPos;
        varying vec2 vUv;
        void main() {
          vUv = (aPos + 1.0) * 0.5;
          gl_Position = vec4(aPos, 0.0, 1.0);
        }
      `;

      const fsSource = `
        precision mediump float;
        varying vec2 vUv;
        uniform float uProgress;
        uniform float uDirection;
        uniform vec2 uResolution;
        uniform float uTime;

        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return fract(sin(p) * 43758.5453123);
        }

        float voronoiFacet(vec2 p, out vec2 cellCenter) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              vec2 r = g + o - f;
              float d = dot(r, r);
              if (d < md) {
                md = d;
                cellCenter = n + g;
              }
            }
          }
          return sqrt(md);
        }

        void main() {
          vec2 uv = vUv;
          float aspect = uResolution.x / max(uResolution.y, 1.0);

          // Crystalline faceted lattice with terminal scanline alignment
          vec2 facetCoord = vec2(uv.x * aspect * 7.0 - uv.y * 2.5, uv.y * 6.5 + uv.x * aspect * 1.5);
          vec2 cellCenter;
          float facetDist = voronoiFacet(facetCoord, cellCenter);
          float facetEdge = smoothstep(0.05, 0.22, facetDist);
          float facetNoise = sin(cellCenter.x * 4.2 + cellCenter.y * 3.1 + uTime * 1.5) * 0.5 + 0.5;

          // Smooth wavefront crest motion across viewport
          // Sweeps smoothly from off-screen left to off-screen right (or reverse)
          float crestX = (uDirection > 0.0) 
            ? mix(-0.4, 1.4, uProgress) 
            : mix(1.4, -0.4, uProgress);

          // Chromatic dispersion offsets aligned with RHEL Crimson & macOS Sonoma Blue
          float offsetR = -0.09 * uDirection;
          float offsetG = 0.0;
          float offsetB = 0.09 * uDirection;

          float distR = abs(uv.x - (crestX + offsetR) + (facetNoise - 0.5) * 0.07);
          float distG = abs(uv.x - (crestX + offsetG) + (facetNoise - 0.5) * 0.08);
          float distB = abs(uv.x - (crestX + offsetB) + (facetNoise - 0.5) * 0.07);

          float bandDist = abs(uv.x - crestX + (facetNoise - 0.5) * 0.08);
          float crestEnvelope = smoothstep(0.55, 0.0, bandDist);

          float bandR = smoothstep(0.32, 0.0, distR);
          float bandG = smoothstep(0.28, 0.0, distG);
          float bandB = smoothstep(0.32, 0.0, distB);

          // Faceted caustic refraction intensity (soft, luminous)
          float caustic = pow(1.0 - facetDist, 2.2) * 1.2;
          float facetSparkle = pow(facetNoise, 3.5) * 0.9;

          // BRAND PALETTE: Carbon obsidian base, RHEL Crimson, macOS Sonoma Blue, Terminal Mint, Warm Amber
          vec3 colCarbon = vec3(0.063, 0.063, 0.071);   // #101012 Obsidian Carbon
          vec3 colRed    = vec3(0.933, 0.0, 0.0);       // #ee0000 RHEL Red Hat Crimson
          vec3 colBlue   = vec3(0.161, 0.592, 1.0);     // #2997ff macOS Sonoma Blue
          vec3 colGreen  = vec3(0.188, 0.820, 0.345);   // #30d158 Terminal Mint
          vec3 colAmber  = vec3(1.0, 0.624, 0.039);     // #ff9f0a Warm Amber

          // Mutual exclusion to preserve crisp identity without purple artifacts
          float rbRatio = bandR / (bandR + bandB + 0.0001);
          float redWeight   = smoothstep(0.44, 0.62, rbRatio) * bandR;
          float blueWeight  = smoothstep(0.56, 0.38, rbRatio) * bandB;
          float greenWeight = bandG * 0.45;
          float amberWeight = bandR * 0.35 * facetNoise;

          vec3 color = colCarbon;
          color += colRed * (redWeight * 1.35 + caustic * bandR * 0.5);
          color += colBlue * (blueWeight * 1.25 + caustic * bandB * 0.5);
          color += colGreen * (greenWeight * 0.9 + caustic * bandG * 0.3);
          color += colAmber * (amberWeight * 0.8);

          // Subtle crystalline edge highlight tinted with theme blue/red (no harsh white flash)
          float edgeGlance = (1.0 - facetEdge) * crestEnvelope * 0.7;
          vec3 sheenColor = mix(colBlue, colRed, smoothstep(0.4, 0.6, uv.x));
          color += mix(sheenColor, vec3(0.92, 0.95, 1.0), 0.4) * (edgeGlance + facetSparkle * crestEnvelope * 0.4);

          // Smooth bell-curve alpha envelope for transition cover & reveal
          float progressEnvelope = sin(uProgress * 3.14159265);
          float coreDense = smoothstep(0.24, 0.0, bandDist);
          float alpha = (crestEnvelope * 0.7 + coreDense * 0.3) * progressEnvelope * 1.4;
          alpha = clamp(alpha, 0.0, 0.96);

          gl_FragColor = vec4(color, alpha);
        }
      `;

      const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);

      if (!vs || !fs) {
        this.supported = false;
        return;
      }

      this.program = gl.createProgram();
      gl.attachShader(this.program, vs);
      gl.attachShader(this.program, fs);
      gl.linkProgram(this.program);

      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
        console.warn('[PrismSweep] Shader program link failed:', gl.getProgramInfoLog(this.program));
        this.supported = false;
        return;
      }

      gl.useProgram(this.program);

      this.uniforms = {
        uProgress: gl.getUniformLocation(this.program, 'uProgress'),
        uDirection: gl.getUniformLocation(this.program, 'uDirection'),
        uResolution: gl.getUniformLocation(this.program, 'uResolution'),
        uTime: gl.getUniformLocation(this.program, 'uTime')
      };

      const posAttr = gl.getAttribLocation(this.program, 'aPos');
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(posAttr);
      gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

      this.supported = true;
      this.resize();
      window.addEventListener('resize', () => this.resize());
    } catch (err) {
      console.warn('[PrismSweep] WebGL initialization failed:', err);
      this.supported = false;
    }
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[PrismSweep] Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  resize() {
    if (!this.supported || !this.gl || !this.canvas) return;
    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  sweep({ direction = 'forward', duration = 800, onMidpoint, onComplete }) {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!this.supported || prefersReducedMotion) {
      if (typeof onMidpoint === 'function') onMidpoint();
      if (typeof onComplete === 'function') onComplete();
      return;
    }

    if (this.isAnimating) {
      cancelAnimationFrame(this.animFrameId);
    }

    this.isAnimating = true;
    this.resize();
    this.canvas.classList.add('is-active');

    const gl = this.gl;
    const startTime = performance.now();
    const dirVal = direction === 'backward' ? -1.0 : 1.0;
    let midpointTriggered = false;

    gl.useProgram(this.program);
    gl.uniform1f(this.uniforms.uDirection, dirVal);
    gl.uniform2f(this.uniforms.uResolution, this.canvas.width, this.canvas.height);

    const frame = (now) => {
      const elapsed = now - startTime;
      const linearT = Math.min(elapsed / duration, 1.0);

      // Smooth cosine easing curve for natural, elegant motion (no harsh flash or snap)
      const easedT = 0.5 * (1.0 - Math.cos(linearT * Math.PI));

      // Swaps the new content at the shader midpoint under the crest
      if (linearT >= 0.5 && !midpointTriggered) {
        midpointTriggered = true;
        if (typeof onMidpoint === 'function') {
          onMidpoint();
        }
      }

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(this.program);
      gl.uniform1f(this.uniforms.uProgress, easedT);
      gl.uniform1f(this.uniforms.uTime, (now * 0.001) % 100.0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (linearT < 1.0) {
        this.animFrameId = requestAnimationFrame(frame);
      } else {
        // Complete sweep
        this.canvas.classList.remove('is-active');
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.isAnimating = false;
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    };

    this.animFrameId = requestAnimationFrame(frame);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  /* ── 1. DOM REFERENCES ── */
  const slides = Array.from(document.querySelectorAll('.deck-slide'));
  const tmuxTabs = Array.from(document.querySelectorAll('.tmux-tab'));
  const dockPill = document.getElementById('dock-segmented-pill');
  const btnPrev = document.getElementById('btn-prev-slide');
  const btnNext = document.getElementById('btn-next-slide');
  const crumbCurrent = document.getElementById('crumb-current');
  const crumbTotal = document.getElementById('crumb-total');
  const crumbName = document.getElementById('crumb-name');
  const modeToggleBtn = document.getElementById('mode-toggle');
  const modeToggleText = document.getElementById('mode-toggle-text');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const viewport = document.getElementById('deck-viewport');
  const projectTabs = document.querySelectorAll('#project-tabs .docker-row');
  const projectPanels = document.querySelectorAll('.case-detail-panel');
  const contactForm = document.getElementById('contact-form');
  const formFeedback = document.getElementById('form-feedback');
  const formSubmitBtn = document.getElementById('form-submit-btn');
  const prismCanvas = document.getElementById('prism-sweep-canvas');

  let currentSlide = 1;
  const totalSlides = slides.length;
  if (crumbTotal) crumbTotal.textContent = String(totalSlides).padStart(2, '0');

  let isTransitioning = false;
  let prismController = null;
  if (prismCanvas) {
    prismController = new PrismSweepController(prismCanvas);
  }

  /* ── 2. MACOS SLIDING SEGMENTED DOCK PILL ── */
  function updateDockPill(activeTab) {
    if (!dockPill || !activeTab) return;
    const parent = activeTab.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    const offsetLeft = tabRect.left - parentRect.left;
    dockPill.style.transform = `translate3d(${offsetLeft}px, 0, 0)`;
    dockPill.style.width = `${tabRect.width}px`;
  }

  window.addEventListener('resize', () => {
    const activeTab = document.querySelector('.tmux-tab.is-active');
    if (activeTab) updateDockPill(activeTab);
  });

  /* ── 3. VIEW MODE MANAGEMENT (Deck vs Scroll) ── */
  let currentMode = localStorage.getItem('sriram_view_mode') || 'deck';

  function applyMode(mode) {
    currentMode = mode;
    document.documentElement.setAttribute('data-view', mode);
    document.body.classList.remove('mode-deck', 'mode-scroll');
    document.body.classList.add(`mode-${mode}`);
    localStorage.setItem('sriram_view_mode', mode);

    if (modeToggleText) {
      modeToggleText.textContent = mode === 'deck' ? 'Deck View' : 'Scroll View';
    }

    if (mode === 'deck') {
      goToSlide(currentSlide, false);
    } else {
      const targetEl = document.getElementById(`slide-${currentSlide}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      applyMode(currentMode === 'deck' ? 'scroll' : 'deck');
    });
  }

  /* ── 4. SLIDE NAVIGATION WITH WEBGL PRISM SWEEP ── */
  function updateSlideUI(index) {
    currentSlide = index;

    // Tmux dock active tab & sliding segmented pill
    tmuxTabs.forEach((tab) => {
      const target = parseInt(tab.getAttribute('data-go'), 10);
      if (target === currentSlide) {
        tab.classList.add('is-active');
        updateDockPill(tab);
      } else {
        tab.classList.remove('is-active');
      }
    });

    // Update Breadcrumbs
    const currentSlideEl = document.getElementById(`slide-${currentSlide}`);
    if (currentSlideEl) {
      const title = currentSlideEl.getAttribute('data-slide-title') || '';
      if (crumbCurrent) crumbCurrent.textContent = String(currentSlide).padStart(2, '0');
      if (crumbName) crumbName.textContent = title;
    }

    // Update Prev / Next button states
    if (btnPrev) {
      btnPrev.disabled = currentSlide === 1;
      btnPrev.style.opacity = currentSlide === 1 ? '0.45' : '1';
      btnPrev.style.pointerEvents = currentSlide === 1 ? 'none' : 'auto';
    }
    if (btnNext) {
      if (currentSlide === totalSlides) {
        btnNext.innerHTML = `<span class="nav-label">RESTART</span><span class="nav-arrow">↺</span>`;
      } else {
        btnNext.innerHTML = `<span class="nav-label">NEXT</span><span class="nav-arrow">►</span>`;
      }
    }

    // Trigger stat counters if navigating to slide 1
    if (currentSlide === 1) {
      animateCounters();
    }
  }

  function goToSlide(index, smooth = true) {
    if (index < 1) index = 1;
    if (index > totalSlides) index = totalSlides;

    const prevIndex = currentSlide;
    const direction = index >= prevIndex ? 'forward' : 'backward';

    // Deck mode with WebGL Prism Sweep Transition
    if (currentMode === 'deck' && smooth && prevIndex !== index && prismController && prismController.supported) {
      isTransitioning = true;

      prismController.sweep({
        direction,
        duration: 800,
        onMidpoint: () => {
          slides.forEach((s) => {
            const sIdx = parseInt(s.getAttribute('data-slide-index'), 10);
            if (sIdx === index) {
              s.classList.add('is-active');
              s.scrollTop = 0;
            } else {
              s.classList.remove('is-active');
            }
          });
          updateSlideUI(index);
        },
        onComplete: () => {
          isTransitioning = false;
        }
      });
      return;
    }

    // Direct jump / fallback / scroll mode
    slides.forEach((slide) => {
      const idx = parseInt(slide.getAttribute('data-slide-index'), 10);
      if (idx === index) {
        slide.classList.add('is-active');
        slide.scrollTop = 0;
      } else {
        slide.classList.remove('is-active');
      }
    });

    updateSlideUI(index);

    if (currentMode === 'scroll') {
      const target = document.getElementById(`slide-${index}`);
      if (target) {
        target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
      }
    }
  }

  function nextSlide() {
    if (isTransitioning) return;
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    } else {
      goToSlide(1);
    }
  }

  function prevSlide() {
    if (isTransitioning) return;
    if (currentSlide > 1) {
      goToSlide(currentSlide - 1);
    }
  }

  // Expose to window
  window.deckNav = {
    goTo: goToSlide,
    next: nextSlide,
    prev: prevSlide,
  };

  if (btnPrev) btnPrev.addEventListener('click', prevSlide);
  if (btnNext) btnNext.addEventListener('click', nextSlide);

  // Tmux Tabs Click
  tmuxTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = parseInt(tab.getAttribute('data-go'), 10);
      if (target && !isTransitioning) goToSlide(target);
    });
  });

  /* ── 5. KEYBOARD SHORTCUTS ── */
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      return;
    }

    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        e.preventDefault();
        nextSlide();
        break;

      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prevSlide();
        break;

      case ' ':
        e.preventDefault();
        nextSlide();
        break;

      case 'Home':
        e.preventDefault();
        goToSlide(1);
        break;

      case 'End':
        e.preventDefault();
        goToSlide(totalSlides);
        break;

      case 'm':
      case 'M':
        e.preventDefault();
        applyMode(currentMode === 'deck' ? 'scroll' : 'deck');
        break;

      case 't':
      case 'T':
        e.preventDefault();
        toggleTheme();
        break;

      default:
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= totalSlides) {
          e.preventDefault();
          goToSlide(num);
        }
        break;
    }
  });

  /* ── 6. MOBILE TOUCH SWIPING ── */
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
  }, { passive: true });

  function handleSwipe() {
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const minSwipeDistance = 45;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX < 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }

  /* ── 7. SCROLL OBSERVER IN SCROLL MODE ── */
  if ('IntersectionObserver' in window) {
    const scrollObserver = new IntersectionObserver((entries) => {
      if (currentMode !== 'scroll') return;
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute('data-slide-index'), 10);
          if (idx) {
            currentSlide = idx;
            if (crumbCurrent) crumbCurrent.textContent = String(idx).padStart(2, '0');
            const title = entry.target.getAttribute('data-slide-title') || '';
            if (crumbName) crumbName.textContent = title;

            tmuxTabs.forEach((tab) => {
              const target = parseInt(tab.getAttribute('data-go'), 10);
              if (target === idx) {
                tab.classList.add('is-active');
                updateDockPill(tab);
              } else {
                tab.classList.remove('is-active');
              }
            });
          }
        }
      });
    }, { threshold: 0.35 });

    slides.forEach((slide) => scrollObserver.observe(slide));
  }

  /* ── 8. PROJECT WORKBENCH TAB SWITCHER (Slide 3) ── */
  projectTabs.forEach((row) => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');

      projectTabs.forEach((r) => {
        r.classList.remove('is-selected');
        r.setAttribute('aria-selected', 'false');
      });
      row.classList.add('is-selected');
      row.setAttribute('aria-selected', 'true');

      projectPanels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.classList.add('is-active');
        } else {
          panel.classList.remove('is-active');
        }
      });
    });
  });

  /* ── 9. THEME TOGGLE ── */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sriram_theme', nextTheme);
    setTimeout(() => {
      const activeTab = document.querySelector('.tmux-tab.is-active');
      if (activeTab) updateDockPill(activeTab);
    }, 50);
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }

  /* ── 10. STAT COUNTER TICK ANIMATION (Slide 1) ── */
  let countersAnimated = false;
  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    const counters = document.querySelectorAll('.metric-num[data-target]');
    counters.forEach((el) => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;

      const duration = 1200;
      const startTime = performance.now();

      function updateCounter(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(easeOut * target);
        el.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          el.textContent = target;
        }
      }

      requestAnimationFrame(updateCounter);
    });
  }

  /* ── 11. FORMSPREE AJAX SUBMISSION (Slide 7) ── */
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);

      if (formSubmitBtn) {
        formSubmitBtn.disabled = true;
        formSubmitBtn.innerHTML = `<span>DISPATCHING TRANSMISSION...</span>`;
      }

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          contactForm.reset();
          if (formFeedback) {
            formFeedback.className = 'form-feedback success';
            formFeedback.innerHTML = `✔ Transmission dispatched successfully! Sriram will respond shortly.`;
          }
        } else {
          const data = await response.json();
          const err = data.errors ? data.errors.map(err => err.message).join(', ') : 'Transmission failed.';
          if (formFeedback) {
            formFeedback.className = 'form-feedback error';
            formFeedback.innerHTML = `✖ Transmission error: ${err}`;
          }
        }
      } catch (err) {
        if (formFeedback) {
          formFeedback.className = 'form-feedback error';
          formFeedback.innerHTML = `✖ Network error: Unable to transmit message. Please email directly.`;
        }
      } finally {
        if (formSubmitBtn) {
          formSubmitBtn.disabled = false;
          formSubmitBtn.innerHTML = `<span>TRANSMIT MESSAGE &gt;</span>`;
        }
      }
    });
  }

  /* ── 12. INITIALIZATION ── */
  applyMode(currentMode);
  goToSlide(1, false);

  // Initial pill positioning after fonts and layout settle
  setTimeout(() => {
    const activeTab = document.querySelector('.tmux-tab.is-active');
    if (activeTab) updateDockPill(activeTab);
  }, 120);
});
