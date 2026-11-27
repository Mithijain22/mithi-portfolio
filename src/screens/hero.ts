import { gsap } from 'gsap';
import { NAME, TAGLINE, HERO_IMAGES } from '../content.ts';

const TUBE = `<svg viewBox="0 0 260 90" aria-hidden="true"><path d="M12 16L180 26V64L12 74Z" fill="#CFD3D6" stroke="#0A0A0A" stroke-width="3" stroke-linejoin="round"/><path d="M12 16L3 22V68L12 74" fill="#9EA3A8" stroke="#0A0A0A" stroke-width="3" stroke-linejoin="round"/><rect x="180" y="28" width="62" height="34" fill="#F2502C" stroke="#0A0A0A" stroke-width="3"/><path d="M192 28V62M204 28V62M216 28V62M228 28V62" stroke="#0A0A0A" stroke-width="2"/><text x="26" y="58" font-family="Anton,Impact,sans-serif" font-size="34" fill="#BD2E0B">PLAY</text><path d="M104 38V62M108 38V62M113 38V62M117 38V62M122 38V62M127 38V62M131 38V62" stroke="#0A0A0A" stroke-width="2"/></svg>`;

function toast(msg: string) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

export function showHero() {
  const hero = document.createElement('section');
  hero.className = 'hero';
  const letters = [...NAME].map((c, i) => `<span class="letter" style="--img:url(${HERO_IMAGES[i] ?? ''})">${c}</span>`).join('');
  hero.innerHTML = `
  <nav class="hnav" aria-label="Main"><div class="grp"><a href="#game" data-play>PLAY</a><a href="#work">WORK</a></div>
    <span class="hmark">${NAME}</span><div class="grp r"><a href="#links">CONTACT</a></div></nav>
  <h1 class="hname" aria-label="${NAME}"><span aria-hidden="true">${letters}</span></h1>
  <div class="hrows" aria-hidden="true">${'<span>PLAY</span>'.repeat(6)}</div>
  <p class="htag">${TAGLINE}</p>
  <p class="hint">HOVER THE LETTERS</p>
  <button class="tube" type="button" data-play aria-label="Play">${TUBE}</button>`;
  document.getElementById('app')!.appendChild(hero);

  hero.querySelectorAll<HTMLElement>('.letter').forEach((l) => {
    l.addEventListener('click', () => { l.classList.toggle('on'); hero.querySelector('.hint')?.remove(); }); // touch
    l.addEventListener('mouseenter', () => hero.querySelector('.hint')?.remove());
  });
  // Make the word wider (up to 86% of the screen) by stretching it sideways, and counter-scale the pictures
  // inside the letters so the faces are not squashed.
  const nameEl = hero.querySelector<HTMLElement>('.hname')!;
  const span = nameEl.querySelector<HTMLElement>(':scope > span')!;
  const letterEls = [...hero.querySelectorAll<HTMLElement>('.letter')];
  const dims: ([number, number] | null)[] = HERO_IMAGES.map(() => null);
  const SY = 1.15; // vertical stretch of each letter (see CSS)
  const fit = () => {
    const w0 = span.offsetWidth; // layout width, not changed by the stretch
    const sx = w0 ? Math.min(1.4, Math.max(1, (0.86 * innerWidth) / w0)) : 1;
    nameEl.style.setProperty('--sx', String(sx));
    letterEls.forEach((l, i) => {
      const d = dims[i];
      if (!d) return;
      const s = Math.max((l.offsetWidth * sx) / d[0], (l.offsetHeight * SY) / d[1]);
      l.style.backgroundSize = `${(s * d[0]) / sx}px ${(s * d[1]) / SY}px`;
    });
  };
  HERO_IMAGES.forEach((src, i) => {
    const im = new Image();
    im.onload = () => { dims[i] = [im.naturalWidth, im.naturalHeight]; fit(); };
    im.src = src;
  });
  addEventListener('resize', fit);
  document.fonts?.ready.then(fit);
  fit();

  hero.querySelectorAll('[data-play]').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault(); document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' });
  }));
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from('.letter', { opacity: 0, scaleY: 0.5, duration: 0.5, stagger: 0.08, ease: 'steps(4)' });
    gsap.from('.hrows, .htag, .tube', { opacity: 0, duration: 0.4, delay: 0.5, stagger: 0.1 });
  }
}
