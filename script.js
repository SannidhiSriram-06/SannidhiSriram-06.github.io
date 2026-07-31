/* ── macOS Live Menu Bar Clock ───────────────────────────── */
function updateMacClock() {
  const clockEl = document.getElementById('mac-clock');
  if (!clockEl) return;
  const now = new Date();
  const options = { weekday: 'short', hour: 'numeric', minute: '2-digit', hour12: true };
  clockEl.textContent = now.toLocaleDateString('en-US', options).replace(',', '');
}
setInterval(updateMacClock, 1000);
updateMacClock();

/* ── Theme Toggle (Light / Dark mode) ─────────────────────── */
const themeToggleBtn = document.getElementById('theme-toggle');
const storedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (storedTheme) {
  document.documentElement.setAttribute('data-theme', storedTheme);
} else if (systemPrefersDark) {
  document.documentElement.setAttribute('data-theme', 'dark');
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

/* ── Progress bar ─────────────────────────────────────────── */
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  bar.style.width = (scrollY / (document.body.scrollHeight - innerHeight) * 100) + '%';
}, { passive: true });

/* ── Nav & Dock scroll states ─────────────────────────────── */
const nav = document.getElementById('nav');
const dockContainer = document.getElementById('mac-dock-container');
const heroName = document.querySelector('.hero-name');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const threshold = heroName ? heroName.getBoundingClientRect().bottom < 80 : currentScrollY > 40;
  if (nav) nav.classList.toggle('scrolled', threshold);
  lastScrollY = currentScrollY;
}, { passive: true });

/* ── Active nav link ──────────────────────────────────────── */
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting)
      document.querySelectorAll('.nav-links a').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`)
      );
  });
}, { rootMargin: '-35% 0px -60% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionObs.observe(s));

/* ── Scroll reveal ────────────────────────────────────────── */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.in)')];
    const idx = siblings.indexOf(entry.target);
    setTimeout(() => entry.target.classList.add('in'), Math.min(idx * 80, 320));
    revealObs.unobserve(entry.target);
  });
}, { threshold: 0.06 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ── Stat counters ────────────────────────────────────────── */
const countObs = new IntersectionObserver(entries => {
  entries.forEach(({ isIntersecting, target: el }) => {
    if (!isIntersecting) return;
    const target = +el.dataset.count;
    const t0 = performance.now();
    const tick = t => {
      const p = Math.min((t - t0) / 1200, 1);
      el.textContent = Math.round((1 - (1 - p) ** 3) * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    countObs.unobserve(el);
  });
}, { threshold: 0.7 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

/* ── Swiper 3D Coverflow carousels ────────────────────────── */
const swiperConfig = {
  effect: 'coverflow',
  grabCursor: true,
  centeredSlides: true,
  slidesPerView: 'auto',
  loop: false,
  coverflowEffect: {
    rotate: 0,
    stretch: 0,
    depth: 100,
    modifier: 2.5,
    slideShadows: false,
  },
  pagination: { el: '.swiper-pagination', clickable: true, dynamicBullets: false },
  navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
};

const projSwiper = new Swiper('.proj-swiper', {
  ...swiperConfig,
  pagination: { el: '.proj-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.proj-swiper .swiper-button-next', prevEl: '.proj-swiper .swiper-button-prev' },
});

const certSwiper = new Swiper('.cert-swiper', {
  ...swiperConfig,
  pagination: { el: '.cert-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.cert-swiper .swiper-button-next', prevEl: '.cert-swiper .swiper-button-prev' },
});

function navigateToTarget(type, value) {
  if (type === 'cert') {
    const certSection = document.getElementById('certifications');
    if (certSection) {
      certSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof value === 'number' && certSwiper) {
      setTimeout(() => {
        certSwiper.slideTo(value, 600);
      }, 300);
    }
  } else if (type === 'project') {
    const projSection = document.getElementById('projects');
    if (projSection) {
      projSection.scrollIntoView({ behavior: 'smooth' });
    }
    if (typeof value === 'number' && projSwiper) {
      setTimeout(() => {
        projSwiper.slideTo(value, 600);
      }, 300);
    }
  } else if (type === 'section') {
    const secEl = document.getElementById(value);
    if (secEl) {
      secEl.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

/* ── Side scroll navigation ───────────────────────────────── */
const sideItems = document.querySelectorAll('.sn-item[data-section]');
const sideObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      sideItems.forEach(item =>
        item.classList.toggle('sn-active', item.dataset.section === e.target.id)
      );
    }
  });
}, { rootMargin: '-30% 0px -50% 0px' });
document.querySelectorAll('section[id]').forEach(s => sideObs.observe(s));

/* ── Feature 4: macOS Notification Toast System ────────────── */
function showMacToast(title, message, icon = '') {
  const container = document.getElementById('mac-toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'mac-toast liquid-glass';
  toast.innerHTML = `
    <div class="mac-toast-icon">${icon}</div>
    <div>
      <div class="mac-toast-title">${title}</div>
      <div class="mac-toast-msg">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// Toast listener for CV Download & Contact Form
