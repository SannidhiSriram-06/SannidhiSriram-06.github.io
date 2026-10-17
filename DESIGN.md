# DESIGN.md: Sannidhi's portfolio

Read this before changing anything visual. It records what the site is, why it looks the way it does, what the owner likes and dislikes, and the hard constraints. Last updated 2026-10-18.

Live site: https://sannidhisriram-06.github.io/ (this URL is printed on his CV, so hosting must never move).
Run locally: `npx serve -l 4173 .` then open http://localhost:4173/ (`.claude/launch.json` has the same command).

## 1. What this site is

A one-page portfolio for **Sannidhi Durga Pavan Sriram**, a final-year B.Tech CSE student at Lovely Professional University (graduating 2027), based in Hyderabad, looking for **cloud, DevOps and SRE internships and entry-level roles**. Readers are recruiters and engineers. It must look professional, polite and calm, and feel crafted.

Hard facts about how it is built:

- **Static site on GitHub Pages**, plain HTML, one stylesheet, plain JavaScript. No framework and no build step. Do not add one.
- **Free tier only.** No cloud bills, ever. The one backend is a free Cloudflare Worker.
- Fonts, Three.js and everything else are self-hosted under `assets/`. No CDNs.
- Single page `index.html`, plus `card.html` (contact card page for the QR code) and `404.html`.

## 2. Voice and content rules

- **Honest over impressive.** Every project has a "Limits" paragraph saying where it falls short. A claim goes on the page only if the repo's code or evidence supports it. Do not remove or soften Limits.
- **Professional and polite.** He asked for a calm tone after an earlier link preview read as aggressive. No attitude, no jokes in the page copy or the link preview. The only playful bits are inside the terminal easter eggs (`sudo hire sannidhi`, `rm`), kept mild.
- First person, short plain sentences, no marketing words.
- Education wording he chose: "10th Grade (CBSE Board), Oxford Grammar High School" (not "SSC").
- Link preview text (meta description, `og:`/`twitter:` tags, and the baked-in text of `assets/og-card.png`) is: "AWS and Azure projects and six cloud certifications. Open to internships and entry-level roles." If it changes, re-render the card (1200x630, white, lime left bar, Inter Tight name, Cascadia role and URL) and bump the `?v=` on the image URLs, because chat apps cache previews.
- Facts that must stay in sync when copy changes: `index.html`, `llms.txt`, and `assets/knowledge.json` (rebuild with `node scripts/build-knowledge.mjs`; the nightly Action also does it).

## 3. Visual direction

Taken from the **Microsoft Command Line** website: white page, black ink, blue links, one lime highlight, Inter Tight for text, Cascadia Code for labels. Light and dark themes are both first-class; the theme follows the OS and a header toggle, saved in `localStorage`.

### Tokens (`style.css`, top)

| Token | Light | Dark |
| --- | --- | --- |
| `--bg` | `#ffffff` | `#111111` |
| `--surface` | `#f2f2f2` | `#1a1a1a` |
| `--ink` | `#000000` | `#ffffff` |
| `--muted` | `#555555` | `#999999` |
| `--line` | `#cccccc` | `#2e2e2e` |
| `--field-line` | `#767676` | `#7a7a7a` |
| `--accent` (links, focus, marker) | `#1a5fc4` | `#e3f671` |
| `--lime` | `#e3f671` | same |
| `--bad` / `--good` (diagram and story states) | `#c62f2f` / `#1f7a43` | `#ff7b72` / `#7ee787` |

- Lime is the signature: primary buttons (black text on lime, 16:1), bizcard and card edge bars, active nav pill in dark mode, terminal prompt.
- Only one accent hue at a time. Do not introduce purple gradients, neon glows or decorative colour. A glow on the rail marker was removed for exactly this reason.
- The terminal window is always dark (`#141517`) in both themes, like macOS Terminal.

### Type

