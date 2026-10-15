/* Interactive architecture diagrams. Click a box for what it does and where it falls short;
   the buttons send a packet along the real flow. Every claim here comes from the project write-ups. */
import * as sfx from './sfx.js';

const NS = 'http://www.w3.org/2000/svg';
const REPO = 'https://github.com/SannidhiSriram-06/';
const COLW = 262, ROWH = 112, NW = 190, NH = 68, PADX = 30, PADY = 50;

// n(id, col, row, label, "line one|line two", kind, what it does, where it falls short)
const n = (id, c, r, label, sub, kind, desc, limit = '') => ({ id, c, r, label, sub, kind, desc, limit });
const e = (from, to, label, cap) => ({ from, to, label, cap });

const DIAGRAMS = {
  'identity-threat-lab': {
    title: 'Identity Threat Detection and Response Lab',
    repos: [['Repository', 'identity-threat-detection-lab']],
    rows: 4,
    nodes: [
      n('sim', 0, 0, 'Simulations', 'SSH spray, sudo abuse|JIT credential requests', 'host', 'Three scripts run on the host: an SSH username spray (15 invalid users), four unauthorised sudo commands, and Vault credential requests.', 'Everything came from 127.0.0.1 and a local test user, so this is not a real attack.'),
      n('auth', 0, 1, '/var/log/auth.log', 'read-only bind mount', 'host', 'The host\'s auth log, mounted read-only into the Wazuh Manager container.', 'Wazuh reads it directly instead of through an agent, so alerts show agent ID 000.'),
      n('vault', 2, 0, 'HashiCorp Vault 1.15', 'AWS secrets engine :8200', 'host', 'Issues short-lived IAM users on request. dev-jit-role leases last 900 seconds, and revoking a lease deleted the IAM user.', 'Single key share, the unseal key and root token sit on the host, and the listener is plain HTTP. A lab, not a pattern to copy.'),
      n('iam', 3, 0, 'AWS IAM', 'dynamic 15 minute leases', 'aws', 'Where Vault creates and deletes the temporary users.'),
      n('trail', 3, 1, 'CloudTrail', 'CreateUser, CreateKey', 'aws', 'Records the IAM calls and delivers them to S3.', 'Delivery takes 5 to 15 minutes, so cloud alerts are not instant.'),
      n('s3', 3, 2, 'S3 bucket', 'CloudTrail logs', 'aws', 'Holds the CloudTrail log files until Wazuh picks them up.'),
      n('mgr', 1, 2, 'Wazuh Manager 4.7.5', 'rules engine|aws-s3 wodle', 'host', 'Runs my five custom rules (100100, 100101, 100200, 100201, 100300) over auth.log and CloudTrail. 33 alerts mapped to MITRE ATT&CK in the live run.', 'Rule 100300 fires on any CreateUser, including the ones Vault makes itself. A real setup would allowlist Vault. Default Wazuh credentials.'),
      n('idx', 1, 3, 'Wazuh Indexer', 'OpenSearch :9200', 'host', 'Stores the alerts.', 'Single node. Production would cluster the indexer and manager across availability zones.'),
      n('dash', 2, 3, 'Wazuh Dashboard', 'HTTPS :443', 'host', 'Where the alerts are read.'),
    ],
    edges: [
      e('sim', 'auth', 'host activity', 'The SSH spray and sudo attempts land in auth.log.'),
      e('sim', 'vault', 'JIT requests', 'The simulation asks Vault for temporary AWS credentials.'),
      e('vault', 'iam', 'creates users', 'Vault calls CreateUser and CreateAccessKey in IAM.'),
      e('iam', 'trail', 'API events', 'Those IAM calls are recorded by CloudTrail.'),
      e('trail', 's3', 'delivery', 'CloudTrail delivers log files to S3, which takes 5 to 15 minutes.'),
      e('s3', 'mgr', 'wodle poll', 'The aws-s3 wodle polls the bucket every 5 minutes, so cloud alerts are never instant.'),
      e('auth', 'mgr', 'bind mount', 'Wazuh Manager reads the log in near real time.'),
      e('mgr', 'idx', 'alerts', 'Matching events become alerts and are indexed.'),
      e('idx', 'dash', 'queries', 'The dashboard queries the indexer.'),
    ],
    flows: [
      { name: 'Host path', edges: [['sim', 'auth'], ['auth', 'mgr'], ['mgr', 'idx'], ['idx', 'dash']] },
      { name: 'Cloud path', edges: [['sim', 'vault'], ['vault', 'iam'], ['iam', 'trail'], ['trail', 's3'], ['s3', 'mgr'], ['mgr', 'idx']] },
    ],
  },
  'compliance-vendor-risk': {
    title: 'Cloud Compliance and Vendor Risk Lab',
    repos: [['Repository', 'cloud-compliance-vendor-risk']],
    rows: 4,
    nodes: [
      n('bad', 0, 1, 'Four planted problems', 'public S3, open SSH|unencrypted EBS, no MFA', 'bad', 'Terraform deploys four deliberately bad resources: a public S3 bucket, a security group open to SSH from anywhere, an unencrypted EBS volume and an IAM user without MFA.'),
      n('cfg', 1, 0, 'AWS Config', 'continuous recorder|managed rules', 'aws', 'Evaluates the resources against the CIS AWS Foundations Benchmark v1.4.0.'),
      n('sh', 1, 2, 'Security Hub', 'CIS AWS Foundations|Benchmark v1.4.0', 'aws', 'Runs the same benchmark and reports failed controls.'),
      n('eb', 2, 1, 'EventBridge, 2 rules', 'Config NON_COMPLIANT|Security Hub FAILED', 'aws', 'Two rules send failures to the Lambda.'),
      n('lam', 3, 1, 'Lambda (Python)', 'risk register processor', 'aws', 'Writes each finding to S3, merges the duplicates Config and Security Hub both report, and rebuilds the register.', 'In the live run it recorded 21 findings: 17 mapped to CIS controls and 4 unmapped.'),
      n('finds', 3, 0, 'S3 findings', 'one JSON object each', 'aws', 'One object per finding, kept so the Lambda can deduplicate by control and resource.'),
      n('reg', 3, 2, 'S3 risk register', 'risk_register.json + .csv', 'aws', 'Each finding gets an owner and an SLA based on severity.', 'The ISO 27001 and NIST CSF mappings are my own indicative crosswalk, not an official one.'),
      n('dash', 2, 3, 'Flask dashboard', 'Docker Compose', 'host', 'Shows the register and the vendor score.', 'Reads a saved copy of the register, not the live S3 file.'),
      n('vendor', 0, 3, 'Vendor scoring script', 'fictional vendor|sample questionnaire', 'host', 'Scores a vendor from questionnaire answers and writes a report.', 'The vendor and its answers are invented.'),
    ],
    edges: [
      e('bad', 'cfg', 'evaluated', 'Config evaluates all four resources.'),
      e('bad', 'sh', 'evaluated', 'So does Security Hub.'),
      e('cfg', 'eb', 'non-compliant', 'A NON_COMPLIANT change fires an EventBridge rule.'),
      e('sh', 'eb', 'failed', 'A FAILED control fires the other rule.'),
      e('eb', 'lam', 'invoke', 'Both rules invoke the Lambda.'),
      e('lam', 'finds', 'write', 'The Lambda writes one object per finding.'),
      e('lam', 'reg', 'rebuild', 'It merges duplicates and rebuilds the register as JSON and CSV.'),
      e('reg', 'dash', 'saved copy', 'The dashboard reads a saved copy.'),
      e('vendor', 'dash', 'score', 'The vendor score shows on the same dashboard.'),
    ],
    flows: [{ name: 'Finding to register', edges: [['bad', 'sh'], ['sh', 'eb'], ['eb', 'lam'], ['lam', 'finds'], ['lam', 'reg'], ['reg', 'dash']] }],
  },
  'observability-fargate': {
    title: 'Observability Stack on ECS Fargate',
    repos: [['Repository', 'observability-fargate']],
    rows: 4,
    group: { label: 'VPC, 2 public subnets, ECS Fargate cluster', c0: 2, c1: 2, r0: 0, r1: 2 },
    nodes: [
      n('user', 0, 1, 'Browser', 'ports 3000 and 9090', 'ext', 'Reaches both services on their public IPs.', 'Both ports are open to the internet. Fine for a short lab, wrong for anything else.'),
      n('graf', 2, 0, 'Grafana', 'stock image, :3000', 'host', 'Three-panel dashboard (total HTTP requests, request rate over 5 minutes, active time series) and an alert that fires when the rate passes 0.5, evaluated every minute.'),
      n('prom', 2, 2, 'Prometheus', 'custom image, :9090', 'host', 'Built for linux/amd64 and pushed to ECR.', 'It only scrapes itself, so the dashboard shows Prometheus\'s own metrics. No application was monitored.'),
      n('ecr', 3, 2, 'ECR', 'Prometheus image', 'aws', 'Registry for the custom image.'),
      n('cw', 3, 0, 'CloudWatch Logs', 'one log group', 'aws', 'Receives both services\' logs.'),
      n('tf', 2, 3, 'Terraform', 'VPC, SG, IAM, ECS, logs', 'ext', 'Builds the VPC, subnets, security group, IAM roles, ECS cluster and log group, then runs the two Fargate services.'),
    ],
    edges: [
      e('user', 'graf', ':3000', 'The browser opens Grafana.'),
      e('user', 'prom', ':9090', 'Or Prometheus directly.'),
      e('graf', 'prom', 'queries', 'Grafana queries Prometheus as its data source.'),
      e('ecr', 'prom', 'image pull', 'Fargate pulls the custom Prometheus image from ECR.'),
      e('graf', 'cw', 'logs', 'Container logs go to CloudWatch.'),
      e('prom', 'cw', 'logs', 'Same for Prometheus.'),
      e('tf', 'prom', 'provisions', 'terraform apply creates everything shown here.'),
    ],
    flows: [
      { name: 'Open the dashboard', edges: [['user', 'graf'], ['graf', 'prom']] },
      { name: 'Deploy', edges: [['tf', 'prom'], ['ecr', 'prom']] },
    ],
  },
  'gitops-ai-testgen': {
    title: 'AI Test Generator and GitOps Pipeline',
    repos: [['App repository', 'ai-test-generator'], ['GitOps chart repository', 'ai-pytest-generator-gitops']],
    rows: 4,
    nodes: [
      n('dev', 0, 0, 'Developer', 'git push', 'ext', 'Pushes code to the app repository.'),
      n('app', 1, 0, 'App repository', 'FastAPI + Jenkinsfile', 'ext', 'A FastAPI service with one real endpoint: POST /generate takes up to 2,000 characters of Python, validates it, limits callers to 5 requests a minute and asks Groq for a pytest file.'),
      n('jen', 2, 0, 'Jenkins', 'pytest, 70% coverage gate|multi-stage Docker build', 'host', 'Runs the tests, builds the image, pushes it, then commits the new tag to the chart repository. It never holds cluster credentials; it only writes an image tag to Git.'),
      n('ecr', 3, 0, 'ECR', 'created with Terraform|tag: build + commit', 'aws', 'Image registry.'),
      n('chart', 2, 1, 'GitOps chart repo', 'Helm chart + image tag', 'ext', 'The only thing Jenkins touches to deploy. Splitting the repositories is the GitOps part.'),
      n('argo', 2, 2, 'Argo CD', 'watches the chart repo', 'host', 'Syncs the chart to the cluster whenever the tag changes.', 'Set up by hand outside the two repositories, so the repos show the chart and the CI side but not Argo CD itself.'),
      n('k8s', 3, 2, 'Minikube cluster', 'Deployment + Secret|ECR pull secret', 'host', 'The Deployment pulls from ECR with a pull secret and reads the Groq key from a Kubernetes Secret.', 'Local Minikube, not a managed cluster.'),
      n('user', 1, 3, 'Caller', 'POST /generate', 'ext', 'Sends Python code, gets a pytest file back.'),
      n('groq', 3, 3, 'Groq API', 'llama-3.1-8b-instant', 'ext', 'Writes the pytest file.'),
    ],
    edges: [
      e('dev', 'app', 'push', 'A push lands in the app repository.'),
      e('app', 'jen', 'build', 'Jenkins builds it.'),
      e('jen', 'ecr', 'push image', 'The tested image goes to ECR, tagged with build number and commit.'),
      e('jen', 'chart', 'commit tag', 'Jenkins commits the new image tag to the chart repository. Git is the only handoff.'),
      e('chart', 'argo', 'watched', 'Argo CD notices the change.'),
      e('argo', 'k8s', 'sync', 'Argo CD syncs the chart to Minikube.'),
      e('ecr', 'k8s', 'pull image', 'The Deployment pulls the new image from ECR.'),
      e('user', 'k8s', 'request', 'A caller posts code to /generate.'),
      e('k8s', 'groq', 'generate', 'The service asks Groq for a pytest file.'),
    ],
    flows: [
      { name: 'Ship a change', edges: [['dev', 'app'], ['app', 'jen'], ['jen', 'ecr'], ['jen', 'chart'], ['chart', 'argo'], ['argo', 'k8s'], ['ecr', 'k8s']] },
      { name: 'Serve a request', edges: [['user', 'k8s'], ['k8s', 'groq']] },
    ],
  },
  'self-healing-asg': {
    title: 'Self-Healing Java Microservice',
    repos: [['Repository', 'self-healing-microservice']],
    rows: 4,
    group: { label: 'Auto Scaling Group, 2 to 4 t3.micro, 2 Availability Zones', c0: 2, c1: 3, r0: 0, r1: 2 },
    kill: true,
    nodes: [
      n('user', 0, 1, 'Client', 'HTTP', 'ext', 'Sends requests to the load balancer.'),
      n('alb', 1, 1, 'Load Balancer', 'health check every 30 s|drops after 3 fails', 'aws', 'Application Load Balancer with a target group. Three failed 30 second checks mark a target unhealthy, about 90 seconds.'),
      n('i1', 2, 0, 'Instance A', 'Docker + Spring Boot|Actuator health', 'host', 'user data installs Docker and runs the Spring Boot image. A Docker health check runs every 30 seconds.'),
      n('i2', 2, 2, 'Instance B', 'Docker + Spring Boot|Actuator health', 'host', 'The second instance, in the other Availability Zone.'),
      n('i3', 3, 1, 'Replacement', 'launched by the ASG', 'ghost', 'The Auto Scaling Group uses the load balancer\'s health checks, so an instance that fails them is replaced.', 'How long the replacement takes to boot was not measured.'),
      n('cw', 2, 3, 'CloudWatch CPU', 'target tracking at 80%', 'aws', 'A target-tracking policy adds instances when CPU passes 80%.'),
      n('hub', 0, 2, 'Docker Hub', 'image registry', 'ext', 'GitHub Actions builds with Maven, runs the tests, pushes the image here and runs Snyk scans.', 'Snyk runs after the push, so a finding fails the run but does not stop the image being published. Deploying a new image to EC2 is manual. Runs since February fail at the Docker Hub login because the secrets are no longer set.'),
      n('gh', 0, 3, 'GitHub Actions', 'Maven, tests, Snyk', 'ext', 'Ran green in February 2026.'),
    ],
    edges: [
      e('user', 'alb', 'requests', 'Traffic arrives at the load balancer.'),
      e('alb', 'i1', 'health 30 s', 'The load balancer forwards to Instance A and checks it every 30 seconds.'),
      e('alb', 'i2', 'health 30 s', '...and to Instance B.'),
      e('alb', 'i3', 'new target', 'The replacement is registered as a target.'),
      e('cw', 'i2', 'scale out', 'Above 80% CPU the policy adds an instance.'),
      e('gh', 'hub', 'push image', 'CI pushes the image to Docker Hub.'),
      e('hub', 'i2', 'image pull', 'user data pulls the image when an instance launches.'),
    ],
    flows: [{ name: 'Send traffic', edges: [['user', 'alb'], ['alb', 'i1'], ['alb', 'i2']] }],
  },
};

