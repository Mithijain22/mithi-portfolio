import { gsap } from 'gsap';
import { LOADER_TEXT } from '../content.ts';

const lines = (a: string[]) => a.map((s) => `<div>${s}</div>`).join('');

// 0 to 100 %, then a few quick glitch flickers, then resolves.
export function runLoader(ready: Promise<unknown> = Promise.resolve()): Promise<void> {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el = document.createElement('div');
  el.className = 'loader';
  el.innerHTML = `<div class="lt tl">${lines(LOADER_TEXT.tl)}</div><div class="lt tr">${lines(LOADER_TEXT.tr)}</div><div class="lt bl">${lines(LOADER_TEXT.bl)}</div>
  <div class="lbar"><i></i></div><div class="lcount"><span>LOADING</span><b>0</b><em>%</em></div>`;
  document.getElementById('app')!.appendChild(el);
  const num = el.querySelector('b')!, bar = el.querySelector<HTMLElement>('.lbar i')!;
  const n = { v: 0 };
  return new Promise((done) => {
    const tl = gsap.timeline({ onComplete: () => { el.remove(); done(); } });
    const upd = () => { const p = Math.round(n.v); num.textContent = String(p); bar.style.width = p + '%'; };
    tl.to(n, { v: 90, duration: reduce ? 0.2 : 2.2, ease: 'power1.inOut', onUpdate: upd });
    // hold at 90 % until the pictures and fonts are really loaded (but never longer than 8 s)
    tl.call(() => { tl.pause(); Promise.race([ready, new Promise((r) => setTimeout(r, 8000))]).then(() => tl.play()); });
    tl.to(n, { v: 100, duration: 0.25, ease: 'none', onUpdate: upd });
    if (reduce) return;
    // glitch: slivers flash at the sides, the counter stutters
    const t0 = tl.duration();
    for (let i = 0; i < 9; i++) {
      const g = document.createElement('div');
      g.className = 'gl';
      Object.assign(g.style, { top: Math.random() * 90 + 5 + '%', [i % 2 ? 'left' : 'right']: '0', width: 40 + Math.random() * 260 + 'px', height: 2 + Math.random() * 14 + 'px' });
      el.appendChild(g);
      const t = t0 + i * 0.05;
      tl.set(g, { opacity: 1, x: (Math.random() - 0.5) * 60 }, t).set(g, { opacity: 0 }, t + 0.04);
    }
    tl.set(num, { opacity: 0 }, t0 + 0.1).set(num, { opacity: 1 }, t0 + 0.16).set(el, { opacity: 0 }, t0 + 0.5);
  });
}
