// Hand control: gesture logic (pure), tracker (MediaPipe or fake), camera lifecycle, halftone background.
import { CAMERA, LOGICAL } from './config';

export interface Landmark { x: number; y: number; z?: number }

const TAU = Math.PI * 2;
const dist = (a: Landmark, b: Landmark): number => Math.hypot(a.x - b.x, a.y - b.y);

// ---------------------------------------------------------------------------
// Gesture: aim mapping + smoothing + pinch detection (Sections 7.4, 7.5). Pure logic, no DOM.
// ---------------------------------------------------------------------------
export interface GestureState {
  found: boolean;
  /** Smoothed aim, 0..1 across the usable camera range (already mirrored). */
  aim: number;
  pinched: boolean;
  /** Timestamp (ms) the hand was last seen. */
  lastSeen: number;
}

export interface Gesture {
  state: GestureState;
  /** Feed one detection frame (landmarks or null). Returns the aim (0..1) to drop at when a pinch just started, else null. */
  process(lm: Landmark[] | null, t: number): number | null;
  reset(t: number): void;
}

export function createGesture(): Gesture {
  const s: GestureState = { found: false, aim: 0.5, pinched: false, lastSeen: 0 };
  let hasAim = false;
  let pinchFrames = 0;
  let pinchStartT = 0;
  const buf: Array<{ t: number; aim: number }> = [];

  const lookup = (target: number): number => {
    for (let i = buf.length - 1; i >= 0; i--) if (buf[i].t <= target) return buf[i].aim;
    return buf[0].aim; // buffer shorter than the lookback: use the oldest sample
  };

  return {
    state: s,
    process(lm, t) {
      if (!lm || lm.length < 10) {
        s.found = false;
        s.pinched = false;
        pinchFrames = 0;
        buf.length = 0; // hand lost: aim holds its last value
        return null;
      }
      s.found = true;
      s.lastSeen = t;

      // aim: mirror, clamp to the usable range, remap to 0..1, then EMA with a dead zone
      const { min, max } = CAMERA.usableX;
      const xm = 1 - lm[8].x;
      const raw = (Math.min(Math.max(xm, min), max) - min) / (max - min);
      if (!hasAim) {
        s.aim = raw;
        hasAim = true;
      } else if (Math.abs(raw - s.aim) >= CAMERA.deadZone) {
        s.aim += CAMERA.smoothingAlpha * (raw - s.aim);
      }
      buf.push({ t, aim: s.aim });
      if (buf.length > CAMERA.aimBufferSize) buf.shift();

      // pinch: thumb tip to index tip, relative to hand size (wrist to middle knuckle)
      const hand = dist(lm[0], lm[9]);
      if (hand < 1e-6) return null;
      const ratio = dist(lm[4], lm[8]) / hand;
      if (!s.pinched) {
        if (ratio < CAMERA.pinchOn) {
          if (pinchFrames === 0) pinchStartT = t;
          pinchFrames++;
          if (pinchFrames >= CAMERA.pinchOnFrames) {
            s.pinched = true;
            return lookup(pinchStartT - CAMERA.pinchLookbackMs); // rising edge: one drop, from before the pinch moved the fingertip
          }
        } else {
          pinchFrames = 0;
        }
      } else if (ratio > CAMERA.pinchOff) {
        s.pinched = false; // hysteresis: must open past 0.45 before the next pinch can count
        pinchFrames = 0;
      }
      return null;
    },
    reset(t) {
      s.found = false;
      s.pinched = false;
      s.lastSeen = t;
      pinchFrames = 0;
      buf.length = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// Trackers
// ---------------------------------------------------------------------------
interface Tracker {
  detect(video: HTMLVideoElement | null, now: number): Landmark[] | null;
  close(): void;
}

/** MediaPipe HandLandmarker, lazy-loaded (the import only happens when the camera is turned on). */
async function createMediapipeTracker(): Promise<Tracker> {
  const mp = await import('@mediapipe/tasks-vision');
  const fileset = await mp.FilesetResolver.forVisionTasks(CAMERA.mediapipe.wasmBase);
  const make = (delegate: 'GPU' | 'CPU') =>
    mp.HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: CAMERA.mediapipe.modelUrl, delegate },
      runningMode: 'VIDEO',
      numHands: 1,
    });
  let lm;
  try {
    lm = await make('GPU');
  } catch {
    lm = await make('CPU'); // automatic fallback
  }
  let lastTs = 0;
  return {
    detect(video, now) {
      if (!video) return null;
      lastTs = Math.max(now, lastTs + 1); // timestamps must increase
      const r = lm.detectForVideo(video, lastTs);
      return (r.landmarks && r.landmarks[0]) || null;
    },
    close() {
      try { lm.close(); } catch { /* ignore */ }
    },
  };
}

