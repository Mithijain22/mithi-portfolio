// matter-js world: static container, fruit bodies, merging. Fixed-step stepping is driven by the caller.
import Matter from 'matter-js';
import { ASSIST, FRUITS, LAYOUT, MERGE, PHYSICS } from './config';

const { Engine, Bodies, Body, Composite, Events } = Matter;

export const MAX_TIER = FRUITS.length;

export interface Fruit {
  body: Matter.Body;
  tier: number;
  merging: boolean;
  /** Stronger assist (ASSIST.stuckFraction) while true. Used for the scripted pair if they have not merged in time. */
  boost: boolean;
  /** Clock time (ms) when this fruit entered the container (set by the game for dropped fruits). */
  born: number;
  /** Clock time (ms) when this fruit was created by a merge; -Infinity for dropped fruits (no pop). */
  popStart: number;
}

export interface StepResult {
  /** Fruits created by merging this step. */
  created: Fruit[];
  /** Pairs of top-tier fruits that touched this step: both are removed (the game plays an explosion). */
  popped: Array<{ x: number; y: number }>;
}

export interface World {
  fruits: Map<number, Fruit>;
  /** Add a fruit body at (x, y). */
  add(tier: number, x: number, y: number, popStart?: number, vx?: number, vy?: number): Fruit;
  /** Advance one fixed step and process merges. Returns fruits created by merging this step. */
  step(clockMs: number): StepResult;
  remove(f: Fruit): void;
  /** Number of fruits per tier, indexed by tier (index 0 unused). */
  countByTier(): number[];
  clear(): void;
  destroy(): void;
}

export function createWorld(): World {
  const engine = Engine.create();
  engine.gravity.y = PHYSICS.gravityY;
  engine.positionIterations = PHYSICS.positionIterations;
  engine.velocityIterations = PHYSICS.velocityIterations;

  // Static container: physics thickness is larger than the drawn walls so nothing tunnels.
  const { x0, x1, y1 } = LAYOUT.interior;
  const t = PHYSICS.wallPhysicsThickness;
  const top = -600;
  const bottom = y1 + t;
  const wallOpts = { isStatic: true, friction: PHYSICS.body.friction, label: 'wall' };
  Composite.add(engine.world, [
    Bodies.rectangle(x0 - t / 2, (top + bottom) / 2, t, bottom - top, wallOpts),
    Bodies.rectangle(x1 + t / 2, (top + bottom) / 2, t, bottom - top, wallOpts),
    Bodies.rectangle((x0 + x1) / 2, y1 + t / 2, x1 - x0 + t * 2, t, wallOpts),
  ]);

  const fruits = new Map<number, Fruit>();
  const pending: Array<[Matter.Body, Matter.Body]> = [];

  Events.on(engine, 'collisionStart', (e) => {
    for (const p of e.pairs) {
      if (p.bodyA.label === 'fruit' && p.bodyB.label === 'fruit') pending.push([p.bodyA, p.bodyB]);
    }
  });

  function add(tier: number, x: number, y: number, popStart = -Infinity, vx = 0, vy = 0): Fruit {
    const r = FRUITS[tier - 1].radius;
    const body = Bodies.circle(x, y, r, { ...PHYSICS.body, label: 'fruit' });
    Body.setVelocity(body, { x: vx, y: vy });
    Composite.add(engine.world, body);
    const f: Fruit = { body, tier, merging: false, boost: false, born: popStart, popStart };
    fruits.set(body.id, f);
    return f;
  }

  function remove(f: Fruit): void {
    Composite.remove(engine.world, f.body);
    fruits.delete(f.body.id);
  }

  /** Horizontal magnet between same-tier fruits that are close (Section 5.5). */
  function applyAssist(): void {
    const g = engine.gravity.y * engine.gravity.scale;
    const list = [...fruits.values()];
    const frac = (f: Fruit): number => (f.boost ? ASSIST.stuckFraction : ASSIST.ASSIST_FRACTION);
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.merging) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.merging || a.tier !== b.tier) continue;
        const dx = b.body.position.x - a.body.position.x;
        const dy = b.body.position.y - a.body.position.y;
        const gap = Math.hypot(dx, dy) - FRUITS[a.tier - 1].radius - FRUITS[b.tier - 1].radius;
        if (gap >= ASSIST.rangePx || Math.abs(dx) < 0.01) continue;
        const dir = dx > 0 ? 1 : -1;
        Body.applyForce(a.body, a.body.position, { x: dir * frac(a) * a.body.mass * g, y: 0 });
        Body.applyForce(b.body, b.body.position, { x: -dir * frac(b) * b.body.mass * g, y: 0 });
      }
    }
  }

  function processMerges(clockMs: number): StepResult {
    const created: Fruit[] = [];
    const popped: Array<{ x: number; y: number }> = [];
    for (const [a, b] of pending) {
      const fa = fruits.get(a.id);
      const fb = fruits.get(b.id);
      if (!fa || !fb || fa.merging || fb.merging) continue;
      if (fa.tier !== fb.tier) continue;
      fa.merging = fb.merging = true;
      if (fa.tier >= MAX_TIER) {
        // two top-tier fruits explode and vanish
        popped.push({ x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 });
        remove(fa);
        remove(fb);
        continue;
      }
      const ra = FRUITS[fa.tier - 1].radius;
      const rb = FRUITS[fb.tier - 1].radius;
      const wa = ra * ra;
      const wb = rb * rb; // area-weighted midpoint
      const nextTier = fa.tier + 1;
      const rn = FRUITS[nextTier - 1].radius;
      let x = (a.position.x * wa + b.position.x * wb) / (wa + wb);
      let y = (a.position.y * wa + b.position.y * wb) / (wa + wb);
      // safety: keep the (bigger) new body inside the container
      x = Math.min(Math.max(x, LAYOUT.interior.x0 + rn), LAYOUT.interior.x1 - rn);
      y = Math.min(y, LAYOUT.interior.y1 - rn);
      const vx = ((a.velocity.x + b.velocity.x) / 2) * MERGE.velocityFactor;
      const vy = ((a.velocity.y + b.velocity.y) / 2) * MERGE.velocityFactor;
      remove(fa);
      remove(fb);
      created.push(add(nextTier, x, y, clockMs, vx, vy));
    }
    pending.length = 0;
    return { created, popped };
  }

  return {
    fruits,
    add,
    step(clockMs) {
      applyAssist();
      Engine.update(engine, PHYSICS.stepMs);
      return processMerges(clockMs);
    },
    remove,
    countByTier() {
      const c = new Array<number>(MAX_TIER + 1).fill(0);
      for (const f of fruits.values()) c[f.tier]++;
      return c;
    },
    clear() {
      for (const f of [...fruits.values()]) remove(f);
      pending.length = 0;
    },
    destroy() {
      Events.off(engine, 'collisionStart');
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      fruits.clear();
      pending.length = 0;
    },
  };
}
