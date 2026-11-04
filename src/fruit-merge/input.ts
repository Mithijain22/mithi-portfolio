// Mouse, keyboard and touch. Only the x position matters; last input wins (all write the same aim value).
import { LOGICAL, INPUT } from './config';

export interface InputTargets {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  getAim(): number;
  setAim(x: number): void;
  drop(): void;
  isActive(): boolean;
}

export interface InputHandle {
  /** Per-frame update (keyboard movement). */
  update(dtMs: number): void;
  destroy(): void;
}

export function attachInput(t: InputTargets): InputHandle {
  const { root, canvas } = t;
  let pointerOver = false;
  let touching = false;
  let left = false;
  let right = false;
  let heldMs = 0;

  const toLogicalX = (clientX: number): number => {
    const r = canvas.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * LOGICAL.w;
  };

  const onEnter = (e: PointerEvent): void => { if (e.pointerType !== 'touch') pointerOver = true; };
  const onLeave = (e: PointerEvent): void => { if (e.pointerType !== 'touch') pointerOver = false; };

  const onDown = (e: PointerEvent): void => {
    if (!t.isActive()) return;
    if (e.pointerType === 'touch') {
      touching = true;
      t.setAim(toLogicalX(e.clientX));
      try { root.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    } else if (e.button === 0) {
      t.setAim(toLogicalX(e.clientX));
      t.drop();
    }
  };
  const onMove = (e: PointerEvent): void => {
    if (!t.isActive()) return;
    if (e.pointerType === 'touch') {
      if (touching) t.setAim(toLogicalX(e.clientX)); // horizontal only; vertical movement ignored
    } else {
      t.setAim(toLogicalX(e.clientX));
    }
  };
  const onUp = (e: PointerEvent): void => {
    if (e.pointerType !== 'touch' || !touching) return;
    touching = false;
    if (!t.isActive()) return;
    t.setAim(toLogicalX(e.clientX));
    t.drop(); // release drops; a quick tap drops at the tapped x
  };
  const onCancel = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') touching = false; // the browser took the gesture (page scroll): no drop
  };

  const keyActive = (e: KeyboardEvent): boolean => {
    if (!t.isActive()) return false;
    if (!(root.contains(document.activeElement) || pointerOver)) return false;
    const el = e.target as HTMLElement | null;
    return !(el && el.closest && el.closest('button, a, input, textarea, select'));
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    const k = e.key;
    const isLeft = k === 'ArrowLeft' || k === 'a' || k === 'A';
    const isRight = k === 'ArrowRight' || k === 'd' || k === 'D';
    const isDrop = k === ' ' || k === 'Spacebar' || k === 'Enter';
    if (!isLeft && !isRight && !isDrop) return;
    if (!keyActive(e)) return;
    e.preventDefault();
    if (isLeft) left = true;
    if (isRight) right = true;
    if (isDrop && !e.repeat) t.drop();
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') right = false;
  };
  const onBlur = (): void => { left = right = false; };

  root.addEventListener('pointerenter', onEnter);
  root.addEventListener('pointerleave', onLeave);
  root.addEventListener('pointerdown', onDown);
  root.addEventListener('pointermove', onMove);
  root.addEventListener('pointerup', onUp);
  root.addEventListener('pointercancel', onCancel);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  return {
    update(dtMs) {
      const dir = (right ? 1 : 0) - (left ? 1 : 0);
      if (dir === 0) { heldMs = 0; return; }
      heldMs += dtMs;
      const step = heldMs >= INPUT.keyAccelAfterMs ? INPUT.keyStepFastPx : INPUT.keyStepPx;
      t.setAim(t.getAim() + dir * step * (dtMs / (1000 / 60))); // "per frame" at 60 fps, frame-rate independent
    },
    destroy() {
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onCancel);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    },
  };
}
