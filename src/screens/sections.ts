import { PROJECTS, LINKS } from '../content.ts';
import { bandsCross, bandsSingle, bandsParallel } from './bands.ts';

// Work section: three colour panels (teal, yellow, hot pink), then the footer with links.
const BG = ['#12B5C4', '#F5D90A', '#EE3E9C'];
const dots = Array.from({ length: 6 * 14 }, (_, k) => { const r = Math.floor(k / 14), c = k % 14;
  return `<circle cx="${10 + c * 11 + (r % 2) * 5}" cy="${8 + r * 14}" r="${(2 + ((r * 5 + c * 3) % 5)) / 1.6}"/>`; }).join('');
const dotArt = `<svg viewBox="0 0 160 84" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g fill="var(--bg)">${dots}</g></svg>`;

export function mountSections() {
  const app = document.getElementById('app')!;
  const work = document.createElement('section');
  work.id = 'work'; work.className = 'worksec';
  work.innerHTML = `<div class="whead"><h2>WORK</h2></div>
  <ol class="wlist">${PROJECTS.map((p, i) => `<li class="wpanel" style="--bg:${BG[i % 3]}"><a href="${p.repo || `/work/${p.slug}`}"${p.repo ? ' target="_blank" rel="noopener"' : ''}>
    <span class="widx">${p.index}</span>
    <span class="wimg">${p.cardStat ? `<span class="wstat"><b>${p.cardStat.value}</b><i>${p.cardStat.label}</i></span>` : p.heroImage ? `<img src="${p.heroImage}" alt="" loading="lazy" width="600" height="900">` : dotArt}</span>
    <b>${p.title}</b><em>${p.summary}</em><span class="wbtn">VIEW PROJECT &rarr;</span></a></li>`).join('')}</ol>`;
  const foot = document.createElement('footer');
  foot.id = 'links'; foot.className = 'foot';
  foot.innerHTML = `<p class="script">See you</p><div class="flinks">
    <a href="${LINKS.linkedin}" target="_blank" rel="noopener"><b>LINKEDIN</b><span>linkedin.com/in/mithi-jain-856825330</span></a>
    <a href="${LINKS.github}" target="_blank" rel="noopener"><b>GITHUB</b><span>github.com/Mithijain22</span></a>
    <a href="mailto:${LINKS.email}"><b>EMAIL</b><span>${LINKS.email}</span></a></div>
    <a class="fplay" href="#game">PLAY AGAIN</a>`;
  // hero, bands, work, bands, [game goes here], bands, footer
  app.append(bandsCross(), work, bandsSingle(), bandsParallel(), foot);
}
