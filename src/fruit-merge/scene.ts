// Static scene drawing (canvas). Text lives in the DOM HUD (hud.ts). All positions come from LAYOUT.
import { LOGICAL, LAYOUT, FRUITS } from './config';
import { COLORS } from './tokens';
import { drawFruit } from './art';

export interface SceneState {
  nextTier: number;
  unlocked: [boolean, boolean, boolean];
  /** Per-slot render scale (slot pop). */
  slotScale: [number, number, number];
  /** Danger line opacity (blinks when a fruit is above it). */
  dangerOpacity: number;
  /** Container shake offset (logical px). */
  shakeX: number;
  shakeY: number;
  /** Ladder ring pulse per tier (1 = just created, fades to 0). */
  ladderPulse: number[];
  /** Optional camera halftone layer drawn behind everything. */
  background: HTMLCanvasElement | null;
}

const SHADOW = 5; // hard offset shadow, px

function containerPath(): Path2D {
  const { x0, x1, y0, y1 } = LAYOUT.interior;
  const wt = LAYOUT.wallThickness;
  const fb = y1 + LAYOUT.floorThickness;
  const R = LAYOUT.outerCornerRadius;
  const p = new Path2D();
  p.moveTo(x0 - wt, y0);
  p.lineTo(x0 - wt, fb - R);
  p.arcTo(x0 - wt, fb, x0 - wt + R, fb, R);
  p.lineTo(x1 + wt - R, fb);
  p.arcTo(x1 + wt, fb, x1 + wt, fb - R, R);
  p.lineTo(x1 + wt, y0);
  p.lineTo(x1, y0);
  p.lineTo(x1, y1);
  p.lineTo(x0, y1);
  p.lineTo(x0, y0);
  p.closePath();
  return p;
}

function drawContainer(ctx: CanvasRenderingContext2D): void {
  const { x0, x1, y0, y1 } = LAYOUT.interior;
  // interior panel: flat black at 55%
  ctx.fillStyle = 'rgba(10,10,10,0.55)';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  const p = containerPath();
  // hard offset shadow
  ctx.save();
  ctx.translate(SHADOW, SHADOW);
  ctx.fillStyle = COLORS.black;
  ctx.fill(p);
  ctx.restore();
  ctx.fillStyle = COLORS.cream;
  ctx.fill(p);
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.black;
  ctx.stroke(p);
}

function drawDangerLine(ctx: CanvasRenderingContext2D, opacity = 1): void {
  const { x0, x1 } = LAYOUT.interior;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = COLORS.orangeRed;
  ctx.lineWidth = 4;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(x0, LAYOUT.dangerLineY);
  ctx.lineTo(x1, LAYOUT.dangerLineY);
  ctx.stroke();
  ctx.restore();
}

function drawLadder(ctx: CanvasRenderingContext2D, pulse: number[]): void {
  const { centers, discR } = LAYOUT.ladder;
  centers.forEach((c, i) => {
    drawFruit(ctx, i + 1, c.x, c.y, { scale: discR / FRUITS[i].radius });
    const p = pulse[i] ?? 0;
    if (p > 0) {
      ctx.save();
      ctx.globalAlpha = p;
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, discR + 5 + (1 - p) * 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (i < centers.length - 1) {
      // small arrow pointing along the ladder, in the gap between two discs
      const n = centers[i + 1];
      const dx = n.x - c.x;
      const dy = n.y - c.y;
      const len = Math.hypot(dx, dy);
      const ux = dx / len;
      const uy = dy / len;
      const pad = discR + 5;
      const ax = c.x + ux * pad;
      const ay = c.y + uy * pad;
      const bx = n.x - ux * pad;
      const by = n.y - uy * pad;
      ctx.strokeStyle = COLORS.cream;
      ctx.fillStyle = COLORS.cream;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx - ux * 4, by - uy * 4);
      ctx.stroke();
      const hl = 8;
      const hw = 5;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - ux * hl - uy * hw, by - uy * hl + ux * hw);
      ctx.lineTo(bx - ux * hl + uy * hw, by - uy * hl - ux * hw);
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawSlots(ctx: CanvasRenderingContext2D, unlocked: boolean[], scales: number[]): void {
  const { size: s, pos } = LAYOUT.slots;
  pos.forEach((p, i) => {
    const { x, y } = p;
    const sc = scales[i] ?? 1;
    ctx.save();
    ctx.translate(x + s / 2, y + s / 2);
    ctx.scale(sc, sc);
    ctx.translate(-(x + s / 2), -(y + s / 2));
    ctx.fillStyle = COLORS.black;
    ctx.fillRect(x + SHADOW, y + SHADOW, s, s);
    if (unlocked[i]) {
      ctx.fillStyle = FRUITS[i + 2].disc; // milestone fruit color
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = COLORS.black;
      ctx.lineWidth = 6;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(x, y, s, s);
      // check mark
      ctx.strokeStyle = COLORS.black;
      ctx.lineWidth = Math.max(7, s * 0.115);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x + s * 0.24, y + s * 0.53);
      ctx.lineTo(x + s * 0.43, y + s * 0.72);
      ctx.lineTo(x + s * 0.77, y + s * 0.3);
      ctx.stroke();
    } else {
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'miter';
      ctx.strokeRect(x, y, s, s);
    }
    ctx.restore();
  });
}

function drawNextBox(ctx: CanvasRenderingContext2D, nextTier: number): void {
  const b = LAYOUT.next;
  const rad = Math.min(20, b.h / 4);
  ctx.save();
  ctx.fillStyle = COLORS.black;
  ctx.beginPath();
  ctx.roundRect(b.x + SHADOW, b.y + SHADOW, b.w, b.h, rad);
  ctx.fill();
  ctx.fillStyle = COLORS.cream;
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, rad);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = COLORS.black;
  ctx.stroke();
  ctx.restore();
  const r = FRUITS[nextTier - 1].radius;
  const scale = Math.min(r, b.disc.maxR) / r; // full size, shrunk only if larger than the box allows
  drawFruit(ctx, nextTier, b.disc.x, b.disc.y, { scale });
}

export function drawScene(ctx: CanvasRenderingContext2D, state: SceneState): void {
  ctx.clearRect(0, 0, LOGICAL.w, LOGICAL.h);
  if (state.background) ctx.drawImage(state.background, 0, 0, LOGICAL.w, LOGICAL.h);
  ctx.save();
  ctx.translate(state.shakeX, state.shakeY);
  drawContainer(ctx);
  drawDangerLine(ctx, state.dangerOpacity);
  ctx.restore();
  drawLadder(ctx, state.ladderPulse);
  drawSlots(ctx, state.unlocked, state.slotScale);
  drawNextBox(ctx, state.nextTier);
}