document.querySelectorAll('a[download]').forEach(btn => {
  btn.addEventListener('click', () => {
    showMacToast('Resume Downloaded', 'Sannidhi_Sriram_CV.pdf downloaded successfully.', '📄');
  });
});

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', () => {
    showMacToast('Message Sent', 'Thank you! Sannidhi will get back to you shortly.', '✉️');
  });
}

/* ── Feature 1: Interactive Terminal CLI ───────────────────── */
const cliForm = document.getElementById('cli-form');
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');

function executeCliCommand(cmdName) {
  if (!cliInput || !cliForm) return;
  cliInput.value = cmdName;
  const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
  cliForm.dispatchEvent(submitEvent);
}

const cliCommands = {
  help: () => `Available Commands (click command or type below):
  • <span class="cli-clickable" data-type="cmd" data-val="help">help</span>       - Display CLI manual
  • <span class="cli-clickable" data-type="cmd" data-val="skills">skills</span>     - List cloud & DevOps technical stack
  • <span class="cli-clickable" data-type="cmd" data-val="projects">projects</span>   - View featured architecture projects
  • <span class="cli-clickable" data-type="cmd" data-val="certs">certs</span>      - Show Oracle & Cloud credentials
  • <span class="cli-clickable" data-type="cmd" data-val="cv">cv</span>         - Download curriculum vitae (PDF)
  • <span class="cli-clickable" data-type="cmd" data-val="clear">clear</span>      - Clear terminal logs`,

  skills: () => `<div class="cli-output-list">
  <div>Cloud & DevOps Technical Stack (Click any skill to scroll):</div>
  <div>
  <span class="cli-clickable" data-type="section" data-val="about">AWS</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Azure</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Docker</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Kubernetes</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Terraform</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Jenkins</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">GitHub Actions</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">ArgoCD</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Helm</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Grafana</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Prometheus</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Python</span> · 
  <span class="cli-clickable" data-type="section" data-val="about">Bash</span>
  </div>
</div>`,

  projects: () => `<div class="cli-output-list">
  <div>Featured Projects (Click to scroll down):</div>
  <div class="cli-clickable" data-type="project" data-val="0">1. Cloud Support & Customer Engineering Simulation</div>
  <div class="cli-clickable" data-type="project" data-val="1">2. Cloud Security Observability Stack (ECS Fargate)</div>
  <div class="cli-clickable" data-type="project" data-val="2">3. AI Test Generator & GitOps Pipeline</div>
  <div class="cli-clickable" data-type="project" data-val="3">4. Self-Healing Microservice on AWS</div>
  <div class="cli-clickable" data-type="project" data-val="4">5. AI Patient Triage System on Azure</div>
  <div class="cli-clickable" data-type="project" data-val="5">6. Bookstore Serverless Architecture on AWS</div>
</div>`,

  certs: () => `<div class="cli-output-list">
  <div>Cloud Credentials (Click to scroll down):</div>
  <div class="cli-clickable" data-type="cert" data-val="0">• OCI DevOps Professional 2025</div>
  <div class="cli-clickable" data-type="cert" data-val="1">• OCI Observability Professional 2025</div>
  <div class="cli-clickable" data-type="cert" data-val="2">• OCI Multicloud Architect 2025</div>
  <div class="cli-clickable" data-type="cert" data-val="3">• OCI Generative AI Professional 2025</div>
  <div class="cli-clickable" data-type="cert" data-val="4">• Azure AI Fundamentals (AI-900)</div>
  <div class="cli-clickable" data-type="cert" data-val="5">• Azure Fundamentals (AZ-900)</div>
  <div class="cli-clickable" data-type="section" data-val="achievement">• Oracle Race to Certification 2025 (Global Top 500)</div>
</div>`,

  cv: () => {
    const link = document.createElement('a');
    link.href = 'assets/media/Sannidhi_Sriram_CV.pdf';
    link.download = true;
    link.click();
    return `Downloading Sannidhi_Sriram_CV.pdf...`;
  },
  kubectl: () => `k8s-cluster status: ACTIVE | pods: 14/14 Running | ingress: nginx-alb | gitops: ArgoCD Synced`,
  clear: () => {
    cliOutput.innerHTML = '';
    return null;
  }
};

