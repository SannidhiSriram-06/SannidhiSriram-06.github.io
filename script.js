/* Theme toggle, architecture-diagram dialog and the contact form.
   No global keyboard shortcuts: every control is a normal link or button. */

(() => {
  'use strict';

  const root = document.documentElement;

  /* ── Theme ─────────────────────────────────────────────────────────── */
  const toggle = document.getElementById('theme-toggle');

  function applyTheme(theme, save) {
    root.setAttribute('data-theme', theme);
    if (toggle) {
      const dark = theme === 'dark';
      toggle.querySelector('.theme-toggle-label').textContent = dark ? 'Light mode' : 'Dark mode';
    }
    if (save) {
      try { localStorage.setItem('theme', theme); } catch (e) { /* private mode: ignore */ }
    }
  }

  applyTheme(root.getAttribute('data-theme') || 'light', false);
  toggle?.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
  });

  /* ── Diagram dialog ────────────────────────────────────────────────── */
  const dialog = document.getElementById('diagram-dialog');
  const frame = document.getElementById('diagram-frame');
  const dialogTitle = document.getElementById('diagram-title');

  if (dialog && frame && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-diagram]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dialogTitle.textContent = btn.dataset.title + ': architecture';
        frame.title = btn.dataset.title + ' architecture diagram';
        // The diagram pages read their theme from this key (same origin).
        try { localStorage.setItem('archify-theme', root.getAttribute('data-theme')); } catch (e) { }
        frame.src = 'assets/diagrams/' + btn.dataset.diagram + '.html';
        dialog.showModal();
      });
    });
    const close = () => dialog.close();
    document.getElementById('diagram-close').addEventListener('click', close);
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
    dialog.addEventListener('close', () => { frame.src = 'about:blank'; });
  } else {
    // No <dialog> support: open the diagram on its own page instead.
    document.querySelectorAll('[data-diagram]').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.open('assets/diagrams/' + btn.dataset.diagram + '.html', '_blank', 'noopener');
      });
    });
  }

  /* ── Contact form ──────────────────────────────────────────────────── */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const submit = document.getElementById('form-submit');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';

    const MSG = { 'cf-name': 'Enter your name.', 'cf-email': 'Enter a valid email address.', 'cf-message': 'Write a message.' };
    const bad = [...form.querySelectorAll('[required]')].filter((el) => !el.checkValidity());
    form.querySelectorAll('[required]').forEach((el) => {
      const err = document.getElementById(el.id + '-err');
      const isBad = bad.includes(el);
      el.toggleAttribute('aria-invalid', isBad);
      if (isBad) el.setAttribute('aria-invalid', 'true');
      if (err) { err.hidden = !isBad; err.textContent = isBad ? MSG[el.id] : ''; }
    });
    if (bad.length) {
      status.textContent = 'Please fix the ' + (bad.length === 1 ? 'field' : 'fields') + ' marked above.';
      bad[0].focus();
      return;
    }

    submit.disabled = true;
    status.textContent = 'Sending...';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      status.textContent = 'Sent. I will reply by email.';
    } catch (err) {
      status.textContent = 'That did not send. Please email sannidhisriram8@gmail.com instead.';
    } finally {
      submit.disabled = false;
    }
  });

  /* ── GitHub contribution calendar ──────────────────────────────────── */
  const panel = document.getElementById('activity-panel');
  if (panel) {
    const statusEl = document.getElementById('activity-status');
    const scrollEl = document.getElementById('activity-scroll');
    const monthsEl = document.getElementById('activity-months');
    const gridEl = document.getElementById('activity-grid');
    const footEl = document.getElementById('activity-foot');
    const totalEl = document.getElementById('activity-total');
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const CELL = 0.8 + 0.2; // rem: cell width plus gap, matches the CSS

    function render(data, saved) {
      const days = data.contributions;
      const first = new Date(days[0].date + 'T00:00:00Z');
      const pad = first.getUTCDay(); // Sunday-first rows, like GitHub
      gridEl.replaceChildren();
      monthsEl.replaceChildren();
      for (let i = 0; i < pad; i++) gridEl.appendChild(document.createElement('span'));
      let total = 0, lastMonth = -1;
      days.forEach((d, i) => {
        total += d.count;
        const cell = document.createElement('span');
        cell.className = 'cell l' + d.level;
        const label = d.count + (d.count === 1 ? ' contribution on ' : ' contributions on ') + d.date;
        cell.title = label;
        gridEl.appendChild(cell);
        const m = new Date(d.date + 'T00:00:00Z').getUTCMonth();
        const col = Math.floor((i + pad) / 7);
        if (m !== lastMonth && (i === 0 || new Date(d.date + 'T00:00:00Z').getUTCDate() <= 7)) {
          lastMonth = m;
          const tag = document.createElement('span');
          tag.textContent = MONTHS[m];
          tag.style.left = col * CELL + 'rem';
          monthsEl.appendChild(tag);
        }
      });
      monthsEl.style.width = Math.ceil((days.length + pad) / 7) * CELL + 'rem';
      const count = (data.total && data.total.lastYear) || total;
      totalEl.textContent = count.toLocaleString('en-US') + ' contributions in the last year' +
        (saved ? ' (saved copy up to ' + days[days.length - 1].date + ')' : '');
      gridEl.setAttribute('aria-label', 'Contribution calendar: ' + totalEl.textContent);
      statusEl.hidden = true;
      scrollEl.hidden = false;
      footEl.hidden = false;
      scrollEl.scrollLeft = scrollEl.scrollWidth; // show the most recent weeks first
    }

    const LIVE = 'https://github-contributions-api.jogruber.de/v4/SannidhiSriram-06?y=last';
    const SNAPSHOT = 'assets/contributions.json';
    const load = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

    load(LIVE).then((d) => render(d, false), () => load(SNAPSHOT).then((d) => render(d, true))).catch(() => {
      statusEl.textContent = 'Could not load the contribution calendar. The profile link below has it.';
    });
  }

  /* ── Projects accordion: one open at a time, nothing removed ───────── */
  const projects = document.querySelectorAll('.project');
  projects.forEach((p, i) => {
    const h3 = p.querySelector('h3');
    const body = p.querySelector('.project-body');
    const links = p.querySelector('.project-links');
    if (!h3 || !body) return;
    const panel = document.createElement('div');
    const inner = document.createElement('div');
    panel.className = 'project-panel';
    panel.id = p.id + '-panel';
    inner.className = 'project-panel-inner';
    inner.append(body);
    if (links) inner.append(links);
    panel.append(inner);
    p.append(panel);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'project-toggle';
    btn.setAttribute('aria-controls', panel.id);
    btn.append(...h3.childNodes);
    h3.append(btn);

    const set = (open) => {
      p.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      inner.inert = !open;
    };
    p.projectSet = set;
    set(i === 0);
    btn.addEventListener('click', () => {
      const open = !p.classList.contains('is-open');
      projects.forEach((o) => o !== p && o.projectSet?.(false));
      set(open);
    });
  });
  // Deep links such as #p3 open that project.
  const openFromHash = () => {
    const t = document.getElementById(location.hash.slice(1));
    if (t?.projectSet) { projects.forEach((o) => o.projectSet?.(o === t)); }
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  /* ── Pill nav: sliding indicator follows the section in view ──────── */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    const pill = document.createElement('span');
    pill.className = 'nav-pill';
    pill.setAttribute('aria-hidden', 'true');
    nav.prepend(pill);

    const place = (link) => {
      pill.style.width = link.offsetWidth + 'px';
      pill.style.transform = 'translateX(' + link.offsetLeft + 'px)';
    };
    let current = null;
    const setActive = (link) => {
      if (!link || link === current) return;
      current = link;
      links.forEach((l) => (l === link ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
      place(link);
      // Move only the nav strip; scrollIntoView would also cancel the page's own smooth scroll.
      nav.scrollLeft = Math.max(0, link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2);
    };

    let lockUntil = 0;
    links.forEach((l) => l.addEventListener('click', () => { lockUntil = Date.now() + 900; setActive(l); }));
    const targets = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      if (Date.now() < lockUntil) return;
      entries.forEach((en) => {
        if (en.isIntersecting) setActive(links.find((l) => l.hash === '#' + en.target.id));
      });
    }, { rootMargin: '-35% 0px -65% 0px' }); // a thin band 35% down the viewport
    targets.forEach((t) => io.observe(t));
    window.addEventListener('resize', () => current && place(current));
    document.fonts?.ready.then(() => { current && place(current); });
    if (!current) setActive(links[0]);
    requestAnimationFrame(() => pill.classList.add('is-ready'));
  }

  /* ── Glass buttons: highlight follows the pointer ─────────────────── */
  document.querySelectorAll('.button, .theme-toggle').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', e.clientX - r.left + 'px');
      b.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });

})();
