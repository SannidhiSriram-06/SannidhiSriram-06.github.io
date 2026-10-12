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
      toggle.setAttribute('aria-pressed', String(dark));
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

    const bad = [...form.querySelectorAll('[required]')].filter((el) => !el.checkValidity());
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    if (bad.length) {
      bad.forEach((el) => el.setAttribute('aria-invalid', 'true'));
      status.textContent = 'Please fill in your name, a valid email and a message.';
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

    function render(data) {
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
      totalEl.textContent = count.toLocaleString('en-US') + ' contributions in the last year';
      gridEl.setAttribute('aria-label', 'Contribution calendar: ' + totalEl.textContent);
      statusEl.hidden = true;
      scrollEl.hidden = false;
      footEl.hidden = false;
      scrollEl.scrollLeft = scrollEl.scrollWidth; // show the most recent weeks first
    }

    const LIVE = 'https://github-contributions-api.jogruber.de/v4/SannidhiSriram-06?y=last';
    const SNAPSHOT = 'assets/contributions.json';
    const load = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

    load(LIVE).catch(() => load(SNAPSHOT)).then(render).catch(() => {
      statusEl.textContent = 'Could not load the contribution calendar. The profile link below has it.';
    });
  }

  /* ── Highlight the project at the middle of the screen ─────────────── */
  const projects = document.querySelectorAll('.project');
  if (projects.length && 'IntersectionObserver' in window) {
    // A thin band across the vertical centre: whichever card crosses it is active.
    const band = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          projects.forEach((p) => p.classList.toggle('is-active', p === entry.target));
        }
      });
    }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 });
    projects.forEach((p) => band.observe(p));
    // Nothing is highlighted once the middle of the screen leaves the projects section.
    const work = document.getElementById('work');
    if (work) {
      new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) projects.forEach((p) => p.classList.remove('is-active'));
      }, { rootMargin: '-49% 0px -49% 0px', threshold: 0 }).observe(work);
    }
  }
})();
