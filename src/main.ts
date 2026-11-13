// Home page: loader, then one scrolling page: hero, the TV game, work, footer.
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';
import { initBananaCursor } from './fx/cursor.ts';
import { runLoader } from './screens/loader.ts';
import { runReveal, preloadReveal } from './screens/reveal.ts';
import { showHero } from './screens/hero.ts';
import { mountGame } from './game/tv.ts';
import { mountSections } from './screens/sections.ts';

initBananaCursor();
// skip the loader when arriving at a section link (e.g. BACK TO THE GAME) or after the intro was already seen
let seen = false;
try { seen = sessionStorage.getItem('seen') === '1'; } catch { /* ignore */ }
const skipIntro = !!location.hash || seen;
if (!skipIntro) preloadReveal(); // load the reveal pictures while the loader runs
const intro = skipIntro ? Promise.resolve() : (document.body.classList.add('locked'), runLoader().then(runReveal));
intro.then(() => {
  try { sessionStorage.setItem('seen', '1'); } catch { /* ignore */ }
  document.body.classList.remove('locked');
  showHero(); mountGame(); mountSections();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
