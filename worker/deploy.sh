#!/usr/bin/env bash
# Deploys the Worker and uploads GROQ_API_KEY from ../.env as a Cloudflare secret.
# First time only: run `npx wrangler login` once and approve in the browser.
set -euo pipefail
cd "$(dirname "$0")"
set -a; source ../.env; set +a
[ -n "${GROQ_API_KEY:-}" ] || { echo "Put your Groq key in .env first (GROQ_API_KEY=...)"; exit 1; }
npx -y wrangler deploy
printf %s "$GROQ_API_KEY" | npx -y wrangler secret put GROQ_API_KEY
echo
echo "Done. Copy the https://portfolio-ask.<your-subdomain>.workers.dev URL printed above into data-ask-url in index.html."