/** Simulated hand (Section 7.8): sine aim, pinch every 2.5 s, fingertip nudges while pinching. */
function createFakeTracker(): Tracker {
  const f = CAMERA.fakeHand;
  const mk = (): Landmark[] => Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5 }));
  return {
    detect(_video, now) {
      const t = now / 1000;
      const u = 0.5 + 0.5 * Math.sin((t / f.periodS) * TAU); // 0..1
      const { min, max } = CAMERA.usableX;
      const phase = t % f.pinchEveryS;
      const pinching = phase < 0.35;
      let xm = min + u * (max - min); // mirrored x we want the pipeline to see
      if (pinching) xm += 0.03; // pinching nudges the fingertip, like a real hand
      const lm = mk();
      lm[0] = { x: 0.5, y: 0.85 };
      lm[9] = { x: 0.5, y: 0.55 }; // hand size 0.30
      lm[8] = { x: 1 - xm, y: 0.3 };
      const ratio = pinching ? 0.1 : 0.75;
      lm[4] = { x: lm[8].x + ratio * 0.3, y: 0.3 };
      return lm;
    },
    close() {},
  };
}

// ---------------------------------------------------------------------------
// Halftone background (Section 4.6)
// ---------------------------------------------------------------------------
interface Background {
  canvas: HTMLCanvasElement;
  update(now: number, video: HTMLVideoElement | null): void;
}

function createBackground(): Background {
  const { cols, rows } = CAMERA.bg;
  const canvas = document.createElement('canvas');
  canvas.width = LOGICAL.w;
  canvas.height = LOGICAL.h;
  const ctx = canvas.getContext('2d')!;
  const small = document.createElement('canvas');
  small.width = cols;
  small.height = rows;
  const sctx = small.getContext('2d', { willReadFrequently: true })!;
  const cellW = LOGICAL.w / cols;
  const cellH = LOGICAL.h / rows;
  const rMax = cellH / 2;
  let lastUpdate = -Infinity;
  const interval = 1000 / CAMERA.bg.maxFps;

  return {
    canvas,
    update(now, video) {
      if (now - lastUpdate < interval) return; // capped at 24 fps
      lastUpdate = now;
      let data: Uint8ClampedArray | null = null;
      if (video && video.readyState >= 2) {
        sctx.save();
        sctx.translate(cols, 0);
        sctx.scale(-1, 1); // mirror horizontally
        sctx.drawImage(video, 0, 0, cols, rows);
        sctx.restore();
        data = sctx.getImageData(0, 0, cols, rows).data;
      }
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, LOGICAL.w, LOGICAL.h);
      ctx.fillStyle = CAMERA.bgDotColor;
      ctx.beginPath();
      const t = now / 1000;
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          let lum: number;
          if (data) {
            const k = (j * cols + i) * 4;
            lum = (0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2]) / 255;
          } else {
            lum = 0.5 + 0.5 * Math.sin(i * 0.22 + t * 1.3) * Math.cos(j * 0.3 - t * 0.9); // animated pattern (fake hand)
          }
          const r = lum * rMax; // radius proportional to luminance
          if (r < 0.5) continue;
          const x = (i + 0.5) * cellW;
          const y = (j + 0.5) * cellH;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, TAU);
        }
      }
      ctx.fill();
    },
  };
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------
export type CamState = 'off' | 'starting' | 'on' | 'denied' | 'error';

export interface HandCtl {
  readonly state: CamState;
  readonly gesture: GestureState;
  bgOn: boolean;
  enable(): Promise<CamState>;
  /** Stop tracks and loops (pause, hidden tab). Keeps the loaded model. */
  suspend(): void;
  /** Restart after suspend if the camera was on. */
  resume(): void;
  /** Milliseconds since the hand was last seen (0 while found). */
  lostMs(): number;
  /** True while the hand owns aiming, so mouse/keyboard are ignored (hand found, or lost for less than 5 s). */
  blocksOtherInput(): boolean;
  /** Halftone layer for this frame (updates itself at <= 24 fps), or null when not available. */
  background(now: number): HTMLCanvasElement | null;
  destroy(): void;
}

