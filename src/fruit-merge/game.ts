import { gsap } from 'gsap';
import {
  LOGICAL, MAX_DPR, LAYOUT, FRUITS, DROP, MERGE, PHYSICS, RENDER, ASSIST, REVEAL, OVERFLOW,
  SLOT_POP, T5_POP, MILESTONES, TEXT, CAMERA, INPUT, JUICE,
} from './config';
import { COLORS } from './tokens';
import { drawScene, type SceneState } from './scene';
import { drawFruit, fruitArtReady } from './art';
import { audio } from './audio';
import { createHud } from './hud';
import { createWorld, type Fruit } from './physics';
import { createQueue } from './queue';
import { attachInput } from './input';
import { createHandCtl, type CamState } from './handctl';
import './styles.css';

export interface GameHost {
  onUnlock(index: 0 | 1 | 2): Promise<void> | void;
  onComplete(): void;
  onProgress?(state: { unlocked: number; camera: 'off' | 'on' | 'denied' | 'error' }): void;
}

export interface GameOptions {
  camera?: 'ask' | 'off';
  fakeHand?: boolean;
}

export interface GameHandle {
  start(): void;
  pause(): void;
  resume(): void;
  restart(): void;
  destroy(): void;
  enableCamera(): Promise<boolean>;
  setCameraBackground(on: boolean): void;
}

interface FlashRing { x: number; y: number; r: number; start: number }
interface Dot { x: number; y: number; dx: number; dy: number; dist: number; r0: number; color: string; start: number }
type Mode = 'card' | 'play' | 'reveal' | 'overflow' | 'complete';
type Timeline = ReturnType<typeof gsap.timeline>;

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const delay = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

