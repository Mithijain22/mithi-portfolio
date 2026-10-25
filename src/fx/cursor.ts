// Banana cursor: follows the mouse, tilts with movement, squashes on click.
// Mouse devices only; the normal cursor returns if anything fails.
import { gsap } from 'gsap';

export function initBananaCursor() {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const el = document.createElement('div');
  el.className = 'banana';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<svg viewBox="0 0 64 64" width="44" height="44"><path d="M9 8C9 38 30 58 56 50C59 49 58 45 55 45C36 43 26 28 22 8Z" fill="#F5D90A" stroke="#0A0A0A" stroke-width="3" stroke-linejoin="round"/><path d="M9 8L8 2H17L22 8Z" fill="#6B4A1B" stroke="#0A0A0A" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="38" r="1.6" fill="#8A6A12"/><circle cx="42" cy="46" r="1.6" fill="#8A6A12"/></svg>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('banana-on');
  const x = gsap.quickTo(el, 'x', { duration: 0.1 });
  const y = gsap.quickTo(el, 'y', { duration: 0.1 });
  const rot = gsap.quickTo(el, 'rotation', { duration: 0.25 });
  let lastX = 0;
  window.addEventListener('mousemove', (e) => {
    el.style.opacity = '1';
    x(e.clientX - 9); y(e.clientY - 4);
    rot(gsap.utils.clamp(-25, 25, (e.clientX - lastX) * 1.2));
    lastX = e.clientX;
  });
  // no banana inside the TV screen: it would sit on top of the tiles
  document.addEventListener('mouseover', (e) => { el.style.visibility = (e.target as HTMLElement).closest?.('.tvscreen') ? 'hidden' : 'visible'; });
  document.addEventListener('mouseleave', () => { el.style.opacity = '0'; });
  window.addEventListener('mousedown', () => gsap.to(el, { scale: 0.8, duration: 0.08 }));
  window.addEventListener('mouseup', () => gsap.to(el, { scale: 1, duration: 0.15 }));
}
