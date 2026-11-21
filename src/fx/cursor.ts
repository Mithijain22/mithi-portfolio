// Chilli cursor: the tip is the click point and sits exactly on the real pointer (no lag).
// Mouse only. The normal cursor comes back if anything goes wrong or a touch/pen is used.
const TX = 1.9, TY = 2.1; // tip of the chilli inside its picture

export function initBananaCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.documentElement;
  const el = document.createElement('div');
  el.className = 'chilli';
  el.setAttribute('aria-hidden', 'true');
  const img = new Image();
  img.src = '/img/chilli.svg'; img.width = 45; img.height = 56; img.alt = ''; img.draggable = false;
  el.appendChild(img);
  document.body.appendChild(el);

  let on = false, pressed = false, tilt = 0, tiltTimer = 0;
  const showNative = () => { on = false; root.classList.remove('chilli-on'); el.style.opacity = '0'; };
  img.addEventListener('error', () => { showNative(); el.remove(); removeEventListener('pointermove', move); });

  const move = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') { showNative(); return; }   // touch or pen: use the normal cursor
    if (!on) { on = true; root.classList.add('chilli-on'); }
    const t = e.target as Element | null;
    const overTV = !!t?.closest?.('.tvscreen');                 // no chilli on top of the game
    el.style.opacity = overTV ? '0' : '1';
    el.style.transform = `translate3d(${e.clientX - TX}px, ${e.clientY - TY}px, 0)`;
    const hot = !!t?.closest?.('a, button, [role="button"]');
    tilt = Math.max(-25, Math.min(25, (e.movementX || 0) * 1.2));
    clearTimeout(tiltTimer); tiltTimer = window.setTimeout(() => { tilt = 0; paint(hot); }, 90);
    paint(hot);
  };
  const paint = (hot: boolean) => { img.style.transform = `rotate(${tilt}deg) scale(${pressed ? 0.8 : hot ? 1.15 : 1})`; };

  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerdown', () => { pressed = true; paint(false); });
  const release = () => { pressed = false; paint(false); };
  addEventListener('pointerup', release); addEventListener('pointercancel', release); addEventListener('blur', release);
  document.documentElement.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
}
