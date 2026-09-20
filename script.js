/* ==========================================================================
   RHEL ENTERPRISE & MACOS SONOMA HYBRID DECK CONTROLLER
   with Noisy Circle Reveal & Radial Interpolation Transitions (Zero Purple / AI-slop)
   - Persistent WebGL Circle Reveal Transition (SmoothUI / motion.dev)
   - Noisy Circular Reveal with Radial Harmonic Interpolation
   - Midpoint DOM Slide Swap under Radial Crest (50% progress)
   - Sliding macOS Segmented Dock Indicator Pill
   - Keyboard Navigation (←, →, Space, 1-7, M, T)
   - Mobile Touch Swiping (Horizontal Gesture Detection)
   - Dual-Mode Switcher: Deck Mode vs Scroll Mode
   - Interactive Docker Workbench Tab Switching
   - Theme Toggle (Dark / Light)
   - Formspree AJAX Submission
   ========================================================================== */

/* ── WEBGL CIRCLE REVEAL TRANSITION CONTROLLER (SmoothUI) ── */
class CircleRevealController {
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
        console.warn('[CircleReveal] WebGL not supported, graceful fallback active.');
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

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                         dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                     mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                         dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
        }

        float fbm(vec2 p) {
          float total = 0.0;
          float amp = 0.5;
          for (int i = 0; i < 4; i++) {
            total += amp * noise(p);
            p = p * 2.08 + vec2(1.7, 3.2);
            amp *= 0.5;
          }
          return total;
        }

        void main() {
          vec2 uv = vUv;
          vec2 center = vec2(0.5, 0.5);
          vec2 aspectCoord = uv - center;
          float aspect = uResolution.x / max(uResolution.y, 1.0);
          aspectCoord.x *= aspect;

          float dist = length(aspectCoord);
          float angle = atan(aspectCoord.y, aspectCoord.x);

          // Multi-frequency radial harmonic noise field with gentle motion
          vec2 polarCoord = vec2(cos(angle) * 3.0, sin(angle) * 3.0);
          float radialNoise = fbm(polarCoord * 1.8 + aspectCoord * 3.0 + vec2(uTime * 0.25, -uTime * 0.20));
          float fineNoise = noise(aspectCoord * 12.0 + uTime * 0.4) * 0.04;
          float grain = (fract(sin(dot(uv + uTime * 0.02, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.015;

          float noisyDist = dist + radialNoise * 0.14 + fineNoise + grain;
          float maxRadius = length(vec2(0.5 * aspect, 0.5)) * 1.20;

          // Two-Phase Midpoint SmoothUI Reveal Cycle
          // Phase 1 (uProgress 0.0 -> 0.5): Expanding velvety carbon veil blankets the current slide
          // At midpoint (uProgress = 0.5): Viewport is smoothly occluded; DOM swaps invisibly
          // Phase 2 (uProgress 0.5 -> 1.0): Radial aperture gently unfurls outward to reveal next slide
          float curRadius = 0.0;
          float cover = 0.0;

          if (uDirection > 0.0) {
            // Forward: Center expands outward to edges, then aperture unfurls outward
            if (uProgress < 0.5) {
              float phaseT = uProgress * 2.0;
              float easePhase = smoothstep(0.0, 1.0, phaseT);
              curRadius = easePhase * maxRadius;
              cover = smoothstep(curRadius + 0.20, curRadius - 0.12, noisyDist);
            } else {
              float phaseT = (uProgress - 0.5) * 2.0;
              float easePhase = smoothstep(0.0, 1.0, phaseT);
              curRadius = easePhase * maxRadius;
              cover = smoothstep(curRadius - 0.12, curRadius + 0.20, noisyDist);
            }
          } else {
            // Backward: Outer edges collapse inward to center, then center shrinks away
            if (uProgress < 0.5) {
              float phaseT = uProgress * 2.0;
              float easePhase = smoothstep(0.0, 1.0, phaseT);
              curRadius = (1.0 - easePhase) * maxRadius;
              cover = smoothstep(curRadius - 0.12, curRadius + 0.20, noisyDist);
            } else {
              float phaseT = (uProgress - 0.5) * 2.0;
              float easePhase = smoothstep(0.0, 1.0, phaseT);
              curRadius = (1.0 - easePhase) * maxRadius;
              cover = smoothstep(curRadius + 0.20, curRadius - 0.12, noisyDist);
            }
          }

          // Soft smoky penumbra along the noisy circular boundary (broad & gentle, no sharp glare)
          float edgeDist = abs(noisyDist - curRadius);
          float rim = smoothstep(0.24, 0.0, edgeDist);

          // Directional shift on chromatic fringes (subtle separation)
          float dirOffset = (uDirection > 0.0) ? 0.025 : -0.025;
          float rimR     = smoothstep(0.24, 0.0, abs(noisyDist - (curRadius + dirOffset)));
          float rimG     = smoothstep(0.20, 0.0, abs(noisyDist - curRadius));
          float rimAmber = smoothstep(0.18, 0.0, abs(noisyDist - (curRadius - dirOffset * 0.5)));
          float rimB     = smoothstep(0.24, 0.0, abs(noisyDist - (curRadius - dirOffset)));

          // Strict mutual exclusion between Red and Blue to eliminate purple/magenta
          float rbRatio = rimR / (rimR + rimB + 0.0001);
          float redWeight  = smoothstep(0.44, 0.62, rbRatio) * rimR;
          float blueWeight = smoothstep(0.56, 0.38, rbRatio) * rimB;

          // SUBDUED BRAND PALETTE: Deep velvety carbon, muted wine crimson, midnight steel blue (ZERO FLASHBANG)
          vec3 colCarbon = vec3(0.063, 0.063, 0.071);   // #101012 Obsidian Carbon
          vec3 colRed    = vec3(0.64, 0.09, 0.09);       // Muted RHEL Wine Crimson (soft, non-glaring)
          vec3 colBlue   = vec3(0.12, 0.36, 0.62);       // macOS Midnight Slate Blue (subtle, non-electric)
          vec3 colGreen  = vec3(0.14, 0.44, 0.25);       // Muted Terminal Sage
          vec3 colAmber  = vec3(0.58, 0.36, 0.10);       // Soft Warm Bronze Amber

          vec3 rimColor = vec3(0.0);
          rimColor += colRed * (redWeight * 0.68);
          rimColor += colBlue * (blueWeight * 0.60);
          rimColor += colGreen * (rimG * 0.40);
          rimColor += colAmber * (rimAmber * 0.35);

          // Velvety carbon body with soft smoky rim infusion (no white sparks or bright flashes)
          vec3 color = mix(colCarbon, rimColor + colCarbon, rim * 0.50);

          // Silky-smooth opacity envelope with feather-soft entrance and exit
          float alpha = clamp(cover * 0.95 + rim * 0.25, 0.0, 0.96);
          float edgeFade = smoothstep(0.0, 0.12, uProgress) * smoothstep(1.0, 0.88, uProgress);
          alpha *= edgeFade;
          alpha = clamp(alpha * 1.15, 0.0, 0.96);

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
        console.warn('[CircleReveal] Shader program link failed:', gl.getProgramInfoLog(this.program));
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
      console.warn('[CircleReveal] WebGL initialization failed:', err);
      this.supported = false;
    }
  }

  compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[CircleReveal] Shader compilation error:', gl.getShaderInfoLog(shader));
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

  reveal({ direction = 'forward', duration = 1150, onMidpoint, onComplete }) {
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

      // Silky 5th-order smootherstep curve: starts with zero jerk, glides gently through midpoint, cushions to rest
      const t = linearT;
      const easedT = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);

      // Swaps the new content at the shader midpoint under the dense radial veil
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
        // Complete reveal transition
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

/* ── MAGICUI MACOS INTERACTIVE TERMINAL ENGINE ── */
class MagicTerminalEngine {
  constructor(containerEl, config = {}) {
    this.container = containerEl;
    this.codeEl = containerEl.querySelector('.magic-term-code');
    this.bodyEl = containerEl.querySelector('.magic-term-body') || containerEl.querySelector('#hero-terminal-body');
    this.replayBtn = containerEl.querySelector('.magic-term-replay');
    this.inputRow = containerEl.querySelector('#terminal-interactive-row');
    this.inputEl = containerEl.querySelector('#terminal-cli-input');
    this.chipsContainer = containerEl.querySelector('#terminal-quick-chips');

    this.typingSpeed = config.typingSpeed || 26;
    this.spanDelay = config.spanDelay || 110;
    this.isRunning = false;
    this.timeouts = [];
    this.hasRunOnce = false;
    this.history = [];
    this.historyIndex = -1;

    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.restart();
      });
    }

    this.initCLI();
  }

  clear() {
    this.timeouts.forEach(clearTimeout);
    this.timeouts = [];
    this.isRunning = false;
    if (this.codeEl) {
      this.codeEl.innerHTML = '';
    }
    if (this.inputRow) {
      this.inputRow.style.display = 'none';
    }
  }

  start(force = false) {
    if (this.isRunning) return;
    if (this.hasRunOnce && !force) return;
    this.clear();
    this.isRunning = true;
    this.hasRunOnce = true;
    this.runSequence();
  }

  restart() {
    this.clear();
    this.isRunning = true;
    this.hasRunOnce = true;
    this.runSequence();
  }

  schedule(fn, delay) {
    const id = setTimeout(() => {
      if (this.isRunning) fn();
    }, delay);
    this.timeouts.push(id);
    return id;
  }

  scrollToBottom() {
    if (this.bodyEl) {
      this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    }
  }

  initCLI() {
    if (this.inputEl) {
      this.inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const cmd = this.inputEl.value.trim();
          if (!cmd) return;

          this.history.push(cmd);
          this.historyIndex = this.history.length;

          this.appendPromptLine(cmd);
          this.executeCommand(cmd);

          this.inputEl.value = '';
          this.scrollToBottom();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.history.length > 0) {
            if (this.historyIndex > 0) this.historyIndex--;
            this.inputEl.value = this.history[this.historyIndex] || '';
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.inputEl.value = this.history[this.historyIndex];
          } else {
            this.historyIndex = this.history.length;
            this.inputEl.value = '';
          }
        }
      });
    }

    if (this.chipsContainer) {
      this.chipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.term-chip');
        if (!chip) return;
        const cmd = chip.getAttribute('data-cmd');
        if (cmd) {
          if (this.inputEl) this.inputEl.value = cmd;
          this.appendPromptLine(cmd);
          this.executeCommand(cmd);
          if (this.inputEl) {
            this.inputEl.value = '';
            this.inputEl.focus();
          }
          this.scrollToBottom();
        }
      });
    }
  }

  enableInteractiveMode() {
    if (this.inputRow) {
      this.inputRow.style.display = 'flex';
      requestAnimationFrame(() => {
        this.scrollToBottom();
      });
    }
  }

  appendPromptLine(cmd) {
    if (!this.codeEl) return;
    const row = document.createElement('div');
    row.className = 'term-line-cmd';
    row.innerHTML = `<span class="term-prompt-sym">sriram@rhel-workstation:~$</span> <span class="term-typed-text">${this.escapeHtml(cmd)}</span>`;
    this.codeEl.appendChild(row);
  }

  printLines(lines) {
    if (!this.codeEl) return;
    lines.forEach(item => {
      const el = document.createElement('div');
      if (item.type === 'header') {
        el.className = 'term-out-header';
        el.innerHTML = item.html;
      } else if (item.type === 'cmd-desc') {
        el.className = 'term-out-cmd-desc';
        el.innerHTML = `<span class="term-out-cmd-name">${this.escapeHtml(item.cmd)}</span> <span>${item.desc}</span>`;
      } else if (item.type === 'hint') {
        el.className = 'term-out-hint';
        el.innerHTML = item.html;
      } else if (item.type === 'error') {
        el.className = 'term-out-error';
        el.innerHTML = item.html;
      } else {
        el.className = 'term-out-line';
        el.innerHTML = item.html;
      }
      this.codeEl.appendChild(el);
    });
    this.scrollToBottom();
  }

  executeCommand(rawCmd) {
    const clean = rawCmd.trim();
    if (!clean) return;

    const parts = clean.split(/\s+/);
    const main = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (main) {
      case 'help':
      case 'man':
        this.printLines([
          { type: 'header', html: '── SRIRAM PORTFOLIO LINUX CLI ──' },
          { type: 'cmd-desc', cmd: 'ls', desc: 'List files and portfolio chapters' },
          { type: 'cmd-desc', cmd: 'cat <file>', desc: 'View file content (e.g. cat projects, cat certs, cat exp, cat cv, cat contact)' },
          { type: 'cmd-desc', cmd: 'cd <1-7|name>', desc: 'Navigate to chapter (e.g. cd 3 or cd projects)' },
          { type: 'cmd-desc', cmd: 'neofetch', desc: 'Display system specs & Cloud SRE profile' },
          { type: 'cmd-desc', cmd: 'whoami', desc: 'Print active engineer profile & title' },
          { type: 'cmd-desc', cmd: 'uname -r', desc: 'Print Linux kernel build version' },
          { type: 'cmd-desc', cmd: 'clear', desc: 'Clear terminal screen' },
          { type: 'cmd-desc', cmd: 'boot', desc: 'Replay boot diagnostics sequence' }
        ]);
        break;

      case 'ls':
        this.printLines([
          { type: 'line', html: '<span style="color:var(--macos-blue)">boot.sh</span>          <span style="color:var(--macos-blue)">cluster-spec.yaml</span>    <span style="color:var(--terminal-mint)">projects/</span>' },
          { type: 'line', html: '<span style="color:var(--macos-blue)">experience.log</span>   <span style="color:var(--macos-blue)">certs.pem</span>            <span style="color:var(--macos-blue)">education.txt</span>' },
          { type: 'line', html: '<span style="color:var(--macos-blue)">contact.sh</span>       <span style="color:var(--terminal-amber)">cv.pdf</span>' },
          { type: 'hint', html: "💡 Try: <b>cat projects</b>, <b>cat certs</b>, or <b>cd 3</b>" }
        ]);
        break;

      case 'cat':
        const target = args[0] ? args[0].toLowerCase() : '';
        if (!target) {
          this.printLines([
            { type: 'error', html: 'cat: missing file operand. Try: cat projects, cat certs, cat exp, cat cv, cat contact' }
          ]);
        } else if (target.includes('proj')) {
          this.printLines([
            { type: 'header', html: '── SHIPPED CLOUD / DEVOPS / SRE PROJECTS (8) ──' },
            { type: 'line', html: '<b>[1] aws/support-eng-simulation</b> · Incident triage & EC2 simulator<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/aws-support-engineer-cloud-simulation" target="_blank" rel="noopener" class="term-out-link">github.com/.../aws-support-engineer-cloud-simulation ↗</a>' },
            { type: 'line', html: '<b>[2] ecs/observability-fargate</b> · Terraform ECS + Prometheus + Grafana<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/Cloud-Security-Observability-Stack-on-ECS-Fargate" target="_blank" rel="noopener" class="term-out-link">github.com/.../Cloud-Security-Observability-Stack-on-ECS-Fargate ↗</a>' },
            { type: 'line', html: '<b>[3] gitops/ai-test-generator</b> · ArgoCD + K8s + Groq AI delivery<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/ai-test-generator-gitops-pipeline" target="_blank" rel="noopener" class="term-out-link">github.com/.../ai-test-generator-gitops-pipeline ↗</a>' },
            { type: 'line', html: '<b>[4] sre/java-self-healing</b> · AWS 5-layer auto-recovery & Snyk<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/java-self-healing-microservice" target="_blank" rel="noopener" class="term-out-link">github.com/.../java-self-healing-microservice ↗</a>' },
            { type: 'line', html: '<b>[5] azure/patient-triage</b> · Azure App Service + OpenAI GPT-4o<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/AI-Patient-Triage-System-on-Azure-CSA-Case-Study-" target="_blank" rel="noopener" class="term-out-link">github.com/.../AI-Patient-Triage-System-on-Azure-CSA-Case-Study- ↗</a>' },
            { type: 'line', html: '<b>[6] aws/bookstore-serverless</b> · AWS Lambda + API Gateway + MongoDB<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/Bookstore-Microservice-Architecture-on-AWS" target="_blank" rel="noopener" class="term-out-link">github.com/.../Bookstore-Microservice-Architecture-on-AWS ↗</a>' },
            { type: 'line', html: '<b>[7] aws/compliance-vendor-risk</b> · Terraform AWS Security Hub + Config + GRC TPRM<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/cloud-compliance-vendor-risk" target="_blank" rel="noopener" class="term-out-link">github.com/.../cloud-compliance-vendor-risk ↗</a>' },
            { type: 'line', html: '<b>[8] secops/vault-wazuh-threat-lab</b> · HashiCorp Vault + Wazuh SIEM + MITRE ATT&amp;CK<br>&nbsp;&nbsp;&nbsp;↳ <a href="https://github.com/SannidhiSriram-06/identity-threat-detection-lab" target="_blank" rel="noopener" class="term-out-link">github.com/.../identity-threat-detection-lab ↗</a>' },
            { type: 'hint', html: "💡 Type <b>cd 3</b> to inspect interactive topology in the Workbench." }
          ]);
        } else if (target.includes('cert')) {
          this.printLines([
            { type: 'header', html: '── VERIFIED CLOUD CREDENTIALS (6) ──' },
            { type: 'line', html: '✔ Oracle Cloud Infrastructure Foundations 2024 Associate' },
            { type: 'line', html: '✔ Oracle Cloud Infrastructure 2024 Architect Associate' },
            { type: 'line', html: '✔ Oracle Cloud Infrastructure 2024 Developer Professional' },
            { type: 'line', html: '✔ Oracle Cloud Infrastructure 2024 Generative AI Certified Professional' },
            { type: 'line', html: '✔ Microsoft Certified: Azure Fundamentals (AZ-900)' },
            { type: 'line', html: '✔ Microsoft Certified: Azure AI Fundamentals (AI-900)' },
            { type: 'line', html: '🏆 <b>Global Top 500</b> — Oracle Race to Certification 2025' },
            { type: 'hint', html: "💡 Type <b>cd 5</b> to view credential cards." }
          ]);
        } else if (target.includes('exp')) {
          this.printLines([
            { type: 'header', html: '── INTERNSHIP EXPERIENCE ──' },
            { type: 'line', html: '<b>Infosys Springboard</b> · AI Intern — Cloud Deployment Lead (Feb 2026 – Mar 2026)' },
            { type: 'line', html: '• Directed cloud deployment architecture for a 25-member cohort building AI KYC system.' },
            { type: 'line', html: '• Provisioned AWS EC2 Flask inference + S3 static React frontend.' },
            { type: 'line', html: '• Mitigated 5 critical blockers: ERR_CORS, ERR_BIND, ERR_PM2, ERR_PAYLOAD.' },
            { type: 'hint', html: "💡 Type <b>cd 4</b> to view deployment log and verified certificate." }
          ]);
        } else if (target.includes('cv') || target.includes('resume')) {
          this.printLines([
            { type: 'header', html: '── OFFICIAL RÉSUMÉ ──' },
            { type: 'line', html: '✔ Opening Sannidhi_Sriram_CV.pdf...' },
            { type: 'line', html: '↳ <a href="assets/media/Sannidhi_Sriram_CV.pdf" download="Sannidhi_Sriram_CV.pdf" class="term-out-link">Download Sannidhi_Sriram_CV.pdf ↗</a>' }
          ]);
          window.open('assets/media/Sannidhi_Sriram_CV.pdf', '_blank');
        } else if (target.includes('contact')) {
          this.printLines([
            { type: 'header', html: '── TRANSMISSION CHANNELS ──' },
            { type: 'line', html: 'Email:    <a href="mailto:sannidhisriram8@gmail.com" class="term-out-link">sannidhisriram8@gmail.com</a>' },
            { type: 'line', html: 'LinkedIn: <a href="https://www.linkedin.com/in/sannidhi-durga-pavan-sriram-07153a27a" target="_blank" rel="noopener" class="term-out-link">linkedin.com/in/sannidhi-durga-pavan-sriram-07153a27a ↗</a>' },
            { type: 'line', html: 'GitHub:   <a href="https://github.com/SannidhiSriram-06" target="_blank" rel="noopener" class="term-out-link">github.com/SannidhiSriram-06 ↗</a>' },
            { type: 'line', html: 'Location: Hyderabad, Telangana, India (IST / UTC+5:30)' },
            { type: 'hint', html: "💡 Type <b>cd 7</b> to dispatch an encrypted transmission." }
          ]);
        } else if (target.includes('edu')) {
          this.printLines([
            { type: 'header', html: '── ACADEMIC BACKGROUND ──' },
            { type: 'line', html: '<b>B.Tech in Computer Science and Engineering (Hons)</b> — CGPA: 7.33' },
            { type: 'line', html: 'Lovely Professional University (Phagwara, Punjab) · Minor: Cloud Computing' },
            { type: 'line', html: 'Intermediate (MPC): Keshav Smarak Junior College, Hyderabad (77.5%)' },
            { type: 'line', html: 'Class X (SSC): Oxford Grammar High School, Hyderabad (84.6%)' },
            { type: 'hint', html: "💡 Type <b>cd 6</b> to inspect education timeline." }
          ]);
        } else {
          this.printLines([
            { type: 'error', html: `cat: ${this.escapeHtml(target)}: No such file or directory. Try: cat projects, cat certs, cat exp, cat cv, cat contact` }
          ]);
        }
        break;

      case 'cd':
      case 'goto':
        const dest = args[0] ? args[0].toLowerCase() : '';
        const destMap = {
          '1': 1, 'boot': 1, 'hero': 1,
          '2': 2, 'stack': 2, 'cluster': 2,
          '3': 3, 'projects': 3, 'project': 3, 'docker': 3,
          '4': 4, 'experience': 4, 'exp': 4, 'deploy': 4,
          '5': 5, 'certs': 5, 'certifications': 5, 'auth': 5,
          '6': 6, 'education': 6, 'edu': 6, 'history': 6,
          '7': 7, 'contact': 7, 'ssh': 7, 'connect': 7
        };
        if (destMap[dest] && window.deckNav) {
          this.printLines([{ type: 'line', html: `✔ Navigating to Chapter 0${destMap[dest]}...` }]);
          window.deckNav.goTo(destMap[dest]);
        } else {
          this.printLines([{ type: 'error', html: `cd: invalid destination '${this.escapeHtml(dest)}'. Valid targets: 1-7 (or boot, stack, projects, experience, certs, education, contact)` }]);
        }
        break;

      case 'neofetch':
      case 'fastfetch':
        this.printLines([
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">       _---_         </span>  <span style="color:var(--text-bright);font-weight:700">sriram@rhel-workstation</span>' },
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">     /       \\       </span>  <span style="color:var(--text-muted)">-----------------------</span>' },
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">    |  (o) (o) |     </span>  <b>OS:</b> Red Hat Enterprise Linux 9.4 (Plow)' },
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">    |    -     |     </span>  <b>Host:</b> Hybrid Cloud SRE Workstation' },
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">    \\   ---   /      </span>  <b>Kernel:</b> Linux 6.8.0-cloud-sre x86_64' },
          { type: 'line', html: '<span style="color:var(--rhel-red);font-weight:700">     \\_______/       </span>  <b>Uptime:</b> 99.98% High Availability' },
          { type: 'line', html: '                      <b>Role:</b> Cloud / DevOps / SRE Engineer' },
          { type: 'line', html: '                      <b>Stack:</b> AWS, Azure, K8s, Terraform, ArgoCD' },
          { type: 'line', html: '                      <b>Credentials:</b> 6x Certs (Oracle Global Top 500)' },
          { type: 'line', html: '                      <b>Status:</b> Production Ready — Open to Roles' }
        ]);
        break;

      case 'whoami':
        this.printLines([
          { type: 'line', html: '<b>sannidhi-durga-pavan-sriram</b> · Cloud Infrastructure, DevOps &amp; Site Reliability Engineer' }
        ]);
        break;

      case 'uname':
        this.printLines([
          { type: 'line', html: 'Linux rhel-workstation 6.8.0-cloud-sre #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux' }
        ]);
        break;

      case 'clear':
        if (this.codeEl) this.codeEl.innerHTML = '';
        break;

      case 'boot':
        this.restart();
        break;

      default:
        this.printLines([
          { type: 'error', html: `zsh: command not found: <code>${this.escapeHtml(clean)}</code>. Type <b>help</b> or click the quick chips above.` }
        ]);
        break;
    }
  }

  escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  runSequence() {
    if (!this.codeEl) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const sequenceData = [
      {
        type: 'cmd',
        prompt: 'sriram@rhel-workstation:~$',
        text: './boot.sh --role=cloud-sre --env=production'
      },
      {
        type: 'span',
        tag: '[KERNEL]',
        text: 'Linux 6.8 · systemd, SELinux, RPM, cgroups active'
      },
      {
        type: 'span',
        tag: '[ACADEMICS]',
        text: 'Lovely Professional University (Phagwara, Punjab) · B.Tech CSE (CGPA 7.33)'
      },
      {
        type: 'span',
        tag: '[CREDENTIALS]',
        text: '6x Cloud Certs · Oracle OCI (Global Race Top 500) + Azure (2x)'
      },
      {
        type: 'span',
        tag: '[STACK]',
        text: 'AWS · Azure · Terraform IaC · Docker · Kubernetes · ArgoCD GitOps'
      },
      {
        type: 'span',
        tag: '[STATUS]',
        text: 'Self-healing clusters operational · Ready for Cloud / DevOps / SRE roles'
      }
    ];

    if (prefersReducedMotion) {
      sequenceData.forEach(item => {
        if (item.type === 'cmd') {
          const row = document.createElement('div');
          row.className = 'term-line-cmd';
          row.innerHTML = `<span class="term-prompt-sym">${item.prompt}</span> <span class="term-typed-text">${item.text}</span>`;
          this.codeEl.appendChild(row);
        } else if (item.type === 'span') {
          const row = document.createElement('div');
          row.className = 'term-line-span is-revealed';
          row.innerHTML = `<span class="term-check">✔</span> <span class="term-tag">${item.tag}</span> <span class="term-desc">${item.text}</span>`;
          this.codeEl.appendChild(row);
        }
      });
      this.isRunning = false;
      this.enableInteractiveMode();
      return;
    }

    let currentStep = 0;

    const executeNext = () => {
      if (!this.isRunning) return;

      if (currentStep >= sequenceData.length) {
        this.isRunning = false;
        this.enableInteractiveMode();
        return;
      }

      const item = sequenceData[currentStep++];

      if (item.type === 'cmd') {
        const row = document.createElement('div');
        row.className = 'term-line-cmd';
        row.innerHTML = `<span class="term-prompt-sym">${item.prompt}</span> <span class="term-typed-text"></span><span class="term-cursor" aria-hidden="true"></span>`;
        this.codeEl.appendChild(row);

        const textEl = row.querySelector('.term-typed-text');
        const cursorEl = row.querySelector('.term-cursor');
        let charIndex = 0;

        const typeChar = () => {
          if (!this.isRunning) return;
          if (charIndex < item.text.length) {
            textEl.textContent += item.text.charAt(charIndex++);
            const jitter = Math.random() * 18 - 9;
            this.schedule(typeChar, Math.max(16, this.typingSpeed + jitter));
          } else {
            if (cursorEl) cursorEl.remove();
            this.schedule(executeNext, 150);
          }
        };

        this.schedule(typeChar, 120);

      } else if (item.type === 'span') {
        const row = document.createElement('div');
        row.className = 'term-line-span';
        row.innerHTML = `<span class="term-check">✔</span> <span class="term-tag">${item.tag}</span> <span class="term-desc">${item.text}</span>`;
        this.codeEl.appendChild(row);

        requestAnimationFrame(() => {
          this.schedule(() => {
            row.classList.add('is-revealed');
            this.schedule(executeNext, this.spanDelay);
          }, 30);
        });
      }
    };

    executeNext();
  }
}