const directSearchAliases = [
  { keywords: ['az900', 'az 900', 'az-900', 'azure fundamentals'], type: 'cert', val: 5, name: 'Azure Fundamentals (AZ-900)' },
  { keywords: ['ai900', 'ai 900', 'ai-900', 'azure ai'], type: 'cert', val: 4, name: 'Azure AI Fundamentals (AI-900)' },
  { keywords: ['oci devops', 'devops cert'], type: 'cert', val: 0, name: 'OCI DevOps Professional 2025' },
  { keywords: ['oci observability', 'observability cert'], type: 'cert', val: 1, name: 'OCI Observability Professional 2025' },
  { keywords: ['oci multicloud', 'multicloud'], type: 'cert', val: 2, name: 'OCI Multicloud Architect 2025' },
  { keywords: ['oci gen ai', 'gen ai', 'generative ai cert'], type: 'cert', val: 3, name: 'OCI Generative AI Professional 2025' },
  { keywords: ['oracle race', 'top 500', 'top500', 'global top 500'], type: 'section', val: 'achievement', name: 'Oracle Race to Certification 2025 (Global Top 500)' },
  { keywords: ['support ticket', 'client vpn'], type: 'project', val: 0, name: 'Cloud Support & Customer Engineering Simulation' },
  { keywords: ['fargate', 'security observability'], type: 'project', val: 1, name: 'Cloud Security Observability Stack on ECS Fargate' },
  { keywords: ['ai test', 'gitops', 'jenkins'], type: 'project', val: 2, name: 'AI Test Generator & GitOps Pipeline' },
  { keywords: ['self-healing', 'self healing'], type: 'project', val: 3, name: 'Self-Healing Microservice on AWS' },
  { keywords: ['triage', 'patient triage'], type: 'project', val: 4, name: 'AI Patient Triage System on Azure' },
  { keywords: ['bookstore', 'serverless'], type: 'project', val: 5, name: 'Bookstore Microservice Architecture on AWS' }
];

if (cliForm && cliInput && cliOutput) {
  // Delegate clicks in terminal output
  cliOutput.addEventListener('click', e => {
    const clickable = e.target.closest('.cli-clickable');
    if (!clickable) return;
    const type = clickable.dataset.type;
    const val = clickable.dataset.val;

    if (type === 'cmd') {
      executeCliCommand(val);
    } else if (type === 'cert' || type === 'project') {
      navigateToTarget(type, parseInt(val, 10));
    } else if (type === 'section') {
      navigateToTarget(type, val);
    }
  });

  cliForm.addEventListener('submit', e => {
    e.preventDefault();
    const rawCmd = cliInput.value.trim().toLowerCase();
    if (!rawCmd) return;

    // Log command
    const cmdLine = document.createElement('div');
    cmdLine.className = 'cli-line user-cmd';
    cmdLine.textContent = `sriram@macbook-pro ~ % ${rawCmd}`;
    cliOutput.appendChild(cmdLine);

    // Process output
    let result = '';
    let isMatch = false;

    if (cliCommands[rawCmd]) {
      result = cliCommands[rawCmd]();
      isMatch = true;
    } else {
      // Check direct search aliases
      const match = directSearchAliases.find(item =>
        item.keywords.some(k => rawCmd.includes(k))
      );

      if (match) {
        result = `Navigating to <span class="cli-clickable" data-type="${match.type}" data-val="${match.val}">${match.name}</span>...`;
        navigateToTarget(match.type, match.val);
        isMatch = true;
      } else {
        result = `zsh: command not found: ${rawCmd}. Type <span class="cli-clickable" data-type="cmd" data-val="help">'help'</span> for available commands.`;
      }
    }

    if (result) {
      const resLine = document.createElement('div');
      resLine.className = `cli-line ${isMatch ? 'response' : 'error'}`;
      resLine.innerHTML = result;
      cliOutput.appendChild(resLine);
    }

    cliInput.value = '';
    cliOutput.scrollTop = cliOutput.scrollHeight;
  });
}

/* ── Feature 2: macOS Spotlight Search (Cmd + K) ───────────── */
const spotlightModal = document.getElementById('spotlight-modal');
const spotlightToggle = document.getElementById('spotlight-toggle');
const spotlightInput = document.getElementById('spotlight-input');
const spotlightResults = document.getElementById('spotlight-results');