- Headings: Inter Tight 500, tight tracking (`-0.04em` to `-0.05em`), `text-wrap: balance`. H1 is `clamp(2.25rem, 7vw, 4rem)`; on phones it is `clamp(1.75rem, 8.2vw, 2.4rem)`.
- Body: Inter Tight 400, 1.0625rem, line-height 1.7, measure about 68ch.
- Labels (nav, buttons, project meta, stack lines, cert meta, section bars, terminal): Cascadia Code, 0.8 to 0.85rem.
- **Rail section names only: Archivo** (variable, self-hosted `assets/fonts/archivo-latin-wdth-normal.woff2`, SIL OFL licence in `assets/fonts/OFL-Archivo.txt`), weight 620, `font-stretch: 118%`, tracking `-0.03em`, 34px. This is the exact face PdfCraft uses for the same labels, and he asked for it by name. Do not use it elsewhere; the ruler numbers and readout stay in Cascadia Code.
- **Nothing functional below 11px.** The design checker enforces this. Mono labels sit at 0.6875rem at the smallest.

### Shape and components

- Pill navigation (a rounded track with a sliding black/lime pill that follows the section in view). Taken from a Framer pill-nav.
- "Glass" buttons: translucent fill, blur, rim light, highlight that follows the pointer. On Chromium an SVG displacement filter bends what is behind them (`js/glass.js`); other browsers get plain blur. Primary buttons are solid lime and excluded from the lens.
- Projects are cards in an accordion, one open at a time, first open by default (`script.js`; deep links like `#p3` open that project).
- Sections are separated by a 1px `--line` top border and generous vertical padding (3.5rem). Radius: 6px fields, 8px cards, 999px pills and buttons.
- Min tap target 44px (2.75rem) on everything interactive.
- Focus is always visible (3px outline in `--focus`). Never remove it.

## 4. Page structure and placement (and why)

Order: **About (hero), Projects, Terminal, Experience, Certifications, Education, Contact.** Nav links, the rail's section names and the sticky bars all derive from this order (the rail reads `.site-nav a[href^="#"]`), so adding or renaming a section means updating the nav, the section's `sec-bar` in `index.html`, and checking `js/rail.js`.

- **Hero:** name, role, two ledes, "Open to ..." status, tools line in mono, then two buttons (Download CV lime, Get in touch glass), then a scroll cue. Portrait is a circle on the right on desktop. **On phones the portrait sits beside the name and role** (about 80 to 95px) because it looked like it was "hanging" below the text. Keep the hero clean: no decorative background elements behind the text.
- **Projects:** featured first project, then seven more, each with number chip, meta, one-line hook, accordion body (what it is, **Limits**, stack, links) and an "Architecture diagram" button on the five that have one.
- **Terminal:** a macOS-style window (traffic lights, dark). Under it, six suggestion chips that change on every page load.
- **Experience:** the Infosys Springboard internship. **The certificate image sits to the right of the intro text** on wide screens (it used to be below and left empty space). Under it is the scroll-driven story of the five deployment defects.
- **Certifications:** the Oracle Top 500 badge note, then a 3D ring carousel of six credentials with verify links.
- **Education:** three entries.
- **Contact:** heading and "I'm in Hyderabad (IST, UTC+5:30)" note, with the small spinning globe at the right of the heading; contact list with business-card QR block on the left, form on the right (Formspree).
- Footer: one line, including "hosting cost this month: $0.00".

### Things he explicitly removed or rejected (do not bring back)

- The **GitHub activity section** (contribution calendar, ridge landscape, repo list with "CI failing"). All gone, including the nightly stats job.
- Globe placements that felt "weird", "unrelated" or "distracting": behind the photo, huge beside the name, inline after the name. It now lives only in the Contact heading, small and calm, because it relates to "I'm in Hyderabad" and the AWS regions. If it is ever too small he says so; adjust size, do not relocate it into the hero.
- Aggressive or smug copy anywhere visible.
- Per-project pages and anything that moves hosting off GitHub Pages.

## 5. Interactive features and the rules around them

All feature code is in `js/`, one module per feature, loaded by `js/main.js` with isolated failure. `script.js` (classic script) handles theme, form, accordion, nav pill, glass highlight, header-height variable.