/* ── ACTION TOAST FEEDBACK NOTIFICATION ── */
let toastTimeout = null;
function showToast(msg, duration = 2400) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.innerHTML = msg;
  toast.classList.add('is-visible');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, duration);
}

/* ── SPOTLIGHT / RAYCAST COMMAND PALETTE CONTROLLER (⌘K) ── */
class CommandPaletteController {
  constructor(modalEl, options = {}) {
    this.modal = modalEl;
    this.windowEl = modalEl.querySelector('.cmd-palette-window');
    this.input = modalEl.querySelector('.cmd-palette-input');
    this.resultsEl = modalEl.querySelector('.cmd-palette-results');
    this.triggerBtn = options.triggerBtn || document.getElementById('cmd-palette-btn');
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredItems = [];
    this.getItems = options.getItems || (() => []);

    this.initEvents();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.modal.classList.add('is-open');
    this.modal.setAttribute('aria-hidden', 'false');
    this.items = this.getItems();
    this.input.value = '';
    this.filter('');
    this.input.focus();

    if (typeof gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(this.windowEl, 
        { opacity: 0, scale: 0.96, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: "power2.out" }
      );
    }
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.modal.classList.remove('is-open');
    this.modal.setAttribute('aria-hidden', 'true');
    this.input.blur();
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  initEvents() {
    if (this.triggerBtn) {
      this.triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      // ⌘K or Ctrl+K opens/toggles palette
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        this.toggle();
        return;
      }

      if (!this.isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.moveSelection(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.moveSelection(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      }
    });

    this.input.addEventListener('input', () => {
      this.filter(this.input.value);
    });
  }

  filter(query) {
    const q = query.trim().toLowerCase();
    if (!q) {
      this.filteredItems = [...this.items];
    } else {
      this.filteredItems = this.items.filter(item => {
        return item.title.toLowerCase().includes(q) ||
               (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
               (item.category && item.category.toLowerCase().includes(q)) ||
               (item.keywords && item.keywords.toLowerCase().includes(q));
      });
    }
    this.selectedIndex = 0;
    this.render();
  }

  moveSelection(direction) {
    if (this.filteredItems.length === 0) return;
    this.selectedIndex = (this.selectedIndex + direction + this.filteredItems.length) % this.filteredItems.length;
    this.updateActiveItem();
  }

  updateActiveItem() {
    const domItems = this.resultsEl.querySelectorAll('.cmd-palette-item');
    domItems.forEach((el, i) => {
      if (i === this.selectedIndex) {
        el.classList.add('is-selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('is-selected');
      }
    });
  }

  executeSelected() {
    const item = this.filteredItems[this.selectedIndex];
    if (item && item.action) {
      this.close();
      item.action();
    }
  }

  render() {
    this.resultsEl.innerHTML = '';

    if (this.filteredItems.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'cmd-palette-empty';
      empty.textContent = 'No matching commands or projects found.';
      this.resultsEl.appendChild(empty);
      return;
    }

    let currentCategory = null;

    this.filteredItems.forEach((item, index) => {
      if (item.category && item.category !== currentCategory) {
        currentCategory = item.category;
        const catHeader = document.createElement('div');
        catHeader.className = 'cmd-palette-section-title';
        catHeader.textContent = currentCategory;
        this.resultsEl.appendChild(catHeader);
      }

      const row = document.createElement('div');
      row.className = `cmd-palette-item ${index === this.selectedIndex ? 'is-selected' : ''}`;
      row.setAttribute('role', 'option');
      row.innerHTML = `
        <div class="cmd-item-left">
          <span class="cmd-item-icon">${item.icon || '►'}</span>
          <span class="cmd-item-text">${item.title}</span>
          ${item.subtitle ? `<span class="cmd-item-sub">${item.subtitle}</span>` : ''}
        </div>
        <span class="cmd-item-badge">${item.badge || '↵'}</span>
      `;

      row.addEventListener('click', () => {
        this.selectedIndex = index;
        this.executeSelected();
      });

      row.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateActiveItem();
      });

      this.resultsEl.appendChild(row);
    });
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
  const circleRevealCanvas = document.getElementById('circle-reveal-canvas');
  const heroTerminalEl = document.getElementById('hero-magic-terminal');

  let currentSlide = 1;
  const totalSlides = slides.length;
  if (crumbTotal) crumbTotal.textContent = String(totalSlides).padStart(2, '0');

  let isTransitioning = false;
  let circleRevealController = null;
  if (circleRevealCanvas) {
    circleRevealController = new CircleRevealController(circleRevealCanvas);
  }

  let heroTerminal = null;
  if (heroTerminalEl) {
    heroTerminal = new MagicTerminalEngine(heroTerminalEl);
  }

  /* ── 2. GSAP & LENIS RUNTIME DETECTION ── */
  const hasGSAP = typeof gsap !== 'undefined';
  const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  let lenis = null;

  /* ── 3. LENIS SMOOTH SCROLL ENGINE (Scroll Mode) ── */
  function initLenisScroll() {
    if (prefersReducedMotion || !hasLenis) return;
    if (lenis) return;

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    if (hasGSAP && hasScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        if (lenis) lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        if (lenis) {
          lenis.raf(time);
          requestAnimationFrame(raf);
        }
      }
      requestAnimationFrame(raf);
    }
  }

  function destroyLenisScroll() {
    if (lenis) {
      lenis.destroy();
      lenis = null;
    }
  }

  /* ── 4. MACOS SLIDING SEGMENTED DOCK PILL ── */
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
    if (hasScrollTrigger) ScrollTrigger.refresh();
  });

  /* ── 5. VIEW MODE MANAGEMENT (Deck vs Scroll) ── */
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
      destroyLenisScroll();
      if (hasScrollTrigger) {
        ScrollTrigger.getAll().forEach(st => st.kill());
      }
      goToSlide(currentSlide, false);
    } else {
      initLenisScroll();
      initScrollTriggers();
      const targetEl = document.getElementById(`slide-${currentSlide}`);
      if (targetEl) {
        if (lenis) {
          setTimeout(() => lenis.scrollTo(targetEl, { offset: -60, immediate: false }), 80);
        } else {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  }

  if (modeToggleBtn) {
    modeToggleBtn.addEventListener('click', () => {
      applyMode(currentMode === 'deck' ? 'scroll' : 'deck');
    });
  }

  /* ── 6. SLIDE TITLES & GSAP ENTRANCE ORCHESTRATION ── */
  const slideTitles = {
    1: "CH.01 // boot.sh · Identity — Sannidhi Durga Pavan Sriram",
    2: "CH.02 // cluster-spec.yaml · Stack — Sannidhi Durga Pavan Sriram",
    3: "CH.03 // projects.docker · Shipped Projects — Sannidhi Durga Pavan Sriram",
    4: "CH.04 // deploy.log · Experience — Sannidhi Durga Pavan Sriram",
    5: "CH.05 // certs.pem · Certifications — Sannidhi Durga Pavan Sriram",
    6: "CH.06 // build-history · Education — Sannidhi Durga Pavan Sriram",
    7: "CH.07 // ssh-session · Contact — Sannidhi Durga Pavan Sriram",
  };

  function animateSlideEntrance(slideIndex) {
    if (!hasGSAP || prefersReducedMotion) return;
    const slide = document.getElementById(`slide-${slideIndex}`);
    if (!slide) return;

    gsap.killTweensOf(slide.querySelectorAll('*'));
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    // Header badge line drop
    const badgeRow = slide.querySelector('.slide-badge-row, .hero-badge-strip');
    const headerBlock = slide.querySelector('.slide-header-block');
    if (badgeRow) tl.fromTo(badgeRow, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.3 }, 0);
    if (headerBlock) tl.fromTo(headerBlock, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }, 0.05);

    if (slideIndex === 1) {
      const title = slide.querySelector('.hero-title');
      const summary = slide.querySelector('.hero-summary');
      const specGrid = slide.querySelector('.hero-spec-grid');
      const metricCards = slide.querySelectorAll('.metric-card');
      const ctas = slide.querySelectorAll('.hero-cta-group .cta-pill');
      const terminal = slide.querySelector('.magic-terminal');

      if (title) tl.fromTo(title, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35 }, 0.08);
      if (summary) tl.fromTo(summary, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.12);
      if (specGrid) tl.fromTo(specGrid, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 }, 0.16);
      if (metricCards.length) {
        tl.fromTo(metricCards, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.05 }, 0.2);
      }
      if (ctas.length) {
        tl.fromTo(ctas, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.28, stagger: 0.04 }, 0.26);
      }
      if (terminal) {
        tl.fromTo(terminal, { opacity: 0, scale: 0.98, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.4 }, 0.15);
      }
    } else if (slideIndex === 2) {
      const cards = slide.querySelectorAll('.stack-card');
      if (cards.length) {
        tl.fromTo(cards, { opacity: 0, y: 14, scale: 0.99 }, { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.06 }, 0.08);
      }
    } else if (slideIndex === 3) {
      const rows = slide.querySelectorAll('.docker-row');
      const activePanel = slide.querySelector('.case-detail-panel.is-active');
      if (rows.length) {
        tl.fromTo(rows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.3, stagger: 0.04 }, 0.08);
      }
      if (activePanel) {
        tl.fromTo(activePanel, { opacity: 0, x: 12 }, { opacity: 1, x: 0, duration: 0.35 }, 0.12);
      }
    } else if (slideIndex === 4) {
      const logCard = slide.querySelector('.exp-log-card');
      const certPane = slide.querySelector('.cert-verify-pane');
      if (logCard) tl.fromTo(logCard, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38 }, 0.08);
      if (certPane) tl.fromTo(certPane, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38 }, 0.14);
    } else if (slideIndex === 5) {
      const banner = slide.querySelector('.oracle-top-banner');
      const certCards = slide.querySelectorAll('.cert-card');
      if (banner) tl.fromTo(banner, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.32 }, 0.08);
      if (certCards.length) {
        tl.fromTo(certCards, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, stagger: 0.04 }, 0.14);
      }
    } else if (slideIndex === 6) {
      const timelineRows = slide.querySelectorAll('.timeline-deck-row');
      if (timelineRows.length) {
        tl.fromTo(timelineRows, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.07 }, 0.08);
      }
    } else if (slideIndex === 7) {
      const channelsCard = slide.querySelector('.contact-channels-card');
      const formPane = slide.querySelector('.contact-form-pane');
      if (channelsCard) tl.fromTo(channelsCard, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35 }, 0.08);
      if (formPane) tl.fromTo(formPane, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.35 }, 0.12);
    }
  }

  /* ── 7. SLIDE UI UPDATES & NAVIGATION ── */
  function updateSlideUI(index) {
    currentSlide = index;

    // Dynamically update document title per chapter
    if (slideTitles[index]) {
      document.title = slideTitles[index];
    }

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

    // Trigger stat counters and MagicUI terminal if navigating to slide 1
    if (currentSlide === 1) {
      animateCounters();
      if (heroTerminal) {
        heroTerminal.start();
      }
    }
  }

  function goToSlide(index, smooth = true) {
    if (index < 1) index = 1;
    if (index > totalSlides) index = totalSlides;

    const prevIndex = currentSlide;
    const direction = index >= prevIndex ? 'forward' : 'backward';

    // Deck mode with WebGL Circle Reveal Transition & GSAP Stagger
    if (currentMode === 'deck' && smooth && prevIndex !== index && circleRevealController && circleRevealController.supported) {
      isTransitioning = true;

      circleRevealController.reveal({
        direction,
        duration: 1150,
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
          animateSlideEntrance(index);
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
    animateSlideEntrance(index);

    if (currentMode === 'scroll') {
      const target = document.getElementById(`slide-${index}`);
      if (target) {
        if (lenis) {
          lenis.scrollTo(target, { offset: -60, duration: 1.15 });
        } else {
          target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        }
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

  /* ── 8. SCROLL OBSERVER & GSAP SCROLLTRIGGER (Scroll Mode) ── */
  function onScrollSlideActive(idx, title) {
    if (currentMode !== 'scroll') return;
    currentSlide = idx;
    if (crumbCurrent) crumbCurrent.textContent = String(idx).padStart(2, '0');
    if (crumbName) crumbName.textContent = title;
    if (slideTitles[idx]) document.title = slideTitles[idx];

    tmuxTabs.forEach((tab) => {
      const target = parseInt(tab.getAttribute('data-go'), 10);
      if (target === idx) {
        tab.classList.add('is-active');
        updateDockPill(tab);
      } else {
        tab.classList.remove('is-active');
      }
    });

    if (idx === 1) {
      animateCounters();
      if (heroTerminal) heroTerminal.start();
    }
  }

  function initScrollTriggers() {
    if (currentMode !== 'scroll') return;

    if (hasGSAP && hasScrollTrigger && !prefersReducedMotion) {
      ScrollTrigger.getAll().forEach(st => st.kill());

      slides.forEach((slide) => {
        const idx = parseInt(slide.getAttribute('data-slide-index'), 10);
        const title = slide.getAttribute('data-slide-title') || '';

        ScrollTrigger.create({
          trigger: slide,
          start: "top 45%",
          end: "bottom 45%",
          onEnter: () => onScrollSlideActive(idx, title),
          onEnterBack: () => onScrollSlideActive(idx, title),
        });

        const cards = slide.querySelectorAll('.stack-card, .timeline-card, .cert-card, .edu-timeline-card, .metric-card, .exp-log-card, .cert-preview-box, .contact-channels-card, .contact-form-pane');
        if (cards.length) {
          gsap.fromTo(cards, 
            { opacity: 0, y: 22 },
            {
              opacity: 1,
              y: 0,
              duration: 0.45,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: {
                trigger: slide,
                start: "top 75%",
                toggleActions: "play none none none"
              }
            }
          );
        }
      });
    } else if ('IntersectionObserver' in window) {
      const scrollObserver = new IntersectionObserver((entries) => {
        if (currentMode !== 'scroll') return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-slide-index'), 10);
            const title = entry.target.getAttribute('data-slide-title') || '';
            if (idx) onScrollSlideActive(idx, title);
          }
        });
      }, { threshold: 0.35 });

      slides.forEach((slide) => scrollObserver.observe(slide));
    }
  }

  /* ── 9. DECK MODE VELOCITY-GATED WHEEL GESTURE ── */
  let wheelAccumulator = 0;
  let wheelCooldown = false;
  const WHEEL_THRESHOLD = 52;

  function handleDeckWheel(e) {
    if (currentMode !== 'deck' || isTransitioning || wheelCooldown) return;

    const activeSlide = document.querySelector('.deck-slide.is-active');
    if (!activeSlide) return;

    // Check if slide can scroll internally
    const isScrollable = activeSlide.scrollHeight > activeSlide.clientHeight + 4;
    if (isScrollable) {
      const atBottom = activeSlide.scrollTop + activeSlide.clientHeight >= activeSlide.scrollHeight - 6;
      const atTop = activeSlide.scrollTop <= 6;

      // Allow natural inner scroll unless boundary is reached
      if (e.deltaY > 0 && !atBottom) {
        wheelAccumulator = 0;
        return;
      }
      if (e.deltaY < 0 && !atTop) {
        wheelAccumulator = 0;
        return;
      }
    }

    // Accumulate wheel delta for slide flip
    wheelAccumulator += e.deltaY;

    if (Math.abs(wheelAccumulator) >= WHEEL_THRESHOLD) {
      const dir = wheelAccumulator > 0 ? 1 : -1;
      wheelAccumulator = 0;
      wheelCooldown = true;
      setTimeout(() => { wheelCooldown = false; }, 850);

      if (dir > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }

  window.addEventListener('wheel', handleDeckWheel, { passive: true });

  /* ── 10. PROJECT WORKBENCH TAB SWITCHER (Slide 3 with GSAP Crossfade) ── */
  projectTabs.forEach((row) => {
    row.addEventListener('click', () => {
      const targetId = row.getAttribute('data-target');
      if (row.classList.contains('is-selected')) return;

      projectTabs.forEach((r) => {
        r.classList.remove('is-selected');
        r.setAttribute('aria-selected', 'false');
      });
      row.classList.add('is-selected');
      row.setAttribute('aria-selected', 'true');

      projectPanels.forEach((panel) => {
        if (panel.id === targetId) {
          panel.classList.add('is-active');
          if (hasGSAP && !prefersReducedMotion) {
            gsap.fromTo(panel, 
              { opacity: 0, x: 10 }, 
              { opacity: 1, x: 0, duration: 0.28, ease: "power2.out" }
            );
          }
        } else {
          panel.classList.remove('is-active');
        }
      });
    });
  });

  /* ── 11. MAGNETIC MACOS DOCK & TRAFFIC LIGHT PHYSICS ── */
  function initMagneticDock() {
    if (!hasGSAP || prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const magneticElements = document.querySelectorAll('.tmux-tab, .dock-nav-btn, .term-dot');
    magneticElements.forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.25, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.25, ease: "power3.out" });

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        xTo(relX * 0.2);
        yTo(relY * 0.2);
      });

      el.addEventListener('mouseleave', () => {
        xTo(0);
        yTo(0);
      });
    });
  }

  /* ── 12. THEME TOGGLE ── */
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

  /* ── 13. STAT COUNTER TICK ANIMATION (Slide 1 with GSAP Precision) ── */
  let countersAnimated = false;
  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    const counters = document.querySelectorAll('.metric-num[data-target]');
    counters.forEach((el) => {
      const target = parseFloat(el.getAttribute('data-target'));
      if (isNaN(target)) return;

      if (hasGSAP && !prefersReducedMotion) {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 1.3,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(obj.val);
          },
          onComplete: () => {
            el.textContent = target;
          }
        });
      } else {
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
      }
    });
  }

  /* ── 14. FORMSPREE AJAX SUBMISSION (Slide 7) ── */
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

  /* ── 15. PROJECT WORKBENCH SELECTION HELPER ── */
  function selectProjectTab(targetId) {
    goToSlide(3);
    setTimeout(() => {
      const row = document.querySelector(`.docker-row[data-target="${targetId}"]`);
      if (row) {
        projectTabs.forEach((r) => {
          r.classList.remove('is-selected');
          r.setAttribute('aria-selected', 'false');
        });
        row.classList.add('is-selected');
        row.setAttribute('aria-selected', 'true');

        projectPanels.forEach((panel) => {
          if (panel.id === targetId) {
            panel.classList.add('is-active');
            if (hasGSAP && !prefersReducedMotion) {
              gsap.fromTo(panel, 
                { opacity: 0, x: 10 }, 
                { opacity: 1, x: 0, duration: 0.28, ease: "power2.out" }
              );
            }
          } else {
            panel.classList.remove('is-active');
          }
        });
        showToast(`✔ Inspected ${row.querySelector('.ps-name')?.textContent || 'Project'}`);
      }
    }, 200);
  }

  window.selectProjectTab = selectProjectTab;

  /* ── 16. COMMAND PALETTE INITIALIZATION (⌘K) ── */
  const cmdPaletteModal = document.getElementById('cmd-palette-modal');
  let cmdPalette = null;

  if (cmdPaletteModal) {
    cmdPalette = new CommandPaletteController(cmdPaletteModal, {
      triggerBtn: document.getElementById('cmd-palette-btn'),
      getItems: () => [
        // Chapters (1-7)
        { category: 'Chapters', title: 'CH.01 // boot.sh', subtitle: 'Identity & Metrics Overview', icon: '01', badge: 'Jump ↵', keywords: 'hero identity bio 1 boot', action: () => goToSlide(1) },
        { category: 'Chapters', title: 'CH.02 // cluster-spec.yaml', subtitle: 'Multi-Cloud Runtime Stack', icon: '02', badge: 'Jump ↵', keywords: 'stack aws azure k8s terraform 2 cluster', action: () => goToSlide(2) },
        { category: 'Chapters', title: 'CH.03 // projects.docker', subtitle: 'Shipped SRE Projects Workbench', icon: '03', badge: 'Jump ↵', keywords: 'projects case study docker workbench 3', action: () => goToSlide(3) },
        { category: 'Chapters', title: 'CH.04 // deploy.log', subtitle: 'Infosys Springboard Internship Experience', icon: '04', badge: 'Jump ↵', keywords: 'experience infosys work internship 4 deploy', action: () => goToSlide(4) },
        { category: 'Chapters', title: 'CH.05 // registry.auth', subtitle: '6x Cloud Certs & Oracle Global Top 500', icon: '05', badge: 'Jump ↵', keywords: 'certs certifications oracle credentials 5 auth', action: () => goToSlide(5) },
        { category: 'Chapters', title: 'CH.06 // build-history', subtitle: 'Education & Core Academic Rigor', icon: '06', badge: 'Jump ↵', keywords: 'education college university btech degree 6 build', action: () => goToSlide(6) },
        { category: 'Chapters', title: 'CH.07 // ssh-session', subtitle: 'Contact, Direct Channels & Transmission', icon: '07', badge: 'Jump ↵', keywords: 'contact email linkedin message ssh 7 connect', action: () => goToSlide(7) },

        // Shipped Projects (Direct Workbench Jumps)
        { category: 'Projects', title: 'aws/support-eng-simulation', subtitle: 'Cloud Support Engineering Simulator', icon: 'AWS', badge: 'Inspect ↵', keywords: 'aws ec2 simulation support ticket project 1', action: () => selectProjectTab('case-1') },
        { category: 'Projects', title: 'ecs/observability-fargate', subtitle: 'ECS Fargate + Prometheus + Grafana Observability', icon: 'ECS', badge: 'Inspect ↵', keywords: 'ecs fargate terraform prometheus grafana project 2', action: () => selectProjectTab('case-2') },
        { category: 'Projects', title: 'gitops/ai-test-generator', subtitle: 'AI Test Generator & GitOps Pipeline (ArgoCD)', icon: 'K8S', badge: 'Inspect ↵', keywords: 'gitops argocd kubernetes groq ai project 3', action: () => selectProjectTab('case-3') },
        { category: 'Projects', title: 'sre/java-self-healing', subtitle: 'Self-Healing Java Microservice on AWS (5 layers)', icon: 'SRE', badge: 'Inspect ↵', keywords: 'java self-healing resilience snyk project 4', action: () => selectProjectTab('case-4') },
        { category: 'Projects', title: 'azure/patient-triage', subtitle: 'Clinical AI Patient Triage on Azure + GPT-4o', icon: 'AZR', badge: 'Inspect ↵', keywords: 'azure openai patient triage healthcare project 5', action: () => selectProjectTab('case-5') },
        { category: 'Projects', title: 'aws/bookstore-serverless', subtitle: 'Bookstore Serverless Architecture on AWS', icon: 'SRV', badge: 'Inspect ↵', keywords: 'serverless lambda api gateway mongodb project 6', action: () => selectProjectTab('case-6') },
        { category: 'Projects', title: 'aws/compliance-vendor-risk', subtitle: 'Cloud Compliance & Vendor Risk Management Lab (CIS 1.4)', icon: 'GRC', badge: 'Inspect ↵', keywords: 'cloud compliance vendor risk tprm security hub aws config cis benchmark project 7', action: () => selectProjectTab('case-7') },
        { category: 'Projects', title: 'secops/vault-wazuh-threat-lab', subtitle: 'Identity Threat Detection & Response Lab (Vault + Wazuh on AWS)', icon: 'SOC', badge: 'Inspect ↵', keywords: 'identity threat detection response vault wazuh siem mitre attack soc jit iam project 8', action: () => selectProjectTab('case-8') },

        // Quick Actions
        { category: 'Actions', title: 'Download Official Résumé (PDF)', subtitle: 'Sannidhi_Sriram_CV.pdf', icon: '📄', badge: 'Download ↵', keywords: 'cv resume pdf download', action: () => {
          showToast('✔ Downloading official Résumé (PDF)...');
          window.open('assets/media/Sannidhi_Sriram_CV.pdf', '_blank');
        }},
        { category: 'Actions', title: 'Copy Email Address', subtitle: 'sannidhisriram8@gmail.com', icon: '✉', badge: 'Copy ↵', keywords: 'email contact mail', action: () => {
          navigator.clipboard.writeText('sannidhisriram8@gmail.com');
          showToast('✔ Email copied to clipboard: sannidhisriram8@gmail.com');
        }},
        { category: 'Actions', title: 'Copy LinkedIn Profile Link', subtitle: 'linkedin.com/in/sannidhi-durga-pavan-sriram-07153a27a', icon: '🔗', badge: 'Copy ↵', keywords: 'linkedin profile social', action: () => {
          navigator.clipboard.writeText('https://www.linkedin.com/in/sannidhi-durga-pavan-sriram-07153a27a');
          showToast('✔ LinkedIn profile link copied!');
        }},
        { category: 'Actions', title: 'Copy GitHub Profile Link', subtitle: 'github.com/SannidhiSriram-06', icon: '🐙', badge: 'Copy ↵', keywords: 'github repo code', action: () => {
          navigator.clipboard.writeText('https://github.com/SannidhiSriram-06');
          showToast('✔ GitHub profile link copied!');
        }},
        { category: 'Actions', title: 'Toggle View Mode', subtitle: 'Switch between Deck Presentation and Continuous Scroll', icon: '◫', badge: 'Toggle ↵', keywords: 'view mode deck scroll switch', action: () => {
          applyMode(currentMode === 'deck' ? 'scroll' : 'deck');
          showToast(`✔ Switched to ${currentMode === 'deck' ? 'Deck Mode' : 'Continuous Scroll'}`);
        }},
        { category: 'Actions', title: 'Toggle Color Theme', subtitle: 'Switch between Dark and Light mode', icon: '◑', badge: 'Toggle ↵', keywords: 'theme dark light color', action: () => {
          toggleTheme();
          showToast('✔ Color theme toggled');
        }}
      ]
    });
  }

  /* ── 17. INITIALIZATION ── */
  applyMode(currentMode);
  goToSlide(1, false);
  initMagneticDock();

  // Initial pill positioning & MagicUI terminal boot sequence
  setTimeout(() => {
    const activeTab = document.querySelector('.tmux-tab.is-active');
    if (activeTab) updateDockPill(activeTab);
    if (heroTerminal) heroTerminal.start(true);
  }, 220);
});
