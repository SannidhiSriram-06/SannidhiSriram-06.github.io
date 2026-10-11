# Sannidhi Durga Pavan Sriram: portfolio

Source for <https://sannidhisriram-06.github.io/>, a one-page portfolio for cloud, DevOps and SRE roles.

It is plain HTML, one stylesheet and a small script. There is no build step and no framework.

## What is on it

- Eight AWS and Azure projects, each with a "what works" and a "limits" paragraph, checked against the code in its repository.
- Experience, certifications (with verification links), education and a contact form.
- Architecture diagrams for five of the projects, opened on demand from `assets/diagrams/`.

## Run it locally

```bash
npx serve .
```

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | the page |
| `style.css` | light and dark themes, layout |
| `script.js` | theme toggle, diagram dialog, contact form |
| `assets/diagrams/` | Archify architecture diagrams |
| `llms.txt` | plain-text summary for language-model crawlers |

## Content rule

A project claim goes on the page only if the repository's code or evidence supports it. Known gaps are written on the page as "Limits".
