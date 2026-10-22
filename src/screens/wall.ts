import { gsap } from 'gsap';
import { ROUNDS } from '../game/rounds.ts';
import { showPoster } from './poster.ts';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export function startWall() {
  document.querySelector('.hero')?.remove();
  runRound(0);
}

function runRound(i: number) {
  const r = ROUNDS[i];
  const [cols, rows] = innerWidth < 768 ? r.m : r.d;
  const oc = 1 + Math.floor(Math.random() * (cols - 2)), or = 1 + Math.floor(Math.random() * (rows - 2)); // never on the edge
  const el = document.createElement('section');
  el.className = 'wall';
  el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; el.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  el.innerHTML = `<p class="whud">0${i + 1} / 03</p>`;
  const tiles: HTMLButtonElement[] = [];
  let odd!: HTMLButtonElement;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const isOdd = x === oc && y === or;
    const b = document.createElement('button');
    b.className = 'tile'; b.setAttribute('aria-label', 'tile');
    const rot = rnd(-3, 3);
    b.innerHTML = `<img alt="" draggable="false" src="${isOdd ? r.odd : r.rep}" style="transform:rotate(${rot}deg)${isOdd && r.mode === 'mirror' ? ' scaleX(-1)' : ''}">`;
    b.dataset.row = String(y);
    if (isOdd) odd = b;
    b.addEventListener('click', () => (isOdd ? win() : gsap.fromTo(b, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1,0.3)' })));
    el.appendChild(b); tiles.push(b);
  }
  document.getElementById('app')!.appendChild(el);

  // slow drift with a different speed and direction per row
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const drift: gsap.core.Tween[] = [];
  if (!reduce) tiles.forEach((t) => { const y = +t.dataset.row!; drift.push(gsap.to(t, { x: (y % 2 ? 1 : -1) * (16 + y * 5), duration: 5 + y, yoyo: true, repeat: -1, ease: 'sine.inOut' })); });

  const t0 = performance.now();
  const h1 = setTimeout(() => gsap.to(odd.firstElementChild, { rotation: '+=5', duration: 0.12, yoyo: true, repeat: 5 }), 10000);
  const h2 = setTimeout(() => odd.classList.add('hint'), 20000);

  function win() {
    clearTimeout(h1); clearTimeout(h2); drift.forEach((d) => d.kill());
    const secs = (performance.now() - t0) / 1000;
    const o = odd.getBoundingClientRect(), ox = o.left + o.width / 2, oy = o.top + o.height / 2;
    const others = tiles.filter((t) => t !== odd);
    tiles.forEach((t) => { t.disabled = true; });
    gsap.to(others, { duration: reduce ? 0.2 : 0.6, ease: 'power3.in', opacity: 0, scale: 2.4,
      x: (_i, t: HTMLElement) => { const b = t.getBoundingClientRect(); return (b.left + b.width / 2 - ox) * 0.8; },
      y: (_i, t: HTMLElement) => { const b = t.getBoundingClientRect(); return (b.top + b.height / 2 - oy) * 0.8; },
      onComplete: () => showPoster(i, secs, i === ROUNDS.length - 1, () => { el.remove(); i < ROUNDS.length - 1 ? runRound(i + 1) : exit(); }) });
  }
}

function exit() {
  try { sessionStorage.setItem('played', '1'); } catch { /* ignore */ }
  const w = document.createElement('div');
  w.className = 'wipe';
  document.body.appendChild(w);
  gsap.fromTo(w, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'power2.inOut', onComplete: () => location.assign('/work') });
}
