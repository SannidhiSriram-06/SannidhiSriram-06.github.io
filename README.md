# Sannidhi Durga Pavan Sriram: portfolio

Source for <https://sannidhisriram-06.github.io/>, a one-page portfolio for cloud, DevOps and SRE roles.

It is plain HTML, one stylesheet and plain JavaScript modules. There is no build step and no framework; GitHub Pages serves the files as they are.

## What is on it

- Eight AWS and Azure projects, each with a "what works" and a "limits" paragraph, checked against the code in its repository.
- Experience, certifications (with verification links), education and a contact form.
- Interactive architecture diagrams for five projects (`js/diagrams.js`): click a box for what it does and where it falls short, trace a flow, or kill an instance in the self-healing diagram.
- A macOS-style terminal (`js/terminal.js`): `help`, `ls`, `cat 6`, `replay wazuh` (the real alerts from the identity lab), and sentences that go to a small AI grounded in the project write-ups.
- A WebGL globe in the hero, a scroll-driven story of the Infosys deployment fixes, a 3D certification ring, and opt-in-by-default UI sounds (toggle in the header).

## Run it locally

```bash
npx serve .
```

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | the page |
| `style.css` | light and dark themes, layout, self-hosted font faces |
| `script.js` | theme toggle, projects accordion, section nav, contact form |
| `js/` | one module per feature, loaded by `js/main.js` so one failure never breaks the rest |
| `worker/` | the Cloudflare Worker that holds the Groq key for the terminal's `ask` |
| `scripts/` | Node scripts: the nightly knowledge-base build and the one-off replay builder |
| `assets/vendor/` | Three.js, vendored so the CSP stays `script-src 'self'` |
| `.github/workflows/` | nightly data refresh, Lighthouse and axe checks |
| `assets/fonts/` | self-hosted Inter Tight and Cascadia Code (latin subsets) |
| `assets/diagrams/` | the original static Archify diagrams (kept as the no-`<dialog>` fallback) |
| `llms.txt` | plain-text summary for language-model crawlers |

## The `ask` Worker (one-time setup)

GitHub Pages is static, so the Groq key lives in a free Cloudflare Worker instead of the site.

1. Put your key in `.env` (`GROQ_API_KEY=...`). The file is gitignored.
2. `npx wrangler login` once and approve in the browser (free Cloudflare account).
3. `./worker/deploy.sh` deploys the Worker and uploads the key as a secret.
4. Paste the printed `https://portfolio-ask.<you>.workers.dev` URL into `data-ask-url` on `#term` in `index.html`.

The Worker only answers requests from the site's origin and `localhost`, and caps question length and request rate.

## Nightly data

`.github/workflows/nightly.yml` runs `scripts/build-knowledge.mjs`, which rebuilds `assets/knowledge.json` (the text the terminal's `ask` searches) from the READMEs and the page, and commits it if it changed. Run it by hand from the Actions tab (workflow_dispatch).

## Checks

`npm install && npx playwright install chromium && npx playwright test` runs axe in both themes, checks for console errors and takes screenshots. CI also runs Lighthouse (`lighthouserc.json`).

## Content rule

A project claim goes on the page only if the repository's code or evidence supports it. Known gaps are written on the page as "Limits".
