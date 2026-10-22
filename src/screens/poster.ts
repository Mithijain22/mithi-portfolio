import { gsap } from 'gsap';
import { PROJECTS } from '../content.ts';

// Case study teaser. Content comes only from content.ts.
export function showPoster(i: number, secs: number, last: boolean, onDone: () => void) {
  const p = PROJECTS[i];
  const el = document.createElement('div');
  el.className = 'poster';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', p.title);
  el.innerHTML = `<p class="pidx">${p.index} &nbsp; FOUND IN ${secs.toFixed(1)}S</p>
  <h2 class="ptitle">${p.title}</h2><p class="script pnote">${p.annotation}</p>
  <p class="pout">${p.outcome}</p>
  <div class="p3"><div><h3>PROBLEM</h3><p>${p.problem}</p></div><div><h3>APPROACH</h3><p>${p.approach}</p></div><div><h3>RESULT</h3><p>${p.result}</p></div></div>
  <p class="pmeta">${p.role} / ${p.timeline} / ${p.tools}</p>
  <div class="pbtns"><a class="pbtn" href="/work/${p.slug}">READ FULL CASE STUDY</a><button class="pbtn alt" type="button">${last ? 'SEE ALL WORK' : 'KEEP PLAYING'}</button></div>`;
  document.body.appendChild(el);
  const close = () => { document.removeEventListener('keydown', esc); el.remove(); onDone(); };
  const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  el.querySelector('button')!.addEventListener('click', close);
  el.addEventListener('click', (e) => { if (e.target === el) close(); });
  el.querySelector<HTMLElement>('.pbtn')!.focus();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from(el, { opacity: 0, duration: 0.3, ease: 'steps(3)' });
    gsap.from('.ptitle', { x: 20, duration: 0.6, ease: 'steps(4)' });   // off-register, then snaps
    gsap.from('.pidx, .pnote, .pout, .p3, .pmeta, .pbtns', { opacity: 0, y: 12, duration: 0.4, delay: 0.5, stagger: 0.08 });
  }
}
