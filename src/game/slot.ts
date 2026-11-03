import { showPoster } from '../screens/poster.ts';

// Stand-in for the fruit-merge game. It only offers a test button that pretends a project unlocked,
// so the whole page flow (preview card, scroll to work, play again) can be tried now.
// The real game replaces this file and calls the same things: preview card per unlock, then completion.
export function initGame(screen: HTMLElement) {
  let n = 0;
  const draw = () => {
    document.getElementById('tv-count')!.textContent = `0${n} / 03`;
    screen.innerHTML = n < 3
      ? `<div class="tmsg"><h2>GAME GOES HERE</h2><p>TEST ONLY: PRETEND A PROJECT UNLOCKED.</p><div><button type="button" data-a="unlock">UNLOCK PROJECT 0${n + 1}</button></div></div>`
      : `<div class="tmsg"><h2>ALL THREE UNLOCKED</h2><p>SCROLL FOR THE WORK.</p><div><button type="button" data-a="work">SEE THE WORK</button><button type="button" data-a="again">PLAY AGAIN</button></div></div>`;
    screen.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.a;
      if (a === 'unlock') showPoster(n, n === 2, () => { n++; draw(); });
      else if (a === 'work') document.getElementById('work')?.scrollIntoView({ behavior: 'smooth' });
      else { n = 0; draw(); }
    }));
  };
  draw();
}
