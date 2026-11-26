// Scrolling bands between the sections. Every set is an X (two bands crossing), but each set differs:
// colours, tilt, speed, where they cross, and the words on them.
const MERGE = 'IDEAS MERGE, PRODUCTS SHIP';
const C = { cream: '#FCE3D5', pink: '#EE3E9C', teal: '#12B5C4', yellow: '#F5D90A' };
const track = (text: string) => `<span class="u">${text}<i>&#10022;</i></span>`.repeat(6);

interface Band { bg: string; rot: number; dur: number; text: string; rev?: boolean }

function make(id: string, cross: number, bands: Band[]): HTMLElement {
  const el = document.createElement('div');
  el.id = id; el.className = 'bands'; el.setAttribute('aria-hidden', 'true');
  const ox = (cross + 10) / 1.2; // the bands are 120% wide, so turn this crossing point (in % of the screen) into the band's own %
  el.innerHTML = bands.map((b) => `<div class="band" style="--bg:${b.bg};--rot:${b.rot}deg;--dur:${b.dur}s;--ox:${ox}%"><div class="btrack${b.rev ? ' rev' : ''}">${track(b.text)}</div></div>`).join('');
  return el;
}

// after the hero: cream and pink cross in the middle
export const bandsCross = () => make('bands-a', 50, [
  { bg: C.cream, rot: -3.2, dur: 52, text: MERGE }, { bg: C.pink, rot: 3.2, dur: 64, text: MERGE, rev: true },
]);
// before the game: teal and yellow cross on the left, steeper, with an invitation to play
export const bandsSingle = () => make('bands-b', 27, [
  { bg: C.teal, rot: 2.6, dur: 48, text: "ARE YOU BORED? HERE'S A GAME" }, { bg: C.yellow, rot: -3.8, dur: 58, text: 'WANNA STAY AND PLAY A GAME?', rev: true },
]);
// after the game: yellow and pink cross on the right, shallow
export const bandsParallel = () => make('bands-c', 74, [
  { bg: C.yellow, rot: -2.2, dur: 60, text: MERGE, rev: true }, { bg: C.pink, rot: 4.2, dur: 54, text: MERGE },
]);
