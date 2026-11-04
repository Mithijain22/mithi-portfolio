// DOM HUD: all text, positioned in logical 1600x800 coordinates inside a scaled layer.
import { JUICE, LAYOUT, LOGICAL, TEXT } from './config';

export interface Hud {
  el: HTMLDivElement;
  /** Position/scale the layer so logical coordinates line up with the canvas. */
  layout(left: number, top: number, scale: number): void;
  setHint(text: string): void;
  /** Locked slots show "?", unlocked slots show nothing (the check mark is drawn on the canvas). */
  setSlot(index: number, unlocked: boolean): void;
  /** Screen-reader announcement (visually hidden aria-live region). */
  announce(text: string): void;
  /** Big message over the container (overflow). Pass null to hide. */
  showToast(text: string | null): void;
  showCompletion(onPlayAgain: () => void): void;
  hideCompletion(): void;
  /** Camera status chip text (null hides it). */
  setChip(text: string | null): void;
  /** "CAMERA BG: ON/OFF" toggle button (hidden unless the camera is on). */
  setBgToggle(visible: boolean, on: boolean, onClick?: () => void): void;
  /** Legend lines for the active input method. */
  setLegend(kind: 'camera' | 'mouse' | 'touch'): void;
  showCameraCard(handlers: { onTurnOn: () => void; onUseMouse: () => void }): void;
  setCameraCardLoading(loading: boolean): void;
  hideCameraCard(): void;
  destroy(): void;
}

function put(parent: HTMLElement, cls: string, text: string, x: number, y: number, w?: number, h?: number): HTMLDivElement {
  const d = document.createElement('div');
  d.className = `fm-t ${cls}`;
  d.textContent = text;
  d.style.left = `${x}px`;
  d.style.top = `${y}px`;
  if (w !== undefined) d.style.width = `${w}px`;
  if (h !== undefined) d.style.height = `${h}px`;
  parent.appendChild(d);
  return d;
}

