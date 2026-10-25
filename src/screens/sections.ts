import { PROJECTS, LINKS } from '../content.ts';

// Placeholder work section + footer links (the work section gets redesigned later).
export function mountSections() {
  const app = document.getElementById('app')!;
  const work = document.createElement('section');
  work.id = 'work'; work.className = 'worksec';
  work.innerHTML = `<h2>WORK</h2><ol>${PROJECTS.map((p) => `<li><a href="/work/${p.slug}"><span>${p.index}</span><b>${p.title}</b><em>${p.outcome}</em></a></li>`).join('')}</ol>`;
  const foot = document.createElement('footer');
  foot.id = 'links'; foot.className = 'foot';
  foot.innerHTML = `<a href="mailto:${LINKS.email}">${LINKS.email}</a><a href="${LINKS.linkedin}">LinkedIn</a>${LINKS.github ? `<a href="${LINKS.github}">GitHub</a>` : ''}<a href="#game">PLAY AGAIN</a>`;
  app.append(work, foot);
}
