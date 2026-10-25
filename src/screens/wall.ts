import { gsap } from 'gsap';
import { ROUNDS } from '../game/rounds.ts';
import { showPoster } from './poster.ts';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initGame(screen: HTMLElement) {
  const msg = (title: string, sub: string, btns: [string, () => void][]) => {
    const m = document.createElement('div');
    m.className = 'tmsg';
    m.innerHTML = `<h2>${title}</h2><p>${sub}</p><div>${btns.map((b, i) => `<button type="button" data-i="${i}">${b[0]}</button>`).join('')}</div>`;
    m.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { m.remove(); btns[+b.dataset.i!][1](); }));
    screen.appendChild(m);
  };
  const setHud = (i: number) => {
    document.getElementById('tv-count')!.textContent = `0${i + 1} / 03`;
    document.getElementById('tv-ch')!.textContent = `BIG MOUTH  CH.0${i + 1}`;
  };
  const intro = () => { setHud(0); msg('FIND THE ODD ONE', '3 rounds. Click or tap the one that is different.', [['START', () => round(0)]]); };

  function round(i: number) {
    setHud(i);
    const r = ROUNDS[i];
    const [cols, rows] = innerWidth < 768 ? r.m : r.d;
    const oc = 1 + Math.floor(Math.random() * (cols - 2)), or = 1 + Math.floor(Math.random() * (rows - 2)); // never on the edge
    const grid = document.createElement('div');
    grid.className = 'tgrid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`; grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.style.setProperty('--tile', r.tile);
    const tiles: HTMLButtonElement[] = [];
    let odd!: HTMLButtonElement;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const isOdd = x === oc && y === or;
      const b = document.createElement('button');
      b.className = 'ttile'; b.setAttribute('aria-label', 'tile'); b.dataset.row = String(y);
      b.innerHTML = `<span class="tcard" style="transform:rotate(${rnd(-3, 3)}deg)"><img alt="" draggable="false" src="${isOdd ? r.odd : r.rep}"></span>`;
      if (!reduce) { const nx = (x + 0.5) / cols * 2 - 1, ny = (y + 0.5) / rows * 2 - 1; gsap.set(b, { z: 70 * (1 - Math.min(1, Math.hypot(nx, ny) / 1.3)) }); } // slight bulge
      b.addEventListener('click', () => (isOdd ? win() : gsap.fromTo(b, { x: '-=8' }, { x: '+=8', duration: 0.4, ease: 'elastic.out(1,0.3)' })));
      if (isOdd) odd = b;
      grid.appendChild(b); tiles.push(b);
    }
    screen.appendChild(grid);
    const fit = () => grid.style.setProperty('--side', Math.min(grid.clientWidth / cols, grid.clientHeight / rows) * 0.82 + 'px');
    fit(); addEventListener('resize', fit);

    const tweens: gsap.core.Tween[] = [];
    let roll: number | undefined;
    if (!reduce) {
      tiles.forEach((t) => { const y = +t.dataset.row!; tweens.push(gsap.to(t, { x: (y % 2 ? 1 : -1) * (14 + y * 4), duration: 5 + y, yoyo: true, repeat: -1, ease: 'sine.inOut' })); });
      tweens.push(gsap.fromTo(grid, { rotationY: -8 }, { rotationY: 8, duration: 6, yoyo: true, repeat: -1, ease: 'sine.inOut' })); // sway
      roll = window.setInterval(() => gsap.fromTo(grid, { rotationZ: 0 }, { rotationZ: 4, duration: 0.5, yoyo: true, repeat: 1, ease: 'power2.inOut' }), 9000); // occasional roll
    }
    const t0 = performance.now();
    const h1 = setTimeout(() => gsap.to(odd.firstElementChild, { rotation: '+=5', duration: 0.12, yoyo: true, repeat: 5 }), 10000);
    const h2 = setTimeout(() => odd.classList.add('hint'), 20000);

    function win() {
      clearTimeout(h1); clearTimeout(h2); clearInterval(roll); tweens.forEach((t) => t.kill());
      const secs = (performance.now() - t0) / 1000;
      const o = odd.getBoundingClientRect(), ox = o.left + o.width / 2, oy = o.top + o.height / 2;
      tiles.forEach((t) => { t.disabled = true; });
      gsap.to(tiles.filter((t) => t !== odd), { duration: reduce ? 0.2 : 0.6, ease: 'power3.in', opacity: 0, scale: 2.2,
        x: (_k, t: HTMLElement) => { const b = t.getBoundingClientRect(); return (b.left + b.width / 2 - ox) * 0.8; },
        y: (_k, t: HTMLElement) => { const b = t.getBoundingClientRect(); return (b.top + b.height / 2 - oy) * 0.8; },
        onComplete: () => showPoster(i, secs, i === ROUNDS.length - 1, () => {
          removeEventListener('resize', fit); grid.remove();
          if (i < ROUNDS.length - 1) round(i + 1); else done();
        }) });
    }
  }

  function done() {
    try { sessionStorage.setItem('played', '1'); } catch { /* ignore */ }
    msg('ALL THREE FOUND', 'Now go and see the work.', [['SEE THE WORK', () => { document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' }); intro(); }], ['PLAY AGAIN', intro]]);
  }
  intro();
}