/* ── Geometry ───────────────────────────────────────────────────────────── */
const pos = (nd) => ({ x: PADX + nd.c * COLW, y: PADY + nd.r * ROWH });
const ctr = (nd) => ({ x: pos(nd).x + NW / 2, y: pos(nd).y + NH / 2 });
function edgePath(a, b) {
  const ca = ctr(a), cb = ctr(b);
  const dx = cb.x - ca.x, dy = cb.y - ca.y;
  const cut = (d) => Math.min(Math.abs(d.x) > 0 ? (NW / 2 + 5) / Math.abs(d.x) : Infinity, Math.abs(d.y) > 0 ? (NH / 2 + 5) / Math.abs(d.y) : Infinity);
  const t = cut({ x: dx, y: dy });
  return { x1: ca.x + dx * t, y1: ca.y + dy * t, x2: cb.x - dx * t, y2: cb.y - dy * t };
}

const mk = (name, attrs = {}, text) => {
  const el = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
};

/* ── The dialog ─────────────────────────────────────────────────────────── */
const dialog = document.getElementById('diagram-dialog');
const stage = document.getElementById('diagram-stage');
const panel = document.getElementById('diagram-panel');
const actions = document.getElementById('diagram-actions');
const titleEl = document.getElementById('diagram-title');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

