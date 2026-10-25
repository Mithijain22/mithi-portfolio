// The three Wall rounds. rep = repeated image, odd = the odd one, tile = flat tile colour,
// d = desktop grid [cols, rows], m = phone grid.
export interface Round { rep: string; odd: string; tile: string; d: [number, number]; m: [number, number] }
export const ROUNDS: Round[] = [
  { rep: '/img/wall/mona.png', odd: '/img/wall/mona-odd.png', tile: '#12B5C4', d: [5, 3], m: [3, 3] },
  { rep: '/img/wall/leaf.png', odd: '/img/wall/leaf-odd.png', tile: '#F5D90A', d: [6, 4], m: [4, 4] },
  { rep: '/img/wall/lips.png', odd: '/img/wall/lips-odd.png', tile: '#2B4FD8', d: [7, 4], m: [4, 5] },
];
