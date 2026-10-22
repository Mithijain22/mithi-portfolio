// Wall rounds: what repeats, what the odd one is, and the grid size (desktop / phone).
export type Mode = 'img' | 'mirror';
export interface Round { rep: string; odd: string; mode: Mode; d: [number, number]; m: [number, number] }

const banana = (bite: boolean) => 'data:image/svg+xml,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><mask id="b"><rect width="64" height="64" fill="#fff"/>${
    bite ? '<circle cx="24" cy="50" r="5.5"/><circle cx="31" cy="53" r="4.5"/>' : ''}</mask></defs><g mask="url(#b)"><path d="M9 8C9 38 30 58 56 50C59 49 58 45 55 45C36 43 26 28 22 8Z" fill="#F5D90A" stroke="#0A0A0A" stroke-width="2.5" stroke-linejoin="round"/><path d="M9 8L8 2H17L22 8Z" fill="#6B4A1B"/></g></svg>`);

export const ROUNDS: Round[] = [
  { rep: '/img/wall/lips.png', odd: '/img/wall/lips-odd.png', mode: 'img', d: [6, 4], m: [3, 3] },
  { rep: '/img/wall/face.jpg', odd: '/img/wall/face.jpg', mode: 'mirror', d: [7, 4], m: [4, 4] },
  { rep: banana(false), odd: banana(true), mode: 'img', d: [8, 5], m: [5, 4] },
];
