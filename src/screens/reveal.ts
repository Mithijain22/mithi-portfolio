import { REVEAL } from '../content.ts';

// Block-reveal intro (between the loader and the hero): random blocks of a grid flash pieces of the pictures,
// quick at first, then slower, ending on the first picture. Plays once, about 3.2 s. Click or any key skips it.
const COLS = 5, ROWS = 4;      // grid of cells
const CELL_VW = 0.15;          // cell size as a share of the viewport width (capped by height)
const DENSITY = 0.4;           // share of cells visible per flash
const FLASHES = 17, ON = 83, OFF = 33;   // fast flicker phase (ms)
const HOLDS = [183, 383, 583];           // slower holds at the end (ms)

let loading: Promise<HTMLImageElement[]> | null = null;
export function preloadReveal() {
  loading ??= Promise.all(REVEAL.images.map((src) => new Promise<HTMLImageElement>((res) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = () => res(i); i.src = src;
  })));
  return loading;
}

export async function runReveal(): Promise<void> {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const imgs = await preloadReveal();
  if (!imgs.length || imgs.some((i) => !i.naturalWidth)) return;

  const cv = document.createElement('canvas');
  cv.className = 'reveal';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  let W = 0, H = 0, dpr = 1, cell = 0, gx = 0, gy = 0, seq = -1;
  let cur: { im: HTMLImageElement; dw: number; dh: number; ox: number; oy: number; m: boolean[] } | null = null;
  let skip = false;

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0, 0, W, H);
    if (!cur) return;
    ctx.save(); ctx.beginPath();
    cur.m.forEach((v, i) => { if (v) ctx.rect(gx + (i % COLS) * cell, gy + Math.floor(i / COLS) * cell, cell, cell); });
    ctx.clip();
    ctx.drawImage(cur.im, gx + cur.ox, gy + cur.oy, cur.dw, cur.dh);
    ctx.restore();
  };
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    cell = Math.min(W * CELL_VW, (H * 0.8) / ROWS, (W * 0.92) / COLS);
    gx = (W - cell * COLS) / 2; gy = (H - cell * ROWS) / 2;
    draw();
  };
  const pattern = () => {
    for (;;) {
      const m: boolean[] = []; let n = 0;
      for (let i = 0; i < COLS * ROWS; i++) { const v = Math.random() < DENSITY; m.push(v); if (v) n++; }
      if (n >= 4 && n <= Math.round(COLS * ROWS * 0.6)) return m;
    }
  };
  const cl = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const flash = (last = false) => {
    seq = last ? 0 : (seq + 1) % imgs.length;
    const im = imgs[seq], f = last ? null : REVEAL.faces[seq];
    const z = 1 + Math.random() * (f ? 0.35 : 0.9);
    const gw = cell * COLS, gh = cell * ROWS, s = Math.max(gw / im.width, gh / im.height) * z;
    const dw = im.width * s, dh = im.height * s, m = pattern();
    let ox = -(dw - gw) * Math.random(), oy = -(dh - gh) * Math.random();
    if (f) { // put the face inside the grid and force its cells on, so it is always visible
      ox = cl(gw * (0.3 + Math.random() * 0.4) - f[0] * dw, -(dw - gw), 0);
      oy = cl(gh * (0.3 + Math.random() * 0.4) - f[1] * dh, -(dh - gh), 0);
      const x0 = ox + (f[0] - f[2] / 2) * dw, x1 = ox + (f[0] + f[2] / 2) * dw;
      const y0 = oy + (f[1] - f[3] / 2) * dh, y1 = oy + (f[1] + f[3] / 2) * dh;
      for (let r = cl(Math.floor(y0 / cell), 0, ROWS - 1); r <= cl(Math.floor(y1 / cell), 0, ROWS - 1); r++)
        for (let c = cl(Math.floor(x0 / cell), 0, COLS - 1); c <= cl(Math.floor(x1 / cell), 0, COLS - 1); c++) m[r * COLS + c] = true;
    }
    cur = { im, dw, dh, ox, oy, m };
  };

  const onSkip = () => { skip = true; };
  addEventListener('pointerdown', onSkip); addEventListener('keydown', onSkip); addEventListener('resize', size);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  size();

  for (let i = 0; i < FLASHES && !skip; i++) { flash(); draw(); await wait(ON); cur = null; draw(); await wait(OFF); }
  for (let k = 0; k < HOLDS.length && !skip; k++) { flash(k === HOLDS.length - 1); draw(); await wait(HOLDS[k]); cur = null; draw(); await wait(OFF); }

  removeEventListener('pointerdown', onSkip); removeEventListener('keydown', onSkip); removeEventListener('resize', size);
  cv.remove();
}
