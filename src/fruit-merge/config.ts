// ALL tunable numbers live here. Do not scatter magic numbers elsewhere.
import { COLORS } from './tokens';

/** Logical canvas size (2:1). Scaled to fit the host root. */
export const LOGICAL = { w: 1600, h: 800 } as const;
export const MAX_DPR = 2;

/** One selectable screen layout. All coordinates are logical (1600 x 800). */
export interface LayoutDef {
  name: string;
  /** Multiplies every fruit radius (bigger container -> bigger fruit). */
  fruitScale: number;
  interior: { x0: number; x1: number; y0: number; y1: number };
  ladder: {
    title: { x: number; y: number; size: number };
    centers: ReadonlyArray<{ x: number; y: number }>;
    discR: number;
    labelAnchor: 'below' | 'right';
  };
  slots: { size: number; pos: ReadonlyArray<{ x: number; y: number }>; glyphSize: number };
  next: {
    x: number; y: number; w: number; h: number;
    title: { x: number; y: number; w: number; size: number; align: 'left' | 'center' };
    disc: { x: number; y: number; maxR: number };
  };
  hint: { x: number; y: number; w: number; size: number; align: 'left' | 'center' };
  chip: { x: number; y: number; w: number };
  toggle: { x: number; y: number };
  legend: { x: number; y: number; w: number; h: number; size: number };
}

const FLOOR_Y = 766; // interior bottom; the floor is drawn below it

export const LAYOUTS: Record<string, LayoutDef> = {
  /** A: ladder + NEXT in a slim top bar, hint in the bar, instructions on the left, slots on the right. */
  top: {
    name: 'top',
    fruitScale: 1.0,
    interior: { x0: 300, x1: 1300, y0: 92, y1: FLOOR_Y },
    ladder: {
      title: { x: 24, y: 16, size: 30 },
      centers: [210, 286, 362, 438, 514].map((x) => ({ x, y: 38 })),
      discR: 22,
      labelAnchor: 'below',
    },
    slots: { size: 96, glyphSize: 70, pos: [120, 260, 400].map((y) => ({ x: 1402, y })) },
    next: {
      x: 1330, y: 6, w: 254, h: 76,
      title: { x: 1346, y: 24, w: 100, size: 30, align: 'left' },
      disc: { x: 1524, y: 44, maxR: 30 },
    },
    hint: { x: 580, y: 24, w: 730, size: 18, align: 'center' },
    chip: { x: 16, y: 300, w: 268 },
    toggle: { x: 16, y: 340 },
    legend: { x: 16, y: 120, w: 262, h: 150, size: 22 },
  },
  /** B: slim side rails, no top bar. Ladder and slots on the left, NEXT, hint and instructions on the right. */
  rails: {
    name: 'rails',
    fruitScale: 1.1,
    interior: { x0: 330, x1: 1270, y0: 20, y1: FLOOR_Y },
    ladder: {
      title: { x: 16, y: 20, size: 34 },
      centers: [37, 100, 163, 226, 289].map((x) => ({ x, y: 104 })),
      discR: 19,
      labelAnchor: 'below',
    },
    slots: { size: 72, glyphSize: 52, pos: [18, 116, 214].map((x) => ({ x, y: 196 })) },
    next: {
      x: 1294, y: 20, w: 290, h: 150,
      title: { x: 1294, y: 30, w: 290, size: 32, align: 'center' },
      disc: { x: 1439, y: 112, maxR: 44 },
    },
    hint: { x: 1294, y: 196, w: 290, size: 17, align: 'left' },
    chip: { x: 1294, y: 400, w: 290 },
    toggle: { x: 1294, y: 440 },
    legend: { x: 1294, y: 590, w: 290, h: 176, size: 22 },
  },
  /** C: biggest container, very slim rails. Vertical ladder on the left, NEXT and instructions on the right. */
  max: {
    name: 'max',
    fruitScale: 1.2,
    interior: { x0: 250, x1: 1350, y0: 20, y1: FLOOR_Y },
    ladder: {
      title: { x: 16, y: 20, size: 34 },
      centers: [104, 170, 236, 302, 368].map((y) => ({ x: 60, y })),
      discR: 22,
      labelAnchor: 'right',
    },
    slots: { size: 58, glyphSize: 42, pos: [16, 88, 160].map((x) => ({ x, y: 450 })) },
    next: {
      x: 1370, y: 20, w: 214, h: 130,
      title: { x: 1370, y: 28, w: 214, size: 30, align: 'center' },
      disc: { x: 1477, y: 114, maxR: 30 },
    },
    hint: { x: 1370, y: 176, w: 214, size: 16, align: 'left' },
    chip: { x: 1370, y: 420, w: 214 },
    toggle: { x: 1370, y: 470 },
    legend: { x: 1370, y: 600, w: 214, h: 166, size: 18 },
  },
};