if (dialog && stage && typeof dialog.showModal === 'function') {
  let run = 0;           // bumps to cancel any running animation
  let current = null;    // key of the diagram on screen
  let nodes = {}, edges = {}, svg;

  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce.matches ? 0 : ms));
  const caption = (s) => { panel.querySelector('.diagram-cap').textContent = s; };

  function showNode(id) {
    const d = DIAGRAMS[current];
    const nd = d.nodes.find((x) => x.id === id);
    Object.values(nodes).forEach((g) => g.classList.toggle('is-sel', g.dataset.id === id));
    const body = panel.querySelector('.diagram-detail');
    body.replaceChildren();
    const h = document.createElement('h3');
    h.textContent = nd.label;
    body.append(h);
    const para = (label, txt, cls) => {
      const p = document.createElement('p');
      if (cls) p.className = cls;
      if (label) { const b = document.createElement('strong'); b.textContent = label; p.append(b, ' '); }
      p.append(txt);
      body.append(p);
    };
    para('', nd.desc);
    if (nd.limit) para('Falls short:', nd.limit, 'limits-note');
  }

  function draw(key) {
    run++;
    current = key;
    const d = DIAGRAMS[key];
    titleEl.textContent = d.title + ': architecture';
    const H = PADY + (d.rows - 1) * ROWH + NH + 30;
    svg = mk('svg', { viewBox: '0 0 ' + (PADX * 2 + 3 * COLW + NW) + ' ' + H, class: 'diagram-svg', role: 'group', 'aria-label': d.title + ' architecture. Select a box for details.' });
    const defs = mk('defs');
    for (const [id, cls] of [['arr', 'arrow'], ['arr-on', 'arrow arrow-on']]) {
      const m = mk('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
      m.append(mk('path', { d: 'M0 0 L10 5 L0 10 z', class: cls }));
      defs.append(m);
    }
    svg.append(defs);

    if (d.group) {
      const g = d.group;
      const x = PADX + g.c0 * COLW - 16, y = PADY + g.r0 * ROWH - 30;
      const w = (g.c1 - g.c0) * COLW + NW + 32, h = (g.r1 - g.r0) * ROWH + NH + 46;
      svg.append(mk('rect', { x, y, width: w, height: h, rx: 14, class: 'group-box' }));
      svg.append(mk('text', { x: x + 14, y: y + 18, class: 'group-label' }, g.label));
    }

    edges = {};
    const byId = Object.fromEntries(d.nodes.map((x) => [x.id, x]));
    d.edges.forEach((ed) => {
      if (!byId[ed.from] || !byId[ed.to]) return;
      const p = edgePath(byId[ed.from], byId[ed.to]);
      const g = mk('g', { class: 'edge' + (byId[ed.to].kind === 'ghost' ? ' is-hidden' : '') });
      const line = mk('line', { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, 'marker-end': 'url(#arr)' });
      g.append(line);
      g.append(mk('text', { x: (p.x1 + p.x2) / 2, y: (p.y1 + p.y2) / 2 - 5, class: 'edge-label' }, ed.label));
      svg.append(g);
      edges[ed.from + '>' + ed.to] = { g, line, ed, p };
    });

    nodes = {};
    d.nodes.forEach((nd) => {
      const { x, y } = pos(nd);
      const g = mk('g', { class: 'node kind-' + nd.kind, tabindex: nd.kind === 'ghost' ? -1 : 0, role: 'button', 'aria-label': nd.label + ', show details', 'data-id': nd.id });
      g.append(mk('rect', { x, y, width: NW, height: NH, rx: 10 }));
      g.append(mk('text', { x: x + 12, y: y + 22, class: 'node-label' }, nd.label));
      nd.sub.split('|').forEach((line, i) => g.append(mk('text', { x: x + 12, y: y + 39 + i * 13, class: 'node-sub' }, line)));
      const pick = () => { showNode(nd.id); };
      g.addEventListener('click', pick);
      g.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); pick(); } });
      svg.append(g);
      nodes[nd.id] = g;
    });
    stage.replaceChildren(svg);

    panel.replaceChildren();
    const cap = document.createElement('p');
    cap.className = 'diagram-cap';
    cap.setAttribute('role', 'status');
    cap.textContent = 'Select a box for details, or trace a flow.';
    const detail = document.createElement('div');
    detail.className = 'diagram-detail';
    const links = document.createElement('p');
    links.className = 'diagram-links';
    d.repos.forEach(([label, repo]) => {
      const a = document.createElement('a');
      a.href = REPO + repo;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = label + ' on GitHub';
      links.append(a);
    });
    const legend = document.createElement('p');
    legend.className = 'diagram-legend';
    legend.textContent = 'Outline: black is a server or container, blue is an AWS service, grey is outside the build.';
    panel.append(cap, detail, links, legend);
    showNode(d.nodes[0].id);

    actions.replaceChildren();
    d.flows.forEach((f) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'button';
      b.textContent = 'Trace: ' + f.name;
      b.addEventListener('click', () => trace(f));
      actions.append(b);
    });
    if (d.kill) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'button';
      b.textContent = 'Kill Instance A';
      b.addEventListener('click', kill);
      actions.append(b);
    }
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'button';
    reset.textContent = 'Reset';
    reset.addEventListener('click', () => draw(key));
    actions.append(reset);
  }

  function clearOn() {
    Object.values(edges).forEach(({ g, line }) => { g.classList.remove('is-on'); line.setAttribute('marker-end', 'url(#arr)'); });
    Object.values(nodes).forEach((g) => g.classList.remove('is-pulse'));
  }

  async function travel(from, to) {
    const E = edges[from + '>' + to];
    if (!E) return;
    E.g.classList.add('is-on');
    E.line.setAttribute('marker-end', 'url(#arr-on)');
    caption(E.ed.cap || E.ed.label);
    nodes[from]?.classList.add('is-pulse');
    sfx.click();
    if (!reduce.matches) {
      const dot = mk('circle', { r: 6, class: 'packet', cx: E.p.x1, cy: E.p.y1 });
      svg.append(dot);
      const t0 = performance.now(), dur = 750, my = run;
      await new Promise((res) => {
        const tick = (t) => {
          if (my !== run) { dot.remove(); return res(); }
          const k = Math.min(1, (t - t0) / dur);
          dot.setAttribute('cx', E.p.x1 + (E.p.x2 - E.p.x1) * k);
          dot.setAttribute('cy', E.p.y1 + (E.p.y2 - E.p.y1) * k);
          if (k < 1) requestAnimationFrame(tick); else { dot.remove(); res(); }
        };
        requestAnimationFrame(tick);
      });
    }
    nodes[to]?.classList.add('is-pulse');
  }

  async function trace(flow) {
    const my = ++run;
    clearOn();
    for (const [a, b] of flow.edges) {
      if (my !== run) return;
      await travel(a, b);
      await sleep(250);
    }
    if (my === run) { caption('Done: ' + flow.name + '.'); sfx.done(); }
  }

  // The ASG story: what really happens in the ~90 seconds after an instance stops answering.
  async function kill() {
    const my = ++run;
    clearOn();
    const alb = edges['alb>i1'], dead = nodes.i1;
    const say = async (s, ms = 1500) => { if (my === run) { caption(s); await sleep(ms); } };
    dead.classList.add('is-dead');
    sfx.swoosh();
    await say('t = 0 s: Instance A stops answering.');
    alb.g.classList.add('is-failing');
    await say('t = 30 s: health check 1 of 3 fails. The load balancer still sends it traffic.');
    await say('t = 60 s: check 2 of 3 fails. Instance B is handling the rest.');
    await say('t = 90 s: check 3 of 3 fails. The target is marked unhealthy and traffic stops going to it.');
    if (my !== run) return;
    alb.g.classList.add('is-gone');
    await say('The Auto Scaling Group uses those load balancer checks, so it terminates Instance A and launches a replacement. (How long that boot takes was not measured.)', 2200);
    if (my !== run) return;
    dead.classList.add('is-gone');
    nodes.i3.classList.remove('kind-ghost');
    nodes.i3.classList.add('kind-host', 'is-new');
    edges['alb>i3'].g.classList.remove('is-hidden');
    sfx.done();
    caption('The replacement is registered and takes traffic. Nobody was paged; the service never fully went down.');
  }

  document.querySelectorAll('[data-diagram]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (!DIAGRAMS[btn.dataset.diagram]) return;
      draw(btn.dataset.diagram);
      dialog.showModal();
    }));
  document.getElementById('diagram-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (ev) => { if (ev.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { run++; });
} else {
  // No <dialog> support: open the old static page on its own.
  document.querySelectorAll('[data-diagram]').forEach((btn) =>
    btn.addEventListener('click', () => window.open('assets/diagrams/' + btn.dataset.diagram + '.html', '_blank', 'noopener')));
}
