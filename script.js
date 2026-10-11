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
})();