/** Which layout the game uses. */
export const ACTIVE_LAYOUT: keyof typeof LAYOUTS = 'max';
const L = LAYOUTS[ACTIVE_LAYOUT];

/** Layout inside the logical canvas (Section 4.1), derived from the active layout. */
export const LAYOUT = {
  ...L,
  wallThickness: 14,
  floorThickness: 14,
  outerCornerRadius: 24,
  /** The held fruit sits inside the container, near its top, so the container can use the whole height. */
  heldSpawnY: L.interior.y0 + 58,
  dangerLineY: L.interior.y0 + 140,
} as const;

export interface FruitDef {
  tier: 1 | 2 | 3 | 4 | 5;
  name: string;
  radius: number;
  /** Accent color of the fruit (project slot fill, burst dots). */
  disc: string;
}
const BASE_RADII = [26, 38, 54, 74, 98] as const;
/** The fruit ladder (Section 4.3), radii scaled by the active layout. */
export const FRUITS: readonly FruitDef[] = [
  { tier: 1, name: 'LEMON',      radius: BASE_RADII[0] * L.fruitScale, disc: COLORS.yellow },
  { tier: 2, name: 'BLUEBERRY',  radius: BASE_RADII[1] * L.fruitScale, disc: COLORS.blue },
  { tier: 3, name: 'ORANGE',     radius: BASE_RADII[2] * L.fruitScale, disc: COLORS.orange },
  { tier: 4, name: 'APPLE',      radius: BASE_RADII[3] * L.fruitScale, disc: COLORS.magenta },
  { tier: 5, name: 'WATERMELON', radius: BASE_RADII[4] * L.fruitScale, disc: COLORS.green },
];

/**
 * Fruit pictures (src/assets/fruits/fruitN.webp). For each picture: its size in px and the center (cx, cy) and radius
 * (bodyR) of the largest circle inside the fruit, measured from the cut-out. The game scales each picture so that
 * circle matches the fruit's physics radius.
 */
export const FRUIT_ART = [
  { w: 481, h: 512, cx: 209.2, cy: 296.7, bodyR: 197.3 },
  { w: 447, h: 512, cx: 222.9, cy: 293.6, bodyR: 214.9 },
  { w: 475, h: 512, cx: 221.1, cy: 293.7, bodyR: 212.6 },
  { w: 480, h: 512, cx: 225.4, cy: 288.0, bodyR: 218.8 },
  { w: 448, h: 512, cx: 222.8, cy: 294.5, bodyR: 214.4 },
] as const;
export const FRUIT_ART_FIT = 1.04; // draw the picture a touch larger than the physics body
export const DISC_OUTLINE_FRACTION = 0.07; // outline = 7% of radius
export const DISC_SHADOW_OFFSET = 3;       // px, down-right
export const ICON_HEIGHT_FRACTION = 0.62;

/** Milestones: tier -> project index (Section 5.6). */
export const MILESTONES: Readonly<Record<number, 0 | 1 | 2>> = { 3: 0, 4: 1, 5: 2 };

export const PHYSICS = {
  gravityY: 1.1,
  stepMs: 1000 / 60,
  positionIterations: 8,
  velocityIterations: 6,
  body: { restitution: 0.12, friction: 0.3, frictionStatic: 0.5, frictionAir: 0.012, density: 0.0015 },
  wallPhysicsThickness: 40,
} as const;

export const DROP = {
  cooldownMs: 600,
} as const;

/** Render loop + aim guide (Section 4.4, 5.1). */
export const RENDER = {
  maxFrameDtMs: 100,    // clamp a long frame (tab switch) so physics doesn't explode
  maxStepsPerFrame: 5,  // spiral-of-death guard for the fixed-step accumulator
  aimGuide: { dash: [6, 6] as readonly number[], opacity: 0.5, width: 1 },
  flashRingColor: '#FFFFFF',
  flashRingWidth: 6,
} as const;

export const MERGE = {
  velocityFactor: 0.5,
  popScaleFrom: 0.7,
  popScalePeak: 1.15,
  popMs: 180,
  flashRingMs: 40,
} as const;

export const QUEUE = {
  scriptedOpening: [1, 2, 1] as const,
  weights: { 1: 0.5, 2: 0.32, 3: 0.18 } as const,
  helperProbability: 0.4,
} as const;

export const ASSIST = {
  ASSIST_FRACTION: 0.08, // set to 0 to disable
  rangePx: 80,
  stuckAfterMs: 3000,
  stuckFraction: 0.2,
} as const;