- **Terminal (`js/terminal.js`):** commands `help, ls, cat <name|n>, open, diagram, replay wazuh, whoami, stack, certs, contact, cv, cost, theme, clear, ask <q>, sudo hire sannidhi`. Project commands accept the exact title, a number or a unique part of the title. `cat` prints a short write-up read live from the page's own DOM (single source of truth). **Only `ask ...` calls the AI**; plain sentences are not sent anywhere. `replay wazuh` replays the **real** 33 alerts from the identity lab's evidence file (`assets/replay.json`), grouped by simulation, with the honest caveats printed. Never invent output.
- **Suggestion chips:** per load, `help` plus 2 instant commands (`cat`/`diagram`), 2 `ask` prompts and 1 extra, chosen from a pool of 2 ask prompts per project. Keep ask prompts answerable from the write-ups.
- **`ask` backend:** browser keyword search over `assets/knowledge.json`, then POST to the Cloudflare Worker (`worker/`, URL in `data-ask-url` on `#term`), which holds the Groq key and calls `openai/gpt-oss-20b` (set in `worker/wrangler.toml`; if Groq retires it, change `MODEL` and run `./worker/deploy.sh`). The Worker only answers the site's origin and localhost, caps input and rate. The key lives only in `.env` (gitignored) and in Cloudflare.
- **Architecture diagrams (`js/diagrams.js`):** SVG drawn from data in that file; click a box for what it does and where it falls short; trace buttons send a packet along real flows; the self-healing diagram has "Kill Instance A". Every claim must come from the project write-ups. On phones the dialog is full-screen and scrolls sideways.
- **Scroll story (`js/story.js`):** pins and flips five defects from broken to fixed. Text comes from the page's `<dl class="defects">`, which stays in the DOM for screen readers.
- **Certificate ring (`js/carousel.js`):** 3D ring with prev/next, arrow keys, swipe, slow auto-turn (paused on hover, focus, offscreen, reduced motion). The original `<ol class="certs">` stays visually hidden for screen readers.
- **Globe (`js/hero.js`, canvas `#globe-canvas`):** Three.js (vendored in `assets/vendor/`), dotted sphere, three arcs between Hyderabad, us-east-1, ap-south-1. Slow spin, no pointer reaction, pauses offscreen, still frame with reduced motion, nothing without WebGL.
- **Sound (`js/sfx.js`):** tiny synthesised UI ticks, **on by default** (he chose this), toggle in the header, remembered. Browsers only allow audio after the first click or key press.
- **The rail (`js/rail.js`), copied from PdfCraft's page at his request ("exactly as done"), wide screens only (min-width 64rem):**
  - 60px fixed strip on the right with blur and a left-fading mask; 101 ticks at 1% of the document each (number every 5%), sliding 1:1 with scroll; a marker with an odometer percent readout at `60 + progress * (vh - 70)`; a thumb and guide line on hover; fisheye on ticks near the pointer; click, drag and keyboard scrubbing; `role="scrollbar"`; native scrollbar hidden (`html.rail-on`).
  - The ruler's start line (the 2px accent marker at scroll 0) must sit exactly on the header's bottom edge, over the header and section-bar borders with no gap: `TOP = header.offsetHeight - 1`.
  - Section names are per-letter spans. At rest: upcoming names small in a bottom-right list, past names small and dim in a top-right stack, current name large (34px) below them. The next name **sticks to its section**: once that section's top edge is 40px up the screen the whole word leaves the list and turns vertical (finishing over 160px of scroll), hanging just under the section's top edge (`0.065 * viewportHeight` below it) and rising 1:1 with the page. Each letter then swings into the current slot when its own height crosses a band between 42.5% and 28% of the viewport (x eased out cubic, y linear, rotation and scale linear). The previous name shrinks to the stack over a 200px window. The head letter finishes at `sectionTop - 0.215 * viewportHeight`.
  - The big current name is click-through; small ones link to their section.
  - Reduced motion snaps names instead of animating.
- **Sticky section bars (`.sec-bar`):** every section starts with a full-bleed bar ("02 / PROJECTS ... EIGHT AWS AND AZURE PROJECTS") that pins under the header until the next section's bar replaces it. Height 2.6rem (2.25rem on phones); right-hand text hidden on phones and kept clear of the name stack on wide screens. `--header-h` is set by `script.js`; anchors use `scroll-padding-top` plus a negative `scroll-margin-top` on sections so a jump leaves the bar directly under the header.

