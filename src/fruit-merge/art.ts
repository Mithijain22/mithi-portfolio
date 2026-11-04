// Fruit art, drawn entirely with canvas paths. Icons are authored in units of the disc radius (r = 1).
import { FRUITS, DISC_OUTLINE_FRACTION, DISC_SHADOW_OFFSET, MAX_DPR, FRUIT_ART, FRUIT_ART_FIT } from './config';
import { COLORS } from './tokens';
import fruit1Url from './assets/fruits/fruit1.webp';
import fruit2Url from './assets/fruits/fruit2.webp';
import fruit3Url from './assets/fruits/fruit3.webp';
import fruit4Url from './assets/fruits/fruit4.webp';
import fruit5Url from './assets/fruits/fruit5.webp';

const TAU = Math.PI * 2;
type G = CanvasRenderingContext2D;

function fillStroke(g: G, fill: string, ol: number): void {
  g.fillStyle = fill;
  g.fill();
  g.lineWidth = ol;
  g.strokeStyle = COLORS.black;
  g.lineJoin = 'round';
  g.stroke();
}

function highlight(g: G, draw: () => void): void {
  g.beginPath();
  draw();
  g.strokeStyle = COLORS.cream;
  g.lineWidth = 0.07;
  g.lineCap = 'round';
  g.stroke();
}

function leaf(g: G, x: number, y: number, rot: number, len: number, ol: number): void {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.5, -len * 0.45, 0, -len);
  g.quadraticCurveTo(-len * 0.5, -len * 0.45, 0, 0);
  g.closePath();
  fillStroke(g, COLORS.green, ol);
  g.restore();
}

function lemon(g: G, ol: number): void {
  g.save();
  g.rotate((25 * Math.PI) / 180);
  // two small tips
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.ellipse(sx * 0.66, 0, 0.09, 0.06, 0, 0, TAU);
    fillStroke(g, COLORS.yellow, ol);
  }
  g.beginPath();
  g.moveTo(-0.62, 0);
  g.bezierCurveTo(-0.45, -0.52, 0.45, -0.52, 0.62, 0);
  g.bezierCurveTo(0.45, 0.52, -0.45, 0.52, -0.62, 0);
  g.closePath();
  fillStroke(g, COLORS.yellow, ol);
  highlight(g, () => {
    g.moveTo(-0.32, -0.16);
    g.quadraticCurveTo(-0.12, -0.3, 0.12, -0.28);
  });
  g.restore();
}

function blueberry(g: G, ol: number): void {
  g.beginPath();
  g.arc(0, 0.06, 0.56, 0, TAU);
  fillStroke(g, COLORS.blue, ol);
  g.beginPath(); // star-shaped crown
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? 0.3 : 0.14;
    const aa = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = Math.cos(aa) * rr;
    const py = -0.5 + Math.sin(aa) * rr;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  fillStroke(g, COLORS.yellow, ol);
  highlight(g, () => {
    g.moveTo(-0.38, -0.05);
    g.quadraticCurveTo(-0.34, 0.1, -0.24, 0.2);
  });
}

function orange(g: G, ol: number): void {
  const cy = 0.04;
  g.beginPath();
  g.arc(0, cy, 0.58, 0, TAU);
  fillStroke(g, COLORS.orange, ol);
  // 5 faint segment lines
  g.strokeStyle = 'rgba(10,10,10,0.28)';
  g.lineWidth = 0.035;
  g.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * TAU) / 5 + 0.3;
    g.beginPath();
    g.moveTo(0, cy);
    g.lineTo(Math.cos(a) * 0.42, cy + Math.sin(a) * 0.42);
    g.stroke();
  }
  highlight(g, () => g.arc(0, cy, 0.42, (200 * Math.PI) / 180, (250 * Math.PI) / 180));
  // stem + leaf
  g.beginPath();
  g.moveTo(0, cy - 0.56);
  g.lineTo(-0.02, cy - 0.7);
  g.strokeStyle = COLORS.black;
  g.lineWidth = 0.15;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = COLORS.brown;
  g.lineWidth = 0.08;
  g.stroke();
  leaf(g, 0.02, cy - 0.58, (65 * Math.PI) / 180, 0.34, ol);
}