const searchableItems = [
  { title: 'Cloud Support Ticket Simulation', cat: 'Project', section: '#projects' },
  { title: 'Cloud Security Observability Stack on ECS Fargate', cat: 'Project', section: '#projects' },
  { title: 'AI Test Generator & GitOps Pipeline', cat: 'Project', section: '#projects' },
  { title: 'Self-Healing Microservice on AWS', cat: 'Project', section: '#projects' },
  { title: 'AI Patient Triage System on Azure', cat: 'Project', section: '#projects' },
  { title: 'Bookstore Serverless Architecture on AWS', cat: 'Project', section: '#projects' },
  { title: 'Oracle Race to Certification 2025 (Global Top 500)', cat: 'Achievement', section: '#achievement' },
  { title: 'OCI DevOps Professional 2025', cat: 'Credential', section: '#certifications' },
  { title: 'OCI Observability Professional 2025', cat: 'Credential', section: '#certifications' },
  { title: 'OCI Multicloud Architect 2025', cat: 'Credential', section: '#certifications' },
  { title: 'Infosys Springboard AI Lead Internship', cat: 'Experience', section: '#experience' }
];

const openSpotlight = () => {
  if (!spotlightModal) return;
  spotlightModal.classList.add('open');
  setTimeout(() => spotlightInput.focus(), 100);
};

const closeSpotlight = () => {
  if (!spotlightModal) return;
  spotlightModal.classList.remove('open');
  spotlightInput.value = '';
};

if (spotlightToggle) spotlightToggle.addEventListener('click', openSpotlight);

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    spotlightModal && spotlightModal.classList.contains('open') ? closeSpotlight() : openSpotlight();
  }
  if (e.key === 'Escape' && spotlightModal && spotlightModal.classList.contains('open')) {
    closeSpotlight();
  }
});

if (spotlightModal) {
  spotlightModal.addEventListener('click', e => {
    if (e.target === spotlightModal) closeSpotlight();
  });
}

if (spotlightInput && spotlightResults) {
  spotlightInput.addEventListener('input', e => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      spotlightResults.innerHTML = '<div class="spotlight-hint">Type to search projects, certifications, or experience...</div>';
      return;
    }
    const matches = searchableItems.filter(item => item.title.toLowerCase().includes(query) || item.cat.toLowerCase().includes(query));
    if (matches.length === 0) {
      spotlightResults.innerHTML = '<div class="spotlight-hint">No matching items found</div>';
      return;
    }
    spotlightResults.innerHTML = matches.map(item => `
      <div class="spotlight-item" data-link="${item.section}">
        <span class="spotlight-item-title">${item.title}</span>
        <span class="spotlight-item-cat">${item.cat}</span>
      </div>
    `).join('');

    spotlightResults.querySelectorAll('.spotlight-item').forEach(el => {
      el.addEventListener('click', () => {
        const targetSection = el.dataset.link;
        closeSpotlight();
        document.querySelector(targetSection)?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  });
}

/* ── Feature 3: macOS Finder Project Detail Modal ──────────── */
const projectModal = document.getElementById('project-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBodyContent = document.getElementById('modal-body-content');
const modalWindowTitle = document.getElementById('modal-window-title');

const openProjectModal = (title, desc, tags, repoUrl) => {
  if (!projectModal || !modalBodyContent) return;
  modalWindowTitle.textContent = `Finder — ${title}`;
  modalBodyContent.innerHTML = `
    <h2 class="modal-section-title">${title}</h2>
    <p class="modal-section-desc">${desc}</p>
    <h3 style="font-size:14px; font-weight:700; text-transform:uppercase; margin-top:20px; color:var(--text);">Tech Stack &amp; Architecture Spec</h3>
    <div class="modal-tech-list">
      ${tags.map(t => `<span class="proj-tags"><span>${t}</span></span>`).join('')}
    </div>
    <div style="margin-top:32px; display:flex; gap:12px;">
      <a href="${repoUrl}" target="_blank" rel="noopener" class="btn-primary liquid-glass">Open GitHub Repository ↗</a>
    </div>
  `;
  projectModal.classList.add('open');
};

const closeProjectModal = () => {
  if (projectModal) projectModal.classList.remove('open');
};

if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeProjectModal);
if (projectModal) {
  projectModal.addEventListener('click', e => {
    if (e.target === projectModal) closeProjectModal();
  });
}
