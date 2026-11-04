// Sound hooks. No audio files ship in this version: wire real sounds here later.
export type SoundName = 'drop' | 'merge' | 'unlock' | 'burst' | 'overflow';

export const audio = {
  play(_name: SoundName): void {
    /* intentionally empty */
  },
};