function apple(g: G, ol: number): void {
  // stem first so the body overlaps its base
  g.beginPath();
  g.moveTo(0, -0.34);
  g.quadraticCurveTo(0.02, -0.5, 0.07, -0.64);
  g.strokeStyle = COLORS.black;
  g.lineWidth = 0.16;
  g.lineCap = 'round';
  g.stroke();
  g.strokeStyle = COLORS.brown;
  g.lineWidth = 0.09;
  g.stroke();
  g.beginPath();
  g.moveTo(0, -0.38);
  g.bezierCurveTo(0.15, -0.55, 0.62, -0.5, 0.6, 0.05);
  g.bezierCurveTo(0.58, 0.45, 0.25, 0.62, 0, 0.5);
  g.bezierCurveTo(-0.25, 0.62, -0.58, 0.45, -0.6, 0.05);
  g.bezierCurveTo(-0.62, -0.5, -0.15, -0.55, 0, -0.38);
  g.closePath();
  fillStroke(g, COLORS.red, ol);
  highlight(g, () => {
    g.moveTo(-0.42, -0.2);
    g.quadraticCurveTo(-0.46, 0.0, -0.38, 0.2);
  });
  leaf(g, 0.08, -0.5, (62 * Math.PI) / 180, 0.34, ol);
}

function watermelon(g: G, ol: number): void {
  const cy = -0.33;
  g.save();
  g.rotate((-12 * Math.PI) / 180);
  const half = (r: number): void => {
    g.beginPath();
    g.arc(0, cy, r, 0, Math.PI, false); // bottom half
    g.closePath();
  };
  half(0.68);
  fillStroke(g, COLORS.green, ol); // rind
  half(0.57);
  g.fillStyle = COLORS.cream; // pale inner rind
  g.fill();
  half(0.5);
  g.fillStyle = COLORS.red; // flesh
  g.fill();
  // seeds
  g.fillStyle = COLORS.black;
  for (const [x, y, a] of [[-0.3, -0.2, 0.5], [0, -0.12, 0], [0.3, -0.2, -0.5], [-0.15, 0.04, 0.3], [0.15, 0.04, -0.3]]) {
    g.beginPath();
    g.ellipse(x, y, 0.035, 0.065, a, 0, TAU);
    g.fill();
  }
  highlight(g, () => {
    g.moveTo(-0.42, -0.2);
    g.quadraticCurveTo(-0.38, 0.0, -0.28, 0.1);
  });
  // re-stroke the outline over the flesh edge so the slice stays bold
  half(0.68);
  g.lineWidth = ol;
  g.strokeStyle = COLORS.black;
  g.stroke();
  g.restore();
}

const ICONS: readonly ((g: G, ol: number) => void)[] = [lemon, blueberry, orange, apple, watermelon];

/** Backing-disc colors for the vector fallback art (used only if the fruit images fail to load). */
const FALLBACK_DISC = [COLORS.pink, COLORS.teal, COLORS.blue, COLORS.yellow, COLORS.magenta] as const;

const SS = MAX_DPR; // sprite supersampling
const sprites = new Map<number, HTMLCanvasElement>();

/** Disc + outline + icon, no shadow (so it can rotate with the body while the shadow stays put). Cached. */
function getSprite(tier: number): HTMLCanvasElement {
  let c = sprites.get(tier);
  if (c) return c;
  const def = FRUITS[tier - 1];
  const r = def.radius;
  const size = Math.ceil((2 * r + 4) * SS);
  c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.translate(size / 2, size / 2);
  g.scale(SS, SS);
  g.fillStyle = COLORS.black;
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fill();
  g.fillStyle = FALLBACK_DISC[tier - 1];
  g.beginPath();
  g.arc(0, 0, r * (1 - DISC_OUTLINE_FRACTION), 0, TAU);
  g.fill();
  g.save();
  g.scale(r, r);
  ICONS[tier - 1](g, Math.max(0.06, 1.6 / r)); // outline never thinner than ~1.6 px
  g.restore();
  sprites.set(tier, c);
  return c;
}

