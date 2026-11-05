// Generates /work, /work/<slug>, /about, sitemap.xml and robots.txt from
// src/content.ts + /templates. Runs as predev and prebuild.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { NAME, LINKS, PROJECTS, SITE_URL } from '../src/content.ts';
import { SPRITE, OBJECT_IDS, CW, obj, lips } from './objects.ts';

const ROOT = resolve(import.meta.dirname, '..');
const tpl = (name: string) => readFileSync(join(ROOT, 'templates', name), 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Vars = Record<string, string>;

const inline = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
// blank line = paragraph, lines starting with "- " = bullet list, **bold**
function rich(body: string): string {
  return body.trim().split(/\n\s*\n/).map((b) => {
    const lines = b.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.every((l) => l.startsWith('- '))
      ? `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join('')}</ul>`
      : `<p>${inline(lines.join(' '))}</p>`;
  }).join('');
}

function render(template: string, vars: Vars): string {
  // partials first ({{> name}}), then raw ({{{x}}}), then escaped ({{x}})
  let out = template.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, n: string) => tpl(`${n}.html`));
  out = out.replace(/\{\{\{(\w+)\}\}\}/g, (_, k: string) => vars[k] ?? '');
  out = out.replace(/\{\{(\w+)\}\}/g, (_, k: string) => esc(vars[k] ?? ''));
  return out;
}

const site = SITE_URL.replace(/\/$/, '');

// footer wall: tilted grid of colorway objects
const wall = (() => {
  let h = '';
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 12; c++) {
      h += obj(OBJECT_IDS[(r * 3 + c) % OBJECT_IDS.length], CW[(r + c) % CW.length]);
    }
  }
  return h;
})();


function shared(path: string, title: string, description: string): Vars {
  const url = site ? `${site}${path}` : '';
  return {
    title,
    description,
    canonical: url ? `<link rel="canonical" href="${esc(url)}">` : '',
    ogUrl: url ? `<meta property="og:url" content="${esc(url)}">` : '',
    name: NAME,
    sprite: SPRITE,
    wall,
    email: LINKS.email,
    linkedin: LINKS.linkedin,
    github: LINKS.github,
  };
}

// Duotone art block. Falls back to flat colour + halftone dots when no image is set.
function art(src: string, cw: string, extra = ''): string {
  const inner = src
    ? `<img src="${esc(src)}" alt="" loading="lazy" width="1600" height="900">`
    : `<svg class="art-dots" viewBox="0 0 160 96" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><use href="#art-dots"/></svg>`;
  return `<div class="art misreg cw-${cw} ${extra}">${inner}</div>`;
}

function write(relPath: string, html: string) {
  const full = join(ROOT, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, html);
}

// start clean so removed projects do not leave stale folders
rmSync(join(ROOT, 'work'), { recursive: true, force: true });
rmSync(join(ROOT, 'about'), { recursive: true, force: true });

// /work/<slug>
PROJECTS.forEach((p, i) => {
  const cw = CW[i % CW.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const sections = p.caseStudy.sections
    .map((s, j) => `<section class="cs-section"><h2>${esc(s.heading)}</h2>${rich(s.body)}${
      s.image ? art(s.image, CW[(i + j + 1) % CW.length], 'full') : ''
    }</section>`)
    .join('\n');
  write(`work/${p.slug}/index.html`, render(tpl('case-study.html'), {
    ...shared(`/work/${p.slug}`, `${p.title} | ${NAME}`, p.summary),
    cw,
    index: p.index,
    projectTitle: p.title,
    annotation: p.annotation,
    meta: ([['ROLE', p.role], ['TIMELINE', p.timeline], ['TOOLS', p.tools], ['OUTCOME', p.outcome]] as [string, string][])
      .filter(([, v]) => v).map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join(''),
    stats: p.stats.length ? `<ul class="cs-stats">${p.stats.map((t) => `<li><b>${esc(t.value)}</b><span>${esc(t.label)}</span></li>`).join('')}</ul>` : '',
    links: `<p class="cs-links">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} &rarr;</a>`).join('')}<a class="cs-back" href="/#game">BACK TO THE GAME</a></p>`,
    art: art(p.heroImage, cw),
    sections,
    nextSlug: next.slug,
    nextTitle: next.title,
  }));
});

// sitemap only when a real domain is set; robots.txt always
const routes = ['/', ...PROJECTS.map((p) => `/work/${p.slug}`)];
if (site) {
  write('public/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      routes.map((r) => `  <url><loc>${site}${r}</loc></url>`).join('\n')
    }\n</urlset>\n`);
}
write('public/robots.txt', `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);

console.log(`build-pages: wrote ${PROJECTS.length} case study page(s)`);
