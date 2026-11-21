import { createGame, type GameHandle } from '../fruit-merge/game.ts';
import { showPoster } from '../screens/poster.ts';

// Mounts the fruit-merge game inside the TV screen and connects it to the page:
// each unlock opens that project's preview card, and the game waits until it is closed.
export function initGame(screen: HTMLElement) {
  const root = document.createElement('div');
  root.style.cssText = 'position:absolute;inset:0';
  screen.appendChild(root);

  const setCount = (n: number) => {
    const el = document.getElementById('tv-count');
    if (el) el.textContent = `0${n} / 03`;
  };
  setCount(0);

  const game: GameHandle = createGame(root, {
    onUnlock: (i) => new Promise<void>((resolve) => showPoster(i, i === 2, () => {
      resolve();
      if (i === 2) document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
    })),
    onComplete: () => { try { sessionStorage.setItem('played', '1'); } catch { /* ignore */ } },
    onProgress: ({ unlocked }) => setCount(unlocked),
  }, { camera: 'ask' });

  // start card: the game only runs after the player presses START
  let started = false, visible = false;
  const card = document.createElement('div');
  card.className = 'tmsg';
  card.innerHTML = `<h2>MERGE MY IDEAS <small>(FRUITS)</small> TO SHIP PRODUCTS</h2>
    <ol class="tsteps">
      <li><b>1</b><span>AIM</span><i>Point a finger at the camera, or move your mouse.</i></li>
      <li><b>2</b><span>DROP</span><i>Pinch your fingers together, or click.</i></li>
      <li><b>3</b><span>MERGE</span><i>Two matching fruits make a bigger one. Make an orange, an apple and a watermelon to unlock my three projects.</i></li>
    </ol>
    <div><button type="button">START</button></div>`;
  card.querySelector('button')!.addEventListener('click', () => {
    started = true; card.remove(); game.start();
    if (!visible) game.pause();
    root.focus({ preventScroll: true });
  });
  screen.appendChild(card);

  // pause everything (physics, drawing, camera) while the TV is scrolled out of view
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (started) (visible ? game.resume() : game.pause());
  }, { threshold: 0.2 }).observe(screen);
}