export const REVEAL = {
  totalSwellS: 0.5,
  swellScale: 1.6,
  shakePx: 6,
  shakeHz: 20,
  flashMs: 80,
  burstDots: 60,
  burstDotRadius: { min: 4, max: 14 },
  burstEndS: 1.0,
  hostFallbackWaitMs: 300,
  reducedMotionFlashMs: 300,
  hintAfterFirstMilestoneMs: 4000,
  swellRotation: 0.25,      // radians the fruit turns while swelling
  burstMs: 500,
  burstDist: { min: 160, max: 420 },
} as const;

/** Polish effects (Phase 5). Reduced motion turns all of these off. */
export const JUICE = {
  landMinSpeed: 4,      // a fruit moving down faster than this (px/step) squashes when it lands
  landSquashMs: 140,
  landSquash: 0.12,     // +-12% scale at the squash peak
  mergeShakePx: 2,      // screen shake on merges of T3 and above
  mergeShakeMs: 100,
  ladderPulseMs: 700,   // ring pulse on the ladder when a tier is created for the first time
  hintFadeMs: 140,
} as const;

/** Slot pop when a project unlocks (Section 4.5). */
export const SLOT_POP = { peak: 1.3, ms: 300 } as const;

/** Two top-tier fruits that touch explode and vanish (user request; replaces "T5 does not merge"). */
export const T5_POP = { dots: 40, distScale: 0.8 } as const;

export const OVERFLOW = {
  settledSpeed: 0.4,
  holdSeconds: 2.0,
  ignoreRecentDropMs: 1200,
  shakePx: 8,
  shakeMs: 400,
  dotsPerFruit: 20,
  maxDots: 200,
  messageMs: 1400,
  blinkHz: 4,
  blinkLowOpacity: 0.3,
  dotRadius: { min: 3, max: 9 },
  distScale: 0.5,
} as const;

export const INPUT = {
  keyStepPx: 8,
  keyStepFastPx: 16,
  keyAccelAfterMs: 400,
  mobileMaxWidth: 768,
} as const;

export const CAMERA = {
  constraints: { width: 640, height: 360, facingMode: 'user' as const },
  detectMaxHz: 30,
  usableX: { min: 0.12, max: 0.88 },
  smoothingAlpha: 0.35,
  deadZone: 0.004,
  pinchOn: 0.30,
  pinchOff: 0.45,
  pinchOnFrames: 2,
  aimBufferSize: 12, // recent aim samples kept
  pinchLookbackMs: 150, // a drop uses the aim from this long before the pinch started
  pinchSquash: { x: 1.1, y: 0.9 },
  handLostHintMs: 1000,
  handLostFallbackMs: 5000,
  cursorRingPx: 28,
  cursorDotPx: 3,
  bgDotColor: 'rgba(252, 227, 213, 0.22)', // cream at 22%
  bg: { cols: 96, rows: 54, maxFps: 24, dotOpacity: 0.22 },
  mediapipe: {
    wasmBase: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm',
    modelUrl: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  },
  fakeHand: { periodS: 6, pinchEveryS: 2.5 },
} as const;

/** Visible text (Section 4.5, 5.4, 5.6, 7). */
export const TEXT = {
  ladderTitle: 'LADDER',
  nextTitle: 'NEXT',
  slotLabels: ['00_1', '00_2', '00_3'] as const,
  hints: {
    drop1: 'DROP YOUR FIRST FRUIT ANYWHERE.',
    drop2: 'NOW DROP THE BLUEBERRY NEXT TO THE LEMON.',
    drop3: 'DROP THE LEMON ON THE OTHER LEMON!',
    afterMerge: 'NICE! TWO BLUEBERRIES. MAKE THEM TOUCH.',
    afterMilestone: 'FRUITS MERGE UP. SEE WHAT YOU CAN MAKE.',
    showFinger: 'SHOW ME YOUR FINGER',
  },
  overflow: 'TOO FULL! FRESH START.',
  completion: { title: 'ALL THREE UNLOCKED', line: 'SCROLL FOR THE REST', button: 'PLAY AGAIN' },
  cameraCard: {
    title: 'TURN ON CAMERA?',
    body: 'Point your finger to aim. Pinch to drop. Camera stays in your browser. Nothing is recorded.',
    on: 'TURN ON',
    off: 'USE MOUSE',
    loading: 'STARTING CAMERA...',
  },
  legend: {
    camera: ['POINT TO AIM', 'PINCH TO DROP'],
    mouse: ['MOVE TO AIM', 'CLICK TO DROP'],
    touch: ['DRAG TO AIM', 'RELEASE TO DROP'],
    keyboard: '← → AND SPACE',
  },
  status: {
    found: 'CAMERA ON · HAND FOUND',
    searching: 'CAMERA ON · SHOW ME YOUR FINGER',
    off: 'CAMERA OFF · USING MOUSE',
  },
  cameraBg: (on: boolean) => `CAMERA BG: ${on ? 'ON' : 'OFF'}`,
} as const;
