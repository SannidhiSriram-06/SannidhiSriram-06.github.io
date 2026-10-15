export const OWNER = 'SannidhiSriram-06';
export const REPOS = [
  'identity-threat-detection-lab',
  'cloud-compliance-vendor-risk',
  'cloud-support-ticket-simulation',
  'observability-fargate',
  'ai-test-generator',
  'ai-pytest-generator-gitops',
  'self-healing-microservice',
  'Bookstore-Microservice-Architecture-on-AWS',
  'AI-Patient-Triage-System-on-Azure-CSA-Case-Study-',
];

export const gh = (path) =>
  fetch('https://api.github.com/' + path, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}),
    },
  }).then((r) => (r.ok ? r.json() : null));
