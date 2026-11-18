// Home page: loader, then one scrolling page: hero, the TV game, work, footer.
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';
import { initBananaCursor } from './fx/cursor.ts';
import { runLoader } from './screens/loader.ts';
import { runReveal, preloadReveal } from './screens/reveal.ts';
import { preloadImages } from './fx/preload.ts';
import { HERO_IMAGES } from './content.ts';
import { showHero } from './screens/hero.ts';
import { mountGame } from './game/tv.ts';
import { mountSections } from './screens/sections.ts';

initBananaCursor();
// skip the loader when arriving at a section link (e.g. BACK TO THE GAME) or after the intro was already seen
let seen = false;
try { seen = sessionStorage.getItem('seen') === '1'; } catch { /* ignore */ }
const skipIntro = !!location.hash || seen;
// load the reveal pictures, the hero pictures and the fonts while the loader runs; the loader waits for them
const ready = skipIntro ? Promise.resolve() : Promise.all([preloadReveal(), preloadImages(HERO_IMAGES), document.fonts ? document.fonts.ready : Promise.resolve()]);
const intro = skipIntro ? Promise.resolve() : (document.body.classList.add('locked'), runLoader(ready).then(runReveal));
intro.then(() => {
  try { sessionStorage.setItem('seen', '1'); } catch { /* ignore */ }
  document.body.classList.remove('locked');
  showHero(); mountGame(); mountSections();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
