// Drop queue (Section 5.4): scripted opening T1, T2, T1, then easy-mode random with a "helper" rule.
// The queue is always generated one step ahead so the NEXT box can show it.
import { QUEUE } from './config';

function weighted(): number {
  const w = QUEUE.weights;
  const r = Math.random();
  if (r < w[1]) return 1;
  if (r < w[1] + w[2]) return 2;
  return 3; // never T4 or T5
}

export interface Queue {
  take(): number;
  peek(): number;
  /** Restart the queue, replaying the scripted opening. */
  reset(): void;
  /** Skip the scripted opening (used after an overflow reset in Phase 4). */
  endOpening(): void;
}

/** @param countByTier number of fruits per tier currently in the container (index = tier) */
export function createQueue(countByTier: () => number[]): Queue {
  let scriptIdx = 0;
  let next = 0;

  function generate(): number {
    if (scriptIdx < QUEUE.scriptedOpening.length) return QUEUE.scriptedOpening[scriptIdx++];
    if (Math.random() < QUEUE.helperProbability) {
      // lowest tier (T1..T3) with exactly one fruit in the container, so the player can pair it
      const counts = countByTier();
      for (let t = 1; t <= 3; t++) if (counts[t] === 1) return t;
    }
    return weighted();
  }

  next = generate();
  return {
    take() {
      const t = next;
      next = generate();
      return t;
    },
    peek: () => next,
    reset() {
      scriptIdx = 0;
      next = generate();
    },
    endOpening() {
      scriptIdx = QUEUE.scriptedOpening.length;
    },
  };
}
