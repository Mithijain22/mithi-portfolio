// Shared script for the portfolio pages: nav, menu, link fade, hover preview,
// misregistration reveal. Every page still works with no JS.
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/site.css';
import { gsap } from 'gsap';
import { initBananaCursor } from '../fx/cursor.ts';
initBananaCursor();

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- nav: hide on scroll down, return on scroll up ---
const bar = document.getElementById('site-bar');
let lastY = window.scrollY;
window.addEventListener('scroll', () => {
  if (!bar) return;
  const y = window.scrollY;
  const menuOpen = document.getElementById('main-nav')?.classList.contains('open');
  bar.classList.toggle('hide', y > lastY && y > 80 && !menuOpen);
  lastY = y;
}, { passive: true });

// --- phone menu ---
const btn = document.querySelector<HTMLButtonElement>('.menu-btn');
const nav = document.getElementById('main-nav');
btn?.addEventListener('click', () => {
  const open = nav?.classList.toggle('open') ?? false;
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? 'CLOSE' : 'MENU';
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
    if (btn) btn.textContent = 'MENU';
    btn?.focus();
  }
});

// --- PLAY becomes PLAY AGAIN after a played run (convenience only) ---
try {
  if (sessionStorage.getItem('played') === '1') {
    const pl = document.getElementById('play-link');
    if (pl) pl.textContent = 'PLAY AGAIN';
  }
} catch { /* storage blocked: ignore */ }

// --- misregistration: ink layer starts off-register, snaps into place ---
const arts = document.querySelectorAll<HTMLElement>('.cs-section .misreg, .cs-image-wrap .misreg');
if (reduce) {
  arts.forEach((el) => el.style.setProperty('--off', '0px'));
} else {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      gsap.fromTo(en.target, { '--off': '6px' }, { '--off': '0px', duration: 0.7, ease: 'steps(5)' });
      io.unobserve(en.target);
    });
  }, { threshold: 0.25 });
  arts.forEach((el) => io.observe(el));
}
