/* A macOS-style terminal. Commands read the page itself, so the text never drifts from the real content.
   `replay wazuh` replays the real alerts from the identity lab; anything that is not a command goes to the Worker. */
import * as sfx from './sfx.js';

const term = document.getElementById('term');
if (term) {
  const screen = document.getElementById('term-screen');
  const form = document.getElementById('term-form');
  const input = document.getElementById('term-input');
  const live = document.getElementById('term-live');
  const REPO = 'https://github.com/SannidhiSriram-06/';
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const text = (sel) => document.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim() ?? '';

  /* ── Output ─────────────────────────────────────────────────────────── */
  function print(str = '', cls = '') {
    const line = document.createElement('div');
    line.className = 'line' + (cls ? ' t-' + cls : '');
    line.textContent = str;
    screen.append(line);
    while (screen.childElementCount > 600) screen.firstElementChild.remove();
    screen.scrollTop = screen.scrollHeight;
    return line;
  }
  function link(label, href) {
    const line = print('');
    const a = document.createElement('a');
    a.href = href;
    a.textContent = label;
    a.target = '_blank';
    a.rel = 'noopener';
    line.append(a);
  }
  const rows = (pairs) => pairs.forEach(([a, b]) => print(a.padEnd(28) + b));

  /* ── Project data, straight from the page ───────────────────────────── */
  const projects = [...document.querySelectorAll('.project')].map((p) => ({
    id: p.id,
    n: Number(p.id.slice(1)),
    title: p.querySelector('h3').textContent.replace(/\s+/g, ' ').trim(),
    meta: p.querySelector('.project-meta')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
    hook: p.querySelector('.project-hook')?.textContent.trim() ?? '',
    intro: p.querySelector('.project-text p')?.textContent.replace(/\s+/g, ' ').trim() ?? '',
    repos: [...p.querySelectorAll('.project-links a')].map((a) => [a.firstChild.textContent.trim(), a.href]),
    stack: p.querySelector('.project-stack')?.textContent.trim() ?? '',
    limits: p.querySelector('.limits')?.textContent.replace(/^Limits/, '').replace(/\s+/g, ' ').trim() ?? '',
    diagram: p.querySelector('[data-diagram]'),
  }));
  // Accepts 6, p6, the exact project name as printed on the page, or any unique part of it.
  const project = (arg) => {
    const q = String(arg).trim().toLowerCase();
    if (!q) return undefined;
    const byNum = projects.find((p) => String(p.n) === q.replace(/^p/, ''));
    if (byNum) return byNum;
    const exact = projects.find((p) => p.title.toLowerCase() === q);
    if (exact) return exact;
    const part = projects.filter((p) => p.title.toLowerCase().includes(q));
    return part.length === 1 ? part[0] : undefined;
  };

  /* ── Ask: keyword retrieval in the browser, answer from the Worker ─── */
  let knowledge = null;
  const STOP = new Set('the and for are but not you your what which who how does did can his has have with this that from about was were into than then them they will would could should any all one two out tell give show'.split(' '));
  const tokens = (s) => s.toLowerCase().split(/[^a-z0-9.+#-]+/).filter((w) => w.length > 2 && !STOP.has(w));
  async function retrieve(q) {
    knowledge ||= await fetch('assets/knowledge.json').then((r) => r.json());
    const df = new Map();
    const docs = knowledge.map((c) => {
      const set = new Set(tokens(c.text));
      set.forEach((w) => df.set(w, (df.get(w) || 0) + 1));
      return { c, set };
    });
    const qs = [...new Set(tokens(q))];
    // Questions about weaknesses never use the words the write-ups use, so nudge them towards the "limits" text.
    if (/gap|weak|short|limit|wrong|miss|flaw|problem|issue|fail|bad|improve/i.test(q)) qs.push('short', 'gaps', 'stops', 'fails', 'missing', 'manual', 'limits');
    return docs
      .map(({ c, set }) => {
        let s = 0;
        qs.forEach((w) => { if (set.has(w)) s += Math.log(1 + docs.length / df.get(w)); });
        return { text: c.text, s: c.source.startsWith('site:') ? s * 1.2 : s };
      })
      .filter((d) => d.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 4)
      .map((d) => d.text);
  }

  let abort = null;
  async function ask(q) {
    const url = term.dataset.askUrl;
    if (!url) {
      print('ask is not connected yet: the Cloudflare Worker has not been deployed. Everything else works.', 'dim');
      return;
    }
    const thinking = print('thinking...', 'dim');
    abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), 20000);
    try {
      const context = await retrieve(q);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context }),
        signal: abort.signal,
      });
      const data = await res.json();
      thinking.remove();
      if (!res.ok) print(data.error || 'That failed (' + res.status + ').', 'err');
      else { data.answer.split('\n').forEach((l) => print(l)); sfx.done(); }
    } catch (err) {
      thinking.remove();
      print(err.name === 'AbortError' ? '^C' : 'Could not reach the Worker. Try again, or email me.', 'err');
    } finally {
      clearTimeout(timer);
      abort = null;
    }
  }

  /* ── The Wazuh replay: real alerts from docs/evidence/wazuh-alerts.json ─ */
  let stopReplay = false;
  async function replay(fast) {
    const alerts = await fetch('assets/replay.json').then((r) => r.json());
    const phases = [
      ['$ ./simulate_ssh_bruteforce.sh 127.0.0.1 22 15', (a) => a.rule === '100100' || a.rule === '100101'],
      ['$ ./simulate_priv_esc.sh', (a) => a.rule === '100200' || a.rule === '100201'],
      ['$ sudo ./simulate_vault_jit_access.sh   # Vault creates and revokes IAM users; CloudTrail reports them later', (a) => a.rule === '100300'],
    ];
    const step = fast ? 20 : 120;
    stopReplay = false;
    term.setAttribute('aria-busy', 'true');
    screen.setAttribute('aria-live', 'off');
    print('Replaying the identity lab. Alerts are grouped by simulation. Ctrl+C stops it.', 'dim');
    const tally = {};
    for (const [title, test] of phases) {
      print('');
      print(title, 'hi');
      for (const a of alerts.filter(test)) {
        if (stopReplay) break;
        const src = a.log
          ? a.log.replace(/^\w{3} +\d+ [\d:]+ \S+ /, '')
          : 'CloudTrail iam.amazonaws.com ' + a.event + ' ' + (a.user.length > 44 ? a.user.slice(0, 44) + '...' : a.user);
        print(a.t + '  ' + src, 'dim');
        print('          ALERT ' + a.rule + '  level ' + a.level + '  ' + a.mitre + '  ' + a.desc, a.level >= 10 ? 'err' : a.level >= 7 ? 'warn' : 'ok');
        sfx.alert(a.level);
        tally[a.rule] = tally[a.rule] || { level: a.level, mitre: a.mitre, n: 0 };
        tally[a.rule].n++;
        await wait(step);
      }
    }
    term.removeAttribute('aria-busy');
    screen.setAttribute('aria-live', 'polite');
    if (stopReplay) return;
    print('');
    print('rule    level  mitre                  alerts', 'hi');
    let total = 0;
    Object.entries(tally).forEach(([id, t]) => {
      total += t.n;
      print(id.padEnd(8) + String(t.level).padEnd(7) + t.mitre.padEnd(23) + t.n);
    });
    print('total   ' + ' '.repeat(30) + total);
    print('');
    print('Real output from the lab run on 20 Sep 2026, sped up. Simulated from 127.0.0.1, not a real attack, and the CloudTrail alerts arrived 5 to 15 minutes late.', 'dim');
    link('docs/evidence/wazuh-alerts.json', REPO + 'identity-threat-detection-lab/blob/HEAD/docs/evidence/wazuh-alerts.json');
    sfx.done();
    live.textContent = 'Replay finished: ' + total + ' alerts across ' + Object.keys(tally).length + ' rules.';
  }

  /* ── sudo hire sannidhi ─────────────────────────────────────────────── */
  async function hire() {
    print('[sudo] password for recruiter: ********');
    await wait(700);
    print('recruiter is not in the sudoers file.  This incident will be reported.', 'err');
    await wait(1000);
    print('...kidding. Opening the contact form, pre-filled. Nothing is sent until you press Send.', 'ok');
    sfx.done();
    const subject = document.getElementById('cf-subject');
    const message = document.getElementById('cf-message');
    if (subject && !subject.value) subject.value = 'Cloud / DevOps / SRE opportunity';
    if (message && !message.value) message.value = 'Hi Sannidhi, I came across your portfolio and would like to talk about a role. ';
    document.getElementById('contact').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    setTimeout(() => document.getElementById('cf-name')?.focus({ preventScroll: true }), 700);
  }

  /* ── Commands ───────────────────────────────────────────────────────── */
  const commands = {
    help() {
      print('Instant answers (written by me, no AI):', 'hi');
      rows([
        ['ls', 'list the projects with their exact names'],
        ['cat <project name>', 'short write-up of a project: copy the name from ls, or use its number'],
        ['diagram <project name>', 'open its interactive architecture diagram'],
        ['open <project name>', 'jump to it on the page'],
        ['replay wazuh', 'replay the real alerts from the identity lab'],
        ['whoami | stack | certs', 'about me, tools, certifications'],
        ['contact | cv | cost', 'email and links, download my CV, what this site costs'],
        ['theme [dark|light] | clear', ''],
      ]);
      print('');
      print('Detailed answers (a small AI that only knows my write-ups):', 'hi');
      rows([['ask <question>', 'e.g. ask why is the Bookstore API not finished?']]);
      print('');
      print('Anything that is not a command is not sent to the AI. Start with ask for that.', 'dim');
    },
    whoami() {
      print(text('#intro-title') + ', ' + text('.intro-role'), 'hi');
      document.querySelectorAll('.lede').forEach((p) => print(p.textContent.replace(/\s+/g, ' ').trim()));
      print(text('.intro-status'), 'ok');
    },
    ls() {
      projects.forEach((p) => print(String(p.n).padStart(2) + '  ' + p.title + (p.diagram ? '   [diagram]' : '')));
      print('');
      print('cat <name or number> for a short write-up, diagram <name or number> to explore it.', 'dim');
    },
    cat(arg) {
      const p = project(arg);
      if (!p) return print('cat: no project matches "' + arg + '". Copy a name from ls, or use a number 1 to ' + projects.length + '.', 'err');
      print(p.title, 'hi');
      print(p.meta, 'dim');
      print('');
      print(p.hook, 'ok');
      print('');
      print(p.intro);
      if (p.limits) { print(''); print('Limits: ' + p.limits, 'warn'); }
      print('');
      print('Stack: ' + p.stack, 'dim');
      p.repos.forEach(([label, href]) => link(label + ': ' + href.replace('https://', ''), href));
      print('More detail: ask ' + p.title.split(' ').slice(0, 3).join(' ') + ' ... (any question)', 'dim');
    },
    open(arg) {
      const p = project(arg);
      if (!p) return print('open: no project matches "' + arg + '". Try ls.', 'err');
      location.hash = '#' + p.id;
      print('opened ' + p.title + ' on the page.', 'ok');
    },
    diagram(arg) {
      const p = project(arg);
      if (!p) return print('diagram: no project matches "' + arg + '". Try ls.', 'err');
      if (!p.diagram) return print(p.title + ' has no diagram.', 'err');
      p.diagram.click();
    },
    stack() { print(text('.intro-tools')); },
    certs() {
      document.querySelectorAll('.certs li').forEach((li) =>
        print(li.querySelector('.cert-name').textContent.padEnd(40) + li.querySelector('.cert-meta').textContent));
      print('Top 500 worldwide, Oracle Race to Certification 2025.', 'dim');
    },
    contact() {
      rows([['email', 'sannidhisriram8@gmail.com'], ['linkedin', 'linkedin.com/in/sannidhi-sriram'], ['github', 'github.com/SannidhiSriram-06']]);
      print('or: sudo hire sannidhi', 'dim');
    },
    cv() {
      document.querySelector('a[href$="Sannidhi_Sriram_CV.pdf"]')?.click();
      print('downloading the CV...', 'ok');
    },
    cost() {
      rows([
        ['this site', '$0.00/month  GitHub Pages and Actions, free'],
        ['ask worker', '$0.00/month  Cloudflare Workers free plan'],
        ['language model', '$0.00/month  Groq free tier'],
        ['identity lab', 'about $0.20   one 2h25m t3.large run, then destroyed (my estimate, not Cost Explorer)'],
      ]);
    },
    theme(arg) {
      const now = document.documentElement.dataset.theme;
      const want = arg === 'dark' || arg === 'light' ? arg : now === 'dark' ? 'light' : 'dark';
      if (want !== now) document.getElementById('theme-toggle').click();
      print('theme: ' + want, 'ok');
    },
    clear() { screen.replaceChildren(); },
    async replay(arg) {
      if (arg !== 'wazuh' && arg !== 'wazuh --fast') return print('replay what? Try: replay wazuh', 'err');
      await replay(arg.includes('--fast'));
    },
    ask: (arg) => (arg ? ask(arg) : print('ask what? e.g. ask which project has the biggest gap?', 'err')),
    sudo(arg) {
      if (/^hire sannidhi$/i.test(arg)) return hire();
      print('recruiter is not in the sudoers file.  This incident will be reported.', 'err');
    },
    rm() { print('nice try. Everything here is in git anyway.', 'warn'); },
    exit() { print('there is no exit, only #contact.', 'dim'); },
  };

  async function exec(line) {
    line = line.trim();
    if (!line) return;
    history.push(line);
    hIndex = history.length;
    const p = print('');
    p.innerHTML = '<span class="t-prompt"></span> <span></span>';
    p.firstChild.textContent = 'recruiter@portfolio ~ %';
    p.lastChild.textContent = line;
    const [cmd, ...rest] = line.split(/\s+/);
    const arg = rest.join(' ');
    const fn = Object.hasOwn(commands, cmd.toLowerCase()) ? commands[cmd.toLowerCase()] : null;
    if (fn) await fn(arg);
    else print('zsh: command not found: ' + cmd + '. Try help. For a question, start with: ask ' + line, 'err');
    screen.scrollTop = screen.scrollHeight;
  }

  /* ── Input: history, tab completion, Ctrl+C, Ctrl+L ─────────────────── */
  const history = [];
  let hIndex = 0;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    exec(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key.length === 1 || e.key === 'Backspace') sfx.key();
    if (e.key === 'ArrowUp') { e.preventDefault(); hIndex = Math.max(0, hIndex - 1); input.value = history[hIndex] ?? ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); hIndex = Math.min(history.length, hIndex + 1); input.value = history[hIndex] ?? ''; }
    else if (e.key === 'Tab' && input.value && !input.value.includes(' ')) {
      const m = Object.keys(commands).filter((c) => c.startsWith(input.value.toLowerCase()));
      if (m.length === 1) { e.preventDefault(); input.value = m[0] + ' '; }
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      stopReplay = true;
      abort?.abort();
      print('^C', 'dim');
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); commands.clear(); }
  });
  screen.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });

  /* ── Suggestions: a fresh random set on every page load ─────────────── */
  const ASK = {
    1: ['How did you detect the SSH spray?', 'Why does rule 100300 fire on Vault\'s own users?'],
    2: ['How did you handle duplicate findings?', 'Is the ISO 27001 mapping official?'],
    3: ['What went wrong with the AWS Backup restore?', 'How did the analyst fix the app-down ticket?'],
    4: ['What does Prometheus actually monitor here?', 'Why is this setup unsafe for production?'],
    5: ['Why split the app and chart repositories?', 'What is missing from the repos for Argo CD?'],
    6: ['How long until a failed server is replaced?', 'Why do the CI runs fail now?'],
    7: ['What stops the bookstore from being finished?', 'Where does a POSTed book go?'],
    8: ['Which Azure services does the triage app use?', 'Why should this not be used for real medical decisions?'],
  };
  const SHORT = { 1: 'Identity lab', 2: 'Compliance lab', 3: 'Support sim', 4: 'Observability', 5: 'GitOps', 6: 'Self-healing', 7: 'Bookstore', 8: 'Triage app' };
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
  const instant = projects.flatMap((p) => ['cat ' + p.title].concat(p.diagram ? ['diagram ' + p.title] : []));
  const asks = projects.flatMap((p) => (ASK[p.n] || []).map((q) => 'ask ' + SHORT[p.n] + ': ' + q));
  const extras = ['replay wazuh', 'cost', 'sudo hire sannidhi', 'stack', 'certs', 'whoami'];
  const chips = ['help', ...shuffle(instant).slice(0, 2), ...shuffle(asks).slice(0, 2), ...shuffle(extras).slice(0, 1)];
  const chipBox = document.getElementById('term-chips');
  chips.forEach((cmd) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'button term-chip';
    b.textContent = cmd;
    b.addEventListener('click', () => exec(cmd));
    chipBox.append(b);
  });

  /* ── Greeting ───────────────────────────────────────────────────────── */
  print('Last login: ' + new Date().toString().slice(0, 24) + ' on ttys001', 'dim');
  print('Type help for commands, or ask <question> for a detailed answer.', 'dim');
}
