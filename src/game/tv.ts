import { gsap } from 'gsap';
import { initGame } from './host.ts';

const B = '#0A0A0A', CREAM = '#FCE3D5', OR = '#F2502C', ORG = '#FF7A1A', PINK = '#F2C6E0', YEL = '#F5D90A';
const dots = Array.from({ length: 24 }, (_, i) => `<circle cx="${644 + (i % 8) * 26}" cy="${959 + Math.floor(i / 8) * 14}" r="4" fill="${B}"/>`).join('');
const vents = Array.from({ length: 8 }, (_, i) => `<rect x="${560 + i * 115}" y="136" width="70" height="10" rx="5" fill="${B}"/>`).join('');
const knob = (cx: number) => `<circle cx="${cx}" cy="973" r="27" fill="${YEL}" stroke="${B}" stroke-width="5"/><path d="M${cx} 973V951" stroke="${B}" stroke-width="6"/>`;
const leg = (lx: number, d: number) => `<polygon points="${lx - 48},1020 ${lx + 48},1020 ${lx + 36 + d * 34},1070 ${lx - 36 + d * 34},1070" fill="${ORG}" stroke="${B}" stroke-width="6"/>`;

// Flat retro TV frame (original drawing). The screen is a separate div laid over the black rectangle.
const FRAME = `<svg viewBox="0 0 1920 1080" aria-hidden="true" focusable="false">
<path d="M960 118L760 30M960 118L1160 30" stroke="${CREAM}" stroke-width="9" stroke-linecap="round"/>
<circle cx="760" cy="30" r="15" fill="${ORG}" stroke="${B}" stroke-width="4"/><circle cx="1160" cy="30" r="15" fill="${ORG}" stroke="${B}" stroke-width="4"/>
<polygon points="336,218 1616,218 1536,136 416,136" fill="${ORG}"/>
<polygon points="320,202 1600,202 1520,120 400,120" fill="${OR}" stroke="${B}" stroke-width="8"/>${vents}<ellipse cx="960" cy="123" rx="30" ry="19" fill="${B}"/>
${leg(330, -1)}${leg(1590, 1)}
<rect x="166" y="212" width="1620" height="834" rx="70" fill="${ORG}"/>
<rect x="150" y="196" width="1620" height="834" rx="70" fill="${CREAM}" stroke="${B}" stroke-width="10"/>
<rect x="251" y="198" width="1418" height="744" rx="96" fill="${PINK}" stroke="${B}" stroke-width="6"/>
<rect x="271" y="218" width="1378" height="716" rx="80" fill="${B}"/>
<rect x="260" y="942" width="1400" height="62" rx="31" fill="${PINK}" stroke="${B}" stroke-width="5"/>
<g font-family="'DM Mono',monospace" font-weight="700" fill="${B}"><text id="tv-ch" x="292" y="982" font-size="24">TAKE A BREAK</text><text id="tv-count" x="930" y="984" font-size="26">SCORE 0</text></g>
${dots}${knob(1380)}${knob(1470)}<circle cx="1594" cy="975" r="22" fill="${OR}" stroke="${B}" stroke-width="5"/></svg>`;

export function mountGame(): HTMLElement {
  const s = document.createElement('section');
  s.id = 'game'; s.className = 'game';
  s.innerHTML = `<div class="tv">${FRAME}<div class="tvscreen" id="tvscreen"></div></div>`;
  const foot = document.getElementById('bands-c') ?? document.getElementById('links');          // the game sits between the work and the footer
  if (foot) foot.before(s); else document.getElementById('app')!.appendChild(s);
  const screen = s.querySelector<HTMLElement>('#tvscreen')!;
  initGame(screen);
  // switch-on: a bright line opens into the picture the first time the TV scrolls into view
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) gsap.set(screen, { clipPath: 'inset(49.5% 0 49.5% 0)', backgroundColor: CREAM });
  const io = new IntersectionObserver((e) => {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    if (!reduce) gsap.to(screen, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'steps(6)', onComplete: () => { screen.style.backgroundColor = ''; } });
  }, { threshold: 0.4 });
  io.observe(s);
  return s;
}
