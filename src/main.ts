// Game page boot: loader -> hero. (Game, swallow, wall, posters come in later phases.)
import './styles/tokens.css';
import './styles/base.css';
import './styles/screens.css';
import { initBananaCursor } from './fx/cursor.ts';
import { runLoader } from './screens/loader.ts';
import { showHero } from './screens/hero.ts';

initBananaCursor();
runLoader().then(showHero);
