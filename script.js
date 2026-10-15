/* Theme toggle, contact form, projects accordion and nav pill.
   (Diagrams, terminal and the visual extras live in js/.)
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
