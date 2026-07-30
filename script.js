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

  // Auto-hide Dock on downward scroll, reveal when scrolling up or near bottom
  if (dockContainer) {
    const isNearBottom = (window.innerHeight + currentScrollY) >= (document.body.offsetHeight - 120);
    if (currentScrollY > lastScrollY && currentScrollY > 150 && !isNearBottom) {
      dockContainer.classList.add('dock-hidden');
    } else {
      dockContainer.classList.remove('dock-hidden');
    }
  }
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

new Swiper('.proj-swiper', {
  ...swiperConfig,
  pagination: { el: '.proj-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.proj-swiper .swiper-button-next', prevEl: '.proj-swiper .swiper-button-prev' },
});

new Swiper('.cert-swiper', {
  ...swiperConfig,
  pagination: { el: '.cert-swiper .swiper-pagination', clickable: true },
  navigation: { nextEl: '.cert-swiper .swiper-button-next', prevEl: '.cert-swiper .swiper-button-prev' },
});

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
    showMacToast('Resume Downloaded', 'S_Sriram_CV.pdf downloaded successfully.', '📄');
  });
});

const contactForm = document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', () => {
    showMacToast('Message Sent', 'Thank you! Sriram will get back to you shortly.', '✉️');
  });
}

/* ── Feature 1: Interactive Terminal CLI ───────────────────── */
const cliForm = document.getElementById('cli-form');
const cliInput = document.getElementById('cli-input');
const cliOutput = document.getElementById('cli-output');

const cliCommands = {
  help: () => `Available Commands:
  • help           - Display CLI manual
  • skills         - List cloud & DevOps technical stack
  • projects       - View featured architecture projects
  • certs          - Show Oracle & Cloud credentials
  • cv             - Download curriculum vitae (PDF)
  • clear          - Clear terminal logs`,
  skills: () => `AWS · Azure · Docker · Kubernetes · Terraform · Jenkins · GitHub Actions · ArgoCD · Helm · Grafana · Prometheus · Python · Bash`,
  projects: () => `1. Cloud Support Ticket Simulation (AWS Client VPN / SSM)
2. Cloud Security Observability Stack (ECS Fargate / Grafana)
3. AI Test Generator & GitOps Pipeline (FastAPI / Jenkins / ArgoCD)
4. Self-Healing Microservice (AWS ASG / ALB / Terraform)
5. AI Patient Triage System (Azure OpenAI / App Service)
6. Bookstore Serverless Architecture (AWS Lambda / API Gateway)`,
  certs: () => `• OCI DevOps Professional 2025
• OCI Observability Professional 2025
• OCI Multicloud Architect 2025
• OCI Generative AI Professional 2025
• OCI AI Foundations Associate 2025
• Oracle Race to Certification 2025 (Global Top 500)`,
  cv: () => {
    const link = document.createElement('a');
    link.href = 'assets/media/S_Sriram_CV.pdf';
    link.download = true;
    link.click();
    return `Downloading S_Sriram_CV.pdf...`;
  },
  kubectl: () => `k8s-cluster status: ACTIVE | pods: 14/14 Running | ingress: nginx-alb | gitops: ArgoCD Synced`,
  clear: () => {
    cliOutput.innerHTML = '';
    return null;
  }
};

if (cliForm && cliInput && cliOutput) {
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
    if (cliCommands[rawCmd]) {
      result = cliCommands[rawCmd]();
    } else {
      result = `zsh: command not found: ${rawCmd}. Type 'help' for available commands.`;
    }

    if (result) {
      const resLine = document.createElement('div');
      resLine.className = `cli-line ${cliCommands[rawCmd] ? 'response' : 'error'}`;
      resLine.textContent = result;
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
