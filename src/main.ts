// Home page: loader, then one scrolling page: hero, the TV game, work, footer.
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';
import { initBananaCursor } from './fx/cursor.ts';
import { runLoader } from './screens/loader.ts';
import { showHero } from './screens/hero.ts';
import { mountGame } from './game/tv.ts';
import { mountSections } from './screens/sections.ts';

initBananaCursor();
document.body.classList.add('locked');
runLoader().then(() => {
  document.body.classList.remove('locked');
  showHero(); mountGame(); mountSections();
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
});