/** PHASE 6: camera + hand control on top of the Phase 4 game. */
export function createGame(root: HTMLElement, host: GameHost, options: GameOptions = {}): GameHandle {
  const opts = {
    camera: options.camera ?? 'ask',
    fakeHand: options.fakeHand ?? new URLSearchParams(location.search).get('fakehand') === '1',
  };

  root.classList.add('fm-root');
  root.tabIndex = 0;

  const canvas = document.createElement('canvas');
  canvas.className = 'fm-canvas';
  root.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  const hud = createHud(root);
  hud.setHint(TEXT.hints.drop1);

  // Hint text: the base hint, overridden by SHOW ME YOUR FINGER while the hand is lost
  let baseHint: string = TEXT.hints.drop1;
  let handHintOn = false;
  const refreshHint = (): void => hud.setHint(handHintOn ? TEXT.hints.showFinger : baseHint);
  const setHint = (text: string): void => {
    baseHint = text;
    refreshHint();
  };

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const world = createWorld();
  const queue = createQueue(() => world.countByTier());
  const state: SceneState = {
    nextTier: queue.peek(),
    unlocked: [false, false, false],
    slotScale: [1, 1, 1],
    dangerOpacity: 1,
    shakeX: 0,
    shakeY: 0,
    ladderPulse: [0, 0, 0, 0, 0],
    background: null,
  };

  const { x0, x1, y0, y1 } = LAYOUT.interior;
  let held: number | null = queue.take();
  let cooldownLeft = 0;
  let aimX = (x0 + x1) / 2;
  let flashRings: FlashRing[] = [];
  let dots: Dot[] = [];
  let clock = 0; // ms of running time (not advanced while paused)
  let acc = 0;
  let running = false; // the host wants the game active
  let loopId: number | null = null;
  let last = 0;
  let destroyed = false;
  let epoch = 0; // bumped on restart/destroy so stale async work is ignored

  let mode: Mode = 'play';

  // scripted-opening bookkeeping (Section 5.4 / 5.5)
  let dropCount = 0;
  let firstLemon: Fruit | null = null;
  let scriptedPair: { a: Fruit; b: Fruit; t0: number } | null = null;
  let afterMergeShown = false;
  let hintClearAt = Infinity;

  // milestones / reveal (Section 5.6)
  const seen: [boolean, boolean, boolean] = [false, false, false];
  let pendingReveals: Array<{ fruit: Fruit; index: 0 | 1 | 2 }> = [];
  let activeTl: Timeline | null = null;
  let rv = { scale: 1, rot: 0, t: 0 };
  let revealFruit: Fruit | null = null;
  let flashUntil = 0;
  let slotPops: Array<{ idx: number; start: number }> = [];

  // polish (Phase 5)
  const tierSeen: boolean[] = [];
  let ladderPulses: Array<{ tier: number; start: number }> = [];
  let mergeShakeUntil = 0;
  const lastVy = new Map<number, number>();
  const squashStart = new Map<number, number>();

  // overflow (Section 5.7)
  let overTime = 0;
  let shakeUntil = 0;

  // --- aim / drop ---------------------------------------------------------
  const aimRadius = (): number => FRUITS[(held ?? 1) - 1].radius;
  function setAim(x: number): void {
    const r = aimRadius();
    aimX = Math.min(Math.max(x, x0 + r), x1 - r);
  }
  function drop(): void {
    if (!running || destroyed || mode !== 'play' || held === null || cooldownLeft > 0) return;
    setAim(aimX);
    const f = world.add(held, aimX, LAYOUT.heldSpawnY);
    f.born = clock;
    audio.play('drop');
    dropCount++;
    if (dropCount === 1) {
      firstLemon = f;
      setHint(TEXT.hints.drop2);
    } else if (dropCount === 2) {
      setHint(TEXT.hints.drop3);
    } else if (dropCount === 3) {
      setHint('');
      if (firstLemon) scriptedPair = { a: firstLemon, b: f, t0: clock };
    }
    held = null;
    cooldownLeft = DROP.cooldownMs;
  }

  // --- camera / hand control ----------------------------------------------
  const aimFromNorm = (n: number): number => x0 + n * (x1 - x0);
  const isMobile = (): boolean =>
    window.innerWidth < INPUT.mobileMaxWidth || (window.matchMedia?.('(pointer: coarse)').matches ?? false);
  const ctl = createHandCtl(
    root,
    {
      onDrop: (n) => {
        if (!running || destroyed || mode !== 'play') return;
        setAim(aimFromNorm(n)); // the aim from before the pinch moved the fingertip
        drop();
      },
    },
    opts.fakeHand,
  );
  let camAsked = false; // the player has been through the camera choice
  let chipShown: string | null | undefined;
  let startedOnce = false;

  const hostCamState = (s: CamState): 'off' | 'on' | 'denied' | 'error' => (s === 'on' ? 'on' : s === 'denied' ? 'denied' : s === 'error' ? 'error' : 'off');
  const reportProgress = (): void =>
    host.onProgress?.({ unlocked: state.unlocked.filter(Boolean).length, camera: hostCamState(ctl.state) });

  async function turnOnCamera(): Promise<boolean> {
    if (destroyed || (isMobile() && !opts.fakeHand)) return false; // mobile never uses the camera
    camAsked = true;
    const s = await ctl.enable();
    if (destroyed) return false;
    reportProgress();
    if (s === 'on') {
      hud.setLegend('camera');
      hud.setBgToggle(true, ctl.bgOn, () => {
        ctl.bgOn = !ctl.bgOn;
        hud.setBgToggle(true, ctl.bgOn);
      });
    }
    return s === 'on';
  }

  function finishCameraCard(): void {
    if (destroyed) return;
    hud.hideCameraCard();
    if (mode === 'card') mode = 'play';
    root.focus({ preventScroll: true });
  }
  function showCameraCard(): void {
    mode = 'card';
    hud.showCameraCard({
      onTurnOn: () => {
        hud.setCameraCardLoading(true);
        void turnOnCamera().finally(finishCameraCard);
      },
      onUseMouse: () => {
        camAsked = true;
        finishCameraCard();
      },
    });
  }

  const input = attachInput({
    root, canvas, getAim: () => aimX, setAim, drop,
    isActive: () => running && !destroyed && mode === 'play' && !ctl.blocksOtherInput(),
  });

  // --- particles ----------------------------------------------------------
  function spawnBurst(x: number, y: number, count: number, colors: string[], rMin: number, rMax: number, distScale: number): void {
    if (reducedMotion) return; // no bursts with reduced motion
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      dots.push({
        x, y, dx: Math.cos(a), dy: Math.sin(a),
        dist: lerp(REVEAL.burstDist.min, REVEAL.burstDist.max, Math.random()) * distScale,
        r0: lerp(rMin, rMax, Math.random()),
        color: colors[i % colors.length],
        start: clock,
      });
    }
  }
  const burstColors = (tier: number): string[] => [FRUITS[tier - 1].disc, COLORS.cream, COLORS.black];

  // --- milestones ---------------------------------------------------------
  function unlockSlot(index: number): void {
    audio.play('unlock');
    state.unlocked[index] = true;
    hud.setSlot(index, true);
    if (!reducedMotion) slotPops.push({ idx: index, start: clock });
    hud.announce(`Project ${index + 1} unlocked`);
    reportProgress();
  }

  function startReveal(rev: { fruit: Fruit; index: 0 | 1 | 2 }): void {
    mode = 'reveal';
    setHint('');
    hintClearAt = Infinity;
    const f = rev.fruit;
    const tier = f.tier;
    revealFruit = f;
    rv = { scale: 1, rot: 0, t: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        activeTl = null;
        void finishReveal(rev.index);
      },
    });
    activeTl = tl;
    if (reducedMotion) {
      // short flash and fade, no shake / scale / burst
      tl.call(() => {
        flashUntil = clock + REVEAL.reducedMotionFlashMs;
        world.remove(f);
        revealFruit = null;
        unlockSlot(rev.index);
      }, undefined, 0);
      tl.to(rv, { t: REVEAL.reducedMotionFlashMs / 1000, duration: REVEAL.reducedMotionFlashMs / 1000, ease: 'none' }, 0);
      return;
    }
    // 0 - 0.5 s: swell to 1.6x with a 20 Hz shake and a slight turn
    tl.to(rv, { scale: REVEAL.swellScale, rot: REVEAL.swellRotation, duration: REVEAL.totalSwellS, ease: 'power2.out' }, 0);
    tl.to(rv, { t: REVEAL.burstEndS, duration: REVEAL.burstEndS, ease: 'none' }, 0); // timeline clock for the shake
    // 0.5 s: cream flash, fruit vanishes, halftone burst, slot pops and fills
    tl.call(() => { flashUntil = clock + REVEAL.flashMs; }, undefined, REVEAL.totalSwellS);
    tl.call(() => {
      const { x, y } = f.body.position;
      world.remove(f);
      revealFruit = null;
      spawnBurst(x, y, REVEAL.burstDots, burstColors(tier), REVEAL.burstDotRadius.min, REVEAL.burstDotRadius.max, 1);
      unlockSlot(rev.index);
    }, undefined, REVEAL.totalSwellS);
    // timeline ends at 1.0 s -> finishReveal calls the host
  }

  async function finishReveal(index: 0 | 1 | 2): Promise<void> {
    const myEpoch = epoch;
    if (destroyed) return;
    try {
      const r = host.onUnlock(index);
      if (r && typeof (r as PromiseLike<void>).then === 'function') await r;
      else await delay(REVEAL.hostFallbackWaitMs);
    } catch {
      /* a failing host must not freeze the game */
    }
    if (destroyed || myEpoch !== epoch) return;

    if (index === 2) {
      mode = 'complete';
      hud.showCompletion(restart);
      host.onComplete();
      return;
    }
    const next = pendingReveals.shift();
    if (next) { startReveal(next); return; }
    mode = 'play';
    if (index === 0) {
      setHint(TEXT.hints.afterMilestone);
      hintClearAt = clock + REVEAL.hintAfterFirstMilestoneMs;
    }
  }

  // --- overflow -----------------------------------------------------------
  function startOverflow(): void {
    mode = 'overflow';
    audio.play('overflow');
    overTime = 0;
    setHint('');
    hintClearAt = Infinity;
    scriptedPair = null;
    const list = [...world.fruits.values()];
    const per = Math.max(1, Math.min(OVERFLOW.dotsPerFruit, Math.floor(OVERFLOW.maxDots / Math.max(1, list.length))));
    for (const f of list) {
      const { x, y } = f.body.position;
      spawnBurst(x, y, per, burstColors(f.tier), OVERFLOW.dotRadius.min, OVERFLOW.dotRadius.max, OVERFLOW.distScale);
    }
    if (!reducedMotion) shakeUntil = clock + OVERFLOW.shakeMs;
    world.clear(); // progress (unlocked slots) is kept
    queue.endOpening(); // no scripted opening again
    hud.showToast(TEXT.overflow);
    hud.announce(TEXT.overflow);
    const tl = gsap.timeline({
      onComplete: () => {
        activeTl = null;
        if (destroyed) return;
        hud.showToast(null);
        mode = 'play';
      },
    });
    activeTl = tl;
    tl.call(() => { /* hold the message */ }, undefined, OVERFLOW.messageMs / 1000);
  }

  // --- rendering ----------------------------------------------------------
  function popScale(age: number): number {
    if (reducedMotion || age >= MERGE.popMs) return 1;
    const k = age / MERGE.popMs;
    return k < 0.5 ? lerp(MERGE.popScaleFrom, MERGE.popScalePeak, k / 0.5) : lerp(MERGE.popScalePeak, 1, (k - 0.5) / 0.5);
  }

  function render(): void {
    // container shake (overflow)
    if (clock < shakeUntil) {
      const left = (shakeUntil - clock) / OVERFLOW.shakeMs;
      state.shakeX = Math.sin((clock / 1000) * TAU * 20) * OVERFLOW.shakePx * left;
    } else {
      state.shakeX = 0;
    }
    state.shakeY = 0;
    if (clock < mergeShakeUntil) {
      state.shakeX += Math.sin((clock / 1000) * TAU * 30) * JUICE.mergeShakePx;
      state.shakeY += Math.cos((clock / 1000) * TAU * 27) * JUICE.mergeShakePx;
    }
    state.nextTier = queue.peek();
    state.background = ctl.bgOn ? ctl.background(performance.now()) : null;
    drawScene(ctx, state);

    ctx.save();
    ctx.translate(state.shakeX, state.shakeY);

    // aim guide: thin dashed cream line from the held fruit down to the floor
    if (held !== null && mode === 'play') {
      const r = FRUITS[held - 1].radius;
      ctx.save();
      ctx.globalAlpha = RENDER.aimGuide.opacity;
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = RENDER.aimGuide.width;
      ctx.setLineDash([...RENDER.aimGuide.dash]);
      ctx.beginPath();
      ctx.moveTo(aimX, LAYOUT.heldSpawnY + r);
      ctx.lineTo(aimX, y1);
      ctx.stroke();
      ctx.restore();
    }

    for (const f of world.fruits.values()) {
      if (f === revealFruit) continue;
      // landing squash (world-aligned, so it reads as a bounce on the floor)
      let sx = 1;
      let sy = 1;
      const sq = squashStart.get(f.body.id);
      if (sq !== undefined && clock - sq < JUICE.landSquashMs) {
        const k = Math.sin(((clock - sq) / JUICE.landSquashMs) * Math.PI) * JUICE.landSquash;
        sx = 1 + k;
        sy = 1 - k;
      }
      drawFruit(ctx, f.tier, f.body.position.x, f.body.position.y, {
        angle: f.body.angle,
        scale: popScale(clock - f.popStart),
        squashX: sx,
        squashY: sy,
      });
    }

    // the milestone fruit swells, turns and shakes before it bursts
    if (revealFruit) {
      const shake = !reducedMotion && rv.t < REVEAL.totalSwellS ? Math.sin(rv.t * TAU * REVEAL.shakeHz) * REVEAL.shakePx : 0;
      drawFruit(ctx, revealFruit.tier, revealFruit.body.position.x + shake, revealFruit.body.position.y, {
        angle: revealFruit.body.angle + rv.rot,
        scale: popScale(clock - revealFruit.popStart) * rv.scale,
      });
    }

    flashRings = flashRings.filter((fr) => clock - fr.start < MERGE.flashRingMs);
    for (const fr of flashRings) {
      ctx.save();
      ctx.strokeStyle = RENDER.flashRingColor;
      ctx.lineWidth = RENDER.flashRingWidth;
      ctx.beginPath();
      ctx.arc(fr.x, fr.y, fr.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (held !== null && mode === 'play') {
      const squash = ctl.gesture.pinched; // pinching squashes the held fruit slightly
      drawFruit(ctx, held, aimX, LAYOUT.heldSpawnY, squash ? { squashX: CAMERA.pinchSquash.x, squashY: CAMERA.pinchSquash.y } : {});
    }

    // ring cursor follows the fingertip's x at the height of the held fruit
    if (ctl.state === 'on' && ctl.gesture.found && mode === 'play') {
      const cx = aimFromNorm(ctl.gesture.aim);
      ctx.save();
      ctx.strokeStyle = COLORS.cream;
      ctx.fillStyle = COLORS.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, LAYOUT.heldSpawnY, CAMERA.cursorRingPx / 2, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, LAYOUT.heldSpawnY, CAMERA.cursorDotPx, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    // cream flash over the container
    if (clock < flashUntil) {
      const wt = LAYOUT.wallThickness;
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(x0 - wt, y0, x1 - x0 + wt * 2, y1 + LAYOUT.floorThickness - y0);
    }

    // halftone burst dots
    dots = dots.filter((d) => clock - d.start < REVEAL.burstMs);
    for (const d of dots) {
      const k = (clock - d.start) / REVEAL.burstMs;
      const e = 1 - (1 - k) * (1 - k); // decelerate
      ctx.fillStyle = d.color;
      ctx.beginPath();
      ctx.arc(d.x + d.dx * d.dist * e, d.y + d.dy * d.dist * e, Math.max(0, d.r0 * (1 - k)), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- loop ---------------------------------------------------------------
  function updateSlotPops(): void {
    if (slotPops.length === 0) return;
    slotPops = slotPops.filter((p) => {
      const age = clock - p.start;
      if (age >= SLOT_POP.ms) {
        state.slotScale[p.idx] = 1;
        return false;
      }
      const k = age / SLOT_POP.ms;
      state.slotScale[p.idx] = k < 0.5 ? lerp(1, SLOT_POP.peak, k / 0.5) : lerp(SLOT_POP.peak, 1, (k - 0.5) / 0.5);
      return true;
    });
  }

  function frame(now: number): void {
    loopId = requestAnimationFrame(frame);
    const dt = Math.min(now - last, RENDER.maxFrameDtMs);
    last = now;
    clock += dt;

    if (clock >= hintClearAt) {
      setHint('');
      hintClearAt = Infinity;
    }

    // hand lost for 1 s: show the hint; status chip follows the camera state
    const wantFingerHint = ctl.state === 'on' && !ctl.gesture.found && ctl.lostMs() >= CAMERA.handLostHintMs;
    if (wantFingerHint !== handHintOn) {
      handHintOn = wantFingerHint;
      refreshHint();
    }
    const chip =
      ctl.state === 'starting' ? TEXT.cameraCard.loading
      : ctl.state === 'on' ? (ctl.gesture.found ? TEXT.status.found : TEXT.status.searching)
      : camAsked ? TEXT.status.off
      : null;
    if (chip !== chipShown) {
      chipShown = chip;
      hud.setChip(chip);
    }

    if (mode === 'play') {
      input.update(dt);
      if (ctl.state === 'on' && ctl.gesture.found) setAim(aimFromNorm(ctl.gesture.aim)); // finger sets the aim

      if (held === null) {
        cooldownLeft -= dt;
        if (cooldownLeft <= 0) {
          held = queue.take();
          setAim(aimX); // re-clamp for the new fruit's radius
        }
      }

      // stuck rescue: if the scripted pair has not merged after a while, boost the assist for those two fruits only
      if (scriptedPair) {
        const { a, b, t0 } = scriptedPair;
        if (!world.fruits.has(a.body.id) || !world.fruits.has(b.body.id)) {
          scriptedPair = null; // merged (or cleared)
        } else if (clock - t0 >= ASSIST.stuckAfterMs) {
          a.boost = b.boost = true;
        }
      }

      acc += dt;
      let steps = 0;
      while (acc >= PHYSICS.stepMs && steps < RENDER.maxStepsPerFrame) {
        const res = world.step(clock);
        for (const f of res.created) {
          flashRings.push({ x: f.body.position.x, y: f.body.position.y, r: FRUITS[f.tier - 1].radius, start: clock });
          audio.play('merge');
          if (!reducedMotion) {
            if (!tierSeen[f.tier]) ladderPulses.push({ tier: f.tier, start: clock }); // new tier: pulse the ladder
            if (f.tier >= 3) mergeShakeUntil = clock + JUICE.mergeShakeMs; // small shake on T3+ merges
          }
          tierSeen[f.tier] = true;
          if (f.tier === 2 && dropCount >= 3 && !afterMergeShown && !seen[0]) {
            afterMergeShown = true;
            setHint(TEXT.hints.afterMerge);
          }
          const idx = MILESTONES[f.tier] as 0 | 1 | 2 | undefined;
          if (idx !== undefined && !seen[idx]) {
            seen[idx] = true; // only the first creation of a milestone tier counts
            pendingReveals.push({ fruit: f, index: idx });
          }
        }
        for (const p of res.popped) {
          audio.play('burst');
          const top = FRUITS.length;
          spawnBurst(p.x, p.y, T5_POP.dots, burstColors(top), REVEAL.burstDotRadius.min, REVEAL.burstDotRadius.max, T5_POP.distScale);
        }
        acc -= PHYSICS.stepMs;
        steps++;
        const next = pendingReveals.shift();
        if (next) {
          startReveal(next);
          acc = 0;
          break;
        }
      }
      if (steps === RENDER.maxStepsPerFrame) acc = 0;

      // overflow watch: a settled fruit above the danger line for 2 s in a row
      if (mode === 'play') {
        let above = false;
        let settledAbove = false;
        for (const f of world.fruits.values()) {
          if (clock - f.born < OVERFLOW.ignoreRecentDropMs) continue;
          const top = f.body.position.y - FRUITS[f.tier - 1].radius;
          if (top < LAYOUT.dangerLineY) {
            above = true;
            if (Math.hypot(f.body.velocity.x, f.body.velocity.y) < OVERFLOW.settledSpeed) settledAbove = true;
          }
        }
        overTime = settledAbove ? overTime + dt : 0;
        const phase = ((clock / 1000) * OVERFLOW.blinkHz) % 1; // 4 Hz, steps between 100% and 30%
        state.dangerOpacity = above && phase >= 0.5 ? OVERFLOW.blinkLowOpacity : 1;
        if (overTime >= OVERFLOW.holdSeconds * 1000) startOverflow();
      }
    } else {
      state.dangerOpacity = 1;
    }

    if (mode === 'play' && !reducedMotion) {
      for (const f of world.fruits.values()) {
        const vy = f.body.velocity.y;
        const prev = lastVy.get(f.body.id);
        if (prev !== undefined && prev > JUICE.landMinSpeed && vy < prev * 0.35 && clock - f.born > 150) {
          squashStart.set(f.body.id, clock);
        }
        lastVy.set(f.body.id, vy);
      }
      for (const id of lastVy.keys()) {
        if (!world.fruits.has(id)) {
          lastVy.delete(id);
          squashStart.delete(id);
        }
      }
    }
    ladderPulses = ladderPulses.filter((p) => {
      const age = clock - p.start;
      state.ladderPulse[p.tier - 1] = age >= JUICE.ladderPulseMs ? 0 : 1 - age / JUICE.ladderPulseMs;
      return age < JUICE.ladderPulseMs;
    });
    updateSlotPops();
    render();
  }
  function startLoop(): void {
    if (loopId !== null || destroyed) return;
    last = performance.now();
    loopId = requestAnimationFrame(frame);
  }
  function stopLoop(): void {
    if (loopId !== null) cancelAnimationFrame(loopId);
    loopId = null;
  }
  const onVisibility = (): void => {
    if (document.hidden) {
      stopLoop();
      ctl.suspend(); // stop camera tracks while the tab is hidden
    } else if (running) {
      startLoop();
      ctl.resume();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  // --- sizing -------------------------------------------------------------
  function resize(): void {
    const rw = root.clientWidth;
    const rh = root.clientHeight;
    if (rw === 0 || rh === 0) return;
    const scale = Math.min(rw / LOGICAL.w, rh / LOGICAL.h);
    const cssW = Math.floor(LOGICAL.w * scale);
    const cssH = Math.floor(LOGICAL.h * scale);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform((cssW * dpr) / LOGICAL.w, 0, 0, (cssH * dpr) / LOGICAL.h, 0, 0);
    hud.layout((rw - cssW) / 2, (rh - cssH) / 2, cssW / LOGICAL.w);
    render();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  resize();

  // --- public API ---------------------------------------------------------
  function restart(): void {
    epoch++;
    activeTl?.kill();
    activeTl = null;
    world.clear();
    flashRings = [];
    dots = [];
    slotPops = [];
    pendingReveals = [];
    tierSeen.length = 0;
    ladderPulses = [];
    state.ladderPulse = [0, 0, 0, 0, 0];
    mergeShakeUntil = 0;
    lastVy.clear();
    squashStart.clear();
    revealFruit = null;
    rv = { scale: 1, rot: 0, t: 0 };
    flashUntil = 0;
    shakeUntil = 0;
    overTime = 0;
    seen[0] = seen[1] = seen[2] = false;
    state.unlocked = [false, false, false];
    state.slotScale = [1, 1, 1];
    state.dangerOpacity = 1;
    for (let i = 0; i < 3; i++) hud.setSlot(i, false);
    hud.showToast(null);
    hud.hideCompletion();
    reportProgress();
    if (mode !== 'card') mode = 'play';
    queue.reset(); // replays the scripted opening
    held = queue.take();
    dropCount = 0;
    firstLemon = null;
    scriptedPair = null;
    afterMergeShown = false;
    hintClearAt = Infinity;
    setHint(TEXT.hints.drop1);
    cooldownLeft = 0;
    acc = 0;
    aimX = (x0 + x1) / 2;
    setAim(aimX);
    root.focus({ preventScroll: true });
    render();
  }

  return {
    start() {
      if (destroyed) return;
      running = true;
      // wait (briefly) for the fruit pictures so the first frame already uses them
      void Promise.race([fruitArtReady, new Promise<void>((res) => setTimeout(res, 3000))]).then(() => {
        if (destroyed) return;
        render();
        if (running && !document.hidden) startLoop();
      });
      if (!startedOnce) {
        startedOnce = true;
        if (opts.fakeHand) void turnOnCamera(); // simulated hand: no permission, no card
        else if (opts.camera === 'ask' && !isMobile()) showCameraCard();
      }
    },
    pause() {
      running = false;
      stopLoop();
      ctl.suspend(); // stops camera tracks and the detection loop
      activeTl?.pause();
    },
    resume() {
      if (destroyed) return;
      running = true;
      activeTl?.resume();
      if (!document.hidden) {
        startLoop();
        ctl.resume();
      }
    },
    restart,
    destroy() {
      destroyed = true;
      running = false;
      epoch++;
      stopLoop();
      activeTl?.kill();
      activeTl = null;
      document.removeEventListener('visibilitychange', onVisibility);
      input.destroy();
      ctl.destroy();
      ro.disconnect();
      world.destroy();
      hud.destroy();
      canvas.remove();
      root.classList.remove('fm-root');
      root.removeAttribute('tabindex');
    },
    enableCamera: turnOnCamera,
    setCameraBackground(on) {
      ctl.bgOn = on;
      if (ctl.state === 'on') hud.setBgToggle(true, on);
    },
  };
}
