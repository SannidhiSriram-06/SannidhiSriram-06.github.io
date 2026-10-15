/* Builds assets/knowledge.json: READMEs plus the site's own text, cut into chunks for the "ask" terminal.
   Retrieval is plain keyword matching in the browser, so there is no vector database. */
import { readFile, writeFile } from 'node:fs/promises';
import { OWNER, REPOS } from './repos.mjs';

const MAX = 900;
const chunks = [];

const add = (source, text) => {
  text = text.replace(/\s+/g, ' ').trim();
  for (let i = 0; i < text.length; i += MAX) {
    const part = text.slice(i, i + MAX).trim();
    if (part.length > 40) chunks.push({ source, text: part });
  }
};

const clean = (md) =>
  md
    .replace(/```[\s\S]*?```/g, ' ') // code and mermaid blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#|]/g, ' ')
    .replace(/:?-{3,}:?/g, ' ');

// Site text, section by section.
const html = await readFile('index.html', 'utf8');
for (const m of html.matchAll(/<section[^>]*id="([^"]+)"[\s\S]*?<\/section>/g)) {
  const seen = new Set();
  const parts = [...m[0].matchAll(/<(h3|p|dt|dd|li)[^>]*>([\s\S]*?)<\/\1>/g)]
    .map((p) => p[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((t) => t && !seen.has(t) && seen.add(t));
  add('site:' + m[1], parts.join(' '));
}

// READMEs, split on headings so a chunk stays on one topic.
for (const repo of REPOS) {
  const res = await fetch(`https://raw.githubusercontent.com/${OWNER}/${repo}/HEAD/README.md`);
  if (!res.ok) { console.warn('skip', repo, res.status); continue; }
  const md = await res.text();
  for (const sec of md.split(/\n(?=#{1,3} )/)) add('readme:' + repo, clean(sec));
}

await writeFile('assets/knowledge.json', JSON.stringify(chunks) + '\n');
console.log(chunks.length, 'chunks');