export function createHud(root: HTMLElement): Hud {
  const el = document.createElement('div');
  el.className = 'fm-hud';
  el.style.width = `${LOGICAL.w}px`;
  el.style.height = `${LOGICAL.h}px`;
  root.appendChild(el);
  const { ladder, slots, next: nb, hint: hp, chip: cp, toggle: tp, legend: lg } = LAYOUT;
  const { x0, x1, y0, y1 } = LAYOUT.interior;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  // Ladder
  const lt = put(el, 'fm-display fm-ladder-title', TEXT.ladderTitle, ladder.title.x, ladder.title.y);
  lt.style.fontSize = `${ladder.title.size}px`;
  [2, 3, 4].forEach((ci, k) => {
    const c = ladder.centers[ci];
    if (ladder.labelAnchor === 'below') {
      put(el, 'fm-mono fm-center fm-small', TEXT.slotLabels[k], c.x - 35, c.y + ladder.discR + 6, 70);
    } else {
      put(el, 'fm-mono fm-small', TEXT.slotLabels[k], c.x + ladder.discR + 8, c.y - 8, 80);
    }
  });

  // Project slots
  const slotGlyphs: HTMLDivElement[] = [];
  slots.pos.forEach((p, i) => {
    const glyph = put(el, 'fm-display fm-center fm-slot-glyph', '?', p.x, p.y, slots.size, slots.size);
    glyph.style.fontSize = `${slots.glyphSize}px`;
    slotGlyphs.push(glyph);
    put(el, 'fm-mono fm-center fm-small', TEXT.slotLabels[i], p.x, p.y + slots.size + 12, slots.size);
  });

  // NEXT
  const nt = put(el, `fm-display fm-next-title ${nb.title.align === 'center' ? 'fm-center' : ''}`, TEXT.nextTitle, nb.title.x, nb.title.y, nb.title.w);
  nt.style.fontSize = `${nb.title.size}px`;

  // Hint (aria-live)
  const hint = put(el, `fm-mono fm-hint ${hp.align === 'center' ? 'fm-center' : ''}`, TEXT.hints.drop1, hp.x, hp.y, hp.w);
  hint.style.fontSize = `${hp.size}px`;
  hint.setAttribute('aria-live', 'polite');
  hint.style.transition = `opacity ${JUICE.hintFadeMs}ms linear`;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  let hintTarget: string = TEXT.hints.drop1;
  let hintTimer: number | undefined;

  // Gesture legend
  const legend = document.createElement('div');
  legend.className = 'fm-legend';
  legend.style.left = `${lg.x}px`;
  legend.style.top = `${lg.y}px`;
  legend.style.width = `${lg.w}px`;
  legend.style.height = `${lg.h}px`;
  legend.style.fontSize = `${lg.size}px`;
  const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const legendLines = document.createElement('div');
  legendLines.className = 'fm-legend-lines';
  legend.appendChild(legendLines);
  const setLegend = (kind: 'camera' | 'mouse' | 'touch'): void => {
    const lines: string[] =
      kind === 'camera' ? [...TEXT.legend.camera] : kind === 'touch' ? [...TEXT.legend.touch] : [...TEXT.legend.mouse, TEXT.legend.keyboard];
    legendLines.textContent = '';
    for (const t of lines) {
      const l = document.createElement('div');
      l.className = 'fm-mono fm-legend-line';
      l.textContent = t;
      legendLines.appendChild(l);
    }
  };
  setLegend(coarse ? 'touch' : 'mouse');
  for (const pos of ['tl', 'tr', 'bl', 'br']) {
    const m = document.createElement('span');
    m.className = `fm-mono fm-plus fm-plus-${pos}`;
    m.textContent = '+';
    legend.appendChild(m);
  }
  el.appendChild(legend);

  // Camera status chip + background toggle (right panel)
  const chip = put(el, 'fm-mono fm-chip', '', cp.x, cp.y, cp.w);
  chip.style.display = 'none';
  chip.setAttribute('aria-live', 'polite');
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'fm-mono fm-toggle';
  toggle.style.left = `${tp.x}px`;
  toggle.style.top = `${tp.y}px`;
  toggle.style.display = 'none';
  el.appendChild(toggle);
  let toggleCb: (() => void) | null = null;
  toggle.addEventListener('click', () => toggleCb?.());

  // Overflow toast
  const toast = put(el, 'fm-display fm-center fm-toast', '', x0, cy - 40, x1 - x0);
  toast.style.display = 'none';
  toast.setAttribute('aria-live', 'polite');

  // Screen-reader announcements
  const sr = document.createElement('div');
  sr.className = 'fm-sr';
  sr.setAttribute('aria-live', 'polite');
  el.appendChild(sr);

  // Camera permission card
  const camCard = document.createElement('div');
  camCard.className = 'fm-card fm-camcard';
  camCard.style.display = 'none';
  camCard.style.left = `${cx - 260}px`;
  camCard.style.top = `${Math.max(10, cy - 190)}px`;
  camCard.setAttribute('role', 'dialog');
  camCard.setAttribute('aria-label', TEXT.cameraCard.title);
  const camTitle = document.createElement('div');
  camTitle.className = 'fm-display fm-card-title';
  camTitle.textContent = TEXT.cameraCard.title;
  const camBody = document.createElement('div');
  camBody.className = 'fm-card-body';
  camBody.textContent = TEXT.cameraCard.body;
  const camLoading = document.createElement('div');
  camLoading.className = 'fm-mono fm-card-line';
  camLoading.textContent = TEXT.cameraCard.loading;
  camLoading.style.display = 'none';
  const camBtns = document.createElement('div');
  camBtns.className = 'fm-btnrow';
  const camOn = document.createElement('button');
  camOn.type = 'button';
  camOn.className = 'fm-display fm-btn';
  camOn.textContent = TEXT.cameraCard.on;
  const camOff = document.createElement('button');
  camOff.type = 'button';
  camOff.className = 'fm-display fm-btn fm-btn-secondary';
  camOff.textContent = TEXT.cameraCard.off;
  camBtns.append(camOn, camOff);
  camCard.append(camTitle, camBody, camLoading, camBtns);
  el.appendChild(camCard);
  let camHandlers: { onTurnOn: () => void; onUseMouse: () => void } | null = null;
  camOn.addEventListener('click', () => camHandlers?.onTurnOn());
  camOff.addEventListener('click', () => camHandlers?.onUseMouse());

  // Completion card
  const card = document.createElement('div');
  card.className = 'fm-card';
  card.style.display = 'none';
  card.style.left = `${cx - 260}px`;
  card.style.top = `${Math.max(10, cy - 150)}px`;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', TEXT.completion.title);
  const title = document.createElement('div');
  title.className = 'fm-display fm-card-title';
  title.textContent = TEXT.completion.title;
  const line = document.createElement('div');
  line.className = 'fm-mono fm-card-line';
  line.textContent = TEXT.completion.line;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fm-display fm-btn';
  btn.textContent = TEXT.completion.button;
  card.append(title, line, btn);
  el.appendChild(card);
  let onAgain: (() => void) | null = null;
  btn.addEventListener('click', () => onAgain?.());

  return {
    el,
    layout(left, top, scale) {
      el.style.transform = `translate(${left}px, ${top}px) scale(${scale})`;
    },
    setHint(text) {
      if (text === hintTarget) return;
      hintTarget = text;
      if (hintTimer !== undefined) clearTimeout(hintTimer);
      if (reducedMotion || text === '' || hint.textContent === '') {
        hint.style.opacity = '1';
        hint.textContent = text;
        hintTimer = undefined;
        return;
      }
      hint.style.opacity = '0'; // short fade out, swap the text, fade back in
      hintTimer = window.setTimeout(() => {
        hint.textContent = hintTarget;
        hint.style.opacity = '1';
        hintTimer = undefined;
      }, JUICE.hintFadeMs);
    },
    setSlot(index, unlocked) {
      slotGlyphs[index].textContent = unlocked ? '' : '?';
    },
    announce(text) {
      sr.textContent = text;
    },
    showToast(text) {
      toast.textContent = text ?? '';
      toast.style.display = text ? 'block' : 'none';
    },
    showCompletion(cb) {
      onAgain = cb;
      card.style.display = 'flex';
      sr.textContent = `${TEXT.completion.title}. ${TEXT.completion.line}`;
      btn.focus({ preventScroll: true });
    },
    hideCompletion() {
      card.style.display = 'none';
      onAgain = null;
    },
    setChip(text) {
      chip.textContent = text ?? '';
      chip.style.display = text ? 'block' : 'none';
    },
    setBgToggle(visible, on, onClick) {
      toggle.style.display = visible ? 'block' : 'none';
      toggle.textContent = TEXT.cameraBg(on);
      toggle.setAttribute('aria-pressed', String(on));
      if (onClick) toggleCb = onClick;
    },
    setLegend,
    showCameraCard(handlers) {
      camHandlers = handlers;
      camCard.style.display = 'flex';
      camBtns.style.display = 'flex';
      camBody.style.display = 'block';
      camLoading.style.display = 'none';
      camOn.focus({ preventScroll: true });
    },
    setCameraCardLoading(loading) {
      camBtns.style.display = loading ? 'none' : 'flex';
      camLoading.style.display = loading ? 'block' : 'none';
      sr.textContent = loading ? TEXT.cameraCard.loading : '';
    },
    hideCameraCard() {
      camCard.style.display = 'none';
      camHandlers = null;
    },
    destroy() {
      if (hintTimer !== undefined) clearTimeout(hintTimer);
      el.remove();
    },
  };
}
