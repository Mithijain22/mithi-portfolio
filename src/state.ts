export type Screen =
  | 'LOADER' | 'HERO' | 'CAMERA_PROMPT' | 'GAME' | 'SWALLOW'
  | 'WALL_1' | 'POSTER_1' | 'WALL_2' | 'POSTER_2' | 'WALL_3' | 'POSTER_3' | 'EXIT';

export interface Progress { level: number; goodEats: number; projectsSeen: number }