export function createHandCtl(root: HTMLElement, cb: { onDrop(aimNorm: number): void }, fake: boolean): HandCtl {
  const gesture = createGesture();
  const bg = createBackground();
  let state: CamState = 'off';
  let bgOn = true;
  let tracker: Tracker | null = null;
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let suspended = false;
  let destroyed = false;
  let rvfcId: number | null = null;
  let rafId: number | null = null;
  let lastDetect = -Infinity;
  let lastVideoTime = -1;
  const interval = 1000 / CAMERA.detectMaxHz;

  function ensureVideo(): HTMLVideoElement {
    if (video) return video;
    const v = document.createElement('video');
    v.className = 'fm-video';
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('aria-hidden', 'true');
    root.appendChild(v);
    video = v;
    return v;
  }

  async function openStream(): Promise<void> {
    const md = navigator.mediaDevices;
    if (!md || !md.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
    const c = CAMERA.constraints;
    stream = await md.getUserMedia({ video: { width: c.width, height: c.height, facingMode: c.facingMode } });
    const v = ensureVideo();
    v.srcObject = stream;
    await v.play();
  }

  function closeStream(): void {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    if (video) video.srcObject = null;
  }

  function stopLoop(): void {
    if (rvfcId !== null && video && 'cancelVideoFrameCallback' in video) (video as HTMLVideoElement & { cancelVideoFrameCallback(id: number): void }).cancelVideoFrameCallback(rvfcId);
    if (rafId !== null) cancelAnimationFrame(rafId);
    rvfcId = rafId = null;
  }

  function tick(now: number): void {
    schedule();
    if (now - lastDetect < interval - 2) return; // at most ~30 detections per second
    if (!fake) {
      if (!video || video.readyState < 2 || video.currentTime === lastVideoTime) return; // no new frame
      lastVideoTime = video.currentTime;
    }
    lastDetect = now;
    let lm: Landmark[] | null = null;
    try {
      lm = tracker ? tracker.detect(fake ? null : video, now) : null;
    } catch {
      lm = null; // a failed frame counts as "no hand"
    }
    const drop = gesture.process(lm, now);
    if (drop !== null) cb.onDrop(drop);
  }

  function schedule(): void {
    if (destroyed || suspended || state !== 'on') return;
    if (!fake && video && 'requestVideoFrameCallback' in video) {
      rvfcId = (video as HTMLVideoElement & { requestVideoFrameCallback(cb: (now: number) => void): number }).requestVideoFrameCallback((n) => tick(n));
    } else {
      rafId = requestAnimationFrame(tick);
    }
  }

  function startLoop(): void {
    stopLoop();
    lastDetect = -Infinity;
    lastVideoTime = -1;
    schedule();
  }

  return {
    get state() { return state; },
    gesture: gesture.state,
    get bgOn() { return bgOn; },
    set bgOn(v: boolean) { bgOn = v; },

    async enable() {
      if (destroyed) return 'error';
      if (state === 'on') return 'on';
      state = 'starting';
      if (fake) {
        tracker = createFakeTracker();
        gesture.reset(performance.now());
        state = 'on';
        startLoop();
        return state;
      }
      // permission prompt and model download run together; nothing happens before the player asks for it
      const [cam, model] = await Promise.allSettled([openStream(), tracker ? Promise.resolve(tracker) : createMediapipeTracker()]);
      if (destroyed) { closeStream(); if (model.status === 'fulfilled' && model.value !== tracker) model.value.close(); return 'error'; }
      if (cam.status === 'rejected') {
        const name = (cam.reason && (cam.reason as { name?: string }).name) || '';
        state = name === 'NotAllowedError' || name === 'PermissionDeniedError' || name === 'SecurityError' ? 'denied' : 'error';
        if (model.status === 'fulfilled' && !tracker) model.value.close();
        closeStream();
        return state;
      }
      if (model.status === 'rejected') {
        closeStream();
        state = 'error';
        return state;
      }
      tracker = model.value;
      gesture.reset(performance.now());
      state = 'on';
      startLoop();
      return state;
    },

    suspend() {
      if (state !== 'on' || suspended) return;
      suspended = true;
      stopLoop();
      if (!fake) closeStream(); // stop all camera tracks
    },

    resume() {
      if (state !== 'on' || !suspended || destroyed) return;
      suspended = false;
      gesture.reset(performance.now());
      if (fake) { startLoop(); return; }
      openStream().then(
        () => { if (!destroyed && !suspended) startLoop(); },
        () => { state = 'error'; }, // permission was withdrawn: fall back silently
      );
    },

    lostMs() {
      return gesture.state.found ? 0 : performance.now() - gesture.state.lastSeen;
    },

    blocksOtherInput() {
      return state === 'on' && !suspended && (gesture.state.found || performance.now() - gesture.state.lastSeen < CAMERA.handLostFallbackMs);
    },

    background(now) {
      if (state !== 'on') return null;
      bg.update(now, fake ? null : video);
      return bg.canvas;
    },

    destroy() {
      destroyed = true;
      stopLoop();
      closeStream();
      tracker?.close();
      tracker = null;
      video?.remove();
      video = null;
    },
  };
}
