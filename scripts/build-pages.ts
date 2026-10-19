// Generates /work, /work/<slug>, /about, sitemap.xml and robots.txt from
// src/content.ts + /templates. Runs as predev and prebuild.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  NAME, TAGLINE, PORTRAIT, ABOUT, AI_BUILD_NOTE, BUILD_TOOLS, BUILD_PROBLEMS,
  LINKS, PROJECTS, SITE_URL,
} from '../src/content.ts';
import { SPRITE, OBJECT_IDS, CW, obj, lips } from './objects.ts';

const ROOT = resolve(import.meta.dirname, '..');
const tpl = (name: string) => readFileSync(join(ROOT, 'templates', name), 'utf8');

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Vars = Record<string, string>;

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

// marquee strip of colorway objects (one set; template repeats it for a seamless loop)
const marquee = Array.from({ length: 12 }, (_, i) =>
  obj(OBJECT_IDS[i % OBJECT_IDS.length], CW[i % CW.length])).join('');

function shared(path: string, title: string, description: string, current: 'work' | 'about' | ''): Vars {
  const url = site ? `${site}${path}` : '';
  return {
    title,
    description,
    canonical: url ? `<link rel="canonical" href="${esc(url)}">` : '',
    ogUrl: url ? `<meta property="og:url" content="${esc(url)}">` : '',
    name: NAME,
    sprite: SPRITE,
    wall,
    workCurrent: current === 'work' ? ' aria-current="page"' : '',
    aboutCurrent: current === 'about' ? ' aria-current="page"' : '',
    email: LINKS.email,
    linkedin: LINKS.linkedin,
    resume: LINKS.resume,
    githubItem: LINKS.github ? `<li><a href="${esc(LINKS.github)}">GitHub</a></li>` : '',
  };
}

// Duotone art block. Falls back to flat colour + halftone dots when no image is set.
function art(src: string, cw: string, extra = ''): string {
  const inner = src
    ? `<img src="${esc(src)}" alt="" loading="lazy" width="1600" height="900">`
    : `<svg class="art-dots" viewBox="0 0 160 96" aria-hidden="true" preserveAspectRatio="xMidYMid slice"><use href="#art-dots"/></svg>`;
  return `<div class="art duo misreg cw-${cw} ${extra}">${inner}</div>`;
}

function write(relPath: string, html: string) {
  const full = join(ROOT, relPath);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, html);
}

// start clean so removed projects do not leave stale folders
rmSync(join(ROOT, 'work'), { recursive: true, force: true });
rmSync(join(ROOT, 'about'), { recursive: true, force: true });

// /work
const rows = PROJECTS.map((p, i) => {
  const cw = CW[i % CW.length];
  return `<li class="project-row cw-${cw}"><a href="/work/${esc(p.slug)}">
      <span class="index">${esc(p.index)}</span>
      <span class="row-title">${esc(p.title)}</span>
      <span class="row-outcome">${esc(p.outcome)}</span>
      <span class="row-meta">${esc(p.role)} / ${esc(p.timeline)}</span>
      <span class="row-art">${art(p.heroImage, cw)}</span>
    </a></li>`;
}).join('\n');
write('work/index.html', render(tpl('work.html'), {
  ...shared('/work', `Work | ${NAME}`, `Selected product work by ${NAME}. ${TAGLINE}`, 'work'),
  projectRows: rows,
  marquee,
}));

// /work/<slug>
PROJECTS.forEach((p, i) => {
  const cw = CW[i % CW.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const sections = p.caseStudy.sections
    .map((s, j) => `<section class="cs-section"><h2>${esc(s.heading)}</h2><p>${esc(s.body)}</p>${
      s.image ? art(s.image, CW[(i + j + 1) % CW.length], 'full') : ''
    }</section>`)
    .join('\n');
  write(`work/${p.slug}/index.html`, render(tpl('case-study.html'), {
    ...shared(`/work/${p.slug}`, `${p.title} | ${NAME}`, p.summary, 'work'),
    cw,
    index: p.index,
    projectTitle: p.title,
    annotation: p.annotation,
    role: p.role,
    timeline: p.timeline,
    tools: p.tools,
    outcome: p.outcome,
    art: art(p.heroImage, cw),
    sections,
    nextSlug: next.slug,
    nextTitle: next.title,
  }));
});

// /about
write('about/index.html', render(tpl('about.html'), {
  ...shared('/about', `About | ${NAME}`, ABOUT.slice(0, 155), 'about'),
  tagline: TAGLINE,
  about: ABOUT,
  aiBuildNote: AI_BUILD_NOTE,
  portrait: PORTRAIT
    ? `<img class="portrait" src="${esc(PORTRAIT)}" alt="Portrait of ${esc(NAME)}" width="800" height="1000" loading="lazy">`
    : lips('lips-big'),
  tools: BUILD_TOOLS.map((t) => `<li>${esc(t)}</li>`).join(''),
  problems: BUILD_PROBLEMS.map((t) => `<li>${esc(t)}</li>`).join(''),
  repoLink: LINKS.github ? `<p><a class="big-link small" href="${esc(LINKS.github)}">VIEW THE CODE</a></p>` : '',
}));

// sitemap only when a real domain is set; robots.txt always
const routes = ['/', '/work', ...PROJECTS.map((p) => `/work/${p.slug}`), '/about'];
if (site) {
  write('public/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      routes.map((r) => `  <url><loc>${site}${r}</loc></url>`).join('\n')
    }\n</urlset>\n`);
}
write('public/robots.txt', `User-agent: *\nAllow: /\n${site ? `Sitemap: ${site}/sitemap.xml\n` : ''}`);

console.log(`build-pages: wrote /work, /about and ${PROJECTS.length} case study page(s)`);
