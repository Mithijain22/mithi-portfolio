// Scrolling bands of "IDEAS MERGE, PRODUCTS SHIP" between the sections. Each set is arranged differently.
const UNIT = 'IDEAS MERGE, PRODUCTS SHIP';
const COLORS = { cream: '#FCE3D5', pink: '#EE3E9C', teal: '#12B5C4', yellow: '#F5D90A' };
const track = () => `<span class="u">${UNIT}<i>&#10022;</i></span>`.repeat(6);

interface Band { bg: string; rot: number; dur: number; rev?: boolean; top?: number }

function make(id: string, height: string, bands: Band[]): HTMLElement {
  const el = document.createElement('div');
  el.id = id; el.className = 'bands'; el.setAttribute('aria-hidden', 'true');
  el.style.setProperty('--h', height);
  el.innerHTML = bands.map((b) => `<div class="band" style="--bg:${b.bg};--rot:${b.rot}deg;--dur:${b.dur}s;--top:${b.top ?? 50}%"><div class="btrack${b.rev ? ' rev' : ''}">${track()}</div></div>`).join('');
  return el;
}

// A: two bands crossing in an X (after the hero)
export const bandsCross = () => make('bands-a', 'clamp(240px, 30vw, 460px)', [
  { bg: COLORS.cream, rot: -3.2, dur: 50 }, { bg: COLORS.pink, rot: 3.2, dur: 62, rev: true },
]);
// B: one single band, gently tilted (after the work)
export const bandsSingle = () => make('bands-b', 'clamp(130px, 16vw, 260px)', [
  { bg: COLORS.teal, rot: 1.4, dur: 55 },
]);
// C: two parallel bands moving in opposite directions (after the game)
export const bandsParallel = () => make('bands-c', 'clamp(240px, 28vw, 420px)', [
  { bg: COLORS.yellow, rot: -1.2, dur: 58, top: 34 }, { bg: COLORS.cream, rot: -1.2, dur: 70, rev: true, top: 68 },
]);
