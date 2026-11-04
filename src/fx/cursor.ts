// Chilli cursor: follows the mouse, tilts with movement, squashes on click.
// Mouse devices only; the normal cursor returns if anything fails.
import { gsap } from 'gsap';

export function initBananaCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'chilli';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<img src="/img/chilli.svg" alt="" width="45" height="56" draggable="false">';
  el.style.transformOrigin = '1.9px 2.1px'; // the chilli's tip is the click point
  document.body.appendChild(el);
  document.documentElement.classList.add('chilli-on');
  const x = gsap.quickTo(el, 'x', { duration: 0.1 });
  const y = gsap.quickTo(el, 'y', { duration: 0.1 });
  const rot = gsap.quickTo(el, 'rotation', { duration: 0.25 });
  let lastX = 0;
  window.addEventListener('mousemove', (e) => {
    el.style.opacity = '1';
    x(e.clientX - 1.9); y(e.clientY - 2.1);
    rot(gsap.utils.clamp(-25, 25, (e.clientX - lastX) * 1.2));
    lastX = e.clientX;
  });
  // no chilli inside the TV screen: it would sit on top of the tiles
  document.addEventListener('mouseover', (e) => { el.style.visibility = (e.target as HTMLElement).closest?.('.tvscreen') ? 'hidden' : 'visible'; });
  document.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
  window.addEventListener('mousedown', () => gsap.to(el, { scale: 0.8, duration: 0.08 }));
  window.addEventListener('mouseup', () => gsap.to(el, { scale: 1, duration: 0.15 }));
}