// ---------------------------------------------------------------------------
// Image art (the user's own fruit images). Falls back to the vector art above if they fail to load.
// ---------------------------------------------------------------------------
interface ImageSprite {
  color: HTMLCanvasElement;
  shadow: HTMLCanvasElement;
  /** Size in logical units and the offset of the body center inside the sprite. */
  w: number;
  h: number;
  cx: number;
  cy: number;
}
const imageSprites = new Map<number, ImageSprite>();
const FRUIT_URLS = [fruit1Url, fruit2Url, fruit3Url, fruit4Url, fruit5Url];

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error(`fruit image failed: ${url}`));
    im.src = url;
  });
}

function buildImageSprite(tier: number, im: HTMLImageElement): ImageSprite {
  const art = FRUIT_ART[tier - 1];
  const r = FRUITS[tier - 1].radius;
  const s = (r / art.bodyR) * FRUIT_ART_FIT; // body circle of the picture -> physics circle
  const w = art.w * s;
  const h = art.h * s;
  const make = (): [HTMLCanvasElement, CanvasRenderingContext2D] => {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * SS);
    c.height = Math.ceil(h * SS);
    const g = c.getContext('2d')!;
    g.imageSmoothingQuality = 'high';
    return [c, g];
  };
  const [color, cg] = make();
  cg.drawImage(im, 0, 0, color.width, color.height);
  const [shadow, sg] = make();
  sg.drawImage(im, 0, 0, shadow.width, shadow.height);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = COLORS.black; // hard black silhouette for the offset shadow
  sg.fillRect(0, 0, shadow.width, shadow.height);
  return { color, shadow, w, h, cx: art.cx * s, cy: art.cy * s };
}

/** Resolves when the fruit images are decoded and cached (or have failed; the vector art is used then). */
export const fruitArtReady: Promise<void> = Promise.all(FRUIT_URLS.map(loadImage))
  .then((ims) => {
    ims.forEach((im, i) => imageSprites.set(i + 1, buildImageSprite(i + 1, im)));
  })
  .catch(() => {
    imageSprites.clear();
  });

export interface DrawFruitOptions {
  angle?: number;
  scale?: number;
  squashX?: number;
  squashY?: number;
  shadow?: boolean;
}

/** Draw a fruit with its body centered at (x, y) in the current ctx units. */
export function drawFruit(ctx: G, tier: number, x: number, y: number, o: DrawFruitOptions = {}): void {
  const r = FRUITS[tier - 1].radius;
  const s = o.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (o.squashX ?? 1), s * (o.squashY ?? 1));
  const img = imageSprites.get(tier);
  if (img) {
    if (o.shadow !== false) {
      ctx.save();
      ctx.translate(DISC_SHADOW_OFFSET, DISC_SHADOW_OFFSET); // shadow offset stays fixed while the fruit turns
      ctx.rotate(o.angle ?? 0);
      ctx.drawImage(img.shadow, -img.cx, -img.cy, img.w, img.h);
      ctx.restore();
    }
    ctx.rotate(o.angle ?? 0);
    ctx.drawImage(img.color, -img.cx, -img.cy, img.w, img.h);
  } else {
    if (o.shadow !== false) {
      ctx.fillStyle = COLORS.black;
      ctx.beginPath();
      ctx.arc(DISC_SHADOW_OFFSET, DISC_SHADOW_OFFSET, r, 0, TAU);
      ctx.fill();
    }
    ctx.rotate(o.angle ?? 0);
    const sprite = getSprite(tier);
    const w = sprite.width / SS;
    ctx.drawImage(sprite, -w / 2, -w / 2, w, w);
  }
  ctx.restore();
}