## 6. Layering and breakpoints

z-index: section bars 10, header 20, rail 15, rail names 16 (header covers the top of the rail). Dialogs use the top layer.

Breakpoints (rem): **30** tiny header tweak, **40** phone polish (terminal chips, full-screen diagrams, shorter story, bars shorten), **52** hero becomes two columns and header nav moves inline, **64** the rail and names appear. Always check 360, 390 and 1280 wide.

## 7. Hard technical constraints

- **CSP** (a `<meta>` tag in `index.html`): `script-src 'self'` plus one `sha256` hash for the tiny inline theme script in `<head>`. **Do not edit that inline script's text**, or the hash breaks and the theme flash returns. `style-src 'self'` means **no `style="..."` attributes and no `setAttribute('style')`**; setting `el.style.x` in JS is fine. `connect-src` allows `formspree.io` and `*.workers.dev`. `frame-src 'none'`.
- No third-party requests at runtime besides the form and the Worker.
- Accessibility is tested, not hoped for: `npx playwright test` runs axe in light, dark and at 360px wide, checks for console errors and sideways scroll. **axe also checks text inside `aria-hidden` elements**, so dimmed decorative text still needs real contrast (the cert ring uses a scrim instead of opacity for this reason).
- `prefers-reduced-motion` must be respected by every animation.
- Keyboard and screen-reader paths must exist for anything pointer-driven (the rail has keys; the ring has buttons; diagrams have focusable nodes).
- The design checker (`impeccable detect`) is run by a hook. It enforces the 11px minimum, padding, no coloured glows and no bounce easing. One recorded ignore exists in `.impeccable/config.json` (`cramped-padding` for `index.html`, a false positive on `.sec-bar`'s `max()` padding). Inter Tight is flagged as an "overused font"; it is the chosen typeface, leave it.

## 8. Working agreements with the owner

- Explain things in plain language; he is happy to say when something is unclear.
- He often asks for options and then wants them built "in one shot"; confirm what was built and what was not verified.
- **Do not commit or push unless asked.** When pushing, `main` is the branch; the nightly Action commits `assets/knowledge.json` to `main` at 03:17 UTC, so a push can need `git pull --rebase` (regenerate that file if it conflicts).
- Do not add attribution lines to commit messages.
- `.env` must never be committed or printed. Deploy the Worker with `./worker/deploy.sh`.
- Verify visually before saying done: headless Chromium screenshots at 360, 390, 1280 (light and dark), the real flows, and the Playwright suite.

## 9. File map

| Path | What |
| --- | --- |
| `index.html`, `style.css`, `script.js` | the page, all styles, core behaviour |
| `js/` | `main.js` (loader), `sfx`, `glass`, `terminal`, `diagrams`, `story`, `carousel`, `hero` (globe), `rail` |
| `assets/` | `media/` (portrait, CV, certificate, badge), `fonts/`, `vendor/three.module.min.js`, `og-card.png`, `replay.json`, `knowledge.json`, `qr-card.svg`, `sannidhi-sriram.vcf`, old static `diagrams/` (fallback only) |
| `worker/` | Cloudflare Worker for `ask` (`index.js`, `wrangler.toml`, `deploy.sh`) |
| `scripts/` | `build-knowledge.mjs` (nightly), `build-replay.mjs` (one-off from the lab's evidence file), `repos.mjs` |
| `.github/workflows/` | `nightly.yml` (knowledge rebuild), `ci.yml` (Lighthouse and axe/screenshots) |
| `tests/`, `playwright.config.js`, `lighthouserc.json` | checks |
| `llms.txt`, `robots.txt`, `sitemap.xml` | crawler files, keep in sync with the copy |

## 10. Known gaps (not verified)

- Not tried on a real phone or in iOS Safari (glass lens is Chromium-only by design; WebGL globe, 100dvh dialog and the sound on iOS are untested).
- The CI workflows have only been seen running for the nightly job; the "Checks" workflow result on GitHub has not been reviewed.
- The CV PDF is a separate file and may still use older wording (for example "Secondary School Certificate").
